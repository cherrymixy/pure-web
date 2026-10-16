import "server-only";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { UPLOADS_DIR } from "./paths";
import { RepoError } from "./repo";

const MB = 1024 * 1024;

export const UPLOAD_KINDS = {
  model: { exts: [".glb", ".obj", ".stl"], max: 500 * MB },
  pdf: { exts: [".pdf"], max: 200 * MB },
  video: { exts: [".mp4", ".mov", ".webm"], max: 200 * MB },
  image: { exts: [".png", ".jpg", ".jpeg", ".webp", ".gif"], max: 20 * MB },
  frame: { exts: [".png", ".jpg", ".jpeg", ".webp"], max: 20 * MB },
  thumb: { exts: [".png", ".jpg", ".jpeg", ".webp"], max: 20 * MB },
} as const;
export type UploadKind = keyof typeof UPLOAD_KINDS;

const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** Stream a request body to data/uploads/{scope}/{kind}/…, aborting past the size limit. */
export async function saveUpload(
  req: Request,
  opts: { scope: string; kind: string; name: string },
): Promise<{ path: string; size: number; name: string }> {
  const spec = UPLOAD_KINDS[opts.kind as UploadKind];
  if (!spec) throw new RepoError("VALIDATION", `Unknown upload kind: ${opts.kind}`);
  if (!SAFE_ID.test(opts.scope)) throw new RepoError("VALIDATION", "Invalid project id");
  const base = path.basename(opts.name).replace(/[^\w.\- ]/g, "_");
  const ext = path.extname(base).toLowerCase();
  if (!(spec.exts as readonly string[]).includes(ext)) {
    throw new RepoError("UNSUPPORTED", `Use ${spec.exts.join(", ")} for ${opts.kind}`);
  }
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > spec.max) throw new RepoError("TOO_LARGE", `File is larger than ${spec.max / MB}MB`);
  if (!req.body) throw new RepoError("VALIDATION", "Empty body");

  const rel = path.join(opts.scope, opts.kind, `${randomUUID().slice(0, 8)}-${base}`);
  const abs = path.join(UPLOADS_DIR, rel);
  await fs.promises.mkdir(path.dirname(abs), { recursive: true });

  let size = 0;
  const limit = new Transform({
    transform(chunk: Buffer, _enc, cb) {
      size += chunk.length;
      if (size > spec.max) cb(new RepoError("TOO_LARGE", `File is larger than ${spec.max / MB}MB`));
      else cb(null, chunk);
    },
  });
  try {
    await pipeline(Readable.fromWeb(req.body as import("node:stream/web").ReadableStream), limit, fs.createWriteStream(abs));
  } catch (err) {
    await fs.promises.rm(abs, { force: true });
    throw err;
  }
  return { path: rel.split(path.sep).join("/"), size, name: base };
}

const TYPES: Record<string, string> = {
  ".glb": "model/gltf-binary", ".obj": "text/plain", ".stl": "model/stl", ".pdf": "application/pdf",
  ".mp4": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
};

/** Serve an uploaded file (with Range for video seeking). Paths outside data/uploads are refused. */
export async function serveUpload(rel: string, req: Request): Promise<Response> {
  const abs = path.resolve(UPLOADS_DIR, rel);
  if (!abs.startsWith(UPLOADS_DIR + path.sep)) throw new RepoError("NOT_FOUND", "File not found");
  const stat = await fs.promises.stat(abs).catch(() => null);
  if (!stat?.isFile()) throw new RepoError("NOT_FOUND", "File not found");
  const type = TYPES[path.extname(abs).toLowerCase()] ?? "application/octet-stream";
  const range = req.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), stat.size - 1) : stat.size - 1;
    const stream = Readable.toWeb(fs.createReadStream(abs, { start, end })) as ReadableStream;
    return new Response(stream, {
      status: 206,
      headers: {
        "content-type": type,
        "content-length": String(end - start + 1),
        "content-range": `bytes ${start}-${end}/${stat.size}`,
        "accept-ranges": "bytes",
      },
    });
  }
  const stream = Readable.toWeb(fs.createReadStream(abs)) as ReadableStream;
  return new Response(stream, {
    headers: { "content-type": type, "content-length": String(stat.size), "accept-ranges": "bytes" },
  });
}
