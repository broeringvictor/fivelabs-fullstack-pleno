import { describe, it, expect } from "vitest";
import { ConditionValue } from "../value-objects/condition-value.js";

describe("ConditionValue", () => {
  it("accepts scalar for GT operator", () => {
    expect(ConditionValue.create("GT", 1000).ok).toBe(true);
  });

  it("rejects array for GT operator", () => {
    expect(ConditionValue.create("GT", [1, 2]).ok).toBe(false);
  });

  it("accepts array for IN operator", () => {
    expect(ConditionValue.create("IN", ["SP", "RJ"]).ok).toBe(true);
  });

  it("rejects scalar for IN operator", () => {
    expect(ConditionValue.create("IN", "SP").ok).toBe(false);
  });

  it("rejects empty array for IN operator", () => {
    expect(ConditionValue.create("IN", []).ok).toBe(false);
  });
});
