import Link from "next/link";
import { labPages } from "./pages";

export default function LabHub() {
  return (
    <div className="lab-wrap lab-hub">
      <header className="lab-head">
        <p className="lab-eyebrow">Prototypes · not on the live site</p>
        <h1>Lab</h1>
        <p className="lab-intro">
          Five ideas for the next version of the portfolio, each built with the
          site&apos;s real data. Try them, then pick what ships.
        </p>
      </header>
      <ol className="hub-list">
        {labPages.map((p, i) => (
          <li key={p.href}>
            <Link href={p.href}>
              <span className="hub-n" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="hub-t">{p.title}</span>
              <span className="hub-l">{p.line}</span>
              <span className="hub-go" aria-hidden="true">
                →
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
