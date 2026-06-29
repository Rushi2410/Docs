import Link from "next/link";
import { ArrowUpRight, Clock3, FileStack, ShieldCheck, Sparkles, Users2 } from "lucide-react";
import { AppFooter } from "@/components/shared/app-footer";

const features = [
  {
    icon: Users2,
    title: "Collaboration that stays predictable",
    description: "People can work in the same draft without overwriting each other or waiting on a perfect connection.",
  },
  {
    icon: FileStack,
    title: "Versions you can actually trust",
    description: "Save named checkpoints, restore safely, and keep a record of how the document got there.",
  },
  {
    icon: Clock3,
    title: "Offline-first editing",
    description: "Draft locally first, queue changes quietly, and sync when the network is ready instead of blocking your flow.",
  },
  {
    icon: ShieldCheck,
    title: "Role-aware access",
    description: "Owners, editors, and viewers behave like real product permissions across the editor and API layer.",
  },
];

export default function HomePage() {
  return (
    <main className="noise min-h-screen text-[var(--foreground)]">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-5 sm:px-6 lg:px-8">
        <header className="panel rise-in flex items-center justify-between rounded-full px-4 py-3 shadow-[0_18px_45px_rgba(28,22,17,0.06)] md:px-6">
          <Link href="/" className="text-sm font-semibold uppercase tracking-[0.34em]">
            Docs
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="rounded-full px-4 py-2 text-sm text-[color:var(--muted)] transition hover:bg-black/4 hover:text-[var(--foreground)]">
              Login
            </Link>
            <Link href="/register" className="rounded-full bg-[#1c1713] px-4 py-2 text-sm font-semibold text-[#fffdf8] transition hover:bg-[#174f44]">
              Start free
            </Link>
          </nav>
        </header>

        <div className="grid flex-1 gap-10 py-10 lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:py-14">
          <section className="rise-in-delay">
            <span className="eyebrow">Local-first writing workspace</span>
            <h1 className="mt-7 max-w-5xl text-5xl font-semibold leading-[0.96] tracking-[-0.05em] sm:text-6xl lg:text-[5.7rem]">
              A document app
              <span className="block text-[color:var(--muted)]">for people who do serious work in drafts.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[color:var(--muted)]">
              Plan launches, write specs, capture meeting notes, and collaborate without the usual tension between speed, version safety, and realtime editing.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/register" className="inline-flex items-center gap-2 rounded-full bg-[#1f6b5b] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#174f44]">
                Create your workspace
                <ArrowUpRight size={16} />
              </Link>
              <Link href="/dashboard" className="rounded-full border border-[var(--line)] bg-white/55 px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white/85">
                View dashboard
              </Link>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              {features.map((feature) => (
                <article key={feature.title} className="panel-strong rounded-[1.65rem] p-5 shadow-[0_10px_30px_rgba(28,22,17,0.04)]">
                  <feature.icon className="text-[var(--accent)]" size={18} />
                  <h2 className="mt-4 text-lg font-semibold">{feature.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{feature.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="panel rise-in rounded-[2rem] p-4 shadow-[0_24px_60px_rgba(28,22,17,0.08)]">
            <div className="panel-strong rounded-[1.7rem] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="eyebrow">Live example</span>
                  <h2 className="mt-4 text-3xl font-semibold">Launch narrative draft</h2>
                  <p className="mt-2 max-w-lg text-sm leading-6 text-[color:var(--muted)]">
                    A shared document in review with product, design, and marketing contributing at the same time.
                  </p>
                </div>
                <div className="rounded-full bg-[var(--accent-soft)] px-3 py-2 text-xs font-medium text-[var(--accent-strong)]">
                  synced 12s ago
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-[1.4rem] border border-[var(--line)] bg-[#f8f3eb] p-4 text-[var(--foreground)]">
                  <div className="flex items-center justify-between gap-3 text-sm text-[color:var(--muted)]">
                    <span>Open review threads</span>
                    <span>4 active collaborators</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-[1.15rem] bg-white p-4 text-[var(--foreground)]">
                      <p className="text-sm font-semibold">Hero framing</p>
                      <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
                        Keep the customer outcome in the first paragraph and move implementation detail lower in the page.
                      </p>
                    </div>
                    <div className="rounded-[1.15rem] bg-white p-4 text-[var(--foreground)]">
                      <p className="text-sm font-semibold">Offline sync note</p>
                      <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
                        Last train-ride edits merged correctly after reconnect, including the new rollout section and pricing notes.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-[1.3rem] border border-[var(--line)] bg-white p-4 text-[var(--foreground)]">
                    <p className="text-2xl font-semibold">CRDT</p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">Conflict-safe merges instead of last-write-wins guesswork.</p>
                  </div>
                  <div className="rounded-[1.3rem] border border-[var(--line)] bg-white p-4 text-[var(--foreground)]">
                    <p className="text-2xl font-semibold">Restore</p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">Named checkpoints you can confidently roll back to.</p>
                  </div>
                  <div className="rounded-[1.3rem] border border-[var(--line)] bg-white p-4 text-[var(--foreground)]">
                    <p className="text-2xl font-semibold">AI</p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">Summaries, rewrites, and continuation support when you need momentum.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="mb-6 grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="panel rounded-[1.8rem] p-6 text-[var(--foreground)]">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[var(--accent)]">
              <Sparkles size={14} />
              Product stance
            </p>
            <p className="mt-4 text-2xl font-semibold leading-tight">
              Built for teams that still think in documents, not just checklists and chat threads.
            </p>
          </div>
          <div className="panel rounded-[1.8rem] p-6">
            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <p className="text-sm font-semibold">Real use cases</p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">Launch briefs, product specs, policy drafts, and working notes instead of placeholder demo content.</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Clear hierarchy</p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">Typography and spacing carry the structure, so the UI feels deliberate before any decoration shows up.</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Calmer visuals</p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">A neutral system makes the app feel premium and human instead of over-styled or AI-generated.</p>
              </div>
            </div>
          </div>
        </section>

        <AppFooter />
      </section>
    </main>
  );
}
