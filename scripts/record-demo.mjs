// Records a scroll-through video of the site for the README.
//
//   npm run demo                      → docs/demo.mp4
//   npm run demo -- --gif             → also docs/demo.gif
//   DEMO_URL=http://localhost:4321 DEMO_SECONDS=25 npm run demo
//   DEMO_KEEP=1 npm run demo          → keeps the raw frames in docs/.recording
//
// First run only: npx playwright install chromium
//
// Playwright's built-in recordVideo is 1x and heavily compressed (VP8 at ~1 Mbit/s),
// so frames come straight from Chrome's screencast instead: Retina (2x), near-lossless
// JPEG, each with its real timestamp, then encoded once with x264.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";

const URL = process.env.DEMO_URL ?? "https://asdelicias-dacelia.com/";
const SCROLL_SECONDS = Number(process.env.DEMO_SECONDS ?? 15);
const HOLD_START = 2; // seconds on the hero before scrolling
const HOLD_END = 2; // seconds at the bottom
const size = { width: 1440, height: 900 };
const SCALE = 2; // device pixel ratio of the capture
const OUTPUT_WIDTH = 1920;
// GitHub refuses videos over 10 MB: the encoder spends exactly this budget,
// so a shorter scroll gets more bits per second and comes out sharper.
const TARGET_BYTES = 9_300_000;
const OUT = "docs";
const TMP = `${OUT}/.recording`;

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: size, deviceScaleFactor: SCALE });
const page = await context.newPage();

await page.goto(URL, { waitUntil: "networkidle" });

// Load every lazy image up front so nothing pops in while scrolling.
await page.evaluate(async () => {
  const imgs = [...document.images];
  imgs.forEach((img) => (img.loading = "eager"));
  await Promise.all(imgs.map((img) => img.decode().catch(() => {})));
  await document.fonts.ready;
});
await page.waitForTimeout(2500); // let the hero intro animation finish

// Chrome only sends a frame when the page changes, so each one keeps its timestamp
// and becomes a duration in ffmpeg's concat list.
const cdp = await context.newCDPSession(page);
const frames = [];
cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
  const file = `frame-${String(frames.length).padStart(5, "0")}.jpg`;
  writeFileSync(`${TMP}/${file}`, Buffer.from(data, "base64"));
  frames.push({ file, t: metadata.timestamp });
  await cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
});
await cdp.send("Page.startScreencast", {
  format: "jpeg",
  quality: 95,
  maxWidth: size.width * SCALE,
  maxHeight: size.height * SCALE,
});
// Nudge one repaint so the first frame arrives even on a still page.
await page.evaluate(() => window.scrollBy(0, 0));
await page.waitForTimeout(HOLD_START * 1000);

// Scroll through Lenis (the site's smooth scroll), linear so the speed stays even.
// A plain window.scrollTo would fight Lenis and stutter.
await page.evaluate(async (seconds) => {
  const end = document.documentElement.scrollHeight - innerHeight;
  await new Promise((done) => {
    if (window.lenis) window.lenis.scrollTo(end, { duration: seconds, easing: (t) => t, force: true, onComplete: done });
    else {
      const t0 = performance.now();
      const step = (now) => {
        const t = Math.min((now - t0) / (seconds * 1000), 1);
        window.scrollTo(0, end * t);
        t < 1 ? requestAnimationFrame(step) : done();
      };
      requestAnimationFrame(step);
    }
  });
}, SCROLL_SECONDS);
await page.waitForTimeout(HOLD_END * 1000);
const stopAt = Date.now() / 1000;
await cdp.send("Page.stopScreencast");
await browser.close();

if (frames.length < 2) throw new Error(`Only ${frames.length} frame(s) captured`);

// The first frame stretches over the whole start hold, the last one to the end.
const first = frames[0].t;
const total = HOLD_START + SCROLL_SECONDS + HOLD_END;
let list = "";
frames.forEach((f, i) => {
  const next = i + 1 < frames.length ? frames[i + 1].t : Math.max(stopAt, first + total);
  list += `file '${f.file}'\nduration ${Math.max(next - f.t, 0.001).toFixed(4)}\n`;
});
list += `file '${frames.at(-1).file}'\n`; // concat demuxer needs the last file twice
writeFileSync(`${TMP}/frames.txt`, list);
const fps = (frames.length / (frames.at(-1).t - first)).toFixed(1);
console.log(`${frames.length} frames captured (~${fps} fps while scrolling)`);

const ffmpeg = (...args) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });
// Two-pass encode at the bitrate that fills TARGET_BYTES (2 % kept for the MP4 container).
const kbps = Math.floor((TARGET_BYTES * 8 * 0.98) / total / 1000);
const encode = (pass, out) =>
  ffmpeg("-f", "concat", "-safe", "0", "-i", `${TMP}/frames.txt`,
    "-vf", `fps=60,scale=${OUTPUT_WIDTH}:-2:flags=lanczos`,
    "-c:v", "libx264", "-preset", "veryslow", "-b:v", `${kbps}k`,
    "-pass", String(pass), "-passlogfile", `${TMP}/x264`,
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", ...(pass === 1 ? ["-f", "null"] : []), out);
encode(1, "/dev/null");
encode(2, `${OUT}/demo.mp4`);
console.log(`✓ ${OUT}/demo.mp4`);

if (process.argv.includes("--gif")) {
  // GIFs of photos get huge (the full scroll at 900 px / 15 fps weighs ~39 MB),
  // so only the first 10 seconds, 720 px, 12 fps (~7 MB).
  // Two passes: build a palette from the video, then use it (far better colours than the default).
  const filters = "fps=12,scale=720:-1:flags=lanczos";
  ffmpeg("-t", "10", "-i", `${OUT}/demo.mp4`, "-vf", `${filters},palettegen=max_colors=128:stats_mode=diff`, `${TMP}/palette.png`);
  ffmpeg("-t", "10", "-i", `${OUT}/demo.mp4`, "-i", `${TMP}/palette.png`, "-lavfi",
    `${filters}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`, `${OUT}/demo.gif`);
  console.log(`✓ ${OUT}/demo.gif`);
}

if (!process.env.DEMO_KEEP) rmSync(TMP, { recursive: true, force: true });
