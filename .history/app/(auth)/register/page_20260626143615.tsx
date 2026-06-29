"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Registration failed");
      return;
    }

    router.push("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-8 shadow-2xl"
      >
        <h1 className="text-3xl font-bold text-slate-950">Create account</h1>
        <p className="mt-2 text-sm text-slate-500">
          Start using OfflineDocs local-first editor.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <input
            name="name"
            placeholder="Full name"
            className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900"
            required
          />

          <input
            name="email"
            type="email"
            placeholder="Email address"
            className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900"
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900"
            required
          />
        </div>

        <button
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create account"}
        </button>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <a href="/login" className="font-semibold text-slate-950">
            Login
          </a>
        </p>
      </form>
    </main>
  );
}