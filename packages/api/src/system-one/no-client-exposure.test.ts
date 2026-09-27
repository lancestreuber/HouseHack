import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// The System One key must only be read on the server. In apps/web it may appear
// only where server services are created, and the committed schema must hold no value.
const WEB = join(import.meta.dir, "../../../../apps/web");
const SERVER_ONLY = new Set(["src/services.ts", "src/context.ts", "src/env.ts"]);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

describe("System One credentials stay server-side", () => {
  const files = sourceFiles(join(WEB, "src")).map((path) => ({
    rel: relative(WEB, path).replaceAll("\\", "/"),
    text: readFileSync(path, "utf8"),
  }));

  test("only server modules reference the key or the System One client", () => {
    const offenders = files
      .filter(({ rel }) => !SERVER_ONLY.has(rel))
      .filter(({ text }) => text.includes("OPENROUTER_API_KEY") || text.includes("system-one"))
      .map(({ rel }) => rel);
    expect(offenders).toEqual([]);
  });

  test("the key is not exposed through a public env variable", () => {
    const schema = readFileSync(join(WEB, ".env.schema"), "utf8");
    const block = schema.slice(0, schema.indexOf("OPENROUTER_API_KEY="));
    const decorators = block.slice(block.lastIndexOf("\n\n"));
    expect(decorators).not.toContain("@public");
    expect(schema).toMatch(/^OPENROUTER_API_KEY=$/m);
  });
});
