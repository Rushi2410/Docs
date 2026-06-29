"use client";

import { useState } from "react";
import { DocumentRole } from "@prisma/client";
import { formatDate } from "@/lib/utils";

type VersionsPanelProps = {
  documentId: string;
  role: DocumentRole;
  initialVersions: Array<{
    id: string;
    name: string;
    createdAt: string;
    createdByName: string;
    textContent: string;
  }>;
  onRestore: () => void;
};

export function VersionsPanel({ documentId, role, initialVersions, onRestore }: VersionsPanelProps) {
  const [versions, setVersions] = useState(initialVersions);
  const [name, setName] = useState("");

  async function createVersion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch(`/api/documents/${documentId}/versions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });

    const data = await response.json();

    if (!response.ok) {
      window.alert(data.error ?? "Unable to create version");
      return;
    }

    setVersions(data.versions);
    setName("");
  }

  async function restoreVersion(versionId: string) {
    const response = await fetch(`/api/documents/${documentId}/versions/${versionId}/restore`, {
      method: "POST",
    });

    const data = await response.json();

    if (!response.ok) {
      window.alert(data.error ?? "Unable to restore version");
      return;
    }

    setVersions(data.versions);
    onRestore();
  }

  return (
    <section className="panel rounded-[1.5rem] p-5 text-[var(--foreground)]">
      <h2 className="text-lg font-semibold">Versions</h2>
      <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">Save named checkpoints and restore with revision-safe updates.</p>

      {role === "OWNER" ? (
        <form onSubmit={createVersion} className="mt-4 flex gap-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            placeholder="Quarterly draft"
            className="flex-1 rounded-[1.2rem] border border-[var(--line)] bg-white px-4 py-3 text-sm text-[#171411] outline-none placeholder:text-[#9a9388]"
          />
          <button type="submit" className="rounded-[1.2rem] bg-[#1c1713] px-4 py-3 text-sm font-semibold text-[#fffdf8] transition hover:bg-[#174f44]">
            Save version
          </button>
        </form>
      ) : null}

      <div className="mt-4 space-y-3">
        {versions.map((version) => (
          <div key={version.id} className="panel-strong rounded-[1.2rem] p-3">
            <p className="font-medium">{version.name}</p>
            <p className="mt-1 text-xs text-[color:var(--muted)]">
              {formatDate(version.createdAt)} by {version.createdByName}
            </p>
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-[color:var(--muted)]">{version.textContent || "Snapshot of rich content state"}</p>
            {role === "OWNER" ? (
              <button type="button" onClick={() => void restoreVersion(version.id)} className="mt-3 rounded-full bg-[var(--accent-soft)] px-3 py-2 text-xs font-medium text-[var(--accent-strong)]">
                Restore
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
