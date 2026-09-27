// Turns the team's citation manifest (DATA_SOURCES.md) into the JSON the
// /resources page renders: the dataset catalog, license obligations,
// legal-feasibility files, AI services, sources not used and methodology
// references. Map layers and pillar indicators are NOT copied from it; the
// page reads those live from the overlay registry and pillars.config.json.
//
//   bun scripts/data/resources-catalog.ts <path/to/DATA_SOURCES.md>

const input = process.argv[2];
if (!input) throw new Error("usage: bun scripts/data/resources-catalog.ts <DATA_SOURCES.md>");
const OUT = new URL("../../src/lib/resources/catalog.generated.json", import.meta.url);

const lines = (await Bun.file(input).text()).split("\n");

type Row = Record<string, string>;

function splitRow(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  const body = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  for (let i = 0; i < body.length; i++) {
    if (body[i] === "\\" && body[i + 1] === "|") {
      cell += "|";
      i++;
    } else if (body[i] === "|") {
      cells.push(cell.trim());
      cell = "";
    } else cell += body[i];
  }
  cells.push(cell.trim());
  return cells;
}

// Lines of the section that starts at a heading matching `heading`, up to the
// next heading of the same or higher level.
function section(heading: RegExp): string[] {
  const start = lines.findIndex((l) => heading.test(l));
  if (start === -1) throw new Error(`section not found: ${heading}`);
  const level = lines[start].match(/^#+/)![0].length;
  const end = lines.findIndex((l, i) => i > start && /^#+ /.test(l) && l.match(/^#+/)![0].length <= level);
  return lines.slice(start + 1, end === -1 ? undefined : end);
}

// `keys` maps each output key to a pattern matching its column header, so
// tables with fewer columns (e.g. cameras have no vintage) still line up.
function tables(body: string[], keys: Record<string, RegExp>): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < body.length; i++) {
    if (!body[i].startsWith("|") || !body[i + 1]?.startsWith("|---")) continue;
    const header = splitRow(body[i]);
    const index = Object.fromEntries(Object.entries(keys).map(([k, re]) => [k, header.findIndex((h) => re.test(h))]));
    i += 2;
    for (; i < body.length && body[i].startsWith("|"); i++) {
      const cells = splitRow(body[i]);
      rows.push(Object.fromEntries(Object.keys(keys).map((k) => [k, index[k] === -1 ? "" : (cells[index[k]] ?? "")])));
    }
  }
  return rows;
}

const catalog: (Row & { theme: string })[] = [];
const themeBody = section(/^## 2\. /);
let theme = "";
let chunk: string[] = [];
const flush = () => {
  if (theme) for (const row of tables(chunk, { dataset: /^Dataset|^Camera/, source: /^Source/, vintage: /^Vintage/, license: /^License/, usedIn: /^Used in/ })) catalog.push({ theme, ...row });
  chunk = [];
};
for (const line of themeBody) {
  const m = line.match(/^### [\d.]+ (.*)$/);
  if (m) {
    flush();
    theme = m[1];
  } else chunk.push(line);
}
flush();

const links = (body: string[]) =>
  body.flatMap((l) => {
    const m = l.match(/^- \[([^\]]+)\]\(([^)]+)\)/);
    return m ? [m[2]] : [];
  });

const result = {
  generatedFrom: "DATA_SOURCES.md (low-level data session, compiled 2026-09-27)",
  licenses: tables(section(/^## 1\. /), { source: /^Source/, terms: /^License/, obligation: /^What we must/ }),
  catalog,
  legalFiles: tables(section(/^## 5\. /), { file: /^File/, sources: /^Primary/ }),
  services: tables(section(/^## 6\. /), { service: /^Service/, use: /^How/, endpoint: /^Endpoint/ }),
  notUsed: tables(section(/^## 8\. /), { source: /^Source/, reason: /^Why/ }),
  methodology: links(section(/^## 9\. /)),
};

await Bun.write(OUT, `${JSON.stringify(result, null, 1)}\n`);
console.log(
  `catalog ${catalog.length}, licenses ${result.licenses.length}, legal files ${result.legalFiles.length}, services ${result.services.length}, not used ${result.notUsed.length}, methodology ${result.methodology.length}`,
);
