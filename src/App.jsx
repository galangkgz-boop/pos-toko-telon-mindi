import { useState, useMemo, useCallback, useEffect } from "react";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://xosrquegrqkejbidxaan.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvc3JxdWVncnFrZWpiaWR4YWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTQ1NTksImV4cCI6MjA5NTE5MDU1OX0.I9QZ4JRXHMReUS8uMnUZXo0LFp8eodYwwHqTbzV-o-M";
const HEADERS = { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Prefer": "return=representation" };

const sb = {
  async get(table, params = "") {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, { headers: HEADERS });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async post(table, body) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: "POST", headers: HEADERS, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async patch(table, id, body) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: "PATCH", headers: HEADERS, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async delete(table, id) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: "DELETE", headers: HEADERS });
    if (!r.ok) throw new Error(await r.text());
    return true;
  },
};

// Seed produk awal jika tabel kosong
const SEED_PRODUCTS = [
  { name: "Minyak Telon Lang", category: "Minyak Telon", price: 25000, cost: 15000, stock: 48, unit: "botol", image: "🧴", active: true, discount: 0 },
  { name: "Minyak Telon Plus", category: "Minyak Telon", price: 32000, cost: 20000, stock: 30, unit: "botol", image: "🧴", active: true, discount: 10 },
  { name: "Minyak Kayu Putih Cap Gajah", category: "Minyak Kayu Putih", price: 18000, cost: 10000, stock: 60, unit: "botol", image: "🫙", active: true, discount: 0 },
  { name: "Minyak Kayu Putih Konicare", category: "Minyak Kayu Putih", price: 22000, cost: 13000, stock: 25, unit: "botol", image: "🫙", active: true, discount: 5 },
  { name: "Bedak Bayi Sweety", category: "Bedak Bayi", price: 15000, cost: 9000, stock: 40, unit: "pcs", image: "🌸", active: true, discount: 0 },
  { name: "Bedak Bayi Johnson's", category: "Bedak Bayi", price: 28000, cost: 17000, stock: 20, unit: "pcs", image: "🌸", active: true, discount: 0 },
  { name: "Sabun Bayi Cussons", category: "Sabun Bayi", price: 12000, cost: 7000, stock: 55, unit: "pcs", image: "🧼", active: true, discount: 0 },
  { name: "Pampers Sweety M-32", category: "Pampers", price: 85000, cost: 65000, stock: 15, unit: "pak", image: "👶", active: true, discount: 0 },
  { name: "Pampers Merries L-26", category: "Pampers", price: 95000, cost: 72000, stock: 10, unit: "pak", image: "👶", active: true, discount: 5 },
  { name: "Susu SGM 1+", category: "Susu Formula", price: 120000, cost: 90000, stock: 8, unit: "kaleng", image: "🥛", active: true, discount: 0 },
  { name: "Susu Bebelac 3", category: "Susu Formula", price: 145000, cost: 110000, stock: 6, unit: "kaleng", image: "🥛", active: true, discount: 0 },
  { name: "Vitamin Emulsio", category: "Vitamin", price: 35000, cost: 22000, stock: 22, unit: "botol", image: "💊", active: false, discount: 0 },
];

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 20 }) => {
  const icons = {
    dashboard: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    cashier: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M7 8h10M7 12h5"/></svg>,
    product: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    history: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    report: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    settings: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>,
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    search: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    cart: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    trending: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    edit: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    warehouse: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    tag: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    bar: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
    printer: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  };
  return icons[name] || null;
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (n) => "Rp " + n.toLocaleString("id-ID");
const fmtDate = (iso) => new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
const fmtTime = (iso) => new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Sora:wght@400;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #f0f4f8;
    --sidebar: #0f1923;
    --sidebar-hover: #1a2737;
    --sidebar-active: #1e6f5c;
    --primary: #1e6f5c;
    --primary-light: #29a385;
    --primary-soft: #e8f5f2;
    --accent: #f4a261;
    --danger: #e63946;
    --warning: #f4a261;
    --info: #4361ee;
    --success: #2dc653;
    --text: #1a2335;
    --text-muted: #64748b;
    --border: #e2e8f0;
    --card: #ffffff;
    --radius: 14px;
    --shadow: 0 2px 12px rgba(0,0,0,0.07);
    --shadow-md: 0 4px 24px rgba(0,0,0,0.10);
  }

  body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg); color: var(--text); }

  .app { display: flex; height: 100vh; overflow: hidden; }

  /* SIDEBAR */
  .sidebar {
    width: 240px; background: var(--sidebar); display: flex; flex-direction: column;
    padding: 0; position: relative; flex-shrink: 0; overflow-y: auto;
  }
  .sidebar-brand {
    padding: 24px 20px 20px; border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .sidebar-brand .store-name {
    font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 700;
    color: #fff; line-height: 1.2;
  }
  .sidebar-brand .store-sub { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 2px; }
  .sidebar-brand .brand-badge {
    width: 40px; height: 40px; background: var(--primary); border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; margin-bottom: 10px;
  }
  .sidebar-section { padding: 8px 12px; }
  .sidebar-label { font-size: 10px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 1.5px; padding: 8px 8px 4px; font-weight: 700; }
  .nav-item {
    display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px;
    cursor: pointer; color: rgba(255,255,255,0.55); font-size: 13.5px; font-weight: 500;
    transition: all 0.18s; margin-bottom: 2px; user-select: none;
  }
  .nav-item:hover { background: var(--sidebar-hover); color: rgba(255,255,255,0.85); }
  .nav-item.active { background: var(--sidebar-active); color: #fff; }
  .nav-item.sub { padding-left: 22px; font-size: 13px; }
  .nav-badge { margin-left: auto; background: var(--accent); color: #fff; font-size: 10px; padding: 2px 7px; border-radius: 20px; font-weight: 700; }

  /* MAIN */
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .topbar {
    background: var(--card); border-bottom: 1px solid var(--border);
    padding: 0 28px; height: 60px; display: flex; align-items: center; justify-content: space-between;
    flex-shrink: 0;
  }
  .topbar-title { font-family: 'Sora', sans-serif; font-size: 17px; font-weight: 700; color: var(--text); }
  .topbar-right { display: flex; align-items: center; gap: 14px; }
  .topbar-time { font-size: 12px; color: var(--text-muted); }
  .avatar { width: 34px; height: 34px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; font-weight: 700; }

  .content { flex: 1; overflow-y: auto; padding: 24px 28px; }

  /* CARDS */
  .card { background: var(--card); border-radius: var(--radius); box-shadow: var(--shadow); padding: 20px; }
  .card-title { font-size: 13px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }

  /* STAT CARDS */
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .stat-card { background: var(--card); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow); position: relative; overflow: hidden; }
  .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
  .stat-card.green::before { background: var(--primary); }
  .stat-card.orange::before { background: var(--accent); }
  .stat-card.blue::before { background: var(--info); }
  .stat-card.red::before { background: var(--danger); }
  .stat-label { font-size: 11.5px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; }
  .stat-value { font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 700; color: var(--text); margin: 6px 0 2px; }
  .stat-sub { font-size: 12px; color: var(--text-muted); }
  .stat-icon { position: absolute; top: 16px; right: 16px; width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
  .stat-card.green .stat-icon { background: var(--primary-soft); color: var(--primary); }
  .stat-card.orange .stat-icon { background: #fff4ec; color: var(--accent); }
  .stat-card.blue .stat-icon { background: #eef0fd; color: var(--info); }
  .stat-card.red .stat-icon { background: #fdecea; color: var(--danger); }

  /* GRID LAYOUTS */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }

  /* TABLES */
  table { width: 100%; border-collapse: collapse; }
  th { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.8px; padding: 10px 14px; text-align: left; border-bottom: 1px solid var(--border); }
  td { padding: 12px 14px; font-size: 13.5px; border-bottom: 1px solid var(--border); }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #f8fafc; }
  .table-wrap { overflow-x: auto; }

  /* BADGES */
  .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 600; }
  .badge-green { background: #e8f5f2; color: var(--primary); }
  .badge-orange { background: #fff4ec; color: var(--accent); }
  .badge-red { background: #fdecea; color: var(--danger); }
  .badge-blue { background: #eef0fd; color: var(--info); }
  .badge-gray { background: #f1f5f9; color: var(--text-muted); }

  /* BUTTONS */
  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 10px; font-size: 13.5px; font-weight: 600; cursor: pointer; border: none; transition: all 0.16s; font-family: inherit; }
  .btn-primary { background: var(--primary); color: #fff; }
  .btn-primary:hover { background: var(--primary-light); }
  .btn-outline { background: transparent; color: var(--text); border: 1.5px solid var(--border); }
  .btn-outline:hover { background: var(--bg); }
  .btn-danger { background: var(--danger); color: #fff; }
  .btn-sm { padding: 6px 12px; font-size: 12px; border-radius: 8px; }
  .btn-icon { padding: 8px; border-radius: 8px; border: 1.5px solid var(--border); background: transparent; cursor: pointer; display: flex; align-items: center; color: var(--text-muted); transition: all 0.15s; }
  .btn-icon:hover { background: var(--bg); color: var(--text); }

  /* INPUTS */
  .input { width: 100%; padding: 9px 14px; border: 1.5px solid var(--border); border-radius: 10px; font-size: 13.5px; font-family: inherit; color: var(--text); background: var(--card); transition: border 0.15s; outline: none; }
  .input:focus { border-color: var(--primary); }
  .input-group { position: relative; }
  .input-group .input { padding-left: 38px; }
  .input-group .input-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
  select.input { cursor: pointer; }
  label { font-size: 12.5px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 5px; }

  /* SEARCH BAR */
  .search-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }

  /* TOGGLE */
  .toggle { position: relative; display: inline-block; width: 40px; height: 22px; }
  .toggle input { opacity: 0; width: 0; height: 0; }
  .toggle-slider { position: absolute; cursor: pointer; inset: 0; background: #cbd5e0; border-radius: 22px; transition: 0.2s; }
  .toggle-slider:before { content: ''; position: absolute; width: 16px; height: 16px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.2s; }
  input:checked + .toggle-slider { background: var(--primary); }
  input:checked + .toggle-slider:before { transform: translateX(18px); }

  /* CASHIER */
  .cashier-layout { display: grid; grid-template-columns: 1fr 360px; gap: 20px; height: calc(100vh - 60px - 48px); }
  .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; overflow-y: auto; padding-right: 4px; }
  .product-card-pos {
    background: var(--card); border-radius: 12px; padding: 14px; cursor: pointer;
    transition: all 0.15s; border: 2px solid transparent; box-shadow: var(--shadow);
    display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px;
    user-select: none;
  }
  .product-card-pos:hover { border-color: var(--primary); transform: translateY(-2px); }
  .product-card-pos .emoji { font-size: 32px; }
  .product-card-pos .pname { font-size: 12.5px; font-weight: 600; color: var(--text); line-height: 1.3; }
  .product-card-pos .pprice { font-size: 12px; color: var(--primary); font-weight: 700; }
  .product-card-pos .pstock { font-size: 11px; color: var(--text-muted); }
  .product-card-pos.out-of-stock { opacity: 0.5; pointer-events: none; }

  .cart-panel { background: var(--card); border-radius: var(--radius); box-shadow: var(--shadow); display: flex; flex-direction: column; }
  .cart-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .cart-items { flex: 1; overflow-y: auto; padding: 12px; }
  .cart-item { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 10px; margin-bottom: 8px; background: var(--bg); }
  .cart-item-info { flex: 1; }
  .cart-item-name { font-size: 12.5px; font-weight: 600; }
  .cart-item-price { font-size: 12px; color: var(--text-muted); }
  .qty-ctrl { display: flex; align-items: center; gap: 6px; }
  .qty-btn { width: 26px; height: 26px; border-radius: 7px; border: 1.5px solid var(--border); background: var(--card); cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; font-weight: 700; transition: all 0.12s; }
  .qty-btn:hover { background: var(--primary); color: #fff; border-color: var(--primary); }
  .qty-num { font-size: 14px; font-weight: 700; min-width: 24px; text-align: center; }
  .cart-footer { padding: 16px 20px; border-top: 1px solid var(--border); }
  .cart-total-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; font-size: 13.5px; }
  .cart-total-row.grand { font-size: 16px; font-weight: 800; color: var(--primary); margin-top: 8px; padding-top: 10px; border-top: 2px dashed var(--border); }

  /* MODAL */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 999; backdrop-filter: blur(3px); }
  .modal { background: var(--card); border-radius: 18px; padding: 28px; width: 480px; max-width: 95vw; box-shadow: var(--shadow-md); max-height: 90vh; overflow-y: auto; }
  .modal-title { font-family: 'Sora', sans-serif; font-size: 18px; font-weight: 700; margin-bottom: 20px; }
  .form-row { margin-bottom: 14px; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

  /* CHART BARS */
  .bar-chart { display: flex; align-items: flex-end; gap: 8px; height: 120px; }
  .bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
  .bar { background: var(--primary); border-radius: 6px 6px 0 0; width: 100%; transition: height 0.3s; min-height: 4px; }
  .bar-label { font-size: 10px; color: var(--text-muted); }

  /* MINI CHART LINE */
  .sparkline { width: 100%; height: 50px; }

  /* PERIOD TABS */
  .period-tabs { display: flex; background: var(--bg); border-radius: 10px; padding: 3px; gap: 2px; }
  .period-tab { padding: 6px 14px; border-radius: 8px; font-size: 12.5px; font-weight: 600; cursor: pointer; color: var(--text-muted); transition: all 0.15s; }
  .period-tab.active { background: var(--card); color: var(--primary); box-shadow: 0 1px 4px rgba(0,0,0,0.08); }

  /* STATUS dot */
  .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }
  .dot-green { background: var(--success); }
  .dot-red { background: var(--danger); }
  .dot-orange { background: var(--warning); }

  /* ALERT */
  .alert { padding: 12px 16px; border-radius: 10px; font-size: 13px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
  .alert-success { background: #e8f5f2; color: var(--primary); border: 1px solid #c3e8de; }
  .alert-warning { background: #fff4ec; color: #c47a2e; border: 1px solid #fddcbc; }

  /* TOP PRODUCTS */
  .top-product-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); }
  .top-product-row:last-child { border-bottom: none; }
  .top-rank { width: 28px; height: 28px; border-radius: 8px; background: var(--primary-soft); color: var(--primary); font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .progress-bar { height: 6px; border-radius: 3px; background: var(--border); margin-top: 4px; overflow: hidden; }
  .progress-fill { height: 100%; background: var(--primary); border-radius: 3px; }

  /* RECEIPT */
  .receipt { font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.6; }
  .receipt-divider { border: none; border-top: 1px dashed #ccc; margin: 8px 0; }

  /* PAGE HEADER */
  .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
  .page-title { font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 700; }
  .page-subtitle { font-size: 13px; color: var(--text-muted); margin-top: 2px; }

  /* PRODUCT SUBMENU */
  .submenu-tabs { display: flex; gap: 4px; margin-bottom: 20px; flex-wrap: wrap; }
  .submenu-tab { padding: 7px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; color: var(--text-muted); background: var(--card); border: 1.5px solid var(--border); transition: all 0.15s; }
  .submenu-tab.active { background: var(--primary); color: #fff; border-color: var(--primary); }

  /* STOCK LOW */
  .stock-low { color: var(--danger); font-weight: 700; }
  .stock-ok { color: var(--success); font-weight: 700; }
  .stock-med { color: var(--warning); font-weight: 700; }

  /* SCROLLBAR */
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }

  /* EMPTY STATE */
  .empty { text-align: center; padding: 40px 20px; color: var(--text-muted); }
  .empty-icon { font-size: 40px; margin-bottom: 10px; }

  .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .section-title { font-size: 14px; font-weight: 700; color: var(--text); }

  /* PAYMENT SUCCESS */
  .payment-success { text-align: center; padding: 20px 0; }
  .success-icon { width: 64px; height: 64px; background: #e8f5f2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: var(--primary); }

.product-card-pos.in-cart {
  border-color: var(--primary);
  background: var(--primary-soft);
}

.mobile-cart-bar {
  display: none;
}

@media (max-width: 768px) {
  .mobile-cart-bar {
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: 12px;
    z-index: 998;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    background: var(--sidebar);
    color: #fff;
    padding: 12px 14px;
    border-radius: 16px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.25);
  }

  .mobile-cart-bar strong {
    font-size: 14px;
  }

  .mobile-cart-bar div div {
    font-size: 13px;
    color: rgba(255,255,255,0.75);
    margin-top: 2px;
  }

  .content {
    padding-bottom: 90px;
  }
}

@media print {
  body * {
    visibility: hidden !important;
  }

  #receipt-print,
  #receipt-print * {
    visibility: visible !important;
  }

  #receipt-print {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 58mm !important;
    padding: 0 !important;
    margin: 0 !important;
    background: white !important;
    color: black !important;
    box-shadow: none !important;
  }

  @page {
    size: 58mm auto;
    margin: 0;
  }
}
/* RESPONSIVE MOBILE */
@media (max-width: 768px) {
  .app {
    flex-direction: column;
    height: auto;
    min-height: 100vh;
    overflow: visible;
  }

  .sidebar {
    width: 100%;
    height: auto;
    max-height: none;
    padding: 0;
    overflow: visible;
  }

  .sidebar-brand {
    padding: 12px 14px 10px;
    text-align: center;
  }

  .sidebar-brand .brand-badge {
    width: 42px;
    height: 42px;
    margin: 0 auto 8px;
    font-size: 20px;
  }

  .sidebar-brand .store-name {
    font-size: 15px;
    line-height: 1.25;
    max-width: 320px;
    margin: 0 auto;
  }

  .sidebar-brand .store-sub {
    font-size: 11px;
    margin-top: 4px;
  }

  .sidebar-section {
    display: flex;
    overflow-x: auto;
    gap: 6px;
    padding: 8px 10px 10px;
    border-top: 1px solid rgba(255,255,255,0.06);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    -webkit-overflow-scrolling: touch;
  }

  .sidebar-section::-webkit-scrollbar {
    height: 3px;
  }

  .sidebar-label {
    display: none;
  }

  .nav-item {
    flex: 0 0 auto;
    min-width: auto;
    margin-bottom: 0;
    padding: 9px 12px;
    font-size: 13px;
    border-radius: 10px;
    gap: 7px;
  }

  .nav-item svg {
    width: 16px;
    height: 16px;
  }

  .nav-item span {
    white-space: nowrap;
  }

  .nav-badge {
    margin-left: 4px;
    padding: 2px 7px;
    font-size: 10px;
  }

  .sidebar > div:last-child {
    display: none;
  }

  .main {
    width: 100%;
    overflow: visible;
  }

  .topbar {
    height: auto;
    padding: 10px 14px;
    gap: 8px;
  }

  .topbar-title {
    font-size: 17px;
  }

  .topbar-time {
    font-size: 11px;
  }

  .topbar-right {
    gap: 8px;
  }

  .topbar .btn,
  .topbar button {
    padding: 8px 10px;
    font-size: 12px;
  }

  .avatar {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }

  .content {
    padding: 14px;
    overflow: visible;
  }

  .page-header {
    margin-bottom: 14px;
  }

  .page-title {
    font-size: 20px;
  }

  .page-subtitle {
    font-size: 12px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 16px;
  }

  .stat-card {
    padding: 16px;
    min-height: auto;
  }

  .stat-value {
    font-size: 24px;
  }

  .stat-label {
    font-size: 11px;
  }

  .stat-icon {
    width: 38px;
    height: 38px;
    top: 14px;
    right: 14px;
  }

  .grid-2,
  .grid-3 {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .card {
    padding: 16px;
    border-radius: 14px;
  }

  .cashier-layout {
    display: flex;
    flex-direction: column;
    height: auto;
    gap: 14px;
  }

  .product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    overflow: visible;
    padding-right: 0;
    gap: 10px;
  }

  .product-card-pos {
    padding: 12px;
    min-height: 120px;
  }

  .product-card-pos .emoji {
    font-size: 28px;
  }

  .product-card-pos .pname {
    font-size: 12px;
  }

  .cart-panel {
    width: 100%;
    min-height: auto;
  }

  .cart-items {
    max-height: 300px;
  }

  .search-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .search-bar .input-group,
  .search-bar .input,
  .search-bar button {
    width: 100% !important;
  }

  .submenu-tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 4px;
  }

  .submenu-tab {
    flex: 0 0 auto;
    font-size: 12px;
    padding: 7px 12px;
  }

  .table-wrap {
    overflow-x: auto;
  }

  table {
    min-width: 720px;
  }

  th,
  td {
    padding: 10px;
    font-size: 12px;
  }

  .modal {
    width: calc(100vw - 24px);
    padding: 18px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
`;

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ transactions, products }) {
  const today = new Date();
  const todayStr = today.toDateString();

  const todayTxns = transactions.filter(t => new Date(t.date).toDateString() === todayStr);
  const totalOmzetToday = todayTxns.reduce((s, t) => s + t.total, 0);
  const totalProfitToday = todayTxns.reduce((s, t) => s + t.profit, 0);
  const totalItemsToday = todayTxns.reduce((s, t) => s + t.items.reduce((a, i) => a + i.qty, 0), 0);

  const monthTxns = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });
  const monthOmzet = monthTxns.reduce((s, t) => s + t.total, 0);

  // Last 7 days chart
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dayTxns = transactions.filter(t => new Date(t.date).toDateString() === d.toDateString());
    return { label: d.toLocaleDateString("id-ID", { weekday: "short" }), value: dayTxns.reduce((s, t) => s + t.total, 0) };
  });
  const maxBar = Math.max(...last7.map(d => d.value), 1);

  // Top 5 products by qty sold
  const soldMap = {};
  transactions.forEach(t => t.items.forEach(i => { soldMap[i.name] = (soldMap[i.name] || 0) + i.qty; }));
  const topProducts = Object.entries(soldMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxSold = topProducts[0]?.[1] || 1;

  const lowStock = products.filter(p => p.stock <= 10 && p.active);
  const recentTxns = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">{today.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card green">
          <div className="stat-icon"><Icon name="trending" /></div>
          <div className="stat-label">Omzet Hari Ini</div>
          <div className="stat-value">{fmt(totalOmzetToday)}</div>
          <div className="stat-sub">{todayTxns.length} transaksi</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon"><Icon name="cart" /></div>
          <div className="stat-label">Transaksi</div>
          <div className="stat-value">{todayTxns.length}</div>
          <div className="stat-sub">hari ini</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon"><Icon name="bar" /></div>
          <div className="stat-label">Produk Terjual</div>
          <div className="stat-value">{totalItemsToday}</div>
          <div className="stat-sub">item hari ini</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon"><Icon name="tag" /></div>
          <div className="stat-label">Profit Bersih</div>
          <div className="stat-value">{fmt(totalProfitToday)}</div>
          <div className="stat-sub">hari ini</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="section-header">
            <div className="section-title">Omzet 7 Hari Terakhir</div>
          </div>
          <div className="bar-chart">
            {last7.map((d, i) => (
              <div key={i} className="bar-wrap">
                <div className="bar" style={{ height: `${(d.value / maxBar) * 100}%` }} title={fmt(d.value)} />
                <div className="bar-label">{d.label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)", textAlign: "right" }}>
            Omzet bulan ini: <strong style={{ color: "var(--primary)" }}>{fmt(monthOmzet)}</strong>
          </div>
        </div>

        <div className="card">
          <div className="section-header">
            <div className="section-title">🏆 Produk Terlaris</div>
          </div>
          {topProducts.map(([name, qty], i) => (
            <div key={i} className="top-product-row">
              <div className="top-rank">{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(qty / maxSold) * 100}%` }} />
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)" }}>{qty} terjual</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="section-header">
            <div className="section-title">⚠️ Stok Hampir Habis</div>
          </div>
          {lowStock.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "10px 0" }}>Semua stok aman ✅</div>
          ) : lowStock.map(p => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{p.image} {p.name}</div>
              <span className={`badge ${p.stock <= 5 ? "badge-red" : "badge-orange"}`}>{p.stock} {p.unit}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="section-header">
            <div className="section-title">🕐 Transaksi Terbaru</div>
          </div>
          {recentTxns.map(t => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>#{t.id.toString().padStart(4, "0")}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{fmtDate(t.date)} {fmtTime(t.date)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)" }}>{fmt(t.total)}</div>
                <span className="badge badge-gray">{t.payMethod}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CASHIER ─────────────────────────────────────────────────────────────────
function Cashier({ products, onTransaction, settings }) {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [payMethod, setPayMethod] = useState("Tunai");
  const [cashInput, setCashInput] = useState("");
  const [showPayModal, setShowPayModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastTxn, setLastTxn] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [catFilter, setCatFilter] = useState("Semua");

  const activeProducts = products.filter(p => p.active);
  const categories = ["Semua", ...Array.from(new Set(activeProducts.map(p => p.category)))];

const getCartQty = (productId) => {
  const found = cart.find(c => c.id === productId);
  return found ? Number(found.qty || 0) : 0;
};

const cartCount = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);

  const filtered = activeProducts.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "Semua" || p.category === catFilter;
    return matchSearch && matchCat;
  });

const addToCart = (p) => {
  setCart(prev => {
    const existing = prev.find(c => c.id === p.id);
    const currentQty = existing ? Number(existing.qty || 0) : 0;
    const stock = Number(p.stock || 0);

    if (currentQty >= stock) {
      alert("Stok " + p.name + " tidak cukup.");
      return prev;
    }

    if (existing) {
      return prev.map(c =>
        c.id === p.id ? { ...c, qty: c.qty + 1 } : c
      );
    }

    return [...prev, { ...p, qty: 1 }];
  });
};  

  const updateQty = (id, delta) => {
    setCart(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0);
      return updated;
    });
  };

  const subtotal = cart.reduce((s, c) => {
    const disc = c.discount || 0;
    return s + Math.round(c.price * c.qty * (1 - disc / 100));
  }, 0);
  const discountAmt = Math.round(subtotal * discount / 100);
  const total = subtotal - discountAmt;
  const cash = parseFloat(cashInput) || 0;
  const change = cash - total;

  const handlePay = () => {
    const txn = {
      id: Date.now(),
      date: new Date().toISOString(),
      items: cart.map(c => ({
        productId: c.id, name: c.name, qty: c.qty,
        price: c.price, discount: c.discount || 0,
        subtotal: Math.round(c.price * c.qty * (1 - (c.discount || 0) / 100))
      })),
      total, cost: cart.reduce((s, c) => s + c.cost * c.qty, 0),
      profit: total - cart.reduce((s, c) => s + c.cost * c.qty, 0),
      payMethod
    };
    txn.profit = txn.total - txn.cost;
    onTransaction(txn);
    setLastTxn(txn);
    setCart([]);
    setDiscount(0);
    setCashInput("");
    setShowPayModal(false);
    setShowSuccess(true);
  };

  if (showSuccess && lastTxn) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div className="card">
          <div className="payment-success">
            <div className="success-icon"><Icon name="check" size={32} /></div>
            <div style={{ fontFamily: "Sora", fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Transaksi Berhasil!</div>
            <div style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 20 }}>#{lastTxn.id.toString().padStart(6, "0")} · {lastTxn.payMethod}</div>
          </div>
         <div id="receipt-print" className="receipt">
            <div style={{ textAlign: "center", marginBottom: 8 }}>
             <strong>{settings?.store_name || "Agen Frozenfood"}</strong><br />
{settings?.store_address && (
  <>
    <span style={{ fontSize: 11 }}>{settings.store_address}</span><br />
  </>
)}
{settings?.store_phone && (
  <>
    <span style={{ fontSize: 11 }}>WA: {settings.store_phone}</span><br />
  </>
)}
<span style={{ fontSize: 11 }}>{fmtDate(lastTxn.date)} {fmtTime(lastTxn.date)}</span>
            </div>
            <hr className="receipt-divider" />
            {lastTxn.items.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{item.name} x{item.qty}{item.discount ? ` (-${item.discount}%)` : ""}</span>
                <span>{fmt(item.subtotal)}</span>
              </div>
            ))}
            <hr className="receipt-divider" />
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
              <span>TOTAL</span><span>{fmt(lastTxn.total)}</span>
            </div>
            {lastTxn.payMethod === "Tunai" && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Bayar</span><span>{fmt(cash)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Kembalian</span><span>{fmt(Math.max(0, cash - lastTxn.total))}</span></div>
              </>
            )}
            <hr className="receipt-divider" />
            <div style={{ textAlign: "center", fontSize: 11 }}>{settings?.receipt_footer || "Terima kasih sudah berbelanja"} kasih sudah berbelanja! 🌿</div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
  <button
    className="btn btn-outline"
    style={{ flex: 1 }}
    onClick={() => window.print()}
  >
    <Icon name="printer" /> Cetak Struk
  </button>

  <button
    className="btn btn-primary"
    style={{ flex: 1 }}
    onClick={() => setShowSuccess(false)}
  >
    <Icon name="plus" /> Transaksi Baru
  </button>
</div>
        </div>
      </div>
    );
  }

  return (
    <div className="cashier-layout">
      {/* PRODUCTS */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div className="input-group" style={{ flex: 1 }}>
            <span className="input-icon"><Icon name="search" size={15} /></span>
            <input className="input" placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" style={{ width: 160 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="product-grid">
         {filtered.map(p => {
  const inCart = getCartQty(p.id);
  const availableStock = Math.max(0, Number(p.stock || 0) - inCart);

  return (
    <div
      key={p.id}
      className={
  "product-card-pos" +
  (availableStock === 0 ? " out-of-stock" : "") +
  (inCart > 0 ? " in-cart" : "")
}
      onClick={() => availableStock > 0 && addToCart(p)}
    >
      <div className="emoji">{p.image}</div>
      <div className="pname">{p.name}</div>
      <div className="pprice">
        {fmt(p.discount ? Math.round(p.price * (1 - p.discount / 100)) : p.price)}
      </div>

      {p.discount > 0 && (
        <span className="badge badge-orange" style={{ fontSize: 10 }}>
          Diskon {p.discount}%
        </span>
      )}

      {inCart > 0 && (
        <span className="badge badge-green" style={{ fontSize: 10 }}>
          Di keranjang: {inCart}
        </span>
      )}

      <div className="pstock">
        Sisa: {availableStock} {p.unit}
      </div>
    </div>
  );
})} 

          {filtered.length === 0 && <div className="empty"><div className="empty-icon">🔍</div>Produk tidak ditemukan</div>}
        </div>
      </div>

      {/* CART */}
      <div id="cart-panel" className="cart-panel">
        <div className="cart-header">
          <div style={{ fontFamily: "Sora", fontWeight: 700, fontSize: 15 }}>🛒 Keranjang</div>
          {cart.length > 0 && (
            <button className="btn btn-sm btn-outline" onClick={() => setCart([])}>Kosongkan</button>
          )}
        </div>
        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty"><div className="empty-icon">🛒</div>Keranjang kosong</div>
          ) : cart.map(c => {
            const disc = c.discount || 0;
            const itemTotal = Math.round(c.price * c.qty * (1 - disc / 100));
            return (
              <div key={c.id} className="cart-item">
                <div>{c.image}</div>
                <div className="cart-item-info">
                  <div className="cart-item-name">{c.name}</div>
                  <div className="cart-item-price">{fmt(disc ? Math.round(c.price * (1 - disc / 100)) : c.price)} {disc > 0 && <span className="badge badge-orange" style={{ fontSize: 10 }}>-{disc}%</span>}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)" }}>{fmt(itemTotal)}</div>
                </div>
                <div className="qty-ctrl">
                  <button className="qty-btn" onClick={() => updateQty(c.id, -1)}>−</button>
                  <span className="qty-num">{c.qty}</span>
                  <button className="qty-btn" onClick={() => updateQty(c.id, 1)}>+</button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="cart-footer">
          <div className="form-row">
            <label>Diskon Tambahan (%)</label>
            <input className="input" type="number" min="0" max="100" value={discount} onChange={e => setDiscount(Number(e.target.value))} />
          </div>
          <div className="cart-total-row"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
          {discount > 0 && <div className="cart-total-row" style={{ color: "var(--danger)" }}><span>Diskon {discount}%</span><span>-{fmt(discountAmt)}</span></div>}
          <div className="cart-total-row grand"><span>TOTAL</span><span>{fmt(total)}</span></div>
          <button
            className="btn btn-primary" style={{ width: "100%", marginTop: 12, padding: "13px" }}
            disabled={cart.length === 0}
            onClick={() => setShowPayModal(true)}
          >
            <Icon name="cart" /> Bayar Sekarang
          </button>
        </div>
      </div>

{cart.length > 0 && (
  <div className="mobile-cart-bar">
    <div>
      <strong>{cartCount} item</strong>
      <div>{fmt(total)}</div>
    </div>
    <button
      className="btn btn-primary btn-sm"
      onClick={() => document.getElementById("cart-panel")?.scrollIntoView({ behavior: "smooth" })}
    >
      Lihat Keranjang
    </button>
  </div>
)}

      {showPayModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">💳 Pembayaran</div>
            <div style={{ marginBottom: 16, padding: "12px 16px", background: "var(--primary-soft)", borderRadius: 10 }}>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Total Tagihan</div>
              <div style={{ fontFamily: "Sora", fontSize: 26, fontWeight: 800, color: "var(--primary)" }}>{fmt(total)}</div>
            </div>
            <div className="form-row">
              <label>Metode Pembayaran</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["Tunai", "QRIS", "Transfer"].map(m => (
                  <button key={m} className={`btn ${payMethod === m ? "btn-primary" : "btn-outline"}`} onClick={() => setPayMethod(m)}>{m}</button>
                ))}
              </div>
            </div>
            {payMethod === "Tunai" && (
              <>
                <div className="form-row">
                  <label>Uang Diterima</label>
                  <input className="input" type="number" placeholder="Masukkan nominal uang..." value={cashInput} onChange={e => setCashInput(e.target.value)} autoFocus />
                </div>
                {cash > 0 && (
                  <div style={{ padding: "12px 16px", background: change >= 0 ? "#e8f5f2" : "#fdecea", borderRadius: 10, marginBottom: 12 }}>
                    <div style={{ fontSize: 13 }}>Kembalian: <strong style={{ fontSize: 18, color: change >= 0 ? "var(--primary)" : "var(--danger)" }}>{fmt(Math.abs(change))}</strong>
                      {change < 0 && <span style={{ fontSize: 12, color: "var(--danger)" }}> (Kurang)</span>}
                    </div>
                  </div>
                )}
              </>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowPayModal(false)}>Batal</button>
              <button
                className="btn btn-primary" style={{ flex: 1 }}
                disabled={payMethod === "Tunai" && (cash < total || !cashInput)}
                onClick={handlePay}
              >
                <Icon name="check" /> Bayar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
function Products({ products, setProducts, transactions }) {
  const [subMenu, setSubMenu] = useState("daftar");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ name: "", category: "", price: "", cost: "", stock: "", unit: "pcs", image: "🛍️", discount: 0, active: true });
  const [stockModal, setStockModal] = useState(null);
  const [stockAdj, setStockAdj] = useState({ type: "tambah", qty: "", cost: "", note: "" });

  const subMenus = [
    { id: "daftar", label: "📦 Daftar Produk" },
    { id: "stok", label: "📊 Manajemen Stok" },
    { id: "gudang", label: "🏭 Gudang" },
    { id: "diskon", label: "🏷️ Diskon Produk" },
    { id: "terjual", label: "📈 Produk Terjual" },
  ];

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => {
    setEditProduct(null);
    setForm({ name: "", category: "", price: "", cost: "", stock: "", unit: "pcs", image: "🛍️", discount: 0, active: true });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditProduct(p);
    setForm({ ...p });
    setShowModal(true);
  };

 const saveProduct = async () => {
  if (!form.name || !form.price) {
    alert("Nama produk dan harga jual wajib diisi");
    return;
  }

  const payload = {
    name: form.name,
    category: form.category || "",
    price: Number(form.price || 0),
    cost: Number(form.cost || 0),
    stock: Number(form.stock || 0),
    unit: form.unit || "pcs",
    image: form.image || "🛍️",
    discount: Number(form.discount || 0),
    active: form.active ?? true,
    stock_management: form.stock_management ?? false,
  };

  try {
    if (editProduct) {
      const [updatedProduct] = await sb.patch("products", editProduct.id, payload);

      setProducts(prev =>
        prev.map(p =>
          p.id === editProduct.id ? { ...p, ...updatedProduct } : p
        )
      );
    } else {
      const [newProduct] = await sb.post("products", [payload]);

      setProducts(prev => [...prev, newProduct]);
    }

    setShowModal(false);
    setEditProduct(null);
  } catch (err) {
    alert("Gagal menyimpan produk: " + err.message);
  }
};
const deleteProduct = async (id) => {
  const product = products.find(p => p.id === id);
  if (!product) return;

  const yakin = window.confirm(
    `Nonaktifkan produk "${product.name}"?\n\nProduk tidak akan muncul di kasir, tapi riwayat transaksi tetap aman.`
  );

  if (!yakin) return;

  try {
    await sb.patch("products", id, { active: false });

    setProducts(prev =>
      prev.map(p =>
        p.id === id ? { ...p, active: false } : p
      )
    );
  } catch (err) {
    alert("Gagal menonaktifkan produk: " + err.message);
  }
}; 
  const toggleActive = async (id) => {
  const product = products.find(p => p.id === id);
  if (!product) return;

  const newValue = !product.active;

  try {
    await sb.patch("products", id, { active: newValue });
    setProducts(prev => prev.map(p => p.id === id ? { ...p, active: newValue } : p));
  } catch (err) {
    alert("Gagal mengubah status aktif produk: " + err.message);
  }
};

const toggleStockManagement = async (id) => {
  const product = products.find(p => p.id === id);
  if (!product) return;

  const newValue = !product.stock_management;

  try {
    await sb.patch("products", id, { stock_management: newValue });
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock_management: newValue } : p));
  } catch (err) {
    alert("Gagal mengubah Manajemen Stok: " + err.message);
  }
};

 const adjustStock = async () => {
  const qty = Number(stockAdj.qty || 0);
  const cost = Number(stockAdj.cost || stockModal.cost || 0);

  if (!qty || qty <= 0) {
    alert("Jumlah stok harus lebih dari 0");
    return;
  }

  try {
    const currentStock = Number(stockModal.stock || 0);
    const newStock =
      stockAdj.type === "tambah"
        ? currentStock + qty
        : Math.max(0, currentStock - qty);

    // Kalau Manajemen Stok ON dan tambah stok,
    // buat batch FIFO baru di stock_batches
    if (stockModal.stock_management && stockAdj.type === "tambah") {
      await sb.post("stock_batches", {
        product_id: stockModal.id,
        qty_in: qty,
        qty_remaining: qty,
        cost: cost,
        received_at: new Date().toISOString(),
      });

      await sb.post("stock_movements", {
        product_id: stockModal.id,
        type: "IN",
        qty: qty,
        cost: cost,
        note: stockAdj.note || "Stok masuk FIFO",
      });
    }

    // Kalau Manajemen Stok ON dan stok dikurangi manual,
    // untuk sementara hanya catat adjustment.
    // FIFO keluar saat penjualan akan kita buat di langkah berikutnya.
    if (stockModal.stock_management && stockAdj.type === "kurang") {
      await sb.post("stock_movements", {
        product_id: stockModal.id,
        type: "ADJUSTMENT",
        qty: -qty,
        cost: cost,
        note: stockAdj.note || "Koreksi stok FIFO manual",
      });
    }

    // Update stok total di tabel products
    await sb.patch("products", stockModal.id, {
      stock: newStock,
      cost: cost,
    });

    setProducts(prev =>
      prev.map(p =>
        p.id === stockModal.id
          ? { ...p, stock: newStock, cost: cost }
          : p
      )
    );

    setStockModal(null);
    setStockAdj({ type: "tambah", qty: "", cost: "", note: "" });
  } catch (err) {
    alert("Gagal menyimpan stok: " + err.message);
  }
};

  // Sold data
  const soldMap = {};
  transactions.forEach(t => t.items.forEach(i => { soldMap[i.productId] = (soldMap[i.productId] || 0) + i.qty; }));

  // ── Render sub-menus
  const renderContent = () => {
    if (subMenu === "daftar") {
      return (
        <>
          <div className="search-bar">
            <div className="input-group" style={{ flex: 1 }}>
              <span className="input-icon"><Icon name="search" size={15} /></span>
              <input className="input" placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={openAdd}><Icon name="plus" /> Tambah Produk</button>
          </div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
  		<tr>
    <th>#</th>
    <th>Produk</th>
    <th>Kategori</th>
    <th>Harga Jual</th>
    <th>Harga Modal</th>
    <th>Stok</th>
    <th>Manajemen Stok</th>
    <th>Status</th>
    <th>Aksi</th>
  </tr>
</thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.id}>
                      <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                      <td><strong>{p.image} {p.name}</strong></td>
                      <td>{p.category}</td>
                      <td style={{ fontWeight: 700 }}>{fmt(p.price)}</td>
                      <td style={{ color: "var(--text-muted)" }}>{fmt(p.cost)}</td>
                      <td><span className={p.stock <= 5 ? "stock-low" : p.stock <= 15 ? "stock-med" : "stock-ok"}>{p.stock} {p.unit}</span></td>
                     <td>
  <label className="toggle">
    <input
      type="checkbox"
      checked={!!p.stock_management}
      onChange={() => toggleStockManagement(p.id)}
    />
    <span className="toggle-slider" />
  </label>
  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
    {p.stock_management ? "FIFO ON" : "Default"}
  </div>
</td>

<td>
  <label className="toggle">
    <input type="checkbox" checked={p.active} onChange={() => toggleActive(p.id)} />
    <span className="toggle-slider" />
  </label>
</td>

<td>
  <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn-icon" onClick={() => openEdit(p)}><Icon name="edit" size={14} /></button>
                          <button className="btn-icon" onClick={() => deleteProduct(p.id)} style={{ color: "var(--danger)" }}><Icon name="trash" size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      );
    }

    if (subMenu === "stok") {
      return (
        <div className="card">
          <div className="section-header">
            <div className="section-title">Manajemen Stok Produk</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Produk</th><th>Stok Saat Ini</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td><strong>{p.image} {p.name}</strong><br /><span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{p.category}</span></td>
                    <td>
                      <span style={{ fontSize: 16, fontWeight: 800, color: p.stock <= 5 ? "var(--danger)" : p.stock <= 15 ? "var(--warning)" : "var(--success)" }}>
                        {p.stock}
                      </span>
                      <span style={{ color: "var(--text-muted)", fontSize: 12 }}> {p.unit}</span>
                    </td>
                    <td>
                      <span className={`badge ${p.stock <= 5 ? "badge-red" : p.stock <= 15 ? "badge-orange" : "badge-green"}`}>
                        {p.stock <= 5 ? "Kritis" : p.stock <= 15 ? "Rendah" : "Aman"}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={() => setStockModal(p)}>Sesuaikan</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (subMenu === "gudang") {
      const byCategory = {};
      products.forEach(p => { byCategory[p.category] = byCategory[p.category] || []; byCategory[p.category].push(p); });
      return (
        <div>
          {Object.entries(byCategory).map(([cat, prods]) => (
            <div key={cat} className="card" style={{ marginBottom: 16 }}>
              <div className="section-header">
                <div className="section-title">🏷️ {cat}</div>
                <span className="badge badge-blue">{prods.length} produk</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                {prods.map(p => (
                  <div key={p.id} style={{ background: "var(--bg)", borderRadius: 10, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.image} {p.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                        <span className={`${p.stock <= 5 ? "stock-low" : p.stock <= 15 ? "stock-med" : "stock-ok"}`}>{p.stock}</span> {p.unit}
                      </div>
                    </div>
                    <span className={`badge ${p.active ? "badge-green" : "badge-gray"}`}>{p.active ? "Aktif" : "Nonaktif"}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (subMenu === "diskon") {
      return (
        <div className="card">
          <div className="section-header">
            <div className="section-title">Diskon Per Produk</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Produk</th><th>Harga Normal</th><th>Diskon</th><th>Harga Setelah Diskon</th><th>Ubah Diskon</th></tr></thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td><strong>{p.image} {p.name}</strong></td>
                    <td>{fmt(p.price)}</td>
                    <td>
                      {p.discount > 0 ? <span className="badge badge-orange">{p.discount}%</span> : <span className="badge badge-gray">Tidak ada</span>}
                    </td>
                    <td style={{ fontWeight: 700, color: "var(--primary)" }}>{fmt(Math.round(p.price * (1 - (p.discount || 0) / 100)))}</td>
                    <td>
                      <input
                        type="number" min="0" max="100"
                        value={p.discount || 0}
                        onChange={e => setProducts(prev => prev.map(x => x.id === p.id ? { ...x, discount: Number(e.target.value) } : x))}
                        style={{ width: 70, padding: "5px 8px", border: "1.5px solid var(--border)", borderRadius: 7, fontSize: 13, fontFamily: "inherit" }}
                      />
                      <span style={{ marginLeft: 4, fontSize: 13 }}>%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (subMenu === "terjual") {
      const soldData = products.map(p => ({ ...p, sold: soldMap[p.id] || 0, revenue: transactions.flatMap(t => t.items).filter(i => i.productId === p.id).reduce((s, i) => s + i.subtotal, 0) })).sort((a, b) => b.sold - a.sold);
      return (
        <div className="card">
          <div className="section-header">
            <div className="section-title">Produk Terjual (Semua Waktu)</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Produk</th><th>Qty Terjual</th><th>Total Omzet</th><th>Visual</th></tr></thead>
              <tbody>
                {soldData.map((p, i) => {
                  const maxS = soldData[0]?.sold || 1;
                  return (
                    <tr key={p.id}>
                      <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                      <td><strong>{p.image} {p.name}</strong></td>
                      <td style={{ fontWeight: 700 }}>{p.sold} {p.unit}</td>
                      <td style={{ fontWeight: 700, color: "var(--primary)" }}>{fmt(p.revenue)}</td>
                      <td style={{ width: 140 }}>
                        <div className="progress-bar"><div className="progress-fill" style={{ width: `${(p.sold / maxS) * 100}%` }} /></div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Produk</div>
          <div className="page-subtitle">{products.length} produk terdaftar</div>
        </div>
      </div>
      <div className="submenu-tabs">
        {subMenus.map(s => (
          <div key={s.id} className={`submenu-tab ${subMenu === s.id ? "active" : ""}`} onClick={() => setSubMenu(s.id)}>{s.label}</div>
        ))}
      </div>
      {renderContent()}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">{editProduct ? "✏️ Edit Produk" : "➕ Tambah Produk"}</div>
            <div className="form-row">
              <label>Nama Produk</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nama produk..." />
            </div>
            <div className="form-grid">
              <div>
                <label>Kategori</label>
                <input className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Kategori..." />
              </div>
              <div>
                <label>Satuan</label>
                <select className="input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                  {["pcs", "botol", "pak", "kaleng", "box", "lusin", "kg", "gram"].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="form-grid">
              <div>
                <label>Harga Jual</label>
                <input className="input" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div>
                <label>Harga Modal</label>
                <input className="input" type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} />
              </div>
            </div>
            <div className="form-grid">
              <div>
                <label>Stok Awal</label>
                <input className="input" type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
              </div>
              <div>
                <label>Diskon (%)</label>
                <input className="input" type="number" min="0" max="100" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} />
              </div>
            </div>
            <div className="form-row">
              <label>Emoji Ikon</label>
              <input className="input" value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} placeholder="Emoji produk..." />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveProduct}>
                <Icon name="check" /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {stockModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">📦 Sesuaikan Stok — {stockModal.name}</div>
            <div style={{ margin: "0 0 16px", padding: "12px 16px", background: "var(--bg)", borderRadius: 10 }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Stok Saat Ini</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{stockModal.stock} {stockModal.unit}</div>
            </div>
            <div className="form-row">
              <label>Jenis Penyesuaian</label>
              <div style={{ display: "flex", gap: 8 }}>
                <button className={`btn ${stockAdj.type === "tambah" ? "btn-primary" : "btn-outline"}`} onClick={() => setStockAdj(s => ({ ...s, type: "tambah" }))}>+ Tambah</button>
                <button className={`btn ${stockAdj.type === "kurang" ? "btn-danger" : "btn-outline"}`} onClick={() => setStockAdj(s => ({ ...s, type: "kurang" }))}>- Kurangi</button>
              </div>
            </div>
            <div className="form-row">
              <label>Jumlah</label>
              <input className="input" type="number" value={stockAdj.qty} onChange={e => setStockAdj(s => ({ ...s, qty: e.target.value }))} />
            </div>
<div className="form-row">
  <label>Harga Beli / Modal per Unit</label>
  <input
    className="input"
    type="number"
    value={stockAdj.cost || ""}
    onChange={e => setStockAdj(s => ({ ...s, cost: e.target.value }))}
    placeholder="Contoh: 32000"
  />
  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
    {stockModal?.stock_management
      ? "FIFO ON: harga ini akan disimpan sebagai modal batch baru."
      : "Default: harga ini akan menjadi harga beli produk."}
  </div>
</div>
            <div className="form-row">
              <label>Keterangan (opsional)</label>
              <input className="input" value={stockAdj.note} onChange={e => setStockAdj(s => ({ ...s, note: e.target.value }))} placeholder="Misalnya: terima barang dari supplier..." />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setStockModal(null)}>Batal</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={adjustStock}><Icon name="check" /> Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HISTORY (RIWAYAT PENJUALAN) ──────────────────────────────────────────────
function History({ transactions }) {
  const [period, setPeriod] = useState("hari");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [detail, setDetail] = useState(null);

  const now = new Date();

 const filtered = useMemo(() => {
  return transactions.filter(t => {
    const dateStr = new Date(t.date).toISOString().slice(0, 10);
    const selectedStr = selectedDate.slice(0, 10);

    if (period === "hari") {
      return dateStr === selectedStr;
    }

    if (period === "minggu") {
      const d = new Date(dateStr + "T00:00:00");
      const sel = new Date(selectedStr + "T00:00:00");

      const startOfWeek = new Date(sel);
      startOfWeek.setDate(sel.getDate() - sel.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      return d >= startOfWeek && d <= endOfWeek;
    }

    if (period === "bulan") {
      return dateStr.slice(0, 7) === selectedStr.slice(0, 7);
    }

    if (period === "tahun") {
      return dateStr.slice(0, 4) === selectedStr.slice(0, 4);
    }

    return true;
  });
}, [transactions, period, selectedDate]);

  const omzet = filtered.reduce((s, t) => s + t.total, 0);
  const profit = filtered.reduce((s, t) => s + t.profit, 0);
  const itemsSold = filtered.reduce((s, t) => s + t.items.reduce((a, i) => a + i.qty, 0), 0);

  const periods = [{ id: "hari", label: "Harian" }, { id: "minggu", label: "Mingguan" }, { id: "bulan", label: "Bulanan" }, { id: "tahun", label: "Tahunan" }];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Riwayat Penjualan</div>
          <div className="page-subtitle">{filtered.length} transaksi ditemukan</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div className="period-tabs">
            {periods.map(p => <div key={p.id} className={`period-tab ${period === p.id ? "active" : ""}`} onClick={() => setPeriod(p.id)}>{p.label}</div>)}
          </div>
        {(period === "hari" || period === "minggu") && (
  <input
    className="input"
    type="date"
    value={selectedDate}
    onChange={e => setSelectedDate(e.target.value)}
    style={{ width: 180 }}
  />
)}

{period === "bulan" && (
  <div style={{ display: "flex", gap: 8 }}>
    <select
      className="input"
      value={selectedDate.slice(5, 7)}
      onChange={e => {
        const year = selectedDate.slice(0, 4);
        setSelectedDate(`${year}-${e.target.value}-01`);
      }}
      style={{ width: 150 }}
    >
      <option value="01">Januari</option>
      <option value="02">Februari</option>
      <option value="03">Maret</option>
      <option value="04">April</option>
      <option value="05">Mei</option>
      <option value="06">Juni</option>
      <option value="07">Juli</option>
      <option value="08">Agustus</option>
      <option value="09">September</option>
      <option value="10">Oktober</option>
      <option value="11">November</option>
      <option value="12">Desember</option>
    </select>

    <select
      className="input"
      value={selectedDate.slice(0, 4)}
      onChange={e => {
        const month = selectedDate.slice(5, 7);
        setSelectedDate(`${e.target.value}-${month}-01`);
      }}
      style={{ width: 110 }}
    >
      {Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 3 + i).map(year => (
        <option key={year} value={year}>{year}</option>
      ))}
    </select>
  </div>
)}

{period === "tahun" && (
  <select
    className="input"
    value={selectedDate.slice(0, 4)}
    onChange={e => setSelectedDate(`${e.target.value}-01-01`)}
    style={{ width: 120 }}
  >
    {Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 3 + i).map(year => (
      <option key={year} value={year}>{year}</option>
    ))}
  </select>
)}
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card blue">
          <div className="stat-icon"><Icon name="cart" /></div>
          <div className="stat-label">Jumlah Transaksi</div>
          <div className="stat-value">{filtered.length}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><Icon name="trending" /></div>
          <div className="stat-label">Omzet</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{fmt(omzet)}</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon"><Icon name="product" /></div>
          <div className="stat-label">Produk Terjual</div>
          <div className="stat-value">{itemsSold}</div>
          <div className="stat-sub">item</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon"><Icon name="tag" /></div>
          <div className="stat-label">Profit Bersih</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{fmt(profit)}</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>No.</th><th>Tanggal & Waktu</th><th>Item</th><th>Total</th><th>Profit</th><th>Bayar</th><th>Detail</th></tr></thead>
            <tbody>
              {[...filtered].sort((a, b) => new Date(b.date) - new Date(a.date)).map((t, i) => (
                <tr key={t.id}>
                  <td style={{ color: "var(--text-muted)", fontWeight: 600 }}>#{t.id.toString().padStart(4, "0")}</td>
                  <td><div style={{ fontSize: 13 }}>{fmtDate(t.date)}</div><div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{fmtTime(t.date)}</div></td>
                  <td>{t.items.reduce((s, i) => s + i.qty, 0)} item</td>
                  <td style={{ fontWeight: 700, color: "var(--primary)" }}>{fmt(t.total)}</td>
                  <td style={{ fontWeight: 700, color: t.profit > 0 ? "var(--success)" : "var(--danger)" }}>{fmt(t.profit)}</td>
                  <td><span className={`badge ${t.payMethod === "Tunai" ? "badge-green" : t.payMethod === "QRIS" ? "badge-blue" : "badge-orange"}`}>{t.payMethod}</span></td>
                  <td><button className="btn btn-sm btn-outline" onClick={() => setDetail(t)}>Lihat</button></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: 30 }}>Tidak ada transaksi pada periode ini</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">🧾 Detail Transaksi #{detail.id.toString().padStart(4, "0")}</div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 14 }}>{fmtDate(detail.date)} pukul {fmtTime(detail.date)} · {detail.payMethod}</div>
            <table style={{ marginBottom: 14 }}>
              <thead><tr><th>Produk</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr></thead>
              <tbody>
                {detail.items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.name}{item.discount > 0 && <span className="badge badge-orange" style={{ marginLeft: 6, fontSize: 10 }}>-{item.discount}%</span>}</td>
                    <td>{item.qty}</td>
                    <td>{fmt(item.price)}</td>
                    <td style={{ fontWeight: 700 }}>{fmt(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: "12px 14px", background: "var(--bg)", borderRadius: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}><span>Total</span><strong>{fmt(detail.total)}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-muted)" }}><span>Modal</span><span>{fmt(detail.cost)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--success)", fontWeight: 700 }}><span>Profit</span><span>{fmt(detail.profit)}</span></div>
            </div>
            <button className="btn btn-outline" style={{ width: "100%", marginTop: 16 }} onClick={() => setDetail(null)}>Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────
function Reports({ transactions }) {
  const [tab, setTab] = useState("penjualan");
  const now = new Date();

  const tabs = [
    { id: "penjualan", label: "📋 Transaksi Penjualan" },
    { id: "omzet", label: "💰 Omzet Per Bulan" },
    { id: "profit", label: "📈 Laporan Profit" },
    { id: "produk", label: "🏆 Laporan Produk" },
  ];

  // Monthly data for current year
  const months = Array.from({ length: 12 }, (_, m) => {
    const txns = transactions.filter(t => new Date(t.date).getMonth() === m && new Date(t.date).getFullYear() === now.getFullYear());
    return {
      label: new Date(now.getFullYear(), m, 1).toLocaleDateString("id-ID", { month: "short" }),
      omzet: txns.reduce((s, t) => s + t.total, 0),
      profit: txns.reduce((s, t) => s + t.profit, 0),
      count: txns.length,
    };
  });

  const maxOmzet = Math.max(...months.map(m => m.omzet), 1);

  // Product report
  const prodMap = {};
  transactions.forEach(t => t.items.forEach(i => {
    if (!prodMap[i.name]) prodMap[i.name] = { sold: 0, revenue: 0 };
    prodMap[i.name].sold += i.qty;
    prodMap[i.name].revenue += i.subtotal;
  }));
  const prodReport = Object.entries(prodMap).sort((a, b) => b[1].revenue - a[1].revenue);

  // This month
  const thisMonth = transactions.filter(t => new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear());
  const totalOmzetYear = transactions.filter(t => new Date(t.date).getFullYear() === now.getFullYear()).reduce((s, t) => s + t.total, 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Laporan</div>
      </div>
      <div className="submenu-tabs">
        {tabs.map(t => <div key={t.id} className={`submenu-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</div>)}
      </div>

      {tab === "penjualan" && (
        <div>
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card green"><div className="stat-icon"><Icon name="trending" /></div><div className="stat-label">Omzet Bulan Ini</div><div className="stat-value" style={{ fontSize: 17 }}>{fmt(thisMonth.reduce((s, t) => s + t.total, 0))}</div></div>
            <div className="stat-card blue"><div className="stat-icon"><Icon name="cart" /></div><div className="stat-label">Transaksi Bulan Ini</div><div className="stat-value">{thisMonth.length}</div></div>
            <div className="stat-card orange"><div className="stat-icon"><Icon name="bar" /></div><div className="stat-label">Omzet Tahun Ini</div><div className="stat-value" style={{ fontSize: 17 }}>{fmt(totalOmzetYear)}</div></div>
            <div className="stat-card red"><div className="stat-icon"><Icon name="tag" /></div><div className="stat-label">Profit Tahun Ini</div><div className="stat-value" style={{ fontSize: 17 }}>{fmt(transactions.filter(t => new Date(t.date).getFullYear() === now.getFullYear()).reduce((s, t) => s + t.profit, 0))}</div></div>
          </div>
          <div className="card">
            <div className="section-header"><div className="section-title">Semua Transaksi (Bulan Ini)</div></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Tanggal</th><th>No. Transaksi</th><th>Item</th><th>Total</th><th>Modal</th><th>Profit</th><th>Metode Bayar</th></tr></thead>
                <tbody>
                  {[...thisMonth].sort((a, b) => new Date(b.date) - new Date(a.date)).map(t => (
                    <tr key={t.id}>
                      <td>{fmtDate(t.date)}</td>
                      <td style={{ fontWeight: 700 }}>#{t.id.toString().padStart(4, "0")}</td>
                      <td>{t.items.reduce((s, i) => s + i.qty, 0)}</td>
                      <td style={{ fontWeight: 700, color: "var(--primary)" }}>{fmt(t.total)}</td>
                      <td style={{ color: "var(--text-muted)" }}>{fmt(t.cost)}</td>
                      <td style={{ fontWeight: 700, color: "var(--success)" }}>{fmt(t.profit)}</td>
                      <td><span className={`badge ${t.payMethod === "Tunai" ? "badge-green" : t.payMethod === "QRIS" ? "badge-blue" : "badge-orange"}`}>{t.payMethod}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "omzet" && (
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="section-header"><div className="section-title">Omzet Per Bulan — {now.getFullYear()}</div></div>
            <div className="bar-chart" style={{ height: 160 }}>
              {months.map((m, i) => (
                <div key={i} className="bar-wrap">
                  <div className="bar" style={{ height: `${(m.omzet / maxOmzet) * 100}%`, background: i === now.getMonth() ? "var(--accent)" : "var(--primary)" }} title={fmt(m.omzet)} />
                  <div className="bar-label">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Bulan</th><th>Jumlah Transaksi</th><th>Omzet</th><th>Profit</th><th>Rata-rata per Transaksi</th></tr></thead>
                <tbody>
                  {months.map((m, i) => (
                    <tr key={i} style={{ background: i === now.getMonth() ? "var(--primary-soft)" : "" }}>
                      <td style={{ fontWeight: 600 }}>{m.label} {i === now.getMonth() && <span className="badge badge-orange">Sekarang</span>}</td>
                      <td>{m.count}</td>
                      <td style={{ fontWeight: 700, color: "var(--primary)" }}>{fmt(m.omzet)}</td>
                      <td style={{ fontWeight: 700, color: "var(--success)" }}>{fmt(m.profit)}</td>
                      <td style={{ color: "var(--text-muted)" }}>{m.count > 0 ? fmt(Math.round(m.omzet / m.count)) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "profit" && (
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="section-header"><div className="section-title">Profit per Bulan</div></div>
            <div className="bar-chart" style={{ height: 140 }}>
              {months.map((m, i) => {
                const maxP = Math.max(...months.map(x => x.profit), 1);
                return (
                  <div key={i} className="bar-wrap">
                    <div className="bar" style={{ height: `${(m.profit / maxP) * 100}%`, background: "var(--success)" }} title={fmt(m.profit)} />
                    <div className="bar-label">{m.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Bulan</th><th>Omzet</th><th>Modal (HPP)</th><th>Profit Bersih</th><th>Margin %</th></tr></thead>
                <tbody>
                  {months.map((m, i) => {
                    const modal = transactions.filter(t => new Date(t.date).getMonth() === i && new Date(t.date).getFullYear() === now.getFullYear()).reduce((s, t) => s + t.cost, 0);
                    const margin = m.omzet > 0 ? ((m.profit / m.omzet) * 100).toFixed(1) : 0;
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{m.label}</td>
                        <td style={{ color: "var(--primary)", fontWeight: 700 }}>{fmt(m.omzet)}</td>
                        <td style={{ color: "var(--text-muted)" }}>{fmt(modal)}</td>
                        <td style={{ color: "var(--success)", fontWeight: 700 }}>{fmt(m.profit)}</td>
                        <td><span className={`badge ${margin > 30 ? "badge-green" : margin > 15 ? "badge-orange" : "badge-red"}`}>{margin}%</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "produk" && (
        <div className="card">
          <div className="section-header"><div className="section-title">Performa Produk (Semua Waktu)</div></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Produk</th><th>Qty Terjual</th><th>Total Omzet</th><th>Porsi Omzet</th></tr></thead>
              <tbody>
                {prodReport.map(([name, data], i) => {
                  const totalRev = prodReport.reduce((s, [, d]) => s + d.revenue, 0);
                  const share = ((data.revenue / totalRev) * 100).toFixed(1);
                  return (
                    <tr key={i}>
                      <td style={{ color: "var(--text-muted)", fontWeight: 700 }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{name}</td>
                      <td>{data.sold} item</td>
                      <td style={{ fontWeight: 700, color: "var(--primary)" }}>{fmt(data.revenue)}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="progress-bar" style={{ flex: 1 }}>
                            <div className="progress-fill" style={{ width: `${share}%` }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, width: 40, textAlign: "right" }}>{share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function Settings({ appSettings, setAppSettings }) {
  const [settings, setSettings] = useState({
    storeName: appSettings?.store_name || "Agen Frozenfood",
    address: appSettings?.store_address || "",
    phone: appSettings?.store_phone || "",
    tax: 0,
    currency: "IDR",
    receiptNote: appSettings?.receipt_footer || "Terima kasih sudah berbelanja",
    manageStock: true,
    showLowStockAlert: true,
    lowStockThreshold: 10,
  });

  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      storeName: appSettings?.store_name || "Agen Frozenfood",
      address: appSettings?.store_address || "",
      phone: appSettings?.store_phone || "",
      receiptNote: appSettings?.receipt_footer || "Terima kasih sudah berbelanja",
    }));
  }, [appSettings]);

 const saveSettings = async () => {
  const rows = [
    { key: "store_name", value: settings.storeName },
    { key: "store_address", value: settings.address },
    { key: "store_phone", value: settings.phone },
    { key: "receipt_footer", value: settings.receiptNote },
  ];

  try {
    const url = SUPABASE_URL + "/rest/v1/settings?on_conflict=key";

    const r = await fetch(url, {
      method: "POST",
      headers: {
        ...HEADERS,
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(rows),
    });

    if (!r.ok) {
      throw new Error(await r.text());
    }

    setAppSettings(prev => ({
      ...prev,
      store_name: settings.storeName,
      store_address: settings.address,
      store_phone: settings.phone,
      receipt_footer: settings.receiptNote,
    }));

    alert("Pengaturan berhasil disimpan.");
  } catch (err) {
    alert("Gagal menyimpan pengaturan: " + err.message);
  }
};
  const [saved, setSaved] = useState(false);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  return (
    <div>
      <div className="page-header"><div className="page-title">Pengaturan</div></div>
      {saved && <div className="alert alert-success"><Icon name="check" size={16} /> Pengaturan berhasil disimpan!</div>}

      <div className="grid-2" style={{ gap: 20 }}>
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="section-title" style={{ marginBottom: 16 }}>🏪 Informasi Toko</div>
            <div className="form-row"><label>Nama Toko</label><input className="input" value={settings.storeName} onChange={e => setSettings(s => ({ ...s, storeName: e.target.value }))} /></div>
            <div className="form-row"><label>Alamat</label><input className="input" value={settings.address} onChange={e => setSettings(s => ({ ...s, address: e.target.value }))} /></div>
            <div className="form-row"><label>No. Telepon / WhatsApp</label><input className="input" value={settings.phone} onChange={e => setSettings(s => ({ ...s, phone: e.target.value }))} /></div>
            <div className="form-row"><label>Catatan Struk</label><input className="input" value={settings.receiptNote} onChange={e => setSettings(s => ({ ...s, receiptNote: e.target.value }))} /></div>
          </div>

          <div className="card">
            <div className="section-title" style={{ marginBottom: 16 }}>💰 Keuangan</div>
            <div className="form-row"><label>Pajak (%)</label><input className="input" type="number" min="0" max="100" value={settings.tax} onChange={e => setSettings(s => ({ ...s, tax: e.target.value }))} /></div>
            <div className="form-row">
              <label>Mata Uang</label>
              <select className="input" value={settings.currency} onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))}>
                <option value="IDR">IDR - Rupiah Indonesia</option>
                <option value="USD">USD - US Dollar</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="section-title" style={{ marginBottom: 16 }}>📦 Stok & Inventori</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>Manajemen Stok</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Aktifkan pelacakan stok produk</div>
              </div>
              <label className="toggle"><input type="checkbox" checked={settings.manageStock} onChange={e => setSettings(s => ({ ...s, manageStock: e.target.checked }))} /><span className="toggle-slider" /></label>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>Notifikasi Stok Rendah</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Tampilkan peringatan stok hampir habis</div>
              </div>
              <label className="toggle"><input type="checkbox" checked={settings.showLowStockAlert} onChange={e => setSettings(s => ({ ...s, showLowStockAlert: e.target.checked }))} /><span className="toggle-slider" /></label>
            </div>
            <div style={{ padding: "12px 0" }}>
              <label>Batas Stok Rendah</label>
              <input className="input" type="number" value={settings.lowStockThreshold} onChange={e => setSettings(s => ({ ...s, lowStockThreshold: e.target.value }))} />
            </div>
          </div>

          <div className="card">
            <div className="section-title" style={{ marginBottom: 16 }}>ℹ️ Informasi Aplikasi</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.9 }}>
              <div>Versi Aplikasi: <strong style={{ color: "var(--text)" }}>1.0.0</strong></div>
              <div>Aplikasi: <strong style={{ color: "var(--text)" }}>POS Toko Telon Mindi</strong></div>
              <div>Dibuat khusus untuk kebutuhan toko Anda 🌿</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
        <button className="btn btn-primary" style={{ padding: "11px 28px" }} onClick={saveSettings}>
          <Icon name="check" /> Simpan Pengaturan
        </button>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null); // 'saving' | 'saved' | 'error'

const defaultSettings = {
  store_name: "Agen Sosis & Es Kristal Toko Telon Mindi",
  store_address: "Jalan Raya Sugihwaras No. 742",
  store_phone: "085888100995",
  receipt_footer: "Terima kasih sudah berbelanja",
};

const [settings, setSettings] = useState(defaultSettings);

const rowsToSettings = (rows) => {
  const obj = { ...defaultSettings };

  rows.forEach(row => {
    obj[row.key] = row.value || "";
  });

  return obj;
};

  // ── Load data from Supabase on mount
  useEffect(() => {
    loadAll();
  }, []);

  const showSync = (status) => {
    setSyncStatus(status);
    if (status === "saved" || status === "error") {
      setTimeout(() => setSyncStatus(null), 2500);
    }
  };

 const loadAll = async () => {
  setLoading(true);
  setDbError(null);

  try {
    // 1. Load products
    const prods = await sb.get("products", "?select=*&order=id.asc");
    setProducts(prods);

    // 2. Load transactions dari Supabase
    const txns = await sb.get(
      "transactions",
      "?select=*&order=date.desc&limit=500"
    );

    // 3. Load detail item transaksi
    const items = await sb.get(
      "transaction_items",
      "?select=*&order=id.asc"
    );

    console.log("TRANSACTIONS FROM SUPABASE:", txns);
    console.log("TRANSACTION ITEMS FROM SUPABASE:", items);

    // 4. Gabungkan transaksi dengan item-itemnya
    const txnsWithItems = txns.map(t => ({
      ...t,
      total: Number(t.total || 0),
      cost: Number(t.cost || 0),
      profit: Number(t.profit || 0),
      payMethod: t.pay_method || t.payMethod || "-",
      items: items
        .filter(i => Number(i.transaction_id) === Number(t.id))
        .map(i => ({
          productId: i.product_id,
          name: i.name,
          qty: Number(i.qty || 0),
          price: Number(i.price || 0),
          discount: Number(i.discount || 0),
          subtotal: Number(i.subtotal || 0),
        })),
    }));

    setTransactions(txnsWithItems);

const settingRows = await sb.get("settings", "?select=key,value");
setSettings(rowsToSettings(settingRows));
  } catch (err) {
    console.error("LOAD ALL ERROR:", err);
    setDbError(err.message || "Gagal terhubung ke database");
  } finally {
    setLoading(false);
  }
};

  // ── Handle new transaction → save to Supabase
  const handleTransaction = useCallback(async (txn) => {
  showSync("saving");

  try {
    let totalCost = 0;
    const processedItems = [];
    const batchUpdates = [];
    const movementRows = [];
    const productStockUpdates = [];

    // 1. Hitung modal transaksi.
    // Jika produk FIFO ON, ambil modal dari stock_batches.
    // Jika produk FIFO OFF, ambil modal dari products.cost.
    for (const item of txn.items) {
      const prod = products.find(p => p.id === item.productId);

      if (!prod) {
        throw new Error(`Produk tidak ditemukan: ${item.name}`);
      }

      const qtySold = Number(item.qty || 0);
      let remainingQty = qtySold;
      let itemCost = 0;

      if (prod.stock_management) {
        // Ambil batch FIFO: batch tertua yang masih punya qty_remaining
        const batches = await sb.get(
          "stock_batches",
          `?select=*&product_id=eq.${item.productId}&qty_remaining=gt.0&order=received_at.asc&order=id.asc`
        );

        const totalAvailable = batches.reduce(
          (sum, b) => sum + Number(b.qty_remaining || 0),
          0
        );

        if (totalAvailable < qtySold) {
          throw new Error(
            `Stok FIFO tidak cukup untuk ${item.name}. Tersedia ${totalAvailable}, diminta ${qtySold}.`
          );
        }

        for (const batch of batches) {
          if (remainingQty <= 0) break;

          const batchRemaining = Number(batch.qty_remaining || 0);
          const takeQty = Math.min(remainingQty, batchRemaining);
          const batchCost = Number(batch.cost || 0);

          itemCost += takeQty * batchCost;
          remainingQty -= takeQty;

          batchUpdates.push({
            id: batch.id,
            qty_remaining: batchRemaining - takeQty,
          });

          movementRows.push({
            product_id: item.productId,
            batch_id: batch.id,
            type: "OUT",
            qty: takeQty,
            cost: batchCost,
            note: `Penjualan ${item.name}`,
          });
        }
      } else {
        // Produk biasa: pakai harga beli default dari products.cost
        itemCost = Number(prod.cost || 0) * qtySold;

        movementRows.push({
          product_id: item.productId,
          batch_id: null,
          type: "OUT",
          qty: qtySold,
          cost: Number(prod.cost || 0),
          note: `Penjualan ${item.name} - stok default`,
        });
      }

      totalCost += itemCost;

      processedItems.push({
        ...item,
        cost: itemCost,
      });

      productStockUpdates.push({
        id: item.productId,
        stock: Math.max(0, Number(prod.stock || 0) - qtySold),
      });
    }

    const finalProfit = Number(txn.total || 0) - totalCost;

    // 2. Simpan transaksi utama
    const [savedTxn] = await sb.post("transactions", [{
      date: txn.date,
      total: txn.total,
      cost: totalCost,
      profit: finalProfit,
      pay_method: txn.payMethod,
    }]);

    // 3. Simpan detail item transaksi
    const itemRows = processedItems.map(i => ({
      transaction_id: savedTxn.id,
      product_id: i.productId,
      name: i.name,
      qty: i.qty,
      price: i.price,
      discount: i.discount,
      subtotal: i.subtotal,
    }));

    await sb.post("transaction_items", itemRows);

    // 4. Update batch FIFO yang terpakai
    for (const batch of batchUpdates) {
      await sb.patch("stock_batches", batch.id, {
        qty_remaining: batch.qty_remaining,
      });
    }

    // 5. Catat pergerakan stok keluar
    if (movementRows.length > 0) {
      const rowsWithTransaction = movementRows.map(row => ({
        ...row,
        transaction_id: savedTxn.id,
      }));

      await sb.post("stock_movements", rowsWithTransaction);
    }

    // 6. Update stok total di products
    for (const p of productStockUpdates) {
      await sb.patch("products", p.id, {
        stock: p.stock,
      });
    }

    // 7. Update tampilan lokal
    const fullTxn = {
      ...savedTxn,
      cost: totalCost,
      profit: finalProfit,
      payMethod: savedTxn.pay_method,
      items: processedItems,
    };

    setTransactions(prev => [fullTxn, ...prev]);

    setProducts(prev =>
      prev.map(p => {
        const update = productStockUpdates.find(u => u.id === p.id);
        return update ? { ...p, stock: update.stock } : p;
      })
    );

    showSync("saved");
    return fullTxn;
  } catch (err) {
    console.error("TRANSACTION ERROR:", err);
    showSync("error");
    alert("Gagal menyimpan transaksi: " + err.message);
    throw err;
  }
}, [products]);

  // ── Product CRUD wrappers with Supabase sync
  const setProductsWithSync = useCallback(async (updater) => {
    const newProducts = typeof updater === "function" ? updater(products) : updater;

    // Find what changed
    const added = newProducts.filter(p => !products.find(x => x.id === p.id));
    const deleted = products.filter(p => !newProducts.find(x => x.id === p.id));
    const updated = newProducts.filter(p => {
      const old = products.find(x => x.id === p.id);
      return old && JSON.stringify(old) !== JSON.stringify(p);
    });

    setProducts(newProducts); // optimistic update
    showSync("saving");
    try {
      for (const p of added) {
        const { id, ...rest } = p;
        const [saved] = await sb.post("products", [rest]);
        setProducts(prev => prev.map(x => x.id === p.id ? saved : x));
      }
      for (const p of deleted) await sb.delete("products", p.id);
      for (const p of updated) {
        const { id, created_at, ...rest } = p;
        await sb.patch("products", p.id, rest);
      }
      showSync("saved");
    } catch (err) {
      showSync("error");
      loadAll(); // revert on error
    }
  }, [products]);

  const now = new Date();
  const navItems = [
    { id: "dashboard", icon: "dashboard", label: "Dashboard" },
    { id: "cashier", icon: "cashier", label: "Kasir" },
    { id: "products", icon: "product", label: "Produk" },
    { id: "history", icon: "history", label: "Riwayat Penjualan" },
    { id: "reports", icon: "report", label: "Laporan" },
    { id: "settings", icon: "settings", label: "Pengaturan" },
  ];
  const pageTitle = { dashboard: "Dashboard", cashier: "Kasir", products: "Produk", history: "Riwayat Penjualan", reports: "Laporan", settings: "Pengaturan" };
  const lowStockCount = products.filter(p => p.stock <= 10 && p.active).length;

  // ── Loading screen
  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg)", gap: 16 }}>
          <div style={{ fontSize: 48 }}>🌿</div>
          <div style={{ fontFamily: "Sora", fontSize: 20, fontWeight: 700, color: "var(--text)" }}>Toko Telon Mindi</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Menghubungkan ke database Supabase...</div>
          <div style={{ width: 200, height: 4, background: "var(--border)", borderRadius: 4, overflow: "hidden", marginTop: 8 }}>
            <div style={{ height: "100%", background: "var(--primary)", borderRadius: 4, animation: "loadingBar 1.5s ease-in-out infinite" }} />
          </div>
          <style>{`@keyframes loadingBar { 0%{width:0%} 50%{width:80%} 100%{width:100%} }`}</style>
        </div>
      </>
    );
  }

  // ── DB Error screen
  if (dbError) {
    return (
      <>
        <style>{styles}</style>
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg)", gap: 16, padding: 24 }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <div style={{ fontFamily: "Sora", fontSize: 18, fontWeight: 700, color: "var(--danger)" }}>Gagal Terhubung ke Database</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", maxWidth: 400 }}>
            Pastikan tabel sudah dibuat di Supabase dan koneksi internet tersedia.<br /><br />
            <code style={{ background: "#f1f5f9", padding: "4px 8px", borderRadius: 6, fontSize: 12 }}>{dbError}</code>
          </div>
          <button className="btn btn-primary" onClick={loadAll}>🔄 Coba Lagi</button>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      {/* SYNC STATUS TOAST */}
      {syncStatus && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          padding: "10px 18px", borderRadius: 12, fontSize: 13, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          background: syncStatus === "saving" ? "#fff" : syncStatus === "saved" ? "#e8f5f2" : "#fdecea",
          color: syncStatus === "saving" ? "var(--text-muted)" : syncStatus === "saved" ? "var(--primary)" : "var(--danger)",
          border: `1px solid ${syncStatus === "saving" ? "var(--border)" : syncStatus === "saved" ? "#c3e8de" : "#f5c2c5"}`,
          transition: "all 0.3s",
        }}>
          {syncStatus === "saving" && "⏳ Menyimpan ke Supabase..."}
          {syncStatus === "saved" && "✅ Tersimpan ke Supabase"}
          {syncStatus === "error" && "❌ Gagal menyimpan"}
        </div>
      )}
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-badge">🌿</div>
            <div className="store-name">Toko <div className="store-name">{settings.store_name || "Agen Sosis & Es Kristal Toko Telon Mindi"}</div> Mindi</div>
            <div className="store-sub">Point of Sale System</div>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-label">Menu Utama</div>
            {navItems.map(item => (
              <div key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => setPage(item.id)}>
                <Icon name={item.icon} size={17} />
                {item.label}
                {item.id === "products" && lowStockCount > 0 && <span className="nav-badge">{lowStockCount}</span>}
              </div>
            ))}
          </div>
          <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginBottom: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success)", display: "inline-block" }} />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Terhubung ke Supabase</span>
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>© 2026 Toko Telon Mindi</div>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <div className="topbar-title">{pageTitle[page]}</div>
            <div className="topbar-right">
              <button className="btn btn-sm btn-outline" onClick={loadAll} title="Refresh data dari Supabase" style={{ fontSize: 12 }}>🔄 Refresh</button>
              <div className="topbar-time">{now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}</div>
              <div className="avatar">TM</div>
            </div>
          </div>
          <div className="content">
            {page === "dashboard" && <Dashboard transactions={transactions} products={products} />}
            {page === "cashier" && (
  <Cashier
    products={products}
    onTransaction={handleTransaction}
    settings={settings}
  />
)}
            {page === "products" && <Products products={products} setProducts={setProductsWithSync} transactions={transactions} />}
            {page === "history" && <History transactions={transactions} />}
            {page === "reports" && <Reports transactions={transactions} />}
            {page === "settings" && (
  <Settings appSettings={settings} setAppSettings={setSettings} />
)}
          </div>
        </main>
      </div>
    </>
  );
}
