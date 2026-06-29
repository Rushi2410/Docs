"use client";

import { useState } from "react";
import { DocumentRole } from "@prisma/client";

type MembersPanelProps = {
  documentId: string;
  role: DocumentRole;
  initialMembers: Array<{
    id: string;
    userId: string;
    name: string;
    email: string;
    role: DocumentRole;
  }>;
};

export function MembersPanel({ documentId, role, initialMembers }: MembersPanelProps) {
  const [members, setMembers] = useState(initialMembers);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<DocumentRole>("EDITOR");

  async function inviteMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch(`/api/documents/${documentId}/members`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        role: inviteRole,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setMembers(data.members);
      setEmail("");
      return;
    }

    window.alert(data.error ?? "Unable to update members");
  }

  async function updateRole(memberId: string, nextRole: DocumentRole) {
    const response = await fetch(`/api/documents/${documentId}/members`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memberId,
        role: nextRole,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setMembers(data.members);
      return;
    }

    window.alert(data.error ?? "Unable to change role");
  }

  return (
    <section className="panel rounded-[1.5rem] p-5 text-[var(--foreground)]">
      <h2 className="text-lg font-semibold">Members</h2>
      <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">Owners can invite collaborators and change editor or viewer access.</p>

      <div className="mt-4 space-y-3">
        {members.map((member) => (
          <div key={member.id} className="panel-strong rounded-[1.2rem] p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-xs text-[color:var(--muted)]">{member.email}</p>
              </div>
              <select
                aria-label={`Role for ${member.name}`}
                value={member.role}
                disabled={role !== "OWNER" || member.role === "OWNER"}
                onChange={(event) => void updateRole(member.id, event.target.value as DocumentRole)}
                className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs text-[var(--foreground)] disabled:opacity-60"
              >
                <option value="EDITOR">EDITOR</option>
                <option value="VIEWER">VIEWER</option>
                <option value="OWNER" disabled>
                  OWNER
                </option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {role === "OWNER" ? (
        <form onSubmit={inviteMember} className="mt-4 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Collaborator email"
            className="w-full rounded-[1.2rem] border border-[var(--line)] bg-white px-4 py-3 text-sm text-[#171411] outline-none placeholder:text-[#9a9388]"
          />
          <div className="flex gap-3">
            <select
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value as DocumentRole)}
              className="rounded-[1.2rem] border border-[var(--line)] bg-white px-4 py-3 text-sm text-[#171411]"
            >
              <option value="EDITOR">Editor</option>
              <option value="VIEWER">Viewer</option>
            </select>
            <button type="submit" className="rounded-[1.2rem] bg-[#1c1713] px-4 py-3 text-sm font-semibold text-[#fffdf8] transition hover:bg-[#174f44]">
              Invite or update
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
