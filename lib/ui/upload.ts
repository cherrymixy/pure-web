/** PUT a file/blob to /api/upload (streamed to data/uploads/{projectId}/{kind}/). */
export async function uploadFile(blob: Blob, opts: { projectId: string; kind: string; name: string }): Promise<{ path: string; size: number; name: string }> {
  const q = new URLSearchParams({ projectId: opts.projectId, kind: opts.kind, name: opts.name });
  const res = await fetch(`/api/upload?${q}`, { method: "PUT", body: blob });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error?.message ?? `Upload failed (${res.status})`);
  return json;
}

export const fileUrl = (path: string) => `/api/files/${path.split("/").map(encodeURIComponent).join("/")}`;
