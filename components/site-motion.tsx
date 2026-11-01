"use client";

import { useEffect } from "react";
import { startMotion } from "@/lib/motion";

// All content is rendered on the server. This only adds movement to it.
export function SiteMotion() {
  useEffect(() => startMotion(), []);
  return null;
}
