"use client";

import { useEffect, useRef, useState } from "react";
import { profile } from "@/data/profile";

const MAX_POINTS = 5200;
// The streams that feed the name: data management disciplines the site already backs up
// (the Govern and Observe stages, the Informatica governance and catalog certifications, dbt, Airflow, Snowflake).
const LANES = [
  "Data integration",
  "Data governance",
  "Data catalog",
  "Metadata and lineage",
  "Data quality",
  "Data modelling",
  "Orchestration",
  "Observability",
  "Warehousing",
];

// Records stream in along tool-named lanes, peel off at their column and settle into the name.
export function DataHero() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const [run, setRun] = useState(0);

  useEffect(() => {
    const el = canvas.current!;
    const box = wrap.current!;
    const ctx = el.getContext("2d")!;
    const root = document.documentElement;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0;
    let H = 0;
    let dpr = 1;
    let n = 0;
    let tx = new Float32Array(0);
    let ty = tx, x = tx, y = tx, vx = tx, vy = tx, lane = tx, delay = tx, speed = tx;
    let state = new Uint8Array(0);
    let laneY: number[] = [];
    let bandX = 0;
    let t0 = 0;
    let raf = 0;
    let visible = true;
    let ema = 0;
    let lastReport = 0;
    const ptr = { x: -9999, y: -9999 };
    let colors = { fg: "#fff7e0", flow: "#a893ff", accent: "#d7ff3e", bg: "#4b25e6" };
    const readColors = () => {
      const cs = getComputedStyle(box);
      colors = {
        fg: cs.getPropertyValue("--fg").trim() || colors.fg,
        flow: cs.getPropertyValue("--ctl-line").trim() || colors.flow,
        accent: cs.getPropertyValue("--accent").trim() || colors.accent,
        bg: cs.getPropertyValue("--bg").trim() || colors.bg,
      };
    };

    const setup = async () => {
      const family = getComputedStyle(root).getPropertyValue("--font-anton").trim() || "sans-serif";
      // Load only the real face: the generated "Fallback" face in the list can't be fetched.
      await document.fonts?.load(`400 100px ${family.split(",")[0]}`).catch(() => undefined);
      readColors();
      const r = box.getBoundingClientRect();
      W = Math.round(r.width);
      H = Math.round(r.height);
      dpr = Math.min(2, devicePixelRatio || 1);
      el.width = W * dpr;
      el.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Draw the name off screen and sample its pixels as targets.
      const lines = W / H > 1.15 ? [profile.name.toUpperCase()] : profile.name.toUpperCase().split(" ");
      const off = document.createElement("canvas");
      off.width = W;
      off.height = H;
      const o = off.getContext("2d", { willReadFrequently: true })!;
      let size = H;
      o.font = `400 ${size}px ${family}`;
      const widest = Math.max(...lines.map((l) => o.measureText(l).width));
      size = Math.min((W * 0.86 * size) / widest, (H * 0.62) / (lines.length * 0.98));
      o.font = `400 ${size}px ${family}`;
      o.fillStyle = "#fff";
      o.textAlign = "center";
      o.textBaseline = "middle";
      const lh = size * 0.98;
      lines.forEach((l, i) => o.fillText(l, W / 2, H * 0.47 + (i - (lines.length - 1) / 2) * lh));
      const img = o.getImageData(0, 0, W, H).data;
      let step = Math.max(2, Math.round(Math.sqrt((W * H) / 26000)));
      let pts: number[] = [];
      for (;;) {
        pts = [];
        for (let yy = 0; yy < H; yy += step)
          for (let xx = 0; xx < W; xx += step) if (img[(yy * W + xx) * 4 + 3] > 128) pts.push(xx, yy);
        if (pts.length / 2 <= MAX_POINTS) break;
        step++;
      }
      n = pts.length / 2;
      tx = new Float32Array(n);
      ty = new Float32Array(n);
      x = new Float32Array(n);
      y = new Float32Array(n);
      vx = new Float32Array(n);
      vy = new Float32Array(n);
      lane = new Float32Array(n);
      delay = new Float32Array(n);
      speed = new Float32Array(n);
      state = new Uint8Array(n);
      bandX = Math.max(18, W * 0.03);
      laneY = LANES.map((_, i) => H * (0.14 + (0.72 * i) / (LANES.length - 1)));
      for (let i = 0; i < n; i++) {
        tx[i] = pts[i * 2] + (Math.random() - 0.5) * step * 0.6;
        ty[i] = pts[i * 2 + 1] + (Math.random() - 0.5) * step * 0.6;
        lane[i] = (Math.random() * LANES.length) | 0;
        // Points further right leave a little later, so the name fills left to right.
        delay[i] = Math.random() * 1800 + (tx[i] / W) * 900;
        speed[i] = W * (0.32 + Math.random() * 0.3);
        x[i] = bandX;
        y[i] = laneY[lane[i]];
        state[i] = reduced ? 2 : 0;
        if (reduced) {
          x[i] = tx[i];
          y[i] = ty[i];
        }
      }
      t0 = performance.now();
      draw(t0);
    };

    let prev = 0;
    const update = (now: number) => {
      const dt = Math.min(0.05, (now - (prev || now)) / 1000);
      prev = now;
      const el2 = now - t0;
      for (let i = 0; i < n; i++) {
        const s = state[i];
        if (s === 0) {
          if (el2 < delay[i]) continue;
          x[i] += speed[i] * dt;
          y[i] = laneY[lane[i]] + Math.sin((x[i] + i) * 0.03) * 1.5;
          if (x[i] >= tx[i]) state[i] = 1;
          continue;
        }
        // Spring to the target, pushed aside by the pointer.
        let ax = (tx[i] - x[i]) * 38 - vx[i] * 9;
        let ay = (ty[i] - y[i]) * 38 - vy[i] * 9;
        const dx = x[i] - ptr.x;
        const dy = y[i] - ptr.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 6400) {
          const d = Math.sqrt(d2) || 1;
          const f = (1 - d / 80) * 5200;
          ax += (dx / d) * f;
          ay += (dy / d) * f;
          state[i] = 1;
        }
        vx[i] += ax * dt;
        vy[i] += ay * dt;
        x[i] += vx[i] * dt;
        y[i] += vy[i] * dt;
        if (s === 1 && Math.abs(tx[i] - x[i]) + Math.abs(ty[i] - y[i]) < 0.6 && Math.abs(vx[i]) + Math.abs(vy[i]) < 4)
          state[i] = 2;
      }
    };

    const draw = (now: number) => {
      ctx.clearRect(0, 0, W, H);
      const el2 = now - t0;
      // Lanes and their names fade once the name has formed.
      const laneAlpha = reduced ? 0 : Math.max(0, 1 - Math.max(0, el2 - 3200) / 1400);
      if (laneAlpha > 0) {
        ctx.globalAlpha = 0.28 * laneAlpha;
        ctx.strokeStyle = colors.flow;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 7]);
        laneY.forEach((ly) => {
          ctx.beginPath();
          ctx.moveTo(bandX, ly);
          ctx.lineTo(W, ly);
          ctx.stroke();
        });
        ctx.setLineDash([]);
        ctx.globalAlpha = laneAlpha;
        ctx.fillStyle = colors.accent;
        ctx.fillRect(bandX - 1.5, H * 0.08, 3, H * 0.84);
      }
      ctx.globalAlpha = 1;
      const sz = W < 600 ? 1.6 : 2;
      ctx.fillStyle = colors.flow;
      for (let i = 0; i < n; i++) if (state[i] === 0 && el2 >= delay[i]) ctx.fillRect(x[i], y[i], sz, sz);
      ctx.fillStyle = colors.fg;
      for (let i = 0; i < n; i++) if (state[i] !== 0) ctx.fillRect(x[i], y[i], sz, sz);
      // Lane names sit on small pills above the points, so they stay readable while the name forms.
      if (laneAlpha > 0) {
        ctx.font = `600 12px ${getComputedStyle(root).getPropertyValue("--font-body") || "sans-serif"}`;
        ctx.textBaseline = "middle";
        LANES.forEach((t, i) => {
          const w = ctx.measureText(t).width + 14;
          const ly = laneY[i] - 11;
          ctx.globalAlpha = 0.9 * laneAlpha;
          ctx.fillStyle = colors.bg;
          ctx.beginPath();
          ctx.roundRect(bandX + 6, ly - 10, w, 20, 10);
          ctx.fill();
          ctx.globalAlpha = laneAlpha;
          ctx.fillStyle = colors.fg;
          ctx.fillText(t, bandX + 13, ly + 0.5);
        });
        ctx.globalAlpha = 1;
      }
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || root.classList.contains("paused")) {
        prev = 0;
        return;
      }
      const a = performance.now();
      update(now);
      draw(now);
      ema = ema * 0.92 + (performance.now() - a) * 0.08;
      if (now - lastReport > 500 && readout.current) {
        lastReport = now;
        readout.current.textContent = `${n.toLocaleString()} points · ${ema.toFixed(1)} ms/frame`;
      }
    };

    let alive = true;
    setup().then(() => {
      if (!alive) return;
      if (readout.current) readout.current.textContent = `${n.toLocaleString()} points`;
      if (!reduced) raf = requestAnimationFrame(frame);
    });

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(box);
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ptr.x = e.clientX - r.left;
      ptr.y = e.clientY - r.top;
    };
    const leave = () => {
      ptr.x = ptr.y = -9999;
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerdown", move);
    el.addEventListener("pointerleave", leave);
    const up = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") leave();
    };
    el.addEventListener("pointerup", up);
    let resizeTimer = 0;
    let lastW = box.clientWidth;
    const ro = new ResizeObserver(() => {
      if (box.clientWidth === lastW) return;
      lastW = box.clientWidth;
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => setRun((r) => r + 1), 250);
    });
    ro.observe(box);
    const onTheme = () => {
      readColors();
      if (reduced) draw(performance.now());
    };
    addEventListener("lab-theme", onTheme);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      clearTimeout(resizeTimer);
      removeEventListener("lab-theme", onTheme);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerdown", move);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("pointerup", up);
    };
  }, [run]);

  return (
    <div className="dh">
      <div className="dh-stage" ref={wrap}>
        <h1 className="vh">{profile.name}</h1>
        <canvas ref={canvas} aria-hidden="true" />
      </div>
      <div className="dh-under">
        <p className="dh-role">
          {profile.title}, {profile.location}
        </p>
        <p className="dh-line">{profile.pitch}</p>
        <div className="dh-ctl">
          <button type="button" onClick={() => setRun((r) => r + 1)}>
            Run again
          </button>
          <span className="dh-perf" ref={readout} aria-live="off" />
        </div>
        <p className="dh-tip">Move your pointer, or drag a finger, through the name.</p>
      </div>
    </div>
  );
}
