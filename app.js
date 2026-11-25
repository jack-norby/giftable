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
    { id: "charities", name: "Charities", emoji: "💝", charity: true, ex: "Local animal shelter" },
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
  const DEMO_KIDS = ["Jack", "Jillian", "Lila", "Etta"];

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
  };

  const demo = {
    db() {
      let d = store.get("giftable.demo", null);
      if (!d) {
        d = {
          people: DEMO_KIDS.map((name, i) => ({
            id: "p" + i, slug: name.toLowerCase(), name, colors: "", sizes: {}, sort: i, token: name.toLowerCase() + "-demo",
          })),
          items: [],
          claims: [],
        };
        store.set("giftable.demo", d);
      }
      return d;
    },
    save(d) { store.set("giftable.demo", d); },
    person(d, token) {
      const p = d.people.find((x) => x.token === token);
      if (!p) throw new Error("Invalid edit link");
      return p;
    },
    async getAll() {
      const d = this.db();
      return {
        people: d.people.map(({ token, ...p }) => p),
        items: d.items,
        claims: d.claims.map(({ item_id, claimed_by }) => ({ item_id, claimed_by })),
      };
    },
    async checkToken(slug, token) {
      return this.db().people.some((p) => p.slug === slug && p.token === token);
    },
    async saveItem(token, item) {
      const d = this.db();
      const p = this.person(d, token);
      if (!String(item.name || "").trim()) throw new Error("Item needs a name");
      if (item.id) {
        const existing = d.items.find((i) => i.id === item.id && i.person_id === p.id);
        if (!existing) throw new Error("Item not found");
        Object.assign(existing, item, { person_id: p.id });
      } else {
        d.items.push({ ...item, id: uid(), person_id: p.id, created_at: new Date().toISOString() });
      }
      this.save(d);
    },
    async deleteItem(token, id) {
      const d = this.db();
      const p = this.person(d, token);
      d.items = d.items.filter((i) => !(i.id === id && i.person_id === p.id));
      d.claims = d.claims.filter((c) => d.items.some((i) => i.id === c.item_id));
      this.save(d);
    },
    async saveProfile(token, colors, sizes) {
      const d = this.db();
      const p = this.person(d, token);
      p.colors = colors;
      p.sizes = sizes;
      this.save(d);
    },
    async claim(itemId, name) {
      const d = this.db();
      if (d.claims.some((c) => c.item_id === itemId)) throw new Error("Someone already claimed this gift");
      const key = uid();
      d.claims.push({ item_id: itemId, claimed_by: name, claim_key: key });
      this.save(d);
      return key;
    },
    async unclaim(itemId, key) {
      const d = this.db();
      const before = d.claims.length;
      d.claims = d.claims.filter((c) => !(c.item_id === itemId && c.claim_key === key));
      this.save(d);
      return d.claims.length < before;
    },
    async login(slug, pin) {
      const p = this.db().people.find((x) => x.slug === slug);
      if (!p || (p.pin || p.slug) !== normPassword(pin)) return { ok: false, error: "Wrong password. Try again. (Demo password is the name)" };
      return { ok: true, token: p.token };
    },
    async setPin(token, pin) {
      pin = normPassword(pin);
      if (pin.length < 4) throw new Error("Password needs at least 4 characters");
      const d = this.db();
      this.person(d, token).pin = pin;
      this.save(d);
    },
  };

  const api = DEMO ? demo : remote;

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const state = { people: [], items: [], claims: {}, loaded: false, error: null };

  async function load() {
    try {
      const data = await api.getAll();
      state.people = data.people || [];
      state.items = data.items || [];
      state.claims = Object.fromEntries((data.claims || []).map((c) => [c.item_id, c.claimed_by]));
      state.loaded = true;
      state.error = null;
    } catch (e) {
      state.error = e.message;
    }
  }

  const personBySlug = (slug) => state.people.find((p) => p.slug === slug);
  const itemsFor = (p) =>
    state.items
      .filter((i) => i.person_id === p.id)
      .sort((a, b) => (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1) || String(a.created_at).localeCompare(String(b.created_at)));
  const isMine = (p) => Boolean(tokens()[p.slug]);
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
    if (parts[1] === "edit") return { view: "edit", slug: parts[0], token: parts[2] || tokens()[parts[0]] || "" };
    return { view: "list", slug: parts[0] };
  }

  let rendering = 0;
  async function render() {
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
    DEMO ? `<div class="banner"><strong>Demo mode.</strong> Changes are saved only on this device until the database is connected.</div>` : "";

  // ---------------------------------------------------------------------------
  // Family page
  // ---------------------------------------------------------------------------
  function renderHome() {
    const mine = state.people.filter(isMine);
    const cards = state.people
      .map((p) => {
        const items = itemsFor(p);
        let meta = items.length ? `${items.length} gift idea${items.length === 1 ? "" : "s"}` : "No ideas yet";
        if (items.length && !isMine(p)) {
          const open = items.filter((i) => !state.claims[i.id]).length;
          meta += ` · ${open} available`;
        }
        return `<a class="person" href="#/${esc(p.slug)}">
          <div class="avatar" style="background:${avatarColor(p)}">${esc(p.name[0] || "?")}</div>
          <h2>${esc(p.name)}</h2><div class="meta">${meta}</div></a>`;
      })
      .join("");

    app.innerHTML = `<div class="wrap">
      ${demoBanner()}
      <section class="hero">
        <h1>Giftable</h1>
        <p>Our family's Christmas wish lists. Pick a person to see what they'd love, and claim a gift so nobody doubles up.</p>
      </section>
      <div class="share-row" style="margin:0 0 20px">${mine.length
        ? mine.map((p) => `<a class="btn primary" href="#/${esc(p.slug)}/edit">✏️ Edit my list${mine.length > 1 ? ` (${esc(p.name)})` : ""}</a>`).join("")
        : `<button class="btn primary" data-action="login">🔑 Log in to edit your list</button>`}</div>
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
          <li>Tip: use your browser's <strong>Share → Add to Home Screen</strong> to keep Giftable like an app.</li>
        </ol>
      </section>
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
    const myKey = claimKeys()[item.id];
    const pr = PRIORITIES.find(([k]) => k === item.priority) || PRIORITIES[1];
    const tags = [`<span class="tag p-${pr[0]}">${pr[1]}</span>`];
    if (item.size) tags.push(`<span class="tag">Size: ${esc(item.size)}</span>`);
    if (item.color) tags.push(`<span class="tag">Color: ${esc(item.color)}</span>`);
    const href = normalizeLink(item.link);
    const linkBtn = href
      ? `<a class="btn small" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${cat.charity ? "Donate page" : "View item"} ↗ <span style="font-weight:400;color:var(--muted)">${esc(linkHost(href))}</span></a>`
      : "";

    let actions = "";
    if (mode === "edit") {
      actions = `${linkBtn}<span class="spacer" style="flex:1"></span>
        <button class="btn small" data-action="edit-item" data-id="${esc(item.id)}">Edit</button>
        <button class="btn small ghost" data-action="delete-item" data-id="${esc(item.id)}">Delete</button>`;
    } else if (mode === "own") {
      actions = linkBtn;
    } else if (claimedBy && myKey) {
      actions = `${linkBtn}<span class="claim-note">✅ <strong>You're getting this</strong></span>
        <button class="btn small ghost" data-action="unclaim" data-id="${esc(item.id)}">Undo</button>`;
    } else if (claimedBy) {
      actions = `${linkBtn}<span class="claim-note">🎁 Claimed by <strong>${esc(claimedBy)}</strong></span>`;
    } else {
      actions = `${linkBtn}<button class="btn small berry" data-action="claim" data-id="${esc(item.id)}">${cat.charity ? "I'll donate" : "I'll get this"}</button>`;
    }

    const showClaimed = mode === "give" && claimedBy;
    return `<article class="item${showClaimed ? " claimed" : ""}">
      <div class="item-top"><h3>${esc(item.name)}</h3>${item.price ? `<span class="price">${esc(item.price)}</span>` : ""}</div>
      <div class="tags">${tags.join("")}</div>
      ${item.notes ? `<p class="notes">${esc(item.notes)}</p>` : ""}
      <div class="item-actions">${actions}</div>
    </article>`;
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
    const items = hideClaimed ? all.filter((i) => !state.claims[i.id] || claimKeys()[i.id]) : all;
    const open = all.filter((i) => !state.claims[i.id]).length;

    app.innerHTML = `<div class="wrap">
      ${topbar(true)}
      ${demoBanner()}
      <div class="list-head">
        <div class="avatar" style="background:${avatarColor(p)}">${esc(p.name[0] || "?")}</div>
        <div><h1>${esc(p.name)}'s list</h1>
        <div class="sub">${all.length} gift idea${all.length === 1 ? "" : "s"}${own ? "" : ` · ${open} still available`}</div></div>
      </div>
      ${own ? `<div class="private">This is <strong>your</strong> list, so claims are hidden to keep the surprise.
        <div style="margin-top:10px"><a class="btn small primary" href="#/${esc(p.slug)}/edit">✏️ Edit my list</a></div></div>` : ""}
      ${profileBlock(p)}
      <div class="toolbar">
        ${own ? "" : `<label class="toggle"><input type="checkbox" data-action="toggle-hide" ${hideClaimed ? "checked" : ""}> Hide claimed gifts</label>`}
        <span class="spacer"></span>
        <button class="btn small" data-action="share-person" data-slug="${esc(p.slug)}">Share ${esc(p.name)}'s list</button>
      </div>
      ${all.length ? categorySections(items, own ? "own" : "give") || `<div class="empty">Every gift has been claimed. 🎉</div>`
        : `<div class="empty">${esc(p.name)} hasn't added anything yet. Check back soon!</div>`}
    </div>`;
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
      <div class="list-head">
        <div class="avatar" style="background:${avatarColor(p)}">${esc(p.name[0] || "?")}</div>
        <div><h1>Hi ${esc(p.name)}!</h1><div class="sub">Add what you'd love this Christmas.</div></div>
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
      ${items.length ? categorySections(items, "edit") : `<div class="empty" style="margin-top:20px">Your list is empty. Tap a category above or <strong>Add a gift</strong> to start.</div>`}
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
    dialog.showModal();
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
        <input id="f-link" name="link" type="url" inputmode="url" placeholder="Paste a link to the store page" value="${esc(item.link || "")}"></div>
      <div class="row">
        <div class="field"><label for="f-price">Price <span class="hint">(optional)</span></label>
          <input id="f-price" name="price" maxlength="40" placeholder="$25 or $20–40" value="${esc(item.price || "")}"></div>
        <div class="field"><label>How much do you want it?</label>
          <div class="seg">${PRIORITIES.map(([k, label]) => `<input type="radio" name="priority" id="pr-${k}" value="${k}" ${item.priority === k ? "checked" : ""}><label for="pr-${k}">${label}</label>`).join("")}</div></div>
      </div>
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
        const payload = {
          category: cat.id,
          name,
          link,
          price: String(fd.get("price") || "").trim(),
          priority: String(fd.get("priority") || "like"),
          size: cat.sized ? String(fd.get("size") || "").trim() : "",
          color: cat.sized ? String(fd.get("color") || "").trim() : "",
          notes: String(fd.get("notes") || "").trim(),
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
    };
    $("#f-cat", form).addEventListener("change", sync);
    sync();
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

    if (action === "claim" && item) {
      const name = store.get("giftable.giver", "") || (await askName());
      if (!name) return;
      el.disabled = true;
      try {
        const key = await api.claim(item.id, name);
        const keys = claimKeys();
        keys[item.id] = key;
        store.set("giftable.claims", keys);
        toast(`Claimed! You're getting “${item.name}”`);
      } catch (err) {
        toast(err.message);
      }
      await load();
      return render();
    }
    if (action === "unclaim" && item) {
      const keys = claimKeys();
      el.disabled = true;
      try {
        await api.unclaim(item.id, keys[item.id]);
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
