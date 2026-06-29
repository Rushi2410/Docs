import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const documents = await prisma.document.findMany({
    where: {
      members: {
        some: {
          userId: user.id,
        },
      },
    },
    include: {
      members: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80 px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">OfflineDocs</h1>
            <p className="text-sm text-slate-400">
              Local-first collaborative document editor
            </p>
          </div>

         <Link
  href="/api/documents/new"
  className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 font-semibold text-slate-950"
>
  <Plus size={18} />
  New Document
</Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h2 className="text-xl font-semibold">Welcome, {user.name}</h2>
          <p className="text-sm text-slate-400">
            Your documents are available offline after opening them once.
          </p>
        </div>

        {documents.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
            <FileText className="mx-auto mb-4 text-slate-400" size={44} />
            <h3 className="text-xl font-semibold">No documents yet</h3>
            <p className="mt-2 text-slate-400">
              Create your first document to start editing offline.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <Link
                key={doc.id}
                href={`/document/${doc.id}`}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
              >
                <FileText className="mb-4 text-slate-300" size={28} />
                <h3 className="font-semibold">{doc.title}</h3>
                <p className="mt-2 text-sm text-slate-400">
                  {doc.members.length} collaborator(s)
                </p>
                <p className="mt-4 text-xs text-slate-500">
                  Updated {doc.updatedAt.toLocaleString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="mx-auto max-w-6xl px-6 pb-8 text-xs text-slate-500">
        Rushikesh Andhale · GitHub · LinkedIn
      </footer>
    </main>
  );
}