import { describe, expect, it } from "vitest";
import { PROMPT_DEMOS } from "@/data/demo-recipes";
import { PURE_ROVER_STRUCTURE } from "@/data/pure-rover";
import { PURE_DEFAULT_SIGNATURE } from "@/data/signature";
import { demoToOutput } from "../llm/generation";
import { buildExpression, recipeToClip } from ".";
import { sampleRecipe, robotOf } from "./sample";

describe("generation on the PURE Rover", () => {
  it("samples recipes in the rover's own joints, inside its ranges", () => {
    const robot = robotOf(PURE_ROVER_STRUCTURE);
    expect(robot.id).toBe("pure-rover");
    for (const demo of Object.values(PROMPT_DEMOS)) {
      const { expression } = buildExpression(demoToOutput(demo), { structure: PURE_ROVER_STRUCTURE, signature: PURE_DEFAULT_SIGNATURE });
      const recipe = expression.motion.recipe;
      const { frames } = sampleRecipe(recipe, {}, 30, robot);
      for (const j of PURE_ROVER_STRUCTURE.joints) {
        for (const f of frames) {
          expect(Number.isFinite(f.pose[j.id])).toBe(true);
        }
      }
      const clip = recipeToClip(recipe, {}, PURE_ROVER_STRUCTURE);
      expect(Object.keys(clip.tracks).sort()).toEqual(PURE_ROVER_STRUCTURE.joints.map((j) => j.id).sort());
    }
  });
});
