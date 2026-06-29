import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDocumentForUser, mapRouteError, restoreVersion } from "@/lib/documents";

type RouteContext = {
  params: Promise<{ id: string; versionId: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, versionId } = await params;
    const result = await restoreVersion(id, versionId, user.id);
    const document = await getDocumentForUser(id, user.id);
    return NextResponse.json({
      ...result,
      versions: document?.versions ?? [],
    });
  } catch (error) {
    const mapped = mapRouteError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
