"use client";

import Dexie, { type Table } from "dexie";

export type LocalDocumentRecord = {
  id: string;
  snapshot: string;
  revision: number;
  title: string;
  plainText: string;
  html: string;
  updatedAt: string;
  backupSnapshot?: string;
  backupRevision?: number;
  backupReason?: string;
  backupCreatedAt?: string;
};

export type SyncQueueRecord = {
  id: string;
  documentId: string;
  clientUpdateId: string;
  update: string;
  createdAt: string;
};

class DocsDexie extends Dexie {
  documents!: Table<LocalDocumentRecord, string>;
  syncQueue!: Table<SyncQueueRecord, string>;

  constructor() {
    super("docs-local-first-db");
    this.version(1).stores({
      documents: "id, updatedAt, revision",
      syncQueue: "id, documentId, createdAt, clientUpdateId",
    });
  }
}

export const localDb = new DocsDexie();

export function loadLocalDocument(documentId: string) {
  return localDb.documents.get(documentId);
}

export async function saveLocalDocument(record: LocalDocumentRecord) {
  await localDb.documents.put(record);
}

export async function backupAndReplaceDocument(input: {
  documentId: string;
  snapshot: string;
  revision: number;
  title: string;
  plainText: string;
  html: string;
  reason: string;
}) {
  const existing = await localDb.documents.get(input.documentId);

  await localDb.documents.put({
    id: input.documentId,
    snapshot: input.snapshot,
    revision: input.revision,
    title: input.title,
    plainText: input.plainText,
    html: input.html,
    updatedAt: new Date().toISOString(),
    backupSnapshot: existing?.snapshot,
    backupRevision: existing?.revision,
    backupReason: input.reason,
    backupCreatedAt: new Date().toISOString(),
  });
}

export function queueUpdate(record: SyncQueueRecord) {
  return localDb.syncQueue.put(record);
}

export function getQueuedUpdates(documentId: string) {
  return localDb.syncQueue.where("documentId").equals(documentId).sortBy("createdAt");
}

export function clearQueuedUpdates(ids: string[]) {
  return localDb.syncQueue.bulkDelete(ids);
}

export function clearDocumentQueue(documentId: string) {
  return localDb.syncQueue.where("documentId").equals(documentId).delete();
}

export async function deleteLocalDocumentData(documentId: string) {
  await localDb.transaction("rw", localDb.documents, localDb.syncQueue, async () => {
    await localDb.documents.delete(documentId);
    await localDb.syncQueue.where("documentId").equals(documentId).delete();
  });
}
