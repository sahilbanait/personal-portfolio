// The deploy workflow sets both of these. End NEXT_PUBLIC_SITE_URL with a slash.
export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000/",
);
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
