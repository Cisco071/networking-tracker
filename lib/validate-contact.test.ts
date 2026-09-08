import { describe, expect, it } from "vitest";
import { validateContact } from "./validate-contact";

describe("validateContact", () => {
  it("rejects an empty name", () => {
    const result = validateContact({ name: "", priority: "high" });
    expect(result.valid).toBe(false);
    expect(result.errors.name).toBe("Name is required.");
  });

  it("rejects a whitespace-only name", () => {
    const result = validateContact({ name: "   ", priority: "high" });
    expect(result.valid).toBe(false);
    expect(result.errors.name).toBe("Name is required.");
  });

  it.each(["high", "medium", "low"] as const)(
    "accepts a valid name with priority %s",
    (priority) => {
      const result = validateContact({ name: "Ada Lovelace", priority });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    },
  );

  it("rejects an invalid priority value", () => {
    const result = validateContact({ name: "Ada Lovelace", priority: "urgent" });
    expect(result.valid).toBe(false);
    expect(result.errors.priority).toBe("Priority must be high, medium, or low.");
  });

  it("reports both errors when name and priority are both invalid", () => {
    const result = validateContact({ name: "", priority: "urgent" });
    expect(result.valid).toBe(false);
    expect(result.errors.name).toBeDefined();
    expect(result.errors.priority).toBeDefined();
  });

  it("treats optional fields as genuinely optional", () => {
    const result = validateContact({ name: "Ada Lovelace", priority: "low" });
    expect(result.valid).toBe(true);
  });
});
