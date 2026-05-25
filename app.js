/* SHIPYARD — simple live view of the autonomous outreach machine.
   Runs on a realistic simulation so it's alive on first open.
   Swap genCreator() + tick() for real ScrapeCreators / Claude / Instantly
   calls and the same screen runs on real data. */

(() => {
  "use strict";

  const FUNNEL = [
    { key: "found",    emoji: "🔍", label: "Creators found",  sub: "scanning Notion hashtags",     color: "#5eead4" },
    { key: "messaged", emoji: "✉️", label: "Messages sent",   sub: "a personalized pitch to each", color: "#818cf8" },
    { key: "replied",  emoji: "💬", label: "Replied",         sub: "interested creators",          color: "#fbbf24" },
    { key: "booked",   emoji: "📞", label: "Calls booked",    sub: "on the calendar",              color: "#f472b6" },
    { key: "signed",   emoji: "🤝", label: "Signed",          sub: "paying clients",               color: "#4ade80" },
  ];

  const NICHES = ["Notion templates", "productivity", "study systems", "second brain", "digital planning"];
  const A = ["notion", "focus", "study", "deep", "calm", "daily", "minimal", "second", "build", "flow", "the", "atomic", "quiet"];
  const B = ["systems", "withpaige", "desk", "work", "brain", "habits", "method", "studio", "labs", "routine", "notes", "ritual"];

  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const fmt = (x) => x.toLocaleString("en-US");
  const handle = () => `${pick(A)}${pick(B)}${Math.random() < 0.3 ? rnd(1, 99) : ""}`;

  // counts (seeded so it looks like it's already been running)
  const n = {
    found: rnd(210, 280),
    messaged: rnd(120, 150),
    replied: rnd(30, 45),
    booked: rnd(7, 12),
    signed: rnd(2, 4),
  };

  const start = Date.now();

  // ---- FUNNEL ----
  const funnelEl = document.getElementById("funnel");
  funnelEl.innerHTML = FUNNEL.map(s => `
    <div class="step" style="--c:${s.color}">
      <div class="step-emoji">${s.emoji}</div>
      <div class="step-main">
        <div class="step-label">${s.label}</div>
        <div class="step-sub">${s.sub}</div>
      </div>
      <div class="step-num" id="num-${s.key}">0</div>
    </div>`).join("");

  function paint(key) {
    const el = document.getElementById("num-" + key);
    if (!el) return;
    el.textContent = fmt(n[key]);
  }
  FUNNEL.forEach(s => { document.getElementById("num-" + s.key).textContent = fmt(n[s.key]); });

  // ---- FEED ----
  const feedEl = document.getElementById("feed");
  function say(emoji, html) {
    const div = document.createElement("div");
    div.className = "feed-item";
    div.innerHTML = `<div class="fi-emoji">${emoji}</div><div class="fi-text">${html}</div>`;
    feedEl.prepend(div);
    while (feedEl.children.length > 12) feedEl.removeChild(feedEl.lastChild);
  }

  // seed a few feed lines
  say("✉️", `Sent a pitch to <span class="hl">@${handle()}</span>`);
  say("💬", `<span class="hl">@${handle()}</span> <b>replied</b> — wants to hear more`);
  say("🔍", `Found <span class="hl">@${handle()}</span> · ${fmt(rnd(1, 50))}k followers`);

  // ---- THE MACHINE (one simple step every few seconds) ----
  function tick() {
    const roll = Math.random();
    const h = handle();

    if (roll < 0.42) {
      n.found++; paint("found");
      say("🔍", `Found <span class="hl">@${h}</span> · ${fmt(rnd(1, 50))}k followers · ${pick(NICHES)}`);
    } else if (roll < 0.74) {
      n.messaged++; paint("messaged");
      say("✉️", `Sent a personalized pitch to <span class="hl">@${h}</span>`);
    } else if (roll < 0.9) {
      n.replied++; paint("replied");
      say("💬", `<span class="hl">@${h}</span> <b>replied</b> 🔥 — interested`);
    } else if (roll < 0.97) {
      n.booked++; paint("booked");
      say("📞", `Booked a call with <span class="hl">@${h}</span> — Calendly sent`);
    } else {
      n.signed++; paint("signed");
      say("🤝", `<b>New client!</b> <span class="hl">@${h}</span> just signed`);
    }
  }

  // ---- UPTIME ----
  const upEl = document.getElementById("uptime");
  function uptime() {
    const mins = Math.floor((Date.now() - start) / 60000);
    const h = Math.floor(mins / 60), m = mins % 60;
    upEl.textContent = mins < 1 ? "running" : "running " + (h ? h + "h " : "") + m + "m";
  }

  uptime();
  setInterval(tick, 10000);
  setInterval(uptime, 30000);
})();
