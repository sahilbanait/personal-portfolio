import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// The lab holds prototypes. Each page must load cleanly and pass the same accessibility checks as the site.
const pages = ["/lab/", "/lab/query/", "/lab/lineage/", "/lab/pipeline/", "/lab/hero/", "/lab/cases/"];

for (const theme of ["bold", "dark"] as const) {
  for (const [width, height] of [
    [1440, 900],
    [375, 812],
  ]) {
    test(`lab ${theme} ${width}: loads cleanly and passes axe`, async ({ browser }) => {
      test.setTimeout(120_000);
      const ctx = await browser.newContext({ viewport: { width, height } });
      await ctx.addInitScript((t) => localStorage.setItem("sk-theme", t), theme);
      for (const path of pages) {
        const page = await ctx.newPage();
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(e.message));
        page.on("console", (m) => {
          if (m.type() === "error") errors.push(m.text());
        });
        await page.goto(path);
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(600);
        await expect(page.locator("h1")).toHaveCount(1);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), path).toBeLessThanOrEqual(0);
        const robots = await page.locator('meta[name="robots"]').getAttribute("content");
        expect(robots, path).toContain("noindex");
        const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
        expect(r.violations.map((v) => `${path}: ${v.id} ${v.nodes.map((n) => n.target).join(" | ")}`)).toEqual([]);
        expect(errors, path).toEqual([]);
        await page.close();
      }
      await ctx.close();
    });
  }
}

test("lab query console answers queries", async ({ page }) => {
  await page.goto("/lab/query/");
  await page.keyboard.press("/");
  await expect(page.locator("#q-in")).toBeFocused();
  await page.keyboard.type("select count(*) from projects where groups = 'AI'");
  await page.keyboard.press("Enter");
  await expect(page.locator(".q-count")).toContainText("5");
  await page.locator("#q-in").fill("select * from nowhere");
  await page.keyboard.press("Enter");
  await expect(page.locator(".q-err")).toContainText('No table "nowhere"');
});

test("lab case study opens, moves on, and closes with Escape", async ({ page }) => {
  await page.goto("/lab/cases/");
  await page.locator(".cs-card h3 button").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("#cs-title")).toHaveText("Snowflake Cost Analyzer");
  await page.getByRole("button", { name: /›$/ }).click();
  await expect(page.locator("#cs-title")).toHaveText("Kafka to Snowflake pipeline");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});
