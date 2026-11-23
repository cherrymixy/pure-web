import type { RobotDevice } from "@/lib/models";

/**
 * The physical PURE robot (ESP32 "Robot-ESP32" Wi-Fi AP, firmware in hardware/esp32_servo_wifi).
 * Join the robot's Wi-Fi, run the web locally (`npm run dev`) and pick it in "Test on your robot".
 *
 * Each motor follows one sim joint: `sim[0]` maps to `motor[0]`, `sim[1]` to `motor[1]` (linear; swap the
 * two motor values to flip the direction). The result is clamped to `safe` — the confirmed range, which the
 * firmware enforces again.
 * shortcut: M2/M3 direction and zero are estimated from the drawings, re-check on the real robot and edit here.
 */
export const REAL_ROBOT = {
  device: { id: "r-pure-real", name: "PURE (real robot)", type: "joint-fixed", online: false } satisfies RobotDevice,
  address: "http://192.168.4.1",
  motors: [
    // M4: turns everything above the base
    { key: "m4", joint: "base_yaw", sim: [-45, 45], motor: [-45, 45], safe: [-45, 45] },
    // M3: swings the lower arm forward/back in the dome (sim + leans forward → motor −)
    { key: "m3", joint: "shoulder_pitch", sim: [-28, 41], motor: [5, -60], safe: [-60, 5] },
    // M2: elbow
    { key: "m2", joint: "elbow_pitch", sim: [-34, 10], motor: [80, 40], safe: [40, 80] },
    // M1: turns the head left/right (via RP2350)
    { key: "m1", joint: "head_pan", sim: [-45, 45], motor: [-45, 45], safe: [-45, 45] },
  ],
} as const;
