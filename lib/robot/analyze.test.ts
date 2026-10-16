import { describe, expect, it } from "vitest";
import { IMPORT_RIG_RANGE, estimateType, structureFromReading } from "./analyze";

const file = { name: "arm.glb", size: 1000, path: "p-1/model/arm.glb" };

describe("model analysis", () => {
  it("bones → joints with unique ids and ±90° rig", () => {
    const s = structureFromReading({ format: "glb", meshes: 3, vertices: 900, bones: ["Base", "Arm.L", "", "Arm L"] }, file);
    expect(s.source).toBe("import");
    expect(s.file).toEqual(file);
    expect(s.joints.map((j) => j.id)).toEqual(["base", "arm_l", "joint_3", "arm_l_2"]);
    expect(s.joints[2].label).toBe("Joint 3");
    expect(s.joints.every((j) => j.rigMin === -IMPORT_RIG_RANGE && j.max === IMPORT_RIG_RANGE)).toBe(true);
  });

  it("no bones → NO_RIG (E2)", () => {
    expect(() => structureFromReading({ format: "stl", meshes: 1, vertices: 30, bones: [] }, file)).toThrow(
      expect.objectContaining({ code: "NO_RIG" }),
    );
  });

  it("estimates a type from bone names", () => {
    expect(estimateType(["base", "shoulder", "elbow", "head"])).toBe("joint-fixed");
    expect(estimateType(["hip_l", "knee_l", "hip_r", "knee_r", "neck"])).toBe("joint-walking");
    expect(estimateType(["wheel_l", "wheel_r"])).toBe("jointless-driving");
    expect(estimateType(["wheel_l", "wheel_r", "neck"])).toBe("joint-driving");
    expect(estimateType(Array.from({ length: 20 }, (_, i) => `b${i}`))).toBe("full-body");
  });
});
