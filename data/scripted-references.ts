import type { DemoExpression } from "./demo-recipes";
import { cueAt } from "./sound-cues";

// Exhibition script: a known reference video (matched by file SHA-256) always yields the same expression.
// The generator is skipped for it; every other input still goes to the LLM.

export interface ScriptedReference {
  id: string;
  /** SHA-256 of the uploaded video file */
  sha256: string[];
  /** Stands in for the vision summary of the video */
  summary: string;
  /** Component chips recorded on the expression (the Context tab lists Approach + these) */
  components: string[];
  expression: DemoExpression;
  /** Minimum time the generate job takes, so the steps read like a real run */
  minMs: number;
}

export const SCRIPTED_REFERENCES: ScriptedReference[] = [
  {
    id: "happy",
    // ~/Downloads/시연영상/happy.mp4 (Pexels 6194810 "A Man Celebrating Success", 720p)
    sha256: ["a08a53c790f35a99d3032d236bee184bcdfac6e4aaffcfb65bdfbb6fcfaac8e9"],
    summary: "A man laughs and pumps his fists, bouncing side to side in celebration — pure joy.",
    components: ["approach", "joy"],
    minMs: 4200,
    expression: {
      name: "Happy dance",
      currentStatus: "I'm so happy I can't stop dancing!",
      reasoning: "It leans in close to share the moment, then bounces side to side with a beaming face and cheerful chatter.",
      // Approach (lean in, ~3 s) then the dance. Tuned so validation only trims amplitude to joint limits:
      // faster bounces or bigger props get slowed by the 120°/s rule and push the last step past the 15 s cap.
      motion: {
        recipe: {
          steps: [
            { behavior: "focus", speed: 1.5, amplitude: 0.3, repeat: 1, face: "smile" },
            { behavior: "happy", speed: 1.12, amplitude: 1, repeat: 2, face: "heart" },
            { behavior: "nod", speed: 1.5, amplitude: 0.6, repeat: 1, face: "smile" },
            { behavior: "happy", speed: 1.12, amplitude: 1.1, repeat: 1, face: "heart" },
          ],
        },
        props: { amplitude: 50, duration: 50, smoothness: 50, speed: 50, frequency: 50 },
      },
      face: { preset: "heart" },
      sound: { cues: [cueAt("robot-happy", 0.4), cueAt("robot-happy", 3.4), cueAt("robot-happy", 6.2), cueAt("robot-happy", 10)] },
    },
  },
];
