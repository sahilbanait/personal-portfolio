import type { Metadata } from "next";
import { LineageGraph } from "./lineage-graph";

export const metadata: Metadata = { title: "Lineage graph | Lab" };

export default function LineagePage() {
  return (
    <div className="lab-wrap">
      <header className="lab-head">
        <p className="lab-eyebrow">Prototype 02</p>
        <h1>Everything connects</h1>
        <p className="lab-intro">
          Like a dbt lineage view of my work. Pick a tool, project, stage or
          certification to trace what it connects to.
        </p>
      </header>
      <LineageGraph />
    </div>
  );
}
