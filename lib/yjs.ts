import * as Y from "yjs";

export function createEmptyDocumentState() {
  const doc = new Y.Doc();
  doc.getXmlFragment("default");
  return Y.encodeStateAsUpdate(doc);
}

export function encodeUpdate(update: Uint8Array) {
  return Buffer.from(update).toString("base64");
}

export function decodeUpdate(payload: string) {
  return new Uint8Array(Buffer.from(payload, "base64"));
}

export function loadDocumentFromState(state?: Uint8Array | null) {
  const doc = new Y.Doc();
  doc.getXmlFragment("default");

  if (state?.length) {
    Y.applyUpdate(doc, state);
  }

  return doc;
}

export function mergeDocumentUpdates(
  currentState: Uint8Array | null | undefined,
  updates: Uint8Array[],
) {
  const doc = loadDocumentFromState(currentState);

  for (const update of updates) {
    Y.applyUpdate(doc, update);
  }

  return Y.encodeStateAsUpdate(doc);
}
