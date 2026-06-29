import { DocumentRole } from "@prisma/client";

export function canEdit(role: DocumentRole) {
  return role === "OWNER" || role === "EDITOR";
}

export function isOwner(role: DocumentRole) {
  return role === "OWNER";
}
