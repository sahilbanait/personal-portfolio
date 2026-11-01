import lighthouse from "lighthouse";
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

await mkdir(".artifacts/lighthouse", { recursive: true });
const summary = {};
for (const formFactor of ["mobile", "desktop"]) {
  const browser = await chromium.launch({
    headless: true,
    args: ["--remote-debugging-port=9222"],
  });
  try {
    const result = await lighthouse(
      process.env.AUDIT_URL || "http://127.0.0.1:3199",
      {
        port: 9222,
        output: "html",
        onlyCategories: [
          "performance",
          "accessibility",
          "best-practices",
          "seo",
        ],
        ...(formFactor === "desktop"
          ? {
              formFactor: "desktop",
              screenEmulation: {
                mobile: false,
                width: 1440,
                height: 1000,
                deviceScaleFactor: 1,
                disabled: false,
              },
              throttlingMethod: "provided",
            }
          : {}),
      },
    );
    await writeFile(`.artifacts/lighthouse/${formFactor}.html`, result.report);
    summary[formFactor] = Object.fromEntries(
      Object.entries(result.lhr.categories).map(([key, value]) => [
        key,
        Math.round(value.score * 100),
      ]),
    );
    console.log(formFactor, summary[formFactor]);
  } finally {
    await browser.close();
  }
}
await writeFile(
  ".artifacts/lighthouse/scores.json",
  JSON.stringify(summary, null, 2),
);
if (
  Object.values(summary).some((scores) =>
    Object.values(scores).some((score) => score < 90),
  )
)
  process.exitCode = 1;
