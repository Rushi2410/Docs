import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createVersion, getDocumentForUser, mapRouteError } from "@/lib/documents";
import { versionCreateSchema } from "@/lib/validation";

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

  return NextResponse.json({ versions: document.versions });
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const data = versionCreateSchema.parse(body);
    await createVersion(id, user.id, data.name);
    const document = await getDocumentForUser(id, user.id);
    return NextResponse.json({ versions: document?.versions ?? [] });
  } catch (error) {
    const mapped = mapRouteError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
