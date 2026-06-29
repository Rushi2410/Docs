import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const updateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  content: z.string().max(500000),
});

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: RouteProps) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    const member = await prisma.documentMember.findFirst({
      where: {
        documentId: id,
        userId: user.id,
      },
    });

    if (!member || member.role === "viewer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const document = await prisma.document.update({
      where: { id },
      data: {
        ...(data.title ? { title: data.title } : {}),
        content: data.content,
      },
    });

    return NextResponse.json({ document });
  } catch (error) {
    console.error("DOCUMENT PATCH ERROR:", error);

    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
}