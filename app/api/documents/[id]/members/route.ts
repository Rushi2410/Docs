import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDocumentMembership, getDocumentForUser } from "@/lib/documents";
import { isOwner } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { memberRoleSchema, memberUpsertSchema } from "@/lib/validation";

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

  return NextResponse.json({ members: document.members });
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const membership = await getDocumentMembership(id, user.id);

  if (!membership || !isOwner(membership.role)) {
    return NextResponse.json({ error: "Only the owner can manage members" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = memberUpsertSchema.parse(body);
    const invitedUser = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (!invitedUser) {
      return NextResponse.json({ error: "User account not found for that email" }, { status: 404 });
    }

    await prisma.documentMember.upsert({
      where: {
        documentId_userId: {
          documentId: id,
          userId: invitedUser.id,
        },
      },
      update: {
        role: data.role,
      },
      create: {
        documentId: id,
        userId: invitedUser.id,
        role: data.role,
      },
    });

    const document = await getDocumentForUser(id, user.id);
    return NextResponse.json({ members: document?.members ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid member payload" }, { status: 400 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const membership = await getDocumentMembership(id, user.id);

  if (!membership || !isOwner(membership.role)) {
    return NextResponse.json({ error: "Only the owner can manage members" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = memberRoleSchema.parse(body);

    await prisma.documentMember.updateMany({
      where: {
        id: data.memberId,
        documentId: id,
      },
      data: {
        role: data.role,
      },
    });

    const document = await getDocumentForUser(id, user.id);
    return NextResponse.json({ members: document?.members ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid role payload" }, { status: 400 });
  }
}
