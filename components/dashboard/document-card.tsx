"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Clock3, Layers3, Trash2, Users2 } from "lucide-react";
import { deleteLocalDocumentData } from "@/lib/client/dexie";
import { formatDate } from "@/lib/utils";

type DocumentCardProps = {
  document: {
    id: string;
    title: string;
    textContent: string;
    updatedAt: string | Date;
    memberCount: number;
    versionCount: number;
    role: string;
  };
};

export function DocumentCard({ document }: DocumentCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (document.role !== "OWNER" || deleting) {
      return;
    }

    const confirmed = window.confirm(`Delete "${document.title}"? This cannot be undone.`);

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    const response = await fetch(`/api/documents/${document.id}`, {
      method: "DELETE",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setDeleting(false);
      window.alert(data.error ?? "Unable to delete document");
      return;
    }

    await deleteLocalDocumentData(document.id);
    router.refresh();
  }

  return (
    <Link
      href={`/document/${document.id}`}
      className="panel-strong group rounded-[1.6rem] p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent-strong)]">
            {document.role}
          </span>
          <h3 className="mt-4 text-xl font-semibold">{document.title}</h3>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-[color:var(--muted)]">
            {document.textContent || "Open the document to begin turning an idea into a collaborative working draft."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {document.role === "OWNER" ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              aria-label={`Delete ${document.title}`}
              className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-[#8f2f23] transition hover:bg-[#fff1ed] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={16} />
            </button>
          ) : null}
          <ArrowRight className="mt-1 text-[color:var(--muted)] transition group-hover:text-[var(--accent)]" size={20} />
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="panel rounded-[1.15rem] p-3 text-sm">
          <Users2 size={15} className="mb-2 text-[var(--accent)]" />
          {document.memberCount} member{document.memberCount === 1 ? "" : "s"}
        </div>
        <div className="panel rounded-[1.15rem] p-3 text-sm">
          <Layers3 size={15} className="mb-2 text-[var(--accent)]" />
          {document.versionCount} version{document.versionCount === 1 ? "" : "s"}
        </div>
        <div className="panel rounded-[1.15rem] p-3 text-sm">
          <Clock3 size={15} className="mb-2 text-[var(--accent)]" />
          {formatDate(document.updatedAt)}
        </div>
      </div>
    </Link>
  );
}
