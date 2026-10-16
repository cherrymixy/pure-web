import fs from "node:fs";
import path from "node:path";

export type DevRoute = {
  route: string; // URL pattern, e.g. /lab/p/[id]
  href: string; // openable sample URL
  screen: string | null; // from `// @screen <ID>`
  implemented: boolean; // `// @implemented` in page.tsx (custom page exports break next build)
  file: string; // repo-relative
};

const APP_DIR = path.join(process.cwd(), "app");
const IMPLEMENTED = /^\/\/\s*@implemented\b/m;
const SCREEN = /^\/\/\s*@screen\s+(.+)$/m;

// Sample values used to make dynamic segments clickable.
const SAMPLE: Record<string, string> = { id: "test", shareId: "test" };

function walk(dir: string, out: string[]) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      // api/ has no pages; _private folders are not routes.
      if (entry.name === "api" || entry.name.startsWith("_")) continue;
      walk(path.join(dir, entry.name), out);
    } else if (entry.name === "page.tsx") {
      out.push(path.join(dir, entry.name));
    }
  }
}

function toRoute(segments: string[]) {
  const visible = segments.filter((s) => !(s.startsWith("(") && s.endsWith(")")));
  const route = "/" + visible.join("/");
  const href =
    "/" +
    visible
      .map((s) => {
        if (s.startsWith("[[...")) return "";
        const m = s.match(/^\[(?:\.\.\.)?(.+)\]$/);
        return m ? (SAMPLE[m[1]] ?? "test") : s;
      })
      .filter(Boolean)
      .join("/");
  return { route, href };
}

export function collectRoutes(): DevRoute[] {
  const files: string[] = [];
  walk(APP_DIR, files);
  return files
    .map((file) => {
      const src = fs.readFileSync(file, "utf8");
      const segments = path.relative(APP_DIR, path.dirname(file)).split(path.sep).filter(Boolean);
      return {
        ...toRoute(segments),
        screen: src.match(SCREEN)?.[1].trim() ?? null,
        implemented: IMPLEMENTED.test(src),
        file: path.relative(process.cwd(), file),
      };
    })
    .sort((a, b) => a.route.localeCompare(b.route));
}
