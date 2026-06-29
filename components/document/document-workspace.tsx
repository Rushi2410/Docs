"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, RefreshCcw } from "lucide-react";
import { DocumentRole } from "@prisma/client";
import { DocumentEditor } from "@/components/document/editor-shell";
import { MembersPanel } from "@/components/document/members-panel";
import { VersionsPanel } from "@/components/document/versions-panel";
import { loadLocalDocument, type LocalDocumentRecord } from "@/lib/client/dexie";

type WorkspaceProps = {
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

export function DocumentWorkspace({ document }: WorkspaceProps) {
  const [bootstrap, setBootstrap] = useState<LocalDocumentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetSeed, setResetSeed] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void loadLocalDocument(document.id).then((localRecord) => {
      if (!cancelled) {
        setBootstrap(localRecord ?? null);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [document.id]);

  if (loading) {
    return (
      <div className="panel flex min-h-[60vh] items-center justify-center rounded-[2rem]">
        <LoaderCircle className="animate-spin text-[var(--accent)]" size={28} />
      </div>
    );
  }

  const bootstrapState = bootstrap?.snapshot ?? document.state;
  const bootstrapRevision = bootstrap?.revision ?? document.revision;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <DocumentEditor
        key={`${document.id}:${bootstrapRevision}:${resetSeed}`}
        documentId={document.id}
        title={document.title}
        role={document.role}
        initialState={bootstrapState}
        initialRevision={bootstrapRevision}
        onServerReset={() => setResetSeed((value) => value + 1)}
      />

      <aside className="space-y-4">
        <MembersPanel documentId={document.id} role={document.role} initialMembers={document.members} />
        <VersionsPanel documentId={document.id} role={document.role} initialVersions={document.versions} onRestore={() => setResetSeed((value) => value + 1)} />
        <div className="panel rounded-[1.5rem] p-5 text-sm">
          <div className="mb-3 inline-flex items-center gap-2 font-medium text-[var(--accent-strong)]">
            <RefreshCcw size={16} />
            Restore safety
          </div>
          <p className="leading-6 text-[color:var(--muted)]">
            Revision bumps trigger a local backup before the editor replaces the active snapshot, so restores never silently wipe offline work.
          </p>
        </div>
      </aside>
    </div>
  );
}
