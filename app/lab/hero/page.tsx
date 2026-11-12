import type { Metadata } from "next";
import { DataHero } from "./data-hero";

export const metadata: Metadata = { title: "Living data hero | Lab" };

export default function HeroPage() {
  return (
    <div className="lab-hero-page">
      <DataHero />
    </div>
  );
}
