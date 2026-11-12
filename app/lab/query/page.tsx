import type { Metadata } from "next";
import { QueryConsole } from "./query-console";

export const metadata: Metadata = { title: "Query my portfolio | Lab" };

export default function QueryPage() {
  return (
    <div className="lab-wrap">
      <header className="lab-head">
        <p className="lab-eyebrow">Prototype 01</p>
        <h1>Query my portfolio</h1>
        <p className="lab-intro">
          The site is a database. Ask it anything in SQL, or tap an example.
          Press <kbd>/</kbd> or <kbd>⌘K</kbd> from anywhere to start typing.
        </p>
      </header>
      <QueryConsole />
    </div>
  );
}
