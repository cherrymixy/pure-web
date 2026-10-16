import { Memory } from "lowdb";
import { describe, expect, it } from "vitest";
import { ROBOT_DEVICE_STRUCTURES } from "@/data/robot-devices";
import { seedDb } from "@/data/seed";
import type { Db } from "../models";
import { LowRepo } from "../repo-lowdb";
import { compatibility } from "./compat";

describe("dummy robot targets", () => {
  it("Purebot Desk is ready, Studio arm needs the fallback for face/sound", async () => {
    const repo = new LowRepo(new Memory<Db>(), { seed: seedDb });
    const e = (await repo.library.list()).find((s) => s.channels.includes("sound"))!;
    expect(compatibility(e, { name: "Purebot Desk", structure: ROBOT_DEVICE_STRUCTURES["r-purebot-desk"] })).toEqual([]);
    const arm = compatibility(e, { name: "Studio arm", structure: ROBOT_DEVICE_STRUCTURES["r-studio-arm"] });
    expect(arm.filter((i) => i.kind === "channel").map((i) => i.channel).sort()).toEqual(["face", "sound"]);
  });
});
