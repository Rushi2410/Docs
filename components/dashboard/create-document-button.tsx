"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type CreateDocumentButtonProps = {
  compact?: boolean;
  children?: React.ReactNode;
};

export function CreateDocumentButton({ compact = false, children }: CreateDocumentButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function createDocument() {
    setLoading(true);

    const response = await fetch("/api/documents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Untitled document",
      }),
    });

    const data = await response.json();
    setLoading(false);

    if (response.ok) {
      router.push(`/document/${data.document.id}`);
      return;
    }

    window.alert(data.error ?? "Unable to create document");
  }

  return (
    <button
      type="button"
      onClick={createDocument}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-[#1c1713] px-4 py-2.5 text-sm font-semibold text-[#fffdf8] transition hover:bg-[#174f44] disabled:cursor-not-allowed disabled:opacity-60",
        compact && "border border-[var(--line)] bg-white text-[#171411] hover:bg-[#f8f3eb]",
      )}
    >
      {children ?? (
        <>
          <Plus size={16} />
          {loading ? "Creating..." : "Create document"}
        </>
      )}
    </button>
  );
}
