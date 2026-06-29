"use client";
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useRef, useState } from "react";
import { DocumentRole } from "@prisma/client";
import { EditorContent, useEditor } from "@tiptap/react";
import Collaboration from "@tiptap/extension-collaboration";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { AlertTriangle, CheckCircle2, CloudOff, LoaderCircle, RefreshCcw, Sparkles } from "lucide-react";
import * as Y from "yjs";
import { getSocket } from "@/lib/client/socket";
import { aiRequestSchema } from "@/lib/validation";
import { backupAndReplaceDocument, clearDocumentQueue, clearQueuedUpdates, getQueuedUpdates, saveLocalDocument, queueUpdate } from "@/lib/client/dexie";
import { canEdit } from "@/lib/permissions";
import { decodeUpdate, encodeUpdate } from "@/lib/yjs";

type DocumentEditorProps = {
  documentId: string;
  title: string;
  role: DocumentRole;
  initialState: string;
  initialRevision: number;
  onServerReset: () => void;
};

type SyncStatus = "saved-locally" | "syncing" | "synced" | "failed";

const statusMap: Record<SyncStatus, string> = {
  "saved-locally": "Saved locally",
  syncing: "Syncing",
  synced: "Synced",
  failed: "Sync failed",
};

export function DocumentEditor({
  documentId,
  title,
  role,
  initialState,
  initialRevision,
  onServerReset,
}: DocumentEditorProps) {
  const [ydoc] = useState(() => {
    const doc = new Y.Doc();
    doc.getXmlFragment("default");

    if (initialState) {
      Y.applyUpdate(doc, decodeUpdate(initialState), "bootstrap");
    }

    return doc;
  });
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editable = canEdit(role);
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("saved-locally");
  const [revision, setRevision] = useState(initialRevision);
  const [aiResult, setAiResult] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number | null>(null);
  const [lastAiAction, setLastAiAction] = useState<"summarize" | "improve" | "grammar" | "continue" | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        undoRedo: false,
      }),
      Collaboration.configure({
        document: ydoc,
        field: "default",
      }),
      Placeholder.configure({
        placeholder: editable ? "Start writing. Local changes save immediately and sync when ready." : "Viewer mode enabled.",
      }),
    ],
    editable,
    editorProps: {
      attributes: {
        class:
          "min-h-[34rem] rounded-[1.6rem] border border-[var(--line)] bg-white px-6 py-6 text-base leading-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]",
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const persistSnapshot = async (origin: unknown, incrementalUpdate?: Uint8Array) => {
      const snapshot = encodeUpdate(Y.encodeStateAsUpdate(ydoc));
      const plainText = editor.getText();
      const html = editor.getHTML();

      await saveLocalDocument({
        id: documentId,
        snapshot,
        revision,
        title,
        plainText,
        html,
        updatedAt: new Date().toISOString(),
      });

      if (!editable || origin === "remote-socket" || origin === "remote-sync" || origin === "bootstrap") {
        return;
      }

      if (incrementalUpdate) {
        const queueItem = {
          id: crypto.randomUUID(),
          documentId,
          clientUpdateId: crypto.randomUUID(),
          update: encodeUpdate(incrementalUpdate),
          createdAt: new Date().toISOString(),
        };

        await queueUpdate(queueItem);
        const socket = getSocket();
        socket.emit("document:update", {
          documentId,
          clientUpdateId: queueItem.clientUpdateId,
          update: queueItem.update,
          plainText,
          html,
          revision,
        });
      }

      setSyncStatus("saved-locally");

      if (online) {
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }

        syncTimeoutRef.current = setTimeout(() => {
          void syncNow();
        }, 700);
      }
    };

    const handleUpdate = (update: Uint8Array, origin: unknown) => {
      void persistSnapshot(origin, update);
    };

    ydoc.on("update", handleUpdate);

    return () => {
      ydoc.off("update", handleUpdate);
    };
  }, [documentId, editable, editor, online, revision, title]);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      void syncNow();
    };

    const handleOffline = () => {
      setOnline(false);
      setSyncStatus("saved-locally");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const socket = getSocket();

    socket.emit("document:join", { documentId });
    socket.on("document:remote-update", handleRemoteSocketUpdate);
    socket.on("document:error", handleSocketError);

    void syncNow();

    const interval = window.setInterval(() => {
      if (navigator.onLine) {
        void pullRemoteState();
      }
    }, 20_000);

    return () => {
      socket.off("document:remote-update", handleRemoteSocketUpdate);
      socket.off("document:error", handleSocketError);
      window.clearInterval(interval);
    };
  }, [documentId]);

  async function applyServerState(nextState: string, nextRevision: number, nextText: string, nextHtml: string) {
    if (nextRevision > revision) {
      await backupAndReplaceDocument({
        documentId,
        snapshot: nextState,
        revision: nextRevision,
        title,
        plainText: nextText,
        html: nextHtml,
        reason: "Server restore or forced revision change",
      });
      await clearDocumentQueue(documentId);
      setRevision(nextRevision);
      setSyncStatus("synced");
      onServerReset();
      return;
    }

    Y.applyUpdate(ydoc, decodeUpdate(nextState), "remote-sync");
    setSyncStatus("synced");
  }

  async function pullRemoteState() {
    const response = await fetch(`/api/documents/${documentId}/sync`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json();
    await applyServerState(data.state, data.revision, data.textContent, data.htmlContent);
  }

  async function syncNow() {
    if (!editable || !navigator.onLine || !editor) {
      return;
    }

    const queued = await getQueuedUpdates(documentId);

    if (queued.length === 0) {
      setSyncStatus("synced");
      await pullRemoteState();
      return;
    }

    setSyncStatus("syncing");

    const response = await fetch(`/api/documents/${documentId}/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        updates: queued.map((item) => ({
          clientUpdateId: item.clientUpdateId,
          update: item.update,
          createdAt: item.createdAt,
        })),
        plainText: editor.getText(),
        html: editor.getHTML(),
        revision,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setSyncStatus("failed");
      return;
    }

    await clearQueuedUpdates(queued.map((item) => item.id));
    setRevision(data.revision);
    await applyServerState(data.state, data.revision, editor.getText(), editor.getHTML());
  }

  function handleRemoteSocketUpdate(payload: { documentId: string; update: string; revision: number }) {
    if (payload.documentId !== documentId) {
      return;
    }

    if (payload.revision > revision) {
      void pullRemoteState();
      return;
    }

    Y.applyUpdate(ydoc, decodeUpdate(payload.update), "remote-socket");
    setSyncStatus("synced");
  }

  function handleSocketError(payload: { message: string }) {
    console.error(payload.message);
    setSyncStatus("failed");
  }

  async function runAiAction(action: "summarize" | "improve" | "grammar" | "continue") {
    if (!editor) {
      return;
    }

    const payload = aiRequestSchema.parse({
      action,
      content: editor.getText(),
    });

    setAiLoading(true);
    setLastAiAction(action);
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as {
      output?: string;
      suggestions?: string[];
    };
    setAiLoading(false);

    if (action === "improve") {
      const suggestions = (data.suggestions ?? [])
        .map((item) => item.trim())
        .filter(Boolean);

      if (suggestions.length > 1) {
        setAiSuggestions(suggestions);
        setSelectedSuggestionIndex(null);
        setAiResult("");
      } else {
        setAiSuggestions(suggestions);
        setSelectedSuggestionIndex(suggestions.length === 1 ? 0 : null);
        setAiResult(suggestions[0] ?? data.output ?? "");
      }
    } else {
      setAiSuggestions([]);
      setSelectedSuggestionIndex(null);
      setAiResult(data.output ?? "");
    }

    if (action === "continue" && data.output) {
      editor.commands.insertContent(`<p>${data.output}</p>`);
    }
  }

  const activeAiResult = selectedSuggestionIndex !== null ? aiSuggestions[selectedSuggestionIndex] ?? "" : aiResult;

  function replaceContentWithAi() {
    if (editor && activeAiResult) {
      editor.commands.setContent(`<p>${activeAiResult}</p>`);
    }
  }

  function appendAiResult() {
    if (editor && activeAiResult) {
      editor.commands.insertContent(`<p>${activeAiResult}</p>`);
    }
  }

  if (!editor) {
    return (
      <div className="panel flex min-h-[50vh] items-center justify-center rounded-[2rem]">
        <LoaderCircle className="animate-spin text-[var(--accent)]" size={26} />
      </div>
    );
  }

  return (
    <section className="panel rounded-[2rem] p-4 text-[var(--foreground)] shadow-[0_18px_60px_rgba(28,22,17,0.06)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-[var(--line)] bg-white/65 px-4 py-3 text-sm text-[var(--foreground)]">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${online ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            {online ? <CheckCircle2 size={14} /> : <CloudOff size={14} />}
            {online ? "Online" : "Offline"}
          </span>
          <span className="rounded-full bg-[#f3ede4] px-3 py-1 text-[color:var(--muted)]">{statusMap[syncStatus]}</span>
          <span className="rounded-full bg-[#f3ede4] px-3 py-1 text-[color:var(--muted)]">Role: {role}</span>
        </div>
        <button
          type="button"
          onClick={() => void syncNow()}
          disabled={!editable}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm text-[#171411] transition hover:bg-[#f8f3eb] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCcw size={14} />
          Sync now
        </button>
      </div>

      {!editable ? (
        <div className="mb-4 flex items-center gap-2 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertTriangle size={16} />
          Viewer role can read the document but is blocked from update and sync APIs.
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
        <div className="rounded-[1.6rem] bg-[#f8f3eb] p-3">
          <EditorContent editor={editor} />
        </div>

        <div className="space-y-4">
          <div className="panel-strong rounded-[1.5rem] p-4">
            <div className="mb-3 inline-flex items-center gap-2 font-medium text-[var(--accent-strong)]">
              <Sparkles size={16} />
              AI tools
            </div>
            <div className="grid gap-2">
              <button type="button" onClick={() => void runAiAction("summarize")} disabled={aiLoading} className="rounded-[1rem] bg-[#1c1713] px-4 py-2.5 text-sm font-medium text-[#fffdf8]">
                Summarize
              </button>
              <button type="button" onClick={() => void runAiAction("improve")} disabled={aiLoading} className="rounded-[1rem] border border-[var(--line)] bg-white px-4 py-2.5 text-sm text-[#171411]">
                Improve writing
              </button>
              <button type="button" onClick={() => void runAiAction("grammar")} disabled={aiLoading} className="rounded-[1rem] border border-[var(--line)] bg-white px-4 py-2.5 text-sm text-[#171411]">
                Fix grammar
              </button>
              <button type="button" onClick={() => void runAiAction("continue")} disabled={aiLoading} className="rounded-[1rem] border border-[var(--line)] bg-white px-4 py-2.5 text-sm text-[#171411]">
                Continue writing
              </button>
            </div>
            {lastAiAction === "improve" && aiSuggestions.length > 1 ? (
              <div className="mt-4 space-y-3">
                {aiSuggestions.map((suggestion, index) => {
                  const selected = selectedSuggestionIndex === index;

                  return (
                    <div
                      key={`${index}:${suggestion.slice(0, 24)}`}
                      className={`rounded-[1.2rem] border p-3 text-sm leading-6 transition ${
                        selected
                          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[#171411]"
                          : "border-[var(--line)] bg-[#f8f3eb] text-[color:var(--muted)]"
                      }`}
                    >
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">Option {index + 1}</p>
                      <p>{suggestion}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSuggestionIndex(index);
                            if (editor) {
                              editor.commands.setContent(`<p>${suggestion}</p>`);
                            }
                          }}
                          className="rounded-full bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white"
                        >
                          Replace with this
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSuggestionIndex(index);
                            if (editor) {
                              editor.commands.insertContent(`<p>${suggestion}</p>`);
                            }
                          }}
                          className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs text-[#171411]"
                        >
                          Append this
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedSuggestionIndex(index)}
                          className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs text-[#171411]"
                        >
                          {selected ? "Selected" : "Preview this"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-[1.2rem] bg-[#f8f3eb] p-3 text-sm leading-6 text-[color:var(--muted)]">
                {aiLoading ? "Generating..." : activeAiResult || "AI output appears here. Without AI_API_KEY the app returns a reliable mock response."}
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={replaceContentWithAi}
                disabled={!activeAiResult}
                className="rounded-full bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                Replace content
              </button>
              <button
                type="button"
                onClick={appendAiResult}
                disabled={!activeAiResult}
                className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs text-[#171411] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Append result
              </button>
            </div>
          </div>

          <div className="panel-strong rounded-[1.5rem] p-4 text-sm">
            <h3 className="font-semibold">Local-first flow</h3>
            <p className="mt-3 leading-6 text-[color:var(--muted)]">
              Every Yjs update is stored in IndexedDB first, queued for sync, and then merged server-side. The editor accepts work immediately instead of waiting on the network.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
