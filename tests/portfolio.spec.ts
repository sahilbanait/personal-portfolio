import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { existsSync, readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";

const SHOTS = ".artifacts/screenshots";
const sizes = [
  [1440, 900],
  [1100, 700],
  [768, 1024],
  [375, 812],
  [360, 640],
] as const;

async function open(page: Page, theme: "bold" | "dark" = "bold") {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.addInitScript((t) => localStorage.setItem("sk-theme", t), theme);
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: "html{scroll-behavior:auto!important}" });
  return errors;
}
const toSection = (page: Page, id: string) =>
  page.evaluate((i) => document.getElementById(i)!.scrollIntoView(), id);
const stageWord = (page: Page) =>
  page.locator("#panel .stage-word").innerText();
const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - innerWidth);

test.beforeAll(() => mkdir(SHOTS, { recursive: true }));

for (const theme of ["bold", "dark"] as const) {
  for (const [w, h] of sizes) {
    test(`${theme} ${w}x${h}: layout, wheel, and text`, async ({ page }) => {
      test.setTimeout(90_000);
      await page.setViewportSize({ width: w, height: h });
      const errors = await open(page, theme);
      await page.waitForTimeout(1600);
      await page.screenshot({ path: `${SHOTS}/${theme}-${w}-hero.png` });
      expect(await overflow(page)).toBeLessThanOrEqual(0);

      // The name never breaks inside a word, and stays on screen.
      expect(
        await page.locator("h1 .w").evaluateAll((words) =>
          words.every((word) => {
            const tops = [...word.children].map(
              (l) => l.getBoundingClientRect().top,
            );
            return (
              Math.max(...tops) - Math.min(...tops) < 5 &&
              word.getBoundingClientRect().right <= innerWidth
            );
          }),
        ),
      ).toBe(true);

      // Every stage fits the screen.
      const range = await page.evaluate(() => {
        const r = document.getElementById("lifecycle")!.getBoundingClientRect();
        return { top: r.top + scrollY, len: r.height - innerHeight };
      });
      const seen: string[] = [];
      for (let i = 0; i < 8; i++) {
        await page.evaluate(
          (y) => scrollTo(0, y),
          range.top + range.len * ((i + 0.3) / 8),
        );
        await page.waitForTimeout(1100);
        seen.push(await stageWord(page));
        if ([0, 3, 7].includes(i))
          await page.screenshot({
            path: `${SHOTS}/${theme}-${w}-stage${i + 1}.png`,
          });
        const fit = await page.evaluate(() => {
          const span = document.createRange();
          span.selectNodeContents(
            document.querySelector("#panel .stage-word span")!,
          );
          const word = span.getBoundingClientRect();
          const labels = [...document.querySelectorAll(".ring-node text")].map(
            (t) => t.getBoundingClientRect(),
          );
          return {
            toolsEnd: document
              .querySelector("#panel .stage-tools")!
              .getBoundingClientRect().bottom,
            limit: innerHeight,
            wordRight: word.right,
            ringLeft: document
              .querySelector(".ring-box")!
              .getBoundingClientRect().left,
            labelsOut: labels.filter((l) => l.left < 0 || l.right > innerWidth)
              .length,
            labelPx:
              parseFloat(
                getComputedStyle(document.querySelector(".ring-node text")!)
                  .fontSize,
              ) *
              (document.getElementById("ring")!.getBoundingClientRect().width /
                680),
          };
        });
        expect(fit.toolsEnd, `stage ${i + 1} tools`).toBeLessThanOrEqual(
          fit.limit + 1,
        );
        expect(fit.wordRight, `stage ${i + 1} word`).toBeLessThanOrEqual(w);
        if (w >= 1000)
          expect(fit.wordRight, `stage ${i + 1} clear of ring`).toBeLessThan(
            fit.ringLeft + 40,
          );
        expect(fit.labelsOut, `stage ${i + 1} labels`).toBe(0);
        expect(fit.labelPx).toBeGreaterThanOrEqual(13);
      }
      expect(new Set(seen).size).toBe(8);

      for (const id of [
        "ai",
        "projects",
        "certifications",
        "toolkit",
        "life",
        "contact",
      ]) {
        await toSection(page, id);
        await page.waitForTimeout(900);
        await page.screenshot({ path: `${SHOTS}/${theme}-${w}-${id}.png` });
      }

      await toSection(page, "ai");
      await page.waitForTimeout(500);
      const cut = await page.locator(".sph-item").evaluateAll((els) =>
        els
          .filter((i) => {
            const r = i.getBoundingClientRect();
            return r.left < -1 || r.right > innerWidth + 1;
          })
          .map((i) => i.textContent),
      );
      expect(cut).toEqual([]);

      const scene = await page.locator("#grid .vis").evaluateAll((vs) =>
        vs.flatMap((v) => {
          const svg = v.querySelector("svg")!.getBoundingClientRect();
          const box = v.getBoundingClientRect();
          const k = Math.min(svg.height / 170, svg.width / 400);
          return [...v.querySelectorAll(".tx")].map((t) => {
            const r = t.getBoundingClientRect();
            return {
              t: t.textContent,
              px: parseFloat(getComputedStyle(t).fontSize) * k,
              inside: r.left - box.left >= 0 && box.right - r.right >= 0,
            };
          });
        }),
      );
      expect(scene.filter((t) => t.px < 12.5)).toEqual([]);
      expect(scene.filter((t) => !t.inside)).toEqual([]);

      const small = await page.evaluate(
        () =>
          [...document.querySelectorAll("p,span,a,li,h3,b,button")].filter(
            (e) =>
              e.checkVisibility() &&
              !e.closest(".sph-item") &&
              [...e.childNodes].some(
                (n) => n.nodeType === 3 && n.textContent?.trim(),
              ) &&
              parseFloat(getComputedStyle(e).fontSize) < 13,
          ).length,
      );
      expect(small).toBe(0);
      expect(await overflow(page)).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }

  test(`${theme}: no accessibility violations, in every wheel layout and at rest`, async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    for (const reducedMotion of ["no-preference", "reduce"] as const) {
      for (const width of [1440, 375]) {
        const ctx = await browser.newContext({
          viewport: { width, height: width > 500 ? 900 : 812 },
          reducedMotion,
        });
        const page = await ctx.newPage();
        await open(page, theme);
        // Reveal everything and settle, so axe judges resting colours.
        await page.addStyleTag({
          content:
            "*,*::before,*::after{transition:none!important;animation:none!important}.js .up{opacity:1!important}",
        });
        const results = async (label: string) => {
          const r = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .exclude(".sph-item")
            .exclude("#swap")
            .analyze();
          expect(
            r.violations.map(
              (v) =>
                `${label}: ${v.id} ${v.nodes.map((n) => n.target).join(" | ")}`,
            ),
          ).toEqual([]);
        };
        await results("page");
        if (reducedMotion === "no-preference") {
          await page.evaluate(() => {
            const r = document
              .getElementById("lifecycle")!
              .getBoundingClientRect();
            scrollTo(0, r.top + scrollY + (r.height - innerHeight) * 0.95);
          });
          await page.waitForTimeout(1200);
          await results("AI stage");
        }
        await ctx.close();
      }
    }
  });
}

test("content: tools, certifications, no private details", async ({
  page,
  request,
}) => {
  await open(page);
  const body = (await page.locator("body").textContent())!;
  const lower = body.toLowerCase();
  // Terms too private to name in a public repo live in a git-ignored file, one per line.
  const privateTerms = ".artifacts/private-terms.txt";
  for (const banned of [
    "@gmail",
    "notion",
    "[add",
    "aws cloud practitioner",
    "dp-900",
    ...(existsSync(privateTerms)
      ? readFileSync(privateTerms, "utf8").split(/\r?\n/).filter(Boolean)
      : []),
  ])
    expect(lower, banned).not.toContain(banned);
  const tools = await page.locator("#toolkit").innerText();
  for (const t of ["Apache Iceberg", "Snowpark", "Jupyter notebooks"])
    expect(tools).toContain(t);
  await expect(page.locator(".cert, .cert-rest > li")).toHaveCount(10);
  await expect(page.locator(".seal use")).toHaveCount(10);
  const longest = Math.max(
    ...(
      await page.locator(".cb p, .stage-line, .sk-detail p").allTextContents()
    ).map((t) => t.trim().split(/\s+/).length),
  );
  expect(longest).toBeLessThanOrEqual(12);
  const ai = (await page.locator("#ai").textContent())!.toLowerCase();
  for (const name of [
    "kumo",
    "debugging agent",
    "research agent",
    "localtrace",
    "tillmark",
    "gainlog",
    "drift",
  ])
    expect(ai).not.toContain(name);
  expect(await page.locator('a[href="#"], a[href^="mailto:"]').count()).toBe(0);
  await expect(
    page.locator('a[href="https://github.com/sahilbanait"]'),
  ).toHaveCount(1);
  for (const path of ["/sitemap.xml", "/robots.txt", "/og.png"])
    expect((await request.get(path)).status()).toBe(200);
  expect(
    (await request.get("/static/documents/sahil-kumar-resume.pdf")).status(),
  ).toBe(404);
});

test("content is all there without JavaScript", async ({ browser }) => {
  const ctx = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Sahil Kumar" }),
  ).toBeVisible();
  await expect(page.locator("#stackList > li")).toHaveCount(8);
  await expect(page.locator("#stackList > li").first()).toBeVisible();
  await expect(page.locator("#aiSkills .sk-detail p").first()).toBeVisible();
  await expect(page.locator("#grid .card")).toHaveCount(12);
  await expect(page.locator("#grid .card").first()).toBeVisible();
  await expect(page.locator(".loop-grid")).toBeHidden();
  await page.screenshot({ path: `${SHOTS}/no-js.png`, fullPage: true });
  await ctx.close();
});

test("theme switches and is remembered", async ({ page }) => {
  await page.goto("/");
  const theme = () =>
    page.evaluate(() => document.documentElement.dataset.theme);
  expect(await theme()).toBe("bold");
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect.poll(theme).toBe("dark");
  await page.waitForTimeout(800);
  await page.reload();
  expect(await theme()).toBe("dark");
  await expect(
    page.getByRole("button", { name: "Dark", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("wheel: hint, nudge, buttons, stage clicks, drag, and the AI stage", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await page.evaluate(() => {
    const r = document.getElementById("lifecycle")!.getBoundingClientRect();
    scrollTo(0, r.top + scrollY + 2);
  });
  await page.waitForTimeout(700);
  await expect(page.locator(".pin")).toHaveCSS("position", "sticky");
  expect(
    await page
      .locator(".wheel-hint")
      .evaluate((h) => parseFloat(getComputedStyle(h).opacity)),
  ).toBeGreaterThan(0.9);
  const samples = new Set<string | null>();
  for (let i = 0; i < 8; i++) {
    samples.add(await page.locator("#rotor").getAttribute("transform"));
    await page.waitForTimeout(400);
  }
  expect(samples.size).toBeGreaterThan(2);
  await expect(page.locator("#prevStage")).toBeDisabled();
  await page.locator("#nextStage").click();
  await expect.poll(() => stageWord(page)).toMatch(/store/i);
  await page.waitForTimeout(500);
  expect(
    await page
      .locator("#wheelCount")
      .evaluate((c) => parseFloat(getComputedStyle(c).opacity)),
  ).toBeGreaterThan(0.9);
  await page.locator("#prevStage").click();
  await expect.poll(() => stageWord(page)).toMatch(/ingest/i);
  await page.locator('.ring-node[data-i="4"]').click({ force: true });
  await expect.poll(() => stageWord(page)).toMatch(/observe/i);
  const box = (await page.locator("#ring").boundingBox())!;
  const [cx, cy, rad] = [
    box.x + box.width / 2,
    box.y + box.height / 2,
    box.width * 0.29,
  ];
  const y0 = await page.evaluate(() => scrollY);
  await page.mouse.move(cx + rad, cy);
  await page.mouse.down();
  for (let d = 0; d <= 90; d += 10)
    await page.mouse.move(
      cx + rad * Math.cos((-d * Math.PI) / 180),
      cy + rad * Math.sin((-d * Math.PI) / 180),
    );
  await page.mouse.up();
  expect(await page.evaluate(() => scrollY)).not.toBe(y0);
  await page.locator("#stops button").nth(7).click();
  await expect.poll(() => stageWord(page)).toMatch(/ai and agents/i);
  await expect(page.locator("#lifecycle")).toHaveClass(/ai-on/);
  await expect(page.locator("#nextStage")).toBeDisabled();
});

test("wheel works on a phone with touch", async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await ctx.newPage();
  await open(page);
  await expect(page.locator(".pin")).toHaveCSS("position", "sticky");
  await page.evaluate(() => {
    const r = document.getElementById("lifecycle")!.getBoundingClientRect();
    scrollTo(0, r.top + scrollY + 2);
  });
  await page.waitForTimeout(600);
  await expect(page.locator(".wheel-hint .h-touch")).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/hint-phone.png` });
  await page.locator("#nextStage").tap();
  await expect.poll(() => stageWord(page)).toMatch(/store/i);
  await page.waitForTimeout(600);
  const node = (await page
    .locator('.ring-node[data-i="3"] circle')
    .boundingBox())!;
  await page.touchscreen.tap(node.x + node.width / 2, node.y + node.height / 2);
  await expect.poll(() => stageWord(page)).toMatch(/orchestrate/i);
  await ctx.close();
});

test("AI skills: sphere, selection, hover, auto cycle, and pause", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await toSection(page, "ai");
  await page.mouse.move(5, 5);
  await page.waitForTimeout(1200);
  await expect(page.locator("#aiSkills > li")).toHaveCount(6);
  await expect(page.locator("#ai")).toHaveCSS(
    "background-color",
    "rgb(7, 5, 26)",
  );
  expect(
    (await page.locator("#h-ai").innerText()).toUpperCase().replace(/\s+/g, ""),
  ).toBe("AIANDAGENTS");
  const spots = () =>
    page
      .locator(".sph-item")
      .evaluateAll((e) =>
        e.map((x) => (x as HTMLElement).style.transform).join("|"),
      );
  const first = await spots();
  await page.waitForTimeout(300);
  expect(await spots()).not.toBe(first);
  const onName = () => page.locator(".skill.on .sk-btn").textContent();
  const a0 = await onName();
  await page.waitForTimeout(4500);
  expect(await onName()).not.toBe(a0);
  await page.locator(".sk-btn").nth(4).hover();
  await page.waitForTimeout(4600);
  expect(await onName()).toBe("Code with AI");
  await page.mouse.move(5, 5);
  const sb = (await page.locator("#sphere").boundingBox())!;
  await page.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2);
  const before = await spots();
  await page.mouse.down();
  await page.mouse.move(sb.x + sb.width / 2 + 120, sb.y + sb.height / 2, {
    steps: 6,
  });
  await page.mouse.up();
  expect(await spots()).not.toBe(before);
  await page.locator(".sk-btn", { hasText: "Run local models" }).click();
  await page.mouse.move(5, 5);
  await page.waitForTimeout(1900);
  expect(
    (await page.locator(".sph-item.hit").allTextContents()).sort(),
  ).toEqual(["Docker", "Ollama", "Open WebUI"]);
  await expect(page.locator("#skd2 p")).toBeVisible();
  await expect(page.locator(".sk-detail p:visible")).toHaveCount(1);
  await page.waitForTimeout(4500);
  expect(await onName()).toBe("Run local models");
  await page.getByRole("button", { name: "Pause animations" }).click();
  const held = await spots();
  await page.waitForTimeout(400);
  expect(await spots()).toBe(held);
});

test("projects: scenes play on screen, filter animates, hover restarts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await toSection(page, "projects");
  await page.mouse.move(5, 5);
  await page.waitForTimeout(1400);
  expect(
    new Set(
      await page
        .locator("#grid .vis svg")
        .evaluateAll((s) => s.map((x) => x.innerHTML)),
    ).size,
  ).toBe(12);
  const state = await page
    .locator("#grid .card")
    .evaluateAll((cs) =>
      cs.map((c) => ({
        live: c.classList.contains("live"),
        states: [...c.querySelectorAll("[data-a]")].flatMap((el) =>
          el.getAnimations().map((a) => a.playState),
        ),
      })),
    );
  expect(state.filter((c) => c.live).length).toBeGreaterThan(0);
  expect(state.filter((c) => !c.live).length).toBeGreaterThan(0);
  expect(
    state.filter((c) => c.live).every((c) => c.states.includes("running")),
  ).toBe(true);
  expect(
    state.filter((c) => !c.live).every((c) => !c.states.includes("running")),
  ).toBe(true);

  const card = page.locator("#grid .card").first();
  const time = () =>
    card.evaluate(
      (c) =>
        c.querySelector("[data-a]")!.getAnimations()[0].currentTime as number,
    );
  await page.waitForTimeout(800);
  const t0 = await time();
  const box = (await card.boundingBox())!;
  await page.mouse.move(box.x + 30, box.y + 30);
  await page.mouse.move(box.x + 40, box.y + 40);
  await page.waitForTimeout(100);
  expect(await time()).toBeLessThan(t0);
  await expect
    .poll(() => card.evaluate((c) => getComputedStyle(c).transform))
    .not.toBe("none");
  await page.mouse.move(5, 5);

  await page.locator("#filter").getByRole("button", { name: /^AI/ }).click();
  await page.waitForTimeout(280);
  expect(
    await page
      .locator("#grid .card:not([hidden])")
      .evaluateAll(
        (cs) =>
          cs.filter((c) =>
            c
              .getAnimations()
              .some((a) => a.effect?.getTiming().iterations !== Infinity),
          ).length,
      ),
  ).toBeGreaterThan(0);
  await page.waitForTimeout(800);
  await expect(page.locator("#grid .card:visible")).toHaveCount(5);
  const ind = (await page.locator("#filInd").boundingBox())!;
  const btn = (await page
    .locator("#filter")
    .getByRole("button", { name: /^AI/ })
    .boundingBox())!;
  expect(Math.abs(ind.x - btn.x)).toBeLessThan(2);
  await page.locator("#filter").getByRole("button", { name: /^All/ }).click();
  await expect(page.locator("#grid .card:visible")).toHaveCount(12);
});

test("hero tagline rotates, and pause stops every loop", async ({ page }) => {
  await open(page);
  const word = () => page.locator("#swap .on").textContent();
  const w0 = await word();
  await page.waitForTimeout(2700);
  expect(await word()).not.toBe(w0);
  const looping = () =>
    page.evaluate(() =>
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations === Infinity)
        .map((a) => a.playState),
    );
  await page.getByRole("button", { name: "Pause animations" }).click();
  await page.waitForTimeout(250);
  expect((await looping()).every((s) => s === "paused")).toBe(true);
  const held = await word();
  await page.waitForTimeout(2700);
  expect(await word()).toBe(held);
  await page.getByRole("button", { name: "Play animations" }).click();
  await expect.poll(looping).toContain("running");
});

test("certification counts run up to their real values", async ({ page }) => {
  await open(page);
  await toSection(page, "certifications");
  await page.waitForTimeout(1600);
  expect(await page.locator(".cert-stats b").allTextContents()).toEqual([
    "10",
    "5",
    "4",
  ]);
});

test("reduced motion gives a complete, still page", async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  const errors = await open(page);
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await expect(page.locator("#stackList > li:visible")).toHaveCount(8);
  await expect(page.locator(".pin")).not.toHaveCSS("position", "sticky");
  await toSection(page, "ai");
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOTS}/reduced-ai.png` });
  const pos = () =>
    page
      .locator(".sph-item")
      .first()
      .evaluate((x) => (x as HTMLElement).style.transform);
  const p0 = await pos();
  await page.waitForTimeout(400);
  expect(await pos()).toBe(p0);
  await page.locator(".sk-btn", { hasText: "Code with AI" }).click();
  await expect(page.locator(".sph-item.hit")).toHaveCount(4);
  await page.locator("#filter").getByRole("button", { name: /^AI/ }).click();
  await expect(page.locator("#grid .card:visible")).toHaveCount(5);
  expect(
    await page
      .locator("#grid .card .tx")
      .first()
      .evaluate((t) => getComputedStyle(t).opacity),
  ).toBe("1");
  expect(errors).toEqual([]);
  await ctx.close();
});

test("top bar: stays on screen, and the phone menu opens and closes", async ({
  browser,
}) => {
  const desk = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await desk.newPage();
  await open(page);
  await toSection(page, "toolkit");
  await page.waitForTimeout(300);
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Background" })).toBeInViewport();
  await expect(page.locator("#pause")).toBeInViewport();
  // Pause is reachable without tabbing through the whole page.
  await page.locator("h1").evaluate(() => scrollTo(0, 0));
  let tabs = 0;
  for (; tabs < 15; tabs++) {
    await page.keyboard.press("Tab");
    if (await page.locator("#pause").evaluate((b) => b === document.activeElement))
      break;
  }
  expect(tabs).toBeLessThan(15);
  await desk.close();

  const ctx = await browser.newContext({
    viewport: { width: 320, height: 568 },
    hasTouch: true,
    isMobile: true,
  });
  const phone = await ctx.newPage();
  await open(phone);
  const link = phone
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Projects" });
  await expect(link).toBeHidden();
  await phone.locator("#menu summary").tap();
  await expect(link).toBeVisible();
  expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  // The menu covers the screen below the bar, and the page behind it doesn't scroll.
  const sheet = await phone.evaluate(() => {
    const r = document.querySelector("#menu nav")!.getBoundingClientRect();
    return {
      gap: innerHeight - r.bottom,
      width: r.width - innerWidth,
      locked: getComputedStyle(document.documentElement).overflow,
    };
  });
  expect(sheet).toEqual({ gap: 0, width: 0, locked: "hidden" });
  await link.tap();
  await expect(link).toBeHidden();
  await expect.poll(() => phone.evaluate(() => scrollY)).toBeGreaterThan(100);
  expect(await overflow(phone)).toBeLessThanOrEqual(0);
  await ctx.close();
});

test("wheel keeps keyboard focus at both ends and exposes the current stage", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  const active = () => page.evaluate(() => document.activeElement?.id);
  await page.locator("#stops button").nth(1).click();
  await expect.poll(() => stageWord(page)).toMatch(/store/i);
  await expect(page.locator('#stops [aria-current="step"]')).toHaveText("Store");
  await page.locator("#prevStage").focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => stageWord(page)).toMatch(/ingest/i);
  expect(await active()).toBe("prevStage");
  await expect(page.locator("#prevStage")).toHaveAttribute("aria-disabled", "true");
  const y = await page.evaluate(() => scrollY);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => scrollY)).toBe(y);
  await page.locator("#stops button").nth(6).click();
  await expect.poll(() => stageWord(page)).toMatch(/serve/i);
  await page.locator("#nextStage").focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => stageWord(page)).toMatch(/ai and agents/i);
  expect(await active()).toBe("nextStage");
  await expect(page.locator('#stops [aria-current="step"]')).toHaveCount(1);
  // Quick presses count on from where the wheel is heading, not where it is.
  await page.locator("#stops button").nth(1).click();
  await expect.poll(() => stageWord(page)).toMatch(/store/i);
  await page.waitForTimeout(1200);
  await page.locator("#nextStage").focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect.poll(() => stageWord(page)).toMatch(/orchestrate/i);
});

test("screen readers get all eight stages, without live updates", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await expect(page.locator(".pin")).toHaveCSS("position", "sticky");
  await expect(
    page.locator("#lifecycle").getByRole("heading", { level: 3 }),
  ).toHaveCount(8);
  await expect(page.locator("#panel")).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator("#lifecycle [aria-live]")).toHaveCount(0);
});

test("whole linked card is the link, and filtering is announced", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await toSection(page, "projects");
  await page.waitForTimeout(1200);
  await expect(page.locator("a.card-link")).toHaveCount(3);
  const opened = context.waitForEvent("page");
  const box = (await page.locator("#grid .card").first().boundingBox())!;
  await context.route("https://github.com/**", (r) => r.fulfill({ body: "ok" }));
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  const next = await opened;
  expect(next.url()).toContain("Snowflake-Cost-Analyzer");
  await next.close();
  // Nothing clickable lies over an unlinked card.
  const third = page.locator("#grid .card").nth(2);
  await expect(third.locator("a")).toHaveCount(0);
  const data = page.locator("#filter").getByRole("button", { name: /^Data/ });
  await data.click();
  await expect(page.locator("#filterStatus")).toHaveText("4 projects shown");
  await expect(page.locator("#grid .card:visible")).toHaveCount(4);
  await expect(page.locator("#grid .card:visible h3").nth(3)).toContainText(
    "MCP server",
  );
});

test("AI skills: focus stops rotation, one cycle only, none on touch", async ({
  browser,
}) => {
  test.setTimeout(70_000);
  const on = (p: Page) => p.locator(".skill.on .sk-btn").textContent();
  const desk = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await desk.newPage();
  await open(page);
  await toSection(page, "ai");
  await page.mouse.move(5, 5);
  await page.waitForTimeout(1000);
  await page.locator(".sk-btn").nth(3).focus();
  const held = await on(page);
  await page.waitForTimeout(4800);
  expect(await on(page)).toBe(held);
  await desk.close();

  const free = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const auto = await free.newPage();
  await open(auto);
  await toSection(auto, "ai");
  await auto.mouse.move(5, 5);
  await expect
    .poll(() => auto.locator("#ai").getAttribute("class"), { timeout: 35_000 })
    .toContain("chosen");
  const rest = await on(auto);
  expect(rest).toBe("Build agents");
  await auto.waitForTimeout(4800);
  expect(await on(auto)).toBe(rest);
  await free.close();

  const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    hasTouch: true,
    isMobile: true,
  });
  const phone = await ctx.newPage();
  await open(phone);
  await toSection(phone, "ai");
  await phone.waitForTimeout(800);
  const rows = () =>
    phone.locator(".sk-btn").evaluateAll((b) => b.map((x) => x.getBoundingClientRect().top));
  const before = await rows();
  await phone.waitForTimeout(4800);
  expect(await rows()).toEqual(before);
  await phone.locator(".sk-btn").nth(2).tap();
  await expect(phone.locator(".sk-btn").nth(2)).toHaveAttribute("aria-expanded", "true");
  await ctx.close();
});

test("pause is remembered and has one clear state", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "Pause animations" }).click();
  await expect(page.locator("#pause")).not.toHaveAttribute("aria-pressed", /.*/);
  await page.reload();
  await expect(page.getByRole("button", { name: "Play animations" })).toBeVisible();
  const running = await page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => a.effect?.getTiming().iterations === Infinity)
      .some((a) => a.playState === "running"),
  );
  expect(running).toBe(false);
});

test("projects and hobbies swipe sideways on a phone", async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await ctx.newPage();
  const errors = await open(page);
  await toSection(page, "projects");
  await page.waitForTimeout(900);
  const swipe = page.locator('.swipe[data-for="grid"]');
  const [prev, next] = [swipe.getByRole("button", { name: "Previous projects" }), swipe.getByRole("button", { name: "Next projects" })];
  await expect(swipe.locator(".swipe-count")).toHaveText("1 / 12");
  await expect(prev).toHaveAttribute("aria-disabled", "true");
  // One row, not a stack: the page is barely taller than a single card.
  const grid = await page.locator("#grid").evaluate((g) => ({
    height: g.getBoundingClientRect().height,
    scrolls: g.scrollWidth > g.clientWidth,
    peek: g.children[1].getBoundingClientRect().left < innerWidth,
  }));
  expect(grid.scrolls).toBe(true);
  expect(grid.peek).toBe(true);
  expect(grid.height).toBeLessThan(500);
  await next.tap();
  await expect(swipe.locator(".swipe-count")).toHaveText("2 / 12");
  await expect(prev).toHaveAttribute("aria-disabled", "false");
  // Filtering starts the row again and counts only what's shown.
  await page.locator("#filter").getByRole("button", { name: /^AI/ }).tap();
  await expect(swipe.locator(".swipe-count")).toHaveText("1 / 5");
  await expect(prev).toHaveAttribute("aria-disabled", "true");
  await expect(
    page.locator('.swipe[data-for="lifeGrid"] .swipe-count'),
  ).toHaveText("1 / 3");
  expect(await overflow(page)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  await ctx.close();
});

test("nothing clips: small screens, text spacing, and short screens", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const offRight = (page: Page) =>
    page.evaluate(() =>
      [...document.querySelectorAll("h1 .l, h2 .w, h3, #swap")]
        .filter((e) => {
          const r = e.getBoundingClientRect();
          return r.width && r.right > innerWidth + 1;
        })
        .map((e) => e.textContent),
    );
  for (const width of [320, 340, 375, 1200, 1440]) {
    const ctx = await browser.newContext({ viewport: { width, height: 800 } });
    const page = await ctx.newPage();
    await open(page);
    expect(await offRight(page), `${width}`).toEqual([]);
    expect(
      await page
        .locator(".bar-in")
        .evaluate((b) => b.scrollWidth - b.clientWidth),
      `${width} top bar fits`,
    ).toBeLessThanOrEqual(0);
    await page.addStyleTag({
      content:
        "*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}",
    });
    await page.waitForTimeout(300);
    const clipped = await page.evaluate(() => {
      const swap = document.getElementById("swap")!;
      return (
        Math.max(...[...swap.children].map((c) => c.scrollWidth)) >
        swap.clientWidth
      );
    });
    expect(clipped, `${width} rotating word`).toBe(false);
    expect(
      (await offRight(page)).filter((t) => t !== "Certifications"),
      `${width} with text spacing`,
    ).toEqual([]);
    await ctx.close();
  }
  for (const [width, height] of [
    [320, 568],
    [360, 640],
    [375, 667],
    [600, 600],
    [800, 600],
    [999, 600],
    [1000, 620],
    [1280, 620],
    [1280, 720],
    [1366, 768],
    [1920, 1080],
    [960, 540],
    [800, 590],
    [1280, 560],
  ]) {
    const ctx = await browser.newContext({ viewport: { width, height } });
    const page = await ctx.newPage();
    await open(page);
    for (const i of [0, 2, 7]) {
      await page.evaluate((n) => {
        const r = document.getElementById("lifecycle")!.getBoundingClientRect();
        scrollTo(0, r.top + scrollY + (r.height - innerHeight) * ((n + 0.3) / 8));
      }, i);
      await page.waitForTimeout(1100);
      const fit = await page.evaluate(() => {
        if (getComputedStyle(document.querySelector(".pin")!).position !== "sticky")
          return { cut: 0, under: 0 };
        const shown = [
          ...document.querySelectorAll(
            "#panel li, #panel p, #stops button, #wheelCtl, #ring",
          ),
        ]
          .map((e) => e.getBoundingClientRect())
          .filter((r) => r.width);
        return {
          cut: Math.max(...shown.map((r) => r.bottom)) - innerHeight,
          under:
            document.getElementById("bar")!.getBoundingClientRect().bottom -
            document.getElementById("h-lifecycle")!.getBoundingClientRect().top,
        };
      });
      expect(fit.cut, `${width}x${height} stage ${i + 1} cut`).toBeLessThanOrEqual(1);
      expect(fit.under, `${width}x${height} stage ${i + 1} under bar`).toBeLessThanOrEqual(1);
    }
    await ctx.close();
  }
});
