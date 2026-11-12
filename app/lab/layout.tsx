import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { spriteMarkup } from "@/lib/art";
import { LabTheme } from "./lab-theme";
import { labPages } from "./pages";
import "./lab.css";

// Prototypes only: kept out of search results and the sitemap.
export const metadata: Metadata = {
  title: "Lab | Sahil Kumar",
  robots: { index: false, follow: false },
};

export default function LabLayout({ children }: { children: ReactNode }) {
  return (
    <div className="lab">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <svg
        className="vh"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: spriteMarkup }}
      />
      <header className="lab-bar">
        <div className="lab-bar-in">
          <Link className="lab-home" href="/lab/">
            SK <span>Lab</span>
          </Link>
          <nav className="lab-nav" aria-label="Prototypes">
            {labPages.map((p) => (
              <Link href={p.href} key={p.href}>
                {p.short}
              </Link>
            ))}
          </nav>
          <LabTheme />
          <Link className="lab-live" href="/">
            Live site
          </Link>
        </div>
      </header>
      <main id="main">{children}</main>
    </div>
  );
}
