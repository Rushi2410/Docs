import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export default function RegisterPage() {
  return (
    <main className="noise min-h-screen px-4 py-8 text-[var(--foreground)] sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_430px] lg:items-center">
        <section className="rise-in">
          <span className="eyebrow">Create your workspace</span>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">
            Build documents that can survive real collaboration.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[color:var(--muted)]">
            Start a workspace for specs, team notes, launch briefs, and evolving drafts that need both speed and structure.
          </p>
          <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
            <div className="panel-strong rounded-[1.5rem] p-5">
              <p className="text-sm font-semibold">Version-aware writing</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">Named snapshots let you experiment without losing the version everyone trusted yesterday.</p>
            </div>
            <div className="panel-strong rounded-[1.5rem] p-5">
              <p className="text-sm font-semibold">Realtime and offline</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">The app accepts edits locally first and merges changes safely when connectivity returns.</p>
            </div>
          </div>
        </section>

        <AuthForm
          mode="register"
          title="Register"
          description="Create your secure Docs account and open your first workspace."
          footer={
            <p className="text-sm text-[color:var(--muted)]">
              Already registered?{" "}
              <Link href="/login" className="font-semibold text-[var(--foreground)]">
                Login
              </Link>
            </p>
          }
        />
      </div>
    </main>
  );
}
