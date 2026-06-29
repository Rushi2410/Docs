import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createDocument, listUserDocuments } from "@/lib/documents";
import { createDocumentSchema } from "@/lib/validation";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documents = await listUserDocuments(user.id);
  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createDocumentSchema.parse(body);
    const document = await createDocument(user.id, data.title);
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create document" }, { status: 400 });
  }
}
