/* SHIPYARD — autonomous creator outreach engine (live simulation)
   Self-contained. Seeded with realistic productivity/Notion creators.
   The data layer is intentionally swappable: replace genCreator() + the
   advance() loop with calls to ScrapeCreators / Claude / Instantly APIs
   and the same UI runs on real data. See README. */

(() => {
  "use strict";

  // ---- CONFIG ----------------------------------------------------------
  const STAGES = [
    { id: "scraped",  name: "Scraped",  color: "#5eead4" },
    { id: "scored",   name: "Scored",   color: "#818cf8" },
    { id: "outreach", name: "Outreach", color: "#fbbf24" },
    { id: "replied",  name: "Replied",  color: "#f472b6" },
    { id: "booked",   name: "Booked",   color: "#4ade80" },
    { id: "closed",   name: "Closed",   color: "#34d399" },
  ];

  const AGENTS = [
    { id: "discovery",  name: "Discovery Agent",  icon: "🔭", task: "scanning #notiontemplate", count: 0 },
    { id: "enrichment", name: "Enrichment Agent", icon: "🧠", task: "scoring product fit",       count: 0 },
    { id: "writer",     name: "Writer Agent",     icon: "✍️", task: "drafting pitches",          count: 0 },
    { id: "sender",     name: "Sender Agent",     icon: "📨", task: "queuing outreach",          count: 0 },
    { id: "reply",      name: "Reply Agent",      icon: "💬", task: "watching inbox",            count: 0 },
  ];

  const NICHES = ["Notion templates", "Productivity", "Study systems", "Second brain", "Digital planning", "Time blocking", "PKM / note-taking", "Solopreneur tools"];
  const PLATFORMS = [{ k: "Instagram", i: "◆" }, { k: "TikTok", i: "♪" }, { k: "YouTube", i: "▶" }, { k: "X", i: "𝕏" }];
  const HANDLE_A = ["notion", "focus", "study", "deep", "calm", "daily", "minimal", "second", "build", "flow", "clear", "the", "mindful", "atomic", "quiet"];
  const HANDLE_B = ["systems", "withpaige", "desk", "work", "brain", "habits", "method", "studio", "labs", "routine", "stack", "notes", "academy", "ritual", "ops"];
  const PRODUCTS = [
    { type: "Notion second-brain template", price: 49 },
    { type: "Student productivity OS", price: 39 },
    { type: "Content calendar template", price: 27 },
    { type: "Habit + goal tracker pack", price: 35 },
    { type: "Freelancer client dashboard", price: 79 },
    { type: "Notion finance tracker", price: 45 },
    { type: "Weekly planning system", price: 29 },
    { type: "Digital course: Notion mastery", price: 97 },
  ];
  const AVATAR_GRADS = [
    "linear-gradient(135deg,#5eead4,#818cf8)",
    "linear-gradient(135deg,#fbbf24,#f472b6)",
    "linear-gradient(135deg,#4ade80,#5eead4)",
    "linear-gradient(135deg,#818cf8,#f472b6)",
    "linear-gradient(135deg,#f472b6,#fbbf24)",
    "linear-gradient(135deg,#34d399,#818cf8)",
  ];

  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const fmt = (n) => n.toLocaleString("en-US");

  // ---- STATE -----------------------------------------------------------
  const state = {
    creators: [],
    feed: [],
    totals: { sent: 0, replied: 0, booked: 0, closed: 0, value: 0 },
    chart: Array.from({ length: 14 }, () => rnd(8, 34)),
    start: Date.now(),
    seq: 0,
  };

  function hook(c) {
    const opts = [
      `Saw your "${pick(["my Notion setup", "how I plan my week", "desk tour", "study with me", "second brain build"])}" post — your comments are full of people asking for the template. That's a product.`,
      `Your audience keeps asking "${pick(["what template is that?", "can you share this?", "is this for sale?"])}" — they're ready to buy, you just haven't built it yet.`,
      `${fmt(c.followers)} followers in ${c.niche.toLowerCase()} and nothing to sell them? Your engaged audience is leaving money on the table.`,
      `Loved your breakdown of ${c.niche.toLowerCase()}. We package exactly this into a ${c.product.type.toLowerCase()} — built with AI, launched in under 2 weeks.`,
    ];
    return pick(opts);
  }

  function genCreator() {
    const handle = `${pick(HANDLE_A)}${pick(HANDLE_B)}${Math.random() < 0.3 ? rnd(1, 99) : ""}`;
    const followers = rnd(1, 50) * 1000 + rnd(0, 999);
    const product = pick(PRODUCTS);
    const c = {
      id: ++state.seq,
      handle,
      platform: pick(PLATFORMS),
      followers,
      niche: pick(NICHES),
      engagement: (Math.random() * 6 + 2).toFixed(1),
      product,
      score: 0,
      hookText: "",
      message: "",
      hasEmail: Math.random() < 0.55,
      stage: "scraped",
      grad: pick(AVATAR_GRADS),
      born: Date.now(),
    };
    return c;
  }

  function buildMessage(c) {
    return `Hey ${c.handle} 👋\n\n${c.hookText}\n\nWe're a small studio that builds & launches digital products for creators — we'd handle the whole ${c.product.type.toLowerCase()} build, you just promote it to your audience. Rev share, no upfront risk.\n\nWorth a quick 15-min call this week?\n\n— Shadow OS`;
  }

  // ---- FEED ------------------------------------------------------------
  const feedEl = document.getElementById("feed");
  function logFeed(kind, icon, html) {
    const item = { kind, icon, html, t: Date.now() };
    state.feed.unshift(item);
    if (state.feed.length > 60) state.feed.pop();
    const div = document.createElement("div");
    div.className = `feed-item k-${kind}`;
    div.innerHTML = `<div class="fi-icon">${icon}</div><div class="fi-body"><div class="fi-text">${html}</div><div class="fi-time">just now</div></div>`;
    feedEl.prepend(div);
    while (feedEl.children.length > 40) feedEl.removeChild(feedEl.lastChild);
    // refresh relative times
    [...feedEl.children].forEach((el, i) => {
      const time = state.feed[i] ? rel(state.feed[i].t) : "";
      const tEl = el.querySelector(".fi-time");
      if (tEl) tEl.textContent = time;
    });
  }
  function rel(t) {
    const s = Math.floor((Date.now() - t) / 1000);
    if (s < 3) return "just now";
    if (s < 60) return s + "s ago";
    const m = Math.floor(s / 60);
    if (m < 60) return m + "m ago";
    return Math.floor(m / 60) + "h ago";
  }

  // ---- AGENT RENDER ----------------------------------------------------
  const agentsEl = document.getElementById("agents");
  function renderAgents() {
    agentsEl.innerHTML = AGENTS.map(a => `
      <div class="agent ${a.working ? "working" : "idle"}" data-a="${a.id}">
        <div class="agent-icon">${a.icon}</div>
        <div class="agent-main">
          <div class="agent-name">${a.name}</div>
          <div class="agent-task">${a.task}</div>
        </div>
        <div class="agent-stat">
          <div class="agent-count">${fmt(a.count)}</div>
          <div class="agent-state">${a.working ? "working" : "idle"}</div>
        </div>
      </div>`).join("");
  }
  function fireAgent(id, task) {
    const a = AGENTS.find(x => x.id === id);
    if (!a) return;
    a.count++; a.working = true; if (task) a.task = task;
    renderAgents();
    clearTimeout(a._t);
    a._t = setTimeout(() => { a.working = false; renderAgents(); }, 1400);
  }

  // ---- BOARD -----------------------------------------------------------
  const boardEl = document.getElementById("board");
  function scoreClass(s) { return s >= 7 ? "hi" : s >= 5 ? "mid" : "lo"; }
  function initials(h) { return h.replace(/[0-9]/g, "").slice(0, 2).toUpperCase(); }

  function renderBoard() {
    boardEl.innerHTML = STAGES.map(st => {
      const cards = state.creators.filter(c => c.stage === st.id).slice(-12).reverse();
      return `
        <div class="lane">
          <div class="lane-head">
            <span class="lane-name"><span class="lane-dot" style="background:${st.color}"></span>${st.name}</span>
            <span class="lane-count">${state.creators.filter(c => c.stage === st.id).length}</span>
          </div>
          <div class="lane-cards">
            ${cards.map(c => cardHTML(c)).join("")}
          </div>
        </div>`;
    }).join("");
    boardEl.querySelectorAll(".card").forEach(el => {
      el.addEventListener("click", () => openDrawer(+el.dataset.id));
    });
    document.getElementById("pipeline-count").textContent = state.creators.length + " creators";
  }
  function cardHTML(c) {
    const scoreBadge = c.score ? `<span class="score ${scoreClass(c.score)}">${c.score}/10</span>` : `<span class="score lo">—</span>`;
    return `
      <div class="card" data-id="${c.id}">
        <div class="card-top">
          <div class="avatar" style="background:${c.grad}">${initials(c.handle)}</div>
          <div style="min-width:0">
            <div class="card-handle">@${c.handle}</div>
            <div class="card-meta">${fmt(c.followers)} · ${c.engagement}%</div>
          </div>
        </div>
        <div class="card-bottom">
          <span class="platform">${c.platform.i} ${c.platform.k}</span>
          ${scoreBadge}
        </div>
      </div>`;
  }

  // ---- DRAWER ----------------------------------------------------------
  const scrim = document.getElementById("scrim");
  const drawer = document.getElementById("drawer");
  function openDrawer(id) {
    const c = state.creators.find(x => x.id === id);
    if (!c) return;
    document.getElementById("d-title").textContent = "@" + c.handle;
    const stage = STAGES.find(s => s.id === c.stage);
    document.getElementById("d-body").innerHTML = `
      <div class="d-section">
        <div class="d-label">Status</div>
        <span class="d-badge" style="background:${stage.color}22;color:${stage.color}">${stage.name}</span>
      </div>
      <div class="d-section">
        <div class="d-label">Profile</div>
        <div class="d-row"><span>Platform</span><span>${c.platform.k}</span></div>
        <div class="d-row"><span>Followers</span><span>${fmt(c.followers)}</span></div>
        <div class="d-row"><span>Engagement</span><span>${c.engagement}%</span></div>
        <div class="d-row"><span>Niche</span><span>${c.niche}</span></div>
        <div class="d-row"><span>Public email</span><span>${c.hasEmail ? "yes" : "no"}</span></div>
      </div>
      <div class="d-section">
        <div class="d-label">AI Assessment</div>
        <div class="d-row"><span>Fit score</span><span style="color:${c.score >= 7 ? "var(--green)" : "var(--amber)"}">${c.score ? c.score + "/10" : "pending"}</span></div>
        <div class="d-row"><span>Product idea</span><span>${c.product.type}</span></div>
        <div class="d-row"><span>Est. price</span><span>$${c.product.price}</span></div>
      </div>
      ${c.message ? `
      <div class="d-section">
        <div class="d-label">Generated Outreach</div>
        <div class="d-message">${c.message.replace(/</g, "&lt;")}</div>
      </div>` : `
      <div class="d-section">
        <div class="d-label">Outreach</div>
        <div class="d-message" style="color:var(--txt-3)">Message not yet generated — creator still moving through scoring.</div>
      </div>`}
    `;
    scrim.classList.add("open");
    drawer.classList.add("open");
  }
  function closeDrawer() { scrim.classList.remove("open"); drawer.classList.remove("open"); }
  scrim.addEventListener("click", closeDrawer);
  document.getElementById("d-close").addEventListener("click", closeDrawer);

  // ---- STATS -----------------------------------------------------------
  function setStat(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.textContent !== String(val)) {
      el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
    }
    el.innerHTML = val;
  }
  function renderStats() {
    const inPipe = state.creators.filter(c => !["closed"].includes(c.stage)).length;
    const replyRate = state.totals.sent ? Math.round((state.totals.replied / state.totals.sent) * 100) : 0;
    setStat("s-pipeline", fmt(inPipe));
    setStat("s-sent", fmt(state.totals.sent));
    setStat("s-reply", replyRate + '<span class="unit">%</span>');
    setStat("s-booked", fmt(state.totals.booked));
    setStat("s-value", "$" + fmt(state.totals.value));
    document.getElementById("s-pipeline-trend").textContent = state.creators.length + " total scraped";
    document.getElementById("s-booked-trend").textContent = state.totals.closed + " closed";
  }

  // ---- CHART -----------------------------------------------------------
  const chartEl = document.getElementById("chart");
  function renderChart() {
    const max = Math.max(...state.chart, 1);
    chartEl.innerHTML = state.chart.map(v =>
      `<div class="bar" style="height:${(v / max) * 100}%"><span class="bar-val">${v}</span></div>`).join("");
    document.getElementById("chart-total").textContent = fmt(state.chart.reduce((a, b) => a + b, 0)) + " sent";
  }

  // ---- PIPELINE ENGINE -------------------------------------------------
  // Each tick: progress some creators one stage forward + occasionally scrape new ones.
  function advance() {
    // 1) Discovery: scrape new creators
    if (Math.random() < 0.7 || state.creators.length < 20) {
      const c = genCreator();
      state.creators.push(c);
      fireAgent("discovery", `found @${c.handle}`);
      logFeed("discovery", "🔭", `<b>Discovery</b> found <span class="hl">@${c.handle}</span> · ${fmt(c.followers)} followers · ${c.niche}`);
    }

    // 2) Score scraped -> scored
    const toScore = state.creators.find(c => c.stage === "scraped");
    if (toScore) {
      toScore.score = rnd(4, 10);
      toScore.hookText = hook(toScore);
      toScore.stage = "scored";
      fireAgent("enrichment", `scored @${toScore.handle} ${toScore.score}/10`);
      logFeed("score", "🧠", `<b>Enrichment</b> scored <span class="hl">@${toScore.handle}</span> → <b>${toScore.score}/10</b> · ${toScore.product.type}`);
    }

    // 3) Scored(>=7) -> write message -> outreach.  Low scores get parked (stay scored).
    const toWrite = state.creators.find(c => c.stage === "scored" && c.score >= 7);
    if (toWrite) {
      toWrite.message = buildMessage(toWrite);
      toWrite.stage = "outreach";
      state.totals.sent++;
      state.chart[state.chart.length - 1]++;
      fireAgent("writer", `wrote pitch @${toWrite.handle}`);
      fireAgent("sender", `sent ${toWrite.hasEmail ? "email" : "DM"} @${toWrite.handle}`);
      const ch = toWrite.hasEmail ? "email" : "DM";
      logFeed("write", "✍️", `<b>Writer</b> drafted a personalized pitch for <span class="hl">@${toWrite.handle}</span>`);
      logFeed("send", "📨", `<b>Sender</b> sent ${ch} to <span class="hl">@${toWrite.handle}</span>`);
    }

    // 4) Outreach -> replied (~28% of the time)
    const waiting = state.creators.filter(c => c.stage === "outreach");
    waiting.forEach(c => {
      if (!c._replyRoll && Math.random() < 0.10) {
        c._replyRoll = true;
        if (Math.random() < 0.28) {
          c.stage = "replied";
          state.totals.replied++;
          fireAgent("reply", `reply from @${c.handle}`);
          logFeed("reply", "💬", `<span class="hl">@${c.handle}</span> <b>replied</b> 🔥 — Reply Agent flagged as interested`);
        } else {
          c._replyRoll = false; // remains in outreach; follow-up sequence continues
        }
      }
    });

    // 5) Replied -> booked (~45%)
    const replied = state.creators.find(c => c.stage === "replied" && !c._bookRoll);
    if (replied) {
      replied._bookRoll = true;
      if (Math.random() < 0.5) {
        replied.stage = "booked";
        state.totals.booked++;
        fireAgent("reply", `booked call @${replied.handle}`);
        logFeed("book", "📅", `Call <b>booked</b> with <span class="hl">@${replied.handle}</span> — Calendly link sent automatically`);
      }
    }

    // 6) Booked -> closed (~35%)
    const booked = state.creators.find(c => c.stage === "booked" && !c._closeRoll);
    if (booked) {
      booked._closeRoll = true;
      if (Math.random() < 0.4) {
        booked.stage = "closed";
        state.totals.closed++;
        state.totals.value += booked.product.price * rnd(20, 140); // est. lifetime rev share
        logFeed("book", "🤝", `<b>CLOSED</b> — <span class="hl">@${booked.handle}</span> signed · ${booked.product.type}`);
      }
    }

    renderBoard();
    renderStats();
    renderChart();
  }

  // ---- SEED ------------------------------------------------------------
  function seed() {
    // Pre-populate so the board looks alive on first paint.
    for (let i = 0; i < 46; i++) {
      const c = genCreator();
      const r = Math.random();
      if (r < 0.18) { c.stage = "scraped"; }
      else if (r < 0.40) { c.score = rnd(4, 10); c.hookText = hook(c); c.stage = "scored"; }
      else if (r < 0.66) { c.score = rnd(7, 10); c.hookText = hook(c); c.message = buildMessage(c); c.stage = "outreach"; state.totals.sent++; }
      else if (r < 0.82) { c.score = rnd(7, 10); c.hookText = hook(c); c.message = buildMessage(c); c.stage = "replied"; state.totals.sent++; state.totals.replied++; }
      else if (r < 0.93) { c.score = rnd(8, 10); c.hookText = hook(c); c.message = buildMessage(c); c.stage = "booked"; state.totals.sent++; state.totals.replied++; state.totals.booked++; }
      else { c.score = rnd(8, 10); c.hookText = hook(c); c.message = buildMessage(c); c.stage = "closed"; state.totals.sent++; state.totals.replied++; state.totals.booked++; state.totals.closed++; state.totals.value += c.product.price * rnd(40, 140); }
      AGENTS.find(a => a.id === "discovery").count++;
      state.creators.push(c);
    }
    AGENTS.find(a => a.id === "enrichment").count = state.creators.filter(c => c.score).length;
    AGENTS.find(a => a.id === "writer").count = state.creators.filter(c => c.message).length;
    AGENTS.find(a => a.id === "sender").count = state.totals.sent;
    AGENTS.find(a => a.id === "reply").count = state.totals.replied + state.totals.booked;
  }

  // ---- CLOCK / UPTIME --------------------------------------------------
  function tickClock() {
    const d = new Date();
    document.getElementById("clock").textContent = d.toLocaleTimeString("en-US", { hour12: false });
    const up = Math.floor((Date.now() - state.start) / 1000);
    const h = Math.floor(up / 3600), m = Math.floor((up % 3600) / 60), s = up % 60;
    document.getElementById("foot-uptime").textContent = `uptime ${h ? h + "h " : ""}${m ? m + "m " : ""}${s}s`;
  }

  // ---- BOOT ------------------------------------------------------------
  seed();
  renderAgents();
  renderBoard();
  renderStats();
  renderChart();
  tickClock();

  // initial feed entries
  logFeed("send", "📨", `<b>Sender</b> dispatched morning outreach batch · ${rnd(40, 70)} creators`);
  logFeed("reply", "💬", `Reply Agent monitoring <b>${state.totals.sent}</b> open conversations`);

  setInterval(advance, 2600);
  setInterval(tickClock, 1000);
  setInterval(() => { // roll chart day forward occasionally
    if (Math.random() < 0.02) { state.chart.shift(); state.chart.push(rnd(6, 20)); renderChart(); }
  }, 5000);

  // keyboard: esc closes drawer
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeDrawer(); });
})();
