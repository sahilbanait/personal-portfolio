"use client";

import { useSyncExternalStore } from "react";

const subscribe = (cb: () => void) => {
  addEventListener("lab-theme", cb);
  return () => removeEventListener("lab-theme", cb);
};

// The same Colour and Dark choice as the main site, stored in the same place.
export function LabTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset.theme ?? "bold",
    () => "bold",
  );
  const choose = setLabTheme;
  return (
    <div className="lab-ctl" role="group" aria-label="Theme">
      {[
        ["bold", "Colour"],
        ["dark", "Dark"],
      ].map(([t, label]) => (
        <button
          type="button"
          key={t}
          aria-pressed={theme === t}
          onClick={() => choose(t)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function setLabTheme(t: string) {
  document.documentElement.dataset.theme = t;
  try {
    localStorage.setItem("sk-theme", t);
  } catch {
    /* The theme still applies for this visit. */
  }
  dispatchEvent(new Event("lab-theme"));
}
