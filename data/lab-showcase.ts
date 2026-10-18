import type { RobotType } from "@/lib/models";

// Lab home shows these six projects only, in this order, each with its own render (public/lab/showcase).
// `type` is the robot the picture shows — the card tag follows it.
export interface ShowcaseCard {
  projectId: string;
  image: string;
  type: RobotType;
}

export const LAB_SHOWCASE: ShowcaseCard[] = [
  { projectId: "p-surprising", image: "/lab/showcase/pod.png", type: "jointless-driving" },
  { projectId: "p-sleepy-robot", image: "/lab/showcase/desk-round.png", type: "joint-fixed" },
  { projectId: "p-test-final", image: "/lab/showcase/wheeled-humanoid.png", type: "joint-driving" },
  { projectId: "p-test-01", image: "/lab/showcase/desk-arm.png", type: "joint-fixed" },
  { projectId: "p-mini-rover", image: "/lab/showcase/mini-rover.png", type: "jointless-driving" },
  { projectId: "p-purebot-dog", image: "/lab/showcase/bear.png", type: "joint-walking" },
];
