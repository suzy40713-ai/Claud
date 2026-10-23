"""Génère les produits imprimables (HTML A4) pour la boutique Etsy.

Usage : python3 generate.py  ->  écrit build/<produit>.html
Le rendu PDF/PNG est fait ensuite par render.mjs (Chromium).
"""
import calendar
import datetime as dt
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BUILD = ROOT / "build"
SHOP = "Pages Pratiques"
YEAR = 2027

MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet",
          "Août", "Septembre", "Octobre", "Novembre", "Décembre"]
DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
DAYS_SHORT = ["L", "M", "M", "J", "V", "S", "D"]


def easter(year):
    a = year % 19
    b, c = divmod(year, 100)
    d, e = divmod(b, 4)
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i, k = divmod(c, 4)
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    month = (h + l - 7 * m + 114) // 31
    day = (h + l - 7 * m + 114) % 31 + 1
    return dt.date(year, month, day)


def holidays(year):
    e = easter(year)
    return {
        dt.date(year, 1, 1): "Jour de l'an",
        e + dt.timedelta(days=1): "Lundi de Pâques",
        dt.date(year, 5, 1): "Fête du Travail",
        dt.date(year, 5, 8): "Victoire 1945",
        e + dt.timedelta(days=39): "Ascension",
        e + dt.timedelta(days=50): "Lundi de Pentecôte",
        dt.date(year, 7, 14): "Fête nationale",
        dt.date(year, 8, 15): "Assomption",
        dt.date(year, 11, 1): "Toussaint",
        dt.date(year, 11, 11): "Armistice",
        dt.date(year, 12, 25): "Noël",
    }


CSS = """
@font-face { font-family: "Fraunces"; src: url("../fonts/Fraunces.woff2") format("woff2"); font-weight: 100 900; }
@font-face { font-family: "Karla"; src: url("../fonts/Karla.woff2") format("woff2"); font-weight: 200 800; }
:root {
  --ink: #2b2d2c; --muted: #6f7773; --line: #c7d1cd; --soft: #eef3f1;
  --accent: #3d6b66; --accent-soft: #dce8e5; --warm: #e8dcc4; --warm-ink: #8a6a2f;
  --display: "Fraunces", Georgia, serif; --body: "Karla", "Helvetica Neue", Arial, sans-serif;
}
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; color: var(--ink); font-family: var(--body);
  -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 210mm; height: 297mm; padding: 14mm 14mm 11mm; display: flex; flex-direction: column;
  gap: 5mm; overflow: hidden; position: relative; break-after: page; page-break-after: always; background: #fff; }
.page:last-child { break-after: auto; page-break-after: auto; }
.head { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1.4pt solid var(--ink); padding-bottom: 2.5mm; }
.head h1 { font-family: var(--display); font-weight: 600; font-size: 25pt; margin: 0; line-height: 1; letter-spacing: -0.01em; }
.eyebrow { font-size: 7.5pt; letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent); font-weight: 700; }
.head .side { text-align: right; display: grid; gap: 1.5mm; font-size: 9pt; color: var(--muted); }
.fill { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 5mm; }
.foot { display: flex; justify-content: space-between; font-size: 7pt; color: var(--muted); letter-spacing: 0.06em; }
.box { border: 0.8pt solid var(--line); border-radius: 3mm; padding: 3mm 4mm; display: flex; flex-direction: column; min-height: 0; }
.box h2 { font-family: var(--display); font-weight: 600; font-size: 12pt; margin: 0 0 1.5mm; }
.box h2 small { font-family: var(--body); font-weight: 400; font-size: 8pt; color: var(--muted); margin-left: 2mm; }
.tint { background: var(--soft); border-color: var(--soft); }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
.grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4mm; }
.lines { flex: 1; display: flex; flex-direction: column; }
.line { flex: 1; min-height: 6.6mm; border-bottom: 0.6pt solid var(--line); display: flex; align-items: flex-end;
  font-size: 9pt; padding-bottom: 0.8mm; gap: 2mm; }
.line .lbl { flex: 1; }
.line .amt { width: 22mm; border-left: 0.6pt solid var(--line); height: 100%; text-align: right; color: var(--muted); font-size: 8pt; padding-right: 1mm; display:flex; align-items:flex-end; justify-content:flex-end; }
.check { width: 3.4mm; height: 3.4mm; border: 0.8pt solid var(--ink); border-radius: 0.8mm; flex: none; margin-bottom: 0.4mm; }
table { width: 100%; border-collapse: collapse; font-size: 8.5pt; font-variant-numeric: tabular-nums; }
th { text-align: left; font-weight: 700; font-size: 7.5pt; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent);
  padding: 1.6mm 1.5mm; border-bottom: 1pt solid var(--ink); }
td { border-bottom: 0.6pt solid var(--line); padding: 0 1.5mm; height: 8mm; }
td + td, th + th { border-left: 0.6pt solid var(--line); }
.total { display: flex; justify-content: space-between; align-items: center; background: var(--accent-soft); border-radius: 2mm;
  padding: 2.4mm 3.5mm; font-weight: 700; font-size: 9.5pt; margin-top: 2mm; }
.total span:last-child { width: 26mm; border-bottom: 0.8pt solid var(--accent); height: 5mm; }
.note { font-size: 8.5pt; color: var(--muted); line-height: 1.45; }

/* Couverture */
.cover { padding: 0; }
.cover .band { background: var(--accent); color: #fff; height: 150mm; padding: 22mm 18mm 14mm; display: flex; flex-direction: column; justify-content: flex-end; gap: 4mm; position: relative; overflow: hidden; }
.cover .band::before { content: ""; position: absolute; width: 150mm; height: 150mm; border-radius: 50%; border: 18mm solid rgba(255,255,255,0.08); right: -55mm; top: -70mm; }
.cover .band .eyebrow { color: var(--warm); }
.cover h1 { font-family: var(--display); font-weight: 600; font-size: 46pt; line-height: 0.98; margin: 0; letter-spacing: -0.02em; max-width: 150mm; }
.cover .year { font-family: var(--display); font-size: 20pt; color: var(--warm); }
.cover .body { padding: 14mm 18mm; flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; align-content: start; }
.cover .body h3 { font-family: var(--display); font-weight: 600; font-size: 15pt; margin: 0 0 5mm; }
.cover ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 3.2mm; font-size: 11.5pt; line-height: 1.35; }
.cover li { display: flex; gap: 3mm; align-items: baseline; }
.cover li::before { content: ""; width: 2.2mm; height: 2.2mm; border-radius: 50%; background: var(--accent); flex: none; transform: translateY(-0.3mm); }
.cover .owner { border-top: 0.8pt solid var(--line); padding-top: 3mm; font-size: 9pt; color: var(--muted); margin-top: 8mm; }
.cover .owner div { border-bottom: 0.8pt solid var(--line); height: 9mm; }
.cover .brand { padding: 0 18mm 12mm; font-size: 8pt; color: var(--muted); letter-spacing: 0.14em; text-transform: uppercase; }

/* Calendriers */
.mini-year { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm 7mm; flex: 1; align-content: start; }
.mini h3 { font-family: var(--display); font-weight: 600; font-size: 11pt; margin: 0 0 1.5mm; }
.mini table td, .mini table th { border: none; height: 5.6mm; padding: 0; text-align: center; font-size: 8pt; }
.mini table th { color: var(--muted); font-size: 6.5pt; }
.mini .we { color: var(--accent); font-weight: 700; }
.mini .ferie { background: var(--warm); border-radius: 50%; font-weight: 700; }
.month-grid { flex: 1; display: grid; grid-template-columns: repeat(7, 1fr); border-top: 0.8pt solid var(--line); border-left: 0.8pt solid var(--line); }
.month-grid .dh { height: 7mm; display: flex; align-items: center; justify-content: center; font-size: 7.5pt; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); border-right: 0.8pt solid var(--line); border-bottom: 0.8pt solid var(--ink); }
.month-grid .c { border-right: 0.8pt solid var(--line); border-bottom: 0.8pt solid var(--line); padding: 1.4mm 1.8mm; font-size: 10pt; font-weight: 700; display: flex; flex-direction: column; gap: 0.8mm; }
.month-grid .c.out { background: var(--soft); }
.month-grid .c.we { background: #f7f9f8; }
.month-grid .c small { font-weight: 500; font-size: 6.5pt; color: var(--warm-ink); line-height: 1.15; }
.legend { display: flex; gap: 6mm; font-size: 8pt; color: var(--muted); align-items: center; }
.legend i { display: inline-block; width: 3.4mm; height: 3.4mm; border-radius: 50%; background: var(--warm); margin-right: 1.5mm; vertical-align: -0.5mm; }

/* Grilles de suivi */
.tracker { width: 100%; border-collapse: collapse; table-layout: fixed; }
.tracker th, .tracker td { border: 0.6pt solid var(--line); height: 6.4mm; padding: 0; text-align: center; font-size: 6.5pt; }
.tracker th { color: var(--muted); font-weight: 700; letter-spacing: 0; text-transform: none; border-bottom: 0.6pt solid var(--line); }
.tracker td.name { text-align: left; padding-left: 1.5mm; width: 38mm; }
.tracker th.name { width: 38mm; }
.pixels { width: 100%; border-collapse: collapse; table-layout: fixed; }
.pixels th, .pixels td { border: 0.6pt solid var(--line); height: 6.2mm; padding: 0; text-align: center; font-size: 6.5pt; color: var(--muted); }
.pixels th { border-bottom: 0.6pt solid var(--line); letter-spacing: 0; padding: 0.8mm 0; }
.pixels td.na { background: var(--soft); }
.swatches { display: flex; gap: 4mm; flex-wrap: wrap; font-size: 8.5pt; }
.swatches span { display: flex; align-items: center; gap: 1.6mm; }
.swatches b { width: 5mm; height: 5mm; border: 0.8pt solid var(--line); border-radius: 1mm; }
.thermo { display: grid; grid-template-columns: repeat(10, 1fr); gap: 2mm; }
.thermo div { aspect-ratio: 1; border: 0.8pt solid var(--line); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 7pt; color: var(--muted); }
"""


def doc(title, pages):
    return (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>{title}</title>'
            f'<style>{CSS}</style></head><body>{"".join(pages)}</body></html>')


def page(title, eyebrow, body, side="", num=None):
    foot = f'<div class="foot"><span>{SHOP.upper()}</span><span>{num if num else ""}</span></div>'
    return (f'<section class="page"><div class="head"><div><div class="eyebrow">{eyebrow}</div><h1>{title}</h1></div>'
            f'<div class="side">{side}</div></div><div class="fill">{body}</div>{foot}</section>')


def cover(title, subtitle, eyebrow, contents, usage):
    items = "".join(f"<li>{c}</li>" for c in contents)
    use = "".join(f"<li>{u}</li>" for u in usage)
    return (f'<section class="page cover"><div class="band"><div class="eyebrow">{eyebrow}</div><h1>{title}</h1>'
            f'<div class="year">{subtitle}</div></div><div class="body"><div><h3>Dans ce pack</h3><ul>{items}</ul></div>'
            f'<div><h3>Comment l\'utiliser</h3><ul>{use}</ul><div class="owner">Ce carnet appartient à<div></div></div></div></div>'
            f'<div class="brand">{SHOP} · Format A4 · À imprimer chez soi</div></section>')


def lines(n, labels=None, amounts=False, checks=False):
    out = []
    for i in range(n):
        lbl = labels[i] if labels and i < len(labels) else ""
        chk = '<span class="check"></span>' if checks else ""
        amt = '<span class="amt">€</span>' if amounts else ""
        out.append(f'<div class="line">{chk}<span class="lbl">{lbl}</span>{amt}</div>')
    return f'<div class="lines">{"".join(out)}</div>'


def box(title, inner, extra="", cls="", style=""):
    small = f"<small>{extra}</small>" if extra else ""
    return f'<div class="box {cls}" style="{style}"><h2>{title}{small}</h2>{inner}</div>'


def table(headers, rows, widths=None):
    ths = "".join(
        f'<th style="width:{widths[i]}">{h}</th>' if widths and widths[i] else f"<th>{h}</th>"
        for i, h in enumerate(headers))
    trs = "".join("<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>" for r in rows)
    return f"<table><thead><tr>{ths}</tr></thead><tbody>{trs}</tbody></table>"


def total(label):
    return f'<div class="total"><span>{label}</span><span></span></div>'


# ---------------------------------------------------------------- Budget
def budget():
    pages = [cover(
        "Planner budget", f"Année {YEAR}", "Finances personnelles",
        ["Objectifs financiers de l'année", "Vue d'ensemble sur 12 mois", "12 pages de budget mensuel",
         "Suivi des dépenses au quotidien", "Suivi de l'épargne", "Plan de remboursement des dettes"],
        ["Imprimez les pages dont vous avez besoin, en A4 ou A5", "Notez vos revenus en début de mois",
         "Reportez chaque dépense dans la bonne catégorie", "Faites le bilan à la fin du mois"])]

    goals = "".join(box(t, lines(4)) for t in ["Mon objectif principal", "Ce que je veux épargner", "Les dettes à rembourser", "Ma récompense si j'y arrive"])
    pages.append(page("Mes objectifs", f"Budget {YEAR}", f'<div class="grid2" style="flex:1">{goals}</div>'
                      + box("Pourquoi c'est important pour moi", lines(4)), num=2))

    rows = [[m, "", "", "", ""] for m in MONTHS] + [["<b>Total</b>", "", "", "", ""]]
    pages.append(page("Vue d'ensemble", f"Budget {YEAR}",
                      table(["Mois", "Revenus", "Dépenses", "Épargne", "Reste"], rows, ["30mm", None, None, None, None])
                      .replace("<td>", '<td style="height:15.5mm">'),
                      side="Reportez ici le bilan<br>de chaque mois", num=3))

    fixed = ["Loyer / crédit immobilier", "Électricité / gaz", "Eau", "Internet", "Téléphone", "Assurances",
             "Transport / carburant", "Abonnements", "Crédits", ""]
    var = ["Courses", "Restaurants / sorties", "Loisirs", "Vêtements", "Santé", "Cadeaux", "Enfants", "Imprévus", ""]
    for i, m in enumerate(MONTHS):
        left = (box("Revenus", lines(5, ["Salaire", "Aides / allocations", "Revenus complémentaires", "", ""], amounts=True) + total("Total revenus"))
                + box("Épargne", lines(3, ["Épargne de précaution", "Projet", ""], amounts=True) + total("Total épargne")))
        right = (box("Charges fixes", lines(len(fixed), fixed, amounts=True) + total("Total charges fixes"))
                 + box("Dépenses variables", lines(len(var), var, amounts=True) + total("Total variables"), style="flex:1"))
        bilan = box("Bilan du mois", '<div class="grid3" style="font-size:9pt">'
                    '<div>Revenus<div class="line"></div></div><div>– Dépenses et épargne<div class="line"></div></div>'
                    '<div><b>= Il me reste</b><div class="line"></div></div></div>', cls="tint")
        body = (f'<div class="grid2" style="flex:1"><div class="fill">{left}'
                f'{box("Notes", lines(4), style="flex:1")}</div><div class="fill">{right}</div></div>{bilan}')
        pages.append(page(m, f"Budget mensuel {YEAR}", body, side=f"Mois {i + 1:02d} / 12", num=4 + i))

    pages.append(page("Suivi des dépenses", "Au jour le jour",
                      table(["Date", "Description", "Catégorie", "Montant"], [["", "", "", ""]] * 27, ["20mm", None, "40mm", "26mm"]),
                      side="Mois : ____________", num=16))

    dots = "".join(f"<div>{(i + 1) * 5}%</div>" for i in range(20))
    pages.append(page("Suivi de l'épargne", f"Budget {YEAR}",
                      box("Mon objectif", '<div class="grid2" style="font-size:9.5pt"><div>Je veux épargner<div class="line"></div></div>'
                          '<div>Pour le<div class="line"></div></div></div>')
                      + box("Coloriez une case à chaque étape franchie", f'<div class="thermo">{dots}</div>', cls="tint")
                      + table(["Date", "Montant versé", "Total épargné"], [["", "", ""]] * 16, ["30mm", None, None]),
                      num=17))

    pages.append(page("Remboursement des dettes", f"Budget {YEAR}",
                      table(["Créancier", "Montant dû", "Mensualité", "Taux", "Fin prévue"], [["", "", "", "", ""]] * 6)
                      + box("Suivi des versements", table(["Date", "Créancier", "Versé", "Reste à payer"], [["", "", "", ""]] * 14, ["24mm", None, "28mm", "32mm"])),
                      num=18))
    return doc("Planner budget", pages)


# ---------------------------------------------------------------- Agenda
def mini_month(year, month, fer):
    weeks = calendar.Calendar(0).monthdayscalendar(year, month)
    head = "".join(f"<th>{d}</th>" for d in DAYS_SHORT)
    rows = ""
    for w in weeks:
        cells = ""
        for i, d in enumerate(w):
            if d == 0:
                cells += "<td></td>"
                continue
            cls = "ferie" if dt.date(year, month, d) in fer else ("we" if i >= 5 else "")
            cells += f'<td class="{cls}">{d}</td>'
        rows += f"<tr>{cells}</tr>"
    return f'<div class="mini"><h3>{MONTHS[month - 1]}</h3><table><thead><tr>{head}</tr></thead><tbody>{rows}</tbody></table></div>'


def agenda():
    fer = holidays(YEAR)
    pages = [cover(
        "Agenda mensuel", f"Janvier – Décembre {YEAR}", "Organisation",
        [f"Calendrier annuel {YEAR}", "Jours fériés français indiqués", "12 pages mensuelles datées",
         "Planning de la semaine (non daté)", "Page de dates importantes"],
        ["Imprimez tout ou seulement le mois en cours", "Notez rendez-vous et échéances dans les cases",
         "Utilisez le planning de la semaine pour le détail", "Les jours fériés sont surlignés"])]
    minis = "".join(mini_month(YEAR, m, fer) for m in range(1, 13))
    pages.append(page(f"Calendrier {YEAR}", "Vue de l'année", f'<div class="mini-year">{minis}</div>'
                      '<div class="legend"><span><i></i>Jour férié</span></div>', num=2))

    imp = "".join(box(m, lines(4), style="padding:2mm 3mm") for m in MONTHS)
    pages.append(page("Dates importantes", f"Année {YEAR}", f'<div class="grid3" style="flex:1;grid-auto-rows:1fr">{imp}</div>',
                      side="Anniversaires, échéances,<br>vacances…", num=3))

    for m in range(1, 13):
        cells = "".join(f'<div class="dh">{d[:3]}</div>' for d in DAYS)
        for w in calendar.Calendar(0).monthdatescalendar(YEAR, m):
            for i, d in enumerate(w):
                if d.month != m:
                    cells += '<div class="c out"></div>'
                    continue
                label = f"<small>{fer[d]}</small>" if d in fer else ""
                cells += f'<div class="c{" we" if i >= 5 else ""}">{d.day}{label}</div>'
        weeks = len(calendar.Calendar(0).monthdatescalendar(YEAR, m))
        body = (f'<div class="month-grid" style="grid-template-rows: 7mm repeat({weeks}, 1fr)">{cells}</div>'
                f'<div class="grid2" style="height:42mm">{box("Objectifs du mois", lines(3, checks=True))}{box("Notes", lines(3))}</div>')
        pages.append(page(MONTHS[m - 1], f"Agenda {YEAR}", body, side=f"{YEAR}", num=3 + m))

    days = "".join(box(d, lines(6), style="flex:1") for d in DAYS[:6])
    week = (f'<div class="grid2" style="flex:1;grid-auto-rows:1fr">{days}'
            f'{box("Dimanche", lines(6))}{box("Priorités de la semaine", lines(6, checks=True), cls="tint")}</div>')
    pages.append(page("Ma semaine", "Planning hebdomadaire", week, side="Du ______ au ______", num=16))
    return doc("Agenda mensuel", pages)


# ---------------------------------------------------------------- Repas & courses
def repas():
    pages = [cover(
        "Menus & courses", "Planning de la semaine", "Cuisine & organisation",
        ["Planning des repas sur 7 jours", "Liste de courses par rayon", "Fiche recette", "Inventaire frigo & placards", "Banque d'idées de repas"],
        ["Planifiez vos repas le week-end", "Notez les ingrédients manquants dans la liste", "Faites vos courses rayon par rayon",
         "Gardez vos fiches recettes dans un classeur"])]

    rows = "".join(f"<tr><td><b>{d}</b></td><td></td><td></td><td></td></tr>" for d in DAYS)
    plan = (f'<table><thead><tr><th style="width:26mm">Jour</th><th>Petit-déjeuner</th><th>Déjeuner</th><th>Dîner</th></tr></thead>'
            f'<tbody>{rows}</tbody></table>').replace("<td>", '<td style="height:24mm">')
    pages.append(page("Menus de la semaine", "Planning des repas", plan
                      + f'<div class="grid2" style="flex:1">{box("À préparer à l’avance", lines(5, checks=True))}{box("Goûters & collations", lines(5))}</div>',
                      side="Semaine du ____________", num=2))

    rayons = ["Fruits & légumes", "Boucherie & poisson", "Crèmerie & fromages", "Boulangerie", "Épicerie salée",
              "Épicerie sucrée", "Surgelés", "Boissons", "Hygiène & beauté", "Entretien maison"]
    shop = "".join(box(r, lines(5, checks=True), style="padding:2mm 3mm") for r in rayons)
    pages.append(page("Liste de courses", "Rayon par rayon", f'<div class="grid2" style="flex:1;grid-auto-rows:1fr">{shop}</div>',
                      side="Budget prévu : _______ €", num=3))

    recette = (box("Informations", '<div class="grid3" style="font-size:9pt"><div>Portions<div class="line"></div></div>'
                   '<div>Préparation<div class="line"></div></div><div>Cuisson<div class="line"></div></div></div>', cls="tint")
               + f'<div class="grid2" style="flex:1"><div class="fill">{box("Ingrédients", lines(14, checks=True), style="flex:1")}</div>'
               f'<div class="fill">{box("Préparation", lines(14), style="flex:1")}</div></div>'
               + box("Astuces & variantes", lines(3)))
    pages.append(page("Ma recette", "Fiche recette", recette, side="Nom : ____________________", num=4))

    inv = "".join(box(z, table(["Produit", "Qté", "À consommer avant"], [["", "", ""]] * 9, [None, "14mm", "30mm"]))
                  for z in ["Réfrigérateur", "Congélateur", "Placards", "Épices & condiments"])
    pages.append(page("Inventaire", "Frigo & placards", f'<div class="grid2" style="flex:1">{inv}</div>', num=5))

    ideas = "".join(box(c, lines(9)) for c in ["Plats rapides (moins de 20 min)", "Plats du week-end", "Repas végétariens", "Plats à congeler", "Desserts", "Recettes à tester"])
    pages.append(page("Idées de repas", "Banque d'idées", f'<div class="grid2" style="flex:1;grid-auto-rows:1fr">{ideas}</div>', num=6))
    return doc("Menus et courses", pages)


# ---------------------------------------------------------------- Habitudes
def habitudes():
    pages = [cover(
        "Suivi d'habitudes", "Routines & bien-être", "Développement personnel",
        ["Tracker d'habitudes mensuel (31 jours)", "Routines du matin et du soir", "Mon année en pixels (humeur)",
         "Objectifs du mois", "Bilan mensuel"],
        ["Choisissez 5 à 12 habitudes à suivre", "Cochez chaque jour où l'habitude est faite",
         "Coloriez une case par jour selon votre humeur", "Faites le bilan à la fin du mois"])]

    head = '<th class="name">Habitude</th>' + "".join(f"<th>{d}</th>" for d in range(1, 32))
    rows = "".join(f'<tr><td class="name"></td>{"<td></td>" * 31}</tr>' for _ in range(14))
    tracker = f'<table class="tracker"><thead><tr>{head}</tr></thead><tbody>{rows}</tbody></table>'
    pages.append(page("Mes habitudes", "Tracker mensuel", tracker
                      + f'<div class="grid2" style="flex:1">{box("Ce qui a bien marché", lines(5))}{box("Ce que je change le mois prochain", lines(5))}</div>',
                      side="Mois : ____________", num=2))

    routines = (f'<div class="grid2" style="flex:1">{box("Routine du matin", lines(12, checks=True))}'
                f'{box("Routine du soir", lines(12, checks=True))}</div>'
                + box("Mes intentions", lines(4), cls="tint"))
    pages.append(page("Mes routines", "Matin & soir", routines, num=3))

    head = "<th></th>" + "".join(f"<th>{m[:3]}</th>" for m in MONTHS)
    body = ""
    for d in range(1, 32):
        cells = "".join('<td class="na"></td>' if d > calendar.monthrange(YEAR, m)[1] else "<td></td>" for m in range(1, 13))
        body += f"<tr><th>{d}</th>{cells}</tr>"
    moods = ["Excellente journée", "Bonne journée", "Journée normale", "Fatigué(e)", "Stressé(e)", "Triste"]
    sw = "".join(f"<span><b></b>{x}</span>" for x in moods)
    pages.append(page("Mon année en pixels", f"Humeur {YEAR}",
                      f'<table class="pixels"><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table>'
                      + box("Ma légende : choisissez une couleur par humeur", f'<div class="swatches">{sw}</div>', cls="tint"),
                      num=4))

    goals = (f'<div class="grid2">{box("Objectif n°1", lines(4))}{box("Objectif n°2", lines(4))}</div>'
             f'<div class="grid2">{box("Objectif n°3", lines(4))}{box("Petites victoires", lines(4, checks=True))}</div>'
             + box("Bilan du mois", '<div class="grid3" style="font-size:9pt"><div>Ma note du mois<div class="line"></div></div>'
                   '<div>Ma plus grande fierté<div class="line"></div></div><div>Ma leçon<div class="line"></div></div></div>', cls="tint")
             + box("Notes", lines(6), style="flex:1"))
    pages.append(page("Objectifs du mois", "Bilan & intentions", goals, side="Mois : ____________", num=5))
    return doc("Suivi d'habitudes", pages)


# ---------------------------------------------------------------- Ménage
def menage():
    pages = [cover(
        "Planning ménage", "Une maison rangée sans y passer le week-end", "Maison",
        ["Routine quotidienne (15 min)", "Planning de la semaine, jour par jour", "Checklists pièce par pièce",
         "Tâches mensuelles et saisonnières", "Répartition des tâches en famille"],
        ["Affichez la routine quotidienne sur le frigo", "Une pièce par jour, pas tout le samedi",
         "Plastifiez les checklists pour les réutiliser", "Cochez au feutre effaçable"])]

    daily = ["Faire les lits", "Vaisselle / lave-vaisselle", "Essuyer le plan de travail", "Ranger 10 objets",
             "Sortir les poubelles si besoin", "Passer un coup sur la table", "Préparer le lendemain"]
    week_plan = {"Lundi": "Cuisine", "Mardi": "Salle de bain & WC", "Mercredi": "Linge & draps", "Jeudi": "Salon & entrée",
                 "Vendredi": "Chambres", "Samedi": "Sols & aspirateur", "Dimanche": "Repos & préparation des repas"}
    head = "<th>Tâche</th>" + "".join(f"<th>{d[:3]}</th>" for d in DAYS)
    rows = "".join(f'<tr><td>{t}</td>{"<td></td>" * 7}</tr>' for t in daily + ["", ""])
    tbl = f'<table><thead><tr>{head}</tr></thead><tbody>{rows}</tbody></table>'.replace("<th>Tâche</th>", '<th style="width:62mm">Tâche</th>')
    plan = "".join(f'<div class="line"><b style="width:30mm">{d}</b><span class="lbl">{z}</span></div>' for d, z in week_plan.items())
    pages.append(page("Ma semaine de ménage", "Routine quotidienne", box("Chaque jour (environ 15 minutes)", tbl)
                      + box("Une zone par jour", f'<div class="lines">{plan}</div>', cls="tint", style="flex:1"),
                      side="Semaine du ____________", num=2))

    rooms = {
        "Cuisine": ["Nettoyer l'évier", "Plaques de cuisson", "Façade du frigo", "Micro-ondes", "Poubelles et bacs", "Sol"],
        "Salle de bain": ["Lavabo et robinets", "Douche / baignoire", "Miroir", "WC", "Changer les serviettes", "Sol"],
        "Salon": ["Dépoussiérer les meubles", "Coussins et plaids", "Écrans", "Ranger les jouets / objets", "Aspirateur", "Aérer"],
        "Chambres": ["Changer les draps", "Dépoussiérer", "Ranger les vêtements", "Table de nuit", "Aspirateur", "Aérer"],
        "Entrée": ["Chaussures rangées", "Porte-manteaux", "Courrier trié", "Miroir / poignées", "Paillasson", "Sol"],
        "Linge": ["Lancer une machine", "Étendre / sécher", "Plier", "Repasser", "Ranger", "Trier le linge sale"],
    }
    rb = "".join(box(r, lines(len(t), t, checks=True)) for r, t in rooms.items())
    pages.append(page("Pièce par pièce", "Checklists", f'<div class="grid2" style="flex:1;grid-auto-rows:1fr">{rb}</div>', num=3))

    monthly = ["Dégivrer / nettoyer le frigo", "Four", "Plinthes", "Vitres", "Hotte et filtres", "Lave-linge (cycle à vide)",
               "Matelas (aérer, retourner)", "Trier les papiers", "Pharmacie (dates)", ""]
    seasons = {"Printemps": ["Grand tri des placards", "Rideaux", "Balcon / terrasse"], "Été": ["Ventilateurs", "Ranger les vêtements d'hiver", "Moustiquaires"],
               "Automne": ["Couettes et plaids", "Gouttières / extérieur", "Chauffage (entretien)"], "Hiver": ["Décorations", "Tri des jouets", "Bilan des produits ménagers"]}
    sb = "".join(box(s, lines(4, t, checks=True)) for s, t in seasons.items())
    pages.append(page("Chaque mois & chaque saison", "Grand ménage",
                      box("Une fois par mois", lines(len(monthly), monthly, checks=True)) + f'<div class="grid2" style="flex:1">{sb}</div>', num=4))

    fam = table(["Tâche", "Qui ?", "Quand ?", "Fait"], [["", "", "", ""]] * 23, [None, "36mm", "30mm", "14mm"])
    pages.append(page("Qui fait quoi ?", "En famille ou en colocation", fam + box("Récompense de la semaine", lines(2), cls="tint"), num=5))
    return doc("Planning ménage", pages)


PRODUCTS = {
    "planner-budget-2027": budget,
    "agenda-mensuel-2027": agenda,
    "menus-et-courses": repas,
    "suivi-habitudes": habitudes,
    "planning-menage": menage,
}

if __name__ == "__main__":
    BUILD.mkdir(exist_ok=True)
    for slug, fn in PRODUCTS.items():
        (BUILD / f"{slug}.html").write_text(fn(), encoding="utf-8")
        print("ok", slug)
    print("Pâques", YEAR, easter(YEAR))
