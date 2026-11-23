import { readFile } from "node:fs/promises";
import path from "node:path";

// The ESP32 firmware template; the editor fills in the motion (lib/robot-firmware.ts).
export async function GET() {
  const text = await readFile(path.join(process.cwd(), "hardware/esp32_servo_wifi/esp32_servo_wifi.ino"), "utf8");
  return new Response(text, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
