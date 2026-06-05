// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SUPABASE_URL = 
"https://xosrquegrqkejbidxaan.supabase.co";

const SUPABASE_KEY = 
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvc3JxdWVncnFrZWpiaWR4YWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTQ1NTksImV4cCI6MjA5NTE5MDU1OX0.I9QZ4JRXHMReUS8uMnUZXo0LFp8eodYwwHqTbzV-o-M";

const HEADERS = { 
    "Content-Type": "application/json", 
    "apikey": SUPABASE_KEY, 
    "Authorization": `Bearer ${SUPABASE_KEY}`, 
    "Prefer": "return=representation", 
};

export const sb = {
  async get(table, params = "") {
    const r = await fetch(SUPABASE_URL + "/rest/v1/" + table + params, { 
        headers: HEADERS,
    });

    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  async post(table, body) {
    const r = await fetch(SUPABASE_URL + "/rest/v1/" + table, { 
        method: "POST", 
        headers: HEADERS, 
        body: JSON.stringify(body) 
    });

    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  async patch(table, id, body) {
    const r = await fetch(SUPABASE_URL + "/rest/v1/" + table + "?id=eq." + id, { 
        method: "PATCH", 
        headers: HEADERS, 
        body: JSON.stringify(body) 
    });

    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  
  async delete(table, id) {
    const r = await fetch(SUPABASE_URL + "/rest/v1/" + table + "?id=eq." + id, { 
        method: "DELETE", 
        headers: HEADERS 
    });
    
    if (!r.ok) throw new Error(await r.text());
    return true;
  },
};