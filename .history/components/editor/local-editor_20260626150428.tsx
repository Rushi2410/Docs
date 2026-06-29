"use client";

import { useEffect, useState } from "react";

type LocalEditorProps = {
  documentId: string;
  initialContent: string;
  role: string;
};

export default function LocalEditor({
  documentId,
  initialContent,
  role,
}: LocalEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [online, setOnline] = useState(true);
  const [status, setStatus] = useState("Saved locally");

  const canEdit = role !== "viewer";
  const localKey = `offline-doc-${documentId}`;
  const queueKey = `offline-queue-${documentId}`;

  useEffect(() => {
    setOnline(navigator.onLine);

    const saved = localStorage.getItem(localKey);
    if (saved) setContent(saved);

    const handleOnline = () => {
      setOnline(true);
      syncNow();
    };

    const handleOffline = () => {
      setOnline(false);
      setStatus("Offline - changes saved locally");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  function addToQueue(newContent: string) {
    const queue = JSON.parse(localStorage.getItem(queueKey) || "[]");

    queue.push({
      id: crypto.randomUUID(),
      documentId,
      content: newContent,
      createdAt: new Date().toISOString(),
      synced: false,
    });

    localStorage.setItem(queueKey, JSON.stringify(queue));
  }

  async function syncNow() {
    if (!navigator.onLine || !canEdit) return;

    const queue = JSON.parse(localStorage.getItem(queueKey) || "[]");

    if (queue.length === 0) {
      setStatus("Saved locally");
      return;
    }

    const latestChange = queue[queue.length - 1];

    try {
      setStatus("Syncing...");

      const res = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: latestChange.content,
        }),
      });

      if (!res.ok) throw new Error("Sync failed");

      localStorage.setItem(queueKey, JSON.stringify([]));
      setStatus("Synced to server");
    } catch {
      setStatus("Sync failed - saved locally");
    }
  }

  function handleChange(value: string) {
    setContent(value);
    localStorage.setItem(localKey, value);
    addToQueue(value);

    if (navigator.onLine) {
      setStatus("Saved locally - waiting sync");
      setTimeout(syncNow, 700);
    } else {
      setStatus("Offline - changes saved locally");
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`h-3 w-3 rounded-full ${
              online ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm font-medium text-slate-600">
            {online ? "Online" : "Offline"}
          </span>
        </div>

        <div className="text-sm text-slate-500">{status}</div>
      </div>

      {role === "viewer" && (
        <div className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
          Viewer mode: you can read this document but cannot edit or sync changes.
        </div>
      )}

      <textarea
        value={content}
        disabled={!canEdit}
        onChange={(e) => handleChange(e.target.value)}
        className="min-h-[500px] w-full resize-none rounded-xl border p-5 text-lg leading-8 outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100"
        placeholder="Start writing your document..."
      />

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={syncNow}
          disabled={!canEdit}
          className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Sync Now
        </button>
      </div>
    </div>
  );
}