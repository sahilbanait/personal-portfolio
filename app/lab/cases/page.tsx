import type { Metadata } from "next";
import { CaseStudies } from "./case-studies";

export const metadata: Metadata = { title: "Project case studies | Lab" };

export default function CasesPage() {
  return (
    <div className="lab-wrap">
      <header className="lab-head">
        <p className="lab-eyebrow">Prototype 05</p>
        <h1>Projects, in depth</h1>
        <p className="lab-intro">
          Colour now means category, the first project leads, and every card
          opens into a case study.
        </p>
      </header>
      <CaseStudies />
    </div>
  );
}
