import type { RobotDevice } from "@/lib/models";

/**
 * The physical PURE robot (ESP32 "Robot-ESP32" Wi-Fi AP, firmware in hardware/esp32_servo_wifi).
 * Join the robot's Wi-Fi, run the web locally (`npm run dev`) and pick it in "Test on your robot".
 *
 * Each motor follows one sim joint 1:1 in degrees: `sim[0]` maps to `motor[0]`, `sim[1]` to `motor[1]` (swap the two
 * motor values to flip the direction). Motor angles are relative to each motor's measured zero (the firmware adds
 * Mx_ZERO), clamped to `safe` — the measured range, which the firmware enforces again. Measured 2026-11-24.
 * Sim directions: base_yaw + = left, head_pan + = left, shoulder_pitch + = forward, elbow_pitch − = up.
 */
export const REAL_ROBOT = {
  device: { id: "r-pure-real", name: "PURE (real robot)", type: "joint-fixed", online: false } satisfies RobotDevice,
  address: "http://192.168.4.1",
  motors: [
    // M4: turns everything above the base. Motor + = left (same as sim).
    { key: "m4", joint: "base_yaw", sim: [-45, 45], motor: [-45, 45], safe: [-45, 45] },
    // M3: swings the lower arm forward/back in the dome. Motor + = forward (same as sim), −10 back to +35 forward.
    { key: "m3", joint: "shoulder_pitch", sim: [-45, 45], motor: [-45, 45], safe: [-10, 35] },
    // M2: elbow. Motor + = up, sim − = up → flipped. ±20.
    { key: "m2", joint: "elbow_pitch", sim: [-45, 45], motor: [45, -45], safe: [-20, 20] },
    // M1: turns the head (via RP2350). Motor + = right, sim + = left → flipped.
    { key: "m1", joint: "head_pan", sim: [-45, 45], motor: [45, -45], safe: [-45, 45] },
  ],
} as const;
