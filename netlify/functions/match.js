// netlify/functions/match.js — v6
// Fixed: uses name field + firstName/lastName for better matching

const OS = “https://api.opensanctions.org”;
const HDR = {
“Access-Control-Allow-Origin”: “*”,
“Access-Control-Allow-Headers”: “Content-Type”,
“Content-Type”: “application/json”,
};

exports.handler = async (event) => {
if (event.httpMethod === “OPTIONS”) return { statusCode:200, headers:HDR, body:”” };
if (event.httpMethod !== “POST”) return { statusCode:405, headers:HDR, body:JSON.stringify({error:“Method not allowed”}) };

let body;
try { body = JSON.parse(event.body || “{}”); }
catch { return { statusCode:400, headers:HDR, body:JSON.stringify({error:“Invalid JSON”}) }; }

try {
if (body.action === “match”) {
const resp = await fetch(`${OS}/match/default?algorithm=logic-v2&cutoff=0.05`, {
method: “POST”,
headers: { “Content-Type”:“application/json”, “Accept”:“application/json” },
body: JSON.stringify(body.payload),
});
const txt = await resp.text();
if (!resp.ok) {
console.error(`OS match ${resp.status}: ${txt.slice(0,300)}`);
throw new Error(`OpenSanctions returned ${resp.status}: ${txt.slice(0,200)}`);
}
let data;
try { data = JSON.parse(txt); }
catch(e) { throw new Error(`Invalid JSON from OpenSanctions: ${txt.slice(0,200)}`); }
return { statusCode:200, headers:HDR, body:JSON.stringify({ok:true, data}) };
}

```
if (body.action === "entity") {
  const resp = await fetch(`${OS}/entities/${encodeURIComponent(body.id)}`, {
    headers: { "Accept":"application/json" }
  });
  const data = await resp.json();
  return { statusCode:200, headers:HDR, body:JSON.stringify({ok:true, data}) };
}

throw new Error(`Unknown action: ${body.action}`);
```

} catch(err) {
console.error(`[match fn] ${err.message}`);
return { statusCode:500, headers:HDR, body:JSON.stringify({ok:false, error:err.message}) };
}
};
