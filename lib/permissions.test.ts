import { describe, expect, it } from "vitest";
import { canEdit, isOwner } from "./permissions";

describe("permissions", () => {
  it("allows owner and editor to edit", () => {
    expect(canEdit("OWNER")).toBe(true);
    expect(canEdit("EDITOR")).toBe(true);
    expect(canEdit("VIEWER")).toBe(false);
  });

  it("detects only owner role as owner", () => {
    expect(isOwner("OWNER")).toBe(true);
    expect(isOwner("EDITOR")).toBe(false);
    expect(isOwner("VIEWER")).toBe(false);
  });
});
