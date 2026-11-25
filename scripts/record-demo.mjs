// Records a scroll-through video of the site for the README.
//
//   npm run demo                      → docs/demo.mp4
//   npm run demo -- --gif             → also docs/demo.gif
//   DEMO_URL=http://localhost:4321 DEMO_SECONDS=25 npm run demo
//
// First run only: npx playwright install chromium
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";

const URL = process.env.DEMO_URL ?? "https://asdelicias-dacelia.com/";
const SCROLL_SECONDS = Number(process.env.DEMO_SECONDS ?? 20);
const HOLD_START = 2; // seconds on the hero before scrolling
const HOLD_END = 2; // seconds at the bottom
const size = { width: 1440, height: 900 };
const OUT = "docs";
const TMP = `${OUT}/.recording`;

mkdirSync(TMP, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: size, recordVideo: { dir: TMP, size } });
const page = await context.newPage();
const recordingStart = Date.now();

await page.goto(URL, { waitUntil: "networkidle" });

// Load every lazy image up front so nothing pops in while scrolling.
await page.evaluate(async () => {
  const imgs = [...document.images];
  imgs.forEach((img) => (img.loading = "eager"));
  await Promise.all(imgs.map((img) => img.decode().catch(() => {})));
  await document.fonts.ready;
});
await page.waitForTimeout(2500); // let the hero intro animation finish
const scrollStart = Date.now();
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

const raw = await page.video().path();
await context.close(); // the video file is written on close
await browser.close();

// Cut the blank loading frames, keep from the hold on the hero to the end.
const skip = ((scrollStart - recordingStart) / 1000).toFixed(2);
const length = String(HOLD_START + SCROLL_SECONDS + HOLD_END);
const ffmpeg = (...args) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });

ffmpeg("-ss", skip, "-i", raw, "-t", length, "-c:v", "libx264", "-crf", "20", "-preset", "slow",
  "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", `${OUT}/demo.mp4`);
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

rmSync(TMP, { recursive: true, force: true });
