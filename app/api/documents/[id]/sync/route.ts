import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { applySyncUpdates, getDocumentForUser, mapRouteError } from "@/lib/documents";
import { syncRequestSchema } from "@/lib/validation";
import { encodeUpdate } from "@/lib/yjs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const document = await getDocumentForUser(id, user.id);

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json({
    state: encodeUpdate(document.state ?? new Uint8Array()),
    revision: document.revision,
    updatedAt: document.updatedAt.toISOString(),
    textContent: document.textContent,
    htmlContent: document.htmlContent,
  });
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const data = syncRequestSchema.parse(body);
    const result = await applySyncUpdates({
      documentId: id,
      userId: user.id,
      updates: data.updates,
      plainText: data.plainText,
      html: data.html,
      clientRevision: data.revision,
    });

    return NextResponse.json(result);
  } catch (error) {
    const mapped = mapRouteError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
