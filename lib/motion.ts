import { aiSkills, stages } from "@/data/profile";
import { iconHtml, RING } from "@/lib/art";

const $ = <T extends Element = HTMLElement>(id: string) =>
  document.getElementById(id) as unknown as T;
const $$ = <T extends Element = HTMLElement>(
  sel: string,
  root: ParentNode = document,
) => [...root.querySelectorAll<T>(sel)];
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const OUT = "cubic-bezier(.22,1,.36,1)";

/** Starts every animation and interaction on the page. Returns a function that stops them all. */
export function startMotion() {
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isPaused = () => root.classList.contains("paused");
  const stop = new AbortController();
  const on = { signal: stop.signal };
  const cleanups: (() => void)[] = [];
  let running = true;
  const loop = (frame: (now: number) => void) => {
    const run = (now: number) => {
      if (!running) return;
      requestAnimationFrame(run);
      frame(now);
    };
    requestAnimationFrame(run);
  };
  const observe = (
    cb: IntersectionObserverCallback,
    threshold: number,
    targets: Element[],
  ) => {
    const io = new IntersectionObserver(cb, { threshold });
    targets.forEach((t) => io.observe(t));
    cleanups.push(() => io.disconnect());
  };

  /* ---------- Reveal on scroll ---------- */
  observe(
    (entries, io) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
          if (e.target.classList.contains("card"))
            setTimeout(() => e.target.classList.add("settled"), 1200);
        }
      }),
    0.1,
    $$(".up, h2.head"),
  );

  /* ---------- Data engineering wheel ---------- */
  const N = stages.length;
  const { C } = RING;
  const lifecycle = $("lifecycle");
  const panel = $("panel");
  const ring = $<SVGSVGElement>("ring");
  const rotor = $<SVGGElement>("rotor");
  const live = $<SVGPathElement>("live");
  const prevBtn = $<HTMLButtonElement>("prevStage");
  const nextBtn = $<HTMLButtonElement>("nextStage");
  const wheelCtl = $("wheelCtl");
  const nodes = $$<SVGGElement>(".ring-node");
  const labels = $$<SVGGElement>(".ring-node .lbl");
  const stopBtns = $$<HTMLButtonElement>("#stops button");
  const pin = document.querySelector(".pin") as HTMLElement;
  let active = -1;
  let interacted = false;
  // Where a button press is heading, so a second press counts on from there.
  let goal = -1;
  addEventListener("scrollend", () => (goal = -1), on);

  const showStage = (i: number) => {
    if (i === active) return;
    active = i;
    const s = stages[i];
    panel.innerHTML = `<div class="stage-word"><span class="word-in">${s.t}</span></div><p class="stage-line line-in">${s.p}</p><ul class="stage-tools">${s.tools.map((t, k) => `<li class="pop" style="--n:${k}">${iconHtml(t)}${t}</li>`).join("")}</ul>`;
    nodes.forEach((nd, k) => {
      nd.classList.toggle("on", k === i);
      nd.classList.toggle("done", k < i);
    });
    stopBtns.forEach((b, k) => {
      b.classList.toggle("on", k === i);
      if (k === i) b.setAttribute("aria-current", "step");
      else b.removeAttribute("aria-current");
    });
    lifecycle.classList.toggle("ai-on", !!s.ai);
    $("wheelCount").textContent = `${i + 1} of ${N}`;
    // aria-disabled, because a truly disabled button would drop keyboard focus.
    prevBtn.setAttribute("aria-disabled", String(i === 0));
    nextBtn.setAttribute("aria-disabled", String(i === N - 1));
  };
  showStage(0);

  // Keep each label upright and just outside the ring, wherever its node has rotated to.
  const placeLabels = (rot: number) =>
    labels.forEach((l, i) => {
      const a = (((i / N) * 360 - 90 + rot) * Math.PI) / 180;
      const cx = Math.cos(a);
      const cy = Math.sin(a);
      l.setAttribute(
        "transform",
        `rotate(${-rot}) translate(${cx * 34} ${cy * 34 + 9 + Math.max(0, cy) * 16})`,
      );
      l.firstElementChild!.setAttribute(
        "text-anchor",
        Math.abs(cx) < 0.35 ? "middle" : cx > 0 ? "start" : "end",
      );
    });
  const anchor = () => (innerWidth < 1000 ? 180 : 270);
  placeLabels(anchor());
  // Ring labels stay at least 13.5px on screen, however small the wheel gets.
  const ringSizer = new ResizeObserver(() => {
    const w = ring.getBoundingClientRect().width;
    if (!w) return;
    ring.style.setProperty("--lbl", `${Math.max(25, (13.5 * 680) / w)}px`);
    ring.style.setProperty("--sub", `${Math.max(18, (11 * 680) / w)}px`);
  });
  ringSizer.observe(ring);
  cleanups.push(() => ringSizer.disconnect());

  const loopRange = () => {
    const r = lifecycle.getBoundingClientRect();
    const bar = $("bar").offsetHeight;
    return { top: r.top + scrollY - bar, len: r.height - (innerHeight - bar) };
  };
  // Measurements only change when the layout does, so they're cached between resizes.
  const layout = { pinned: false, range: { top: 0, len: 1 }, max: 1 };
  const measure = () => {
    layout.pinned = getComputedStyle(pin).position === "sticky";
    layout.range = loopRange();
    layout.max = root.scrollHeight - innerHeight;
  };
  measure();
  const layoutWatcher = new ResizeObserver(measure);
  layoutWatcher.observe(document.body);
  cleanups.push(() => layoutWatcher.disconnect());
  const goTo = (i: number) => {
    interacted = true;
    goal = clamp(i, 0, N - 1);
    const { top, len } = loopRange();
    scrollTo({
      top: top + len * ((goal + 0.3) / N),
      behavior: "smooth",
    });
  };
  stopBtns.forEach((b) =>
    b.addEventListener("click", () => goTo(Number(b.dataset.i)), on),
  );
  prevBtn.addEventListener(
    "click",
    () => {
      if (active > 0) goTo((goal < 0 ? active : goal) - 1);
    },
    on,
  );
  nextBtn.addEventListener(
    "click",
    () => {
      if (active < N - 1) goTo((goal < 0 ? active : goal) + 1);
    },
    on,
  );

  /* ---------- Phone menu ---------- */
  const menu = $<HTMLDetailsElement>("menu");
  menu.addEventListener(
    "click",
    (e) => {
      if ((e.target as Element).closest("a")) menu.open = false;
    },
    on,
  );
  menu.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape" && menu.open) {
        menu.open = false;
        menu.querySelector("summary")!.focus();
      }
    },
    on,
  );

  // A mouse drag turns the wheel by moving the page. Touch keeps normal swiping, and tapping a stage still works.
  let drag: {
    a: number;
    x: number;
    y: number;
    moved: boolean;
    scroll: number;
  } | null = null;
  let justDragged = false;
  const ringAngle = (e: PointerEvent) => {
    const r = ring.getBoundingClientRect();
    return (
      (Math.atan2(
        e.clientY - (r.top + r.height / 2),
        e.clientX - (r.left + r.width / 2),
      ) *
        180) /
      Math.PI
    );
  };
  ring.addEventListener(
    "pointerdown",
    (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      drag = {
        a: ringAngle(e),
        x: e.clientX,
        y: e.clientY,
        moved: false,
        scroll: scrollY,
      };
      e.preventDefault();
    },
    on,
  );
  addEventListener(
    "pointermove",
    (e) => {
      if (!drag) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 5)
        return;
      drag.moved = true;
      interacted = true;
      ring.classList.add("dragging");
      const a = ringAngle(e);
      let d = a - drag.a;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      drag.a = a;
      const { top, len } = loopRange();
      drag.scroll = clamp(drag.scroll - (d / 360) * len, top, top + len);
      scrollTo({ top: drag.scroll, behavior: "instant" });
    },
    on,
  );
  addEventListener(
    "pointerup",
    () => {
      if (!drag) return;
      justDragged = drag.moved;
      drag = null;
      ring.classList.remove("dragging");
    },
    on,
  );
  ring.addEventListener(
    "click",
    (e) => {
      if (justDragged) {
        justDragged = false;
        return;
      }
      const node = (e.target as Element).closest<SVGGElement>(".ring-node");
      if (node) goTo(Number(node.dataset.i));
    },
    on,
  );

  /* ---------- Project scenes ---------- */
  const LOOP = 7200;
  const HOLD = 0.93;
  const gridCards = $$("#grid .card");
  const sceneAnims = new Map<Element, Animation[]>();

  function frames(type: string, n: number[]): Keyframe[] {
    const [a, b] = type === "move" ? n.slice(2) : n;
    const start: Keyframe = {};
    const done: Keyframe = {};
    if (type === "fade") {
      start.opacity = 0;
      done.opacity = 1;
    }
    if (type === "pop") {
      start.opacity = 0;
      start.transform = "scale(.3)";
      done.opacity = 1;
      done.transform = "scale(1)";
    }
    if (type === "grow") {
      start.transform = "scaleY(0)";
      done.transform = "scaleY(1)";
    }
    if (type === "growx") {
      start.transform = "scaleX(0)";
      done.transform = "scaleX(1)";
    }
    if (type === "draw") {
      start.strokeDashoffset = 1;
      done.strokeDashoffset = 0;
    }
    if (type === "move") {
      start.transform = `translate(${n[0]}px,${n[1]}px)`;
      done.transform = "translate(0px,0px)";
    }
    if (type === "travel")
      return [
        { offsetDistance: "0%", opacity: 0, offset: 0 },
        { offsetDistance: "0%", opacity: 0, offset: a },
        {
          offsetDistance: "6%",
          opacity: 1,
          offset: a + 0.01,
          easing: "linear",
        },
        { offsetDistance: "100%", opacity: 1, offset: b },
        { offsetDistance: "100%", opacity: 0, offset: Math.min(1, b + 0.01) },
        { offsetDistance: "100%", opacity: 0, offset: 1 },
      ];
    if (type === "blip")
      return [
        { opacity: 0, offset: 0 },
        { opacity: 0, offset: a },
        { opacity: 1, offset: a + 0.02 },
        { opacity: 1, offset: b - 0.02 },
        { opacity: 0, offset: b },
        { opacity: 0, offset: 1 },
      ];
    if (type === "scan")
      return [
        { transform: "translateY(0)", opacity: 0, offset: 0 },
        { transform: "translateY(0)", opacity: 0, offset: a },
        {
          transform: "translateY(0)",
          opacity: 1,
          offset: a + 0.01,
          easing: "ease-in-out",
        },
        { transform: "translateY(112px)", opacity: 1, offset: b },
        { transform: "translateY(112px)", opacity: 0, offset: b + 0.02 },
        { transform: "translateY(112px)", opacity: 0, offset: 1 },
      ];
    // Hold the finished picture, then clear it just before the loop starts again.
    return [
      { ...start, offset: 0 },
      { ...start, offset: a, easing: OUT },
      { ...done, offset: b },
      { ...done, offset: HOLD },
      { ...start, offset: 1 },
    ];
  }
  const restart = (c: HTMLElement) =>
    sceneAnims.get(c)?.forEach((a) => {
      a.currentTime = 0;
      if (c.classList.contains("live") && !isPaused() && !c.hidden) a.play();
    });
  // Built the first time a card comes on screen, so loading the page stays light.
  const buildScene = (c: Element) => {
    if (reduced || sceneAnims.has(c) || !gridCards.includes(c as HTMLElement))
      return;
    const anims = $$<SVGElement>("[data-a]", c).map((el) => {
      const [t, ...r] = el.dataset.a!.split(" ");
      if (t === "draw") {
        el.setAttribute("pathLength", "1");
        el.setAttribute("stroke-dasharray", "1");
      }
      if (t === "grow") el.style.transformOrigin = "center bottom";
      if (t === "growx") el.style.transformOrigin = "left center";
      const a = el.animate(frames(t, r.map(Number)), {
        duration: LOOP,
        iterations: Infinity,
      });
      a.pause();
      return a;
    });
    sceneAnims.set(c, anims);
  };
  if (!reduced)
    gridCards.forEach((c) =>
      c.addEventListener(
        "pointerenter",
        (e) => {
          if (e.pointerType === "mouse" && !isPaused()) restart(c);
        },
        on,
      ),
    );
  cleanups.push(() =>
    sceneAnims.forEach((list) => list.forEach((a) => a.cancel())),
  );
  // Scenes and looping pictures run only while their card is on screen.
  observe(
    (entries) =>
      entries.forEach((e) => {
        e.target.classList.toggle("live", e.isIntersecting);
        if (e.isIntersecting) buildScene(e.target);
        sceneAnims
          .get(e.target)
          ?.forEach((a) =>
            e.isIntersecting && !isPaused() ? a.play() : a.pause(),
          );
      }),
    0.2,
    $$(".card"),
  );

  /* ---------- Project filter ---------- */
  const filter = $("filter");
  const filBtns = $$<HTMLButtonElement>("button", filter);
  const filInd = $("filInd");
  const moveInd = () => {
    const b = filBtns.find((x) => x.getAttribute("aria-pressed") === "true")!;
    filInd.style.width = `${b.offsetWidth}px`;
    filInd.style.height = `${b.offsetHeight}px`;
    filInd.style.transform = `translate(${b.offsetLeft}px,${b.offsetTop}px)`;
  };
  moveInd();
  document.fonts?.ready.then(() => {
    if (running) moveInd();
  });
  addEventListener("resize", moveInd, on);
  let filterRun = 0;
  function applyFilter(g: string) {
    const run = ++filterRun;
    const want = (c: HTMLElement) =>
      g === "All" || c.dataset.g!.split(" ").includes(g);
    const shown = gridCards.filter(want).length;
    $("filterStatus").textContent = `${shown} projects shown`;
    const leaving = gridCards.filter((c) => !c.hidden && !want(c));
    const settle = () => {
      if (run !== filterRun) return;
      const before = new Map(
        gridCards
          .filter((c) => !c.hidden)
          .map((c) => [c, c.getBoundingClientRect()]),
      );
      gridCards.forEach((c) => {
        c.hidden = !want(c);
        c.classList.add("in", "settled");
      });
      if (reduced) return;
      gridCards
        .filter((c) => !c.hidden)
        .forEach((c, i) => {
          const was = before.get(c);
          if (was) {
            const now = c.getBoundingClientRect();
            const dx = was.left - now.left;
            const dy = was.top - now.top;
            if (dx || dy)
              c.animate(
                [{ translate: `${dx}px ${dy}px` }, { translate: "0 0" }],
                { duration: 620, easing: OUT },
              );
          } else {
            c.animate(
              [
                { opacity: 0, scale: 0.82, translate: "0 34px" },
                { opacity: 1, scale: 1, translate: "0 0" },
              ],
              { duration: 560, delay: i * 55, fill: "backwards", easing: OUT },
            );
          }
          restart(c);
        });
    };
    if (reduced || !leaving.length) return settle();
    const fades = leaving.map((c) =>
      c.animate(
        [
          { opacity: 1, scale: 1 },
          { opacity: 0, scale: 0.9 },
        ],
        { duration: 170, easing: "ease-in", fill: "forwards" },
      ),
    );
    Promise.all(fades.map((a) => a.finished))
      .then(() => {
        settle();
        fades.forEach((a) => a.cancel());
      })
      .catch(() => {});
  }
  filBtns.forEach((b) =>
    b.addEventListener(
      "click",
      () => {
        filBtns.forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
        moveInd();
        applyFilter(b.dataset.g!);
      },
      on,
    ),
  );

  /* ---------- AI skills and tool sphere ---------- */
  const lab = $("ai");
  const sphere = $("sphere");
  const skillEls = $$("#aiSkills > li");
  let labLive = false;
  // Rows move when a skill opens, so touch screens only open them on a tap.
  let labAuto = !reduced && !matchMedia("(pointer: coarse)").matches;
  let hoverHold = false;
  let activeSkill = 0;
  let skillClock = 0;

  const tools = [...new Set(aiSkills.flatMap((k) => k.t))];
  const golden = Math.PI * (3 - Math.sqrt(5));
  const items = tools.map((t, i) => {
    const y = 1 - (i / (tools.length - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = i * golden;
    const el = document.createElement("span");
    el.className = "sph-item";
    el.innerHTML = `${iconHtml(t)}<span>${t}</span>`;
    sphere.appendChild(el);
    return { t, el, x: Math.cos(th) * r, y, z: Math.sin(th) * r };
  });
  cleanups.push(() => items.forEach((p) => p.el.remove()));
  const turn = (ry: number, rx: number, rz = 0) => {
    const [cy, sy, cx, sx, cz, sz] = [
      Math.cos(ry),
      Math.sin(ry),
      Math.cos(rx),
      Math.sin(rx),
      Math.cos(rz),
      Math.sin(rz),
    ];
    items.forEach((p) => {
      const x = p.x * cy + p.z * sy;
      let z = -p.x * sy + p.z * cy;
      const y = p.y * cx - z * sx;
      z = p.y * sx + z * cx;
      p.x = x * cz - y * sz;
      p.y = x * sz + y * cz;
      p.z = z;
    });
  };
  const isHit = (t: string) => aiSkills[activeSkill].t.includes(t);
  const paintSphere = () => {
    const R = sphere.clientWidth * 0.37;
    items.forEach((p) => {
      const d = (p.z + 1) / 2;
      const hit = isHit(p.t);
      p.el.style.transform = `translate(-50%,-50%) translate3d(${(p.x * R).toFixed(1)}px,${(p.y * R).toFixed(1)}px,0) scale(${(0.6 + 0.5 * d).toFixed(3)})`;
      p.el.style.opacity = (hit ? 0.62 + 0.38 * d : 0.2 + 0.5 * d).toFixed(3);
      p.el.style.zIndex = String(Math.round(d * 100) + (hit ? 100 : 0));
    });
  };
  // Where the active skill's tools are, so the sphere can pull them toward the viewer.
  const centre = () => {
    const h = items.filter((p) => isHit(p.t));
    return {
      x: h.reduce((a, p) => a + p.x, 0) / h.length,
      y: h.reduce((a, p) => a + p.y, 0) / h.length,
    };
  };
  const selectSkill = (i: number) => {
    activeSkill = i;
    skillClock = 0;
    skillEls.forEach((el, k) => {
      el.classList.toggle("on", k === i);
      el.querySelector("button")!.setAttribute(
        "aria-expanded",
        String(k === i),
      );
    });
    items.forEach((p) => p.el.classList.toggle("hit", isHit(p.t)));
    if (reduced) {
      for (let n = 0; n < 160; n++) {
        const c = centre();
        turn(-c.x * 0.05, c.y * 0.05);
      }
      paintSphere();
    }
  };
  skillEls.forEach((el, i) => {
    el.querySelector("button")!.addEventListener(
      "click",
      () => {
        stopAuto();
        selectSkill(i);
      },
      on,
    );
    el.addEventListener(
      "pointerenter",
      (e) => {
        if (e.pointerType === "mouse" && !reduced) {
          hoverHold = true;
          if (activeSkill !== i) selectSkill(i);
        }
      },
      on,
    );
    el.addEventListener(
      "pointerleave",
      () => {
        hoverHold = false;
      },
      on,
    );
  });
  const stopAuto = () => {
    labAuto = false;
    lab.classList.add("chosen");
  };
  $("aiSkills").addEventListener("focusin", stopAuto, on);
  if (!labAuto) stopAuto();
  selectSkill(0);
  paintSphere();
  observe(
    (entries) => {
      labLive = entries[0].isIntersecting;
      lab.classList.toggle("live", labLive);
    },
    0.15,
    [lab],
  );

  /* ---------- Tagline ---------- */
  const words = $$("#swap > span");

  /* ---------- Certification counts ---------- */
  const stats = document.querySelector(".cert-stats") as HTMLElement;

  /* ---------- Pause and theme ---------- */
  const pause = $<HTMLButtonElement>("pause");
  const labelPause = () =>
    pause.setAttribute(
      "aria-label",
      isPaused() ? "Play animations" : "Pause animations",
    );
  labelPause();
  pause.addEventListener(
    "click",
    () => {
      const off = root.classList.toggle("paused");
      labelPause();
      try {
        localStorage.setItem("sk-paused", off ? "1" : "0");
      } catch {
        /* Pausing still works for this visit. */
      }
      sceneAnims.forEach((list, c) =>
        list.forEach((a) =>
          off || !c.classList.contains("live") ? a.pause() : a.play(),
        ),
      );
    },
    on,
  );
  /* ---------- Phone carousels ---------- */
  // Below 681px projects scroll sideways. The buttons step one card and the count follows.
  $$(".swipe").forEach((sw) => {
    const track = $(sw.dataset.for!);
    const [prev, next] = $$<HTMLButtonElement>("button", sw);
    const [cur, total] = $$("span", sw.querySelector(".swipe-count")!);
    const shown = () =>
      ([...track.children] as HTMLElement[]).filter((c) => !c.hidden);
    const step = () => {
      const [a, b] = shown();
      return a && b ? b.offsetLeft - a.offsetLeft : track.clientWidth;
    };
    const update = () => {
      const n = shown().length;
      const i = Math.min(n - 1, Math.round(track.scrollLeft / step()));
      cur.textContent = String(Math.max(1, i + 1));
      total.textContent = String(n);
      prev.setAttribute("aria-disabled", String(track.scrollLeft < 2));
      next.setAttribute(
        "aria-disabled",
        String(track.scrollLeft + track.clientWidth >= track.scrollWidth - 2),
      );
    };
    let queued = false;
    track.addEventListener(
      "scroll",
      () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          update();
        });
      },
      { passive: true, signal: stop.signal },
    );
    [prev, next].forEach((btn) =>
      btn.addEventListener(
        "click",
        () => {
          if (btn.getAttribute("aria-disabled") === "true") return;
          track.scrollBy({
            left: Number(btn.dataset.d) * step(),
            behavior: reduced ? "auto" : "smooth",
          });
        },
        on,
      ),
    );
    // A filter change starts the row again from the first card.
    const mo = new MutationObserver(() => {
      track.scrollTo({ left: 0 });
      update();
    });
    mo.observe(track, { subtree: true, attributeFilter: ["hidden"] });
    cleanups.push(() => mo.disconnect());
    addEventListener("resize", update, on);
    update();
  });

  const themeBtns = $$<HTMLButtonElement>("[data-t]");
  const markTheme = () =>
    themeBtns.forEach((b) =>
      b.setAttribute(
        "aria-pressed",
        String(b.dataset.t === root.dataset.theme),
      ),
    );
  markTheme();
  themeBtns.forEach((b) =>
    b.addEventListener(
      "click",
      () => {
        const t = b.dataset.t!;
        if (root.dataset.theme === t) return;
        const go = () => {
          root.dataset.theme = t;
          markTheme();
          try {
            localStorage.setItem("sk-theme", t);
          } catch {
            /* The theme still works for this visit. */
          }
        };
        if (!document.startViewTransition || reduced) return go();
        const r = b.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        root.style.setProperty("--vx", `${x}px`);
        root.style.setProperty("--vy", `${y}px`);
        root.style.setProperty(
          "--vr",
          `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))}px`,
        );
        document.startViewTransition(go);
      },
      on,
    ),
  );

  const finish = () => {
    running = false;
    stop.abort();
    cleanups.forEach((fn) => fn());
  };
  if (reduced) {
    $<HTMLCanvasElement>("aiBg").style.display = "none";
    return finish;
  }

  /* ---------- Everything below only runs with motion allowed ---------- */

  // Counts run up once.
  observe(
    (entries, io) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      $$("b", stats).forEach((b) => {
        const to = Number(b.dataset.count);
        const t0 = performance.now();
        const step = (t: number) => {
          const k = Math.min(1, (t - t0) / 1100);
          b.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3))));
          if (k < 1 && running) requestAnimationFrame(step);
        };
        step(t0);
      });
    },
    0.4,
    [stats],
  );

  // Tagline words rotate.
  let wi = 0;
  const swapTimer = setInterval(() => {
    if (isPaused() || document.hidden) return;
    const prev = wi;
    words[prev].className = "off";
    wi = (wi + 1) % words.length;
    words[wi].className = "on";
    setTimeout(() => {
      if (prev !== wi) words[prev].className = "";
    }, 620);
  }, 2400);
  cleanups.push(() => clearInterval(swapTimer));

  // One frame drives everything tied to scrolling.
  let cur = 0;
  let prevY = scrollY;
  const progress = $("progress");
  // Looping sections stop when they're off screen.
  let wheelLive = false;
  let heroLive = true;
  observe(
    (entries) =>
      entries.forEach((e) => {
        e.target.classList.toggle("off", !e.isIntersecting);
        if (e.target === lifecycle) wheelLive = e.isIntersecting;
        if (e.target.id === "home") heroLive = e.isIntersecting;
      }),
    0,
    [lifecycle, $("home"), $("contact")],
  );
  const marqueeAnims = $$(".marquee ul").flatMap((el) => el.getAnimations());
  loop((now) => {
    const y = scrollY;
    if (y !== prevY)
      progress.style.transform = `scaleX(${layout.max > 0 ? y / layout.max : 0})`;
    if (wheelLive && layout.pinned) {
      const { top, len } = layout.range;
      const raw = clamp((y - top) / len, 0, 1) * N;
      cur += (raw - cur) * 0.12;
      const p = Math.min(N - 0.001, cur);
      // Rest on each stage: most of each step holds, the end of it glides on.
      const i = Math.floor(p);
      const t = clamp((p - i - 0.6) / 0.4, 0, 1);
      const pos = i + t * t * (3 - 2 * t);
      if (pos > 0.45) interacted = true;
      // Until someone moves it, the wheel gently rocks to show that it turns.
      const nudge =
        !interacted && !isPaused()
          ? Math.sin(now * 0.0028) * 8 * Math.max(0, Math.sin(now * 0.0007))
          : 0;
      const rot = anchor() - (pos / N) * 360 + nudge;
      wheelCtl.classList.toggle("moved", pos >= 0.45);
      rotor.setAttribute("transform", `rotate(${rot} ${C} ${C})`);
      placeLabels(rot);
      live.setAttribute(
        "stroke-dashoffset",
        String(1 - Math.min(1, (pos + (i === N - 1 ? 1 : 0)) / N)),
      );
      showStage(Math.min(N - 1, Math.round(pos)));
    }
    // Pictures drift slightly inside their cards as the page moves.
    gridCards.forEach((c) => {
      if (!c.classList.contains("live")) return;
      const r = c.getBoundingClientRect();
      c.style.setProperty(
        "--py",
        `${(((r.top + r.height / 2 - innerHeight / 2) / innerHeight) * -16).toFixed(1)}px`,
      );
    });
    // Marquees speed up while scrolling.
    const v = Math.min(6, 1 + Math.abs(y - prevY) * 0.12);
    prevY = y;
    if (heroLive && !isPaused())
      marqueeAnims.forEach((a) => {
        a.playbackRate += (v - a.playbackRate) * 0.1;
      });
  });

  // Sphere: drag to spin, otherwise it brings the active skill's tools forward.
  let vy = 0;
  let vx = 0;
  let grab: { x: number; y: number; touch: boolean } | null = null;
  let prev = performance.now();
  sphere.addEventListener(
    "pointerdown",
    (e) => {
      grab = { x: e.clientX, y: e.clientY, touch: e.pointerType === "touch" };
      sphere.classList.add("grabbing");
      sphere.setPointerCapture(e.pointerId);
    },
    on,
  );
  sphere.addEventListener(
    "pointermove",
    (e) => {
      if (!grab) return;
      const dx = e.clientX - grab.x;
      const dy = e.clientY - grab.y;
      grab.x = e.clientX;
      grab.y = e.clientY;
      vy = dx * 0.007;
      vx = grab.touch ? 0 : -dy * 0.007;
      turn(vy, vx);
    },
    on,
  );
  const drop = () => {
    grab = null;
    sphere.classList.remove("grabbing");
  };
  sphere.addEventListener("pointerup", drop, on);
  sphere.addEventListener("pointercancel", drop, on);
  loop((now) => {
    const dt = Math.min(60, now - prev);
    prev = now;
    if (!labLive || isPaused() || document.hidden) return;
    if (!grab) {
      const c = centre();
      vy = vy * 0.94 - c.x * 0.0022;
      vx = vx * 0.94 + c.y * 0.0022;
      turn(vy, vx, 0.0028);
    }
    paintSphere();
    if (labAuto && !hoverHold) {
      skillClock += dt;
      skillEls[activeSkill].style.setProperty(
        "--prog",
        String(Math.min(1, skillClock / 4200)),
      );
      if (skillClock >= 4200) {
        skillEls[activeSkill].style.setProperty("--prog", "0");
        const next = (activeSkill + 1) % aiSkills.length;
        // One full cycle, then it stays put.
        if (next === 0) stopAuto();
        selectSkill(next);
      }
    }
  });

  // A field of connected data points behind the skills; they lean toward the mouse.
  const cv = $<HTMLCanvasElement>("aiBg");
  const g = cv.getContext("2d")!;
  let W = 0;
  let H = 0;
  let mx = -999;
  let my = -999;
  let pts: { x: number; y: number; vx: number; vy: number }[] = [];
  const size = () => {
    const r = lab.getBoundingClientRect();
    const d = Math.min(1.5, devicePixelRatio || 1);
    W = r.width;
    H = r.height;
    cv.width = W * d;
    cv.height = H * d;
    g.setTransform(d, 0, 0, d, 0, 0);
    pts = Array.from({ length: W < 700 ? 34 : 90 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
    }));
  };
  const labSizer = new ResizeObserver(size);
  labSizer.observe(lab);
  cleanups.push(() => labSizer.disconnect());
  lab.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse") return;
      const r = cv.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    },
    on,
  );
  lab.addEventListener(
    "pointerleave",
    () => {
      mx = my = -999;
    },
    on,
  );
  loop(() => {
    if (!labLive || isPaused() || document.hidden) return;
    g.clearRect(0, 0, W, H);
    for (const p of pts) {
      const dx = mx - p.x;
      const dy = my - p.y;
      const dd = Math.hypot(dx, dy);
      if (dd < 190 && dd > 1) {
        p.x += (dx / dd) * 0.5;
        p.y += (dy / dd) * 0.5;
      }
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
    }
    pts.forEach((p, i) => {
      g.fillStyle = "rgba(215,255,62,.55)";
      g.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
      for (let k = i + 1; k < pts.length; k++) {
        const q = pts[k];
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < 130) {
          g.strokeStyle = `rgba(150,120,255,${(1 - d / 130) * 0.34})`;
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(p.x, p.y);
          g.lineTo(q.x, q.y);
          g.stroke();
        }
      }
    });
  });

  // The AI heading decodes itself once.
  const aiHeading = $("h-ai");
  const spans = $$(".w > span", aiHeading);
  const finals = spans.map((x) => x.textContent ?? "");
  const abc = "ABCDEFGHIKLMNOPRSTUVXYZ01";
  observe(
    (entries, io) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / 1000);
        spans.forEach((sp, i) => {
          const f = finals[i];
          const shown = Math.floor(f.length * k);
          sp.textContent =
            f.slice(0, shown) +
            [...f.slice(shown)]
              .map(() => abc[Math.floor(Math.random() * abc.length)])
              .join("");
        });
        if (k < 1 && running) requestAnimationFrame(step);
      };
      step(t0);
    },
    0.3,
    [aiHeading],
  );

  // Mouse-only pointer effects.
  $$(".card.linked").forEach((c) => {
    c.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType !== "mouse") return;
        const b = c.getBoundingClientRect();
        const x = (e.clientX - b.left) / b.width;
        const y = (e.clientY - b.top) / b.height;
        c.style.setProperty("--ry", `${(x - 0.5) * 9}deg`);
        c.style.setProperty("--rx", `${(0.5 - y) * 9}deg`);
        c.style.setProperty("--sx", `${x * 100}%`);
        c.style.setProperty("--sy", `${y * 100}%`);
      },
      on,
    );
    c.addEventListener(
      "pointerleave",
      () => {
        c.style.setProperty("--rx", "0deg");
        c.style.setProperty("--ry", "0deg");
      },
      on,
    );
  });
  const wires = $("wires");
  addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse") return;
      wires.style.transform = `translate(${(e.clientX / innerWidth - 0.5) * -22}px,${(e.clientY / innerHeight - 0.5) * -22}px) scale(1.04)`;
    },
    { passive: true, signal: stop.signal },
  );

  return finish;
}
