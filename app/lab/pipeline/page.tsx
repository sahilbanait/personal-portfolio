import type { Metadata } from "next";
import { PipelineRun } from "./pipeline-run";

export const metadata: Metadata = { title: "Pipeline-run scroll | Lab" };

export default function PipelinePage() {
  return (
    <div className="lab-wrap">
      <header className="lab-head">
        <p className="lab-eyebrow">Prototype 03</p>
        <h1>The page is a pipeline</h1>
        <p className="lab-intro">
          Every section is a task. Scroll to run them: queued, running, success.
          Durations are your real reading time.
        </p>
      </header>
      <PipelineRun />
    </div>
  );
}
