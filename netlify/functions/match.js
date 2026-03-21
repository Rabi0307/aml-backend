// netlify/functions/match.js — v7
// Uses Node.js built-in https module — no fetch, works on ALL Node versions

const https = require(“https”);

const CORS = {
“Access-Control-Allow-Origin”: “*”,
“Access-Control-Allow-Headers”: “Content-Type”,
“Content-Type”: “application/json”,
};

function httpsRequest(options, postData) {
return new Promise((resolve, reject) => {
const req = https.request(options, (res) => {
let body = “”;
res.on(“data”, (chunk) => { body += chunk; });
res.on(“end”, () => { resolve({ status: res.statusCode, body }); });
});
req.on(“error”, reject);
req.setTimeout(15000, () => { req.destroy(new Error(“Timed out”)); });
if (postData) req.write(postData);
req.end();
});
}

exports.handler = async (event) => {
if (event.httpMethod === “OPTIONS”) return { statusCode: 200, headers: CORS, body: “” };
if (event.httpMethod !== “POST”) return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: “Method not allowed” }) };

let body;
try { body = JSON.parse(event.body || “{}”); }
catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: “Invalid JSON” }) }; }

try {
if (body.action === “match”) {
const postData = JSON.stringify(body.payload);
const result = await httpsRequest({
hostname: “api.opensanctions.org”,
path: “/match/default?algorithm=logic-v2&cutoff=0.05”,
method: “POST”,
headers: {
“Content-Type”: “application/json”,
“Accept”: “application/json”,
“Content-Length”: Buffer.byteLength(postData),
},
}, postData);

```
  console.log(`/match status: ${result.status}`);
  if (result.status !== 200) throw new Error(`OpenSanctions returned ${result.status}: ${result.body.slice(0,150)}`);

  const data = JSON.parse(result.body);
  return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, data }) };
}

if (body.action === "entity") {
  const result = await httpsRequest({
    hostname: "api.opensanctions.org",
    path: `/entities/${encodeURIComponent(body.id)}`,
    method: "GET",
    headers: { "Accept": "application/json" },
  });
  if (result.status !== 200) throw new Error(`Entity fetch returned ${result.status}`);
  return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, data: JSON.parse(result.body) }) };
}

throw new Error(`Unknown action: ${body.action}`);
```

} catch (err) {
console.error(`[match fn] ${err.message}`);
return { statusCode: 500, headers: CORS, body: JSON.stringify({ ok: false, error: err.message }) };
}
};
