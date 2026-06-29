import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deleteDocument, getDocumentForUser, getDocumentMembership, mapRouteError } from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { updateDocumentSchema } from "@/lib/validation";
import { isOwner } from "@/lib/permissions";
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
    document: {
      ...document,
      state: encodeUpdate(document.state ?? new Uint8Array()),
    },
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const membership = await getDocumentMembership(id, user.id);

    if (!membership || !isOwner(membership.role)) {
      return NextResponse.json({ error: "Only the owner can rename the document" }, { status: 403 });
    }

    const body = await request.json();
    const data = updateDocumentSchema.parse(body);

    const document = await prisma.document.update({
      where: {
        id,
      },
      data: {
        title: data.title,
      },
    });

    return NextResponse.json({ document });
  } catch (error) {
    const mapped = mapRouteError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await deleteDocument(id, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const mapped = mapRouteError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
