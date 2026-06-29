import { redirect } from "next/navigation";
import { Clock3, FileText, Layers3, LogOut } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { listUserDocuments } from "@/lib/documents";
import { CreateDocumentButton } from "@/components/dashboard/create-document-button";
import { DocumentCard } from "@/components/dashboard/document-card";
import { AppFooter } from "@/components/shared/app-footer";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const documents = await listUserDocuments(user.id);
  const totalVersions = documents.reduce((total, doc) => total + doc._count.versions, 0);
  const rolesRepresented = new Set(documents.map((doc) => doc.members[0]?.role ?? "VIEWER")).size;

  return (
    <main className="noise min-h-screen text-[var(--foreground)]">
      <div className="mx-auto max-w-7xl px-5 py-5 sm:px-6 lg:px-8">
        <header className="panel rise-in rounded-[2rem] px-6 py-5 shadow-[0_18px_50px_rgba(28,22,17,0.06)]">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <span className="eyebrow">Workspace overview</span>
              <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em]">Welcome back, {user.name}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
                Your documents are organized for actual working sessions: quick drafting, safe restores, shared access, and offline-friendly editing.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <CreateDocumentButton />
              <form action="/api/auth/logout" method="post">
                <button className="rounded-full border border-[var(--line)] bg-white px-4 py-2.5 text-sm text-[#171411] transition hover:bg-[#f8f3eb]">
                  <span className="inline-flex items-center gap-2">
                    <LogOut size={16} />
                    Logout
                  </span>
                </button>
              </form>
            </div>
          </div>
        </header>

        <section className="panel mt-6 rounded-[2rem] p-4 shadow-[0_18px_55px_rgba(28,22,17,0.05)] md:p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">Your documents</h2>
              <p className="mt-2 text-sm text-[color:var(--muted)]">Role-aware access, version history, and reliable local-first state in one workspace.</p>
            </div>
            <CreateDocumentButton compact />
          </div>

          {documents.length === 0 ? (
            <div className="panel-strong rounded-[1.6rem] border-dashed p-10 text-center">
              <FileText className="mx-auto text-[var(--accent)]" size={38} />
              <h3 className="mt-4 text-xl font-semibold">No documents yet</h3>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">Create your first spec, planning note, or working draft to start shaping the space around real content.</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {documents.map((doc) => {
                const role = doc.members[0]?.role ?? "VIEWER";

                return (
                  <DocumentCard
                    key={doc.id}
                    document={{
                      id: doc.id,
                      title: doc.title,
                      textContent: doc.textContent,
                      updatedAt: doc.updatedAt,
                      memberCount: doc._count.members,
                      versionCount: doc._count.versions,
                      role,
                    }}
                  />
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="panel rounded-[1.6rem] p-5">
            <p className="text-sm text-[color:var(--muted)]">Documents</p>
            <p className="mt-2 text-3xl font-semibold">{documents.length}</p>
          </div>
          <div className="panel rounded-[1.6rem] p-5">
            <p className="text-sm text-[color:var(--muted)]">Roles represented</p>
            <p className="mt-2 text-3xl font-semibold">{rolesRepresented}</p>
          </div>
          <div className="panel rounded-[1.6rem] p-5">
            <p className="text-sm text-[color:var(--muted)]">Version snapshots</p>
            <p className="mt-2 text-3xl font-semibold">{totalVersions}</p>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="panel rounded-[1.9rem] p-6">
            <span className="eyebrow">Today&apos;s pulse</span>
            <h2 className="mt-5 max-w-xl text-3xl font-semibold leading-tight">This workspace is built for changing drafts, not frozen deliverables.</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="panel-strong rounded-[1.4rem] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Documents</p>
                <p className="mt-3 text-3xl font-semibold">{documents.length}</p>
              </div>
              <div className="panel-strong rounded-[1.4rem] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Roles</p>
                <p className="mt-3 text-3xl font-semibold">{rolesRepresented}</p>
              </div>
              <div className="panel-strong rounded-[1.4rem] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Snapshots</p>
                <p className="mt-3 text-3xl font-semibold">{totalVersions}</p>
              </div>
            </div>
          </div>

          <div className="panel rounded-[1.9rem] p-6">
            <span className="eyebrow">Best for</span>
            <div className="mt-5 space-y-4">
              <div className="panel-strong rounded-[1.35rem] p-4">
                <p className="inline-flex items-center gap-2 text-sm font-semibold">
                  <FileText size={15} className="text-[var(--accent)]" />
                  Weekly planning notes
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">Capture rough thinking fast, then shape it into something polished without losing earlier context.</p>
              </div>
              <div className="panel-strong rounded-[1.35rem] p-4">
                <p className="inline-flex items-center gap-2 text-sm font-semibold">
                  <Layers3 size={15} className="text-[var(--accent)]" />
                  Shared product specs
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">Let product, design, and engineering revise the same source without stepping on each other.</p>
              </div>
              <div className="panel-strong rounded-[1.35rem] p-4">
                <p className="inline-flex items-center gap-2 text-sm font-semibold">
                  <Clock3 size={15} className="text-[var(--accent)]" />
                  Version-sensitive drafts
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">Restore a solid checkpoint when the document drifts too far from the useful version.</p>
              </div>
            </div>
          </div>
        </section>

        <AppFooter />
      </div>
    </main>
  );
}
