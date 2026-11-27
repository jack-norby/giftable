/* Giftable — family Christmas wish lists */
(() => {
  "use strict";

  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------
  const CATEGORIES = [
    { id: "beauty", name: "Beauty & body", emoji: "🧴", ex: "Unscented body lotion" },
    { id: "books", name: "Books", emoji: "📚", ex: "The latest by a favorite author" },
    { id: "games", name: "Games", emoji: "🎲", ex: "Board game or video game" },
    { id: "clothing", name: "Clothing", emoji: "🧥", sized: true, ex: "Flannel shirt", exSize: "M", exColor: "Forest green" },
    { id: "shoes", name: "Shoes", emoji: "👟", sized: true, ex: "Running shoes", exSize: "9.5 women's", exColor: "White / grey" },
    { id: "essentials", name: "Essentials", emoji: "🧦", sized: true, hint: "Underwear, socks, hats, gloves, winter coats", ex: "Wool socks", exSize: "L", exColor: "Any neutral" },
    { id: "snacks", name: "Favorite snacks", emoji: "🍿", ex: "Dark chocolate sea salt almonds" },
    { id: "drinks", name: "Favorite drinks", emoji: "☕", ex: "Local coffee beans, medium roast" },
    { id: "home", name: "Home appliances", emoji: "🏠", ex: "Air fryer" },
    { id: "decor", name: "Decorations", emoji: "🎄", ex: "Ornaments for the tree" },
    { id: "giftcards", name: "Gift cards", emoji: "💳", ex: "Target, Starbucks, Amazon…" },
    { id: "experiences", name: "Experiences", emoji: "🎟️", ex: "Concert tickets, a cooking class, a massage" },
    { id: "charities", name: "Charities", emoji: "💝", charity: true, ex: "Local animal shelter" },
    { id: "other", name: "Anything else", emoji: "✨", ex: "Something that doesn't fit anywhere else" },
  ];
  const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
  const PRIORITIES = [
    ["love", "Really want"],
    ["like", "Would like"],
    ["nice", "Nice to have"],
  ];
  const PRIORITY_RANK = { love: 0, like: 1, nice: 2 };
  const SIZE_FIELDS = [
    ["tops", "Tops / shirts"],
    ["bottoms", "Pants / jeans"],
    ["dress", "Dresses"],
    ["shoes", "Shoes"],
    ["coat", "Coat / jacket"],
    ["underwear", "Underwear / bra"],
    ["socks", "Socks"],
    ["hat", "Hats & gloves"],
  ];
  const AVATAR_COLORS = ["#1f4d3a", "#b3263e", "#a8841a", "#3c5a8a", "#6b4c8a", "#2f7a78"];
  const KNOWN_COLORS = {
    sage: "#9caf88", "sage green": "#9caf88", burgundy: "#800020", mauve: "#b784a7", emerald: "#50c878",
    mustard: "#e1ad01", blush: "#de98ab", "blush pink": "#de98ab", cream: "#fffdd0", rust: "#b7410e",
    mint: "#98ff98", charcoal: "#36454f", "hunter green": "#355e3b", "forest green": "#228b22",
    "navy blue": "#000080", "baby blue": "#89cff0", "dusty rose": "#dcae96", taupe: "#8b8589",
    mocha: "#967969", camel: "#c19a6b", "olive green": "#708238", "royal blue": "#4169e1",
    "light pink": "#ffb6c1", "hot pink": "#ff69b4", "kelly green": "#4cbb17", denim: "#1560bd",
    rose: "#e8a0a8", "rose gold": "#b76e79", champagne: "#f7e7ce", ivory: "#fffff0", wine: "#722f37",
    "burnt orange": "#cc5500", terracotta: "#e2725b", "dusty blue": "#7393b3", lilac: "#c8a2c8",
    "forest": "#228b22", "light blue": "#add8e6", "dark green": "#006400", periwinkle: "#ccccff",
  };

  // ---------------------------------------------------------------------------
  // Christmas decorations
  // ---------------------------------------------------------------------------
  const HOLLY = `<svg viewBox="0 0 64 40" width="64" height="40">
    <path d="M30 22c-6-10-18-12-26-8 6 1 8 5 7 9 4-2 8 0 9 4 3-3 7-4 10-5z" fill="#3f8f5e"/>
    <path d="M34 22c6-10 18-12 26-8-6 1-8 5-7 9-4-2-8 0-9 4-3-3-7-4-10-5z" fill="#2f7a4d"/>
    <circle cx="27" cy="25" r="5" fill="#d23a4f"/><circle cx="37" cy="25" r="5" fill="#c02a40"/><circle cx="32" cy="19" r="5" fill="#e04a5e"/>
    <circle cx="30.5" cy="17.5" r="1.4" fill="#fff" opacity=".7"/></svg>`;

  const lights = (n) => `<div class="lights" aria-hidden="true">${"<i></i>".repeat(n)}</div>`;

  function countdownText() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let xmas = new Date(now.getFullYear(), 11, 25);
    if (today > xmas && now.getMonth() === 11) return "🎄 Merry Christmas!";
    if (today > xmas) xmas = new Date(now.getFullYear() + 1, 11, 25);
    const days = Math.round((xmas - today) / 86400000);
    if (days === 0) return "🎄 Merry Christmas!";
    if (days === 1) return "🎅 Christmas is tomorrow!";
    return `🎄 ${days} days until Christmas`;
  }

  const reduceMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  function letItSnow() {
    if (reduceMotion()) return;
    document.querySelectorAll(".snowfall:empty").forEach((box) => {
      let html = "";
      for (let i = 0; i < 26; i++) {
        const size = 3 + Math.random() * 5;
        const dur = 7 + Math.random() * 8;
        html += `<span style="left:${(Math.random() * 100).toFixed(1)}%;width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;` +
          `animation-duration:${dur.toFixed(1)}s,${(2.5 + Math.random() * 2).toFixed(1)}s;` +
          `animation-delay:-${(Math.random() * dur).toFixed(1)}s,-${(Math.random() * 3).toFixed(1)}s;` +
          `opacity:${(0.45 + Math.random() * 0.5).toFixed(2)}"></span>`;
      }
      box.innerHTML = html;
    });
  }

  // ---------------------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const app = $("#app");
  const dialog = $("#dialog");

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        return v == null ? fallback : JSON.parse(v);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* storage unavailable: fine */
      }
    },
  };
  const tokens = () => store.get("giftable.tokens", {});
  // Passwords ignore capital letters and extra spaces (phones love to capitalize).
  const normPassword = (s) => String(s || "").trim().toLowerCase();
  const claimKeys = () => store.get("giftable.claims", {});

  function uid() {
    if (window.crypto?.randomUUID) return crypto.randomUUID();
    return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function normalizeLink(raw) {
    const s = String(raw || "").trim();
    if (!s) return "";
    const withProto = /^[a-z][a-z0-9+.-]*:/i.test(s) ? s : "https://" + s;
    try {
      const u = new URL(withProto);
      return u.protocol === "http:" || u.protocol === "https:" ? u.href : "";
    } catch {
      return "";
    }
  }
  function linkHost(href) {
    try {
      return new URL(href).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  }

  function colorFor(name) {
    const n = name.trim().toLowerCase();
    if (KNOWN_COLORS[n]) return KNOWN_COLORS[n];
    const compact = n.replace(/\s+/g, "");
    if (window.CSS?.supports?.("color", compact)) return compact;
    return null;
  }
  const splitColors = (s) =>
    String(s || "")
      .split(/[,\n;]+/)
      .map((c) => c.trim())
      .filter(Boolean);

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (t.hidden = true), 2600);
  }

  const baseUrl = () => location.href.split("#")[0];
  const familyLink = () => baseUrl();
  const personLink = (p) => `${baseUrl()}#/${p.slug}`;

  async function share(url, title, text) {
    if (navigator.share) {
      try {
        await navigator.share({ url, title, text });
        return;
      } catch (e) {
        if (e && e.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied");
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  // ---------------------------------------------------------------------------
  // Data: Supabase, or demo mode saved in this browser
  // ---------------------------------------------------------------------------
  const cfg = window.GIFTABLE_CONFIG || {};
  const DEMO = !cfg.supabaseUrl || !cfg.supabaseKey;

  async function rpc(fn, args) {
    const headers = { "Content-Type": "application/json", apikey: cfg.supabaseKey };
    if (cfg.supabaseKey.startsWith("eyJ")) headers.Authorization = `Bearer ${cfg.supabaseKey}`;
    let res;
    try {
      res = await fetch(`${cfg.supabaseUrl.replace(/\/+$/, "")}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers,
        body: JSON.stringify(args || {}),
      });
    } catch {
      throw new Error("Can't reach Giftable. Check your connection and try again.");
    }
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (!res.ok) throw new Error((data && data.message) || "Something went wrong. Please try again.");
    return data;
  }

  const remote = {
    getAll: () => rpc("giftable_get_all"),
    checkToken: (slug, token) => rpc("giftable_check_token", { p_slug: slug, p_token: token }),
    saveItem: (token, item) => rpc("giftable_save_item", { p_token: token, p_item: item }),
    deleteItem: (token, id) => rpc("giftable_delete_item", { p_token: token, p_id: id }),
    saveProfile: (token, colors, sizes) => rpc("giftable_save_profile", { p_token: token, p_colors: colors, p_sizes: sizes }),
    claim: (itemId, name) => rpc("giftable_claim", { p_item_id: itemId, p_name: name }),
    unclaim: (itemId, key) => rpc("giftable_unclaim", { p_item_id: itemId, p_key: key }),
    login: (slug, pin) => rpc("giftable_login", { p_slug: slug, p_pin: normPassword(pin) }),
    setPin: (token, pin) => rpc("giftable_set_pin", { p_token: token, p_pin: normPassword(pin) }),
    markBought: (itemId, key, bought) => rpc("giftable_mark_bought", { p_item_id: itemId, p_key: key, p_bought: bought }),
    setTopPick: (token, id, on) => rpc("giftable_set_top_pick", { p_token: token, p_id: id, p_on: on }),
    shopperStart: (name) => rpc("giftable_shopper_start", { p_name: name }),
    shopperGet: (code) => rpc("giftable_shopper_get", { p_code: code }),
    claimAs: (itemId, code) => rpc("giftable_claim_as", { p_item_id: itemId, p_code: code }),
    unclaimAs: (itemId, code) => rpc("giftable_unclaim_as", { p_item_id: itemId, p_code: code }),
    markBoughtAs: (itemId, code, bought) => rpc("giftable_mark_bought_as", { p_item_id: itemId, p_code: code, p_bought: bought }),
    adminLogin: (pw) => rpc("giftable_admin_login", { p_pw: normPassword(pw) }),
    adminOk: (token) => rpc("giftable_admin_ok", { p_token: token }),
    adminSetPassword: (token, slug, pw) => rpc("giftable_admin_set_password", { p_token: token, p_slug: slug, p_pw: normPassword(pw) }),
    adminAddPerson: (token, name, pw) => rpc("giftable_admin_add_person", { p_token: token, p_name: name, p_pw: normPassword(pw) }),
    adminChangePassword: (token, pw) => rpc("giftable_admin_change_password", { p_token: token, p_new: normPassword(pw) }),
    async preview(url) {
      const res = await fetch(`${cfg.supabaseUrl.replace(/\/+$/, "")}/functions/v1/giftable-preview?url=${encodeURIComponent(url)}`);
      return res.json();
    },
  };

  const api = remote;

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const state = { people: [], items: [], claims: {}, claimInfo: {}, loaded: false, error: null };

  async function load() {
    try {
      const data = await api.getAll();
      state.people = data.people || [];
      state.items = data.items || [];
      state.claims = Object.fromEntries((data.claims || []).map((c) => [c.item_id, c.claimed_by]));
      state.claimInfo = Object.fromEntries((data.claims || []).map((c) => [c.item_id, { by: c.claimed_by, at: c.claimed_at, bought: !!c.bought, shopperId: c.shopper_id }]));
      state.loaded = true;
      state.error = null;
    } catch (e) {
      state.error = e.message;
    }
  }

  const personBySlug = (slug) => state.people.find((p) => p.slug === slug);
  const itemsFor = (p) =>
    state.items
      .filter((i) => i.person_id === p.id && !i.removed_at)
      .sort((a, b) => (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1) || String(a.created_at).localeCompare(String(b.created_at)));
  const isMine = (p) => Boolean(tokens()[p.slug]);
  const personById = (id) => state.people.find((p) => p.id === id);

  // First number in a price like "$20–40" or "about $35".
  const priceValue = (price) => {
    const m = String(price || "").replace(/,/g, "").match(/\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : null;
  };
  // The price a giver would pay today: the sale price if there is one.
  const currentPrice = (i) => i.sale_price || i.price;
  const priceHtml = (i) =>
    i.sale_price
      ? `<span class="price">${i.price ? `<span class="was">${esc(i.price)}</span> ` : ""}<span class="sale">${esc(i.sale_price)}</span></span>`
      : i.price ? `<span class="price">${esc(i.price)}</span>` : "";
  const saleTag = (i) => (i.sale_price ? `<span class="tag on-sale">🏷️ On sale</span>` : "");
  const money = (n) => "$" + (Math.round(n * 100) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 });

  // From Christmas Day through January, kids can see who gave them what.
  const thankYouTime = () => {
    const d = new Date();
    return (d.getMonth() === 11 && d.getDate() >= 25) || d.getMonth() === 0;
  };

  // The shopper using this device: { code, id, name }. Their code brings the
  // same shopping list to any phone or computer.
  const shopper = () => store.get("giftable.shopper", null);
  const isMyClaim = (itemId) => {
    const info = state.claimInfo[itemId];
    if (!info) return false;
    const sh = shopper();
    return Boolean((sh && info.shopperId && info.shopperId === sh.id) || claimKeys()[itemId]);
  };
  function myClaims() {
    // Forget old per-device claim keys for gifts that are gone.
    const keys = claimKeys();
    let stale = false;
    for (const id of Object.keys(keys)) {
      if (!state.claimInfo[id]) {
        delete keys[id];
        stale = true;
      }
    }
    if (stale && state.loaded) store.set("giftable.claims", keys);
    return state.items.filter((i) => isMyClaim(i.id));
  }

  // "New since your last visit": a visit ends after 30 minutes away.
  const visit = (() => {
    const now = Date.now();
    let v = store.get("giftable.visit", null);
    if (!v || now - v.last > 30 * 60 * 1000) v = { prev: v ? v.last : null, last: now };
    else v.last = now;
    store.set("giftable.visit", v);
    return v;
  })();
  const touchVisit = () => {
    visit.last = Date.now();
    store.set("giftable.visit", visit);
  };
  const isNewItem = (i) => Boolean(visit.prev && Date.parse(i.created_at) > visit.prev);
  const isNewSale = (i) => Boolean(visit.prev && i.sale_price && i.updated_at && Date.parse(i.updated_at) > visit.prev && !isNewItem(i));
  const topFirst = (items) => [...items.filter((i) => i.top_pick), ...items.filter((i) => !i.top_pick)];
  const changedSinceClaim = (item) => {
    const info = state.claimInfo[item.id];
    if (!info || !item.updated_at || !info.at) return false;
    if (Date.parse(item.updated_at) <= Date.parse(info.at)) return false;
    return store.get("giftable.acks", {})[item.id] !== item.updated_at;
  };
  const listNames = () => {
    const n = state.people.map((p) => p.name);
    return n.length > 1 ? `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}` : n.join("");
  };
  const avatarColor = (p) => AVATAR_COLORS[(state.people.indexOf(p) + AVATAR_COLORS.length) % AVATAR_COLORS.length];

  // ---------------------------------------------------------------------------
  // Routing:  #/            family page
  //           #/jack        Jack's list (for gift givers)
  //           #/jack/edit/TOKEN   Jack's private edit page
  // ---------------------------------------------------------------------------
  function route() {
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
    if (!parts.length) return { view: "home" };
    if (parts[0] === "mine") return { view: "mine" };
    if (parts[0] === "parent") return { view: "parent" };
    if (parts[1] === "edit") return { view: "edit", slug: parts[0], token: parts[2] || tokens()[parts[0]] || "" };
    return { view: "list", slug: parts[0] };
  }

  let rendering = 0;
  async function render() {
    await renderPage();
    letItSnow();
    touchVisit();
  }
  async function renderPage() {
    const my = ++rendering;
    if (!state.loaded && !state.error) {
      app.innerHTML = `<div class="wrap"><div class="loading">Loading lists…</div></div>`;
      await load();
    }
    if (my !== rendering) return;
    if (state.error && !state.loaded) {
      app.innerHTML = `<div class="wrap">${topbar()}<div class="empty"><p>${esc(state.error)}</p>
        <button class="btn primary" data-action="retry">Try again</button></div></div>`;
      return;
    }
    const r = route();
    if (r.view === "home") return renderHome();
    if (r.view === "mine") return renderMine();
    if (r.view === "parent") return renderParent(my);
    const p = personBySlug(r.slug);
    if (!p) {
      app.innerHTML = `<div class="wrap">${topbar(true)}<div class="empty">We couldn't find that list.</div></div>`;
      return;
    }
    if (r.view === "edit") return renderEdit(p, r.token, my);
    return renderList(p);
  }

  function topbar(showBack) {
    return `<header class="topbar">
      ${showBack ? `<a class="back" href="#/">← Family</a>` : `<span></span>`}
      <a class="brand" href="#/"><img src="icons/icon-192.png" alt=""><span>Giftable</span></a>
    </header>`;
  }
  const demoBanner = () =>
    DEMO ? `<div class="banner"><strong>Not connected.</strong> Add the Supabase address and key to config.js.</div>` : "";

  // ---------------------------------------------------------------------------
  // Family page
  // ---------------------------------------------------------------------------
  function renderHome() {
    const mine = state.people.filter(isMine);
    const cards = state.people
      .map((p) => {
        const items = itemsFor(p);
        let meta = items.length ? `${items.length} gift idea${items.length === 1 ? "" : "s"}` : "No ideas yet";
        let badge = "";
        if (items.length && !isMine(p)) {
          const open = items.filter((i) => !state.claims[i.id]).length;
          meta += ` · ${open} available`;
          const fresh = items.filter((i) => isNewItem(i) || isNewSale(i)).length;
          if (fresh) badge = `<span class="new-badge">✨ ${fresh} new</span>`;
        }
        return `<a class="person" href="#/${esc(p.slug)}" style="--c:${avatarColor(p)}">${badge}
          <div class="avatar" style="--c:${avatarColor(p)}">${esc(p.name[0] || "?")}</div>
          <h2>${esc(p.name)}</h2><div class="meta">${meta}</div></a>`;
      })
      .join("");

    app.innerHTML = `<div class="wrap">
      ${demoBanner()}
      <section class="hero festive">${lights(18)}<div class="snowfall" aria-hidden="true"></div>
        <div class="hero-inner">
          <div class="holly" aria-hidden="true">${HOLLY}</div>
          <h1>Giftable</h1>
          <p>Our family's Christmas wish lists. Pick a person to see what they'd love, and claim a gift so nobody doubles up.</p>
          <div class="countdown">${countdownText()}</div>
        </div>
      </section>
      <div class="share-row" style="margin:0 0 20px">${mine.length
        ? mine.map((p) => `<a class="btn primary" href="#/${esc(p.slug)}/edit">✏️ Edit my list${mine.length > 1 ? ` (${esc(p.name)})` : ""}</a>`).join("")
        : `<button class="btn primary" data-action="login">🔑 Log in to edit your list</button>`}
        ${myClaims().length || shopper() ? `<a class="btn berry" href="#/mine">🛍️ My shopping list (${myClaims().length})</a>` : ""}</div>
      <div class="people">${cards}</div>
      <div class="share-row">
        <button class="btn" data-action="share-family">Share Giftable with family</button>
      </div>
      <section class="howto">
        <h3>How it works</h3>
        <ol>
          <li>${esc(listNames())} each tap <strong>Log in</strong> with their name and password to fill in their own list.</li>
          <li>Everyone else opens this page, picks a person, and taps <strong>I'll get this</strong> on a gift.</li>
          <li>Other givers see it's taken. The person whose list it is never sees what's been claimed.</li>
          <li>Shopping on a different phone or computer? Open <a href="#/mine">My shopping list</a> and enter your <strong>shopper code</strong>.</li>
          <li>Tip: use your browser's <strong>Share → Add to Home Screen</strong> to keep Giftable like an app.</li>
        </ol>
      </section>
      <footer class="foot">Merry Christmas from our family 🎄<br><a class="parent-link" href="#/parent">Parent dashboard</a></footer>
    </div>`;
  }

  // ---------------------------------------------------------------------------
  // A person's list, as gift givers see it
  // ---------------------------------------------------------------------------
  function profileBlock(p) {
    const colors = splitColors(p.colors);
    const sizes = SIZE_FIELDS.filter(([k]) => p.sizes?.[k]);
    if (!colors.length && !sizes.length) return "";
    return `<section class="profile">
      ${colors.length ? `<div><div class="label">Favorite colors</div><div class="chips">${colors
        .map((c) => {
          const sw = colorFor(c);
          return `<span class="chip">${sw ? `<span class="swatch" style="background:${esc(sw)}"></span>` : ""}${esc(c)}</span>`;
        })
        .join("")}</div></div>` : ""}
      ${sizes.length ? `<div><div class="label">Sizes</div><div class="chips">${sizes
        .map(([k, label]) => `<span class="chip">${esc(label)}: <strong>${esc(p.sizes[k])}</strong></span>`)
        .join("")}</div></div>` : ""}
    </section>`;
  }

  function itemCard(item, mode) {
    const cat = CAT[item.category] || { name: "Other" };
    const claimedBy = state.claims[item.id];
    const mine = isMyClaim(item.id);
    const pr = PRIORITIES.find(([k]) => k === item.priority) || PRIORITIES[1];
    const tags = [];
    if (mode === "give" && isNewItem(item)) tags.push(`<span class="tag new">✨ New</span>`);
    tags.push(`<span class="tag p-${pr[0]}">${pr[1]}</span>`);
    if (item.sale_price) tags.push(mode === "give" && isNewSale(item) ? `<span class="tag on-sale">🏷️ Now on sale</span>` : saleTag(item));
    if (item.size) tags.push(`<span class="tag">Size: ${esc(item.size)}</span>`);
    if (item.color) tags.push(`<span class="tag">Color: ${esc(item.color)}</span>`);
    const href = normalizeLink(item.link);
    const linkBtn = href
      ? `<a class="btn small" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${cat.charity ? "Donate page" : "View item"} ↗ <span class="host">${esc(linkHost(href))}</span></a>`
      : "";

    let actions = "";
    let notice = "";
    const fromNote = thankYouTime() && claimedBy ? `<span class="claim-note from-note">🎁 From <strong>${esc(claimedBy)}</strong></span>` : "";
    if (mode === "give" && claimedBy && mine && changedSinceClaim(item)) {
      const who = personById(item.person_id);
      notice = `<div class="warn">⚠️ ${esc(who ? who.name : "They")} changed this after you claimed it. Double-check the details.
        <button class="btn small" data-action="ack-change" data-id="${esc(item.id)}">Got it</button></div>`;
    }
    if (mode === "edit") {
      actions = `${linkBtn}<span class="spacer" style="flex:1"></span>
        <button class="btn small star${item.top_pick ? " on" : ""}" data-action="toggle-top" data-id="${esc(item.id)}" aria-pressed="${!!item.top_pick}" title="Top pick">${item.top_pick ? "★" : "☆"} Top pick</button>
        <button class="btn small" data-action="edit-item" data-id="${esc(item.id)}">Edit</button>
        <button class="btn small ghost" data-action="delete-item" data-id="${esc(item.id)}">Delete</button>${fromNote ? `<div style="flex-basis:100%">${fromNote}</div>` : ""}`;
    } else if (mode === "own") {
      actions = linkBtn + fromNote;
    } else if (claimedBy && mine) {
      const bought = state.claimInfo[item.id]?.bought;
      actions = `${linkBtn}<span class="claim-note">✅ <strong>${bought ? "You bought this" : "You're getting this"}</strong></span>
        <button class="btn small ghost" data-action="unclaim" data-id="${esc(item.id)}">Undo</button>`;
    } else if (claimedBy) {
      actions = `${linkBtn}<span class="claim-note">🎁 Claimed by <strong>${esc(claimedBy)}</strong></span>`;
    } else {
      actions = `${linkBtn}<button class="btn small berry" data-action="claim" data-id="${esc(item.id)}">${cat.charity ? "I'll donate" : "I'll get this"}</button>`;
    }

    const showClaimed = mode === "give" && claimedBy;
    return `<article class="item${showClaimed ? " claimed" : ""}${item.image_url ? " has-thumb" : ""}">
      ${thumbHtml(item, href)}
      <div class="item-body">
        <div class="item-top"><h3>${item.top_pick && mode === "edit" ? "⭐ " : ""}${esc(item.name)}</h3>${priceHtml(item)}</div>
        <div class="tags">${tags.join("")}</div>
        ${item.notes ? `<p class="notes">${esc(item.notes)}</p>` : ""}
        ${notice}
        <div class="item-actions">${actions}</div>
      </div>
    </article>`;
  }

  function thumbHtml(item, href) {
    if (!item.image_url) return "";
    const img = `<img class="thumb" src="${esc(item.image_url)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.thumb-wrap').remove()">`;
    return href
      ? `<a class="thumb-wrap" href="${esc(href)}" target="_blank" rel="noopener noreferrer" aria-label="View item">${img}</a>`
      : `<div class="thumb-wrap">${img}</div>`;
  }

  function topPicksSection(items, mode) {
    const top = items.filter((i) => i.top_pick);
    if (!top.length) return "";
    return `<section class="category top-picks"><h2>⭐ Top picks <span class="count">${top.length}</span></h2>
      ${top.map((i) => itemCard(i, mode)).join("")}</section>`;
  }

  function categorySections(items, mode) {
    return CATEGORIES.map((c) => {
      const inCat = items.filter((i) => i.category === c.id);
      if (!inCat.length) return "";
      return `<section class="category"><h2>${c.emoji} ${esc(c.name)} <span class="count">${inCat.length}</span></h2>
        ${inCat.map((i) => itemCard(i, mode)).join("")}</section>`;
    }).join("") +
      (() => {
        const other = items.filter((i) => !CAT[i.category]);
        return other.length ? `<section class="category"><h2>🎁 Other</h2>${other.map((i) => itemCard(i, mode)).join("")}</section>` : "";
      })();
  }

  function renderList(p) {
    const own = isMine(p);
    const all = itemsFor(p);
    const hideClaimed = !own && store.get("giftable.hideClaimed", false);
    const maxPrice = own ? 0 : Number(store.get("giftable.maxPrice", 0)) || 0;
    let items = hideClaimed ? all.filter((i) => !state.claims[i.id] || isMyClaim(i.id)) : all;
    if (maxPrice) items = items.filter((i) => { const v = priceValue(currentPrice(i)); return v == null || v <= maxPrice; });
    const mineCount = own ? 0 : myClaims().length;
    const open = all.filter((i) => !state.claims[i.id]).length;

    app.innerHTML = `<div class="wrap">
      ${topbar(true)}
      ${demoBanner()}
      <div class="list-head festive">${lights(14)}<div class="snowfall" aria-hidden="true"></div>
        <div class="avatar" style="--c:${avatarColor(p)}">${esc(p.name[0] || "?")}</div>
        <div><h1>${esc(p.name)}'s list</h1>
        <div class="sub">${all.length} gift idea${all.length === 1 ? "" : "s"}${own ? "" : ` · ${open} still available`}</div></div>
      </div>
      ${own ? `<div class="private">This is <strong>your</strong> list, so claims are hidden to keep the surprise.
        <div style="margin-top:10px"><a class="btn small primary" href="#/${esc(p.slug)}/edit">✏️ Edit my list</a></div></div>` : ""}
      ${profileBlock(p)}
      ${own ? "" : `<div class="price-filter" role="group" aria-label="Filter by price">
        ${[[0, "Any"], [25, "Under $25"], [50, "Under $50"], [100, "Under $100"]]
          .map(([v, label]) => `<button class="chip-btn${maxPrice === v ? " on" : ""}" data-action="price" data-max="${v}" aria-pressed="${maxPrice === v}">${label}</button>`)
          .join("")}
      </div>`}
      <div class="toolbar">
        ${own ? "" : `<label class="toggle"><input type="checkbox" data-action="toggle-hide" ${hideClaimed ? "checked" : ""}> Hide claimed gifts</label>`}
        <span class="spacer"></span>
        ${mineCount ? `<a class="btn small primary" href="#/mine">🛍️ My shopping list (${mineCount})</a>` : ""}
        <button class="btn small" data-action="share-person" data-slug="${esc(p.slug)}">Share ${esc(p.name)}'s list</button>
      </div>
      ${thankYouTime() && own ? `<div class="banner">🎄 Merry Christmas! You can now see who gave you each gift, for your thank-you notes.</div>` : ""}
      ${all.length ? (topPicksSection(items, own ? "own" : "give") + categorySections(items.filter((i) => !i.top_pick), own ? "own" : "give")) || `<div class="empty">${maxPrice ? `Nothing left under ${money(maxPrice)}. Try a higher price.` : "Every gift has been claimed. 🎉"}</div>`
        : `<div class="empty">${esc(p.name)} hasn't added anything yet. Check back soon!</div>`}
    </div>`;
  }

  // ---------------------------------------------------------------------------
  // My shopping list: everything this device has claimed
  // ---------------------------------------------------------------------------
  function renderMine() {
    const mine = myClaims();
    const sh = shopper();
    const active = mine.filter((i) => !i.removed_at);
    const boughtCount = active.filter((i) => state.claimInfo[i.id]?.bought).length;
    const priced = active.map((i) => priceValue(currentPrice(i))).filter((v) => v != null);
    const total = priced.reduce((a, b) => a + b, 0);
    const unpriced = active.length - priced.length;

    const groups = state.people
      .map((p) => ({ p, items: mine.filter((i) => i.person_id === p.id) }))
      .filter((g) => g.items.length);

    const card = (item, p) => {
      const info = state.claimInfo[item.id] || {};
      const cat = CAT[item.category] || { name: "Other", emoji: "🎁" };
      const href = normalizeLink(item.link);
      const tags = [`<span class="tag">${cat.emoji} ${esc(cat.name)}</span>`];
      if (item.sale_price) tags.push(saleTag(item));
      if (item.size) tags.push(`<span class="tag">Size: ${esc(item.size)}</span>`);
      if (item.color) tags.push(`<span class="tag">Color: ${esc(item.color)}</span>`);
      let warn = "";
      if (item.removed_at) {
        warn = `<div class="warn">⚠️ ${esc(p.name)} removed this from their list. If you haven't bought it yet, you may want to tap <strong>Undo</strong>.</div>`;
      } else if (changedSinceClaim(item)) {
        warn = `<div class="warn">⚠️ ${esc(p.name)} changed this after you claimed it. Double-check the details.
          <button class="btn small" data-action="ack-change" data-id="${esc(item.id)}">Got it</button></div>`;
      }
      return `<article class="item${info.bought ? " bought" : ""}${item.removed_at ? " removed" : ""}${item.image_url ? " has-thumb" : ""}">
        ${thumbHtml(item, href)}
        <div class="item-body">
          <div class="item-top"><h3>${esc(item.name)}</h3>${priceHtml(item)}</div>
          <div class="tags">${tags.join("")}</div>
          ${item.notes ? `<p class="notes">${esc(item.notes)}</p>` : ""}
          ${warn}
          <div class="item-actions">
            ${href ? `<a class="btn small" href="${esc(href)}" target="_blank" rel="noopener noreferrer">View item ↗</a>` : ""}
            ${item.removed_at ? "" : `<button class="btn small ${info.bought ? "primary" : ""}" data-action="toggle-bought" data-id="${esc(item.id)}" aria-pressed="${!!info.bought}">${info.bought ? "✓ Bought" : "Mark as bought"}</button>`}
            <button class="btn small ghost" data-action="unclaim" data-id="${esc(item.id)}">Undo</button>
          </div>
        </div>
      </article>`;
    };

    app.innerHTML = `<div class="wrap">
      ${topbar(true)}
      ${demoBanner()}
      <div class="list-head festive">${lights(14)}<div class="snowfall" aria-hidden="true"></div>
        <div class="avatar" style="--c:#b3263e">🛍️</div>
        <div><h1>My shopping list</h1>
        <div class="sub">${mine.length ? `${boughtCount} of ${active.length} bought · ${countdownText()}` : countdownText()}</div></div>
      </div>
      ${sh ? `<div class="code-card">
          <div><div class="label">Your shopper code</div><div class="code">${esc(sh.code)}</div>
          <div class="sub">Shopping as <strong>${esc(sh.name)}</strong>. Enter this code on another phone or computer to see this list there.</div></div>
          <div class="code-actions"><button class="btn small" data-action="copy-code">Copy code</button>
          <button class="btn small ghost" data-action="switch-shopper">Not ${esc(sh.name)}?</button></div>
        </div>`
        : `<div class="code-card"><div><div class="label">Shopping on another device too?</div>
          <div class="sub">If you claimed gifts somewhere else, enter the shopper code you got there.</div></div>
          <div class="code-actions"><button class="btn small primary" data-action="enter-code">Use my shopper code</button></div></div>`}
      ${mine.length ? `<div class="total-row">
          <div><div class="label">Total so far</div><div class="total">${money(total)}</div></div>
          <div class="sub">${unpriced ? `+ ${unpriced} gift${unpriced === 1 ? "" : "s"} without a price` : "All gifts have a price"}</div>
        </div>
        ${groups.map((g) => `<section class="category"><h2>For ${esc(g.p.name)} <span class="count">${g.items.length}</span></h2>
          ${g.items.map((i) => card(i, g.p)).join("")}</section>`).join("")}`
        : `<div class="empty">You haven't claimed any gifts yet.<br>Pick a person on the <a href="#/">family page</a> and tap <strong>I'll get this</strong>.</div>`}
      <p class="foot">${sh ? "Keep your shopper code somewhere safe, like a note on your phone." : "Your first claim gives you a shopper code to use on other devices."}</p>
    </div>`;
  }

  // ---------------------------------------------------------------------------
  // Parent dashboard (behind the parent password)
  // ---------------------------------------------------------------------------
  let adminVerified = "";
  async function renderParent(my) {
    const token = store.get("giftable.admin", "");
    if (token && adminVerified !== token) {
      let ok = false;
      try {
        ok = await api.adminOk(token);
      } catch {
        ok = false;
      }
      if (my !== rendering) return;
      if (ok) adminVerified = token;
      else store.set("giftable.admin", "");
    }
    if (!store.get("giftable.admin", "")) {
      app.innerHTML = `<div class="wrap">${topbar(true)}
        <div class="list-head festive">${lights(14)}<div class="snowfall" aria-hidden="true"></div>
          <div class="avatar" style="--c:#a8841a">🔐</div>
          <div><h1>Parent dashboard</h1><div class="sub">For parents only. Kids, no peeking! 🎅</div></div>
        </div>
        <form class="panel" data-form="parent-login">
          <div class="field"><label for="p-pw">Parent password</label>
            <input id="p-pw" name="pw" type="password" autocomplete="current-password" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="60" required></div>
          <button class="btn primary" type="submit">Open dashboard</button>
        </form></div>`;
      return;
    }

    const rows = state.people.map((p) => {
      const items = itemsFor(p);
      const claimed = items.filter((i) => state.claims[i.id]);
      const bought = claimed.filter((i) => state.claimInfo[i.id]?.bought);
      const spent = claimed.reduce((a, i) => a + (priceValue(currentPrice(i)) || 0), 0);
      const open = items.filter((i) => !state.claims[i.id]);
      const openValue = open.reduce((a, i) => a + (priceValue(currentPrice(i)) || 0), 0);
      return { p, items, claimed, bought, spent, open, openValue };
    });
    const maxSpent = Math.max(1, ...rows.map((r) => r.spent));
    const totals = rows.reduce((t, r) => ({ items: t.items + r.items.length, claimed: t.claimed + r.claimed.length, bought: t.bought + r.bought.length, spent: t.spent + r.spent }), { items: 0, claimed: 0, bought: 0, spent: 0 });

    const shoppers = {};
    for (const it of state.items) {
      const info = state.claimInfo[it.id];
      if (!info || it.removed_at) continue;
      const s = (shoppers[info.by] ||= { name: info.by, count: 0, spent: 0, kids: new Set() });
      s.count++;
      s.spent += priceValue(currentPrice(it)) || 0;
      const kid = personById(it.person_id);
      if (kid) s.kids.add(kid.name);
    }
    const shopperRows = Object.values(shoppers).sort((a, b) => b.spent - a.spent);
    const opts = state.people.map((p) => `<option value="${esc(p.slug)}">${esc(p.name)}</option>`).join("");

    app.innerHTML = `<div class="wrap">${topbar(true)}
      <div class="list-head festive">${lights(14)}<div class="snowfall" aria-hidden="true"></div>
        <div class="avatar" style="--c:#a8841a">📊</div>
        <div><h1>Parent dashboard</h1><div class="sub">${countdownText()}</div></div>
      </div>
      <div class="stat-row">
        <div class="stat"><div class="num">${totals.items}</div><div class="label">Gift ideas</div></div>
        <div class="stat"><div class="num">${totals.claimed}</div><div class="label">Claimed</div></div>
        <div class="stat"><div class="num">${totals.bought}</div><div class="label">Bought</div></div>
        <div class="stat"><div class="num">${money(totals.spent)}</div><div class="label">Being spent</div></div>
      </div>

      <section class="category"><h2>How each kid is doing</h2>
        ${rows.map((r) => `<div class="kid-row" style="--c:${avatarColor(r.p)}">
          <div class="kid-name"><span class="dot"></span><strong>${esc(r.p.name)}</strong>
            <span class="sub">${r.claimed.length} of ${r.items.length} claimed · ${r.bought.length} bought</span></div>
          <div class="bar" role="img" aria-label="${esc(r.p.name)}: ${money(r.spent)} being spent"><span style="width:${Math.round((r.spent / maxSpent) * 100)}%"></span></div>
          <div class="kid-money"><strong>${money(r.spent)}</strong> being spent · ${r.open.length} still open${r.openValue ? ` (${money(r.openValue)})` : ""}</div>
        </div>`).join("")}
        <p class="hint-line">Spending uses each gift's price (or sale price). Gifts without a price count as $0.</p>
      </section>

      <section class="category"><h2>Who's shopping</h2>
        ${shopperRows.length ? shopperRows.map((x) => `<div class="kid-row">
          <div class="kid-name"><strong>${esc(x.name)}</strong><span class="sub">${x.count} gift${x.count === 1 ? "" : "s"} for ${esc([...x.kids].join(", "))}</span></div>
          <div class="kid-money"><strong>${money(x.spent)}</strong></div></div>`).join("")
          : `<div class="empty">Nobody has claimed a gift yet.</div>`}
      </section>

      <section class="category"><h2>Manage</h2>
        <form class="panel" data-form="reset-pw">
          <h3>Reset a password</h3>
          <div class="row">
            <div class="field"><label for="r-who">Person</label><select id="r-who" name="slug">${opts}</select></div>
            <div class="field"><label for="r-pw">New password</label><input id="r-pw" name="pw" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="60" required></div>
          </div>
          <button class="btn primary" type="submit">Set password</button>
        </form>
        <form class="panel" data-form="add-person">
          <h3>Add a person</h3>
          <p class="hint-line">A spouse, partner or grandkid. They log in with their name and this password.</p>
          <div class="row">
            <div class="field"><label for="a-name">Name</label><input id="a-name" name="name" maxlength="40" required></div>
            <div class="field"><label for="a-pw">Starting password</label><input id="a-pw" name="pw" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="60" required></div>
          </div>
          <button class="btn primary" type="submit">Add person</button>
        </form>
        <div class="panel">
          <h3>Backup</h3>
          <p class="hint-line">Download every list (with who's buying what) as a spreadsheet.</p>
          <button class="btn" data-action="backup">⬇️ Download spreadsheet</button>
        </div>
        <form class="panel" data-form="parent-pw">
          <h3>Change the parent password</h3>
          <div class="field"><label for="c-pw">New parent password</label><input id="c-pw" name="pw" type="password" autocomplete="new-password" maxlength="60" required></div>
          <button class="btn" type="submit">Change password</button>
        </form>
        <button class="btn ghost" data-action="parent-logout">Log out of the parent dashboard</button>
      </section>
    </div>`;
  }

  function downloadBackup() {
    const head = ["Person", "Category", "Gift", "Link", "Price", "Sale price", "Priority", "Top pick", "Size", "Color", "Notes", "Claimed by", "Bought", "Added"];
    const cell = (v) => {
      const t = String(v ?? "");
      return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
    };
    const lines = [head.map(cell).join(",")];
    for (const p of state.people) {
      for (const i of itemsFor(p)) {
        const info = state.claimInfo[i.id];
        const pr = PRIORITIES.find(([k]) => k === i.priority);
        lines.push([p.name, CAT[i.category]?.name || i.category, i.name, i.link, i.price, i.sale_price, pr ? pr[1] : i.priority,
          i.top_pick ? "Yes" : "", i.size, i.color, i.notes, info?.by || "", info?.bought ? "Yes" : "", (i.created_at || "").slice(0, 10)].map(cell).join(","));
      }
    }
    const blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `giftable-backup-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1000);
    toast("Spreadsheet downloaded");
  }

  // ---------------------------------------------------------------------------
  // A person's private edit page
  // ---------------------------------------------------------------------------
  const verified = {};
  async function renderEdit(p, token, my) {
    const needLogin = (msg) => {
      app.innerHTML = `<div class="wrap">${topbar(true)}<div class="empty"><p>${msg}</p>
        <button class="btn primary" data-action="login" data-slug="${esc(p.slug)}">🔑 Log in as ${esc(p.name)}</button>
        <p style="margin-top:14px"><a href="#/${esc(p.slug)}">Or view ${esc(p.name)}'s list</a></p></div></div>`;
    };
    if (!token) return needLogin(`Log in to edit ${esc(p.name)}'s list.`);
    if (!verified[p.slug + token]) {
      let ok = false;
      try {
        ok = await api.checkToken(p.slug, token);
      } catch (e) {
        if (my !== rendering) return;
        app.innerHTML = `<div class="wrap">${topbar(true)}<div class="empty"><p>${esc(e.message)}</p><button class="btn primary" data-action="retry">Try again</button></div></div>`;
        return;
      }
      if (my !== rendering) return;
      if (!ok) {
        const t = tokens();
        if (t[p.slug] === token) {
          delete t[p.slug];
          store.set("giftable.tokens", t);
        }
        return needLogin("You've been logged out. Please log in again.");
      }
      verified[p.slug + token] = true;
      const t = tokens();
      t[p.slug] = token;
      store.set("giftable.tokens", t);
      // Keep the secret out of the address bar once it's saved.
      if (location.hash !== `#/${p.slug}/edit`) history.replaceState(null, "", `#/${p.slug}/edit`);
    }

    const items = itemsFor(p);
    app.innerHTML = `<div class="wrap">
      ${topbar(true)}
      ${demoBanner()}
      <div class="list-head festive">${lights(14)}<div class="snowfall" aria-hidden="true"></div>
        <div class="avatar" style="--c:${avatarColor(p)}">${esc(p.name[0] || "?")}</div>
        <div><h1>Hi ${esc(p.name)}!</h1><div class="sub">Add what you'd love this Christmas. ${countdownText()}</div></div>
      </div>
      <div class="private">🔒 You're logged in as <strong>${esc(p.name)}</strong>. Only you can change your list, and you'll never see who claimed what.
        <div class="share-row" style="justify-content:flex-start;margin-top:10px">
          <button class="btn small" data-action="share-person" data-slug="${esc(p.slug)}">Share my list</button>
          <a class="btn small ghost" href="#/${esc(p.slug)}">Preview as a giver</a>
          <button class="btn small ghost" data-action="change-pin">Change password</button>
          <button class="btn small ghost" data-action="logout">Log out</button>
        </div>
      </div>
      <section class="profile">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
          <div class="label">Favorite colors & sizes</div>
          <button class="btn small" data-action="edit-profile">Edit</button>
        </div>
        ${profileBlock(p).replace(/^<section class="profile">|<\/section>$/g, "") || `<div class="sub" style="color:var(--muted);font-size:14px">Add your favorite colors and sizes so givers can shop with confidence.</div>`}
      </section>
      <div class="label" style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);font-weight:600;margin:4px 0 8px">Add to a category</div>
      <div class="chips">${CATEGORIES.map((c) => `<button class="btn small" data-action="add-item" data-cat="${c.id}">${c.emoji} ${esc(c.name)}</button>`).join("")}</div>
      ${items.length ? `<p class="hint-line">⭐ Tap <strong>☆ Top pick</strong> on up to 3 gifts you want most. They show first for givers.</p>` + categorySections(items, "edit") : `<div class="empty" style="margin-top:20px">Your list is empty. Tap a category above or <strong>Add a gift</strong> to start.</div>`}
    </div>
    <button class="btn primary fab" data-action="add-item">＋ Add a gift</button>`;
  }

  // ---------------------------------------------------------------------------
  // Dialogs
  // ---------------------------------------------------------------------------
  function openDialog(html, onSubmit) {
    dialog.innerHTML = `<form class="dialog-body" novalidate>${html}</form>`;
    const form = $("form", dialog);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = $('button[type="submit"]', form);
      if (btn) btn.disabled = true;
      try {
        const done = await onSubmit(form, e.submitter);
        if (done !== false) dialog.close();
      } catch (err) {
        toast(err.message || "Something went wrong");
      } finally {
        if (btn) btn.disabled = false;
      }
    });
    form.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) dialog.close();
    });
    if (!dialog.open) dialog.showModal();
    const first = $("[autofocus]", form) || $("input, select, textarea", form);
    if (first && !matchMedia("(pointer: coarse)").matches) first.focus();
    return form;
  }
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close(); // tap outside to close
  });

  function itemForm(p, token, item, presetCat) {
    const editing = Boolean(item);
    item = item || { category: presetCat || "clothing", priority: "like" };
    const opts = CATEGORIES.map((c) => `<option value="${c.id}" ${c.id === item.category ? "selected" : ""}>${c.emoji} ${esc(c.name)}</option>`).join("");
    const form = openDialog(
      `<h2>${editing ? "Edit gift" : "Add a gift"}</h2>
      <div class="field"><label for="f-cat">Category</label><select id="f-cat" name="category">${opts}</select>
        <span class="hint" id="f-cat-hint"></span></div>
      <div class="field"><label for="f-name">What is it?</label><input id="f-name" name="name" required maxlength="200" value="${esc(item.name || "")}" autofocus></div>
      <div class="field"><label for="f-link">Link <span class="hint">(optional)</span></label>
        <div class="link-row">
          <input id="f-link" name="link" type="url" inputmode="url" placeholder="Paste a link to the store page" value="${esc(item.link || "")}">
          <button type="button" class="btn small" id="f-fill">✨ Fill in</button>
        </div>
        <span class="hint" id="f-fill-status">Paste a store link and we'll try to fill in the name, photo and price.</span></div>
      <input type="hidden" name="image_url" id="f-image" value="${esc(item.image_url || "")}">
      <div class="photo-preview" id="f-photo" ${item.image_url ? "" : "hidden"}>
        <img id="f-photo-img" src="${esc(item.image_url || "")}" alt="" referrerpolicy="no-referrer">
        <button type="button" class="btn small ghost" id="f-photo-remove">Remove photo</button>
      </div>
      <div class="field"><label for="f-price"><span id="f-price-label">Regular price</span> <span class="hint">(optional)</span></label>
        <input id="f-price" name="price" maxlength="40" placeholder="$25 or $20–40" value="${esc(item.price || "")}"></div>
      <div class="sale-box" id="f-sale-box">
        <label class="toggle sale-toggle"><input type="checkbox" id="f-onsale" name="onsale" ${item.sale_price ? "checked" : ""}> 🏷️ It's on sale right now</label>
        <div class="field" id="f-sale-field"><label for="f-sale">Sale price</label>
          <input id="f-sale" name="sale_price" maxlength="40" inputmode="decimal" placeholder="e.g. $19.99" value="${esc(item.sale_price || "")}">
          <span class="hint">Givers will see the regular price crossed out.</span></div>
      </div>
      <div class="field"><label>How much do you want it?</label>
        <div class="seg">${PRIORITIES.map(([k, label]) => `<input type="radio" name="priority" id="pr-${k}" value="${k}" ${item.priority === k ? "checked" : ""}><label for="pr-${k}">${label}</label>`).join("")}</div></div>
      <div class="row" id="f-sized">
        <div class="field"><label for="f-size">Size</label><input id="f-size" name="size" maxlength="60" value="${esc(item.size || "")}"></div>
        <div class="field"><label for="f-color">Color</label><input id="f-color" name="color" maxlength="60" value="${esc(item.color || "")}"></div>
      </div>
      <div class="field"><label for="f-notes">Notes <span class="hint">(optional)</span></label>
        <textarea id="f-notes" name="notes" maxlength="1000" placeholder="Brand, style, scent, “any is fine”…">${esc(item.notes || "")}</textarea></div>
      <div class="dialog-actions">
        <button type="button" class="btn ghost" data-close>Cancel</button>
        <button type="submit" class="btn primary">${editing ? "Save changes" : "Add to my list"}</button>
      </div>`,
      async (f) => {
        const fd = new FormData(f);
        const name = String(fd.get("name") || "").trim();
        if (!name) {
          $("#f-name", f).focus();
          toast("Give the gift a name");
          return false;
        }
        const rawLink = String(fd.get("link") || "").trim();
        const link = normalizeLink(rawLink);
        if (rawLink && !link) {
          toast("That link doesn't look right");
          return false;
        }
        const cat = CAT[fd.get("category")];
        const onSale = !cat.charity && fd.get("onsale") === "on";
        const salePrice = onSale ? String(fd.get("sale_price") || "").trim() : "";
        if (onSale && !salePrice) {
          $("#f-sale", f).focus();
          toast("Enter the sale price, or untick “on sale”");
          return false;
        }
        const payload = {
          category: cat.id,
          name,
          link,
          price: String(fd.get("price") || "").trim(),
          sale_price: salePrice,
          priority: String(fd.get("priority") || "like"),
          size: cat.sized ? String(fd.get("size") || "").trim() : "",
          color: cat.sized ? String(fd.get("color") || "").trim() : "",
          notes: String(fd.get("notes") || "").trim(),
          image_url: String(fd.get("image_url") || ""),
        };
        if (editing) payload.id = item.id;
        await api.saveItem(token, payload);
        await load();
        render();
        toast(editing ? "Saved" : "Added to your list");
      }
    );

    const sync = () => {
      const c = CAT[$("#f-cat", form).value];
      $("#f-sized", form).style.display = c.sized ? "" : "none";
      $("#f-cat-hint", form).textContent = c.hint || "";
      $("#f-name", form).placeholder = "e.g. " + c.ex;
      $("#f-size", form).placeholder = c.exSize ? "e.g. " + c.exSize : "";
      $("#f-color", form).placeholder = c.exColor ? "e.g. " + c.exColor : "";
      $("#f-link", form).placeholder = c.charity ? "Paste a link to their donation page" : "Paste a link to the store page";
      $("#f-price", form).placeholder = c.charity ? "Suggested amount" : "$25 or $20–40";
      $("#f-price-label", form).textContent = c.charity ? "Amount" : "Regular price";
      $("#f-sale-box", form).style.display = c.charity ? "none" : "";
      $("#f-sale-field", form).style.display = $("#f-onsale", form).checked ? "" : "none";
    };
    $("#f-cat", form).addEventListener("change", sync);
    $("#f-onsale", form).addEventListener("change", () => {
      sync();
      if ($("#f-onsale", form).checked) $("#f-sale", form).focus();
    });
    sync();

    // Photo + auto-fill from a store link.
    const setPhoto = (url) => {
      $("#f-image", form).value = url || "";
      $("#f-photo-img", form).src = url || "";
      $("#f-photo", form).hidden = !url;
    };
    $("#f-photo-img", form).addEventListener("error", () => setPhoto(""));
    $("#f-photo-remove", form).addEventListener("click", () => setPhoto(""));
    let lastFilled = item.link || "";
    const fill = async (manual) => {
      const status = $("#f-fill-status", form);
      const link = normalizeLink($("#f-link", form).value);
      if (!link) {
        if (manual) status.textContent = "Paste a store link first.";
        return;
      }
      if (!manual && link === lastFilled) return;
      lastFilled = link;
      status.textContent = "✨ Looking up that link…";
      $("#f-fill", form).disabled = true;
      try {
        const d = await api.preview(link);
        // Stores that block us return a generic page with no photo or price.
        if (!d || d.error || (!d.image && !d.price)) {
          status.textContent = `${linkHost(link)} didn't share its details, so please type them in.`;
          return;
        }
        const nameEl = $("#f-name", form);
        if (d.title && (!nameEl.value.trim() || manual)) nameEl.value = d.title;
        const priceEl = $("#f-price", form);
        // Stores sometimes show our server a foreign currency; only use dollar prices.
        if (d.price && d.price.startsWith("$") && (!priceEl.value.trim() || manual)) priceEl.value = d.price;
        if (d.image) setPhoto(d.image);
        status.textContent = `✨ Filled in from ${linkHost(link)}. Check the details look right.`;
      } catch {
        status.textContent = "Couldn't look that up right now. You can type the details in.";
      } finally {
        $("#f-fill", form).disabled = false;
      }
    };
    $("#f-fill", form).addEventListener("click", () => fill(true));
    $("#f-link", form).addEventListener("change", () => fill(false));
    $("#f-link", form).addEventListener("paste", () => setTimeout(() => fill(false), 50));
  }

  function profileForm(p, token) {
    openDialog(
      `<h2>Colors & sizes</h2>
      <div class="field"><label for="f-colors">Favorite colors</label>
        <input id="f-colors" name="colors" maxlength="300" placeholder="Sage green, navy, burgundy" value="${esc(p.colors || "")}">
        <span class="hint">Separate colors with commas.</span></div>
      <div class="sizes-grid">${SIZE_FIELDS.map(
        ([k, label]) => `<div class="field"><label for="s-${k}">${esc(label)}</label><input id="s-${k}" name="size-${k}" maxlength="40" value="${esc(p.sizes?.[k] || "")}"></div>`
      ).join("")}</div>
      <div class="dialog-actions">
        <button type="button" class="btn ghost" data-close>Cancel</button>
        <button type="submit" class="btn primary">Save</button>
      </div>`,
      async (f) => {
        const fd = new FormData(f);
        const sizes = {};
        SIZE_FIELDS.forEach(([k]) => {
          const v = String(fd.get("size-" + k) || "").trim();
          if (v) sizes[k] = v;
        });
        await api.saveProfile(token, String(fd.get("colors") || "").trim(), sizes);
        await load();
        render();
        toast("Saved");
      }
    );
  }

  // Ask who's shopping. Resolves to the shopper ({code,id,name,isNew}) or null.
  function shopperDialog() {
    return new Promise((resolve) => {
      let done = false;
      const finish = (v) => {
        done = true;
        resolve(v);
      };
      const askForName = () =>
        openDialog(
          `<h2>Who's shopping?</h2>
          <div class="field"><label for="f-giver">Your name</label>
            <input id="f-giver" name="giver" maxlength="60" placeholder="e.g. Grandma Sue" autocomplete="name" value="${esc(store.get("giftable.giver", ""))}" autofocus>
            <span class="hint">Other shoppers will see you claimed it, so nobody doubles up. The person whose list it is won't see it.</span></div>
          <p class="hint-line" style="margin:0 0 14px">Already have a shopper code? <button type="button" class="linklike" data-have-code>Use my code</button></p>
          <div class="dialog-actions">
            <button type="button" class="btn ghost" data-close>Cancel</button>
            <button type="submit" class="btn berry">Continue</button>
          </div>`,
          async (f) => {
            const name = String(new FormData(f).get("giver") || "").trim();
            if (!name) {
              toast("Please enter your name");
              return false;
            }
            const sh = await api.shopperStart(name);
            store.set("giftable.shopper", { code: sh.code, id: sh.id, name: sh.name });
            store.set("giftable.giver", sh.name);
            finish({ ...sh, isNew: true });
          }
        );
      askForName();
      $("[data-have-code]", dialog).addEventListener("click", () => {
        codeDialog().then((sh) => finish(sh ? { ...sh, isNew: false } : null));
      });
      dialog.addEventListener("close", () => setTimeout(() => !done && !dialog.open && finish(null), 0), { once: true });
    });
  }

  function codeDialog() {
    return new Promise((resolve) => {
      let done = false;
      openDialog(
        `<h2>Use your shopper code</h2>
        <div class="field"><label for="f-code">Shopper code</label>
          <input id="f-code" name="code" maxlength="20" placeholder="e.g. SUE-7K4PX" autocapitalize="characters" autocorrect="off" spellcheck="false" autofocus>
          <span class="hint">You got this code the first time you claimed a gift. It's also on My shopping list on that device.</span></div>
        <div class="dialog-actions">
          <button type="button" class="btn ghost" data-close>Cancel</button>
          <button type="submit" class="btn primary">Continue</button>
        </div>`,
        async (f) => {
          const code = String(new FormData(f).get("code") || "").trim();
          if (!code) {
            toast("Enter your shopper code");
            return false;
          }
          const sh = await api.shopperGet(code);
          if (!sh) {
            toast("We couldn't find that code. Check it and try again.");
            return false;
          }
          store.set("giftable.shopper", { code: sh.code, id: sh.id, name: sh.name });
          store.set("giftable.giver", sh.name);
          done = true;
          resolve(sh);
          toast(`Welcome back, ${sh.name}!`);
        }
      );
      dialog.addEventListener("close", () => !done && resolve(null), { once: true });
    });
  }

  function showCodeDialog(sh) {
    openDialog(
      `<h2>Your shopper code</h2>
      <p>Hang on to this code. Enter it on any other phone or computer to see your shopping list there.</p>
      <div class="code big">${esc(sh.code)}</div>
      <p class="hint-line">You can always find it again on <strong>My shopping list</strong>.</p>
      <div class="dialog-actions">
        <button type="button" class="btn" data-copy-code>Copy code</button>
        <button type="submit" class="btn primary">Got it</button>
      </div>`,
      async () => {}
    );
    $("[data-copy-code]", dialog).addEventListener("click", () => copyText(sh.code));
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied");
    } catch {
      window.prompt("Copy this:", text);
    }
  }

  function askName() {
    return new Promise((resolve) => {
      let answered = false;
      openDialog(
        `<h2>Who's giving?</h2>
        <div class="field"><label for="f-giver">Your name</label>
          <input id="f-giver" name="giver" maxlength="60" placeholder="e.g. Grandma Sue" autocomplete="name" autofocus>
          <span class="hint">Other givers will see you claimed it, so nobody doubles up. The person whose list it is won't see it.</span></div>
        <div class="dialog-actions">
          <button type="button" class="btn ghost" data-close>Cancel</button>
          <button type="submit" class="btn berry">Continue</button>
        </div>`,
        async (f) => {
          const name = String(new FormData(f).get("giver") || "").trim();
          if (!name) {
            toast("Please enter your name");
            return false;
          }
          store.set("giftable.giver", name);
          answered = true;
          resolve(name);
        }
      );
      dialog.addEventListener("close", () => !answered && resolve(null), { once: true });
    });
  }

  function loginForm(presetSlug) {
    const opts = state.people
      .map((p) => `<option value="${esc(p.slug)}" ${p.slug === presetSlug ? "selected" : ""}>${esc(p.name)}</option>`)
      .join("");
    openDialog(
      `<h2>Log in</h2>
      <div class="field"><label for="f-who">Who are you?</label>
        <select id="f-who" name="who" ${presetSlug ? "" : "autofocus"}>${presetSlug ? "" : `<option value="">Choose your name</option>`}${opts}</select></div>
      <div class="field"><label for="f-pw">Password</label>
        <input id="f-pw" name="pw" type="password" autocomplete="current-password" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="60" ${presetSlug ? "autofocus" : ""}>
        <span class="hint">Forgot it? Ask a parent to reset it.</span></div>
      <div class="dialog-actions">
        <button type="button" class="btn ghost" data-close>Cancel</button>
        <button type="submit" class="btn primary">Log in</button>
      </div>`,
      async (f) => {
        const fd = new FormData(f);
        const slug = String(fd.get("who") || "");
        const pw = String(fd.get("pw") || "");
        if (!slug) {
          toast("Choose your name");
          return false;
        }
        if (!pw.trim()) {
          toast("Enter your password");
          return false;
        }
        const res = await api.login(slug, pw);
        if (!res || !res.ok) {
          $("#f-pw", f).value = "";
          toast((res && res.error) || "Wrong password. Try again.");
          return false;
        }
        const t = tokens();
        t[slug] = res.token;
        store.set("giftable.tokens", t);
        verified[slug + res.token] = true;
        const target = `#/${slug}/edit`;
        if (location.hash === target) render();
        else location.hash = target;
        const p = personBySlug(slug);
        toast(`Welcome, ${p ? p.name : ""}!`);
      }
    );
  }

  function passwordForm(token) {
    openDialog(
      `<h2>Change your password</h2>
      <div class="field"><label for="f-new">New password</label>
        <input id="f-new" name="pw" type="password" autocomplete="new-password" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="60" autofocus>
        <span class="hint">At least 4 characters. Capital letters don't matter.</span></div>
      <div class="field"><label for="f-again">Type it again</label>
        <input id="f-again" name="again" type="password" autocomplete="new-password" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="60"></div>
      <div class="dialog-actions">
        <button type="button" class="btn ghost" data-close>Cancel</button>
        <button type="submit" class="btn primary">Save password</button>
      </div>`,
      async (f) => {
        const fd = new FormData(f);
        const pw = normPassword(fd.get("pw"));
        if (pw.length < 4) {
          toast("Use at least 4 characters");
          return false;
        }
        if (pw !== normPassword(fd.get("again"))) {
          toast("Those don't match");
          return false;
        }
        await api.setPin(token, pw);
        toast("Password changed");
      }
    );
  }

  function confirmDelete(item, token) {
    openDialog(
      `<h2>Delete this gift?</h2><p>“${esc(item.name)}” will be removed from your list.</p>
      <div class="dialog-actions">
        <button type="button" class="btn ghost" data-close>Keep it</button>
        <button type="submit" class="btn berry">Delete</button>
      </div>`,
      async () => {
        await api.deleteItem(token, item.id);
        await load();
        render();
        toast("Deleted");
      }
    );
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  app.addEventListener("click", async (e) => {
    const el = e.target.closest("[data-action]");
    if (!el || el.tagName === "INPUT") return;
    const action = el.dataset.action;
    const r = route();
    const p = r.slug ? personBySlug(r.slug) : null;
    const item = el.dataset.id ? state.items.find((i) => i.id === el.dataset.id) : null;

    if (action === "retry") {
      state.error = null;
      state.loaded = false;
      return render();
    }
    if (action === "share-family") return share(familyLink(), "Giftable", "Our family Christmas wish lists 🎄");
    if (action === "share-person") {
      const sp = personBySlug(el.dataset.slug);
      return share(personLink(sp), `${sp.name}'s Giftable list`, `${sp.name}'s Christmas wish list 🎄`);
    }
    if (action === "add-item" && p) return itemForm(p, r.token, null, el.dataset.cat);
    if (action === "edit-item" && p && item) return itemForm(p, r.token, item);
    if (action === "delete-item" && p && item) return confirmDelete(item, r.token);
    if (action === "edit-profile" && p) return profileForm(p, r.token);
    if (action === "login") return loginForm(el.dataset.slug || (p && p.slug) || "");
    if (action === "change-pin" && p) return passwordForm(r.token);
    if (action === "logout" && p) {
      const t = tokens();
      delete t[p.slug];
      store.set("giftable.tokens", t);
      location.hash = "#/";
      return toast("Logged out");
    }

    if (action === "price") {
      store.set("giftable.maxPrice", Number(el.dataset.max) || 0);
      return render();
    }
    if (action === "ack-change" && item) {
      const acks = store.get("giftable.acks", {});
      acks[item.id] = item.updated_at;
      store.set("giftable.acks", acks);
      return render();
    }
    if (action === "toggle-top" && p && item) {
      el.disabled = true;
      try {
        await api.setTopPick(r.token, item.id, !item.top_pick);
        toast(item.top_pick ? "Removed from top picks" : "⭐ Added to your top picks");
      } catch (err) {
        toast(err.message);
      }
      await load();
      return render();
    }
    if (action === "copy-code") return copyText(shopper()?.code || "");
    if (action === "backup") return downloadBackup();
    if (action === "parent-logout") {
      store.set("giftable.admin", "");
      adminVerified = "";
      toast("Logged out of the parent dashboard");
      return render();
    }
    if (action === "enter-code") {
      const sh = await codeDialog();
      if (sh) render();
      return;
    }
    if (action === "switch-shopper") {
      store.set("giftable.shopper", null);
      toast("Switched. Enter your own shopper code or claim a gift to start.");
      return render();
    }
    if (action === "toggle-bought" && item) {
      const key = claimKeys()[item.id];
      const sh = shopper();
      if (!key && !sh) return;
      el.disabled = true;
      const nowBought = !state.claimInfo[item.id]?.bought;
      try {
        if (key) await api.markBought(item.id, key, nowBought);
        else await api.markBoughtAs(item.id, sh.code, nowBought);
        toast(nowBought ? "Marked as bought 🎁" : "Marked as not bought yet");
      } catch (err) {
        toast(err.message);
      }
      await load();
      return render();
    }

    if (action === "claim" && item) {
      let sh = shopper();
      if (!sh) {
        sh = await shopperDialog();
        if (!sh) return;
      }
      el.disabled = true;
      let ok = false;
      try {
        await api.claimAs(item.id, sh.code);
        ok = true;
        toast(`Claimed! You're getting “${item.name}”`);
      } catch (err) {
        toast(err.message);
      }
      await load();
      await render();
      if (ok && sh.isNew) showCodeDialog(sh);
      return;
    }
    if (action === "unclaim" && item) {
      const keys = claimKeys();
      const sh = shopper();
      el.disabled = true;
      try {
        if (keys[item.id]) await api.unclaim(item.id, keys[item.id]);
        else if (sh) await api.unclaimAs(item.id, sh.code);
        delete keys[item.id];
        store.set("giftable.claims", keys);
        toast("Released. Someone else can claim it now.");
      } catch (err) {
        toast(err.message);
      }
      await load();
      return render();
    }
  });

  app.addEventListener("submit", async (e) => {
    const form = e.target.closest("form[data-form]");
    if (!form) return;
    e.preventDefault();
    const fd = new FormData(form);
    const kind = form.dataset.form;
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    const token = store.get("giftable.admin", "");
    try {
      if (kind === "parent-login") {
        const res = await api.adminLogin(String(fd.get("pw") || ""));
        if (!res || !res.ok) {
          toast((res && res.error) || "Wrong parent password.");
          form.reset();
          return;
        }
        store.set("giftable.admin", res.token);
        adminVerified = res.token;
        return render();
      }
      if (kind === "reset-pw") {
        const slug = String(fd.get("slug"));
        await api.adminSetPassword(token, slug, String(fd.get("pw") || ""));
        form.reset();
        return toast(`Password updated for ${personBySlug(slug)?.name || slug}`);
      }
      if (kind === "add-person") {
        const name = String(fd.get("name") || "").trim();
        await api.adminAddPerson(token, name, String(fd.get("pw") || ""));
        await load();
        await render();
        return toast(`${name} has been added 🎄`);
      }
      if (kind === "parent-pw") {
        await api.adminChangePassword(token, String(fd.get("pw") || ""));
        form.reset();
        return toast("Parent password changed");
      }
    } catch (err) {
      toast(err.message);
    } finally {
      if (btn && btn.isConnected) btn.disabled = false;
    }
  });

  app.addEventListener("change", (e) => {
    if (e.target.matches('[data-action="toggle-hide"]')) {
      store.set("giftable.hideClaimed", e.target.checked);
      render();
    }
  });

  window.addEventListener("hashchange", () => {
    if (dialog.open) dialog.close();
    window.scrollTo(0, 0);
    render();
  });

  // Fresh data whenever someone comes back to the app.
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "visible" && state.loaded && !dialog.open) {
      await load();
      render();
    }
  });

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  render();
})();
