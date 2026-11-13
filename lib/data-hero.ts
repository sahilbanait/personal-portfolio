// The living data hero: records stream in along data management lanes and settle into the
// name, exactly where the real <h1> sits. The <h1> stays in the page for screen readers,
// search and visitors without JavaScript; CSS only hides it while the points draw it.

// The streams that feed the name: data management disciplines the site already backs up
// (the Govern and Observe stages, the Informatica governance and catalog certifications, dbt, Airflow, Snowflake).
export const LANES = [
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

const LANE_FADE_AT = 3200;
const LANE_FADE_FOR = 1400;

/** Starts the hero. Returns a function that stops it and puts the plain name back. */
export function startDataHero(hero: HTMLElement, isPaused: () => boolean): () => void {
  const h1 = hero.querySelector<HTMLElement>("h1");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!h1 || !ctx) {
    hero.classList.add("dh-fail");
    return () => {};
  }
  canvas.className = "dh-canvas";
  canvas.setAttribute("aria-hidden", "true");
  hero.prepend(canvas);
  hero.classList.add("dh-on");

  let W = 0;
  let H = 0;
  let n = 0;
  let tx = new Float32Array(0);
  let ty = tx;
  let x = tx;
  let y = tx;
  let vx = tx;
  let vy = tx;
  let delay = tx;
  let speed = tx;
  let lane = new Uint8Array(0);
  let state = new Uint8Array(0);
  let laneY: number[] = [];
  let bandX = 0;
  let t0 = 0;
  let prev = 0;
  let raf = 0;
  let visible = true;
  let dirty = true;
  let streaming = true;
  const ptr = { x: -9999, y: -9999 };
  let colors = { fg: "#fff7e0", flow: "#a893ff", accent: "#d7ff3e", bg: "#4b25e6" };
  const readColors = () => {
    const cs = getComputedStyle(hero);
    colors = {
      fg: cs.getPropertyValue("--fg").trim() || colors.fg,
      flow: cs.getPropertyValue("--ctl-line").trim() || colors.flow,
      accent: cs.getPropertyValue("--accent").trim() || colors.accent,
      bg: cs.getPropertyValue("--bg").trim() || colors.bg,
    };
    dirty = true;
  };

  // Targets come from the real letters, so the points form the name at its exact size and place.
  const setup = (replay: boolean) => {
    const box = hero.getBoundingClientRect();
    W = Math.round(box.width);
    H = Math.round(box.height);
    if (!W || !H) return;
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    readColors();

    const off = document.createElement("canvas");
    off.width = W;
    off.height = H;
    const o = off.getContext("2d", { willReadFrequently: true })!;
    const cs = getComputedStyle(h1);
    o.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    o.fillStyle = "#fff";
    o.textBaseline = "alphabetic";
    const m = o.measureText("H");
    const asc = m.fontBoundingBoxAscent;
    const desc = m.fontBoundingBoxDescent;
    h1.querySelectorAll<HTMLElement>(".l").forEach((l) => {
      const r = l.getBoundingClientRect();
      const base = r.top - box.top + (r.height - (asc + desc)) / 2 + asc;
      o.fillText((l.textContent ?? "").toUpperCase(), r.left - box.left, base);
    });
    const img = o.getImageData(0, 0, W, H).data;
    const name = h1.getBoundingClientRect();
    const cap = W < 700 ? 3600 : 6400;
    let step = Math.max(2, Math.round(Math.sqrt((name.width * name.height) / (cap * 1.6))));
    let pts: number[] = [];
    for (;;) {
      pts = [];
      for (let yy = 0; yy < H; yy += step)
        for (let xx = 0; xx < W; xx += step) if (img[(yy * W + xx) * 4 + 3] > 128) pts.push(xx, yy);
      if (pts.length / 2 <= cap) break;
      step++;
    }

    n = pts.length / 2;
    tx = new Float32Array(n);
    ty = new Float32Array(n);
    x = new Float32Array(n);
    y = new Float32Array(n);
    vx = new Float32Array(n);
    vy = new Float32Array(n);
    delay = new Float32Array(n);
    speed = new Float32Array(n);
    lane = new Uint8Array(n);
    state = new Uint8Array(n);
    // Lanes run across the band the name occupies, starting just left of it.
    bandX = Math.max(6, name.left - box.left - 14);
    // Kept inside the name's own band, so lane names never cover the lines above and below it.
    const top = name.top - box.top + 26;
    const span = Math.max(40, name.height - 34);
    laneY = LANES.map((_, i) => top + (span * i) / (LANES.length - 1));
    for (let i = 0; i < n; i++) {
      tx[i] = pts[i * 2] + (Math.random() - 0.5) * step * 0.6;
      ty[i] = pts[i * 2 + 1] + (Math.random() - 0.5) * step * 0.6;
      lane[i] = (Math.random() * LANES.length) | 0;
      delay[i] = Math.random() * 1800 + (tx[i] / W) * 900;
      speed[i] = W * (0.32 + Math.random() * 0.3);
      if (replay) {
        x[i] = bandX;
        y[i] = laneY[lane[i]];
        state[i] = 0;
      } else {
        x[i] = tx[i];
        y[i] = ty[i];
        state[i] = 2;
      }
    }
    streaming = replay;
    hero.classList.toggle("dh-stream", replay);
    t0 = performance.now();
    prev = 0;
    dirty = true;
  };

  const update = (now: number) => {
    const dt = Math.min(0.05, (now - (prev || now)) / 1000);
    prev = now;
    const age = now - t0;
    let moving = 0;
    for (let i = 0; i < n; i++) {
      const s = state[i];
      if (s === 0) {
        moving++;
        if (age < delay[i]) continue;
        x[i] += speed[i] * dt;
        y[i] = laneY[lane[i]] + Math.sin((x[i] + i) * 0.03) * 1.5;
        if (x[i] >= tx[i]) state[i] = 1;
        continue;
      }
      const dx = x[i] - ptr.x;
      const dy = y[i] - ptr.y;
      const d2 = dx * dx + dy * dy;
      if (s === 2 && d2 >= 6400) continue;
      // Spring to the target, pushed aside by the pointer.
      let ax = (tx[i] - x[i]) * 38 - vx[i] * 9;
      let ay = (ty[i] - y[i]) * 38 - vy[i] * 9;
      if (d2 < 6400) {
        const d = Math.sqrt(d2) || 1;
        const f = (1 - d / 80) * 5200;
        ax += (dx / d) * f;
        ay += (dy / d) * f;
      }
      vx[i] += ax * dt;
      vy[i] += ay * dt;
      x[i] += vx[i] * dt;
      y[i] += vy[i] * dt;
      if (Math.abs(tx[i] - x[i]) + Math.abs(ty[i] - y[i]) < 0.6 && Math.abs(vx[i]) + Math.abs(vy[i]) < 4) {
        x[i] = tx[i];
        y[i] = ty[i];
        vx[i] = vy[i] = 0;
        state[i] = 2;
      } else {
        state[i] = 1;
        moving++;
      }
    }
    return moving;
  };

  const draw = (now: number) => {
    ctx.clearRect(0, 0, W, H);
    const age = now - t0;
    const laneAlpha = streaming ? Math.max(0, 1 - Math.max(0, age - LANE_FADE_AT) / LANE_FADE_FOR) : 0;
    if (streaming && laneAlpha === 0) {
      streaming = false;
      hero.classList.remove("dh-stream");
    }
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
      ctx.fillRect(bandX - 1.5, laneY[0] - 14, 3, laneY[laneY.length - 1] - laneY[0] + 28);
    }
    ctx.globalAlpha = 1;
    const sz = W < 700 ? 1.7 : 2.1;
    ctx.fillStyle = colors.flow;
    for (let i = 0; i < n; i++) if (state[i] === 0 && age >= delay[i]) ctx.fillRect(x[i], y[i], sz, sz);
    ctx.fillStyle = colors.fg;
    for (let i = 0; i < n; i++) if (state[i] !== 0) ctx.fillRect(x[i], y[i], sz, sz);
    // Lane names sit on small pills above the points, so they stay readable while the name forms.
    if (laneAlpha > 0) {
      ctx.font = `600 12px ${getComputedStyle(hero).fontFamily}`;
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

  // Draws only while something moves; once the name has settled it costs nothing.
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (!visible || isPaused()) {
      prev = 0;
      return;
    }
    const moving = update(now);
    if (moving || streaming || dirty) {
      draw(now);
      dirty = moving > 0;
    }
  };

  let started = false;
  document.fonts.ready.then(() => {
    if (!hero.isConnected || started) return;
    started = true;
    // Paused visitors get the finished name at once.
    setup(!isPaused());
    draw(performance.now());
    raf = requestAnimationFrame(frame);
  });

  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(hero);
  const move = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    ptr.x = e.clientX - r.left;
    ptr.y = e.clientY - r.top;
    dirty = true;
  };
  const leave = () => {
    ptr.x = ptr.y = -9999;
    dirty = true;
  };
  const up = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") leave();
  };
  hero.addEventListener("pointermove", move, { passive: true });
  hero.addEventListener("pointerdown", move, { passive: true });
  hero.addEventListener("pointerleave", leave);
  hero.addEventListener("pointerup", up);
  hero.addEventListener("pointercancel", leave);
  // A new width re-forms the name in place, without replaying the stream.
  let lastW = hero.clientWidth;
  let resizeTimer = 0;
  const ro = new ResizeObserver(() => {
    if (!started || hero.clientWidth === lastW) return;
    lastW = hero.clientWidth;
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      setup(false);
      draw(performance.now());
    }, 200);
  });
  ro.observe(hero);
  const themeWatch = new MutationObserver(readColors);
  themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  return () => {
    cancelAnimationFrame(raf);
    clearTimeout(resizeTimer);
    io.disconnect();
    ro.disconnect();
    themeWatch.disconnect();
    hero.removeEventListener("pointermove", move);
    hero.removeEventListener("pointerdown", move);
    hero.removeEventListener("pointerleave", leave);
    hero.removeEventListener("pointerup", up);
    hero.removeEventListener("pointercancel", leave);
    canvas.remove();
    hero.classList.remove("dh-on", "dh-stream");
  };
}
