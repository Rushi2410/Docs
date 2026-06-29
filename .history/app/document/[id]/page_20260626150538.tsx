import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import LocalEditor from "@/components/editor/local-editor";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DocumentPage({ params }: PageProps) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const { id } = await params;

  const document = await prisma.document.findFirst({
    where: {
      id,
      members: {
        some: {
          userId: user.id,
        },
      },
    },
    include: {
      members: true,
    },
  });

  if (!document) redirect("/dashboard");

  const member = document.members.find((m) => m.userId === user.id);
  const role = member?.role || "viewer";

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {document.title}
            </h1>
            <p className="text-sm text-slate-500">
              Role: <span className="font-semibold">{role}</span>
            </p>
          </div>

          <a
            href="/dashboard"
            className="rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Back
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-8">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
         <LocalEditor
  documentId={document.id}
  initialContent={document.content}
  role={role}
/>
        </div>
      </section>
    </main>
  );
}