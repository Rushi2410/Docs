import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <main className="noise min-h-screen px-4 py-8 text-[var(--foreground)] sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_430px] lg:items-center">
        <section className="rise-in">
          <span className="eyebrow">Secure collaborative editor</span>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">
            Welcome back to the drafts that still matter.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[color:var(--muted)]">
            Sign in to resume editing, recover previous versions, and keep work moving whether the network is perfect or not.
          </p>
          <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
            <div className="panel-strong rounded-[1.5rem] p-5">
              <p className="text-sm font-semibold">Local-first sessions</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">Your browser saves the active document first so work does not depend on a clean round trip.</p>
            </div>
            <div className="panel-strong rounded-[1.5rem] p-5">
              <p className="text-sm font-semibold">Protected collaboration</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">Role checks, secure auth cookies, and scoped access keep shared documents under control.</p>
            </div>
          </div>
        </section>

        <AuthForm
          mode="login"
          title="Login"
          description="Use your account to open the protected dashboard and continue where you left off."
          footer={
            <p className="text-sm text-[color:var(--muted)]">
              Need an account?{" "}
              <Link href="/register" className="font-semibold text-[var(--foreground)]">
                Register
              </Link>
            </p>
          }
        />
      </div>
    </main>
  );
}
