"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, PencilLine, Trash2 } from "lucide-react";
import { DocumentRole } from "@prisma/client";
import { deleteLocalDocumentData } from "@/lib/client/dexie";
import { DocumentWorkspace } from "@/components/document/document-workspace";

type DocumentScreenProps = {
  document: {
    id: string;
    title: string;
    textContent: string;
    htmlContent: string;
    revision: number;
    state: string;
    role: DocumentRole;
    members: Array<{
      id: string;
      userId: string;
      name: string;
      email: string;
      role: DocumentRole;
    }>;
    versions: Array<{
      id: string;
      name: string;
      createdAt: string;
      createdByName: string;
      textContent: string;
    }>;
  };
};

export function DocumentScreen({ document }: DocumentScreenProps) {
  const router = useRouter();
  const [title, setTitle] = useState(document.title);
  const [draftTitle, setDraftTitle] = useState(document.title);
  const [editingTitle, setEditingTitle] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);
  const [titleError, setTitleError] = useState("");
  const canRename = document.role === "OWNER";

  async function saveTitle() {
    const nextTitle = draftTitle.trim();

    if (!canRename) {
      return;
    }

    if (!nextTitle) {
      setTitleError("Title cannot be empty");
      return;
    }

    if (nextTitle === title) {
      setEditingTitle(false);
      setTitleError("");
      return;
    }

    setSavingTitle(true);
    setTitleError("");

    const response = await fetch(`/api/documents/${document.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: nextTitle,
      }),
    });

    const data = await response.json();
    setSavingTitle(false);

    if (!response.ok) {
      setTitleError(data.error ?? "Unable to rename document");
      return;
    }

    setTitle(nextTitle);
    setDraftTitle(nextTitle);
    setEditingTitle(false);
    router.refresh();
  }

  function cancelTitleEdit() {
    setDraftTitle(title);
    setTitleError("");
    setEditingTitle(false);
  }

  async function deleteDocument() {
    if (!canRename) {
      return;
    }

    const confirmed = window.confirm(`Delete "${title}"? This cannot be undone.`);

    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/documents/${document.id}`, {
      method: "DELETE",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setTitleError(data.error ?? "Unable to delete document");
      return;
    }

    await deleteLocalDocumentData(document.id);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      <div className="panel mb-4 rounded-[1.75rem] px-5 py-4 shadow-[0_18px_50px_rgba(28,22,17,0.05)]">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-[var(--accent)] transition hover:text-[var(--accent-strong)]">
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <div className="mt-4">
          {editingTitle ? (
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void saveTitle();
                    }

                    if (event.key === "Escape") {
                      event.preventDefault();
                      cancelTitleEdit();
                    }
                  }}
                  autoFocus
                  className="min-w-0 flex-1 rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 text-3xl font-semibold tracking-[-0.04em] text-[#171411] outline-none"
                />
                <button
                  type="button"
                  onClick={() => void saveTitle()}
                  disabled={savingTitle}
                  className="rounded-full bg-[#1c1713] px-4 py-2.5 text-sm font-semibold text-[#fffdf8] transition hover:bg-[#174f44] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingTitle ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={cancelTitleEdit}
                  disabled={savingTitle}
                  className="rounded-full border border-[var(--line)] bg-white px-4 py-2.5 text-sm text-[#171411] transition hover:bg-[#f8f3eb] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
              {titleError ? <p className="mt-2 text-sm text-[var(--danger)]">{titleError}</p> : null}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-[-0.04em]">{title}</h1>
              {canRename ? (
                <>
                  <button
                    type="button"
                    onClick={() => setEditingTitle(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-2 text-sm text-[color:var(--muted)] transition hover:bg-[#f8f3eb] hover:text-[#171411]"
                  >
                    <PencilLine size={14} />
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteDocument()}
                    className="inline-flex items-center gap-2 rounded-full border border-[#f0d0c8] bg-[#fff3ef] px-3 py-2 text-sm text-[#8f2f23] transition hover:bg-[#ffe8e1]"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </>
              ) : null}
            </div>
          )}
        </div>

        <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
          Role: {document.role}. Owners can manage members, create snapshots, restore previous versions safely, and rename the document.
        </p>
      </div>

      <DocumentWorkspace
        document={{
          ...document,
          title,
        }}
      />
    </>
  );
}
