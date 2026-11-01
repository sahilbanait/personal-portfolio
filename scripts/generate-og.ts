import sharp from "sharp";
import { profile } from "../data/profile.ts";

const escape = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#4B25E6"/>
<g fill="none" stroke="#8A70F5" stroke-width="3"><circle cx="960" cy="315" r="170"/></g>
<g fill="#D7FF3E"><circle cx="960" cy="145" r="20"/><circle cx="1130" cy="315" r="20"/><circle cx="960" cy="485" r="20"/><circle cx="790" cy="315" r="20"/></g>
<text x="80" y="110" font-family="sans-serif" font-size="30" font-weight="600" fill="#E0D9FF">${escape(profile.title)}, ${escape(profile.location)}</text>
<text x="74" y="300" font-family="sans-serif" font-size="108" font-weight="800" fill="#FFF7E0">Sahil</text>
<text x="74" y="410" font-family="sans-serif" font-size="108" font-weight="800" fill="#FFF7E0">Kumar</text>
<text x="80" y="530" font-family="sans-serif" font-size="30" font-weight="600" fill="#D7FF3E">${escape(profile.pitch)}</text></svg>`;
await sharp(Buffer.from(svg)).png().toFile("public/og.png");
