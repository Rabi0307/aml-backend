// netlify/functions/match.js
// AML Screening Serverless Proxy — v5
// Implements: fail-safe error handling per compliance guide

const OS_BASE = “https://api.opensanctions.org”;

const CORS = {
“Access-Control-Allow-Origin”: “*”,
“Access-Control-Allow-Headers”: “Content-Type”,
“Content-Type”: “application/json”,
};

exports.handler = async (event) => {
if (event.httpMethod === “OPTIONS”) {
return { statusCode: 200, headers: CORS, body: “” };
}
if (event.httpMethod !== “POST”) {
return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: “Method not allowed” }) };
}

let body;
try {
body = JSON.parse(event.body || “{}”);
} catch {
return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: “Invalid JSON body” }) };
}

const { action } = body;

try {
/* ── /match with logic-v2 ── */
if (action === “match”) {
if (!body.payload) throw new Error(“No payload provided”);

```
  const resp = await fetch(
    `${OS_BASE}/match/default?algorithm=logic-v2&cutoff=0.1`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(body.payload),
    }
  );

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    // Log to Netlify logs
    console.error(`OpenSanctions /match returned ${resp.status}: ${txt}`);
    throw new Error(`OpenSanctions returned HTTP ${resp.status}`);
  }

  const data = await resp.json();
  return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, data }) };
}

/* ── Fetch full entity ── */
if (action === "entity") {
  if (!body.id) throw new Error("No entity ID provided");
  const resp = await fetch(`${OS_BASE}/entities/${encodeURIComponent(body.id)}`, {
    headers: { "Accept": "application/json" },
  });
  if (!resp.ok) throw new Error(`Entity fetch returned ${resp.status}`);
  const data = await resp.json();
  return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, data }) };
}

/* ── Search fallback (GET) ── */
if (action === "search") {
  if (!body.q) throw new Error("No query provided");
  const url = `${OS_BASE}/search/default?q=${encodeURIComponent(body.q)}&limit=20&fuzzy=true`;
  const resp = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!resp.ok) throw new Error(`Search returned ${resp.status}`);
  const data = await resp.json();
  return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, data }) };
}

throw new Error(`Unknown action: ${action}`);
```

} catch (err) {
console.error(`[AML function error] action=${action} — ${err.message}`);
// CRITICAL: Return structured error — never let frontend silently treat as “no match”
return {
statusCode: 500,
headers: CORS,
body: JSON.stringify({
ok: false,
error: err.message,
// Frontend MUST show “Screening Failed — No Decision” on ok:false
}),
};
}
};
