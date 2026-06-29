import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const document = await prisma.document.create({
    data: {
      title: "Untitled Document",
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: "owner",
        },
      },
    },
  });

  redirect(`/document/${document.id}`);
}