import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { SCRIPTED_REFERENCES, type ScriptedReference } from "@/data/scripted-references";
import type { Reference } from "../models";
import { UPLOADS_DIR } from "../paths";

const hashes = new Map<string, string | null>();

async function sha256(abs: string): Promise<string | null> {
  if (hashes.has(abs)) return hashes.get(abs)!;
  const digest = await new Promise<string | null>((resolve) => {
    const h = createHash("sha256");
    fs.createReadStream(abs)
      .on("data", (chunk) => h.update(chunk))
      .on("end", () => resolve(h.digest("hex")))
      .on("error", () => resolve(null));
  });
  hashes.set(abs, digest);
  return digest;
}

/** The scripted reference for the first attached video whose file matches one (data/scripted-references.ts). */
export async function matchScripted(refs: Reference[], root = UPLOADS_DIR): Promise<ScriptedReference | null> {
  for (const r of refs.filter((x) => x.kind === "video")) {
    const abs = path.resolve(root, r.path);
    if (!abs.startsWith(path.resolve(root) + path.sep)) continue;
    const digest = await sha256(abs);
    const hit = digest && SCRIPTED_REFERENCES.find((s) => s.sha256.includes(digest));
    if (hit) return hit;
  }
  return null;
}

export const pause = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(Object.assign(new Error("canceled"), { code: "CANCELED" }));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(Object.assign(new Error("canceled"), { code: "CANCELED" }));
    });
  });
