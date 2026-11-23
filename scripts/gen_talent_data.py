"""Simulated data generator for the Paramount Talent Tracking demo dashboard.

All rows are SIMULATED for demo purposes. Talents and titles are real, current
names, but every number, event and post below is invented and illustrative.
Grain of the monthly matrix: period x country x talent x platform, stored as
counts so the dashboard can compute any rate for any filter combination.
"""
import json, random, sys, os
from datetime import date, timedelta

random.seed(20261123)
OUT = sys.argv[1] if len(sys.argv) > 1 else "out"
os.makedirs(OUT, exist_ok=True)
CODE = open(__file__, encoding="utf-8").read()

MONTHS = ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"]
COUNTRIES = {"US": 1.0, "MX": 0.55, "UK": 0.45, "BR": 0.6, "FR": 0.35}
LANG = {"US": "en", "UK": "en", "MX": "es", "BR": "pt", "FR": "fr"}
PLATFORMS = ["TikTok", "Instagram", "Facebook", "YouTube", "X", "Reddit", "Google News"]
P_BASE = {"TikTok": .24, "Instagram": .22, "Facebook": .11, "YouTube": .12, "X": .14, "Reddit": .07, "Google News": .10}
P_COUNTRY = {
    "US": {}, "UK": {"Reddit": 1.0, "Facebook": .9},
    "MX": {"Facebook": 1.5, "Reddit": .2, "X": .8}, "BR": {"Facebook": 1.4, "Reddit": .2, "X": .9, "TikTok": 1.1},
    "FR": {"Reddit": .3, "X": 1.15, "Facebook": .8},
}
VIEWS_PER_POST = {"TikTok": 2600, "Instagram": 1700, "Facebook": 950, "YouTube": 3200, "X": 800, "Reddit": 0, "Google News": 0}
VIEW_COV = {"TikTok": .97, "Instagram": .85, "Facebook": .70, "YouTube": .98, "X": .55, "Reddit": 0, "Google News": 0}
ENG_PER_1K = {"TikTok": 55, "Instagram": 48, "Facebook": 35, "YouTube": 30, "X": 40}
PULL_P = {"TikTok": 1.1, "Instagram": 1.0, "Facebook": .95, "YouTube": 1.15, "X": .9, "Reddit": 1.2, "Google News": .5}
TITLE_P = {"Google News": 1.12, "Reddit": 1.05, "YouTube": 1.05}

# talent, studio, roster, title, character, base monthly US posts, pull, title assoc,
# positive tone, fatigue, youth skew, country affinity, default driver, keywords, affinities, events {month_idx: event}
T = [
 ("Nicole Kidman", "Paramount Skydance", "Paramount", "Lioness", "Kaitlyn Meade", 1400, .065, .66, .60, .040, .35,
  {"UK": 1.2, "MX": .9, "BR": .8, "FR": .95}, "Performance and character arc",
  "performance; season; Kaitlyn; chemistry", "Spy drama; prestige TV; Zoe Saldaña", {4: "Trailer drop", 5: "Season premiere"}),
 ("Zoe Saldaña", "Paramount Skydance", "Paramount", "Lioness", "Joe McNamara", 1150, .072, .58, .64, .035, .45,
  {"MX": 1.3, "BR": 1.25, "FR": 1.15, "UK": .9}, "Awards momentum and role",
  "Joe; mission; action; awards", "Spy drama; Nicole Kidman; Latin talent", {4: "Trailer drop", 5: "Season premiere"}),
 ("Sylvester Stallone", "Paramount Skydance", "Paramount", "Tulsa King", "Dwight Manfredi", 1900, .085, .72, .63, .050, .25,
  {"MX": 1.4, "BR": 1.5, "UK": .8, "FR": .9}, "Character and franchise loyalty",
  "Dwight; new season; must watch; mob", "Crime drama; action; Taylor Sheridan", {3: "Trailer drop", 4: "Season premiere"}),
 ("Billy Bob Thornton", "Paramount Skydance", "Paramount", "Landman", "Tommy Norris", 1300, .080, .78, .62, .045, .20,
  {"MX": .5, "UK": .6, "BR": .4, "FR": .4}, "Character and dialogue",
  "Tommy; oil; monologue; Sheridan", "Taylor Sheridan; Western drama; Yellowstone", {5: "Trailer drop"}),
 ("Tom Hardy", "Paramount Skydance", "Paramount", "MobLand", "Harry Da Souza", 1200, .075, .55, .58, .050, .40,
  {"UK": 1.8, "FR": 1.1, "BR": .9, "MX": .8}, "Performance and crime-genre appeal",
  "Harry; gangster; London; intense", "British crime; Guy Ritchie; Helen Mirren", {1: "Renewal news"}),
 ("Jeremy Renner", "Paramount Skydance", "Paramount", "Mayor of Kingstown", "Mike McLusky", 900, .060, .62, .55, .070, .25,
  {"MX": .7, "UK": .6, "BR": .6, "FR": .5}, "Comeback story and role",
  "Mike; Kingstown; comeback; prison", "Crime drama; Marvel; Taylor Sheridan", {2: "Season premiere"}),
 ("Pedro Pascal", "Multi-studio", "Other studios", "Multiple titles", "Multiple roles", 2000, .105, .36, .67, .060, .55,
  {"MX": 1.5, "BR": 1.4, "UK": 1.0, "FR": .9}, "Casting and cultural visibility",
  "casting; favorite actor; next project; internet daddy", "Prestige drama; franchise fandom; The Last of Us", {2: "Casting news"}),
 ("Jenna Ortega", "Netflix", "Other studios", "Wednesday", "Wednesday Addams", 2100, .090, .70, .66, .045, .80,
  {"MX": 1.6, "BR": 1.5, "UK": 1.0, "FR": 1.0}, "Character and fandom edits",
  "Wednesday; dance; Tim Burton; edits", "Gothic comedy; Tim Burton; teen fandom", {4: "Season announcement"}),
 ("Zendaya", "HBO", "Other studios", "Euphoria", "Rue Bennett", 2300, .080, .52, .65, .050, .85,
  {"BR": 1.4, "FR": 1.2, "MX": 1.2, "UK": 1.1}, "Fashion and cultural visibility",
  "Rue; red carpet; fashion; Tom Holland", "Gen Z drama; fashion; Spider-Man", {0: "Season finale"}),
 ("Timothée Chalamet", "A24", "Other studios", "Marty Supreme", "Marty Mauser", 1700, .070, .45, .60, .085, .70,
  {"FR": 1.7, "UK": 1.1, "MX": .9, "BR": .8}, "Personal brand and press tour",
  "Marty; ping pong; Oscars; press tour", "Auteur cinema; A24; fashion", {}),
 ("Ryan Gosling", "Amazon MGM", "Other studios", "Project Hail Mary", "Ryland Grace", 1500, .075, .50, .70, .040, .45,
  {"UK": 1.1, "BR": 1.1, "MX": .9, "FR": .9}, "Performance and humor",
  "Rocky; space; funny; Ken", "Sci-fi; Barbie; feel-good blockbusters", {1: "Streaming release"}),
 ("Millie Bobby Brown", "Netflix", "Other studios", "Stranger Things", "Eleven", 1900, .075, .62, .63, .060, .85,
  {"BR": 1.4, "MX": 1.3, "UK": 1.1, "FR": 1.0}, "Franchise nostalgia and fandom",
  "Eleven; Hawkins; finale; nostalgia", "80s nostalgia; teen fandom; Netflix originals", {}),
 ("Bella Ramsey", "HBO", "Other studios", "The Last of Us", "Ellie", 1100, .070, .68, .60, .070, .70,
  {"UK": 1.4, "BR": 1.2, "MX": 1.0, "FR": .9}, "Character and casting debate",
  "Ellie; season; game adaptation; casting", "Video game adaptations; Pedro Pascal; prestige TV", {3: "Casting news"}),
 ("Reese Witherspoon", "Apple TV+", "Other studios", "The Morning Show", "Bradley Jackson", 900, .060, .58, .62, .050, .25,
  {"UK": .9, "MX": .6, "BR": .7, "FR": .6}, "Producer brand and book club",
  "Bradley; newsroom; book club; producer", "Jennifer Aniston; workplace drama; book adaptations", {}),
 ("Alan Ritchson", "Amazon MGM", "Other studios", "Reacher", "Jack Reacher", 1400, .085, .80, .64, .035, .35,
  {"BR": 1.2, "MX": 1.1, "UK": 1.0, "FR": .8}, "Action and physicality",
  "Reacher; fight scenes; season; Lee Child", "Action TV; book adaptations; Prime Video", {5: "Trailer drop"}),
 ("Jennifer Aniston", "Apple TV+", "Other studios", "The Morning Show", "Alex Levy", 1000, .055, .60, .58, .060, .20,
  {"UK": .9, "MX": .7, "BR": .9, "FR": .6}, "Nostalgia and personal news",
  "Alex; Friends; newsroom; Reese", "Friends; workplace drama; Reese Witherspoon", {}),
]
EVENT_DRIVER = {"Trailer drop": "Trailer and new-season anticipation", "Season premiere": "Premiere and episode reactions",
                "Renewal news": "Renewal announcement", "Casting news": "Casting announcement",
                "Season announcement": "New-season announcement", "Season finale": "Finale reactions",
                "Streaming release": "Streaming release"}
EVENT_MULT = {"Trailer drop": 1.55, "Season premiere": 2.1, "Renewal news": 1.35, "Casting news": 1.7,
              "Season announcement": 1.45, "Season finale": 1.9, "Streaming release": 1.6}

def j(x, s):  # multiplicative jitter
    return x * random.uniform(1 - s, 1 + s)

matrix, context, events, talents, agg = [], [], [], [], {}
for (name, studio, roster, title, char, base, pull, tassoc, pos, fat, youth, aff, driver, kw, affin, ev) in T:
    talents.append({"talent": name, "studio": studio, "roster": roster, "title": title, "character": char})
    for mi, ev_name in ev.items():
        events.append({"period": MONTHS[mi], "talent": name, "title": title, "event": ev_name})
    walk = [1.0]
    for _ in MONTHS[1:]:
        walk.append(walk[-1] * random.uniform(.9, 1.1))
    for c, cw in COUNTRIES.items():
        ca = aff.get(c, 1.0)
        for mi, m in enumerate(MONTHS):
            e = ev.get(mi)
            emult = j(EVENT_MULT[e], .15) if e else 1.0
            # after-glow the month following an event
            if not e and ev.get(mi - 1):
                emult = 1.2
            total = base * cw * ca * walk[mi] * emult
            wts = {}
            for p in PLATFORMS:
                w = P_BASE[p] * P_COUNTRY[c].get(p, 1.0)
                if p == "TikTok": w *= 1 + youth
                if p == "Facebook": w *= 1.4 - youth * .8
                if p == "Google News": w *= 1.2 - youth * .4 + (.4 if e in ("Casting news", "Renewal news", "Season announcement") else 0)
                if p == "Reddit": w *= .6 + youth * .6
                wts[p] = j(w, .12)
            sw = sum(wts.values())
            pull_m = pull * (1.25 if e else 1) * j(1, .08) * (1.08 if ca > 1.2 else 1)
            pos_m = pos + random.uniform(-.03, .03) + (.03 if e else 0) + (.03 if ca > 1.2 else 0)
            fat_m = fat * j(1, .2) * (1.4 if (c == "US" and name in ("Timothée Chalamet", "Pedro Pascal", "Jennifer Aniston")) else 1)
            for p in PLATFORMS:
                n = max(0, round(total * wts[p] / sw * j(1, .1)))
                if n == 0:
                    continue
                vp = round(n * VIEW_COV[p] * j(1, .03)) if VIEW_COV[p] else 0
                vp = min(vp, n)
                views = round(vp * VIEWS_PER_POST[p] * j(1, .25) * (1 + youth * .5 if p in ("TikTok", "Instagram") else 1)) if vp else 0
                if p in ENG_PER_1K:
                    eng = views * ENG_PER_1K[p] / 1000 * j(1, .15)
                    if vp < n:  # posts without views still get public engagement
                        eng += (n - vp) * 18 * j(1, .2)
                elif p == "Reddit":
                    eng = n * 52 * j(1, .2)
                else:
                    eng = 0
                lk, cm = (.62, .23) if p in ("Reddit", "YouTube") else (.78, .09)
                likes, comments = round(eng * lk), round(eng * cm)
                shares = round(eng) - likes - comments if eng else 0
                pr = min(.35, pull_m * PULL_P[p] * j(1, .1))
                pl = round(n * pr)
                wants = round(n * j(.17 + (.03 if e else 0), .12) * (1.1 if p == "YouTube" else 1))
                rec = round(n * j(.13, .12) * (1.35 if p == "Reddit" else 1) * (.5 if p == "Google News" else 1))
                fan = round(n * j(.26 + youth * .06, .1) * (1.15 if p in ("TikTok", "Instagram") else 1) * (.3 if p == "Google News" else 1))
                fatg = round(n * min(.2, fat_m * (1.3 if p in ("X", "Reddit") else 1)))
                other = max(0, n - wants - rec - fan - fatg)
                pt = min(.85, pos_m * (.8 if p == "Google News" else 1) * (.92 if p == "X" else 1))
                ng = min(.3, (1 - pos_m) * .28 * (1.35 if p == "X" else 1) * (1 + fat_m * 3))
                npos, nneg = round(n * pt), round(n * ng)
                nneu = n - npos - nneg
                ta = round(n * min(.95, tassoc * TITLE_P.get(p, 1) * j(1, .06) * (1.08 if e else 1)))
                row = {"period": m, "country": c, "talent": name, "studio": studio, "roster": roster, "title": title,
                       "platform": p, "posts": n, "authors": round(n * random.uniform(.62, .8)),
                       "views": views, "posts_with_views": vp, "likes": likes, "comments": comments, "shares": shares,
                       "engagement": likes + comments + shares, "country_attributed": round(n * random.uniform(.88, .96)),
                       "pull_posts": pl, "wants_to_watch": wants, "recommends": rec, "fan_advocacy": fan,
                       "fatigue": fatg, "other_intent": other, "positive": npos, "neutral": nneu, "negative": nneg,
                       "title_assoc": ta}
                matrix.append(row)
                a = agg.setdefault((m, c, name), {"posts": 0, "pull": 0, "ta": 0, "fat": 0})
                a["posts"] += n; a["pull"] += pl; a["ta"] += ta; a["fat"] += fatg
            context.append({"period": m, "country": c, "talent": name, "title": title, "character": char,
                            "top_driver": EVENT_DRIVER[e] if e else driver, "event": e or "",
                            "event_response": round((emult - 1) * 100 * j(1, .15)) if e else None,
                            "keywords": kw, "affinities": affin})

# market-specific analyst readouts, written from the simulated numbers by rule
names = [t[0] for t in T]
for ctx in context:
    m, c, name = ctx["period"], ctx["country"], ctx["talent"]
    a = agg[(m, c, name)]
    pr, ta, ft = a["pull"] / a["posts"], a["ta"] / a["posts"], a["fat"] / a["posts"]
    prev = agg.get((MONTHS[MONTHS.index(m) - 1], c, name)) if m != MONTHS[0] else None
    mom = (a["posts"] / prev["posts"] - 1) if prev else None
    ranks = sorted(names, key=lambda x: -agg[(m, c, x)]["pull"] / agg[(m, c, x)]["posts"])
    rk = ranks.index(name) + 1
    title = ctx["title"] if ctx["title"] != "Multiple titles" else "any single title"
    if rk <= 3 and ta >= .6:
        s = f"#{rk} talent pull in {c} with strong title transfer to {title} ({ta:.0%}). Lead with cast-led creative."
    elif rk <= 3:
        s = f"#{rk} talent pull in {c}, but only {ta:.0%} of conversation links to {title}: fandom is about the person. Pair talent with title-specific hooks."
    elif ft >= .07:
        s = f"Fatigue signals at {ft:.0%} in {c}. Watch for overexposure before adding talent-led placements."
    elif ctx["event"] and mom is not None and mom > .3:
        s = f"Conversation up {mom:.0%} MoM around the {ctx['event'].lower()}. Capitalize while attention is elevated."
    elif mom is not None and mom < -.15:
        s = f"Conversation cooling ({mom:.0%} MoM) in {c}. Hold talent-led spend until the next tentpole."
    elif ta >= .6:
        s = f"Steady conversation with solid title association ({ta:.0%}). Keep {name.split()[-1]} visible in always-on {title} creative."
    else:
        s = f"Mid-pack talent pull (#{rk} of {len(names)}) and {ta:.0%} title association in {c}. Test talent-led vs. title-led creative."
    ctx["readout"] = s

# post-level sample, proportional to the matrix
EX = {
 "en": {"Wants to watch": "Starting {t} tonight just because {f} is in it.", "Recommends": "If you haven't watched {t}, do it. {f} carries every scene.",
        "Fan / advocacy": "{f} is the best thing on screen right now.", "Fatigue / rejection": "Honestly a bit tired of seeing {f} everywhere.",
        "Discusses performance": "Thread on {f}'s choices as {c} in {t}."},
 "es": {"Wants to watch": "Voy a empezar {t} solo por {f}.", "Recommends": "Si no han visto {t}, véanla. {f} está increíble.",
        "Fan / advocacy": "{f} es lo mejor que hay en pantalla ahora.", "Fatigue / rejection": "Ya me cansé de ver a {f} en todos lados.",
        "Discusses performance": "Hablemos de {f} como {c} en {t}."},
 "pt": {"Wants to watch": "Vou começar {t} só por causa de {f}.", "Recommends": "Se você não viu {t}, assista. {f} está demais.",
        "Fan / advocacy": "{f} é a melhor coisa na tela agora.", "Fatigue / rejection": "Cansei de ver {f} em todo lugar.",
        "Discusses performance": "Vamos falar de {f} como {c} em {t}."},
 "fr": {"Wants to watch": "Je commence {t} ce soir juste pour {f}.", "Recommends": "Regardez {t}, {f} est incroyable.",
        "Fan / advocacy": "{f} est ce qu'il y a de mieux à l'écran en ce moment.", "Fatigue / rejection": "Un peu fatigué de voir {f} partout.",
        "Discusses performance": "Parlons de {f} dans le rôle de {c} dans {t}."},
}
BASIS = ["Public location + language + local context", "Local creator/media + language signals", "Declared location + language"]
posts, k = [], 0
tinfo = {t[0]: t for t in T}
by_cell = {}
for r in matrix:
    by_cell.setdefault((r["period"], r["country"], r["talent"]), []).append(r)
for (m, c, name), rows in by_cell.items():
    for _ in range(2):
        r = random.choices(rows, weights=[x["posts"] for x in rows])[0]
        p, n = r["platform"], r["posts"]
        intent = random.choices(["Wants to watch", "Recommends", "Fan / advocacy", "Fatigue / rejection", "Discusses performance"],
                                weights=[r["wants_to_watch"], r["recommends"], r["fan_advocacy"], r["fatigue"], r["other_intent"]])[0]
        tone = random.choices(["Positive", "Neutral", "Negative"], weights=[r["positive"], r["neutral"], r["negative"]])[0]
        if intent == "Fatigue / rejection": tone = "Negative"
        k += 1
        y, mo = map(int, m.split("-"))
        pub = date(y, mo, random.randint(1, 28))
        has_views = random.random() < (r["posts_with_views"] / n)
        v = round(r["views"] / max(1, r["posts_with_views"]) * random.lognormvariate(0, .8)) if has_views else None
        e_post = round(r["engagement"] / n * random.lognormvariate(0, .7)) if r["engagement"] else 0
        lk = round(e_post * .78); cm = round(e_post * .1); sh = e_post - lk - cm
        t = tinfo[name]
        ctx = next(x for x in context if x["period"] == m and x["country"] == c and x["talent"] == name)
        lang = LANG[c]
        posts.append({"record_id": f"SIM-{k:04d}", "published_at": pub.isoformat(),
                      "collected_at": (pub + timedelta(days=random.randint(1, 3))).isoformat(),
                      "period": m, "platform": p, "country": c, "country_basis": random.choice(BASIS),
                      "country_confidence": round(random.uniform(.8, .97), 2), "language": lang,
                      "talent": name, "studio": t[1], "roster": t[2], "title": t[3], "character": t[4],
                      "public_url": f"https://example.invalid/public-post-{k:04d}",
                      "excerpt": "Simulated: " + EX[lang][intent].format(t=t[3], f=name.split()[0] if name != "Zendaya" else name, c=t[4]),
                      "content_type": "News article" if p == "Google News" else ("Public text post" if p in ("X", "Reddit") else "Public video/post"),
                      "views": v, "likes": lk if p != "Google News" else None, "comments": cm if p != "Google News" else None,
                      "shares": sh if p != "Google News" else None, "engagement": e_post,
                      "talent_pull": "Yes" if (intent in ("Wants to watch", "Recommends") or random.random() < .05) else "No",
                      "intent": intent, "driver": ctx["top_driver"], "tone": tone,
                      "title_association": "Yes" if random.random() < r["title_assoc"] / n else "No",
                      "event_tag": ctx["event"] or "Ongoing conversation",
                      "human_validated": "Yes" if random.random() < .35 else "No"})

meta = [{"label": "gen_talent_data.py", "value": CODE, "type": "code", "lang": "python"},
        {"label": "Input", "value": "None: simulated from parameters in the script (seed 20261123)"}]
for fname, rows in [("matrix", matrix), ("context", context), ("posts", posts), ("events", events), ("talents", talents)]:
    with open(os.path.join(OUT, fname + ".json"), "w", encoding="utf-8") as f:
        json.dump({"rows": rows, "meta": meta}, f, ensure_ascii=False, separators=(",", ":"))
    print(fname, len(rows), os.path.getsize(os.path.join(OUT, fname + ".json")))
