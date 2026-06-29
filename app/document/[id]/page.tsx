import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDocumentForUser } from "@/lib/documents";
import { encodeUpdate } from "@/lib/yjs";
import { DocumentScreen } from "@/components/document/document-screen";
import { AppFooter } from "@/components/shared/app-footer";

type DocumentPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DocumentPage({ params }: DocumentPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const document = await getDocumentForUser(id, user.id);

  if (!document) {
    redirect("/dashboard");
  }

  const role = document.members.find((member) => member.userId === user.id)?.role ?? "VIEWER";

  return (
    <main className="noise min-h-screen px-4 py-4 text-[var(--foreground)] sm:px-6">
      <div className="mx-auto max-w-7xl">
        <DocumentScreen
          document={{
            id: document.id,
            title: document.title,
            textContent: document.textContent,
            htmlContent: document.htmlContent,
            revision: document.revision,
            state: encodeUpdate(document.state ?? new Uint8Array()),
            role,
            members: document.members.map((member) => ({
              id: member.id,
              role: member.role,
              userId: member.userId,
              name: member.user.name,
              email: member.user.email,
            })),
            versions: document.versions.map((version) => ({
              id: version.id,
              name: version.name,
              createdAt: version.createdAt.toISOString(),
              createdByName: version.createdBy.name,
              textContent: version.textContent,
            })),
          }}
        />
        <AppFooter />
      </div>
    </main>
  );
}
