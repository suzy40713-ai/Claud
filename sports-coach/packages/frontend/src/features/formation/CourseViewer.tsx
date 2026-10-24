import { useEffect, useMemo, useState } from "react";
import type { Module } from "./api";

interface Props {
  modules: Module[];
  storageKey: string;
  subtitle: string;
  extra?: React.ReactNode;
  lastIsBonus?: boolean;
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* stockage indisponible (navigation privée) : la progression n'est simplement pas gardée */
  }
}

export function CourseViewer({ modules, storageKey, subtitle, extra, lastIsBonus = true }: Props) {
  const flat = useMemo(() => modules.flatMap((m, i) => m.lessons.map((_, j) => ({ m: i, l: j }))), [modules]);
  const [done, setDone] = useState<Record<string, boolean>>(() => load(`${storageKey}-done`, {}));
  const [cur, setCur] = useState<number>(() => Math.min(flat.length - 1, Math.max(0, load(`${storageKey}-cur`, 0))));

  useEffect(() => save(`${storageKey}-done`, done), [done, storageKey]);
  useEffect(() => save(`${storageKey}-cur`, cur), [cur, storageKey]);

  const key = (k: number) => `${flat[k].m}.${flat[k].l}`;
  const f = flat[cur];
  const mod = modules[f.m];
  const lesson = mod.lessons[f.l];
  const nDone = Object.values(done).filter(Boolean).length;
  const isBonus = lastIsBonus && f.m === modules.length - 1;

  const go = (k: number) => {
    setCur(k);
    window.scrollTo({ top: 0 });
  };
  const next = () => {
    setDone((d) => ({ ...d, [key(cur)]: true }));
    if (cur < flat.length - 1) go(cur + 1);
  };

  const body =
    lesson.body.replace(/<table>/g, '<div class="tw"><table>').replace(/<\/table>/g, "</table></div>") +
    (lesson.ex ? `<div class="ex"><b>Exercice.</b> ${lesson.ex}</div>` : "");

  return (
    <>
      <header className="course-top">
        <div className="in">
          <a className="brand" href={import.meta.env.BASE_URL}>
            Studio Cartoon<small>{subtitle}</small>
          </a>
          <div className="prog" aria-live="polite">
            <div className="bar">
              <i style={{ width: `${(100 * nDone) / flat.length}%` }} />
            </div>
            <div className="lbl">
              {nDone} / {flat.length} leçons terminées
            </div>
          </div>
          {extra}
        </div>
      </header>
      <div className="shell">
        <nav className="lessons" aria-label="Modules de la formation">
          {modules.map((m, i) => {
            const nd = m.lessons.filter((_, j) => done[`${i}.${j}`]).length;
            return (
              <details key={i} open={f.m === i}>
                <summary>
                  <span className="n">{lastIsBonus && i === modules.length - 1 ? "★" : i}</span>
                  <span>
                    {m.title}{" "}
                    <small className="small">
                      {nd}/{m.lessons.length}
                    </small>
                  </span>
                </summary>
                <ol>
                  {m.lessons.map((l, j) => {
                    const k = flat.findIndex((x) => x.m === i && x.l === j);
                    return (
                      <li key={j}>
                        <button type="button" className={k === cur ? "cur" : ""} onClick={() => go(k)}>
                          <span className="ck">{done[`${i}.${j}`] ? "✓" : ""}</span>
                          <span>{l.title}</span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </details>
            );
          })}
        </nav>
        <main className="lesson">
          <div className="crumb">
            {isBonus ? "Bonus" : `Module ${f.m} · ${mod.title}`} · Leçon {f.l + 1}/{mod.lessons.length}
          </div>
          <h1>{lesson.title}</h1>
          {f.l === 0 && <p className="intro">{mod.intro}</p>}
          {/* Contenu rédigé par nous (formation/contenu.py), pas une saisie utilisateur. */}
          <article dangerouslySetInnerHTML={{ __html: body }} />
          <div className="nav">
            <button className="btn line" type="button" disabled={cur === 0} onClick={() => go(cur - 1)}>
              ← Précédente
            </button>
            <label className="done">
              <input
                type="checkbox"
                checked={!!done[key(cur)]}
                onChange={(e) => setDone((d) => ({ ...d, [key(cur)]: e.target.checked }))}
              />
              Leçon terminée
            </label>
            <button className="btn" type="button" disabled={cur === flat.length - 1} onClick={next}>
              Suivante →
            </button>
          </div>
        </main>
      </div>
    </>
  );
}
