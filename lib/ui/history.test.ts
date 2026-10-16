import { describe, expect, it } from "vitest";
import { MAX_CHANGES, describeChange, describeFields, emptyHistory, pushChange, undoChange } from "./history";

describe("change history", () => {
  it("undo restores the state before the latest change, in order", () => {
    let h = emptyHistory<number>();
    h = pushChange(h, "a", 85, 60);
    h = pushChange(h, "b", 60, 40);
    const u1 = undoChange(h)!;
    expect(u1.restore).toBe(60);
    expect(u1.change.label).toBe("b");
    const u2 = undoChange(u1.history)!;
    expect(u2.restore).toBe(85);
    expect(undoChange(u2.history)).toBeNull();
  });

  it("is bounded", () => {
    let h = emptyHistory<number>();
    for (let i = 0; i < MAX_CHANGES + 5; i++) h = pushChange(h, String(i), i, i + 1);
    expect(h.changes).toHaveLength(MAX_CHANGES);
    expect(h.changes[0].label).toBe("5");
  });

  it("describes changed fields", () => {
    expect(describeChange({ speed: 85, amplitude: 50 }, { speed: 60, amplitude: 50 }, { speed: "Speed" })).toBe("Speed 85 → 60");
  });
});

describe("describeFields", () => {
  it("formats numbers with per-field digits and strings as is", () => {
    expect(
      describeFields(
        { eyeSize: 1, browAngle: -12, preset: "sleepy" },
        { eyeSize: 1.2, browAngle: -6, preset: "happy" },
        { eyeSize: { label: "Eye size", digits: 2 }, browAngle: { label: "Brow angle" }, preset: { label: "Face" } },
      ),
    ).toEqual(["Eye size 1.00 → 1.20", "Brow angle -12 → -6", "Face sleepy → happy"]);
  });

  it("ignores changes below the shown precision", () => {
    expect(describeFields({ v: 1.001 }, { v: 1.002 }, { v: { label: "V", digits: 2 } })).toEqual([]);
  });
});
