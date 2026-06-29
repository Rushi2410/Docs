"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AuthFormProps = {
  mode: "login" | "register";
  title: string;
  description: string;
  footer: React.ReactNode;
};

export function AuthForm({ mode, title, description, footer }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mode === "login" ? { email: payload.email, password: payload.password } : payload),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Unable to continue");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="panel rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(28,22,17,0.06)]">
      <h2 className="text-3xl font-semibold tracking-[-0.03em]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{description}</p>

      {error ? <div className="mt-5 rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--danger)]">{error}</div> : null}

      <div className="mt-6 space-y-4">
        {mode === "register" ? (
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Full name</span>
            <input
              name="name"
              required
              className="w-full rounded-[1.2rem] border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
              placeholder="Rushikesh Andhale"
            />
          </label>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-medium">Email</span>
          <input
            type="email"
            name="email"
            required
            className="w-full rounded-[1.2rem] border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
            placeholder="name@example.com"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium">Password</span>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            className="w-full rounded-[1.2rem] border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
            placeholder="Minimum 8 characters"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-[1.2rem] bg-[#1c1713] px-4 py-3 font-semibold text-[#fffdf8] transition hover:bg-[#174f44] disabled:opacity-60"
      >
        {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
      </button>

      <div className="mt-5 text-center">{footer}</div>
    </form>
  );
}
