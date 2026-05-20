import { describe, expect, it } from "vitest";
import { formatNumber, truncate } from "@/utils/formatters";

describe("formatters", () => {
  it("formats numbers with separators", () => {
    expect(formatNumber(1234.5678, 2)).toMatch(/1,234\.57|1.234,57/);
  });

  it("returns dash for null", () => {
    expect(formatNumber(null)).toBe("—");
  });

  it("truncates long strings", () => {
    expect(truncate("hello world", 6)).toBe("hello…");
  });
});
