import type { CSSProperties, ReactNode } from "react";
import { SiteMotion } from "@/components/site-motion";
import { icons } from "@/data/icons";
import {
  aiSkills,
  background,
  hobbies,
  marquee,
  nav,
  profile,
  restCerts,
  stages,
  toolkit,
  topCerts,
} from "@/data/profile";
import { projectGroups, projects } from "@/data/projects";
import {
  art,
  iconId,
  ringMarkup,
  scene,
  sealMarkup,
  spriteMarkup,
} from "@/lib/art";

const vars = (v: Record<string, number>) => v as CSSProperties;
const external = { target: "_blank", rel: "noopener noreferrer" };

function ToolIcon({ name }: { name: string }) {
  return icons[name] ? (
    <svg className="ic" aria-hidden="true">
      <use href={`#${iconId(name)}`} />
    </svg>
  ) : (
    <span className="dot-ic" aria-hidden="true" />
  );
}

const Tool = ({
  name,
  ...rest
}: {
  name: string;
  className?: string;
  style?: CSSProperties;
}) => (
  <li {...rest}>
    <ToolIcon name={name} />
    {name}
  </li>
);

function Heading({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="head" aria-label={children}>
      {children.split(" ").map((word, i) => (
        <span className="w" aria-hidden="true" key={i}>
          <span style={vars({ "--n": i })}>{word}</span>
        </span>
      ))}
    </h2>
  );
}

const NewTab = () => <span className="vh"> (opens in a new tab)</span>;

const NavLinks = () =>
  nav.map((n, i) => (
    <a
      href={n.href}
      className={n.href === "#contact" ? "nav-cta" : undefined}
      style={vars({ "--n": i })}
      key={n.href}
    >
      {n.label}
    </a>
  ));

const Section = ({
  id,
  title,
  minor,
  children,
}: {
  id: string;
  title: string;
  minor?: boolean;
  children: ReactNode;
}) => (
  <section
    className={minor ? "s wrap minor" : "s wrap"}
    id={id}
    aria-labelledby={`h-${id}`}
  >
    <Heading id={`h-${id}`}>{title}</Heading>
    {children}
  </section>
);

// Previous and next buttons for the phone carousel. Hidden where the cards sit in a grid.
const Swipe = ({ id, label }: { id: string; label: string }) => (
  <div className="swipe" data-for={id}>
    <button type="button" data-d="-1" aria-label={`Previous ${label}`}>
      <span aria-hidden="true">‹</span>
    </button>
    <p className="swipe-count" aria-hidden="true">
      <span>1</span> / <span>{projects.length}</span>
    </p>
    <button type="button" data-d="1" aria-label={`Next ${label}`}>
      <span aria-hidden="true">›</span>
    </button>
  </div>
);

const Seal = ({ tool }: { tool: string }) => (
  <span
    className="seal"
    aria-hidden="true"
    dangerouslySetInnerHTML={{ __html: sealMarkup(tool) }}
  />
);

const issuers = new Set([...topCerts, ...restCerts].map((c) => c.o)).size;
const certCount = topCerts.length + restCerts.length;
const year = new Date().getFullYear();
const leadCert = (topCerts.find((c) => "big" in c && c.big) ?? topCerts[0]).n;
const snowflakeCount = [...topCerts, ...restCerts].filter(
  (c) => c.o === "Snowflake",
).length;

export default function Home() {
  let letter = 0;
  const { links } = profile;
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.title,
    description: profile.pitch,
    homeLocation: { "@type": "Place", name: profile.location },
    sameAs: [links.github, links.linkedin],
  };
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <svg
        className="vh"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: spriteMarkup }}
      />
      <div id="progress" aria-hidden="true" />

      <header className="bar" id="bar">
        <div className="bar-in wrap">
          <a className="bar-home" href="#home">
            SK<span className="vh"> home</span>
          </a>
          <nav className="bar-links" aria-label="Main">
            <NavLinks />
          </nav>
          <div className="ctl" role="group" aria-label="Display options">
            <button data-t="bold" type="button" aria-pressed="true">
              <svg className="t-ic" viewBox="0 0 16 16" aria-hidden="true">
                <circle cx="8" cy="8" r="6.5" />
                <path d="M8 1.5a6.5 6.5 0 0 1 0 13z" />
              </svg>
              <span className="t-lbl">Colour</span>
            </button>
            <button data-t="dark" type="button" aria-pressed="false">
              <svg className="t-ic" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M13.5 10.2A6 6 0 0 1 5.8 2.5a6 6 0 1 0 7.7 7.7z" />
              </svg>
              <span className="t-lbl">Dark</span>
            </button>
            <span className="sep" />
            <button id="pause" type="button" aria-label="Pause animations">
              <svg className="i-pause" viewBox="0 0 14 14" aria-hidden="true">
                <path d="M2 1h3.500v12H2zM8.500 1H12v12H8.500z" />
              </svg>
              <svg className="i-play" viewBox="0 0 14 14" aria-hidden="true">
                <path d="M3 1l10 6-10 6z" />
              </svg>
            </button>
          </div>
          <details className="bar-menu" id="menu">
            <summary>
              <span className="burger" aria-hidden="true" />
              <span className="menu-lbl">Menu</span>
            </summary>
            <nav aria-label="Main">
              <NavLinks />
            </nav>
          </details>
        </div>
      </header>

      <main id="main">
        <div className="hero wrap" id="home">
          <svg
            className="wires"
            id="wires"
            viewBox="0 0 1440 900"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M-40 170C340 80 520 280 860 190S1320 90 1500 220" />
            <path d="M-40 640C260 560 520 760 820 660S1260 560 1500 700" />
            <path d="M-40 760C320 860 640 660 960 780S1320 840 1500 760" />
          </svg>
          <div className="hero-main">
            <p className="role fadein" style={vars({ "--n": 0 })}>
              {profile.title}, {profile.location}
            </p>
            <h1 aria-label={profile.name}>
              {profile.name.split(" ").map((word) => (
                <span className="w" aria-hidden="true" key={word}>
                  {[...word].map((c, i) => (
                    <span className="l" key={i} style={vars({ "--n": letter++ })}>
                      {c}
                    </span>
                  ))}
                </span>
              ))}
            </h1>
            <div className="hero-row">
              <p className="tagline fadein" style={vars({ "--n": 1 })}>
                <span className="vh">
                  I build data platforms, data pipelines, and AI agents teams can
                  rely on.
                </span>
                <span aria-hidden="true">
                  I build{" "}
                  <span className="swap" id="swap">
                    {profile.taglineWords.map((w, i) => (
                      <span className={i === 0 ? "on" : undefined} key={w}>
                        {w}
                      </span>
                    ))}
                  </span>
                  <br />
                  teams can rely on.
                </span>
              </p>
              <div className="btns fadein" style={vars({ "--n": 2 })}>
                <a className="btn main" href="#projects">
                  See projects
                </a>
                <a className="btn" href="#contact">
                  Contact
                </a>
                {links.resume && (
                  <a className="btn" href={links.resume} {...external}>
                    Résumé
                    <NewTab />
                  </a>
                )}
              </div>
            </div>
            <ul className="facts fadein" style={vars({ "--n": 3 })}>
              <li>
                <b>{projects.length}</b> projects
              </li>
              <li>
                <b>{certCount}</b> certifications
              </li>
              <li>{leadCert}</li>
            </ul>
          </div>
          {marquee.map((row, r) => (
            <div
              className={r ? "marquee rev" : "marquee"}
              aria-hidden="true"
              key={r}
            >
              {[0, 1].map((copy) => (
                <ul key={copy}>
                  {row.map((t) => (
                    <Tool name={t} key={t} />
                  ))}
                </ul>
              ))}
            </div>
          ))}
        </div>

        <section className="loop" id="lifecycle" aria-labelledby="h-lifecycle">
          <div className="pin wrap">
            <Heading id="h-lifecycle">Data engineering</Heading>
            <p className="lede">It’s a loop now, and AI is part of it.</p>
            <div className="loop-grid">
              <div>
                <div className="stage-panel" id="panel" aria-hidden="true" />
                <div className="stops" id="stops">
                  {stages.map((s, i) => (
                    <button type="button" data-i={i} key={s.t}>
                      {s.t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="ring-col">
                <div className="ring-box">
                  <svg
                    id="ring"
                    viewBox="0 0 680 680"
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: ringMarkup(stages) }}
                  />
                </div>
                <div className="wheel-ctl" id="wheelCtl">
                  <button
                    type="button"
                    id="prevStage"
                    aria-label="Previous stage"
                  >
                    <span aria-hidden="true">‹</span>
                  </button>
                  <div className="wheel-note">
                    <p className="wheel-hint">
                      <span className="mouse" aria-hidden="true" />
                      <span className="h-mouse">
                        Scroll or drag to turn the wheel
                      </span>
                      <span className="h-touch">Swipe up, or tap a stage</span>
                    </p>
                    <p
                      className="wheel-count"
                      id="wheelCount"
                      aria-hidden="true"
                    >
                      1 of {stages.length}
                    </p>
                  </div>
                  <button type="button" id="nextStage" aria-label="Next stage">
                    <span aria-hidden="true">›</span>
                  </button>
                </div>
              </div>
            </div>
            <ol className="stack-list" id="stackList">
              {stages.map((s, i) => (
                <li
                  className={s.ai ? "up ai" : "up"}
                  style={vars({ "--i": i % 3 })}
                  key={s.t}
                >
                  <h3>{s.t}</h3>
                  <p>{s.p}</p>
                  <ul>
                    {s.tools.map((t) => (
                      <Tool name={t} key={t} />
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="ai-lab" id="ai" aria-labelledby="h-ai">
          <canvas id="aiBg" aria-hidden="true" />
          <div className="wrap">
            <div className="ai-grid">
              <div className="ai-left">
                <Heading id="h-ai">AI and agents</Heading>
                <p className="lede">How I use AI.</p>
                <ol className="skills" id="aiSkills">
                  {aiSkills.map((k, i) => (
                    <li className="skill" data-i={i} key={k.n}>
                      <button
                        type="button"
                        className="sk-btn"
                        aria-expanded="false"
                        aria-controls={`skd${i}`}
                      >
                        {k.n}
                      </button>
                      <div className="sk-detail" id={`skd${i}`}>
                        <div>
                          <p>{k.p}</p>
                          <ul className="sk-tools">
                            {k.t.map((t, n) => (
                              <Tool
                                name={t}
                                key={t}
                                style={vars({ "--n": n })}
                              />
                            ))}
                          </ul>
                        </div>
                      </div>
                      <span className="sk-bar" aria-hidden="true" />
                    </li>
                  ))}
                </ol>
              </div>
              <div className="sphere-col">
                <div className="sphere" id="sphere" aria-hidden="true">
                  <span className="s-ring a" />
                  <span className="s-ring b" />
                  <span className="s-core" />
                </div>
                <p className="sphere-tip" aria-hidden="true">
                  <span className="h-mouse">Drag to spin</span>
                  <span className="h-touch">Swipe sideways to spin</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        <Section id="projects" title="Projects">
          <div
            className="filter"
            id="filter"
            role="group"
            aria-label="Filter projects"
          >
            <span className="fil-ind" id="filInd" aria-hidden="true" />
            {projectGroups.map((g, i) => {
              const count =
                g === "All"
                  ? projects.length
                  : projects.filter((p) =>
                      (p.groups as string[]).includes(g),
                    ).length;
              return (
                <button type="button" data-g={g} aria-pressed={i === 0} key={g}>
                  {g}
                  <sup aria-hidden="true">{count}</sup>
                </button>
              );
            })}
          </div>
          <p className="vh" id="filterStatus" role="status" />
          <div className="grid" id="grid">
            {projects.map((p, i) => (
              <article
                className={p.url ? "card up linked" : "card up"}
                data-g={p.groups.join(" ")}
                style={vars({ "--i": i % 3 })}
                key={p.name}
              >
                {p.inProgress && <span className="status">In progress</span>}
                {p.url && (
                  <span className="status" aria-hidden="true">
                    {p.urlLabel}
                  </span>
                )}
                <div
                  className="vis"
                  dangerouslySetInnerHTML={{ __html: scene[p.scene]() }}
                />
                <div className="cb">
                  <h3>
                    {p.url ? (
                      <a className="card-link" href={p.url} {...external}>
                        {p.name}
                        <span className="vh">
                          {" "}
                          on {p.urlLabel} (opens in a new tab)
                        </span>
                      </a>
                    ) : (
                      p.name
                    )}
                  </h3>
                  <p>{p.line}</p>
                  <ul className="chips">
                    {p.tools.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
          <Swipe id="grid" label="projects" />
        </Section>

        <Section id="certifications" title="Certifications">
          <ul className="cert-stats up">
            <li>
              <b data-count={certCount}>{certCount}</b>certifications
            </li>
            <li>
              <b data-count={snowflakeCount}>{snowflakeCount}</b>from Snowflake
            </li>
            <li>
              <b data-count={issuers}>{issuers}</b>issuers
            </li>
          </ul>
          <div className="cert-top">
            {topCerts.map((c, i) => (
              <article
                className={c.big ? "cert up big" : "cert up"}
                style={vars({ "--i": i })}
                key={c.n}
              >
                <Seal tool={c.tool} />
                <div>
                  <h3>{c.n}</h3>
                  <p>{c.o}</p>
                  <p className="when">
                    {c.d}
                    {c.v && <span>{c.v}</span>}
                  </p>
                </div>
              </article>
            ))}
          </div>
          <ul className="cert-rest">
            {restCerts.map((c, i) => (
              <li className="up" style={vars({ "--i": i % 3 })} key={c.n}>
                <Seal tool={c.tool} />
                <div>
                  <b>{c.n}</b>
                  <span>
                    {c.o}, {c.d}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <a
            className="cert-link"
            href={links.certifications}
            {...external}
          >
            Verify on LinkedIn <span aria-hidden="true">↗</span>
            <NewTab />
          </a>
        </Section>

        <Section id="toolkit" title="Toolkit" minor>
          <div className="stack">
            {toolkit.map(([group, tools], g) => (
              <div
                className={tools.length > 5 ? "stack-group up wide" : "stack-group up"}
                style={vars({ "--i": g })}
                key={group}
              >
                <h3>
                  {group}
                  <span aria-hidden="true">{tools.length}</span>
                </h3>
                <ul>
                  {tools.map((t) => (
                    <li key={t}>
                      <ToolIcon name={t} />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        <Section id="life" title="Outside work" minor>
          <div className="life">
            {hobbies.map((h, i) => (
              <article className="card up" style={vars({ "--i": i })} key={h.n}>
                <div
                  className="vis"
                  dangerouslySetInnerHTML={{ __html: art[h.a]() }}
                />
                <div className="cb">
                  <h3>{h.n}</h3>
                  <p>{h.p}</p>
                </div>
              </article>
            ))}
          </div>
        </Section>

        <Section id="background" title="Background" minor>
          <ul className="bg-list">
            {background.map((b, i) => (
              <li
                className={i === 0 ? "up now" : "up"}
                style={vars({ "--i": i })}
                key={b.t}
              >
                <span className="tl-date">{b.d}</span>
                <div className="tl-body">
                  <b>{b.t}</b>
                  <span>{b.w}</span>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <section
          className="contact wrap"
          id="contact"
          aria-labelledby="h-contact"
        >
          <h2 id="h-contact" className="vh">
            Let’s talk data
          </h2>
          <div className="big-mq" aria-hidden="true">
            <div>Let’s talk data</div>
            <div>Let’s talk data</div>
          </div>
          <div className="big-links">
            <a href={links.linkedin} {...external}>
              LinkedIn <span aria-hidden="true">↗</span>
              <NewTab />
            </a>
            <a href={links.github} {...external}>
              GitHub <span aria-hidden="true">↗</span>
              <NewTab />
            </a>
            {links.email && (
              <a href={`mailto:${links.email}`}>
                Email
              </a>
            )}
          </div>
        </section>
      </main>

      <footer className="wrap">
        <div className="foot-id">
          <b>{profile.name}</b>
          <span>
            {profile.title}, {profile.location}
          </span>
        </div>
        <nav className="foot-nav" aria-label="Footer">
          <NavLinks />
        </nav>
        <div className="foot-end">
          <a className="to-top" href="#home">
            Back to top <span aria-hidden="true">↑</span>
          </a>
          <span>© {year}</span>
        </div>
      </footer>

      <SiteMotion />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(person).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
