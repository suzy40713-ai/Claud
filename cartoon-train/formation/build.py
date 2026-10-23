# -*- coding: utf-8 -*-
"""Construit la formation : cahier PDF (Chromium headless) + page de cours en ligne (artifact)."""
import html
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
sys.path.insert(0, HERE)
from contenu import TITLE, SUBTITLE, MODULES, CHECKLIST, FICHE_PERSO, MODELE_SCRIPT  # noqa: E402
from sketches5 import SKETCHES as GERARD  # noqa: E402
from histoires3 import STORIES as ETSI  # noqa: E402

CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
ROLE = {"E": "Gérard", "V": "La victime", "A": "L'autorité"}


def bonus_lessons():
    les = []
    les.append(dict(title="Checklist avant de publier",
                    body="<ul class='check'>%s</ul>" % "".join("<li>%s</li>" % c for c in CHECKLIST), ex=None))
    les.append(dict(title="Modèles : fiche personnage et script", body=(
        "<h3>Fiche personnage</h3><table>%s</table><h3>Modèle de script</h3><table>%s</table>" % (
            "".join("<tr><th>%s</th><td class='blank'></td></tr>" % x for x in FICHE_PERSO),
            "".join("<tr><th>%s</th><td class='blank'></td></tr>" % x for x in MODELE_SCRIPT))), ex=None))
    out = []
    for sk in GERARD:
        out.append("<h3>%s : « %s »</h3><p class='script'>" % (sk["title"], html.escape(sk["hook_text"])))
        for ln in sk["lines"]:
            if ln[0].startswith("@"):
                out.append("<i>(%s)</i><br>" % ("l'autorité arrive" if ln[0] == "@ENTER" else "Gérard s'en va"))
                continue
            out.append("<b>%s</b> : %s<br>" % (ROLE[ln[0]], html.escape(ln[2].lstrip("§"))))
        out.append("</p>")
    les.append(dict(title="Les 10 scripts de la saison 1 de Gérard", body="".join(out), ex=None))
    out = []
    for st in ETSI:
        out.append("<h3>%s</h3><p class='script'>%s</p>" % (
            html.escape(st["title"]), "<br>".join(html.escape(b["text"]) for b in st["beats"])))
    les.append(dict(title="10 histoires « Et si tu… » complètes", body="".join(out), ex=None))
    return dict(title="Bonus", intro="Checklist, modèles à remplir et 20 scripts complets.", lessons=les)


ALL = MODULES + [bonus_lessons()]
N_LESSONS = sum(len(m["lessons"]) for m in ALL)
N_EX = sum(1 for m in ALL for l in m["lessons"] if l["ex"])

# ------------------------------------------------------------------ PDF
PDF_CSS = """
@page { size: A4; margin: 18mm 16mm; }
* { box-sizing: border-box; }
body { font-family: 'Inter','Helvetica Neue',Arial,sans-serif; color:#1b1b1b; font-size:11pt; line-height:1.55; }
h1 { font-size: 36pt; line-height:1.05; margin:0 0 10pt; }
.mod { page-break-before: always; }
.mod-head { background:#0d1b2a; color:#fff; border-radius:10pt; padding:16pt 18pt; margin-bottom:14pt; }
.mod-head .k { color:#ffd166; font-weight:800; letter-spacing:.08em; font-size:9pt; text-transform:uppercase; }
.mod-head h2 { margin:4pt 0 4pt; font-size:22pt; }
.mod-head p { margin:0; color:#cdd6e0; }
h3.lesson { font-size: 14.5pt; margin: 20pt 0 6pt; padding-bottom:4pt; border-bottom:3px solid #ffd166; page-break-after: avoid; }
h3 { font-size: 12pt; margin: 12pt 0 4pt; color:#264653; }
.cover { height: 250mm; display:flex; flex-direction:column; justify-content:center; background:#0d1b2a; color:#fff;
  margin:-18mm -16mm; padding: 30mm 22mm; }
.cover .tag { background:#ffd166; color:#1b1b1b; padding:4pt 10pt; border-radius:6pt; font-weight:800; width:fit-content; margin-bottom:16pt; }
.cover p { font-size:14pt; color:#cdd6e0; }
table { border-collapse:collapse; width:100%; margin: 8pt 0; font-size:10pt; page-break-inside: avoid; }
th, td { border:1px solid #d5dbe1; padding:5pt 7pt; text-align:left; vertical-align:top; }
th { background:#f1f5f9; }
td.blank { height: 22pt; width: 62%; }
.note { background:#fff5d6; border-left:5px solid #ffd166; padding:8pt 11pt; margin:10pt 0; border-radius:4pt; }
.script { background:#f4f7fa; padding:9pt 12pt; border-radius:6pt; font-size:10pt; }
.cols { column-count:2; column-gap:14pt; font-size:10pt; padding-left:14pt; } .cols li { break-inside: avoid; }
.ex { border:2px dashed #2a9d8f; border-radius:8pt; padding:9pt 12pt; margin:10pt 0; page-break-inside: avoid; }
.ex b { color:#2a9d8f; }
.lines { height: 60pt; background: repeating-linear-gradient(#fff 0 19pt, #c9d3dc 19pt 20pt); margin-top:6pt; }
ul.check { list-style:none; padding-left:0; } ul.check li::before { content:'☐  '; }
code { background:#eef2f5; padding:0 3pt; border-radius:3pt; font-size:9.5pt; }
.toc li { margin: 3pt 0; }
"""


def build_pdf():
    p = ["<!doctype html><html lang='fr'><head><meta charset='utf-8'><title>%s</title><style>%s</style></head><body>"
         % (TITLE, PDF_CSS)]
    p.append("<div class='cover'><div class='tag'>FORMATION COMPLÈTE · CAHIER D'EXERCICES</div><h1>%s</h1>"
             "<p>%s</p><p>%d modules · %d leçons · %d exercices · 20 scripts complets</p></div>"
             % (TITLE, SUBTITLE, len(ALL), N_LESSONS, N_EX))
    toc = []
    for i, m in enumerate(ALL):
        toc.append("<li><b>%s</b><ol>%s</ol></li>" % (
            m["title"], "".join("<li>%s</li>" % l["title"] for l in m["lessons"])))
    p.append("<div class='mod'><h2 style='font-size:22pt'>Sommaire</h2><ol class='toc'>%s</ol>" % "".join(toc))
    p.append("<div class='note'><b>Ce que cette formation ne promet pas.</b> Personne ne peut garantir un "
             "nombre d'abonnés, de vues ou de revenus : cela dépend des plateformes, de ta régularité et de tes idées. "
             "Cette formation te donne une méthode complète et des modèles concrets.</div></div>")
    for i, m in enumerate(ALL):
        p.append("<div class='mod'><div class='mod-head'><div class='k'>Module %d</div><h2>%s</h2><p>%s</p></div>"
                 % (i, m["title"], m["intro"]))
        for j, l in enumerate(m["lessons"]):
            p.append("<h3 class='lesson'>%d.%d · %s</h3>%s" % (i, j + 1, l["title"], l["body"]))
            if l["ex"]:
                p.append("<div class='ex'><b>Exercice.</b> %s<div class='lines'></div></div>" % l["ex"])
        p.append("</div>")
    p.append("</body></html>")
    f_html = os.path.join(HERE, "studio-cartoon-cahier.html")
    with open(f_html, "w") as fh:
        fh.write("".join(p))
    pdf = os.path.join(HERE, "studio-cartoon-formation.pdf")
    subprocess.run([CHROME, "--headless", "--no-sandbox", "--disable-gpu", "--no-pdf-header-footer",
                    "--print-to-pdf=" + pdf, "file://" + f_html], check=True, capture_output=True)
    os.remove(f_html)
    return pdf


# ------------------------------------------------------------------ page de cours (artifact)
COURSE_TEMPLATE = r"""<title>Studio Cartoon</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;800&family=Source+Sans+3:wght@400;600;700&display=swap">
<style>
/* Layout : barre latérale des modules à gauche (repliée en haut sur téléphone), une leçon à la fois à droite. */
:root{--bg:#fbf8f1;--panel:#ffffff;--ink:#1d2027;--muted:#5d6672;--line:#e5dfd2;--navy:#13233a;--on-navy:#d4dbe5;
  --accent:#e0194a;--sun:#ffc94d;--done:#1f9d55;--tint:#f2eee4;--codebg:#efeae0;
  --display:'Bricolage Grotesque','Trebuchet MS',system-ui,sans-serif;--text:'Source Sans 3','Segoe UI',system-ui,sans-serif}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0f141b;--panel:#161d26;--ink:#eef0f3;--muted:#a3adb9;--line:#283241;--navy:#0a1220;--on-navy:#c3ccd8;--accent:#ff4d78;--done:#3ccf7d;--tint:#1c2531;--codebg:#222c39;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#0f141b;--panel:#161d26;--ink:#eef0f3;--muted:#a3adb9;--line:#283241;--navy:#0a1220;--on-navy:#c3ccd8;--accent:#ff4d78;--done:#3ccf7d;--tint:#1c2531;--codebg:#222c39;color-scheme:dark}
*{box-sizing:border-box}
html,body{background:var(--bg)}
body{margin:0;color:var(--ink);font-family:var(--text);font-size:17px;line-height:1.6}
.top{background:var(--navy);color:#fff;padding-block:18px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
.top .in{max-width:1180px;margin:0 auto;display:flex;flex-wrap:wrap;gap:12px 24px;align-items:center;justify-content:space-between}
.brand{font-family:var(--display);font-weight:800;font-size:24px;letter-spacing:-.01em}
.brand small{display:block;font-family:var(--text);font-weight:400;font-size:14px;color:var(--on-navy)}
.prog{min-width:0;flex:1 1 260px;max-width:420px}
.prog .bar{height:10px;border-radius:99px;background:rgba(255,255,255,.18);overflow:hidden}
.prog .bar i{display:block;height:100%;background:var(--sun);width:0;transition:width .3s}
.prog .lbl{font-size:13px;color:var(--on-navy);margin-top:5px;font-variant-numeric:tabular-nums}
.shell{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:300px minmax(0,1fr);gap:28px;padding-block:24px 60px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
nav{position:sticky;top:calc(env(safe-area-inset-top,0px) + 12px);align-self:start;max-height:calc(100vh - 24px);overflow:auto;padding-right:4px}
nav details{border-bottom:1px solid var(--line);padding-block:6px}
nav summary{cursor:pointer;font-weight:700;padding:6px 4px;list-style:none;display:flex;gap:8px;align-items:baseline}
nav summary::-webkit-details-marker{display:none}
nav summary .n{font-family:var(--display);color:var(--accent);font-size:14px;min-width:22px}
nav ol{list-style:none;margin:2px 0 6px;padding:0}
nav button{all:unset;cursor:pointer;display:flex;gap:8px;width:100%;padding:5px 6px 5px 30px;border-radius:8px;font-size:15px;color:var(--muted);box-sizing:border-box}
nav button:hover{background:var(--tint);color:var(--ink)}
nav button.cur{background:var(--tint);color:var(--ink);font-weight:700}
nav button .ck{width:16px;flex:none;color:var(--done)}
nav button:focus-visible,.btn:focus-visible,summary:focus-visible{outline:3px solid var(--sun);outline-offset:2px}
main{min-width:0}
.crumb{font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);font-weight:700}
h1{font-family:var(--display);font-weight:800;font-size:clamp(28px,4.2vw,42px);line-height:1.1;margin:6px 0 6px;text-wrap:balance}
.intro{color:var(--muted);margin:0 0 18px}
article{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:24px clamp(16px,3vw,32px);max-width:78ch}
article h3{font-family:var(--display);font-size:20px;margin:22px 0 6px}
article table{border-collapse:collapse;width:100%;font-size:15px;margin:10px 0}
.tw{overflow-x:auto}
article th,article td{border:1px solid var(--line);padding:7px 9px;text-align:left;vertical-align:top}
article th{background:var(--tint)}
td.blank{height:34px;width:60%}
.note{background:var(--tint);border-left:5px solid var(--sun);padding:11px 14px;border-radius:8px;margin:14px 0}
.script{background:var(--tint);padding:12px 15px;border-radius:10px;font-size:15.5px}
code{background:var(--codebg);padding:1px 5px;border-radius:5px;font-size:.9em}
.cols{columns:2 240px;column-gap:24px;padding-left:18px}.cols li{break-inside:avoid}
ul.check{list-style:none;padding:0}ul.check li::before{content:"\2610  "}
.ex{margin-top:22px;border:2px dashed var(--done);border-radius:12px;padding:14px 16px}
.ex b{color:var(--done)}
.foot{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;margin-top:20px;max-width:78ch}
.btn{all:unset;cursor:pointer;padding:11px 18px;border-radius:999px;font-weight:700;border:2px solid var(--line);background:var(--panel)}
.btn.main{background:var(--accent);color:#fff;border-color:var(--accent)}
.btn[disabled]{opacity:.4;cursor:default}
label.done{display:flex;gap:8px;align-items:center;font-weight:700;cursor:pointer}
label.done input{width:20px;height:20px;accent-color:var(--done)}
@media (max-width:860px){.shell{grid-template-columns:minmax(0,1fr)}nav{position:static;max-height:none;border:1px solid var(--line);border-radius:14px;padding:6px 10px;background:var(--panel)}}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
<header class="top"><div class="in">
  <div class="brand">Studio Cartoon<small>__SUB__</small></div>
  <div class="prog" aria-live="polite"><div class="bar"><i id="pbar"></i></div><div class="lbl" id="plbl"></div></div>
</div></header>
<div class="shell">
  <nav id="nav" aria-label="Modules de la formation"></nav>
  <main>
    <div class="crumb" id="crumb"></div>
    <h1 id="ltitle"></h1>
    <p class="intro" id="lintro"></p>
    <article id="lbody"></article>
    <div class="foot">
      <button class="btn" id="prev" type="button">← Précédente</button>
      <label class="done"><input type="checkbox" id="donebox"> Leçon terminée</label>
      <button class="btn main" id="next" type="button">Suivante →</button>
    </div>
  </main>
</div>
<script>
const DATA = __DATA__;
const flat = [];
DATA.forEach((m, i) => m.lessons.forEach((l, j) => flat.push({m: i, l: j})));
let done = {};
try { done = JSON.parse(localStorage.getItem("sc-done") || "{}"); } catch (e) {}
let cur = 0;
try { cur = Math.min(flat.length - 1, Math.max(0, +(localStorage.getItem("sc-cur") || 0))); } catch (e) {}
const key = k => flat[k].m + "." + flat[k].l;
function save() { try { localStorage.setItem("sc-done", JSON.stringify(done)); localStorage.setItem("sc-cur", cur); } catch (e) {} }
function navBuild() {
  const nav = document.getElementById("nav"); nav.innerHTML = "";
  DATA.forEach((m, i) => {
    const d = document.createElement("details");
    d.open = flat[cur].m === i;
    const s = document.createElement("summary");
    const n = m.lessons.length, nd = m.lessons.filter((_, j) => done[i + "." + j]).length;
    s.innerHTML = '<span class="n">' + (i === DATA.length - 1 ? "★" : i) + '</span><span>' + m.title + ' <small style="color:var(--muted);font-weight:400">' + nd + "/" + n + "</small></span>";
    d.appendChild(s);
    const ol = document.createElement("ol");
    m.lessons.forEach((l, j) => {
      const k = flat.findIndex(x => x.m === i && x.l === j);
      const li = document.createElement("li"), b = document.createElement("button");
      b.type = "button"; if (k === cur) b.className = "cur";
      b.innerHTML = '<span class="ck">' + (done[i + "." + j] ? "✓" : "") + "</span><span>" + l.title + "</span>";
      b.onclick = () => go(k);
      li.appendChild(b); ol.appendChild(li);
    });
    d.appendChild(ol); nav.appendChild(d);
  });
}
function render() {
  const f = flat[cur], m = DATA[f.m], l = m.lessons[f.l];
  document.getElementById("crumb").textContent = (f.m === DATA.length - 1 ? "Bonus" : "Module " + f.m + " · " + m.title) + " · Leçon " + (f.l + 1) + "/" + m.lessons.length;
  document.getElementById("ltitle").textContent = l.title;
  document.getElementById("lintro").textContent = f.l === 0 ? m.intro : "";
  let body = l.body.replace(/<table>/g, '<div class="tw"><table>').replace(/<\/table>/g, "</table></div>");
  if (l.ex) body += '<div class="ex"><b>Exercice.</b> ' + l.ex + "</div>";
  document.getElementById("lbody").innerHTML = body;
  document.getElementById("prev").disabled = cur === 0;
  document.getElementById("next").disabled = cur === flat.length - 1;
  document.getElementById("donebox").checked = !!done[key(cur)];
  const nd = Object.values(done).filter(Boolean).length;
  document.getElementById("pbar").style.width = (100 * nd / flat.length) + "%";
  document.getElementById("plbl").textContent = nd + " / " + flat.length + " leçons terminées";
  navBuild();
}
function go(k) { cur = k; save(); render(); window.scrollTo({top: 0}); }
document.getElementById("prev").onclick = () => cur > 0 && go(cur - 1);
document.getElementById("next").onclick = () => { done[key(cur)] = true; if (cur < flat.length - 1) go(cur + 1); else { save(); render(); } };
document.getElementById("donebox").onchange = e => { done[key(cur)] = e.target.checked; save(); render(); };
render();
</script>
"""


def build_course(path):
    data = [dict(title=m["title"], intro=m["intro"], lessons=m["lessons"]) for m in ALL]
    page = COURSE_TEMPLATE.replace("__DATA__", json.dumps(data, ensure_ascii=False).replace("</", "<\\/")) \
        .replace("__SUB__", "%d modules · %d leçons · %d exercices" % (len(ALL), N_LESSONS, N_EX))
    with open(path, "w") as fh:
        fh.write(page)
    return path


if __name__ == "__main__":
    print(build_pdf())
    print(build_course(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "studio-cartoon-cours.html")))
    print("modules=%d lecons=%d exercices=%d" % (len(ALL), N_LESSONS, N_EX))
