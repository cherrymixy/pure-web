// @implemented
// @screen dev/expression
import fs from "node:fs";
import path from "node:path";
import { ExpressionLab, type LlmSample } from "./_components/expression-lab";

export const dynamic = "force-dynamic";

/** STEP 6 raw model outputs (docs/samples/gen-*.json) feed the validation bench. */
function loadSamples(): LlmSample[] {
  const dir = path.join(process.cwd(), "docs/samples");
  return fs
    .readdirSync(dir)
    .filter((f) => /^gen-.*\.json$/.test(f))
    .map((f) => {
      const data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      return { id: f.replace(/^gen-|\.json$/g, ""), prompt: data.prompt, output: data.output };
    });
}

export default function DevExpressionPage() {
  return <ExpressionLab samples={loadSamples()} />;
}
