import { DocumentRole, Prisma } from "@prisma/client";
import * as Y from "yjs";
import { prisma } from "@/lib/prisma";
import { MAX_SYNC_EVENT_BYTES } from "@/lib/constants";
import { canEdit, isOwner } from "@/lib/permissions";
import { createEmptyDocumentState, decodeUpdate, encodeUpdate, loadDocumentFromState } from "@/lib/yjs";

type SyncInput = {
  documentId: string;
  userId: string;
  updates: Array<{
    clientUpdateId: string;
    update: string;
    createdAt: string;
  }>;
  plainText: string;
  html: string;
  clientRevision: number;
};

export async function getDocumentMembership(documentId: string, userId: string) {
  return prisma.documentMember.findFirst({
    where: {
      documentId,
      userId,
    },
  });
}

export async function getDocumentForUser(documentId: string, userId: string) {
  return prisma.document.findFirst({
    where: {
      id: documentId,
      members: {
        some: {
          userId,
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      versions: {
        take: 10,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
}

export async function listUserDocuments(userId: string) {
  return prisma.document.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    include: {
      members: {
        where: {
          userId,
        },
      },
      _count: {
        select: {
          members: true,
          versions: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function createDocument(userId: string, title: string) {
  return prisma.document.create({
    data: {
      title,
      ownerId: userId,
      state: Buffer.from(createEmptyDocumentState()),
      members: {
        create: {
          userId,
          role: DocumentRole.OWNER,
        },
      },
    },
  });
}

export async function deleteDocument(documentId: string, userId: string) {
  const membership = await getDocumentMembership(documentId, userId);

  if (!membership) {
    throw new Error("NOT_FOUND");
  }

  if (!isOwner(membership.role)) {
    throw new Error("FORBIDDEN");
  }

  await prisma.document.delete({
    where: {
      id: documentId,
    },
  });
}

export async function applySyncUpdates(input: SyncInput) {
  const membership = await getDocumentMembership(input.documentId, input.userId);

  if (!membership) {
    throw new Error("NOT_FOUND");
  }

  if (!canEdit(membership.role)) {
    throw new Error("FORBIDDEN");
  }

  for (const item of input.updates) {
    const updateBytes = Buffer.byteLength(item.update, "base64");

    // We reject massive sync packets before decoding them so malformed payloads
    // cannot force the server to allocate unbounded memory during Yjs merge work.
    if (updateBytes > MAX_SYNC_EVENT_BYTES) {
      throw new Error("PAYLOAD_TOO_LARGE");
    }
  }

  const existingDocument = await prisma.document.findUnique({
    where: { id: input.documentId },
    select: {
      id: true,
      state: true,
      revision: true,
    },
  });

  if (!existingDocument) {
    throw new Error("NOT_FOUND");
  }

  const existingIds = await prisma.syncEvent.findMany({
    where: {
      documentId: input.documentId,
      clientUpdateId: {
        in: input.updates.map((entry) => entry.clientUpdateId),
      },
    },
    select: {
      clientUpdateId: true,
    },
  });

  const seenIds = new Set(existingIds.map((entry) => entry.clientUpdateId));
  const freshUpdates = input.updates.filter((entry) => !seenIds.has(entry.clientUpdateId));
  const decodedUpdates = freshUpdates.map((entry) => decodeUpdate(entry.update));
  const mergedState = decodedUpdates.length
    ? (() => {
        const doc = loadDocumentFromState(existingDocument.state);

        // Yjs CRDT updates are commutative and idempotent, so every client and the
        // server can apply the same updates in any order and converge on the same state.
        for (const update of decodedUpdates) {
          Y.applyUpdate(doc, update);
        }

        return Y.encodeStateAsUpdate(doc);
      })()
    : existingDocument.state ?? createEmptyDocumentState();

  const revision = Math.max(existingDocument.revision, input.clientRevision);

  const document = await prisma.$transaction(async (tx) => {
    const updated = await tx.document.update({
      where: {
        id: input.documentId,
      },
      data: {
        state: Buffer.from(mergedState),
        revision,
        textContent: input.plainText,
        htmlContent: input.html,
        lastSyncedAt: new Date(),
      },
    });

    if (freshUpdates.length) {
      await tx.syncEvent.createMany({
        data: freshUpdates.map((entry, index) => ({
          documentId: input.documentId,
          createdById: input.userId,
          clientUpdateId: entry.clientUpdateId,
          update: Buffer.from(decodedUpdates[index]),
          textContent: input.plainText.slice(0, 2_000),
        })),
      });
    }

    return updated;
  });

  return {
    state: encodeUpdate(document.state ?? createEmptyDocumentState()),
    revision: document.revision,
    updatedAt: document.updatedAt.toISOString(),
  };
}

export async function createVersion(documentId: string, userId: string, name: string) {
  const membership = await getDocumentMembership(documentId, userId);

  if (!membership) {
    throw new Error("NOT_FOUND");
  }

  if (!isOwner(membership.role)) {
    throw new Error("FORBIDDEN");
  }

  const document = await prisma.document.findUnique({
    where: {
      id: documentId,
    },
    select: {
      state: true,
      textContent: true,
    },
  });

  if (!document) {
    throw new Error("NOT_FOUND");
  }

  return prisma.documentVersion.create({
    data: {
      documentId,
      createdById: userId,
      name,
      snapshot: document.state ?? Buffer.from(createEmptyDocumentState()),
      textContent: document.textContent,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export async function restoreVersion(documentId: string, versionId: string, userId: string) {
  const membership = await getDocumentMembership(documentId, userId);

  if (!membership) {
    throw new Error("NOT_FOUND");
  }

  if (!isOwner(membership.role)) {
    throw new Error("FORBIDDEN");
  }

  const [document, version] = await Promise.all([
    prisma.document.findUnique({
      where: { id: documentId },
    }),
    prisma.documentVersion.findFirst({
      where: {
        id: versionId,
        documentId,
      },
    }),
  ]);

  if (!document || !version) {
    throw new Error("NOT_FOUND");
  }

  const nextRevision = document.revision + 1;
  const restoreUpdateId = `restore:${version.id}:${nextRevision}`;

  const restored = await prisma.$transaction(async (tx) => {
    await tx.documentVersion.create({
      data: {
        documentId,
        createdById: userId,
        name: `Auto backup before restore ${new Date().toLocaleString("en-US")}`,
        snapshot: document.state ?? Buffer.from(createEmptyDocumentState()),
        textContent: document.textContent,
      },
    });

    const updated = await tx.document.update({
      where: {
        id: documentId,
      },
      data: {
        state: version.snapshot,
        textContent: version.textContent,
        htmlContent: version.textContent,
        revision: nextRevision,
        lastSyncedAt: new Date(),
      },
    });

    await tx.documentVersion.create({
      data: {
        documentId,
        createdById: userId,
        name: `Restored ${version.name}`,
        snapshot: version.snapshot,
        textContent: version.textContent,
      },
    });

    await tx.syncEvent.create({
      data: {
        documentId,
        createdById: userId,
        clientUpdateId: restoreUpdateId,
        update: version.snapshot,
        textContent: version.textContent.slice(0, 2_000),
      },
    });

    return updated;
  });

  return {
    state: encodeUpdate(restored.state ?? createEmptyDocumentState()),
    revision: restored.revision,
    updatedAt: restored.updatedAt.toISOString(),
  };
}

export function mapRouteError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return {
      status: 400,
      message: "Database request failed",
    };
  }

  if (error instanceof Error) {
    switch (error.message) {
      case "FORBIDDEN":
        return { status: 403, message: "Forbidden" };
      case "NOT_FOUND":
        return { status: 404, message: "Document not found" };
      case "PAYLOAD_TOO_LARGE":
        return { status: 413, message: "Sync payload too large" };
      default:
        return { status: 400, message: error.message };
    }
  }

  return {
    status: 500,
    message: "Unexpected error",
  };
}
