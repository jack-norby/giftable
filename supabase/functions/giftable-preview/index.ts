// Giftable link preview: given a store link, returns the product's name,
// photo and price so the wish-list form can fill them in.
// Deploy with "Verify JWT" turned OFF. Called as:  /functions/v1/giftable-preview?url=...
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0*39;|&apos;|&#x0*27;/gi, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).trim();

function meta(html: string, key: string): string {
  const k = key.replace(/[.*+?^$(){}|[\]\\]/g, "\\$&");
  const a = new RegExp("<meta[^>]+(?:property|name|itemprop)=[\"']" + k + "[\"'][^>]*content=[\"']([^\"']*)[\"']", "i").exec(html);
  if (a) return decode(a[1]);
  const b = new RegExp("<meta[^>]+content=[\"']([^\"']*)[\"'][^>]*(?:property|name|itemprop)=[\"']" + k + "[\"']", "i").exec(html);
  return b ? decode(b[1]) : "";
}

function fromJsonLd(html: string) {
  const out: { name?: string; image?: string; price?: string; currency?: string } = {};
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  const visit = (node: any) => {
    if (!node || typeof node !== "object" || out.name) return;
    if (Array.isArray(node)) return node.forEach(visit);
    if (node["@graph"]) visit(node["@graph"]);
    const t = node["@type"];
    if (t === "Product" || (Array.isArray(t) && t.includes("Product"))) {
      out.name = node.name;
      const img = node.image;
      out.image = typeof img === "string" ? img : Array.isArray(img) ? (typeof img[0] === "string" ? img[0] : img[0]?.url) : img?.url;
      let offers = node.offers;
      if (Array.isArray(offers)) offers = offers[0];
      if (offers) {
        const p = offers.price ?? offers.lowPrice ?? offers.priceSpecification?.price;
        if (p != null) out.price = String(p);
        out.currency = offers.priceCurrency;
      }
    }
  };
  while ((m = re.exec(html))) {
    try { visit(JSON.parse(m[1].trim())); } catch { /* ignore bad JSON */ }
  }
  return out;
}

function formatPrice(p: string, currency?: string) {
  const n = Number(String(p).replace(/[^0-9.]/g, ""));
  if (!isFinite(n) || n <= 0) return "";
  const sym = !currency || currency === "USD" ? "$" : currency + " ";
  return sym + (Number.isInteger(n) ? String(n) : n.toFixed(2));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  let target: URL;
  try {
    target = new URL(new URL(req.url).searchParams.get("url") || "");
  } catch {
    return json({ error: "That link doesn't look right." }, 400);
  }
  const host = target.hostname.toLowerCase();
  if (!/^https?:$/.test(target.protocol) || host === "localhost" || /^[\d.]+$/.test(host) || host.includes(":") ||
      host.endsWith(".local") || host.endsWith(".internal")) {
    return json({ error: "That link doesn't look right." }, 400);
  }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(target, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    // Read at most ~1.5 MB of the page.
    let html = "";
    const reader = res.body?.getReader();
    const dec = new TextDecoder();
    while (reader && html.length < 1_500_000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += dec.decode(value, { stream: true });
    }
    reader?.cancel().catch(() => {});
    clearTimeout(timer);

    const ld = fromJsonLd(html);
    const titleTag = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "";
    const title = meta(html, "og:title") || meta(html, "twitter:title") || ld.name || decode(titleTag);
    let image = meta(html, "og:image") || meta(html, "og:image:secure_url") || meta(html, "twitter:image") || ld.image || "";
    const rawPrice = meta(html, "product:price:amount") || meta(html, "og:price:amount") || ld.price || meta(html, "price") || "";
    const currency = meta(html, "product:price:currency") || meta(html, "og:price:currency") || ld.currency;
    if (image) {
      try { image = new URL(image, res.url || target).href; } catch { image = ""; }
      if (!/^https?:/i.test(image)) image = "";
    }
    if (!title && !image) return json({ error: "That store didn't share its details. You can type them in." });
    return json({ title: title.slice(0, 200), image, price: rawPrice ? formatPrice(rawPrice, currency) : "" });
  } catch {
    return json({ error: "Couldn't reach that page. You can type the details in." });
  }
});
