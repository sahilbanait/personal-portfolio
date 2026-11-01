// Trusted, static SVG strings written in this project. Everything is drawn in its finished
// position, so with motion off each picture is complete. data-a describes how a part arrives
// during the loop: see frames() in lib/motion.ts.
import { icons } from "@/data/icons";

const bar=`<path class="st" style="stroke-width:7" d="M70 85H330"/>${[60,84,316,340].map((x,i)=>`<rect class="fi" x="${x-(i%2?7:9)}" y="${85-(i%2?28:44)}" width="${i%2?14:18}" height="${i%2?56:88}" rx="5"/>`).join("")}`;
export const art:Record<string,()=>string>={
 rack:()=>`<svg viewBox="0 0 400 170" aria-hidden="true">${[0,1,2].map(r=>`<rect class="st" x="90" y="${22+r*44}" width="220" height="36" rx="6"/>${[0,1,2,3].map(c=>`<circle class="fi blink" style="animation-delay:${-(r*3+c)*.37}s" cx="${112+c*20}" cy="${40+r*44}" r="5"/>`).join("")}<path class="st" d="M230 ${40+r*44}h60"/>`).join("")}</svg>`,
 barbell:()=>`<svg viewBox="0 0 400 170" aria-hidden="true"><g class="lift">${bar}</g></svg>`,
 chat:()=>`<svg viewBox="0 0 400 170" aria-hidden="true">${[0,1,2,3,4,5,6,7].map(i=>`<rect class="fi blink" style="animation-delay:${-i*.21}s" x="${60+i*36}" y="${74-((i*37)%40)}" width="24" height="${28+((i*53)%50)}" rx="12"/>`).join("")}</svg>`,
};

// Project scenes. Every element is drawn in its finished position, so with motion off
// each card shows the completed picture. data-a describes how it arrives during the loop:
// fade, pop, grow, growx, draw, and move run from a start to an end point (0 to 1 of the loop);
// travel and blip are moments in motion, hidden when motion is off.
const A=(spec:string)=>`data-a="${spec}"`;
const wrap=(inner:string)=>`<svg viewBox="0 0 400 170" aria-hidden="true">${inner}</svg>`;
const label=(x:number,y:number,t:string,cls="",spec="")=>`<text class="tx ${cls}" x="${x}" y="${y}" ${spec?A(spec):""}>${t}</text>`;
const okMark=(cx:number,cy:number,spec:string)=>`<g ${A(spec)}><circle class="fi" cx="${cx}" cy="${cy}" r="15"/><path class="st inv-s" d="M${cx-7} ${cy}l5 5l9-10"/></g>`;
export const scene:Record<string,()=>string>={
 cost(){const h=[70,52,118,46,84,36,18,14];return wrap(`<path class="st" ${A("draw .01 .1")} d="M30 161H372"/>${h.map((v,i)=>`<rect class="fi ${i>5?"idle":""}" ${A(`grow ${(.04+i*.035).toFixed(3)} ${(.16+i*.035).toFixed(3)}`)} x="${40+i*42}" y="${160-v}" width="28" height="${v}" rx="4"/>`).join("")}<rect class="alert-f" ${A("fade .46 .52")} x="124" y="42" width="28" height="118" rx="4"/>${label(138,32,"Costliest query","c","pop .5 .57")}${label(333,132,"Idle","c","fade .64 .7")}`)},
 kafka(){const f=["M34 36C84 36 90 85 124 85H352","M34 85H352","M34 134C84 134 90 85 124 85H352"];return wrap(`<path class="st" ${A("draw .0 .1")} d="M34 36C84 36 90 85 124 85M34 85H124M34 134C84 134 90 85 124 85"/>${[36,85,134].map(y=>`<circle class="fi" cx="28" cy="${y}" r="8"/>`).join("")}<path class="st" ${A("draw .06 .16")} d="M224 85H252M338 85H352"/>${[0,1,2,3,4,5].map(i=>`<circle class="fi pt" r="6" style="offset-path:path('${f[i%3]}')" ${A(`travel ${(.1+i*.1).toFixed(2)} ${(.34+i*.1).toFixed(2)}`)}/>`).join("")}<rect class="st on-vis" x="124" y="62" width="100" height="46" rx="10"/>${label(174,91,"Redpanda","c sm")}<rect class="st on-vis" x="252" y="62" width="86" height="46" rx="10"/>${label(295,91,"Connect","c sm")}<g transform="translate(355 67) scale(1.5)"><g ${A("pop .3 .38")}><path class="fi" d="${icons.Snowflake}"/></g></g>`)},
 kumo(){return wrap(`<g ${A("pop .02 .08")}><rect class="fi" x="150" y="14" width="228" height="38" rx="18"/>${label(264,38,"Any failed jobs today?","c inv sm")}</g><g class="pt">${[0,1,2].map(i=>`<circle class="fi" cx="${44+i*20}" cy="80" r="6" ${A(`blip ${(.12+i*.03).toFixed(2)} .3`)}/>`).join("")}</g><g ${A("pop .3 .36")}><rect class="st on-vis" x="24" y="64" width="212" height="34" rx="10"/>${label(130,86,"Informatica: job history","c sm")}</g><g ${A("pop .46 .54")}><rect class="fi" x="24" y="112" width="262" height="40" rx="18"/>${label(155,137,"Here’s what failed, and why.","c inv sm")}</g>`)},
 debug(){return wrap(`${[0,1,2,3].map(i=>`<path class="st" ${A(`draw ${(.01+i*.03).toFixed(2)} ${(.1+i*.03).toFixed(2)}`)} d="M36 ${24+i*25}H${[300,250,330,210][i]}"/>`).join("")}<path class="st alert-s" style="stroke-width:6" ${A("fade .42 .48")} d="M36 74H330"/><g ${A("move -150 -40 .14 .42")}><circle class="st" cx="255" cy="74" r="29" style="stroke-width:5"/><path class="st" style="stroke-width:6" d="M276 95L302 122"/></g><g ${A("pop .58 .65")}><rect class="fi" x="36" y="124" width="124" height="34" rx="17"/>${label(98,146,"Read-only","c inv sm")}</g>`)},
 mcp(){const out=["M102 85C170 85 170 36 240 36","M102 85H240","M102 85C170 85 170 134 240 134"];return wrap(`${out.map((d,i)=>`<path class="st" ${A(`draw ${(.04+i*.05).toFixed(2)} ${(.16+i*.05).toFixed(2)}`)} d="${d}"/>`).join("")}<circle class="fi" cx="70" cy="85" r="33"/>${label(70,92,"AI","c inv big")}${["Jobs","Logs","Connections"].map((l,i)=>`<g ${A(`pop ${(.14+i*.06).toFixed(2)} ${(.2+i*.06).toFixed(2)}`)}><rect class="st on-vis" x="240" y="${18+i*49}" width="${i===2?130:88}" height="36" rx="10"/>${label(i===2?305:284,41+i*49,l,"c sm")}</g>`).join("")}${[0,1,2].map(i=>`<circle class="fi pt" r="7" style="offset-path:path('${out[i]}')" ${A(`travel ${(.36+i*.14).toFixed(2)} ${(.5+i*.14).toFixed(2)}`)}/>`).join("")}`)},
 research(){return wrap(`<g ${A("pop .02 .09")}><rect class="st on-vis" x="24" y="24" width="160" height="38" rx="19"/><circle class="st" cx="48" cy="42" r="8"/><path class="st" d="M54 48l7 7"/>${label(114,48,"Search arXiv","c sm")}</g>${[0,1,2].map(i=>`<g ${A(`move 0 -170 ${(.16+i*.1).toFixed(2)} ${(.28+i*.1).toFixed(2)}`)}><rect class="st on-vis" x="${214+i*50}" y="${46-i*6}" width="66" height="106" rx="8"/><path class="st" d="M${226+i*50} ${70-i*6}H${268+i*50}M${226+i*50} ${92-i*6}H${268+i*50}M${226+i*50} ${114-i*6}H${252+i*50}"/></g>`).join("")}${label(24,110,"Papers found","","fade .56 .62")}${label(24,134,"and saved","","fade .62 .68")}`)},
 trace(){const r:[string,number,number][]=[["Request",110,236],["Context",140,92],["Latency",172,150],["Tokens",232,76],["Failure",296,50]];return wrap(r.map(([l,x,w],i)=>`${label(18,56+i*23,l,"sm")}<rect class="${i===4?"alert-f":"fi"}" ${A(`growx ${(.06+i*.1).toFixed(2)} ${(.2+i*.1).toFixed(2)}`)} x="${x}" y="${44+i*23}" width="${w}" height="15" rx="4"/>`).join(""))},
 homelab(){return wrap(`${[0,1,2].map(r=>`<rect class="st" x="22" y="${26+r*42}" width="112" height="32" rx="6"/>${[0,1,2].map(c=>`<circle class="fi" ${A(`fade ${(.04+(r*3+c)*.03).toFixed(2)} ${(.08+(r*3+c)*.03).toFixed(2)}`)} cx="${42+c*18}" cy="${42+r*42}" r="5"/>`).join("")}`).join("")}<path class="st" ${A("draw .02 .08")} d="M162 148H382"/><path class="st" style="stroke-width:3.5" ${A("draw .18 .58")} d="M164 128L204 96L244 112L284 62L324 84L374 42"/><circle class="fi" ${A("pop .56 .62")} cx="374" cy="42" r="8"/>${label(164,38,"Metrics","sm","fade .3 .36")}`)},
 drift(){return wrap(`<rect class="st dash" x="34" y="36" width="100" height="74" rx="12"/>${label(84,80,"Old","c")}<path class="st" ${A("draw .12 .28")} d="M146 73H250M238 61L250 73L238 85"/><g ${A("pop .28 .36")}><rect class="fi" x="264" y="36" width="100" height="74" rx="12"/>${label(314,80,"New","c inv")}</g>${okMark(364,38,"pop .5 .56")}${label(200,148,"Healthy, or it rolls back","c","fade .58 .66")}`)},
 gainlog(){return wrap(`<g transform="translate(60 6) scale(.7)"><g class="lift">${bar}</g></g>${[0,1,2].map(i=>`<rect class="fi" ${A(`pop ${(.14+i*.2).toFixed(2)} ${(.2+i*.2).toFixed(2)}`)} x="${74+i*58}" y="136" width="48" height="16" rx="8"/>`).join("")}${label(258,150,"Sets logged","","fade .6 .66")}`)},
 tillmark(){return wrap(`<path class="st" d="M84 14H194V150L176 140L158 150L139 140L120 150L102 140L84 150Z"/>${[38,62,86,110].map((y,i)=>`<path class="st" ${A(`draw ${(.1+i*.07).toFixed(2)} ${(.16+i*.07).toFixed(2)}`)} d="M102 ${y}H${i%2?156:176}"/>`).join("")}<path class="st alert-s pt" style="stroke-width:4" ${A("scan .05 .42")} d="M72 20H206"/><g ${A("pop .48 .55")}><rect class="fi" x="266" y="62" width="62" height="48" rx="9"/><path class="st" style="stroke-width:6" d="M280 62V48a17 17 0 0 1 34 0V62"/></g>${label(297,146,"Encrypted","c","fade .54 .6")}`)},
 roster(){return wrap(`${Array.from({length:21},(_,i)=>{const r=(i/7)|0,c=i%7;return `<rect class="${r<2?"fi":"st"}" ${A(`pop ${(.03+i*.026).toFixed(3)} ${(.08+i*.026).toFixed(3)}`)} x="${28+c*38}" y="${24+r*44}" width="30" height="36" rx="6"/>`}).join("")}${label(304,66,"Weeks on","sm","fade .46 .52")}${label(304,132,"Week off","sm","fade .6 .66")}`)},
};

export const RING = { C: 340, R: 196 };
export function ringMarkup(stages: { t: string }[]) {
  const { C, R } = RING;
  const N = stages.length;
  const nodePos = (i: number) => {
    const a = (i / N) * 2 * Math.PI - Math.PI / 2;
    return [C + R * Math.cos(a), C + R * Math.sin(a)];
  };
  const ringPath = `M${C} ${C - R}A${R} ${R} 0 1 1 ${C - 0.01} ${C - R}`;
  return `<g class="turn"><path d="M${C + 150} ${C}A150 150 0 0 0 ${C} ${C - 150}M${C + 11} ${C - 162}L${C} ${C - 150}L${C + 11} ${C - 138}"/><path d="M${C - 150} ${C}A150 150 0 0 0 ${C} ${C + 150}M${C - 11} ${C + 138}L${C} ${C + 150}L${C - 11} ${C + 162}"/></g><g id="rotor"><circle class="ring-track" cx="${C}" cy="${C}" r="${R}"/><path id="live" class="ring-live" d="${ringPath}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>${[0, 1, 2].map((i) => `<circle class="ring-dot" r="7" style="offset-path:path('${ringPath}');animation-delay:${-i * 3.67}s"/>`).join("")}${stages.map((s, i) => { const [x, y] = nodePos(i); return `<g class="ring-node" data-i="${i}" transform="translate(${x} ${y})"><circle r="13"/><g class="lbl"><text>${s.t === "AI and agents" ? "AI" : s.t}</text></g></g>`; }).join("")}</g><g class="pulse-c"><text class="ring-center" x="${C}" y="${C + 8}">DATA + AI</text><text class="ring-center-sub" x="${C}" y="${C + 42}">a loop, not a line</text></g>`;
}

export const iconId = (name: string) => `i-${name.replace(/[^a-zA-Z0-9]/g, "")}`;
export const spriteMarkup = Object.entries(icons)
  .map(([name, d]) => `<symbol id="${iconId(name)}" viewBox="0 0 24 24"><path d="${d}"/></symbol>`)
  .join("");

export function iconHtml(name: string) {
  return icons[name]
    ? `<svg class="ic" aria-hidden="true"><use href="#${iconId(name)}"/></svg>`
    : `<span class="dot-ic" aria-hidden="true"></span>`;
}

export const sealMarkup = (tool: string) =>
  `<svg viewBox="0 0 100 100"><circle class="seal-ring" cx="50" cy="50" r="46" pathLength="1"/><svg x="26" y="26" width="48" height="48"><use href="#${iconId(tool)}"/></svg></svg>`;
