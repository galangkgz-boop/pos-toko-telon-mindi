import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import * as qz from "qz-tray";

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

const RECEIPT_STORE_LINES = [
  "AGEN SOSIS DAN ES KRISTAL",
  "TOKO TELON MINDI",
];

const wrapReceiptText = (text, maxLength = 32) => {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = "";

  words.forEach(word => {
    const nextLine = currentLine ? currentLine + " " + word : word;

    if (nextLine.length > maxLength) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  });

  if (currentLine) lines.push(currentLine);

  return lines;
};

const getReceiptHeaderLines = (settings) => {
  const address = String(
    settings?.address ||
    settings?.store_address ||
    "JALAN RAYA SUGIHWARAS NO. 742"
  ).toUpperCase();

  const phone = String(
    settings?.phone ||
    settings?.store_phone ||
    "085888100995"
  );

  return [
    ...RECEIPT_STORE_LINES,
    ...wrapReceiptText(address, 32),
    phone,
  ].filter(Boolean);
};

const buildThermalReceipt = (txn, settings) => {
  const line = "--------------------------------\n";
  const receiptHeader = getReceiptHeaderLines(settings);
  const note = settings?.receiptNote || settings?.receipt_footer || "Terima kasih sudah berbelanja!";

  const items = (txn.items || []).map(item => {
    const name = String(item.name || "").toUpperCase().slice(0, 28);
    const qty = Number(item.qty || 0);
    const price = Number(item.price || 0);
    const subtotal = Number(item.subtotal || qty * price);

    return (
      name + "\n" +
      qty + " x " + fmt(price) + "\n" +
      "                 " + fmt(subtotal) + "\n"
    );
  }).join("");

  const paid = Number(txn.paid || txn.cashReceived || txn.payment || 0);
const change = Number(txn.change || 0);
const receiptSubtotal = Number(txn.subtotal || txn.total || 0);
const receiptDiscount = Number(txn.discountAmount || txn.discount_amount || 0);

  return [
  "\x1B\x40",
  "\x1B\x61\x01",
  ...receiptHeader.map(line => line + "\n").join(""),
    "\x1B\x61\x00",
    line,
    "TRX-" + String(txn.id).slice(-4).padStart(4, "0") + "\n",
    "Tanggal: " + fmtDate(txn.date) + " " + fmtTime(txn.date) + "\n",
    "Metode: " + (txn.payMethod || "-") + "\n",
    line,
    items,
    line,
"Subtotal   " + fmt(receiptSubtotal) + "\n",
receiptDiscount > 0 ? "Diskon     -" + fmt(receiptDiscount) + "\n" : "",
"TOTAL      " + fmt(txn.total) + "\n",
txn.payMethod === "Tunai" ? "Bayar      " + fmt(paid) + "\n" : "",
    txn.payMethod === "Tunai" ? "Kembali    " + fmt(change) + "\n" : "",
    line,
    "\x1B\x61\x01",
    note + "\n",
    "\n\n\n",
    "\x1D\x56\x00",
  ];
};

const printThermalQZ = async (txn, settings) => {
  try {
    if (!qz.websocket.isActive()) {
      await qz.websocket.connect();
    }

    const printerName = "EPPOS";

    const config = qz.configs.create(printerName);
    const data = buildThermalReceipt(txn, settings);

    await qz.print(config, data);
  } catch (err) {
    alert("Gagal cetak thermal: " + (err?.message || err));
  }
};

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
  .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 10px; }
  .stat-card { background: var(--card); border-radius: var(--radius); padding: 18px; box-shadow: var(--shadow); position: relative; overflow: hidden; }
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
  padding: 22px 14px 16px;
  background: #ffffff;
  border: 1px solid #dbe4ea;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
  border-radius: 18px;
}
  .product-card-pos:hover { border-color: var(--primary); transform: translateY(-2px); }
  .product-card-pos .emoji { font-size: 32px; }
  .product-card-pos .pname { font-size: 13px; font-weight: 1000; color: var(--text); line-height: 1.5; }
  .product-card-pos .pprice { font-size: 13px; font-weight: 1000; color: var(--primary); }
  .product-card-pos .pstock { font-size: 10px; font-weight: 1000; color: var(--text-muted); }
  .product-card-pos.out-of-stock {
  opacity: 0.55;
  background: #f8fafc;
}

  .cart-panel {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 120px);
  overflow: hidden;
}
  .cart-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .cart-items {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}
  .cart-item { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 10px; margin-bottom: 8px; background: var(--bg); }
  .cart-item-info { flex: 1; }
  .cart-item-name { font-size: 12.5px; font-weight: 600; }
  .cart-item-price { font-size: 12px; color: var(--text-muted); }
.cart-item .qty-btn {
  background: #ffffff;
  color: var(--text);
  border: 1px solid var(--border);
}

.cart-item .qty-btn:hover {
  color: var(--primary);
  border-color: var(--primary);
}
  .qty-ctrl { display: flex; align-items: center; gap: 6px; }
  .qty-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: #ffffff;
  color: var(--text);
  font-size: 20px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
}

.qty-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-soft);
}

.qty-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  background: #f1f5f9;
  color: var(--text-muted);
}

.qty-num {
  min-width: 26px;
  text-align: center;
  font-weight: 800;
  font-size: 16px;
  color: var(--text);
}
  .cart-footer {
  padding: 14px 18px !Important;
  flex-shrink: 0;
  background: #fff;
  position: sticky;
  bottom: 0;
  z-index: 5;
}

.cart-footer .form-row {
  margin-bottom: 10px !important;
}

.cart-footer .form-row label {
  font-size: 12px !important;
  margin-bottom: 6px !important;
  color: var(--text-muted);
}

.cart-footer .input {
  height: 42px !important;
  font-size: 14px !important;
  padding: 8px 12px !important;
}

.cart-footer .btn-primary {
  height: 48px !important;
  padding: 10px 14px !important;
  font-size: 15px !important;
  border-radius: 14px !important;
}

  .cart-total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px !Important; font-size: 14px !Important; }
  .cart-total-row.grand { margin-top: 8px !Important; padding-top: 10px !Important; border-top: 1px dashed var(--border); font-size: 18px !Important; font-weight: 900; }

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
  background: #eefaf6;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.16);
}

.mobile-product-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}

.mobile-checkout-bar {
  display: none;
}

.cashier-filter-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 14px;
  width: 100%;
}

.cashier-filter-area .input-group {
  width: 100%;
}

.cashier-filter-area .category-chips {
  width: 100%;
}

@media (max-width: 768px) {
  .cart-panel {
    display: none;
  }

  .mobile-product-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-top: 10px;
  }

  .mobile-product-actions .btn-sm {
    padding: 8px 16px;
    border-radius: 12px;
    font-size: 13px;
  }

  .mobile-checkout-bar {
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: 12px;
    z-index: 998;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    background: #fff;
    color: var(--text);
    padding: 14px 16px;
    border-radius: 18px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.18);
    border: 1px solid var(--border);
  }

  .mobile-checkout-label {
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 4px;
  }

  .mobile-checkout-bar strong {
    font-size: 22px;
    color: var(--text);
  }

  .mobile-buy-btn {
    border: none;
    background: var(--primary);
    color: #fff;
    border-radius: 14px;
    padding: 13px 22px;
    font-size: 15px;
    font-weight: 800;
    cursor: pointer;
  }

  .content {
    padding-bottom: 110px;
  }
}
</div>

/* SIDEBAR COLLAPSE */
.sidebar {
  position: relative;
  transition: width 0.25s ease;
}

.app.sidebar-collapsed .sidebar {
  width: 78px;
  min-width: 78px;
}

.app.sidebar-collapsed .sidebar-brand {
  padding: 18px 10px;
}

.app.sidebar-collapsed .sidebar-brand .store-name,
.app.sidebar-collapsed .sidebar-brand .store-sub,
.app.sidebar-collapsed .sidebar-label,
.app.sidebar-collapsed .nav-item span,
.app.sidebar-collapsed .sidebar > div:last-child {
  display: none !important;
}

.app.sidebar-collapsed .sidebar-brand .brand-badge {
  margin: 44px auto 0;
}

.app.sidebar-collapsed .nav-item {
  justify-content: center;
  padding: 14px;
  margin: 8px 10px;
}

.app.sidebar-collapsed .nav-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  margin: 0;
  font-size: 10px;
  min-width: 22px;
  height: 22px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
  
/* MOBILE CART BOTTOM SHEET FIX */
.mobile-sheet-head {
  display: none;
}

@media (max-width: 768px) {
  #cart-panel.mobile-cart-sheet {
    display: flex !important;
    flex-direction: column !important;
    position: fixed !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100% !important;
    max-height: 82vh !important;
    z-index: 9999 !important;
    background: #fff !important;
    border-radius: 24px 24px 0 0 !important;
    box-shadow: 0 -10px 35px rgba(0,0,0,0.18) !important;
    transform: translateY(calc(100% - 112px)) !important;
    transition: transform 0.28s ease !important;
    overflow: hidden !important;
  }

  #cart-panel.mobile-cart-sheet.open {
    transform: translateY(0) !important;
  }

  #cart-panel.mobile-cart-sheet .mobile-sheet-head {
    display: block !important;
    padding: 10px 18px 14px !important;
    background: #fff !important;
    border-bottom: 1px solid var(--border) !important;
    cursor: pointer !important;
  }

  .sheet-handle {
    width: 72px;
    height: 7px;
    border-radius: 99px;
    background: #dce1ea;
    margin: 0 auto 14px;
  }

  .sheet-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
  }

  .mobile-checkout-label {
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 4px;
  }

  .sheet-summary strong {
    font-size: 24px;
    color: var(--text);
  }

  .mobile-buy-btn {
    border: none;
    background: var(--primary);
    color: #fff;
    border-radius: 14px;
    padding: 13px 24px;
    font-size: 15px;
    font-weight: 800;
    cursor: pointer;
  }

  .mobile-buy-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  #cart-panel.mobile-cart-sheet .cart-header {
    display: none !important;
  }

  #cart-panel.mobile-cart-sheet .cart-items {
    max-height: 42vh !important;
    overflow-y: auto !important;
    padding: 12px 18px !important;
  }

  #cart-panel.mobile-cart-sheet .cart-footer {
    padding: 14px 18px 24px !important;
  }

  .mobile-checkout-bar {
    display: none !important;
  }

  .content {
    padding-bottom: 130px !important;
  }
}

.variant-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-top: 8px;
}

.variant-btn {
  border: 1px solid var(--border);
  background: #fff;
  color: var(--text);
  border-radius: 12px;
  padding: 7px 9px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 64px;
  position: relative;
}

.variant-btn strong {
  font-size: 11px;
  color: var(--primary);
}

.variant-btn.active {
  border-color: var(--primary);
  background: var(--primary-soft);
}

.variant-btn em {
  position: absolute;
  top: -7px;
  right: -7px;
  background: var(--primary);
  color: #fff;
  border-radius: 999px;
  min-width: 18px;
  height: 18px;
  font-style: normal;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.variant-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.sidebar {
  position: relative;
  transition: width 0.25s ease;
}

.app.sidebar-collapsed .sidebar {
  width: 78px;
  min-width: 78px;
}

.app.sidebar-collapsed .sidebar-brand {
  padding: 18px 10px;
}

.app.sidebar-collapsed .sidebar-brand .store-name,
.app.sidebar-collapsed .sidebar-brand .store-sub,
.app.sidebar-collapsed .sidebar-label,
.app.sidebar-collapsed .nav-item span,
.app.sidebar-collapsed .sidebar > div:last-child {
  display: none !important;
}

.app.sidebar-collapsed .sidebar-brand .brand-badge {
  margin: 44px auto 0;
}

.app.sidebar-collapsed .nav-item {
  justify-content: center;
  padding: 14px;
  margin: 8px 10px;
}

.app.sidebar-collapsed .nav-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  margin: 0;
  font-size: 10px;
  min-width: 22px;
  height: 22px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
  .cashier-toolbar,
.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-bar .input-group {
  flex: 1;
}

.search-bar select,
.search-bar .select,
.search-bar .input {
  min-height: 48px;
}

/* MOBILE DRAWER SIDEBAR */
.mobile-menu-button {
  display: none;
}

.sidebar-backdrop {
  display: none;
}

@media (max-width: 768px) {
  .mobile-menu-button {
    display: flex;
    position: fixed;
    top: 16px;
    left: 16px;
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 14px;
    background: #ffffff;
    color: var(--primary);
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 900;
    z-index: 10001;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16);
  }

  .app {
    display: block !important;
  }

  .sidebar {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 82vw !important;
    max-width: 360px !important;
    height: 100vh !important;
    z-index: 10000 !important;
    transform: translateX(-110%) !important;
    transition: transform 0.25s ease !important;
    border-radius: 0 26px 26px 0 !important;
    box-shadow: 18px 0 45px rgba(15, 23, 42, 0.24) !important;
    overflow-y: auto !important;
  }

  .app.sidebar-open .sidebar {
    transform: translateX(0) !important;
  }

  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.55);
    z-index: 9999;
  }

  .topbar {
    padding-left: 76px !important;
  }

  .main {
    width: 100% !important;
  }
}

@media (min-width: 769px) {
  .mobile-menu-button,
  .sidebar-backdrop {
    display: none !important;
  }

  .sidebar {
    transform: none !important;
  }
}

.category-chips {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  padding: 4px 2px 10px;
  margin-bottom: 12px;
}

.category-chip {
  border: 1px solid var(--border);
  background: #ffffff;
  color: var(--text-muted);
  border-radius: 999px;
  padding: 10px 10px;
  font-size: 14px;
  font-weight: 1000;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.06);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-chip.active {
  background: var(--primary);
  color: #ffffff;
  border-color: var(--primary);
}

@media (max-width: 768px) {
  .category-chips {
    display: flex;
    align-items: center;
    gap: 10px;
    overflow-x: auto;
    padding: 4px 2px 12px;
    margin-bottom: 12px;
    scrollbar-width: none;
  }

  .category-chips::-webkit-scrollbar {
    display: none;
  }

  .category-chip {
    flex: 0 0 auto;
    padding: 10px 18px;
    font-size: 14px;
  }
}
.payment-suggestions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.payment.suggestion .payment-chip {
width: 100%; justify-content: center; white-space: nowrap;}

.payment-chip {
  border: 1px solid var(--border);
  background: #fff;
  color: var(--text);
  border-radius: 999px;
  padding: 9px 14px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.06);
}

.payment-chip.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.btn-danger {
  background: #dc2626;
  color: #fff;
  border: none;
}

.btn-danger:hover {
  background: #b91c1c;
}

.success-receipt-wrap {
  max-width: 460px;
  margin: 0 auto;
}

.success-receipt-wrap .card {
  padding: 18px !important;
}

.success-receipt-wrap .receipt-preview,
.success-receipt-wrap pre {
  max-height: 360px;
  overflow-y: auto;
  font-size: 11px !important;
  line-height: 1.35 !important;
  padding: 12px !important;
}

.success-receipt-wrap h2,
.success-receipt-wrap h3 {
  margin: 8px 0 !important;
  font-size: 22px !important;
}

.success-receipt-wrap .btn {
  min-height: 44px;
}

@media (max-height: 760px) and (min-width: 769px) {
  .success-receipt-wrap {
    max-width: 430px;
  }

  .success-receipt-wrap .card {
    padding: 14px !important;
  }

  .success-receipt-wrap .receipt-preview,
  .success-receipt-wrap pre {
    max-height: 260px;
    font-size: 10px !important;
    line-height: 1.25 !important;
  }

  .success-receipt-wrap h2,
  .success-receipt-wrap h3 {
    font-size: 19px !important;
    margin: 6px 0 !important;
  }
}

@media (min-width: 1200px) {
  html,
  body,
  #root {
    width: 100%;
    min-width: 100%;
  }

  .app {
    width: 100vw !important;
    max-width: none !important;
    margin: 0 !important;
  }

  .main {
    flex: 1 !important;
    width: 100% !important;
    max-width: none !important;
    min-width: 0 !important;
  }

  .content {
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
  }
}

.dashboard-two-columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
  margin-bottom: 20px;
  width: 100%;
}

.dashboard-two-columns > .dashboard-two-columns {
  display: contents;
}

.dashboard-two-columns .card {
  width: 100%;
  min-width: 0;
  height: 100%;
}

@media (max-width: 768px) {
  .dashboard-two-columns {
    grid-template-columns: 1fr;
  }
}

.wallet-card {
  margin-bottom: 20px;
  padding: 16px !important;
}

.wallet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.wallet-balance {
  text-align: right;
}

.wallet-balance span,
.wallet-summary span {
  display: block;
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 700;
}

.wallet-balance strong {
  display: block;
  font-size: 24px;
  color: var(--primary);
  font-weight: 900;
}

.wallet-summary {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}

.wallet-summary div {
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(15, 118, 110, 0.06);
}

.wallet-summary strong {
  display: block;
  margin-top: 4px;
  font-size: 15px;
  font-weight: 900;
}

.wallet-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.wallet-actions .input {
  width: 150px;
}

@media (max-width: 768px) {
  .wallet-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .wallet-balance {
    text-align: left;
  }

  .wallet-summary {
    grid-template-columns: repeat(2, 1fr);
  }

  .wallet-actions .input,
  .wallet-actions button {
    width: 100%;
  }
}

.wallet-card .section-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
  margin-top: 2px;
}

.wallet-balance small {
  display: block;
  margin-top: 3px;
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 600;
}

.wallet-action-label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 800;
  margin-right: 4px;
  white-space: nowrap;
}

.btn-danger-soft {
  border-color: rgba(220, 38, 38, 0.25) !important;
  color: #b91c1c !important;
  background: rgba(220, 38, 38, 0.04) !important;
}

.btn-danger-soft:hover {
  background: rgba(220, 38, 38, 0.08) !important;
}

  .top-product-compact-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.top-product-compact-row {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 78px;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.top-product-compact-row:last-child {
  border-bottom: none;
}

.top-product-compact-main {
  min-width: 0;
}

.top-product-compact-name {
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.top-product-compact-qty {
  font-size: 13px;
  font-weight: 800;
  color: var(--primary);
  text-align: right;
  white-space: nowrap;
}

.rank-badge {
  width: 26px;
  height: 26px;
  border-radius: 9px;
  background: rgba(15, 118, 110, 0.12);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 900;
}

.dashboard-small-subtitle {
  font-size: 12px !important;
  line-height: 1.3;
  color: var(--text-muted);
  font-weight: 600;
}

.payment-suggestions-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.payment-suggestions-center {
  display: flex;
  justify-content: center;
}

.payment-suggestions-center .payment-chip {
  min-width: auto;
  justify-content: center;
  background: rgba(15, 118, 110, 0.10) !important;
  border: 1px solid rgba(15, 118, 110, 0.22) !important;
  color: var(--primary) !important;
  font-weight: 900;
}

.payment-suggestions .payment-chip {
  width: 100%;
  justify-content: center;
  white-space: nowrap;
  padding-left: 10px;
  padding-right: 10px;
}

.payment-methods,
.pay-methods {
  display: flex !important;
  justify-content: center !important;
  gap: 10px !important;
  flex-wrap: wrap;
}

.payment-suggestions-center .payment-chip.active {
  background: var(--primary) !important;
  color: white !important;
}

.payment-suggestions {
  display: grid !important;
  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
  gap: 8px !important;
  width: 100%;
}

.payment-suggestions .payment-chip {
  width: auto !important;
  min-width: 0 !important;
  justify-content: center !important;
  white-space: nowrap;
  padding-left: 8px !important;
  padding-right: 8px !important;
}

.payment-info-box {
  margin-top: 18px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(15, 118, 110, 0.06);
  border: 1px solid rgba(15, 118, 110, 0.10);
  text-align: center;
}

.payment-info-title {
  font-size: 17px;
  font-weight: 900;
  color: var(--text);
  margin-bottom: 4px;
}

.payment-info-subtitle {
  font-size: 12px;
  line-height: 1.4;
  color: var(--text-muted);
  max-width: 360px;
  margin: 0 auto 12px;
}

.bank-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-top: 10px;
}

.bank-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  text-align: left;
}

.bank-logo {
  width: 56px;
  height: 42px;
  border-radius: 14px;
  background: rgba(15, 118, 110, 0.10);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 13px;
  flex-shrink: 0;
}

.bank-detail {
  min-width: 0;
}

.bank-number {
  font-size: 17px;
  font-weight: 900;
  color: var(--text);
  letter-spacing: 0.3px;
}

.bank-owner {
  margin-top: 3px;
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 700;
}

.payment-total-note {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed rgba(15, 23, 42, 0.18);
  font-size: 14px;
  color: var(--text-muted);
}

.payment-total-note strong {
  color: var(--primary);
  font-size: 16px;
  font-weight: 900;
}

.payment-info-box {
  margin-top: 16px;
  padding: 12px;
}

.payment-info-title {
  font-size: 16px;
  margin-bottom: 4px;
}

.payment-info-subtitle {
  font-size: 12px;
  margin-bottom: 10px;
}

.bank-list {
  gap: 8px;
}

.bank-card {
  cursor: pointer;
  font-family: inherit;
}

.bank-card-active {
  border-color: rgba(15, 118, 110, 0.45) !important;
  background: rgba(15, 118, 110, 0.10) !important;
  box-shadow: 0 0 0 2px rgba(15, 118, 110, 0.08);
}

.bank-card-active .bank-logo {
  background: var(--primary) !important;
  color: white !important;
}

.bank-logo {
  width: 48px;
  height: 38px;
  border-radius: 12px;
  font-size: 12px;
}

.bank-number {
  font-size: 15px;
}

.bank-owner {
  font-size: 11px;
}

.payment-total-note {
  margin-top: 10px;
  padding-top: 9px;
}

.wallet-transfer-detail {
  margin-top: 10px;
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.03);
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.wallet-transfer-title {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 900;
  margin-bottom: 8px;
}

.wallet-transfer-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.wallet-transfer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 12px;
  background: white;
}

.wallet-transfer-item span {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wallet-transfer-item strong {
  font-size: 13px;
  font-weight: 900;
  color: var(--primary);
  white-space: nowrap;
}

.wallet-transfer-empty {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 700;
  padding: 8px 10px;
  border-radius: 12px;
  background: white;
}

.cash-history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.cash-history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.cash-history-title {
  font-size: 14px;
  font-weight: 900;
}

.cash-history-desc {
  margin-top: 3px;
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 700;
}

.cash-history-time {
  margin-top: 3px;
  font-size: 11px;
  color: var(--text-muted);
}

.cash-in {
  color: var(--primary);
  white-space: nowrap;
}

.cash-out {
  color: #b91c1c;
  white-space: nowrap;
}

.cash-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 14px;
}

.cash-detail-grid div {
  padding: 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.cash-detail-grid span {
  display: block;
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 800;
}

.cash-detail-grid strong {
  display: block;
  margin-top: 5px;
  font-size: 16px;
  font-weight: 900;
}

.cash-detail-total {
  margin-top: 12px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(15, 118, 110, 0.10);
  border: 1px solid rgba(15, 118, 110, 0.14);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.cash-detail-total span {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 900;
}

.cash-detail-total strong {
  font-size: 22px;
  color: var(--primary);
  font-weight: 900;
}

.cash-detail-note {
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--text-muted);
  font-weight: 600;
}

.cash-close-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-top: 14px;
}

.cash-close-summary div {
  padding: 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.cash-close-summary span {
  display: block;
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 800;
}

.cash-close-summary strong {
  display: block;
  margin-top: 5px;
  font-size: 16px;
  font-weight: 900;
}

.cash-closed-badge {
  display: inline-flex;
  align-items: center;
  margin-left: 8px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(220, 38, 38, 0.08);
  color: #b91c1c;
  font-size: 11px;
  font-weight: 900;
}

.cash-flow-section {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed rgba(15, 23, 42, 0.16);
}

.cash-flow-title {
  font-size: 14px;
  font-weight: 900;
  margin-bottom: 10px;
}

.cash-flow-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 220px;
  overflow: auto;
}

.cash-flow-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.cash-flow-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.cash-flow-time {
  min-width: 42px;
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 800;
}

.cash-flow-name {
  font-size: 13px;
  font-weight: 900;
}

.cash-flow-sub {
  margin-top: 2px;
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 700;
}

.cash-flow-empty {
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.04);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 700;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 20px;
}

.modal-card {
  width: min(720px, 100%);
  max-height: 90vh;
  overflow: auto;
  background: white;
  border-radius: 24px;
  padding: 20px;
}

.mini-alert-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(15, 23, 42, 0.38);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.mini-alert-card {
  width: min(380px, 100%);
  background: white;
  border-radius: 22px;
  padding: 22px;
  text-align: center;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.22);
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.mini-alert-icon {
  width: 58px;
  height: 58px;
  margin: 0 auto 12px;
  border-radius: 999px;
  background: rgba(220, 38, 38, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
}

.mini-alert-card h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 900;
}

.mini-alert-card p {
  margin: 10px 0 18px;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.5;
  font-weight: 600;
}

.modal-close-btn {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(15, 23, 42, 0.04);
  color: var(--text);
  font-size: 24px;
  line-height: 1;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: 0.15s ease;
}

.modal-close-btn:hover {
  background: rgba(220, 38, 38, 0.08);
  border-color: rgba(220, 38, 38, 0.18);
  color: #b91c1c;
  transform: scale(1.04);
}

.modal-header {
  display: flex;
  align-items: flex;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.modal-header-center {
  position: relative;
  display: block;
  text-align: center;
  margin-bottom: 16px;
  padding: 0 52px;
}

.modal-title-center {
  width: 100%;
  text-align: center;
}

.modal-title-center h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 900;
  text-align: center;
}

.modal-title-center p {
  margin: 6px 0 0;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 700;
  text-align: center;
}

.modal-close-absolute {
  position: absolute;
  top: 0;
  right: 0;
}

.modal-title-center h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 900;
}

.modal-title-center p {
  margin: 6px 0 0;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 700;
}

.modal-close-absolute {
  position: absolute;
  top: 0;
  right: 0;
}

@media (max-width: 1100px) {
  .page-header {
    flex-wrap: wrap;
  }

  .header-mini-stats {
    order: 3;
    width: 100%;
    flex-basis: 100%;
  }
}

@media (max-width: 760px) {
  .header-mini-stats {
    grid-template-columns: 1fr;
  }
}

.topbar-mini-stats {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 22px;
  margin: 0 18px;
  min-width: 0;
}

.topbar-mini-stat {
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
  padding: 7px 10px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
  white-space: nowrap;
}

.stat-soft-green {
  background: rgba(16, 185, 129, 0.10);
}

.stat-soft-orange {
  background: rgba(249, 115, 22, 0.10);
}

.stat-soft-red {
  background: rgba(220, 38, 38, 0.08);
}

.topbar-mini-stat span {
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  color: var(--text-muted);
}

.topbar-mini-stat strong {
  font-size: 15px;
  font-weight: 900;
  color: var(--text);
}

.topbar-mini-stat small {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
}

@media (max-width: 1100px) {
  .topbar {
    flex-wrap: wrap;
  }

  .topbar-mini-stats {
    order: 3;
    width: 100%;
    flex-basis: 100%;
    justify-content: flex-start;
    margin: 8px 0 0;
    gap: 16px;
  }
}

@media (max-width: 760px) {
  .topbar-mini-stats {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

.report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.report-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 900;
}

.report-header p {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 700;
}

.shift-report-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.shift-report-card {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 22px;
  padding: 16px;
  box-shadow: 0 12px 34px rgba(15, 23, 42, 0.06);
}

.shift-report-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.shift-report-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
  font-weight: 900;
}

.shift-report-sub {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 700;
}

.shift-report-total {
  text-align: right;
}

.shift-report-total span {
  display: block;
  font-size: 11px;
  font-weight: 900;
  color: var(--text-muted);
  text-transform: uppercase;
}

.shift-report-total strong {
  display: block;
  margin-top: 4px;
  font-size: 22px;
  font-weight: 900;
  color: var(--primary-dark);
}

.shift-report-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.shift-report-grid > div {
  padding: 12px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(15, 23, 42, 0.05);
}

.shift-report-grid span {
  display: block;
  font-size: 11px;
  font-weight: 900;
  color: var(--text-muted);
}

.shift-report-grid strong {
  display: block;
  margin-top: 5px;
  font-size: 15px;
  font-weight: 900;
}

.shift-report-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed rgba(15, 23, 42, 0.14);
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 800;
}

.badge-green {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.badge-red {
  background: rgba(220, 38, 38, 0.10);
  color: #b91c1c;
}

@media (max-width: 900px) {
  .shift-report-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .shift-report-top {
    flex-direction: column;
  }

  .shift-report-total {
    text-align: left;
  }
}

@media (max-width: 560px) {
  .shift-report-grid {
    grid-template-columns: 1fr;
  }
}

.shift-report-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed rgba(15, 23, 42, 0.14);
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.report-date-filter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.report-date-filter label {
  font-size: 12px;
  font-weight: 900;
  color: var(--text-muted);
}

.daily-report-summary {
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.10), rgba(15, 23, 42, 0.03));
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 12px 34px rgba(15, 23, 42, 0.06);
}

.daily-summary-main {
  margin-bottom: 14px;
}

.daily-summary-main span {
  display: block;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  color: var(--text-muted);
}

.daily-summary-main strong {
  display: block;
  margin-top: 4px;
  font-size: 22px;
  font-weight: 900;
}

.daily-summary-main small {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  font-weight: 800;
  color: var(--text-muted);
}

.daily-summary-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
}

.daily-summary-grid > div {
  padding: 11px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.daily-summary-grid span {
  display: block;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  color: var(--text-muted);
}

.daily-summary-grid strong {
  display: block;
  margin-top: 5px;
  font-size: 15px;
  font-weight: 900;
}

@media (max-width: 1100px) {
  .daily-summary-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 640px) {
  .daily-summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.report-payment-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.report-payment-filter .btn {
  min-height: 36px;
}

.shift-detail-transactions {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed rgba(15, 23, 42, 0.16);
}

.shift-detail-section-title {
  font-size: 14px;
  font-weight: 900;
  margin-bottom: 10px;
}

.shift-transaction-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 260px;
  overflow: auto;
}

.shift-transaction-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.shift-transaction-title {
  font-size: 13px;
  font-weight: 900;
}

.shift-transaction-sub {
  margin-top: 3px;
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 700;
}

.shift-transaction-item strong {
  font-size: 14px;
  font-weight: 900;
  color: var(--primary);
  white-space: nowrap;
}

.history-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 16px;
}

.history-stats-grid .stat-card {
  min-height: 120px;
  padding: 18px;
}

@media (max-width: 1100px) {
  .history-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .history-stats-grid {
    grid-template-columns: 1fr;
  }
}

.table th,
.table td {
  text-transform: uppercase !important;
}

.product-table th:nth-child(2) {
  text-align: center !important;
}

.product-table td:nth-child(2) {
  text-align: left !important;
  min-width: 220px;
}

.product-table td:nth-child(2) strong,
.product-table td:nth-child(2) div,
.product-table td:nth-child(2) span,
.product-table td:nth-child(2) .product-name {
  text-align: left !important;
}

.pname {
  text-transform: uppercase !important;
  font-size: 13px !important;
  font-weight: 900;
}

.product-sticky-toolbar {
  position: sticky;
  top: 0;
  z-index: 25;
  background: var(--bg);
  padding: 0 0 14px;
  margin-bottom: 14px;
}

.product-sticky-toolbar .search-bar {
  margin-bottom: 0;
}

@media print {
  body * {
    visibility: hidden !important;
  }

  .print-shift-report,
  .print-shift-report * {
    visibility: visible !important;
  }

  .print-shift-report {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    max-width: none !important;
    max-height: none !important;
    overflow: visible !important;
    box-shadow: none !important;
    border: 0 !important;
    border-radius: 0 !important;
    padding: 24px !important;
  }

  .modal-backdrop {
    position: static !important;
    background: white !important;
    padding: 0 !important;
  }

  .modal-close-btn,
  .print-shift-report button {
    display: none !important;
  }

  .shift-transaction-list {
    max-height: none !important;
    overflow: visible !important;
  }
}

@media print {
  body * {
    visibility: hidden !important;
  }

  .receipt-print,
  .receipt-print * {
    visibility: visible !important;
  }

  .receipt-print {
  position: absolute !important;
  left: 0 !important;
  top: 0 !important;
  width: 54mm !important;
  max-width: 54mm !important;
  padding: 3mm 2mm !important;
  margin: 0 !important;
  background: #fff !important;
  color: #000 !important;
  font-family: "Courier New", monospace !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  line-height: 1.25 !important;
  box-shadow: none !important;
  border: none !important;
  overflow: visible !important;
  max-height: none !important;
  height: auto !important;
}

.receipt-print,
.receipt-print * {
  overflow: visible !important;
  max-height: none !important;
}
  
  .receipt-print * {
  color: #000 !important;
  font-weight: 700 !important;
}

.receipt-print strong {
  font-weight: 900 !important;
}

.receipt-print .receipt-divider {
  border-top: 1px dashed #000 !important;
  margin: 4px 0 !important;
}

  .receipt-print button,
  .receipt-print .btn {
    display: none !important;
  }

  @page {
    size: 58mm 210mm;
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
  display: flex !important;
  flex-direction: column !important;
  gap: 8px !important;
  padding: 12px 18px !important;
  overflow: visible !important;
}

.nav-item {
  width: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
  gap: 14px !important;
  padding: 16px 18px !important;
  margin: 0 !important;
  border-radius: 18px !important;
}

.nav-item span {
  display: inline !important;
  white-space: nowrap !important;
}

.nav-badge {
  margin-left: auto !important;
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
  display: flex;
  align-items: center;
  gap: 14px;
}

.page-title {
  font-size: 22px;
  font-weight: 900;
  white-space: nowrap;
}

.header-mini-stats {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(120px, 1fr));
  gap: 10px;
}

.header-mini-stat {
  padding: 9px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
}

.header-mini-stat span {
  display: block;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  color: var(--text-muted);
}

.header-mini-stat strong {
  display: block;
  margin-top: 3px;
  font-size: 16px;
  font-weight: 900;
  color: var(--text);
}

.header-mini-stat small {
  display: block;
  margin-top: 2px;
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 700;
}

  .page-subtitle {
    font-size: 12px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 10px;
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
function Dashboard({
  transactions,
  products,
  cashSession,
  cashMovements,
  openingCashInput,
  setOpeningCashInput,
  saveOpeningCash,
  addCashMovement,
  showCashHistory,
  setShowCashHistory,
  showCashDetail,
  setShowCashDetail,
  showCloseCash,
  setShowCloseCash,
  closingCashInput,
  setClosingCashInput,
  saveCloseCash,
  loadAll,
  fifoAuditRows = [],
  fifoMismatchCount = 0,
  fifoMismatchRows = [],
  stockOpnames = [],
  setStockOpnames,
}) {
  const today = new Date();

  const [opnameModal, setOpnameModal] = useState(false);
  const [opnameForm, setOpnameForm] = useState({
    physicalStock: "",
    reason: "Koreksi Opname",
    note: "",
  });
  const [savingOpname, setSavingOpname] = useState(false);
  
  const activeTransactions = transactions.filter(t => t.status !== "void");
  const todayStr = today.toDateString();

  const todayTxns = activeTransactions.filter(t => new Date(t.date).toDateString() === todayStr);
  const sessionStart = cashSession?.created_at
  ? new Date(cashSession.created_at)
  : new Date(new Date().toISOString().slice(0, 10));

const sessionEnd = cashSession?.status === "closed" && cashSession?.updated_at
  ? new Date(cashSession.updated_at)
  : null;

const currentSessionTxns = cashSession?.id
  ? todayTxns.filter(t => Number(t.cashSessionId || t.cash_session_id) === Number(cashSession.id))
  : [];

const currentSessionMovements = cashSession?.id
  ? cashMovements.filter(m => Number(m.session_id) === Number(cashSession.id))
  : [];

  const totalOmzetToday = todayTxns.reduce((s, t) => s + t.total, 0);
  const totalProfitToday = todayTxns.reduce((s, t) => s + t.profit, 0);
  const totalItemsToday = todayTxns.reduce((s, t) => s + t.items.reduce((a, i) => a + i.qty, 0), 0);

  const cashInManual = currentSessionMovements
  .filter(m => m.type === "in")
  .reduce((s, m) => s + Number(m.amount || 0), 0);

const cashOutManual = currentSessionMovements
  .filter(m => m.type === "out")
  .reduce((s, m) => s + Number(m.amount || 0), 0);

const cashSalesToday = currentSessionTxns
  .filter(t => t.payMethod === "Tunai")
  .reduce((s, t) => s + Number(t.total || 0), 0);

const qrisSalesToday = currentSessionTxns
  .filter(t => t.payMethod === "QRIS")
  .reduce((s, t) => s + Number(t.total || 0), 0);

const transferSalesToday = currentSessionTxns
  .filter(t => t.payMethod === "Transfer")
  .reduce((s, t) => s + Number(t.total || 0), 0);

const transferByDetail = {};

currentSessionTxns
  .filter(t => t.payMethod === "Transfer")
  .forEach(t => {
    const detail = t.paymentDetail || t.payment_detail || "Transfer";
    transferByDetail[detail] =
      (transferByDetail[detail] || 0) + Number(t.total || 0);
  });

const transferDetailsToday = Object.entries(transferByDetail);

const openingCash = Number(cashSession?.opening_cash || 0);
const cashBalanceToday = openingCash + cashSalesToday + cashInManual - cashOutManual;
const cashFlowRows = [
  ...currentSessionTxns.map(t => ({
    id: "trx-" + t.id,
    time: t.date,
    title: t.payMethod === "Tunai" ? "Penjualan Tunai" : "Penjualan " + t.payMethod,
    subtitle: t.paymentDetail || t.payment_detail || t.payMethod || "-",
    amount: Number(t.total || 0),
    type: "in",
  })),

  ...currentSessionMovements.map(m => ({
    id: "cash-" + m.id,
    time: m.created_at,
    title: m.type === "in" ? "Pemasukan Manual" : "Pengeluaran",
    subtitle: m.description || "-",
    amount: Number(m.amount || 0),
    type: m.type,
  })),
].sort((a, b) => new Date(b.time) - new Date(a.time));
const isCashClosed = String(cashSession?.status || "").toLowerCase() === "closed";
const displayCashBalance = isCashClosed ? 0 : cashBalanceToday; 
const closedCashAmount = Number(cashSession?.closing_cash || 0); 
const closedCashDifference = isCashClosed ? closedCashAmount - cashBalanceToday : 0;

const closingCashValue = Number(closingCashInput || 0);
const cashDifference = closingCashInput === "" ? 0 : closingCashValue - cashBalanceToday;

  const todaySoldMap = {};

  todayTxns.forEach(t => {
  (t.items || []).forEach(i => {
    todaySoldMap[i.name] = (todaySoldMap[i.name] || 0) + Number(i.qty || 0);
  });
});

  const topProductsToday = Object.entries(todaySoldMap)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5);

  const maxSoldToday = topProductsToday[0]?.[1] || 1;

  const monthTxns = activeTransactions.filter(t => {
  const d = new Date(t.date);
  return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
});
  const monthOmzet = monthTxns.reduce((s, t) => s + t.total, 0);

  // Last 7 days chart
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dayTxns = activeTransactions.filter(t => new Date(t.date).toDateString() === d.toDateString());
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
  const openOpnameModal = (row) => {
  setOpnameModal(row);
  setOpnameForm({
    physicalStock: "",
    reason: "Koreksi opname",
    note: "",
  });
};

const closeOpnameModal = () => {
  setOpnameModal(null);
  setOpnameForm({
    physicalStock: "",
    reason: "Koreksi opname",
    note: "",
  });
};

const saveOpname = async () => {
  if (!opnameModal) return;

  const physicalStock = Number(
    String(opnameForm.physicalStock || "").replace(/\D/g, "")
  );

  if (opnameForm.physicalStock === "") {
    alert("Isi stok fisik sebenarnya dulu.");
    return;
  }

  if (physicalStock < 0) {
    alert("Stok fisik tidak boleh minus.");
    return;
  }

  try {
    setSavingOpname(true);

    const [savedOpname] = await sb.post("stock_opnames", [
  {
    product_id: opnameModal.productId,
    product_name: opnameModal.name,
    category: opnameModal.category || "",
    system_stock: Number(opnameModal.productStock || 0),
    fifo_stock: Number(opnameModal.batchQty || 0),
    physical_stock: physicalStock,
    system_difference: Number(opnameModal.diff || 0),
    physical_difference:
      physicalStock - Number(opnameModal.productStock || 0),
    reason: opnameForm.reason || "Koreksi opname",
    note: opnameForm.note || "",
    created_at: new Date().toISOString(),
  },
]);

if (savedOpname) {
  setStockOpnames(prev => [savedOpname, ...prev]);
}

    alert("Catatan opname berhasil disimpan. Stok belum diubah.");

    closeOpnameModal();
  } catch (err) {
    alert("Gagal menyimpan opname: " + err.message);
  } finally {
    setSavingOpname(false);
  }
};

const physicalStockValue =
  opnameForm.physicalStock === ""
    ? null
    : Number(String(opnameForm.physicalStock || "").replace(/\D/g, ""));

const physicalDifference =
  opnameModal && physicalStockValue !== null
    ? physicalStockValue - Number(opnameModal.productStock || 0)
    : 0;
    
  return (
    <div>

      <div className="card wallet-card">
  <div className="wallet-head">
    <div>
      <div className="section-title">
  💰 Dompet / Kas Toko
  {isCashClosed && <span className="cash-closed-badge">Kas Ditutup</span>}
</div>
<div className="section-subtitle">Ringkasan kas hari ini</div>
    </div>

    <div className="wallet-balance">
  <span>{isCashClosed ? "Saldo Aktif" : "Saldo Kas"}</span>
  <strong>{fmt(displayCashBalance)}</strong>
  <small>
    {isCashClosed
      ? "Kas sudah ditutup"
      : "Kas Awal + Penjualan Tunai + Pemasukan - Pengeluaran"}
  </small>
</div>
  </div>

  <div className="wallet-summary">
    <div>
  <span>{isCashClosed ? "Saldo Aktif" : "Kas Awal"}</span>
  <strong>{isCashClosed ? fmt(displayCashBalance) : fmt(openingCash)}</strong>
</div>

<div>
  <span>Penjualan Tunai</span>
  <strong>{fmt(cashSalesToday)}</strong>
</div>

<div>
  <span>QRIS</span>
  <strong>{fmt(qrisSalesToday)}</strong>
</div>

<div>
  <span>Transfer</span>
  <strong>{fmt(transferSalesToday)}</strong>
</div>

<div>
  <span>Pemasukan</span>
  <strong>{fmt(cashInManual)}</strong>
</div>

<div>
  <span>Pengeluaran</span>
  <strong>{fmt(cashOutManual)}</strong>
</div>
  </div>

{showCashHistory && (
  <div className="modal-backdrop">
    <div className="modal-card">
      <div
  style={{
    position: "relative",
    textAlign: "center",
    padding: "0 52px",
    marginBottom: 16,
  }}
>
  <button
    type="button"
    className="modal-close-btn"
    onClick={() => setShowCashHistory(false)}
    aria-label="Tutup"
    style={{
      position: "absolute",
      top: 0,
      right: 0,
      zIndex: 10,
    }}
  >
    ×
  </button>

  <h3
    style={{
      margin: 0,
      fontSize: 22,
      fontWeight: 900,
      textAlign: "center",
    }}
  >
    Riwayat Kas
  </h3>

  <p
    style={{
      margin: "6px 0 0",
      color: "var(--text-muted)",
      fontSize: 14,
      fontWeight: 700,
      textAlign: "center",
    }}
  >
    Catatan pemasukan dan pengeluaran kas shift ini
  </p>
</div>

      {cashMovements.length === 0 ? (
        <div className="empty-state">
          Belum ada pemasukan atau pengeluaran manual hari ini.
        </div>
      ) : (
        <div className="cash-history-list">
          {cashMovements.map(m => (
            <div className="cash-history-item" key={m.id}>
              <div>
                <div className="cash-history-title">
                  {m.type === "in" ? "Pemasukan" : "Pengeluaran"}
                </div>
                <div className="cash-history-desc">
                  {m.description || "-"}
                </div>
                <div className="cash-history-time">
                  {new Date(m.created_at).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              <strong className={m.type === "in" ? "cash-in" : "cash-out"}>
                {m.type === "in" ? "+" : "-"} {fmt(m.amount)}
              </strong>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}

  {showCashDetail && (
  <div className="modal-backdrop">
    <div className="modal-card">
      <div
  style={{
    position: "relative",
    textAlign: "center",
    padding: "0 52px",
    marginBottom: 16,
  }}
>
  <button
    type="button"
    className="modal-close-btn"
    onClick={() => setShowCashDetail(false)}
    aria-label="Tutup"
    style={{
      position: "absolute",
      top: 0,
      right: 0,
    }}
  >
    ×
  </button>

  <h3
    style={{
      margin: 0,
      fontSize: 22,
      fontWeight: 900,
      textAlign: "center",
    }}
  >
    Detail Dompet
  </h3>

  <p
    style={{
      margin: "6px 0 0",
      color: "var(--text-muted)",
      fontSize: 14,
      fontWeight: 700,
      textAlign: "center",
    }}
  >
    Ringkasan kas dan pembayaran hari ini
  </p>
</div>

      <div className="cash-detail-grid">
        <div>
          <span>Kas Awal</span>
          <strong>{fmt(openingCash)}</strong>
        </div>

        <div>
          <span>Penjualan Tunai</span>
          <strong>{fmt(cashSalesToday)}</strong>
        </div>

        <div>
          <span>Pemasukan Manual</span>
          <strong>{fmt(cashInManual)}</strong>
        </div>

        <div>
          <span>Pengeluaran</span>
          <strong className="cash-out">{fmt(cashOutManual)}</strong>
        </div>

        <div>
          <span>QRIS</span>
          <strong>{fmt(qrisSalesToday)}</strong>
        </div>

        <div>
          <span>Transfer</span>
          <strong>{fmt(transferSalesToday)}</strong>
        </div>
      </div>

      <div className="cash-detail-total">
        <span>Saldo Tunai Sistem</span>
        <strong>{fmt(displayCashBalance)}</strong>
      </div>

      <div className="cash-detail-note">
        Saldo tunai sistem = kas awal + penjualan tunai + pemasukan manual - pengeluaran.
        QRIS dan transfer tidak masuk ke saldo tunai karena uangnya masuk rekening.
      </div>
    </div>
  </div>
)}

  {showCloseCash && (
  <div className="modal-backdrop">
    <div className="modal-card">
      <div
  style={{
    position: "relative",
    textAlign: "center",
    padding: "0 52px",
    marginBottom: 16,
  }}
>
  <button
    type="button"
    className="modal-close-btn"
    onClick={() => setShowCloseCash(false)}
    aria-label="Tutup"
    style={{
      position: "absolute",
      top: 0,
      right: 0,
    }}
  >
    ×
  </button>

  <h3
    style={{
      margin: 0,
      fontSize: 22,
      fontWeight: 900,
      textAlign: "center",
    }}
  >
    {isCashClosed ? "Detail Tutup Kas" : "Tutup Kas"}
  </h3>

  <p
    style={{
      margin: "6px 0 0",
      color: "var(--text-muted)",
      fontSize: 14,
      fontWeight: 700,
      textAlign: "center",
    }}
  >
    {isCashClosed
      ? "Rincian kas yang sudah ditutup hari ini"
      : "Cocokkan uang fisik laci dengan saldo sistem"}
  </p>
</div>

      <div className="cash-close-summary">
        {/* 8 kotak rincian kamu tetap di sini */}
      
        <div>
          <span>Kas Awal</span>
          <strong>{fmt(openingCash)}</strong>
        </div>

        <div>
          <span>Penjualan Tunai</span>
          <strong>{fmt(cashSalesToday)}</strong>
        </div>

        <div>
          <span>Pemasukan</span>
          <strong>{fmt(cashInManual)}</strong>
        </div>

        <div>
          <span>Pengeluaran</span>
          <strong className="cash-out">{fmt(cashOutManual)}</strong>
        </div>

        <div>
          <span>Saldo Sistem</span>
          <strong>{fmt(cashBalanceToday)}</strong>
        </div>

        <div>
          <span>Kas Fisik</span>
          <strong>
            {isCashClosed
              ? fmt(closedCashAmount)
              : closingCashInput === ""
                ? "-"
                : fmt(closingCashValue)}
          </strong>
        </div>

        <div>
          <span>Selisih</span>
          <strong 
            className={
              (isCashClosed ? closedCashDifference : cashDifference) < 0 
              ? "cash-out" 
              : "cash-in"
         }
      >
        {isCashClosed
          ? fmt(closedCashDifference)
          : closingCashInput === ""
          ? "-"
          : fmt(cashDifference)}
     </strong>
    </div>

        <div>
         <span>Status</span>
         <strong>{isCashClosed ? "Ditutup" : "Belum Ditutup"}</strong>
        </div>
    </div>

      <div
  style={{
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    background: "rgba(15, 23, 42, 0.04)",
    border: "1px solid rgba(15, 23, 42, 0.08)",
  }}
>
  <label
    style={{
      display: "block",
      marginBottom: 8,
      fontSize: 13,
      fontWeight: 900,
    }}
  >
    Kas Fisik di Laci
  </label>

  <input
    className="input"
    type="text"
    inputMode="numeric"
    value={closingCashInput}
    onChange={e => setClosingCashInput(e.target.value)}
    placeholder="Contoh: 1000"
    style={{ width: "100%" }}
  />
</div>

    <div className="cash-detail-note">
     {isCashClosed
      ? "Kas hari ini sudah ditutup. Data ini menjadi arsip penutupan kas."
      : "Masukkan jumlah uang tunai fisik yang benar-benar ada di laci saat toko tutup."}
    </div>

    <div className="cash-flow-section">
      <div className="cash-flow-title">Arus Kas Hari Ini</div>

      {cashFlowRows.length === 0 ? (
        <div className="cash-flow-empty">
          Belum ada arus kas hari ini.
        </div>
      ) : (
        <div className="cash-flow-list">
          {cashFlowRows.map(row => (
            <div className="cash-flow-item" key={row.id}>
              <div className="cash-flow-left">
                <div className="cash-flow-time">
                  {new Date(row.time).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
            </div>

            <div>
              <div className="cash-flow-name">{row.title}</div>
              <div className="cash-flow-sub">{row.subtitle}</div>
            </div>
          </div>

          <strong className={row.type === "out" ? "cash-out" : "cash-in"}>
            {row.type === "out" ? "-" : "+"} {fmt(row.amount)}
          </strong>
        </div>
      ))}
    </div>
  )}
  </div>

    {/* Arus Kas Hari Ini boleh tetap di sini */}

  <div
  style={{
    display: "flex",
    gap: 10,
    marginTop: 16,
    justifyContent: isCashClosed ? "center" : "stretch",
  }}
>
  <button
  type="button"
  className="btn btn-outline"
  style={{
    flex: isCashClosed ? "0 0 180px" : 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  }}
  onClick={() => setShowCloseCash(false)}
>
  {isCashClosed ? "Tutup" : "Batal"}
</button>

  {!isCashClosed && (
    <button
      type="button"
      className="btn btn-primary"
      style={{ flex: 1 }}
      onClick={saveCloseCash}
    >
      Simpan Tutup Kas
    </button>
  )}
</div>
    </div>
    </div>
)}

  <div className="wallet-transfer-detail">
  <div className="wallet-transfer-title">Rincian Transfer</div>

  {transferDetailsToday.length === 0 ? (
    <div className="wallet-transfer-empty">
      Belum ada transfer hari ini.
    </div>
  ) : (
    <div className="wallet-transfer-list">
      {transferDetailsToday.map(([detail, amount]) => (
        <div className="wallet-transfer-item" key={detail}>
          <span>{detail}</span>
          <strong>{fmt(amount)}</strong>
        </div>
      ))}
    </div>
  )}
</div>

  <div className="wallet-actions">
    <div className="wallet-action-label">
  {isCashClosed ? "Kas Awal Shift Baru:" : "Ubah Kas Awal:"}
</div>

    <input
  className="input"
  type="text"
  inputMode="numeric"
  value={openingCashInput}
  onChange={e => setOpeningCashInput(e.target.value)}
  placeholder={isCashClosed ?"Kas awal shift baru" : "Kas awal"}
/>

    <button
  type="button"
  className="btn btn-primary"
  onClick={saveOpeningCash}
>
  {isCashClosed ? "Buka Kas Baru" : "Simpan"}
</button>

    <button
  type="button"
  className="btn btn-outline"
  onClick={() => addCashMovement("in")}
  hidden={isCashClosed}
  style={{ display: isCashClosed ? "none" : undefined }}
>
  + Pemasukan
</button>

    <button
  type="button"
  className="btn btn-outline btn-danger-soft"
  onClick={() => addCashMovement("out")}
  hidden={isCashClosed}
  style={{ display: isCashClosed ? "none" : undefined }}
>
  - Pengeluaran
</button>

    <button
  type="button"
  className="btn btn-outline"
  onClick={() => setShowCashHistory(true)}
>
  Riwayat Kas
</button>

<button
  type="button"
  className="btn btn-outline"
  onClick={() => setShowCashDetail(true)}
>
  Detail Dompet
</button>

<button
  type="button"
  className="btn btn-outline btn-danger-soft"
  onClick={() => setShowCloseCash(true)}
>
  {isCashClosed ? "Detail Tutup Kas" : "Tutup Kas"}
</button>

  </div>
</div>

{fifoMismatchCount > 0 && (
  <div
    className="card"
    style={{
      marginTop: 24,
      marginBottom: 24,
      padding: 14,
      border: "1px solid rgba(230, 57, 70, 0.20)",
      background: "rgba(230, 57, 70, 0.04)",
    }}
  >
    <div
      style={{
        fontSize: 13,
        fontWeight: 900,
        marginBottom: 10,
        color: "var(--danger)",
      }}
    >
      Detail Selisih FIFO
    </div>

    <div
      style={{
        fontSize: 12,
        color: "var(--text-muted)",
        lineHeight: 1.6,
        marginBottom: 12,
      }}
    >
      Selisih ini berarti stok produk dan total batch FIFO tidak sama.
      Jangan langsung disamakan sebelum cek fisik barang dan penyebabnya.
    </div>

    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Produk</th>
            <th style={{ textAlign: "right" }}>Stok Produk</th>
            <th style={{ textAlign: "right" }}>Stok FIFO</th>
            <th style={{ textAlign: "right" }}>Selisih</th>
            <th style={{ textAlign: "center" }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {fifoMismatchRows.slice(0, 5).map(row => {
  const lastOpname = (stockOpnames || []).find(
    opname => Number(opname.product_id) === Number(row.productId)
  );

  return (
    <tr key={row.productId}>
      <td>
        <strong>{row.name}</strong>

        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {row.category || "-"}
        </div>

        {lastOpname && (
          <div
            style={{
              marginTop: 4,
              fontSize: 11,
              color: "var(--primary)",
              fontWeight: 800,
            }}
          >
            Opname terakhir: fisik {lastOpname.physical_stock} ·{" "}
            {lastOpname.reason || "-"}
          </div>
        )}
      </td>

      <td style={{ textAlign: "right" }}>{row.productStock}</td>

      <td style={{ textAlign: "right" }}>{row.batchQty}</td>

      <td
        style={{
          textAlign: "right",
          color: row.diff > 0 ? "var(--danger)" : "var(--primary)",
          fontWeight: 900,
        }}
      >
        {row.diff}
      </td>

      <td style={{ textAlign: "center" }}>
        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={() => openOpnameModal(row)}
        >
          Catat Opname
        </button>
      </td>
    </tr>
  );
})}
        </tbody>
      </table>
    </div>

{fifoMismatchRows.length > 5 && (
  <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
    Menampilkan 5 dari {fifoMismatchRows.length} produk selisih.
  </div>
)}
</div>
)}

{fifoMismatchCount === 0 && fifoAuditRows.length > 0 && (
  <div
    className="card"
    style={{
      marginTop: 24,
      marginBottom: 24,
      padding: 14,
      border: "1px solid rgba(30, 111, 92, 0.18)",
      background: "rgba(30, 111, 92, 0.05)",
      color: "var(--primary)",
      fontSize: 13,
      fontWeight: 800,
    }}
  >
    ✅ Audit FIFO aman. Semua produk FIFO ON sudah cocok antara stok produk dan stock batches.
  </div>
)}

{opnameModal && (
  <div className="modal-backdrop">
    <div className="modal-card">
      <div
        style={{
          position: "relative",
          textAlign: "center",
          padding: "0 52px",
          marginBottom: 16,
        }}
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={closeOpnameModal}
          aria-label="Tutup"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            zIndex: 10,
          }}
        >
          ×
        </button>

        <h3
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 900,
            textAlign: "center",
          }}
        >
          Catat Opname FIFO
        </h3>

        <p
          style={{
            margin: "6px 0 0",
            color: "var(--text-muted)",
            fontSize: 13,
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          Form ini hanya menyimpan catatan opname. Belum mengubah stok produk atau batch FIFO.
        </p>
      </div>

      <div
        style={{
          padding: 12,
          borderRadius: 12,
          background: "var(--bg)",
          marginBottom: 14,
          fontSize: 13,
          lineHeight: 1.8,
        }}
      >
        <div>
          <strong>Produk:</strong> {opnameModal.name}
        </div>
        <div>
          <strong>Kategori:</strong> {opnameModal.category || "-"}
        </div>
        <div>
          <strong>Stok Produk:</strong> {opnameModal.productStock}
        </div>
        <div>
          <strong>Stok FIFO:</strong> {opnameModal.batchQty}
        </div>
        <div>
          <strong>Selisih Sistem:</strong>{" "}
          <span
            style={{
              color: opnameModal.diff > 0 ? "var(--danger)" : "var(--primary)",
              fontWeight: 900,
            }}
          >
            {opnameModal.diff}
          </span>
        </div>
      </div>

      <div className="form-row">
        <label>Stok Fisik Sebenarnya</label>
        <input
          className="input"
          type="text"
          inputMode="numeric"
          value={opnameForm.physicalStock}
          onChange={e => {
            const cleanValue = e.target.value.replace(/\D/g, "");
            setOpnameForm(prev => ({
              ...prev,
              physicalStock: cleanValue,
            }));
          }}
          placeholder="Contoh: 10"
        />
      </div>

      <div className="form-row">
        <label>Alasan Selisih</label>
        <select
          className="input"
          value={opnameForm.reason}
          onChange={e =>
            setOpnameForm(prev => ({
              ...prev,
              reason: e.target.value,
            }))
          }
        >
          <option>Koreksi opname</option>
          <option>Salah input kasir</option>
          <option>Barang rusak</option>
          <option>Barang hilang</option>
          <option>Restock belum sesuai</option>
          <option>Lainnya</option>
        </select>
      </div>

      <div className="form-row">
        <label>Catatan</label>
        <textarea
          className="input"
          rows={3}
          value={opnameForm.note}
          onChange={e =>
            setOpnameForm(prev => ({
              ...prev,
              note: e.target.value,
            }))
          }
          placeholder="Contoh: fisik dihitung ulang oleh kasir malam"
        />
      </div>

      {physicalStockValue !== null && (
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: "rgba(30, 111, 92, 0.07)",
            marginTop: 12,
            fontSize: 13,
            lineHeight: 1.8,
          }}
        >
          <div>
            <strong>Stok fisik:</strong> {physicalStockValue}
          </div>
          <div>
            <strong>Selisih fisik vs stok produk:</strong>{" "}
            <span
              style={{
                color: physicalDifference < 0 ? "var(--danger)" : "var(--primary)",
                fontWeight: 900,
              }}
            >
              {physicalDifference}
            </span>
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
            Catatan ini akan disimpan sebagai riwayat opname. Stok belum dikoreksi otomatis.
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 16,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          className="btn btn-outline"
          style={{ flex: 1 }}
          onClick={closeOpnameModal}
        >
          Tutup
        </button>

        <button
  type="button"
  className="btn btn-primary"
  style={{ flex: 1 }}
  disabled={savingOpname}
  onClick={saveOpname}
>
  {savingOpname ? "Menyimpan..." : "Simpan Opname"}
</button>
      </div>
    </div>
  </div>
)}

        <div className="dashboard-two-columns">        
        <div className="dashboard-two-columns">  
        <div className="card">
  <div className="section-header">
    <div>
      <div className="section-title">🏆 Produk Terlaris Hari Ini</div>
      <div className="section-subtitle dashboard-small-subtitle">Berdasarkan jumlah item terjual hari ini</div>
    </div>
  </div>

  {topProductsToday.length === 0 ? (
    <div className="empty-state">Belum ada produk terjual hari ini.</div>
  ) : (
    <div className="top-product-compact-list">
      {topProductsToday.map(([name, qty], i) => (
        <div key={name} className="top-product-compact-row">
          <div className="rank-badge">{i + 1}</div>

          <div className="top-product-compact-main">
            <div className="top-product-compact-name">{name}</div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: Math.max(8, (qty / maxSoldToday) * 100) + "%" }}
              />
            </div>
          </div>

          <div className="top-product-compact-qty">
            {qty} terjual
          </div>
        </div>
      ))}
    </div>
  )}
</div>

        <div className="card">
          <div className="section-header">
            <div className="section-title">🏆 Produk Terlaris Keseluruhan</div>
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
      </div>

        <div className="card" style={{ marginBottom: 24 }}>
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

      <div className="grid-2">
        <div className="card">
          <div className="section-header">
            <div className="section-title">⚠️ Stok Hampir Habis</div>
          </div>
          {lowStock.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "10px 0" }}>Semua stok aman ✅</div>
          ) : lowStock.map(p => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}> {p.name}</div>
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

// ─── REPORTS ────────────────────────────────────────────────────────────────
function CashShiftReport({ cashSessions, transactions, cashMovements }) {
  const [selectedShift, setSelectedShift] = useState(null);
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentFilter, setPaymentFilter] = useState("Semua");

  const reportRows = [...cashSessions]
    .filter(session => String(session.date || session.created_at || "").slice(0, 10) === reportDate)
    .sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date))
    .map(session => {
      const sessionTxnsAll = transactions.filter(
  t =>
    t.status !== "void" &&
    Number(t.cashSessionId || t.cash_session_id) === Number(session.id)
);

      const sessionTxns =
        paymentFilter === "Semua"
        ? sessionTxnsAll
        : sessionTxnsAll.filter(t => (t.payMethod || t.pay_method) === paymentFilter);

      const sessionMovements = cashMovements.filter(
        m => Number(m.session_id) === Number(session.id)
      );

      const openingCash = Number(session.opening_cash || 0);
      const closingCash = Number(session.closing_cash || 0);

      const cashSales = sessionTxns
        .filter(t => t.payMethod === "Tunai" || t.pay_method === "Tunai")
        .reduce((sum, t) => sum + Number(t.total || 0), 0);

      const qrisSales = sessionTxns
        .filter(t => t.payMethod === "QRIS" || t.pay_method === "QRIS")
        .reduce((sum, t) => sum + Number(t.total || 0), 0);

      const transferSales = sessionTxns
        .filter(t => t.payMethod === "Transfer" || t.pay_method === "Transfer")
        .reduce((sum, t) => sum + Number(t.total || 0), 0);

      const cashIn = sessionMovements
        .filter(m => m.type === "in")
        .reduce((sum, m) => sum + Number(m.amount || 0), 0);

      const cashOut = sessionMovements
        .filter(m => m.type === "out")
        .reduce((sum, m) => sum + Number(m.amount || 0), 0);

      const systemCash = openingCash + cashSales + cashIn - cashOut;
      const difference = String(session.status || "").toLowerCase() === "closed"
        ? closingCash - systemCash
        : 0;

      return {
        session,
        openingCash,
        closingCash,
        cashSales,
        qrisSales,
        transferSales,
        cashIn,
        cashOut,
        systemCash,
        difference,
        transactionCount: sessionTxns.length,
        transactions: sessionTxns,
      };
    });

    const dailySummary = reportRows.reduce(
  (acc, row) => {
    acc.totalShift += 1;
    acc.cashSales += Number(row.cashSales || 0);
    acc.qrisSales += Number(row.qrisSales || 0);
    acc.transferSales += Number(row.transferSales || 0);
    acc.cashIn += Number(row.cashIn || 0);
    acc.cashOut += Number(row.cashOut || 0);
    acc.systemCash += Number(row.systemCash || 0);

    if (String(row.session.status || "").toLowerCase() === "closed") {
      acc.closingCash += Number(row.closingCash || 0);
      acc.difference += Number(row.difference || 0);
      acc.closedShift += 1;
    } else {
      acc.openShift += 1;
    }

    return acc;
  },
  {
    totalShift: 0,
    closedShift: 0,
    openShift: 0,
    cashSales: 0,
    qrisSales: 0,
    transferSales: 0,
    cashIn: 0,
    cashOut: 0,
    systemCash: 0,
    closingCash: 0,
    difference: 0,
  }
);

  return (
    <div>
      <div className="report-header">
  <div>
    <h2>Laporan Kas per Shift</h2>
    <p>Ringkasan buka dan tutup kas berdasarkan sesi shift.</p>
  </div>

  <div className="daily-report-summary">
  <div className="daily-summary-main">
    <span>Ringkasan Tanggal</span>
    <strong>
      {new Date(reportDate).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}
    </strong>
    <small>
      {dailySummary.totalShift} shift · {dailySummary.closedShift} ditutup · {dailySummary.openShift} open
    </small>
  </div>

  <div className="daily-summary-grid">
    <div>
      <span>Penjualan Tunai</span>
      <strong>{fmt(dailySummary.cashSales)}</strong>
    </div>

    <div>
      <span>QRIS</span>
      <strong>{fmt(dailySummary.qrisSales)}</strong>
    </div>

    <div>
      <span>Transfer</span>
      <strong>{fmt(dailySummary.transferSales)}</strong>
    </div>

    <div>
      <span>Pemasukan</span>
      <strong>{fmt(dailySummary.cashIn)}</strong>
    </div>

    <div>
      <span>Pengeluaran</span>
      <strong className="cash-out">{fmt(dailySummary.cashOut)}</strong>
    </div>

    <div>
      <span>Selisih Kas</span>
      <strong className={dailySummary.difference < 0 ? "cash-out" : "cash-in"}>
        {fmt(dailySummary.difference)}
      </strong>
    </div>
  </div>
</div>

  <div className="report-date-filter">
    <label>Tanggal</label>
    <input
      className="input"
      type="date"
      value={reportDate}
      onChange={e => setReportDate(e.target.value)}
    />
  </div>

  <div className="report-payment-filter">
  {["Semua", "Tunai", "QRIS", "Transfer"].map(method => (
    <button
      key={method}
      type="button"
      className={paymentFilter === method ? "btn btn-primary btn-sm" : "btn btn-outline btn-sm"}
      onClick={() => setPaymentFilter(method)}
    >
      {method}
    </button>
  ))}
</div>

</div>

      <div className="shift-report-list">
        {reportRows.length === 0 ? (
          <div className="empty-state">
            Belum ada sesi kas.
          </div>
        ) : (
          reportRows.map(row => (
            <div className="shift-report-card" key={row.session.id}>
              <div className="shift-report-top">
                <div>
                  <div className="shift-report-title">
                    Shift #{row.session.id}
                    <span
  className={
    String(row.session.status || "").toLowerCase() === "closed"
      ? "badge badge-red"
      : "badge badge-green"
  }
>
  {String(row.session.status || "").toLowerCase() === "closed" ? "Ditutup" : "Open"}
</span>
                  </div>

                  <div className="shift-report-sub">
                    {new Date(row.session.created_at || row.session.date).toLocaleString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                <div className="shift-report-total">
                  <span>Saldo Sistem</span>
                  <strong>{fmt(row.systemCash)}</strong>
                </div>
              </div>

              <div className="shift-report-grid">
                <div>
                  <span>Kas Awal</span>
                  <strong>{fmt(row.openingCash)}</strong>
                </div>

                <div>
                  <span>Penjualan Tunai</span>
                  <strong>{fmt(row.cashSales)}</strong>
                </div>

                <div>
                  <span>QRIS</span>
                  <strong>{fmt(row.qrisSales)}</strong>
                </div>

                <div>
                  <span>Transfer</span>
                  <strong>{fmt(row.transferSales)}</strong>
                </div>

                <div>
                  <span>Pemasukan</span>
                  <strong>{fmt(row.cashIn)}</strong>
                </div>

                <div>
                  <span>Pengeluaran</span>
                  <strong className="cash-out">{fmt(row.cashOut)}</strong>
                </div>

                <div>
                  <span>Kas Fisik</span>
                  <strong>{String(row.session.status).toLowerCase() === "closed" ? fmt(row.closingCash) : "-"}</strong>
                </div>

                <div>
                  <span>Selisih</span>
                  <strong className={row.difference < 0 ? "cash-out" : "cash-in"}>
                    {String(row.session.status).toLowerCase() === "closed" ? fmt(row.difference) : "-"}
                  </strong>
                </div>
              </div>

              <div className="shift-report-footer">
  <span>{row.transactionCount} transaksi</span>

  <button
  type="button"
  className="btn btn-sm btn-outline"
  onClick={() => setSelectedShift(row)}
>
  Lihat Detail
</button>
</div>
            </div>
          ))
          )};

{selectedShift && (
  <div className="modal-backdrop">
    <div className="modal-card print-shift-report">
      <div
        style={{
          position: "relative",
          textAlign: "center",
          padding: "0 52px",
          marginBottom: 16,
        }}
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={() => setSelectedShift(null)}
          aria-label="Tutup"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
          }}
        >
          ×
        </button>

        <h3
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 900,
            textAlign: "center",
          }}
        >
          Detail Shift #{selectedShift.session.id}
        </h3>

        <p
          style={{
            margin: "6px 0 0",
            color: "var(--text-muted)",
            fontSize: 14,
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          Rincian kas dan pembayaran per sesi shift
        </p>
      </div>

      <div className="cash-close-summary">
        <div>
          <span>Kas Awal</span>
          <strong>{fmt(selectedShift.openingCash)}</strong>
        </div>

        <div>
          <span>Penjualan Tunai</span>
          <strong>{fmt(selectedShift.cashSales)}</strong>
        </div>

        <div>
          <span>QRIS</span>
          <strong>{fmt(selectedShift.qrisSales)}</strong>
        </div>

        <div>
          <span>Transfer</span>
          <strong>{fmt(selectedShift.transferSales)}</strong>
        </div>

        <div>
          <span>Pemasukan</span>
          <strong>{fmt(selectedShift.cashIn)}</strong>
        </div>

        <div>
          <span>Pengeluaran</span>
          <strong className="cash-out">{fmt(selectedShift.cashOut)}</strong>
        </div>

        <div>
          <span>Kas Fisik</span>
          <strong>
            {String(selectedShift.session.status || "").toLowerCase() === "closed"
              ? fmt(selectedShift.closingCash)
              : "-"}
          </strong>
        </div>

        <div>
          <span>Selisih</span>
          <strong className={selectedShift.difference < 0 ? "cash-out" : "cash-in"}>
            {String(selectedShift.session.status || "").toLowerCase() === "closed"
              ? fmt(selectedShift.difference)
              : "-"}
          </strong>
        </div>
      </div>

      <div className="cash-detail-note">
        {selectedShift.transactionCount} transaksi dalam shift ini.
      </div>

      <div className="shift-detail-transactions">
  <div className="shift-detail-section-title">Daftar Transaksi Shift Ini</div>

  {selectedShift.transactions.length === 0 ? (
    <div className="empty-state">
      Belum ada transaksi untuk shift ini.
    </div>
  ) : (
    <div className="shift-transaction-list">
      {selectedShift.transactions.map(t => (
        <div className="shift-transaction-item" key={t.id}>
          <div>
            <div className="shift-transaction-title">
              TRX #{String(t.id).padStart(4, "0")}
            </div>

            <div className="shift-transaction-sub">
              {new Date(t.date || t.created_at).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })} · {t.payMethod || t.pay_method || "-"}
              {(t.paymentDetail || t.payment_detail) ? " · " + (t.paymentDetail || t.payment_detail) : ""}
            </div>
          </div>

          <strong>{fmt(t.total || 0)}</strong>
        </div>
      ))}
    </div>
  )}
</div>

      <div
  style={{
    display: "flex",
    gap: 10,
    justifyContent: "center",
    marginTop: 16,
    flexWrap: "wrap",
  }}
>
  <button
    type="button"
    className="btn btn-outline"
    style={{
      width: 180,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
    }}
    onClick={() => setSelectedShift(null)}
  >
    Tutup
  </button>

  <button
    type="button"
    className="btn btn-primary"
    style={{
      width: 180,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
    }}
    onClick={() => window.print()}
  >
    Cetak Laporan
  </button>
</div>
    </div>
  </div>
)}

      </div>
    </div>
  );
}

// ─── CASHIER ─────────────────────────────────────────────────────────────────
function Cashier({ products, onTransaction, settings, variants, cashSession, }) {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [payMethod, setPayMethod] = useState("Tunai");
  const [cashInput, setCashInput] = useState("");
  const [showPayModal, setShowPayModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastTxn, setLastTxn] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [catFilter, setCatFilter] = useState("Semua");
  const [selectedBankAccount, setSelectedBankAccount] = useState(null);
  const [showClosedAlert, setShowClosedAlert] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const isCashClosed = String(cashSession?.status || "").toLowerCase() === "closed";

  const bankAccounts = [
  {
    bank: "BRI",
    number: "618101000014566",
    name: "GALANG YOGA ADHITAMA",
  },
  {
    bank: "DANA",
    number: "085888100995",
    name: "GALANG YOGA ADHITAMA",
  },
];

  const activeProducts = products
  .filter(p => p.active)
  .sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""), "id", {
      numeric: true,
      sensitivity: "base",
    })
  );
  const categories = [...new Set(activeProducts.map(p => p.category).filter(Boolean))]
  .filter(c => c !== "Semua")
  .sort((a, b) =>
    String(a || "").localeCompare(String(b || ""), "id", {
      numeric: true,
      sensitivity: "base",
    })
  );

const getCartQty = (productId) => {
  const found = cart.find(c => c.id === productId);
  return found ? Number(found.qty || 0) : 0;
};

const cartCount = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);

const getProductVariants = (productId) => {
  return (variants || []).filter(
    v => Number(v.product_id) === Number(productId) && v.active !== false
  );
};

const getCartStockQty = (productId) => {
  return cart
    .filter(item => Number(item.productId || item.id) === Number(productId))
    .reduce((sum, item) => {
      const multiplier = Number(item.stockQtyPerItem || 1);
      return sum + Number(item.qty || 0) * multiplier;
    }, 0);
};

const getVariantCartQty = (productId, variantId) => {
  const cartId = productId + "-v-" + variantId;
  const found = cart.find(item => item.id === cartId);
  return found ? Number(found.qty || 0) : 0;
};

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

const addVariantToCart = (p, variant) => {
  setCart(prev => {
    const multiplier = Number(variant.qty_multiplier || 1);
    const currentStockQty = getCartStockQty(p.id);
    const stock = Number(p.stock || 0);

    if (currentStockQty + multiplier > stock) {
      alert("Stok " + p.name + " tidak cukup.");
      return prev;
    }

    const cartId = p.id + "-v-" + variant.id;
    const existing = prev.find(item => item.id === cartId);

    if (existing) {
      return prev.map(item =>
        item.id === cartId
          ? { ...item, qty: Number(item.qty || 0) + 1 }
          : item
      );
    }

    return [
      ...prev,
      {
        id: cartId,
        productId: p.id,
        variantId: variant.id,
        name: p.name + " - " + variant.name,
        image: p.image,
        price: Number(variant.price || 0),
        cost: Number(p.cost || 0),
        discount: 0,
        qty: 1,
        unit: p.unit,
        stockQtyPerItem: multiplier,
        stock_management: p.stock_management,
      },
    ];
  });
};

  const updateQty = (id, delta) => {
  const target = cart.find(item => item.id === id);
  if (!target) return;

  const productId = Number(target.productId || target.id);
  const product = products.find(p => Number(p.id) === productId);
  const stock = Number(product?.stock || 0);
  const multiplier = Number(target.stockQtyPerItem || 1);

  if (delta > 0) {
    const usedStockQty = cart
      .filter(item => Number(item.productId || item.id) === productId)
      .reduce((sum, item) => {
        return sum + Number(item.qty || 0) * Number(item.stockQtyPerItem || 1);
      }, 0);

    if (usedStockQty + multiplier > stock) {
      alert("Stok " + target.name + " tidak cukup.");
      return;
    }
  }

  setCart(prev =>
    prev
      .map(item =>
        item.id === id
          ? { ...item, qty: Math.max(0, Number(item.qty || 0) + delta) }
          : item
      )
      .filter(item => Number(item.qty || 0) > 0)
  );
};

  const subtotal = cart.reduce((sum, item) => {
  const disc = item.discount || 0;
    return sum + Math.round(item.price * item.qty * (1 - disc / 100));
  }, 0);
  const discountAmount = Number(discount || 0);
  const total = Math.max(0, subtotal - discountAmount);
  const getPaymentSuggestions = (amount) => {
  const totalAmount = Number(amount || 0);

  const commonBills = [
    5000,
    10000,
    20000,
    50000,
    100000,
    150000,
    200000,
    300000,
    500000,
  ];

  const roundedUp = [
    Math.ceil(totalAmount / 5000) * 5000,
    Math.ceil(totalAmount / 10000) * 10000,
    Math.ceil(totalAmount / 50000) * 50000,
    Math.ceil(totalAmount / 100000) * 100000,
  ];

  return Array.from(
    new Set([
      totalAmount,
      ...commonBills.filter(v => v >= totalAmount),
      ...roundedUp.filter(v => v >= totalAmount),
    ])
  )
    .filter(v => v > 0)
    .sort((a, b) => a - b)
    .slice(0, 5);
};

const paymentSuggestions = getPaymentSuggestions(total);
  const cash = Number(cashInput) || 0;
  const change = cash - total;

  const handlePay = async () => {
    if (isPaying) return;

    if (cart.length === 0) {
      alert("Keranjang kosong. Tambahkan produk sebelum bayar.");
      return;
    }

    const cashIsOpen =
      cashSession &&
      cashSession.id &&
      String(cashSession.status || "").toLowerCase() !== "closed";

    if (!cashIsOpen) {
      alert("Kas awal belum dibuka. Isi Kas Awal dulu sebelum transaksi.");
      return;
    }
    if (isCashClosed) {
      setShowClosedAlert(true);
      return;
    }

  if (payMethod === "Transfer" && !selectedBankAccount) {
  alert("Pilih rekening tujuan transfer dulu.");
  return;
}

  if (payMethod === "Tunai" && (cash < total || !cashInput)) {
    alert("Uang diterima belum cukup.");
    return;
  }

    const txn = {
  id: Date.now(),
  date: new Date().toISOString(),
  items: cart.map(c => ({
    productId: Number(c.productId || c.id),
    variantId: c.variantId || null,
    name: c.name,
    qty: Number(c.qty || 0),
    stockQtyPerItem: Number(c.stockQtyPerItem || 1),
    stockQtyTotal: Number(c.qty || 0) * Number(c.stockQtyPerItem || 1),
    price: Number(c.price || 0),
    cost: Number(c.cost || 0),
    discount: Number(c.discount || 0),
    subtotal: Math.round(Number(c.price || 0) * Number(c.qty || 0) * (1 - Number(c.discount || 0) / 100))
  })),
  subtotal,
  discountAmount,
  total,
  cost: cart.reduce((s, c) => s + Number(c.cost || 0) * Number(c.qty || 0), 0),
  profit: total - cart.reduce((s, c) => s + Number(c.cost || 0) * Number(c.qty || 0), 0),
  payMethod,
      paymentDetail:
        payMethod === "Transfer" && selectedBankAccount ? selectedBankAccount.bank + " - " + selectedBankAccount.number
      : payMethod === "QRIS" ? "QRIS"
      : "Tunai",
  cashSessionId: cashSession?.id || null,
  paid: cash,
  cashReceived: cash,
  payment: cash,
  change
};
    txn.profit = txn.total - txn.cost;

try {
  setIsPaying(true);

  const savedTxn = await onTransaction(txn);

  if (!savedTxn) {
    return;
  }

  setLastTxn(savedTxn);
  setCart([]);
  setDiscount(0);
  setCashInput("");
  setShowPayModal(false);
  setShowSuccess(true);
} catch (err) {
  alert("Gagal menyimpan transaksi: " + err.message);
} finally {
  setIsPaying(false);
}};

  if (showSuccess && lastTxn) {
    return (
      <div className="success-receipt-wrap">
        <div className="card">
          <div className="payment-success">
            <div className="success-icon"><Icon name="check" size={32} /></div>
            <div style={{ fontFamily: "Sora", fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Transaksi Berhasil!</div>
            <div style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 20 }}>TRX-{String(lastTxn.id).slice(-4).padStart(4, "0")} · {lastTxn.payMethod}</div>
          </div>
         <div id="receipt-print" className="receipt receipt-print">
            <div style={{ textAlign: "center", marginBottom: 8, lineHeight: 1.35 }}>
 
  {getReceiptHeaderLines(settings).map((line, index) => (
  <div
    key={index}
    style={{
      fontWeight: index < 2 ? 900 : 700,
      fontSize: index < 2 ? 13 : 11,
      textTransform: "uppercase",
    }}
  >
    {line}
  </div>
))}

  <span style={{ fontSize: 11 }}>
    {fmtDate(lastTxn.date)} {fmtTime(lastTxn.date)}
  </span>
</div>

            <hr className="receipt-divider" />
            {lastTxn.items.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>
  {String(item.name || "").toUpperCase()} x{item.qty}
  {item.discount ? ` (-${item.discount}%)` : ""}
</span>
                <span>{fmt(item.subtotal)}</span>
              </div>
            ))}
            <hr className="receipt-divider" />

<div style={{ display: "flex", justifyContent: "space-between" }}>
  <span>Subtotal</span>
  <span>{fmt(Number(lastTxn.subtotal || lastTxn.total || 0))}</span>
</div>

{Number(lastTxn.discountAmount || lastTxn.discount_amount || 0) > 0 && (
  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--danger)" }}>
    <span>Diskon Tambahan</span>
    <span>-{fmt(Number(lastTxn.discountAmount || lastTxn.discount_amount || 0))}</span>
  </div>
)}

<div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
  <span>TOTAL</span>
  <span>{fmt(lastTxn.total)}</span>
</div>
            {lastTxn.payMethod === "Tunai" && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
  <span>Bayar</span>
  <span>{fmt(Number(lastTxn.paid || lastTxn.cashReceived || lastTxn.payment || 0))}</span>
</div>

<div style={{ display: "flex", justifyContent: "space-between" }}>
  <span>Kembalian</span>
  <span>{fmt(Number(lastTxn.change || 0))}</span>
</div>
              </>
            )}
            <hr className="receipt-divider" />
            <div style={{ textAlign: "center", fontSize: 11 }}>{settings?.receipt_footer || "Terima kasih sudah berbelanja"} kasih sudah berbelanja! 🌿</div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>

  <button
    type="button"
    className="btn btn-primary"
    onClick={() => printThermalQZ(lastTxn, settings)}
  >
    <Icon name="printer" /> Cetak Struk
  </button>

  <button
    className="btn btn-primary"
    onClick={() => {setShowSuccess(false); setLastTxn(null); }}
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
        <div className="cashier-filter-area">
          <div className="input-group" style={{ width: "100%" }}>
            <span className="input-icon"><Icon name="search" size={15} /></span>
            <input className="input" placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="category-chips">
  <button
    type="button"
    className={catFilter === "Semua" ? "category-chip active" : "category-chip"}
    onClick={() => setCatFilter("Semua")}
  >
    Semua
  </button>

  {categories.map(c => (
    <button
      type="button"
      key={c}
      className={catFilter === c ? "category-chip active" : "category-chip"}
      onClick={() => setCatFilter(c)}
    >
      {c}
    </button>
  ))}
</div>
        </div>
        <div className="product-grid">
         {filtered.map(p => {
  const productVariants = getProductVariants(p.id);
const usedStockQty = getCartStockQty(p.id);
const inCart = usedStockQty;
const availableStock = Math.max(0, Number(p.stock || 0) - usedStockQty);

  return (
    <div
      key={p.id}
      className={
  "product-card-pos" +
  (availableStock === 0 && inCart === 0 ? " out-of-stock" : "") +
  (inCart > 0 ? " in-cart" : "")
}
      onClick={() => availableStock > 0 && addToCart(p)}
    >
      <div className="pname">{p.name}</div>
      <div className="pprice">
        {fmt(p.discount ? Math.round(p.price * (1 - p.discount / 100)) : p.price)}
      </div>

      {p.discount > 0 && (
        <span className="badge badge-orange" style={{ fontSize: 10 }}>
          Diskon {p.discount}%
        </span>
      )}

      <div className="pstock">
        Sisa: {availableStock} {p.unit}
      </div>

<div
  className="mobile-product-actions"
  onClick={(e) => e.stopPropagation()}
>
  {productVariants.length > 0 ? (
    <div className="variant-buttons">
      {productVariants.map(v => {
        const variantQty = getVariantCartQty(p.id, v.id);

        return (
          <button
            key={v.id}
            className={
              "variant-btn" + (variantQty > 0 ? " active" : "")
            }
            disabled={availableStock < Number(v.qty_multiplier || 1)}
            onClick={() => addVariantToCart(p, v)}
          >
            <span>{v.name}</span>
            <strong>{fmt(v.price)}</strong>
            {variantQty > 0 && <em>{variantQty}</em>}
          </button>
        );
      })}
    </div>
  ) : (
    <>
      {inCart > 0 ? (
        <>
          <button
            className="qty-btn"
            onClick={() => updateQty(p.id, -1)}
          >
            -
          </button>

          <span className="qty-num">{inCart}</span>

          <button
            className="qty-btn"
            disabled={availableStock === 0}
            onClick={() => availableStock > 0 && addToCart(p)}
          >
            +
          </button>
        </>
      ) : (
        <button
          className="btn btn-outline btn-sm"
          disabled={availableStock === 0}
          onClick={() => availableStock > 0 && addToCart(p)}
        >
          Tambah
        </button>
      )}
    </>
  )}
</div>

    </div>
  );
})} 

          {filtered.length === 0 && <div className="empty"><div className="empty-icon">🔍</div>Produk tidak ditemukan</div>}
        </div>
      </div>

      {/* CART */}

      <div
  id="cart-panel"
  className={
    "cart-panel mobile-cart-sheet" +
    (cartOpen ? " open" : "")
  }
>

<div
  className="mobile-sheet-head"
  onClick={() => setCartOpen(v => !v)}
>
  <div className="sheet-handle"></div>

  <div className="sheet-summary">
    <div>
      <div className="mobile-checkout-label">Total</div>
      <strong>{fmt(total)}</strong>
    </div>

    <button
      className="mobile-buy-btn"
      disabled={cart.length === 0}
      onClick={(e) => {
        e.stopPropagation();
        setShowPayModal(true);
      }}
    >
      Beli ({cartCount})
    </button>
  </div>
</div>
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
                <div className="cart-item-info">
                  <div className="cart-item-name">{c.name}</div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "var(--primary)" }}>{fmt(itemTotal)}</div>
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
    <label>Diskon Tambahan (Rp)</label>
    <input
  className="input"
  type="text"
  inputMode="numeric"
  value={Number(discount || 0).toLocaleString("id-ID")}
  onChange={e => {
    const rawValue = e.target.value.replace(/\D/g, "");
    const cleanValue = rawValue.replace(/^0+(?=\d)/, "");
    setDiscount(Number(cleanValue || 0));
  }}
  placeholder="Contoh: 5.000"
/>
  </div>

  <div className="cart-total-row">
    <span>Subtotal</span>
    <span>{fmt(subtotal)}</span>
  </div>

  {discountAmount > 0 && (
    <div className="cart-total-row" style={{ color: "var(--danger)" }}>
      <span>Diskon Tambahan</span>
      <span>-{fmt(discountAmount)}</span>
    </div>
  )}

  <div className="cart-total-row grand">
    <span>TOTAL</span>
    <span>{fmt(total)}</span>
  </div>

  <button
    className="btn btn-primary"
    style={{ width: "100%", marginTop: 12, padding: "13px" }}
    disabled={cart.length === 0}
    onClick={() => setShowPayModal(true)}
  >
    <Icon name="cart" /> Bayar Sekarang
  </button>
</div>
</div>

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
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                
      {["Tunai", "QRIS", "Transfer"].map(m => (
        <button
          key={m}
          type="button"
          className={`btn ${payMethod === m ? "btn-primary" : "btn-outline"}`}
          onClick={() => {
            setPayMethod(m);
            setSelectedBankAccount(null);
          }}
        >
          {m}
        </button>
      ))}
    </div>
  </div>

            {payMethod === "Tunai" && (
              <>
                <div className="form-row">
                  <label>Uang Diterima</label>
                  <input
  className="input"
  type="text"
  inputMode="numeric"
  value={cashInput ? Number(cashInput || 0).toLocaleString("id-ID") : ""}
  onChange={e => {
    const rawValue = e.target.value.replace(/\D/g, "");
    const cleanValue = rawValue.replace(/^0+(?=\d)/, "");
    setCashInput(cleanValue);
  }}
  placeholder="Masukkan uang diterima"
/>
<div className="payment-suggestions-wrap">
  <div className="payment-suggestions-center">
    <button
      type="button"
      className={
        Number(cashInput || 0) === total
          ? "payment-chip active"
          : "payment-chip"
      }
      onClick={() => setCashInput(String(total))}
    >
      Uang Pas
    </button>
  </div>

  <div className="payment-suggestions">
    {paymentSuggestions
      .filter(amount => amount !== total)
      .map(amount => (
        <button
          key={amount}
          type="button"
          className={
            Number(cashInput || 0) === amount
              ? "payment-chip active"
              : "payment-chip"
          }
          onClick={() => setCashInput(String(amount))}
        >
          {fmt(amount)}
        </button>
      ))}
  </div>
</div>
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

{payMethod === "QRIS" && (
  <div className="payment-info-box">
    <div className="payment-info-title">Scan QRIS</div>
    <div className="payment-info-subtitle">
      Minta pelanggan scan QRIS ini, lalu klik Bayar setelah pembayaran masuk.
    </div>

    <div className="qris-box">
      <img src="/qris.png" alt="QRIS Toko" />
    </div>

    <div className="payment-total-note">
      Total Tagihan: <strong>{fmt(total)}</strong>
    </div>
  </div>
)}

{payMethod === "Transfer" && (
  <div className="bank-account-list">
    {bankAccounts.map(account => {
      const isSelected =
        selectedBankAccount?.bank === account.bank &&
        selectedBankAccount?.number === account.number;

      return (
  <button
    key={account.bank + account.number}
    type="button"
    className={isSelected ? "payment-chip active" : "payment-chip"}
    style={{
      flexDirection: "column",
      alignItems: "center",
      gap: 2,
      minWidth: 180,
    }}
    onClick={() => setSelectedBankAccount(account)}
  >
    <div style={{ fontWeight: 900 }}>
      {account.bank} - {account.number}
    </div>

    <div style={{ fontSize: 12, marginTop: 3, opacity: 0.8 }}>
      a.n. {account.name || "-"}
    </div>
  </button>
);
    })}
  </div>
)}

<div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
  <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowPayModal(false)}>Batal</button>
  <button
    type="button"
    className="btn btn-primary"
    style={{ flex: 1 }}
    disabled={isPaying}
    onClick={handlePay}
  >
    <Icon name="check" /> {isPaying ? "Menyimpan..." : "Bayar"}
  </button>
</div>
</div>
</div>
)}

      {showClosedAlert && (
  <div className="mini-alert-backdrop">
    <div className="mini-alert-card">
      <div className="mini-alert-icon">🔒</div>

      <h3>Kas Sudah Ditutup</h3>

      <p>
        Transaksi baru tidak bisa disimpan karena sesi kas hari ini sudah ditutup.
        Buka kas baru untuk memulai shift berikutnya.
      </p>

      <button
        type="button"
        className="btn btn-primary"
        onClick={() => setShowClosedAlert(false)}
      >
        Mengerti
      </button>
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
  const [form, setForm] = useState({ name: "", category: "", price: "", cost: "", stock: "", unit: "pcs", image: "", discount: 0, active: true });
  const [stockModal, setStockModal] = useState(null);
  const [stockAdj, setStockAdj] = useState({ type: "tambah", qty: "", cost: "", note: "" });
  const savingProductRef = useRef(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockForm, setRestockForm] = useState({
  type: "tambah",
  qty: "",
  cost: "",
  note: "",
});
  const [savingRestock, setSavingRestock] = useState(false);

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

  const openRestock = (product) => {
    setRestockProduct(product);
    setRestockForm({
      type: "tambah",
      qty: "",
      cost: product.cost ? String(product.cost) : "",
      note: "",
    });
  };

 const saveRestock = async () => {
  if (!restockProduct || savingRestock) return;

  const type = restockForm.type || "tambah";
  const qty = Number(restockForm.qty || 0);
  const cost = Number(restockForm.cost || restockProduct.cost || 0);
  const note = restockForm.note || "";

  if (qty <= 0) {
    alert("Jumlah stok harus lebih dari 0.");
    return;
  }

  if (cost <= 0) {
    alert("Modal per pcs harus lebih dari 0.");
    return;
  }

  setSavingRestock(true);

  try {
    const currentStock = Number(restockProduct.stock || 0);

    if (type === "kurang" && qty > currentStock) {
      throw new Error(
        "Jumlah koreksi lebih besar dari stok produk. Stok sekarang " +
          currentStock +
          "."
      );
    }

    const nextStock =
      type === "tambah"
        ? currentStock + qty
        : Math.max(0, currentStock - qty);

    if (type === "tambah") {
      const [updatedProduct] = await sb.patch("products", restockProduct.id, {
        stock: nextStock,
        cost: cost,
        stock_management: true,
      });

      const [newBatch] = await sb.post("stock_batches", [
        {
          product_id: restockProduct.id,
          qty_in: qty,
          qty_remaining: qty,
          cost: cost,
          received_at: new Date().toISOString(),
        },
      ]);

      await sb.post("stock_movements", [
        {
          product_id: restockProduct.id,
          batch_id: newBatch.id || null,
          type: "IN",
          qty: qty,
          cost: cost,
          note: note || "Restock barang masuk",
        },
      ]);

      setProducts(prev =>
        prev.map(p =>
          Number(p.id) === Number(restockProduct.id)
            ? {
                ...p,
                ...updatedProduct,
                stock: nextStock,
                cost: cost,
                stock_management: true,
              }
            : p
        )
      );
    }

    if (type === "kurang") {
      if (restockProduct.stock_management) {
        const batches = await sb.get(
          "stock_batches",
          "?select=*&product_id=eq." +
            restockProduct.id +
            "&qty_remaining=gt.0&order=received_at.asc&order=id.asc"
        );

        const totalAvailable = batches.reduce(
          (sum, batch) => sum + Number(batch.qty_remaining || 0),
          0
        );

        if (totalAvailable < qty) {
          throw new Error(
            "Stok FIFO tidak cukup. Tersedia " +
              totalAvailable +
              ", dikurangi " +
              qty +
              "."
          );
        }

        let remainingQty = qty;
        const movementRows = [];

        for (const batch of batches) {
          if (remainingQty <= 0) break;

          const batchRemaining = Number(batch.qty_remaining || 0);
          const takeQty = Math.min(remainingQty, batchRemaining);
          const nextRemaining = batchRemaining - takeQty;
          const batchCost = Number(batch.cost || cost || 0);

          await sb.patch("stock_batches", batch.id, {
            qty_remaining: nextRemaining,
          });

          movementRows.push({
            product_id: restockProduct.id,
            batch_id: batch.id,
            type: "ADJUSTMENT",
            qty: -takeQty,
            cost: batchCost,
            note: note || "Koreksi stok keluar",
          });

          remainingQty -= takeQty;
        }

        if (movementRows.length > 0) {
          await sb.post("stock_movements", movementRows);
        }
      } else {
        await sb.post("stock_movements", [
          {
            product_id: restockProduct.id,
            batch_id: null,
            type: "ADJUSTMENT",
            qty: -qty,
            cost: cost,
            note: note || "Koreksi stok keluar",
          },
        ]);
      }

      const [updatedProduct] = await sb.patch("products", restockProduct.id, {
        stock: nextStock,
        cost: cost,
      });

      setProducts(prev =>
        prev.map(p =>
          Number(p.id) === Number(restockProduct.id)
            ? {
                ...p,
                ...updatedProduct,
                stock: nextStock,
                cost: cost,
              }
            : p
        )
      );
    }

    setRestockProduct(null);
    setRestockForm({
      type: "tambah",
      qty: "",
      cost: "",
      note: "",
    });

    alert(
      type === "tambah"
        ? "Restock berhasil disimpan."
        : "Koreksi stok berhasil disimpan."
    );
  } catch (err) {
    alert("Gagal menyimpan stok: " + err.message);
  } finally {
    setSavingRestock(false);
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
  const batches = await sb.get(
    "stock_batches",
    "?select=*&product_id=eq." +
      stockModal.id +
      "&qty_remaining=gt.0&order=received_at.asc&order=id.asc"
  );

  const totalAvailable = batches.reduce(
    (sum, batch) => sum + Number(batch.qty_remaining || 0),
    0
  );

  if (totalAvailable < qty) {
    throw new Error(
      "Stok FIFO tidak cukup. Tersedia " +
        totalAvailable +
        ", dikurangi " +
        qty +
        "."
    );
  }

  let remainingQty = qty;
  const movementRows = [];

  for (const batch of batches) {
    if (remainingQty <= 0) break;

    const batchRemaining = Number(batch.qty_remaining || 0);
    const takeQty = Math.min(remainingQty, batchRemaining);
    const nextRemaining = batchRemaining - takeQty;
    const batchCost = Number(batch.cost || cost || 0);

    await sb.patch("stock_batches", batch.id, {
      qty_remaining: nextRemaining,
    });

    movementRows.push({
      product_id: stockModal.id,
      batch_id: batch.id,
      type: "ADJUSTMENT",
      qty: -takeQty,
      cost: batchCost,
      note: stockAdj.note || "Koreksi stok FIFO manual",
    });

    remainingQty -= takeQty;
  }

  if (movementRows.length > 0) {
    await sb.post("stock_movements", movementRows);
  }
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

    alert("Koreksi stok berhasil disimpan. Refresh dashboard untuk melihat audit FIFO terbaru.");

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
          
          <div className="search-bar product-sticky-toolbar">
            <div className="input-group" style={{ flex: 1, }}>
              <span className="input-icon"><Icon name="search" size={15} /></span>
              <input className="input" placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={openAdd}><Icon name="plus" /> Tambah Produk</button>
          </div>
          <div className="card">
            <div className="table-wrap">
              <table className="table product-table">
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
                      <td><strong> {p.name}</strong></td>
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

    <button
  type="button"
  className="btn btn-sm btn-outline"
  onClick={() => openRestock(p)}
>
  Kelola Stok
</button>
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
                      <button
  type="button"
  className="btn btn-sm btn-outline"
  onClick={() => openRestock(p)}
>
  Kelola Stok
</button>
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
                <label>{editProduct ? "Stok" : "Stok Awal"}</label>
<input
  className="input"
  type="number"
  value={form.stock}
  disabled={!!editProduct?.stock_management}
  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
/>

{editProduct?.stock_management && (
  <div
    style={{
      marginTop: 6,
      fontSize: 12,
      color: "var(--text-muted)",
      fontWeight: 700,
      lineHeight: 1.5,
    }}
  >
    Stok produk FIFO tidak bisa diubah dari Edit Produk. Gunakan Restock, Koreksi Stok, atau Catat Opname agar batch FIFO tetap sinkron.
  </div>
)}
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

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Batal</button>

              <button
  type="button"
  className="btn btn-primary"
  style={{ flex: 1 }}
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    saveProduct();
  }}
  disabled={savingProduct}
>
  <Icon name="check" /> {savingProduct ? "Menyimpan..." : "Simpan"}
</button>
            </div>
          </div>
        </div>
      )}

      {restockProduct && (
        <div className="modal-overlay">
        <div className="modal">
        <div className="modal-header">
        <div>
          <h3>Kelola Stok Produk</h3>
          <p>{restockProduct.name}</p>
        </div>

        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={() => setRestockProduct(null)}
        >
          Tutup
        </button>
      </div>

      <div className="form-row">
        <label>Stok Sekarang</label>
        <input
          className="input"
          value={Number(restockProduct.stock || 0)}
          disabled
        />
      </div>

      <div className="form-row">
  <label>Jenis Penyesuaian</label>
  <div style={{ display: "flex", gap: 8 }}>
    <button
      type="button"
      className={
        restockForm.type === "tambah"
          ? "btn btn-primary"
          : "btn btn-outline"
      }
      onClick={() =>
        setRestockForm(prev => ({
          ...prev,
          type: "tambah",
        }))
      }
    >
      + Stok Masuk
    </button>

    <button
      type="button"
      className={
        restockForm.type === "kurang"
          ? "btn btn-danger"
          : "btn btn-outline"
      }
      onClick={() =>
        setRestockForm(prev => ({
          ...prev,
          type: "kurang",
        }))
      }
    >
      - Koreksi Kurang
    </button>
  </div>
</div>

      <div className="form-row">
        <label>
  {restockForm.type === "tambah" ? "Qty Masuk" : "Qty Dikurangi"}
</label>
        <input
          className="input"
          type="number"
          value={restockForm.qty}
          onChange={e =>
            setRestockForm(prev => ({
              ...prev,
              qty: e.target.value,
            }))
          }
          placeholder="Contoh: 20"
        />
      </div>

      <div className="form-row">
        <label>Modal per pcs</label>
        <input
          className="input"
          type="number"
          value={restockForm.cost}
          onChange={e =>
            setRestockForm(prev => ({
              ...prev,
              cost: e.target.value,
            }))
          }
          placeholder="Contoh: 15750"
        />
      </div>

      <div className="form-row">
  <label>Keterangan</label>
  <input
    className="input"
    value={restockForm.note || ""}
    onChange={e =>
      setRestockForm(prev => ({
        ...prev,
        note: e.target.value,
      }))
    }
    placeholder={
      restockForm.type === "tambah"
        ? "Contoh: restock dari supplier"
        : "Contoh: barang rusak / hilang / opname"
    }
  />
</div>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button
          type="button"
          className="btn btn-outline"
          style={{ flex: 1 }}
          onClick={() => setRestockProduct(null)}
        >
          Batal
        </button>

        <button
          type="button"
          className="btn btn-primary"
          style={{ flex: 1 }}
          onClick={saveRestock}
          disabled={savingRestock}
        >
          {savingRestock
  ? "Menyimpan..."
  : restockForm.type === "tambah"
  ? "Simpan Restock"
  : "Simpan Koreksi"}
        </button>
      </div>
    </div>
  </div>
)}

      {false && stockModal && (
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
function History({ transactions, settings, onVoidTransaction, cashSessions = [] }) {
  const [period, setPeriod] = useState("hari");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [detail, setDetail] = useState(null);
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().slice(0, 10));
  const [historyPayFilter, setHistoryPayFilter] = useState("Semua");
  const [historyShiftFilter, setHistoryShiftFilter] = useState("Semua");

  const printHistoryReceipt = (txn) => {
  const printWindow = window.open("", "_blank", "width=380,height=600");

  if (!printWindow) {
    alert("Popup print diblokir browser.");
    return;
  }

  const itemsHtml = (txn.items || []).map(item => `
    <div class="item">
      <div>
        <strong>${item.name}</strong>
        <small>${item.qty} x ${fmt(item.price)}</small>
      </div>
      <span>${fmt(item.subtotal)}</span>
    </div>
  `).join("");

  printWindow.document.write(`
    <html>
      <head>
        <title>Struk ${txn.id}</title>
        <style>
          @page { size: 58mm auto; margin: 0; }
          body {
            font-family: Arial, sans-serif;
            width: 58mm;
            margin: 0;
            padding: 8px;
            font-size: 11px;
            color: #000;
          }
          .center { text-align: center; }
          .line { border-top: 1px dashed #000; margin: 8px 0; }
          .row, .item {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            margin: 4px 0;
          }
          .item div { flex: 1; }
          small { display: block; font-size: 10px; }
          .total { font-weight: bold; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="center">
          <strong>${String(settings?.storeName || settings?.store_name || "Toko Telon Mindi").toUpperCase()}</strong><br/>
          ${settings?.store_address || ""}<br/>
          ${settings?.store_phone ? "WA: " + settings.store_phone : ""}
        </div>

        <div class="line"></div>

        <div>No: #${String(txn.id).padStart(4, "0")}</div>
        <div>Tanggal: ${fmtDate(txn.date)} ${fmtTime(txn.date)}</div>
        <div>Metode: ${txn.payMethod || "-"}</div>

        <div class="line"></div>

        ${itemsHtml}

        <div class="line"></div>

        <div class="row">
  <span>Subtotal</span>
  <span>${fmt(Number(txn.subtotal || txn.total || 0))}</span>
</div>

${
  Number(txn.discountAmount || txn.discount_amount || 0) > 0
    ? `
      <div class="row">
        <span>Diskon Tambahan</span>
        <span>-${fmt(Number(txn.discountAmount || txn.discount_amount || 0))}</span>
      </div>
    `
    : ""
}

<div class="row total">
  <span>TOTAL</span>
  <span>${fmt(txn.total)}</span>
</div>

        ${
          txn.payMethod === "Tunai"
            ? `
              <div class="row">
                <span>Bayar</span>
                <span>${fmt(Number(txn.paid || txn.cashReceived || txn.payment || 0))}</span>
              </div>
              <div class="row">
                <span>Kembalian</span>
                <span>${fmt(Number(txn.change || 0))}</span>
              </div>
            `
            : ""
        }

        <div class="line"></div>

        <div class="center">
          ${settings?.receipt_footer || "Terima kasih sudah berbelanja"}
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
};

  const now = new Date();

 const filtered = useMemo(() => {
  return transactions.filter(t => {
    const dateStr = new Date(t.date).toISOString().slice(0, 10);
    const selectedStr = selectedDate.slice(0, 10);
    const payMethod = t.payMethod || t.pay_method || "Tunai";

    if (historyPayFilter !== "Semua" && payMethod !== historyPayFilter) {
      return false;
  }

    const txnSessionId = t.cashSessionId || t.cash_session_id || null;

    if (historyShiftFilter !== "Semua" && Number(txnSessionId) !== Number(historyShiftFilter)) {
    return false;
  }

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
}, [transactions, period, selectedDate, historyPayFilter, historyShiftFilter]);

  const activeFiltered = filtered.filter(t => t.status !== "void");

const omzet = activeFiltered.reduce((s, t) => s + Number(t.total || 0), 0);
const profit = activeFiltered.reduce((s, t) => s + Number(t.profit || 0), 0);
const itemsSold = activeFiltered.reduce(
  (s, t) => s + (t.items || []).reduce((a, i) => a + Number(i.qty || 0), 0),
  0
);

  const periods = [{ id: "hari", label: "Harian" }, { id: "minggu", label: "Mingguan" }, { id: "bulan", label: "Bulanan" }, { id: "tahun", label: "Tahunan" }];

  return (
    <div>
      <div className="page-header">
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

<div className="report-payment-filter">
  {["Semua", "Tunai", "QRIS", "Transfer"].map(method => (
    <button
      key={method}
      type="button"
      className={historyPayFilter === method ? "btn btn-primary btn-sm" : "btn btn-outline btn-sm"}
      onClick={() => setHistoryPayFilter(method)}
    >
      {method}
    </button>
  ))}
</div>

<select
  className="input"
  value={historyShiftFilter}
  onChange={e => setHistoryShiftFilter(e.target.value)}
  style={{ width: 240 }}
>
  <option value="Semua">Semua Shift</option>

  {[...cashSessions]
    .sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date))
    .map(session => (
      <option key={session.id} value={session.id}>
        Shift #{session.id} · {String(session.status || "").toLowerCase() === "closed" ? "Ditutup" : "Open"} ·{" "}
        {new Date(session.created_at || session.date).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        })}
      </option>
    ))}
</select>

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

      <div className="history-stats-grid" style={{ marginBottom: 20 }}>
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
            <thead>
              <tr>
                <th style={{textAlign: "center"}}>No.</th>
                <th style={{textAlign: "center"}}>Tanggal & Waktu</th>
                <th style={{textAlign: "center"}}>Item</th>
                <th style={{textAlign: "center"}}>Total</th>
                <th style={{textAlign: "center"}}>Profit</th>
                <th style={{textAlign: "center"}}>Bayar</th>
                <th style={{textAlign: "center"}}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {[...filtered].sort((a, b) => new Date(b.date) - new Date(a.date)).map((t, i) => (

                <tr key={t.id}>
  <td style={{ textAlign: "center", verticalAlign: "middle" }}>
    #{t.id.toString().padStart(4, "0")}
  </td>

  <td style={{ textAlign: "center", verticalAlign: "middle" }}>
    <div style={{ fontSize: 13, textAlign: "center" }}>{fmtDate(t.date)}</div>
    <div
      style={{
        fontSize: 11.5,
        color: "var(--text-muted)",
        textAlign: "center",
      }}
    >
      {fmtTime(t.date)}
    </div>
  </td>

  <td style={{ textAlign: "center", verticalAlign: "middle" }}>
    {t.items.reduce((s, i) => s + i.qty, 0)} item
  </td>

  <td
  style={{
    textAlign: "center",
    verticalAlign: "middle",
    fontWeight: 700,
    color: "var(--primary)",
  }}
>
  <div>{fmt(t.total)}</div>

  {Number(t.discountAmount || t.discount_amount || 0) > 0 && (
    <div
      style={{
        marginTop: 3,
        fontSize: 11,
        color: "var(--danger)",
        fontWeight: 800,
      }}
    >
      Diskon -{fmt(Number(t.discountAmount || t.discount_amount || 0))}
    </div>
  )}
</td>

  <td
    style={{
      textAlign: "center",
      verticalAlign: "middle",
      fontWeight: 700,
      color: t.profit > 0 ? "var(--success)" : "var(--danger)",
    }}
  >
    {fmt(t.profit)}
  </td>

  <td style={{ textAlign: "center", verticalAlign: "middle" }}>
    <span
      className={`badge ${
        t.payMethod === "Tunai"
          ? "badge-green"
          : t.payMethod === "QRIS"
          ? "badge-blue"
          : "badge-orange"
      }`}
    >
      {t.payMethod}
    </span>
  </td>

  <td
    style={{
      textAlign: "center",
      verticalAlign: "middle",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      {t.status === "void" && (
        <span className="badge badge-red">
          BATAL
        </span>
      )}

      <button
        className="btn btn-sm btn-outline"
        onClick={() => setDetail(t)}
      >
        Lihat
      </button>
    </div>
  </td>
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
                    <td>
  {String(item.name || "").toUpperCase()}
  {item.discount > 0 && (
    <span className="badge badge-orange" style={{ marginLeft: 6, fontSize: 10 }}>
      -{item.discount}%
    </span>
  )}
</td>
                    <td>{item.qty}</td>
                    <td>{fmt(item.price)}</td>
                    <td style={{ fontWeight: 700 }}>{fmt(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: "12px 14px", background: "var(--bg)", borderRadius: 10 }}>
  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
    <span>Subtotal</span>
    <span>{fmt(Number(detail.subtotal || detail.total || 0))}</span>
  </div>

  {Number(detail.discountAmount || detail.discount_amount || 0) > 0 && (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--danger)", fontWeight: 700 }}>
      <span>Diskon Tambahan</span>
      <span>-{fmt(Number(detail.discountAmount || detail.discount_amount || 0))}</span>
    </div>
  )}

  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginTop: 6 }}>
    <span>Total</span>
    <strong>{fmt(detail.total)}</strong>
  </div>

  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-muted)" }}>
    <span>Modal</span>
    <span>{fmt(detail.cost)}</span>
  </div>

  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--success)", fontWeight: 700 }}>
    <span>Profit</span>
    <span>{fmt(detail.profit)}</span>
  </div>
</div>

<button
  type="button"
  className="btn btn-primary"
  style={{
    width: "100%",
    marginTop: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}
  onClick={() => printThermalQZ(detail, settings)}
>
  <Icon name="printer" /> Cetak Ulang Struk
</button>

{detail?.status !== "void" && (
  <button
    type="button"
    className="btn btn-danger"
    style={{ width: "100%", marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center" }}
    onClick={async () => {
  const reason = prompt("Alasan membatalkan transaksi?");
  if (reason === null) return;

  const ok = confirm("Yakin batalkan transaksi ini?");
  if (!ok) return;

  if (!onVoidTransaction) {
    alert("Fungsi batalkan transaksi belum terhubung.");
    return;
  }

  await onVoidTransaction(detail, reason || "Dibatalkan");
  setDetail(null);
}}
  >
    Batalkan Transaksi
  </button>
)}

            <button className="btn btn-outline" style={{ width: "100%", marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setDetail(null)}>Tutup</button>
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
  const activeTransactions = transactions.filter(t => t.status !== "void");

  const tabs = [
    { id: "penjualan", label: "📋 Transaksi Penjualan" },
    { id: "omzet", label: "💰 Omzet Per Bulan" },
    { id: "profit", label: "📈 Laporan Profit" },
    { id: "produk", label: "🏆 Laporan Produk" },
  ];

  // Monthly data for current year
  const months = Array.from({ length: 12 }, (_, m) => {
    const txns = activeTransactions.filter(t => new Date(t.date).getMonth() === m && new Date(t.date).getFullYear() === now.getFullYear());
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
  activeTransactions.forEach(t => t.items.forEach(i => {
    if (!prodMap[i.name]) prodMap[i.name] = { sold: 0, revenue: 0 };
    prodMap[i.name].sold += i.qty;
    prodMap[i.name].revenue += i.subtotal;
  }));
  const prodReport = Object.entries(prodMap).sort((a, b) => b[1].revenue - a[1].revenue);

  // This month
  const thisMonth = activeTransactions.filter(t => new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear());
  const totalOmzetYear = activeTransactions.filter(t => new Date(t.date).getFullYear() === now.getFullYear()).reduce((s, t) => s + t.total, 0);

  return (
    <div>
      <div className="page-header">
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
            <div className="stat-card red"><div className="stat-icon"><Icon name="tag" /></div><div className="stat-label">Profit Tahun Ini</div><div className="stat-value" style={{ fontSize: 17 }}>{fmt(activeTransactions.filter(t => new Date(t.date).getFullYear() === now.getFullYear()).reduce((s, t) => s + Number(t.profit || 0), 0))}</div></div>
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
                    const modal = activeTransactions.filter(t => new Date(t.date).getMonth() === i && new Date(t.date).getFullYear() === now.getFullYear()).reduce((s, t) => s + Number(t.cost || 0), 0);
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
      <div className="page-header"></div>
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
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null); // 'saving' | 'saved' | 'error'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cashSession, setCashSession] = useState(null);
  const [cashSessions, setCashSessions] = useState([]);
  const [cashMovements, setCashMovements] = useState([]);
  const [openingCashInput, setOpeningCashInput] = useState("");
  const [showCashHistory, setShowCashHistory] = useState(false);
  const [showCashDetail, setShowCashDetail] = useState(false);
  const [showCloseCash, setShowCloseCash] = useState(false);
  const [closingCashInput, setClosingCashInput] = useState("");
  const [stockBatches, setStockBatches] = useState([]);
  const [stockOpnames, setStockOpnames] = useState([]);

const defaultSettings = {
  store_name: "Agen Sosis & Es Kristal Toko Telon Mindi",
  store_address: "Jalan Raya Sugihwaras No. 742",
  store_phone: "085888100995",
  receipt_footer: "Terima kasih sudah berbelanja",
};
const activeTransactions = transactions.filter(t => t.status !== "void");
const fifoAuditRows = useMemo(() => {
  return products
    .filter(product => !!product.stock_management)
    .map(product => {
      const productId = Number(product.id);

      const batchQty = stockBatches
        .filter(batch => Number(batch.product_id) === productId)
        .reduce((sum, batch) => sum + Number(batch.qty_remaining || 0), 0);

      const productStock = Number(product.stock || 0);
      const diff = productStock - batchQty;

      return {
        productId,
        name: product.name,
        category: product.category,
        productStock,
        batchQty,
        diff,
        status: diff === 0 ? "ok" : "mismatch",
      };
    });
}, [products, stockBatches]);

const fifoMismatchRows = fifoAuditRows.filter(row => row.status === "mismatch");
const fifoMismatchCount = fifoMismatchRows.length;

const voidTransaction = async (txn, reason) => {
  if (!txn || !txn.id || txn.status === "void") return;

  try {
    const items = txn.items || [];

    // 1. Ambil movement OUT dari transaksi ini.
    const stockOutMovements = await sb.get(
      "stock_movements",
      `?select=*&transaction_id=eq.${txn.id}&type=eq.OUT`
    );

    // 2. Kembalikan stok total produk.
    for (const item of items) {
      const productId = Number(item.productId || item.product_id);
      const returnQty = Number(
        item.stockQtyTotal ||
        item.stock_qty_total ||
        (Number(item.qty || 0) * Number(item.stockQtyPerItem || item.stock_qty_per_item || 1))
      );

      if (!productId || !returnQty) continue;

      const product = products.find(p => Number(p.id) === productId);
      const currentStock = Number(product?.stock || 0);
      const nextStock = currentStock + returnQty;

      await sb.patch("products", productId, {
        stock: nextStock,
      });

      setProducts(prev =>
        prev.map(p =>
          Number(p.id) === productId
            ? { ...p, stock: Number(p.stock || 0) + returnQty }
            : p
        )
      );
    }

    // 3. Kembalikan qty_remaining FIFO ke batch asal.
    const fifoMovements = stockOutMovements.filter(m => m.batch_id);

    for (const movement of fifoMovements) {
      const batchId = movement.batch_id;
      const returnQty = Number(movement.qty || 0);

      if (!batchId || !returnQty) continue;

      const batches = await sb.get(
        "stock_batches",
        `?select=*&id=eq.${batchId}&limit=1`
      );

      const batch = batches?.[0];
      if (!batch) continue;

      await sb.patch("stock_batches", batchId, {
        qty_remaining: Number(batch.qty_remaining || 0) + returnQty,
      });
      
      setStockBatches(prev => 
        prev.map(b =>
          Number(b.id) === Number(batchId)
            ? { ...b, qty_remaining: Number(b.qty_remaining || 0) + returnQty }
            : b
        )
      );
    }

    // 4. Catat movement pembalik.
    if (stockOutMovements.length > 0) {
      const reverseRows = stockOutMovements.map(movement => ({
        product_id: movement.product_id,
        batch_id: movement.batch_id || null,
        transaction_id: txn.id,
        type: "ADJUSTMENT",
        qty: Number(movement.qty || 0),
        cost: Number(movement.cost || 0),
        note: `Pembatalan transaksi TRX-${String(txn.id).slice(-4).padStart(4, "0")}`,
      }));

      await sb.post("stock_movements", reverseRows);
    }

    // 5. Tandai transaksi sebagai void.
    const r = await fetch(SUPABASE_URL + "/rest/v1/transactions?id=eq." + txn.id, {
      method: "PATCH",
      headers: {
        ...HEADERS,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        status: "void",
        voided_at: new Date().toISOString(),
        void_reason: reason || "Dibatalkan",
      }),
    });

    if (!r.ok) {
      throw new Error(await r.text());
    }

    setTransactions(prev =>
      prev.map(t =>
        Number(t.id) === Number(txn.id)
          ? {
              ...t,
              status: "void",
              voided_at: new Date().toISOString(),
              void_reason: reason || "Dibatalkan",
            }
          : t
      )
    );

    // Jangan loadAll langsung setelah void, supaya halaman tidak terasa refresh
    // await loadAll();

    alert("Transaksi berhasil dibatalkan dan stok FIFO sudah dikembalikan.");
  } catch (err) {
    alert("Gagal membatalkan transaksi: " + err.message);
  }
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

    const prods = await sb.get("products", "?select=*&order=id.asc");
    setProducts(prods);
    const batches = await sb.get("stock_batches", "?select=*&order=created_at.asc");
    setStockBatches(batches || []);
    const opnameRows = await sb.get("stock_opnames", "?select=*&order=created_at.desc&limit=100");
    setStockOpnames(opnameRows || []);

    const variantRows = await sb.get(
  "product_variants",
  "?select=*&active=eq.true&order=product_id.asc&order=qty_multiplier.asc"
);

setVariants(
  variantRows.map(v => ({
    ...v,
    product_id: Number(v.product_id),
    qty_multiplier: Number(v.qty_multiplier || 1),
    price: Number(v.price || 0),
  }))
);

  // 2. Load transaksi utama
const txns = await sb.get(
  "transactions",
  "?select=*&order=date.desc&limit=500"
);

const transactionIds = txns.map(t => t.id).filter(Boolean);

const chunkArray = (arr, size) => {
  const chunks = [];

  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }

  return chunks;
};

let items = [];

if (transactionIds.length > 0) {
  const idChunks = chunkArray(transactionIds, 100);

  for (const idChunk of idChunks) {
    const chunkItems = await sb.get(
      "transaction_items",
      "?select=*&transaction_id=in.(" + idChunk.join(",") + ")&order=id.asc"
    );

    items = [...items, ...(chunkItems || [])];
  }
}

    const sessions = await sb.get(
      "cash_sessions",
      "?select=*&order=id.desc"
    );

    console.log("TRANSACTIONS FROM SUPABASE:", txns);
    console.log("TRANSACTION ITEMS FROM SUPABASE:", items);

    // 4. Gabungkan data transaksi dengan itemnya
    const txnsWithItems = txns.map(t => ({
  ...t,
  subtotal: Number(t.subtotal || t.total || 0),
  discountAmount: Number(t.discount_amount || t.discountAmount || 0),
  total: Number(t.total || 0),
  cost: Number(t.cost || 0),
  profit: Number(t.profit || 0),
  paid: Number(t.paid || 0),
  change: Number(t.change || 0),
  payMethod: t.pay_method || t.payMethod || "-",
  paymentDetail: t.payment_detail || t.paymentDetail || t.pay_method || "-",
  cashSessionId: t.cash_session_id || t.cashSessionId || null,
  items: items
    .filter(i => Number(i.transaction_id) === Number(t.id))
    .map(i => ({
      productId: i.product_id,
      name: i.name,
      qty: Number(i.qty || 0),
      price: Number(i.price || 0),
      discount: Number(i.discount || 0),
      subtotal: Number(i.subtotal || 0),
      stockQtyPerItem: Number(i.stock_qty_per_item || 1),
      stockQtyTotal: Number(i.stock_qty_total || i.qty || 0),
    })),
}));

    setTransactions(txnsWithItems);
    setCashSessions(sessions || []);

    await loadCashToday();

const settingRows = await sb.get("settings", "?select=key,value");
setSettings(rowsToSettings(settingRows));
  } catch (err) {
    console.error("LOAD ALL ERROR:", err);
    setDbError(err.message || "Gagal terhubung ke database");
  } finally {
    setLoading(false);
  }
};

const loadCashToday = async () => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const sessions = await sb.get(
      "cash_sessions",
      "?select=*&date=eq." + today + "&order=id.desc&limit=1"
    );

    const session = sessions?.[0] || null;
    setCashSession(session);

    if (session?.id) {
      const movements = await sb.get(
        "cash_movements",
        "?select=*&session_id=eq." + session.id + "&order=created_at.desc"
      );

      setCashMovements(movements || []);
    } else {
      setCashMovements([]);
    }
  } catch (err) {
    console.error("Gagal load dompet:", err);
  }
};

const saveOpeningCash = async () => {
  const amount = Number(String(openingCashInput || "").replace(/\D/g, ""));

  if (!amount) {
    alert("Isi Kas Awal dulu.");
    return;
  }

  if (amount < 0) {
    alert("Kas awal tidak boleh minus.");
    return;
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const isClosed = String(cashSession?.status || "").toLowerCase() === "closed";

    if (cashSession?.id && !isClosed) {
      const [updated] = await sb.patch("cash_sessions", cashSession.id, {
        opening_cash: amount,
        status: "open",
        updated_at: new Date().toISOString(),
      });

      setCashSession(updated || { ...cashSession, opening_cash: amount, status: "open" });
    } else {
      const [created] = await sb.post("cash_sessions", [
        {
          date: today,
          opening_cash: amount,
          status: "open",
        },
      ]);

      setCashSession(created);
      setCashMovements([]);
    }

    setOpeningCashInput("");
    await loadCashToday();

    alert(isClosed ? "Kas baru berhasil dibuka." : "Kas awal berhasil disimpan.");
  } catch (err) {
    alert("Gagal menyimpan kas awal: " + err.message);
  }
};

const saveCloseCash = async () => {
  if (!cashSession?.id) {
    alert("Kas awal belum dibuat. Simpan Kas Awal dulu.");
    return;
  }

  if (closingCashInput === "") {
    alert("Isi Kas Fisik dulu.");
    return;
  }

  const amount = Number(closingCashInput || 0);

  if (amount < 0) {
    alert("Kas fisik tidak boleh minus.");
    return;
  }

  try {
    const [updated] = await sb.patch("cash_sessions", cashSession.id, {
      closing_cash: amount,
      status: "closed",
      updated_at: new Date().toISOString(),
    });

    setCashSession(updated || {
      ...cashSession,
      closing_cash: amount,
      status: "closed",
      updated_at: new Date().toISOString(),
    });

    setClosingCashInput("");
    setShowCloseCash(false);

    await loadCashToday();

    alert("Tutup kas berhasil disimpan.");
  } catch (err) {
    alert("Gagal menutup kas: " + err.message);
  }
};

const addCashMovement = async (type) => {
  try {
    if (!cashSession?.id) {
      alert("Isi dan simpan Kas Awal dulu sebelum mencatat pemasukan/pengeluaran.");
      return;
    }

    if (String(cashSession?.status || "").toLowerCase() === "closed") {
      alert("Kas sudah ditutup. Pemasukan/pengeluaran tidak bisa ditambahkan.");
      return;
    }

    const label = type === "in" ? "pemasukan" : "pengeluaran";

    const amountText = window.prompt("Nominal " + label + ":");

    if (amountText === null) {
      return;
    }

    const amount = Number(String(amountText || "").replace(/\D/g, ""));

    if (!amount || amount <= 0) {
      alert("Nominal harus lebih dari 0.");
      return;
    }

    const descriptionText = window.prompt("Keterangan " + label + ":");

    if (descriptionText === null) {
      return;
    }

    const description = String(descriptionText || "").trim();

    if (!description) {
      alert("Keterangan tidak boleh kosong.");
      return;
    }

    await sb.post("cash_movements", [
      {
        session_id: cashSession.id,
        type,
        amount,
        description,
        created_at: new Date().toISOString(),
      },
    ]);

    await loadCashToday();

    alert("Berhasil menyimpan " + label + ".");
  } catch (err) {
    alert("Gagal menyimpan kas: " + err.message);
  }
};

  // ── Handle new transaction → save to Supabase
  const handleTransaction = useCallback(async (txn) => {
  const cashIsOpen =
    cashSession &&
    cashSession.id &&
    String(cashSession.status || "").toLowerCase() !== "closed";

  if (!cashIsOpen) {
    alert("Kas awal belum dibuka. Isi Kas Awal dulu sebelum transaksi.");
    return null;
  }

  showSync("saving");

  let savedTxn = null;

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

      const qtySold = Number(item.qty || 0) * Number(item.stockQtyPerItem || 1);
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
    
  [savedTxn] = await sb.post("transactions", [{
    date: txn.date,
    subtotal: Number(txn.subtotal || txn.total || 0),
    discount_amount: Number(txn.discountAmount || txn.discount_amount || 0),
    total: Number(txn.total || 0),
    cost: Number(totalCost || 0),
    profit: finalProfit,
    pay_method: txn.payMethod,
    payment_detail: txn.payment_detail || txn.paymentDetail || txn.payMethod,
    cash_session_id: cashSession.id,
    paid: Number(txn.paid || txn.cashReceived || txn.payment || 0),
    change: Number(txn.change || 0),
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
      stock_qty_per_item: Number(i.stockQtyPerItem || 1),
      stock_qty_total: Number(i.qty || 0) * Number(i.stockQtyPerItem || 1),
    }));

    await sb.post("transaction_items", itemRows);

    // 4. Update batch FIFO yang terpakai
    for (const batch of batchUpdates) {
      await sb.patch("stock_batches", batch.id, {
        qty_remaining: batch.qty_remaining,
      });
    }

    // Sinkronkan state stockBatches agar audit FIFO tiadk menampilkan selisih palsu
    setStockBatches(prev =>
      prev.map(batch => {
        const update = batchUpdates.find
        (u => Number(u.id) === Number(batch.id)
      );

        return update 
        ? { ...batch, qty_remaining: Number(update.qty_remaining || 0) } 
        : batch;
      })
    );

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

    const fullTxn = {
  ...(savedTxn || {}),
  id: savedTxn?.id || txn.id,
  date: savedTxn?.date || txn.date,
  subtotal: Number(savedTxn?.subtotal || txn.subtotal || txn.total || 0),
  discountAmount: Number(savedTxn?.discount_amount || txn.discountAmount || txn.discount_amount || 0),
  total: Number(savedTxn?.total || txn.total || 0),
  cost: totalCost,
  profit: finalProfit,
  payMethod: savedTxn?.pay_method || txn.payMethod,
  paymentDetail: savedTxn?.payment_detail || txn.payment_detail || txn.paymentDetail || txn.payMethod,
  cashSessionId: savedTxn?.cash_session_id || txn.cashSessionId || txn.cash_session_id || null,
  paid: txn.paid,
  cashReceived: txn.cashReceived,
  payment: txn.payment,
  change: txn.change,
  items: processedItems,
};

if (batchUpdates.length > 0) {
  setStockBatches(prev =>
    prev.map(batch => {
      const usedInThisBatch = batchUpdates
        .filter(update => Number(update.batchId) === Number(batch.id))
        .reduce((sum, update) => sum + Number(update.qty || 0), 0);

      if (usedInThisBatch <= 0) return batch;

      return {
        ...batch,
        qty_remaining: Math.max(
          0,
          Number(batch.qty_remaining || 0) - usedInThisBatch
        ),
      };
    })
  );
}

    setProducts(prev =>
      prev.map(p => {
        const update = productStockUpdates.find(u => u.id === p.id);
        return update ? { ...p, stock: update.stock } : p;
      })
    );
    // setStockBatches(batches || []);
    setTransactions(prev => [fullTxn, ...prev]);

    // await loadAll();

    showSync("saved");
    return fullTxn;
  } catch (err) {
    console.error("TRANSACTION ERROR:", err);
    showSync("error");
    alert("Gagal menyimpan transaksi: " + err.message);
    throw err;
  }
}, [products, cashSession]);

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
       // const [saved] = await sb.post("products", [payload]);
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

  const todayKey = new Date().toISOString().slice(0, 10);

const topbarTodayTxns = activeTransactions.filter(t =>
  String(t.date || t.created_at || "").slice(0, 10) === todayKey
);

const topbarOmzetToday = topbarTodayTxns.reduce(
  (sum, t) => sum + Number(t.total || 0),
  0
);

const topbarProfitToday = topbarTodayTxns.reduce(
  (sum, t) => sum + Number(t.profit || 0),
  0
);

const topbarItemsToday = topbarTodayTxns.reduce(
  (sum, t) =>
    sum +
    (t.items || []).reduce((itemSum, i) => itemSum + Number(i.qty || 0), 0),
  0
);

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
      <div className={sidebarOpen ? "app sidebar-open" : "app"}>
        <button
  type="button"
  className="mobile-menu-button"
  onClick={() => setSidebarOpen(true)}
>
  ☰
</button>
        <aside className="sidebar">
          <div className="sidebar-brand">
  <div className="brand-badge">🌿</div>
  <div className="store-name">
    {settings.store_name || "Agen Sosis & Es Kristal Toko Telon Mindi"}
  </div>
  <div className="store-sub">Point of Sale System</div>
</div>
          <div className="sidebar-section">
            <div className="sidebar-label">Menu Utama</div>
            {navItems.map(item => (
              <div key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => {
  setPage(item.id);
  setSidebarOpen(false);
}}>
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

        {sidebarOpen && (
  <div
    className="sidebar-backdrop"
    onClick={() => setSidebarOpen(false)}
  />
)}

        <main className="main">
          <div className="topbar">
  <div className="topbar-title">{pageTitle[page]}</div>

  {page === "dashboard" && (
  <div className="topbar-mini-stats">
    <div className="topbar-mini-stat stat-soft-green">
      <span>Omzet</span>
      <strong>{fmt(topbarOmzetToday)}</strong>
      <small>{topbarTodayTxns.length} trx</small>
    </div>

    <div className="topbar-mini-stat stat-soft-orange">
      <span>Produk</span>
      <strong>{topbarItemsToday}</strong>
      <small>terjual</small>
    </div>

    <div className="topbar-mini-stat stat-soft-red">
      <span>Profit</span>
      <strong>{fmt(topbarProfitToday)}</strong>
      <small>bersih</small>
    </div>

    <div
  style={{
    padding: "8px 12px",
    borderRadius: 12,
    background: fifoMismatchCount > 0 ? "rgba(230, 57, 70, 0.10)" : "rgba(30, 111, 92, 0.10)",
    color: fifoMismatchCount > 0 ? "var(--danger)" : "var(--primary)",
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: "nowrap",
  }}
>
  Audit FIFO: {fifoMismatchCount > 0 ? String(fifoMismatchCount) + " selisih" : "OK"}
</div>
  </div>
)}

  <div className="topbar-right">

              <button className="btn btn-sm btn-outline" onClick={loadAll} title="Refresh data dari Supabase" style={{ fontSize: 12 }}>🔄 Refresh</button>
              <div className="topbar-time">{now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}</div>
              <div className="avatar">TM</div>
            </div>
          </div>
          <div className="content">
            {page === "dashboard" && (
  <Dashboard
    transactions={activeTransactions}
    products={products}
    cashSession={cashSession}
    cashMovements={cashMovements}
    openingCashInput={openingCashInput}
    setOpeningCashInput={setOpeningCashInput}
    saveOpeningCash={saveOpeningCash}
    addCashMovement={addCashMovement}
    showCashHistory={showCashHistory}
    setShowCashHistory={setShowCashHistory}
    showCashDetail={showCashDetail}
    setShowCashDetail={setShowCashDetail}
    showCloseCash={showCloseCash}
    setShowCloseCash={setShowCloseCash}
    closingCashInput={closingCashInput}
    setClosingCashInput={setClosingCashInput}
    saveCloseCash={saveCloseCash}
    loadAll={loadAll}
    fifoAuditRows={fifoAuditRows}
    fifoMismatchCount={fifoMismatchCount}
    fifoMismatchRows={fifoMismatchRows}
    stockOpnames={stockOpnames}
    setStockOpnames={setStockOpnames}
  />
)}
            {page === "cashier" && (
  <Cashier
    products={products}
    onTransaction={handleTransaction}
    settings={settings}
    variants={variants}
    cashSession={cashSession}
  />
)}
            {page === "products" && <Products products={products} setProducts={setProductsWithSync} transactions={activeTransactions} />}
            {page === "history" && <History transactions={transactions} settings={settings} onVoidTransaction={voidTransaction} cashSessions={cashSessions} />}
            {page === "reports" && (
  <CashShiftReport
    cashSessions={cashSessions}
    transactions={activeTransactions}
    cashMovements={cashMovements}
  />
)}
            {page === "settings" && (
  <Settings appSettings={settings} setAppSettings={setSettings} />
)}
          </div>
        </main>
      </div>
    </>
  );
}
