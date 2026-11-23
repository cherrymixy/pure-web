import { expect, test } from "vitest";
import { parseSize } from "./parse-size";

test("parseSize reads token size values", () => {
  expect(parseSize("12°")).toEqual([12, 12, "°"]);
  expect(parseSize("30–90°")).toEqual([30, 90, "°"]);
  expect(parseSize("30 to 90°")).toEqual([30, 90, "°"]);
  expect(parseSize("±30° left-right")).toEqual([-30, 30, "°"]);
  expect(parseSize("−6 st")).toEqual([-6, -6, "st"]);
  expect(parseSize("≤ 0.1 s")).toEqual([0.1, 0.1, "s"]);
  expect(parseSize("0.10 BH, height −5%")).toEqual([0.1, 0.1, "BH"]);
  expect(parseSize("1.4×")).toEqual([1.4, 1.4, "×"]);
  expect(parseSize("Until the other person finishes speaking")).toBeNull();
});
