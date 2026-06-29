const { loadEnvConfig } = require("@next/env");
const { createServer } = require("node:http");
const next = require("next");
const { Server: SocketIOServer } = require("socket.io");
const jwt = require("jsonwebtoken");
const Y = require("yjs");
const { PrismaClient } = require("@prisma/client");

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();
const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT || 3000);
const hostname = "0.0.0.0";
const SOCKET_PATH = "/api/socket";
const MAX_SYNC_EVENT_BYTES = 256 * 1024;
const jwtSecret = process.env.JWT_SECRET;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

if (!jwtSecret) {
  throw new Error("JWT_SECRET is required");
}

if (process.env.NODE_ENV === "production" && jwtSecret === "change-this-super-secret-jwt-key") {
  throw new Error("JWT_SECRET must be changed before running in production");
}

const allowedOrigin = appUrl ? new URL(appUrl).origin : null;

function parseCookieHeader(cookieHeader) {
  if (!cookieHeader) {
    return {};
  }

  return Object.fromEntries(
    cookieHeader.split(";").map((segment) => {
      const [key, ...rest] = segment.trim().split("=");
      return [key, decodeURIComponent(rest.join("="))];
    }),
  );
}

function getUserFromCookieHeader(cookieHeader) {
  try {
    const cookies = parseCookieHeader(cookieHeader);
    const token = cookies.docs_session;
    return token ? jwt.verify(token, jwtSecret) : null;
  } catch {
    return null;
  }
}

const app = next({ dev, hostname, port, webpack: true });
const handler = app.getRequestHandler();

void app.prepare().then(() => {
  const httpServer = createServer((req, res) => handler(req, res));
  const io = new SocketIOServer(httpServer, {
    path: SOCKET_PATH,
    cors: {
      origin: (origin, callback) => {
        if (!origin || !allowedOrigin || origin === allowedOrigin) {
          callback(null, true);
          return;
        }

        callback(new Error("Origin not allowed"));
      },
      credentials: true,
    },
  });

  io.use((socket, nextMiddleware) => {
    const user = getUserFromCookieHeader(socket.request.headers.cookie);

    if (!user) {
      nextMiddleware(new Error("Unauthorized"));
      return;
    }

    socket.data.user = user;
    nextMiddleware();
  });

  io.on("connection", (socket) => {
    socket.on("document:join", async ({ documentId }) => {
      const membership = await prisma.documentMember.findFirst({
        where: {
          documentId,
          userId: socket.data.user.id,
        },
      });

      if (!membership) {
        socket.emit("document:error", { message: "Unauthorized document access" });
        return;
      }

      socket.join(documentId);
      socket.emit("document:joined", { documentId, role: membership.role });
    });

    socket.on("document:update", async ({ documentId, clientUpdateId, update, plainText, html, revision }) => {
      const membership = await prisma.documentMember.findFirst({
        where: {
          documentId,
          userId: socket.data.user.id,
        },
      });

      if (!membership || membership.role === "VIEWER") {
        socket.emit("document:error", { message: "You cannot edit this document" });
        return;
      }

      if (Buffer.byteLength(update, "base64") > MAX_SYNC_EVENT_BYTES) {
        socket.emit("document:error", { message: "Update too large" });
        return;
      }

      const decoded = new Uint8Array(Buffer.from(update, "base64"));
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        select: { state: true, revision: true },
      });

      if (!document) {
        socket.emit("document:error", { message: "Document not found" });
        return;
      }

      const ydoc = new Y.Doc();
      ydoc.getXmlFragment("default");

      if (document.state && document.state.length) {
        Y.applyUpdate(ydoc, document.state);
      }

      Y.applyUpdate(ydoc, decoded);
      const mergedState = Y.encodeStateAsUpdate(ydoc);

      await prisma.$transaction(async (tx) => {
        await tx.document.update({
          where: {
            id: documentId,
          },
          data: {
            state: Buffer.from(mergedState),
            revision: Math.max(document.revision, revision),
            textContent: plainText,
            htmlContent: html,
            lastSyncedAt: new Date(),
          },
        });

        await tx.syncEvent.upsert({
          where: {
            documentId_clientUpdateId: {
              documentId,
              clientUpdateId,
            },
          },
          create: {
            documentId,
            createdById: socket.data.user.id,
            clientUpdateId,
            update: Buffer.from(decoded),
            textContent: plainText.slice(0, 2000),
          },
          update: {},
        });
      });

      socket.to(documentId).emit("document:remote-update", {
        documentId,
        clientUpdateId,
        update,
        revision,
        updatedAt: new Date().toISOString(),
      });
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
