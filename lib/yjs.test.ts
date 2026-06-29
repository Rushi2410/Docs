import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import { createEmptyDocumentState, loadDocumentFromState, mergeDocumentUpdates } from "./yjs";

function makeUpdate(text: string) {
  const doc = new Y.Doc();
  const fragment = doc.getText("content");
  fragment.insert(0, text);
  return Y.encodeStateAsUpdate(doc);
}

describe("yjs helpers", () => {
  it("creates a valid empty document state", () => {
    const doc = loadDocumentFromState(createEmptyDocumentState());
    expect(doc.getXmlFragment("default")).toBeDefined();
  });

  it("merges concurrent updates deterministically", () => {
    const first = makeUpdate("Hello");
    const second = makeUpdate(" world");
    const merged = mergeDocumentUpdates(null, [first, second]);
    const doc = loadDocumentFromState(merged);
    expect(Y.encodeStateAsUpdate(doc)).toBeDefined();
  });
});
