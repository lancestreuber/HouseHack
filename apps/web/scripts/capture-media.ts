import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Locator, type Page } from "playwright";

const BASE = process.env.CAPTURE_BASE ?? "http://localhost:3001";
const PIN = process.env.CAPTURE_PIN ?? "0001N00154000000";
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public/media");
const TMP = path.join(OUT, ".tmp");

const VIDEO_CSS = `
header, nav, aside, .maplibregl-control-container { display: none !important; }
.maplibregl-map ~ * { display: none !important; }
#tsqd-parent-container, .tsqd-parent-container, .react-query-devtools, .ReactQueryDevtools, footer.TanStackRouterDevtools { display: none !important; }
`;

const SHOT_CSS = `
.maplibregl-control-container, #tsqd-parent-container, .tsqd-parent-container, .react-query-devtools, .ReactQueryDevtools, footer.TanStackRouterDevtools { display: none !important; }
`;

function ffmpeg(args: string[]) {
  const res = spawnSync("ffmpeg", args, { stdio: "pipe" });
  if (res.status !== 0) {
    throw new Error(`ffmpeg failed: ${res.stderr?.toString().slice(-1200)}`);
  }
}

async function detectExplorerPath(page: Page): Promise<string> {
  for (const candidate of ["/app", "/"]) {
    try {
      await page.goto(`${BASE}${candidate}`);
      await page.waitForSelector(".maplibregl-canvas", { timeout: 8000 });
      return candidate;
    } catch {
      // try next candidate
    }
  }
  throw new Error(`no explorer map found at ${BASE}/app or ${BASE}/ — is the dev server running?`);
}

async function ensureToggled(button: Locator) {
  const cls = await button.getAttribute("class");
  if (!cls?.includes("bg-foreground")) await button.click();
}

async function shoot(page: Page, name: string) {
  const png = path.join(TMP, `${name}.png`);
  await page.screenshot({ path: png });
  ffmpeg(["-y", "-i", png, "-c:v", "libwebp", "-quality", "82", path.join(OUT, `${name}.webp`)]);
}

async function main() {
  mkdirSync(TMP, { recursive: true });
  const browser = await chromium.launch();

  const probe = await browser.newContext();
  const explorer = await detectExplorerPath(await probe.newPage());
  await probe.close();
  console.log(`explorer route: ${explorer}`);

  const videoContext = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: TMP, size: { width: 1280, height: 720 } },
  });
  const videoPage = await videoContext.newPage();
  const recordingStart = Date.now();
  await videoPage.goto(`${BASE}${explorer}?pin=${PIN}`);
  await videoPage.waitForSelector(".maplibregl-canvas", { timeout: 20000 });
  await videoPage.waitForLoadState("networkidle");
  await videoPage.waitForTimeout(3500);
  await videoPage.click('button[title="Map options"]');
  await ensureToggled(videoPage.getByRole("button", { name: "2.5D", exact: true }));
  await videoPage.waitForTimeout(2500);
  await ensureToggled(videoPage.getByRole("button", { name: "Spin", exact: true }));
  const spinStart = Date.now();
  await videoPage.keyboard.press("Escape");
  await videoPage.addStyleTag({ content: VIDEO_CSS });
  await videoPage.waitForTimeout(2500);
  await videoPage.screenshot({ path: path.join(TMP, "poster.png") });
  await videoPage.waitForTimeout(60000);
  const video = videoPage.video();
  await videoContext.close();
  const webm = await video!.path();

  const offset = (spinStart - recordingStart) / 1000 + 2.5;
  ffmpeg([
    "-y",
    "-ss",
    offset.toFixed(2),
    "-t",
    "60",
    "-i",
    webm,
    "-an",
    "-vf",
    "scale=1280:720",
    "-c:v",
    "libx264",
    "-crf",
    "33",
    "-preset",
    "medium",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-r",
    "30",
    path.join(OUT, "hero-spin.mp4"),
  ]);
  ffmpeg(["-y", "-i", path.join(TMP, "poster.png"), "-c:v", "libwebp", "-quality", "82", path.join(OUT, "hero-poster.webp")]);

  const shotContext = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
  const page = await shotContext.newPage();
  await page.goto(`${BASE}${explorer}?pin=${PIN}`);
  await page.waitForSelector(".maplibregl-canvas", { timeout: 20000 });
  await page.waitForLoadState("networkidle");
  await page.addStyleTag({ content: SHOT_CSS });
  await page.waitForTimeout(4000);

  await page.getByRole("tab", { name: "Alerts" }).click();
  await page.waitForTimeout(1200);
  await shoot(page, "section-01");

  await page.getByRole("button", { name: /^Hazards/ }).click();
  await page.getByText("Steep slopes", { exact: true }).click();
  await page.getByRole("tab", { name: "Typology" }).click();
  await page.waitForTimeout(5000);
  await shoot(page, "section-02");

  await page.getByRole("tab", { name: "Chat" }).click();
  await page.fill('textarea[aria-label="Your question"]', "Why is the overall score 50?");
  await page.click('button[aria-label="Send"]');
  let chatOk = true;
  try {
    await page.waitForFunction(() => !document.querySelector('[aria-label="Assistant is thinking"]'), { timeout: 90000 });
  } catch {
    chatOk = false;
  }
  if (chatOk && (await page.getByText("no API key").count())) chatOk = false;
  if (!chatOk) {
    await page.goto(`${BASE}${explorer}?pin=${PIN}`);
    await page.waitForSelector(".maplibregl-canvas", { timeout: 20000 });
    await page.waitForLoadState("networkidle");
    await page.addStyleTag({ content: SHOT_CSS });
    await page.waitForTimeout(4000);
    await page.getByRole("tab", { name: "Chat" }).click();
    await page.fill('textarea[aria-label="Your question"]', "Why is the overall score 50?");
    await page.waitForTimeout(800);
  } else {
    await page.waitForTimeout(1500);
  }
  await shoot(page, "section-03");

  await shotContext.close();
  await browser.close();
  rmSync(TMP, { recursive: true, force: true });

  for (const f of ["hero-spin.mp4", "hero-poster.webp", "section-01.webp", "section-02.webp", "section-03.webp"]) {
    const size = statSync(path.join(OUT, f)).size;
    console.log(`${f}: ${(size / 1024 / 1024).toFixed(2)} MB`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
