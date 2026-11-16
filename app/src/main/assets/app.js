'use strict';

/* =========================================================
   MyC — دفتر مالی شخصی
   ========================================================= */

/* ---------- ۱) تقویم جلالی ---------- */
const div = (a, b) => ~~(a / b);
const mod = (a, b) => a - ~~(a / b) * b;
const BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
                1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];

function jalCal(jy, withoutLeap) {
  const bl = BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14, jp = BREAKS[0], jm, jump = 0, leap = 0, leapG, march, n, i;
  for (i = 1; i < bl; i += 1) {
    jm = BREAKS[i]; jump = jm - jp;
    if (jy < jm) break;
    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  n = jy - jp;
  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  march = 20 + leapJ - leapG;
  if (!withoutLeap) {
    if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
    leap = mod(mod(n + 1, 33) - 1, 4);
    if (leap === -1) leap = 4;
  }
  return { leap: leap, gy: gy, march: march };
}

function g2d(gy, gm, gd) {
  let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4)
        + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn) {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy: gy, gm: gm, gd: gd };
}

function j2d(jy, jm, jd) {
  const r = jalCal(jy, true);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2j(jdn) {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy, false);
  const jdn1f = g2d(gy, 3, r.march);
  let jd, jm, k;
  k = jdn - jdn1f;
  if (k >= 0) {
    if (k <= 185) { jm = 1 + div(k, 31); jd = mod(k, 31) + 1; return { jy: jy, jm: jm, jd: jd }; }
    k -= 186;
  } else { jy -= 1; k += 179; if (r.leap === 1) k += 1; }
  jm = 7 + div(k, 30); jd = mod(k, 30) + 1;
  return { jy: jy, jm: jm, jd: jd };
}

const isLeapJalali = jy => jalCal(jy, false).leap === 0;

function monthLen(jy, jm) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isLeapJalali(jy) ? 30 : 29;
}

function todayJdn() {
  const n = new Date();
  return g2d(n.getFullYear(), n.getMonth() + 1, n.getDate());
}
function todayJalali() { return d2j(todayJdn()); }

function addMonths(jy, jm, jd, n) {
  const total = jy * 12 + (jm - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return { jy: ny, jm: nm, jd: Math.min(jd, monthLen(ny, nm)) };
}

/* ---------- ۲) کمک‌تابع‌ها ---------- */
const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
                'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const NUM = new Intl.NumberFormat('fa-IR');

const fa = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]);
const money = n => NUM.format(Math.round(n || 0)) + ' تومان';
const jdnOf = d => j2d(d.jy, d.jm, d.jd);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const uid = () => 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const dateLabel = d => fa(d.jd) + ' ' + MONTHS[d.jm - 1] + ' ' + fa(d.jy);
const monthKey = d => d.jy * 100 + d.jm;

function daysLabel(n) {
  if (n === 0) return 'امروز';
  if (n === 1) return 'فردا';
  if (n === -1) return 'دیروز';
  if (n > 1) return fa(n) + ' روز مانده';
  return fa(-n) + ' روز گذشته';
}

function hash(str) {
  let h1 = 0x811c9dc5, h2 = 0x1000193;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = (h1 ^ c) * 0x01000193 >>> 0;
    h2 = (h2 + c * (i + 7)) >>> 0;
  }
  return (h1.toString(36) + h2.toString(36)).slice(0, 16);
}

const $ = id => document.getElementById(id);
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined && text !== null) n.textContent = text;
  return n;
}

/* ---------- ۳) داده ---------- */
const KEY = 'myc_v3';
const LEGACY2 = 'aqsat_v2';
const LEGACY1 = 'aqsat_v1';

const DEFAULT_SETTINGS = {
  pinHash: '', masterHash: hash('563570'),
  sound: true, chqDays: 1, genDays: 3, theme: 'system',
  fails: 0, lockUntil: 0, lastBackup: null
};

const S = {
  d: null,
  tab: 'home',
  oblTab: 'cheques',
  txKind: 'expense',
  txFilter: 'all',
  detailLoan: null,
  reportYm: null
};

function blankData() {
  return { v: 3, settings: Object.assign({}, DEFAULT_SETTINGS), loans: [], cheques: [], accounts: [], tx: [] };
}

function normalizeLoan(raw) {
  const inst = (raw.installments || []).map(i => ({
    id: String(i.id || uid()),
    amount: Math.max(0, Math.round(Number(i.amount) || 0)),
    jy: Number(i.jy), jm: Number(i.jm), jd: Number(i.jd),
    paid: !!i.paid, custom: !!i.custom
  })).filter(i => Number.isInteger(i.jy) && Number.isInteger(i.jm) && Number.isInteger(i.jd));

  inst.sort((a, b) => jdnOf(a) - jdnOf(b));
  return {
    id: String(raw.id || uid()),
    title: String(raw.title || 'بدون عنوان'),
    note: String(raw.note || ''),
    defaultAmount: Math.max(0, Math.round(Number(raw.defaultAmount) || (inst[0] ? inst[0].amount : 0))),
    installments: inst
  };
}

function migrateFromLegacy() {
  try {
    const v2 = localStorage.getItem(LEGACY2);
    if (v2) {
      const data = JSON.parse(v2);
      if (Array.isArray(data.loans) && data.loans.length) {
        const out = blankData();
        out.loans = data.loans.map(normalizeLoan);
        return out;
      }
    }
  } catch (e) { /* */ }

  try {
    const v1 = localStorage.getItem(LEGACY1);
    if (v1) {
      const data = JSON.parse(v1);
      const items = Array.isArray(data) ? data : data.items;
      if (Array.isArray(items) && items.length) {
        const groups = new Map();
        for (const it of items) {
          if (!it || !Number.isFinite(it.amount)) continue;
          const k = String(it.title || 'بدون عنوان').trim();
          if (!groups.has(k)) groups.set(k, []);
          groups.get(k).push(it);
        }
        const loans = [];
        for (const [title, list] of groups) {
          list.sort((a, b) => j2d(a.jy, a.jm, a.jd) - j2d(b.jy, b.jm, b.jd));
          const freq = new Map();
          for (const x of list) freq.set(x.amount, (freq.get(x.amount) || 0) + 1);
          let def = list[0].amount, best = 0;
          for (const [a, n] of freq) if (n > best) { best = n; def = a; }
          loans.push(normalizeLoan({
            id: uid(), title: title, note: list[0].note || '', defaultAmount: def,
            installments: list.map(x => ({
              id: x.id, amount: x.amount, jy: x.jy, jm: x.jm, jd: x.jd,
              paid: !!x.paid, custom: x.amount !== def
            }))
          }));
        }
        const out = blankData();
        out.loans = loans;
        return out;
      }
    }
  } catch (e) { /* */ }

  return null;
}

function loadData() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && Array.isArray(d.loans)) {
        d.settings = Object.assign({}, DEFAULT_SETTINGS, d.settings || {});
        d.cheques = d.cheques || [];
        d.accounts = d.accounts || [];
        d.tx = d.tx || [];
        return d;
      }
    }
  } catch (e) { /* */ }

  const migrated = migrateFromLegacy();
  if (migrated) return migrated;
  return blankData();
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(S.d));
  } catch (e) {
    toast('ذخیره نشد؛ حافظه پر است');
  }
}

/* ---------- ۴) قفل ---------- */
const lockEl = $('lock');
const dotsEl = $('dots');
const padEl = $('pad');
const lockErr = $('lockErr');
let lockMode = '';     // unlock | setup1 | setup2 | master | new1 | new2
let buf = '';
let firstPin = '';
let failCount = 0;
let lockTimer = null;

const LOCK_TITLE = {
  unlock: 'رمز ورود را وارد کن',
  setup1: 'یک رمز ۶ رقمی تعیین کن',
  setup2: 'رمز را دوباره وارد کن',
  master: 'کد مادر را وارد کن',
  new1: 'رمز جدید را وارد کن',
  new2: 'رمز جدید را تکرار کن'
};

function buildPad() {
  padEl.textContent = '';
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'del'];
  for (const k of keys) {
    const b = document.createElement('button');
    b.type = 'button';
    if (k === 'clear') { b.textContent = 'پاک'; b.className = 'fn'; }
    else if (k === 'del') { b.textContent = '⌫'; b.className = 'fn'; }
    else b.textContent = fa(k);
    b.addEventListener('click', () => onPad(k));
    padEl.appendChild(b);
  }
}

function drawDots() {
  dotsEl.textContent = '';
  for (let i = 0; i < 6; i++) {
    const d = document.createElement('i');
    if (i < buf.length) d.className = 'f';
    dotsEl.appendChild(d);
  }
}

function startLock(mode) {
  lockMode = mode;
  buf = '';
  $('lockTitle').textContent = LOCK_TITLE[mode] || 'رمز';
  $('lockSub').textContent = mode === 'master' ? 'کد بازیابی (کد مادر)' : 'رمز ۶ رقمی';
  $('forgotBtn').classList.toggle('hidden', mode !== 'unlock');
  lockErr.textContent = '';
  drawDots();
  lockEl.classList.remove('hide');
  $('app').classList.add('hidden');
  checkLockTimer();
}

function endLock() {
  lockEl.classList.add('hide');
  $('app').classList.remove('hidden');
  if (lockTimer) { clearInterval(lockTimer); lockTimer = null; }
  render();
}

function checkLockTimer() {
  if (lockTimer) { clearInterval(lockTimer); lockTimer = null; }
  const left = (S.d.settings.lockUntil || 0) - Date.now();
  if (left <= 0) return;

  const tick = () => {
    const ms = (S.d.settings.lockUntil || 0) - Date.now();
    if (ms <= 0) {
      lockErr.textContent = '';
      clearInterval(lockTimer);
      lockTimer = null;
      return;
    }
    const s = Math.ceil(ms / 1000);
    lockErr.textContent = 'ورود قفل است — ' + fa(Math.floor(s / 60)) + ':' + fa(String(s % 60).padStart(2, '0'));
  };
  tick();
  lockTimer = setInterval(tick, 500);
}

function onPad(k) {
  if ((S.d.settings.lockUntil || 0) > Date.now()) return;

  if (k === 'clear') { buf = ''; drawDots(); return; }
  if (k === 'del') { buf = buf.slice(0, -1); drawDots(); return; }
  if (buf.length >= 6) return;

  buf += k;
  drawDots();
  if (buf.length === 6) setTimeout(submitPin, 90);
}

function submitPin() {
  const st = S.d.settings;
  const code = buf;

  if (lockMode === 'setup1' || lockMode === 'new1') {
    firstPin = code; buf = ''; drawDots();
    startLock(lockMode === 'setup1' ? 'setup2' : 'new2');
    return;
  }

  if (lockMode === 'setup2' || lockMode === 'new2') {
    if (code !== firstPin) {
      lockErr.textContent = 'رمزها یکسان نبودند';
      buf = ''; firstPin = ''; drawDots();
      startLock(lockMode === 'setup2' ? 'setup1' : 'new1');
      return;
    }
    st.pinHash = hash(code);
    st.fails = 0;
    st.lockUntil = 0;
    save();
    endLock();
    toast('رمز ذخیره شد');
    return;
  }

  if (lockMode === 'master') {
    if (hash(code) === st.masterHash) {
      lockErr.textContent = '';
      startLock('new1');
    } else {
      lockErr.textContent = 'کد مادر اشتباه است';
      buf = ''; drawDots();
    }
    return;
  }

  // unlock
  if (hash(code) === st.pinHash) {
    st.fails = 0;
    st.lockUntil = 0;
    save();
    endLock();
    return;
  }

  st.fails = (st.fails || 0) + 1;
  buf = '';
  drawDots();

  if (st.fails >= 3) {
    st.fails = 0;
    st.lockUntil = Date.now() + 3 * 60 * 1000;
    save();
    lockErr.textContent = 'سه بار اشتباه — ۳ دقیقه قفل شد';
    checkLockTimer();
  } else {
    save();
    lockErr.textContent = 'رمز اشتباه است (' + fa(st.fails) + ' از ۳)';
  }
}

/* ---------- ۵) انتخاب تاریخ ---------- */
function fillDays(y, m, d, keep) {
  const len = monthLen(+y.value, +m.value);
  const cur = clamp(keep || +d.value || 1, 1, len);
  d.textContent = '';
  for (let i = 1; i <= len; i++) d.add(new Option(fa(i), String(i)));
  d.value = String(cur);
}

function mountDP(box) {
  box.textContent = '';
  const y = document.createElement('select');
  const m = document.createElement('select');
  const d = document.createElement('select');
  const now = todayJalali().jy;
  for (let yy = now - 10; yy <= now + 20; yy++) y.add(new Option(fa(yy), String(yy)));
  MONTHS.forEach((nm, i) => m.add(new Option(nm, String(i + 1))));
  y.addEventListener('change', () => fillDays(y, m, d));
  m.addEventListener('change', () => fillDays(y, m, d));
  box.append(d, m, y);
  box._y = y; box._m = m; box._d = d;
  fillDays(y, m, d);
}

function setDP(box, dt) {
  box._y.value = String(dt.jy);
  box._m.value = String(dt.jm);
  fillDays(box._y, box._m, box._d, dt.jd);
  box._d.value = String(Math.min(dt.jd, box._d.options.length));
}

function getDP(box) {
  return { jy: +box._y.value, jm: +box._m.value, jd: +box._d.value };
}

/* ---------- ۶) توست ---------- */
const toastEl = $('toast');
let toastTimer = null;
let undoFn = null;

function toast(msg, undo) {
  toastEl.textContent = '';
  toastEl.appendChild(document.createTextNode(msg));
  undoFn = undo || null;
  if (undo) {
    const b = el('button', null, 'بازگردانی');
    b.addEventListener('click', () => {
      if (undoFn) { undoFn(); undoFn = null; toastEl.classList.remove('show'); }
    });
    toastEl.appendChild(b);
  }
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.classList.remove('show'); undoFn = null; }, undo ? 6000 : 2400);
}

/* ---------- ۷) محاسبات ---------- */
function dueItems() {
  const t = todayJdn();
  const out = [];

  for (const loan of S.d.loans) {
    for (const inst of loan.installments) {
      if (inst.paid) continue;
      out.push({ kind: 'loan', label: 'قسط', loan: loan, inst: inst, amount: inst.amount, j: jdnOf(inst), date: inst });
    }
  }
  for (const c of S.d.cheques) {
    if (c.status !== 'open' && c.status !== 'deposited') continue;
    out.push({
      kind: 'cheque', label: c.kind === 'in' ? 'چک دریافتی' : 'چک صادره',
      cheque: c, amount: c.amount, j: jdnOf(c), date: c
    });
  }
  for (const a of S.d.accounts) {
    if (a.settled || !a.due) continue;
    out.push({
      kind: 'account', label: a.kind === 'receivable' ? 'طلب' : 'بدهی',
      account: a, amount: a.amount, j: jdnOf(a.due), date: a.due
    });
  }

  for (const x of out) x.days = x.j - t;
  out.sort((a, b) => a.days - b.days);
  return out;
}

function bucketOf(days) {
  if (days <= 0) return 'red';
  if (days <= 3) return 'yellow';
  if (days <= 5) return 'orange';
  return null;
}

/* ---------- ۸) رندر ---------- */
const view = $('view');

function render() {
  renderRings();
  if (S.tab === 'home') renderHome();
  else if (S.tab === 'tx') renderTx();
  else if (S.tab === 'obl') renderObl();
  else renderReport();

  for (const b of $('nav').children) b.classList.toggle('on', b.dataset.tab === S.tab);
  scheduleNotifications();
}

function renderRings() {
  const items = dueItems();
  const counts = { red: 0, yellow: 0, orange: 0 };
  for (const x of items) {
    const b = bucketOf(x.days);
    if (b) counts[b] += 1;
  }
  const total = counts.red + counts.yellow + counts.orange;
  const rings = $('rings');
  if (rings) rings.classList.toggle('hide', total === 0);
}

function ringRow(label, cls) {
  const wrap = el('div', 'ring ' + cls);
  const dot = el('div', 'dot');
  const lbl = el('div', 'lbl', label);
  wrap.append(dot, lbl);
  return { wrap, dot };
}

function buildRings() {
  const box = el('section', 'rings');
  box.id = 'rings';

  const items = dueItems();
  const counts = { red: 0, yellow: 0, orange: 0 };
  for (const x of items) {
    const b = bucketOf(x.days);
    if (b) counts[b] += 1;
  }

  const defs = [
    ['red', 'red', 'امروز و گذشته'],
    ['yellow', 'yellow', '۱ تا ۳ روز'],
    ['orange', 'orange', '۴ تا ۵ روز']
  ];

  if (!counts.red && !counts.yellow && !counts.orange) box.classList.add('hide');

  for (const [bucket, cls, label] of defs) {
    const r = ringRow(label, cls);
    r.dot.textContent = fa(counts[bucket]);
    if (!counts[bucket]) r.wrap.style.opacity = '.45';
    r.wrap.addEventListener('click', () => openRing(bucket));
    box.appendChild(r.wrap);
  }
  return box;
}

function openRing(bucket) {
  const items = dueItems().filter(x => bucketOf(x.days) === bucket);
  if (!items.length) return;
  const titles = { red: 'امروز و گذشته', yellow: '۱ تا ۳ روز آینده', orange: '۴ تا ۵ روز آینده' };
  $('ringTitle').textContent = titles[bucket] + ' — ' + fa(items.length) + ' مورد';

  const list = $('ringList');
  list.textContent = '';
  for (const x of items) {
    list.appendChild(dueRow(x));
  }
  $('ringDlg').showModal();
}

function dueRow(x) {
  const row = el('div', 'item');
  const ico = el('div', 'ico ' + (x.kind === 'cheque' ? 'chq' : x.kind === 'loan' ? 'loan' : 'acc'),
    x.kind === 'cheque' ? '🧾' : x.kind === 'loan' ? '📄' : '👤');
  const main = el('div', 'main');
  const t = el('div', 't', x.kind === 'loan' ? x.loan.title : x.kind === 'cheque' ? x.cheque.party : x.account.name);
  const m = el('div', 'm');
  m.appendChild(el('span', null, dateLabel(x.date)));
  const pill = el('span', 'pill ' + (x.days < 0 ? 'late' : x.days <= 3 ? 'due' : 'ok'), daysLabel(x.days));
  m.appendChild(pill);
  m.appendChild(el('span', null, x.label));
  main.append(t, m);
  const amt = el('div', 'amt', NUM.format(x.amount));
  amt.appendChild(el('small', null, ' تومان'));
  row.append(ico, main, amt);
  row.addEventListener('click', () => {
    if ($('ringDlg').open) $('ringDlg').close();
    if (x.kind === 'loan') { S.tab = 'obl'; S.oblTab = 'loans'; S.detailLoan = x.loan.id; render(); }
    else if (x.kind === 'cheque') { S.tab = 'obl'; S.oblTab = 'cheques'; render(); openCheque(x.cheque); }
    else { S.tab = 'obl'; S.oblTab = 'accounts'; render(); openAccount(x.account); }
  });
  return row;
}

function renderHome() {
  view.textContent = '';
  view.appendChild(buildRings());

  const t = todayJdn();

  // نوار امروز
  const dueToday = dueItems().filter(x => x.days === 0);
  const txToday = S.d.tx.filter(x => jdnOf(x) === t);
  const line = el('div', 'todayline');
  const parts = [];
  if (dueToday.length) parts.push(fa(dueToday.length) + ' تعهد امروز');
  if (txToday.length) parts.push(fa(txToday.length) + ' تراکنش امروز');
  line.textContent = parts.length ? 'امروز: ' + parts.join(' · ') : 'امروز: کاری ثبت نشده';
  view.appendChild(line);

  // خلاصه
  let receivable = 0, payable = 0;
  for (const a of S.d.accounts) {
    if (a.settled) continue;
    if (a.kind === 'receivable') receivable += a.amount; else payable += a.amount;
  }
  for (const c of S.d.cheques) {
    if (c.status !== 'open' && c.status !== 'deposited') continue;
    if (c.kind === 'in') receivable += c.amount; else payable += c.amount;
  }

  const grid = el('div', 'grid2');
  const c1 = el('div', 'card pad');
  c1.append(el('div', 'k', 'طلب من'), el('div', 'v green', money(receivable)));
  const c2 = el('div', 'card pad');
  c2.append(el('div', 'k', 'بدهی من'), el('div', 'v red', money(payable)));
  grid.append(c1, c2);
  view.appendChild(grid);

  // پیش رو
  const upcoming = dueItems().filter(x => x.days <= 45).slice(0, 12);
  const head = el('div', 'mhead');
  head.append(el('span', null, 'پیش رو'), el('span', null, upcoming.length ? fa(upcoming.length) + ' مورد' : ''));
  view.appendChild(head);

  if (!upcoming.length) {
    const e = el('div', 'empty');
    e.innerHTML = '<b>چیز نزدیکی نیست</b>تا ۴۵ روز آینده تعهدی نداری.';
    view.appendChild(e);
    return;
  }

  const list = el('div', 'list');
  for (const x of upcoming) list.appendChild(dueRow(x));
  view.appendChild(list);
}

function renderTx() {
  view.textContent = '';

  const seg = el('div', 'seg');
  const defs = [['all', 'همه'], ['expense', 'هزینه'], ['income', 'درآمد']];
  for (const [k, lbl] of defs) {
    const b = el('button', S.txFilter === k ? 'on' : '', lbl);
    b.type = 'button';
    b.addEventListener('click', () => { S.txFilter = k; render(); });
    seg.appendChild(b);
  }
  view.appendChild(seg);

  const now = todayJalali();
  const mk = monthKey(now);
  let inc = 0, exp = 0;
  for (const x of S.d.tx) {
    if (monthKey(x) !== mk) continue;
    if (x.type === 'income') inc += x.amount; else exp += x.amount;
  }

  const stats = el('div', 'stats');
  const s1 = el('div', 'stat');
  s1.append(el('div', 'k', 'درآمد ماه'), el('div', 'v green', NUM.format(inc)));
  const s2 = el('div', 'stat');
  s2.append(el('div', 'k', 'هزینهٔ ماه'), el('div', 'v red', NUM.format(exp)));
  const s3 = el('div', 'stat');
  s3.append(el('div', 'k', 'مانده'), el('div', 'v ' + (inc - exp >= 0 ? 'green' : 'red'), NUM.format(inc - exp)));
  stats.append(s1, s2, s3);
  view.appendChild(stats);

  let items = S.d.tx.slice();
  if (S.txFilter !== 'all') items = items.filter(x => x.type === S.txFilter);
  items.sort((a, b) => jdnOf(b) - jdnOf(a));

  if (!items.length) {
    const e = el('div', 'empty');
    e.innerHTML = '<b>تراکنشی نیست</b>با دکمهٔ + اولین هزینه یا درآمد را ثبت کن.';
    view.appendChild(e);
    return;
  }

  let lastDay = null;
  let container = null;
  for (const x of items) {
    const key = jdnOf(x);
    if (key !== lastDay) {
      lastDay = key;
      const h = el('div', 'mhead');
      h.append(el('span', null, dateLabel(x)), el('span', null, daysLabel(key - todayJdn())));
      view.appendChild(h);

      container = el('div', 'list');
      view.appendChild(container);
    }
    container.appendChild(txRow(x));
  }
}

function txRow(x) {
  const row = el('div', 'item');
  const ico = el('div', 'ico ' + (x.type === 'income' ? 'in' : 'out'), x.type === 'income' ? '↓' : '↑');
  const main = el('div', 'main');
  const t = el('div', 't', x.cat + (x.note ? ' — ' + x.note : ''));
  const m = el('div', 'm');
  m.appendChild(el('span', null, fa(x.jd) + ' ' + MONTHS[x.jm - 1]));
  main.append(t, m);
  const amt = el('div', 'amt ' + (x.type === 'income' ? 'green' : 'red'), (x.type === 'income' ? '+' : '−') + NUM.format(x.amount));
  amt.dir = 'ltr';
  amt.style.textAlign = 'left';
  row.append(ico, main, amt);
  row.addEventListener('click', () => openTx(x));
  return row;
}

function renderObl() {
  view.textContent = '';

  if (S.detailLoan) { renderLoanDetail(); return; }

  const seg = el('div', 'seg');
  const defs = [['cheques', 'چک‌ها'], ['loans', 'اقساط'], ['accounts', 'حساب‌ها']];
  for (const [k, lbl] of defs) {
    const b = el('button', S.oblTab === k ? 'on' : '', lbl);
    b.type = 'button';
    b.addEventListener('click', () => { S.oblTab = k; render(); });
    seg.appendChild(b);
  }
  view.appendChild(seg);

  if (S.oblTab === 'loans') renderLoans();
  else if (S.oblTab === 'accounts') renderAccounts();
  else renderCheques();
}

function renderLoans() {
  if (!S.d.loans.length) {
    const e = el('div', 'empty');
    e.innerHTML = '<b>وامی ثبت نشده</b>با دکمهٔ + اولین وام را بساز.';
    view.appendChild(e);
    return;
  }
  for (const loan of S.d.loans) {
    const total = loan.installments.length;
    const paid = loan.installments.filter(i => i.paid);
    const remain = loan.installments.filter(i => !i.paid).reduce((s, i) => s + i.amount, 0);
    const next = loan.installments.filter(i => !i.paid).sort((a, b) => jdnOf(a) - jdnOf(b))[0];

    const card = el('div', 'card loan');
    const h = el('h3');
    h.appendChild(document.createTextNode(loan.title));
    h.appendChild(el('span', null, fa(paid.length) + ' از ' + fa(total)));
    const bar = el('div', 'bar');
    const fill = el('i');
    fill.style.width = (total ? Math.round(paid.length / total * 100) : 0) + '%';
    bar.appendChild(fill);
    const meta = el('div', 'meta');
    meta.appendChild(el('span', null, next ? 'قسط بعدی: ' + dateLabel(next) : 'همه پرداخت شده'));
    meta.appendChild(el('span', null, 'مانده: ' + money(remain)));
    card.append(h, bar, meta);
    card.addEventListener('click', () => { S.detailLoan = loan.id; render(); });
    view.appendChild(card);
  }
}

function renderLoanDetail() {
  const loan = S.d.loans.find(l => l.id === S.detailLoan);
  if (!loan) { S.detailLoan = null; render(); return; }

  const head = el('div', 'mhead');
  const back = el('button', 'btn ghost', 'بازگشت');
  back.style.padding = '4px 10px';
  back.style.fontSize = '11px';
  back.addEventListener('click', () => { S.detailLoan = null; render(); });
  head.append(back, el('span', null, loan.title));
  view.appendChild(head);

  const paid = loan.installments.filter(i => i.paid).length;
  const remain = loan.installments.filter(i => !i.paid).reduce((s, i) => s + i.amount, 0);

  const st = el('div', 'stats');
  const s1 = el('div', 'stat');
  s1.append(el('div', 'k', 'پرداخت‌شده'), el('div', 'v', fa(paid) + '/' + fa(loan.installments.length)));
  const s2 = el('div', 'stat');
  s2.append(el('div', 'k', 'مانده'), el('div', 'v red', NUM.format(remain)));
  const s3 = el('div', 'stat');
  s3.append(el('div', 'k', 'هر قسط'), el('div', 'v', NUM.format(loan.defaultAmount)));
  st.append(s1, s2, s3);
  view.appendChild(st);

  const btns = el('div', 'row-btns');
  const bEdit = el('button', 'btn', 'ویرایش وام');
  bEdit.addEventListener('click', () => openLoan(loan));
  const bAdd = el('button', 'btn', 'افزودن قسط');
  bAdd.addEventListener('click', () => {
    const last = loan.installments[loan.installments.length - 1];
    const d = last ? addMonths(last.jy, last.jm, last.jd, 1) : todayJalali();
    loan.installments.push({ id: uid(), amount: loan.defaultAmount, jy: d.jy, jm: d.jm, jd: d.jd, paid: false, custom: false });
    save(); render(); toast('قسط اضافه شد');
  });
  const bDel = el('button', 'btn danger', 'حذف وام');
  bDel.addEventListener('click', () => {
    if (!confirm('وام «' + loan.title + '» با همهٔ اقساطش حذف شود؟')) return;
    const idx = S.d.loans.indexOf(loan);
    S.d.loans.splice(idx, 1);
    save();
    S.detailLoan = null;
    render();
    toast('وام حذف شد', () => { S.d.loans.splice(idx, 0, loan); save(); render(); });
  });
  btns.append(bEdit, bAdd, bDel);
  view.appendChild(btns);

  const t = todayJdn();
  const list = el('div', 'list');
  loan.installments.forEach((inst, idx) => {
    const row = el('div', 'item' + (inst.paid ? '' : (jdnOf(inst) - t < 0 ? ' warn' : '')));
    const chk = el('button', 'ico ' + (inst.paid ? 'in' : ''), inst.paid ? '✓' : '');
    chk.style.border = '2px solid var(--line)';
    chk.style.borderRadius = '50%';
    chk.style.width = '30px';
    chk.style.height = '30px';
    chk.style.padding = '0';
    chk.addEventListener('click', ev => {
      ev.stopPropagation();
      inst.paid = !inst.paid;
      save(); render();
    });
    const main = el('div', 'main');
    main.appendChild(el('div', 't', 'قسط ' + fa(idx + 1) + ' از ' + fa(loan.installments.length)));
    const m = el('div', 'm');
    m.appendChild(el('span', null, dateLabel(inst)));
    if (!inst.paid) m.appendChild(el('span', 'pill ' + (jdnOf(inst) - t < 0 ? 'late' : (jdnOf(inst) - t <= 3 ? 'due' : 'ok')), daysLabel(jdnOf(inst) - t)));
    if (inst.custom) m.appendChild(el('span', null, 'مبلغ متفاوت'));
    main.appendChild(m);
    const amt = el('div', 'amt', NUM.format(inst.amount));
    row.append(chk, main, amt);
    row.addEventListener('click', () => openInst(loan, inst));
    list.appendChild(row);
  });
  view.appendChild(list);
}

const CHQ_STATUS = {
  open: 'در جریان', deposited: 'خوابانده در حساب', cleared: 'پاس شد',
  bounced: 'برگشت خورد', void: 'باطل شد'
};

function renderCheques() {
  const items = S.d.cheques.slice().sort((a, b) => jdnOf(a) - jdnOf(b));
  if (!items.length) {
    const e = el('div', 'empty');
    e.innerHTML = '<b>چکی ثبت نشده</b>با دکمهٔ + چک دریافتی یا صادره را اضافه کن.';
    view.appendChild(e);
    return;
  }

  const t = todayJdn();
  const list = el('div', 'list');
  for (const c of items) {
    const row = el('div', 'item' + (c.status === 'open' && jdnOf(c) - t < 0 ? ' warn' : ''));
    const ico = el('div', 'ico chq', c.kind === 'in' ? '⬇' : '⬆');
    const main = el('div', 'main');
    main.appendChild(el('div', 't', c.party));
    const m = el('div', 'm');
    m.appendChild(el('span', null, dateLabel(c)));
    m.appendChild(el('span', 'pill ' + (c.kind === 'in' ? 'ok' : 'info'), c.kind === 'in' ? 'دریافتی' : 'صادره'));
    m.appendChild(el('span', 'pill info', CHQ_STATUS[c.status] || c.status));
    if (c.status === 'open') m.appendChild(el('span', null, daysLabel(jdnOf(c) - t)));
    main.appendChild(m);
    const amt = el('div', 'amt', NUM.format(c.amount));
    row.append(ico, main, amt);
    row.addEventListener('click', () => openCheque(c));
    list.appendChild(row);
  }
  view.appendChild(list);
}

function renderAccounts() {
  const items = S.d.accounts.slice().sort((a, b) => (a.settled === b.settled) ? 0 : (a.settled ? 1 : -1));
  if (!items.length) {
    const e = el('div', 'empty');
    e.innerHTML = '<b>حسابی ثبت نشده</b>طلب یا بدهی خود را با دکمهٔ + اضافه کن.';
    view.appendChild(e);
    return;
  }

  const totalR = S.d.accounts.filter(a => !a.settled && a.kind === 'receivable').reduce((s, a) => s + a.amount, 0);
  const totalP = S.d.accounts.filter(a => !a.settled && a.kind === 'payable').reduce((s, a) => s + a.amount, 0);

  const st = el('div', 'stats');
  const s1 = el('div', 'stat');
  s1.append(el('div', 'k', 'طلب من'), el('div', 'v green', NUM.format(totalR)));
  const s2 = el('div', 'stat');
  s2.append(el('div', 'k', 'بدهی من'), el('div', 'v red', NUM.format(totalP)));
  const s3 = el('div', 'stat');
  s3.append(el('div', 'k', 'مانده'), el('div', 'v', NUM.format(totalR - totalP)));
  st.append(s1, s2, s3);
  view.appendChild(st);

  const list = el('div', 'list');
  for (const a of items) {
    const row = el('div', 'item');
    const ico = el('div', 'ico acc', a.kind === 'receivable' ? '↙' : '↗');
    const main = el('div', 'main');
    main.appendChild(el('div', 't', a.name));
    const m = el('div', 'm');
    m.appendChild(el('span', null, a.due ? 'وعده: ' + dateLabel(a.due) : 'بدون وعده'));
    m.appendChild(el('span', 'pill ' + (a.settled ? 'info' : (a.kind === 'receivable' ? 'ok' : 'due')), a.settled ? 'تسویه' : (a.kind === 'receivable' ? 'طلب' : 'بدهی')));
    main.appendChild(m);
    const amt = el('div', 'amt ' + (a.kind === 'receivable' ? 'green' : 'red'), NUM.format(a.amount));
    row.append(ico, main, amt);
    row.addEventListener('click', () => openAccount(a));
    list.appendChild(row);
  }
  view.appendChild(list);
}

function renderReport() {
  view.textContent = '';

  const now = todayJalali();
  const ym = S.reportYm || monthKey(now);

  const nav = el('div', 'mhead');
  const prev = el('button', 'btn ghost', 'ماه قبل');
  prev.style.padding = '2px 10px';
  prev.style.fontSize = '11px';
  prev.addEventListener('click', () => { S.reportYm = shiftYm(ym, -1); render(); });
  const next = el('button', 'btn ghost', 'ماه بعد');
  next.style.padding = '2px 10px';
  next.style.fontSize = '11px';
  next.addEventListener('click', () => { S.reportYm = shiftYm(ym, 1); render(); });
  const lbl = el('span', null, MONTHS[ym % 100 - 1] + ' ' + fa(Math.floor(ym / 100)));
  nav.append(prev, lbl, next);
  view.appendChild(nav);

  let inc = 0, exp = 0;
  for (const x of S.d.tx) {
    if (monthKey(x) !== ym) continue;
    if (x.type === 'income') inc += x.amount; else exp += x.amount;
  }

  const st = el('div', 'stats');
  const s1 = el('div', 'stat');
  s1.append(el('div', 'k', 'درآمد'), el('div', 'v green', NUM.format(inc)));
  const s2 = el('div', 'stat');
  s2.append(el('div', 'k', 'هزینه'), el('div', 'v red', NUM.format(exp)));
  const s3 = el('div', 'stat');
  s3.append(el('div', 'k', 'مانده'), el('div', 'v ' + (inc - exp >= 0 ? 'green' : 'red'), NUM.format(inc - exp)));
  st.append(s1, s2, s3);
  view.appendChild(st);

  // نمودار ۶ ماه
  const months = [];
  for (let i = 5; i >= 0; i--) months.push(shiftYm(ym, -i));
  let max = 1;
  const series = months.map(m => {
    let a = 0, b = 0;
    for (const x of S.d.tx) {
      if (monthKey(x) !== m) continue;
      if (x.type === 'income') a += x.amount; else b += x.amount;
    }
    max = Math.max(max, a, b);
    return { m: m, inc: a, exp: b };
  });

  const chart = el('div', 'chart');
  for (const s of series) {
    const col = el('div', 'colwrap');
    const bars = el('div', 'bars');
    const b1 = el('div', 'b1'); b1.style.height = Math.round(s.inc / max * 92) + '%'; b1.style.minHeight = s.inc ? '2px' : '0';
    const b2 = el('div', 'b2'); b2.style.height = Math.round(s.exp / max * 92) + '%'; b2.style.minHeight = s.exp ? '2px' : '0';
    bars.append(b1, b2);
    const cl = el('div', 'cl', MONTHS[s.m % 100 - 1].slice(0, 4));
    col.append(bars, cl);
    chart.appendChild(col);
  }
  view.appendChild(chart);

  const lg = el('div', 'mhead');
  lg.append(el('span', null, 'سبز: درآمد'), el('span', null, 'قرمز: هزینه'));
  view.appendChild(lg);

  // بایگانی سالانه
  const years = new Map();
  for (const x of S.d.tx) {
    const y = Math.floor(monthKey(x) / 100);
    if (!years.has(y)) years.set(y, { inc: 0, exp: 0 });
    const o = years.get(y);
    if (x.type === 'income') o.inc += x.amount; else o.exp += x.amount;
  }

  if (years.size) {
    const h = el('div', 'mhead');
    h.append(el('span', null, 'بایگانی سالانه'), el('span', null, ''));
    view.appendChild(h);

    const list = el('div', 'list');
    for (const [y, o] of Array.from(years.entries()).sort((a, b) => b[0] - a[0])) {
      const row = el('div', 'item');
      const main = el('div', 'main');
      main.appendChild(el('div', 't', 'سال ' + fa(y)));
      const m = el('div', 'm');
      m.appendChild(el('span', 'green', 'درآمد ' + NUM.format(o.inc)));
      m.appendChild(el('span', 'red', 'هزینه ' + NUM.format(o.exp)));
      main.appendChild(m);
      const amt = el('div', 'amt ' + (o.inc - o.exp >= 0 ? 'green' : 'red'), NUM.format(o.inc - o.exp));
      row.append(main, amt);
      list.appendChild(row);
    }
    view.appendChild(list);
  }
}

function shiftYm(ym, delta) {
  let y = Math.floor(ym / 100), m = ym % 100;
  m += delta;
  while (m > 12) { m -= 12; y += 1; }
  while (m < 1) { m += 12; y -= 1; }
  return y * 100 + m;
}

/* ---------- ۹) فرم‌ها ---------- */
function openTx(existing) {
  const dlg = $('txDlg');
  $('txTitle').textContent = existing ? 'ویرایش تراکنش' : (S.txKind === 'income' ? 'درآمد جدید' : 'هزینهٔ جدید');
  $('txDelete').classList.toggle('hidden', !existing);

  S.editTx = existing ? existing.id : null;
  setSeg($('txKindSeg'), existing ? existing.type : S.txKind);
  $('txAmount').value = existing ? String(existing.amount) : '';
  $('txNote').value = existing ? existing.note : '';
  fillCats(existing ? existing.type : S.txKind, existing ? existing.cat : null);
  setDP($('dpTx'), existing ? existing : todayJalali());
  $('txAmountHint').textContent = existing ? money(existing.amount) : '';
  dlg.showModal();
}

function setSeg(seg, kind) {
  for (const b of seg.children) b.classList.toggle('on', b.dataset.kind === kind);
}

function segValue(seg) {
  const b = Array.from(seg.children).find(x => x.classList.contains('on'));
  return b ? b.dataset.kind : null;
}

const CATS = {
  expense: ['خوراک', 'حمل‌ونقل', 'خانه', 'سلامت', 'پوشاک', 'تفریح', 'قبض', 'سایر'],
  income: ['حقوق', 'فروش', 'هدیه', 'سود', 'سایر']
};

function fillCats(kind, selected) {
  const sel = $('txCat');
  sel.textContent = '';
  for (const c of CATS[kind]) sel.add(new Option(c, c));
  if (selected) sel.value = selected;
  $('catLbl').textContent = kind === 'income' ? 'درآمد' : 'هزینه';
}

$('txKindSeg').addEventListener('click', ev => {
  const b = ev.target.closest('button[data-kind]');
  if (!b) return;
  setSeg($('txKindSeg'), b.dataset.kind);
  fillCats(b.dataset.kind, null);
});

$('txFrm').addEventListener('submit', ev => {
  ev.preventDefault();
  const amount = Math.round(Number($('txAmount').value));
  if (!Number.isFinite(amount) || amount <= 0) { toast('مبلغ را درست وارد کن'); return; }

  const type = segValue($('txKindSeg'));
  const dt = getDP($('dpTx'));
  const rec = {
    id: S.editTx || uid(), type: type, amount: amount,
    jy: dt.jy, jm: dt.jm, jd: dt.jd,
    cat: $('txCat').value, note: $('txNote').value.trim()
  };

  if (S.editTx) {
    const i = S.d.tx.findIndex(x => x.id === S.editTx);
    S.d.tx[i] = rec;
  } else {
    S.d.tx.push(rec);
  }
  save(); $('txDlg').close(); render();
  toast(S.editTx ? 'ویرایش شد' : 'ثبت شد');
  S.editTx = null;
});

$('txCancel').addEventListener('click', () => $('txDlg').close());
$('txDelete').addEventListener('click', () => {
  const i = S.d.tx.findIndex(x => x.id === S.editTx);
  if (i < 0) return;
  const rec = S.d.tx[i];
  S.d.tx.splice(i, 1);
  save(); $('txDlg').close(); render();
  toast('حذف شد', () => { S.d.tx.splice(i, 0, rec); save(); render(); });
});

$('txAmount').addEventListener('input', () => {
  const v = Math.round(Number($('txAmount').value));
  $('txAmountHint').textContent = v > 0 ? money(v) : '';
});

/* وام */
function openLoan(loan) {
  S.editLoan = loan ? loan.id : null;
  $('loanTitle').textContent = loan ? 'ویرایش وام' : 'وام جدید';
  $('lApplyWrap').classList.toggle('hidden', !loan);
  $('lApplyAll').checked = false;
  $('lTitle').value = loan ? loan.title : '';
  $('lAmount').value = loan ? String(loan.defaultAmount) : '';
  $('lCount').value = loan ? String(loan.installments.length) : '12';
  $('lNote').value = loan ? loan.note : '';
  $('lAmountHint').textContent = loan ? money(loan.defaultAmount) : '';
  const first = loan && loan.installments.length ? loan.installments[0] : todayJalali();
  setDP($('dpLoan'), first);
  $('loanDlg').showModal();
}

$('lAmount').addEventListener('input', () => {
  const v = Math.round(Number($('lAmount').value));
  $('lAmountHint').textContent = v > 0 ? money(v) : '';
});

$('loanFrm').addEventListener('submit', ev => {
  ev.preventDefault();
  const title = $('lTitle').value.trim();
  const amount = Math.round(Number($('lAmount').value));
  const count = clamp(parseInt($('lCount').value, 10) || 1, 1, 360);
  if (!title) { toast('عنوان وام را بنویس'); return; }
  if (!(amount > 0)) { toast('مبلغ را درست وارد کن'); return; }

  const start = getDP($('dpLoan'));
  const note = $('lNote').value.trim();

  if (S.editLoan) {
    const loan = S.d.loans.find(l => l.id === S.editLoan);
    if (loan) {
      const applyAll = $('lApplyAll').checked;
      const unpaid = loan.installments.filter(i => !i.paid).sort((a, b) => jdnOf(a) - jdnOf(b));
      const paid = loan.installments.filter(i => i.paid);
      const target = Math.max(0, count - paid.length);
      if (unpaid.length > target && !confirm('تعداد اقساط کم می‌شود؛ ' + fa(unpaid.length - target) + ' قسط حذف خواهد شد. مطمئنی؟')) return;

      const next = [];
      for (let i = 0; i < target; i++) {
        const prev = unpaid[i];
        const d = addMonths(start.jy, start.jm, start.jd, paid.length + i);
        const amt = prev ? ((applyAll || !prev.custom) ? amount : prev.amount) : amount;
        next.push({
          id: prev ? prev.id : uid(), amount: amt, jy: d.jy, jm: d.jm, jd: d.jd,
          paid: false, custom: prev ? (prev.custom && !applyAll) : false
        });
      }
      loan.title = title; loan.note = note; loan.defaultAmount = amount;
      loan.installments = paid.concat(next).sort((a, b) => jdnOf(a) - jdnOf(b));
      save(); $('loanDlg').close(); render(); toast('وام ویرایش شد');
    }
    return;
  }

  const installments = [];
  for (let i = 0; i < count; i++) {
    const d = addMonths(start.jy, start.jm, start.jd, i);
    installments.push({ id: uid(), amount: amount, jy: d.jy, jm: d.jm, jd: d.jd, paid: false, custom: false });
  }
  S.d.loans.push(normalizeLoan({ id: uid(), title: title, note: note, defaultAmount: amount, installments: installments }));
  save(); $('loanDlg').close(); S.oblTab = 'loans'; render();
  toast(fa(count) + ' قسط ساخته شد');
});

$('loanCancel').addEventListener('click', () => $('loanDlg').close());

/* قسط */
function openInst(loan, inst) {
  S.editInstLoan = loan.id;
  S.editInst = inst.id;
  $('iAmount').value = String(inst.amount);
  $('iAmountHint').textContent = money(inst.amount);
  $('iPaid').checked = !!inst.paid;
  setDP($('dpInst'), inst);
  $('instDlg').showModal();
}

$('iAmount').addEventListener('input', () => {
  const v = Math.round(Number($('iAmount').value));
  $('iAmountHint').textContent = v > 0 ? money(v) : '';
});

$('instFrm').addEventListener('submit', ev => {
  ev.preventDefault();
  const loan = S.d.loans.find(l => l.id === S.editInstLoan);
  if (!loan) return;
  const inst = loan.installments.find(i => i.id === S.editInst);
  if (!inst) return;

  const amount = Math.round(Number($('iAmount').value));
  if (!(amount >= 0)) { toast('مبلغ را درست وارد کن'); return; }
  const dt = getDP($('dpInst'));

  if (amount !== loan.defaultAmount) inst.custom = true;
  inst.amount = amount;
  inst.jy = dt.jy; inst.jm = dt.jm; inst.jd = dt.jd;
  inst.paid = $('iPaid').checked;

  save(); $('instDlg').close(); render(); toast('قسط ذخیره شد');
});

$('instCancel').addEventListener('click', () => $('instDlg').close());
$('instDelete').addEventListener('click', () => {
  const loan = S.d.loans.find(l => l.id === S.editInstLoan);
  if (!loan) return;
  if (!confirm('این قسط حذف شود؟')) return;
  const idx = loan.installments.findIndex(i => i.id === S.editInst);
  const rec = loan.installments[idx];
  loan.installments.splice(idx, 1);
  save(); $('instDlg').close(); render();
  toast('حذف شد', () => { loan.installments.splice(idx, 0, rec); save(); render(); });
});

/* چک */
function openCheque(c) {
  S.editChq = c ? c.id : null;
  $('chqTitle').textContent = c ? 'ویرایش چک' : 'چک جدید';
  $('chqDelete').classList.toggle('hidden', !c);
  setSeg($('chqKindSeg'), c ? c.kind : 'in');
  $('cAmount').value = c ? String(c.amount) : '';
  $('cAmountHint').textContent = c ? money(c.amount) : '';
  $('cParty').value = c ? c.party : '';
  $('cNumber').value = c ? c.number : '';
  $('cBank').value = c ? c.bank : '';
  $('cNid').value = c ? c.nid : '';
  $('cReason').value = c ? c.reason : '';
  $('cStatus').value = c ? c.status : 'open';
  $('cDepBank').value = c ? c.depBank : '';
  $('cConfirmed').checked = c ? !!c.confirmed : false;
  $('cNote').value = c ? c.note : '';
  setDP($('dpChq'), c || todayJalali());
  $('chqDlg').showModal();
}

$('cAmount').addEventListener('input', () => {
  const v = Math.round(Number($('cAmount').value));
  $('cAmountHint').textContent = v > 0 ? money(v) : '';
});

$('chqFrm').addEventListener('submit', ev => {
  ev.preventDefault();
  const amount = Math.round(Number($('cAmount').value));
  const party = $('cParty').value.trim();
  if (!(amount > 0)) { toast('مبلغ را درست وارد کن'); return; }
  if (!party) { toast('نام طرف حساب را بنویس'); return; }

  const dt = getDP($('dpChq'));
  const rec = {
    id: S.editChq || uid(),
    kind: segValue($('chqKindSeg')),
    amount: amount, jy: dt.jy, jm: dt.jm, jd: dt.jd,
    party: party,
    number: $('cNumber').value.trim(),
    bank: $('cBank').value.trim(),
    nid: $('cNid').value.trim(),
    reason: $('cReason').value.trim(),
    status: $('cStatus').value,
    depBank: $('cDepBank').value.trim(),
    confirmed: $('cConfirmed').checked,
    note: $('cNote').value.trim()
  };

  if (S.editChq) {
    const i = S.d.cheques.findIndex(x => x.id === S.editChq);
    S.d.cheques[i] = rec;
  } else {
    S.d.cheques.push(rec);
  }
  save(); $('chqDlg').close(); S.oblTab = 'cheques'; render();
  toast(S.editChq ? 'ویرایش شد' : 'چک ثبت شد');
  S.editChq = null;
});

$('chqCancel').addEventListener('click', () => $('chqDlg').close());
$('chqDelete').addEventListener('click', () => {
  const i = S.d.cheques.findIndex(x => x.id === S.editChq);
  if (i < 0) return;
  const rec = S.d.cheques[i];
  S.d.cheques.splice(i, 1);
  save(); $('chqDlg').close(); render();
  toast('حذف شد', () => { S.d.cheques.splice(i, 0, rec); save(); render(); });
});

/* حساب */
function openAccount(a) {
  S.editAcc = a ? a.id : null;
  $('accTitle').textContent = a ? 'ویرایش حساب' : 'حساب جدید';
  $('accDelete').classList.toggle('hidden', !a);
  setSeg($('accKindSeg'), a ? a.kind : 'receivable');
  $('aName').value = a ? a.name : '';
  $('aAmount').value = a ? String(a.amount) : '';
  $('aAmountHint').textContent = a ? money(a.amount) : '';
  $('aNote').value = a ? a.note : '';
  $('aSettled').checked = a ? !!a.settled : false;
  setDP($('dpAcc'), a ? a : todayJalali());
  S.accDue = a && a.due ? a.due : todayJalali();
  S.accNoDue = a ? !a.due : false;
  setDP($('dpAccDue'), S.accDue);
  $('accNoDue').textContent = S.accNoDue ? 'بدون وعده ✓' : 'بدون وعده';
  $('accDlg').showModal();
}

$('accNoDue').addEventListener('click', () => {
  S.accNoDue = !S.accNoDue;
  $('accNoDue').textContent = S.accNoDue ? 'بدون وعده ✓' : 'بدون وعده';
});

$('accKindSeg').addEventListener('click', ev => {
  const b = ev.target.closest('button[data-kind]');
  if (b) setSeg($('accKindSeg'), b.dataset.kind);
});

$('aAmount').addEventListener('input', () => {
  const v = Math.round(Number($('aAmount').value));
  $('aAmountHint').textContent = v > 0 ? money(v) : '';
});

$('accFrm').addEventListener('submit', ev => {
  ev.preventDefault();
  const name = $('aName').value.trim();
  const amount = Math.round(Number($('aAmount').value));
  if (!name) { toast('نام شخص را بنویس'); return; }
  if (!(amount > 0)) { toast('مبلغ را درست وارد کن'); return; }

  const dt = getDP($('dpAcc'));
  const due = S.accNoDue ? null : getDP($('dpAccDue'));
  const rec = {
    id: S.editAcc || uid(),
    name: name, amount: amount, kind: segValue($('accKindSeg')),
    jy: dt.jy, jm: dt.jm, jd: dt.jd,
    due: due, settled: $('aSettled').checked,
    note: $('aNote').value.trim()
  };

  if (S.editAcc) {
    const i = S.d.accounts.findIndex(x => x.id === S.editAcc);
    S.d.accounts[i] = rec;
  } else {
    S.d.accounts.push(rec);
  }
  save(); $('accDlg').close(); S.oblTab = 'accounts'; render();
  toast(S.editAcc ? 'ویرایش شد' : 'حساب ثبت شد');
  S.editAcc = null;
});

$('accCancel').addEventListener('click', () => $('accDlg').close());
$('accDelete').addEventListener('click', () => {
  const i = S.d.accounts.findIndex(x => x.id === S.editAcc);
  if (i < 0) return;
  const rec = S.d.accounts[i];
  S.d.accounts.splice(i, 1);
  save(); $('accDlg').close(); render();
  toast('حذف شد', () => { S.d.accounts.splice(i, 0, rec); save(); render(); });
});

/* ---------- ۱۰) پیامک ---------- */
function parseSms(text) {
  const t = String(text || '')
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

  let amount = 0;
  const m = t.match(/([0-9][0-9,٬.\s]{3,})\s*(ریال|تومان|تومن)/);
  if (m) amount = Number(m[1].replace(/[^0-9]/g, ''));

  let date = null;
  const dm = t.match(/(1[34][0-9]{2})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
  if (dm) {
    const y = +dm[1], mo = +dm[2], d = +dm[3];
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) date = { jy: y, jm: mo, jd: d };
  }

  let type = 'expense';
  if (/(واریز|دریافت|به حساب شما|افزایش موجودی)/.test(t)) type = 'income';

  return { amount: amount, date: date, type: type };
}

$('smsFrm').addEventListener('submit', ev => {
  ev.preventDefault();
  const r = parseSms($('smsText').value);
  if (!r.amount) { toast('مبلغی در متن پیدا نشد'); return; }
  $('smsDlg').close();
  S.txKind = r.type;
  openTx(null);
  $('txAmount').value = String(r.amount);
  $('txAmountHint').textContent = money(r.amount);
  setSeg($('txKindSeg'), r.type);
  fillCats(r.type, null);
  if (r.date) setDP($('dpTx'), r.date);
});

$('smsCancel').addEventListener('click', () => $('smsDlg').close());

/* ---------- ۱۱) ناوبری ---------- */
$('nav').addEventListener('click', ev => {
  const b = ev.target.closest('button[data-tab]');
  if (!b) return;
  S.tab = b.dataset.tab;
  S.detailLoan = null;
  render();
});

$('fab').addEventListener('click', () => {
  if (S.tab === 'tx') openTx(null);
  else if (S.tab === 'obl') {
    if (S.oblTab === 'cheques') openCheque(null);
    else if (S.oblTab === 'loans') openLoan(null);
    else openAccount(null);
  } else if (S.tab === 'report') openTx(null);
  else openTx(null);
});

$('settingsBtn').addEventListener('click', openSettings);

/* ---------- ۱۲) تنظیمات ---------- */
function applyTheme() {
  const pref = (S.d && S.d.settings ? S.d.settings.theme : 'system') || 'system';
  const sysDark = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const dark = pref === 'dark' || (pref === 'system' && sysDark);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#0d1017' : '#f5f6fa');
}

function setThemeSeg(value) {
  for (const b of $('themeSeg').children) {
    b.classList.toggle('on', b.dataset.theme === value);
  }
}

function openSettings() {
  const st = S.d.settings;
  $('soundChk').checked = st.sound !== false;
  $('chqDays').value = String(st.chqDays);
  $('genDays').value = String(st.genDays);
  setThemeSeg(st.theme || 'system');
  $('backupStatus').textContent = st.lastBackup
    ? 'آخرین پشتیبان: ' + st.lastBackup
    : 'آخرین پشتیبان: هنوز انجام نشده';
  $('settingsDlg').showModal();
}

$('themeSeg').addEventListener('click', ev => {
  const b = ev.target.closest('button[data-theme]');
  if (!b) return;
  S.d.settings.theme = b.dataset.theme;
  save();
  setThemeSeg(b.dataset.theme);
  applyTheme();
});

$('soundChk').addEventListener('change', () => {
  S.d.settings.sound = $('soundChk').checked;
  save(); scheduleNotifications();
});

$('chqDays').addEventListener('change', () => {
  S.d.settings.chqDays = clamp(parseInt($('chqDays').value, 10) || 0, 0, 30);
  save(); scheduleNotifications();
});

$('genDays').addEventListener('change', () => {
  S.d.settings.genDays = clamp(parseInt($('genDays').value, 10) || 0, 0, 30);
  save(); scheduleNotifications();
});

$('settingsClose').addEventListener('click', () => $('settingsDlg').close());

/* تغییر رمز */
let pinChangeMode = 'pin';

function openPinChange(which) {
  pinChangeMode = which;
  $('pinTitle').textContent = which === 'master' ? 'تغییر کد مادر' : 'تغییر رمز';
  $('curWrap').classList.toggle('hidden', false);
  $('pinCur').value = ''; $('pinNew').value = ''; $('pinNew2').value = '';
  $('pinDlg').showModal();
}

$('changePinBtn').addEventListener('click', () => { $('settingsDlg').close(); openPinChange('pin'); });
$('changeMasterBtn').addEventListener('click', () => { $('settingsDlg').close(); openPinChange('master'); });
$('pinCancel').addEventListener('click', () => $('pinDlg').close());

$('pinFrm').addEventListener('submit', ev => {
  ev.preventDefault();
  const cur = $('pinCur').value.trim();
  const a = $('pinNew').value.trim();
  const b = $('pinNew2').value.trim();
  const st = S.d.settings;

  const okCur = pinChangeMode === 'master' ? hash(cur) === st.masterHash : hash(cur) === st.pinHash;
  if (!okCur) { toast('رمز فعلی درست نیست'); return; }
  if (!/^\d{6}$/.test(a)) { toast('رمز جدید باید ۶ رقم باشد'); return; }
  if (a !== b) { toast('رمزها یکسان نیستند'); return; }

  if (pinChangeMode === 'master') st.masterHash = hash(a);
  else st.pinHash = hash(a);

  save();
  $('pinDlg').close();
  toast('ذخیره شد');
});

/* ---------- ۱۳) پشتیبان ---------- */
const IN_APP = /;\s*wv\)/.test(navigator.userAgent);

function backupPayload() {
  return JSON.stringify({
    app: 'myc', v: 3, exportedAt: new Date().toISOString(),
    data: { loans: S.d.loans, cheques: S.d.cheques, accounts: S.d.accounts, tx: S.d.tx },
    settings: { sound: S.d.settings.sound, chqDays: S.d.settings.chqDays, genDays: S.d.settings.genDays }
  }, null, 2);
}

function backupName() {
  const t = todayJalali();
  return 'MyC-' + t.jy + '-' + String(t.jm).padStart(2, '0') + '-' + String(t.jd).padStart(2, '0') + '.json';
}

function nativeSave(name, content) {
  try {
    if (window.AndroidAqsat && typeof window.AndroidAqsat.saveFile === 'function') {
      return window.AndroidAqsat.saveFile(name, content) === true;
    }
  } catch (e) { /* */ }
  return false;
}

function doBackup() {
  if (!S.d.loans.length && !S.d.cheques.length && !S.d.accounts.length && !S.d.tx.length) {
    toast('چیزی برای پشتیبان‌گیری نیست'); return;
  }
  const payload = backupPayload();
  if (IN_APP && nativeSave(backupName(), payload)) {
    S.d.settings.lastBackup = fa(todayJalali().jd) + ' ' + MONTHS[todayJalali().jm - 1] + ' ' + new Date().toTimeString().slice(0, 5);
    save();
    toast('فایل در Download ذخیره شد');
    return;
  }
  if (!IN_APP) {
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = backupName();
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('فایل پشتیبان ذخیره شد');
    return;
  }
  $('backupText').value = payload;
  $('backupDlg').showModal();
}

$('exportBtn').addEventListener('click', doBackup);
$('closeBackupBtn').addEventListener('click', () => $('backupDlg').close());
$('copyBackupBtn').addEventListener('click', async () => {
  const box = $('backupText');
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(box.value);
      toast('کپی شد'); return;
    }
  } catch (e) { /* */ }
  box.focus(); box.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  toast(ok ? 'کپی شد' : 'متن انتخاب شد');
});

$('importBtn').addEventListener('click', () => {
  $('settingsDlg').close();
  if (IN_APP) {
    $('restoreText').value = '';
    $('restoreDlg').showModal();
  } else {
    $('importFile').click();
  }
});

$('pickFileBtn').addEventListener('click', () => $('importFile').click());
$('closeRestoreBtn').addEventListener('click', () => $('restoreDlg').close());

function applyImport(raw) {
  const obj = JSON.parse(String(raw));

  // پشتیبان نسخهٔ قدیمی: فهرست قسط‌های تکی
  if (Array.isArray(obj.items) && obj.items.length) {
    return { loans: migrateV1Items(obj.items), cheques: [], accounts: [], tx: [] };
  }

  const d = (obj.data && Array.isArray(obj.data.loans)) ? obj.data : obj;
  if (!d || (!Array.isArray(d.loans) && !Array.isArray(d.cheques) && !Array.isArray(d.tx))) {
    throw new Error('bad');
  }
  return {
    loans: (d.loans || []).map(normalizeLoan),
    cheques: d.cheques || [],
    accounts: d.accounts || [],
    tx: d.tx || []
  };
}

function migrateV1Items(items) {
  const groups = new Map();
  for (const it of items) {
    if (!it || !Number.isFinite(it.amount)) continue;
    const k = String(it.title || 'بدون عنوان').trim();
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(it);
  }
  const loans = [];
  for (const [title, list] of groups) {
    list.sort((a, b) => j2d(a.jy, a.jm, a.jd) - j2d(b.jy, b.jm, b.jd));
    const freq = new Map();
    for (const x of list) freq.set(x.amount, (freq.get(x.amount) || 0) + 1);
    let def = list[0].amount, best = 0;
    for (const [a, n] of freq) if (n > best) { best = n; def = a; }
    loans.push(normalizeLoan({
      id: uid(), title: title, note: list[0].note || '', defaultAmount: def,
      installments: list.map(x => ({
        id: x.id, amount: x.amount, jy: x.jy, jm: x.jm, jd: x.jd,
        paid: !!x.paid, custom: x.amount !== def
      }))
    }));
  }
  return loans;
}

function restoreFrom(raw) {
  const data = applyImport(raw);
  const count = data.loans.length + data.cheques.length + data.accounts.length + data.tx.length;
  if (!count) throw new Error('empty');
  if (!confirm('همهٔ داده‌های فعلی با ' + fa(count) + ' رکورد این پشتیبان جایگزین شود؟')) return false;
  S.d.loans = data.loans;
  S.d.cheques = data.cheques;
  S.d.accounts = data.accounts;
  S.d.tx = data.tx;
  save(); render();
  toast('داده‌ها بازیابی شد');
  return true;
}

$('restoreFrm').addEventListener('submit', ev => {
  ev.preventDefault();
  try {
    if (restoreFrom($('restoreText').value)) $('restoreDlg').close();
  } catch (e) { toast('متن پشتیبان معتبر نیست'); }
});

$('importFile').addEventListener('change', ev => {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      if (restoreFrom(reader.result) && $('restoreDlg').open) $('restoreDlg').close();
    } catch (e) { toast('فایل معتبر نیست'); }
  };
  reader.readAsText(file);
  ev.target.value = '';
});

/* ---------- ۱۴) اعلان‌ها ---------- */
function upcomingReminders() {
  const out = [];
  const t = todayJdn();
  for (const x of dueItems()) {
    if (x.days < 0) continue;
    if (x.days > 30) continue;

    const leadDays = x.kind === 'cheque' && x.cheque.kind === 'out'
      ? (S.d.settings.chqDays || 0)
      : (S.d.settings.genDays || 0);

    if (leadDays > 0 && x.days >= leadDays) {
      out.push({
        id: x.kind + '-' + (x.loan || x.cheque || x.account).id + '-lead',
        title: 'یادآوری ' + x.label,
        body: (x.kind === 'loan' ? x.loan.title : x.kind === 'cheque' ? x.cheque.party : x.account.name) + ' — ' + money(x.amount),
        at: reminderTime(x.date, leadDays)
      });
    }
    out.push({
      id: x.kind + '-' + (x.loan || x.cheque || x.account).id + '-day',
      title: 'سررسید امروز',
      body: (x.kind === 'loan' ? x.loan.title : x.kind === 'cheque' ? x.cheque.party : x.account.name) + ' — ' + money(x.amount),
      at: reminderTime(x.date, 0)
    });
  }
  return out.filter(r => r.at > Date.now());
}

function reminderTime(date, daysBefore) {
  const jdn = jdnOf(date) - daysBefore;
  const g = d2g(jdn);
  return new Date(g.gy, g.gm - 1, g.gd, 9, 0, 0).getTime();
}

function scheduleNotifications() {
  try {
    if (!window.AndroidAqsat || typeof window.AndroidAqsat.schedule !== 'function') return;
    const list = upcomingReminders();
    window.AndroidAqsat.schedule(JSON.stringify({
      sound: S.d.settings.sound !== false,
      items: list
    }));
  } catch (e) { /* */ }
}

/* ---------- ۱۵) شروع ---------- */
function boot() {
  S.d = loadData();
  applyTheme();
  buildPad();
  buildRings();

  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => { if ((S.d.settings.theme || 'system') === 'system') applyTheme(); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  if (!S.d.settings.pinHash) {
    startLock('setup1');
  } else if ((S.d.settings.lockUntil || 0) > Date.now()) {
    startLock('unlock');
  } else {
    startLock('unlock');
  }

  // ذخیرهٔ خودکار روزانه
  const t = todayJalali();
  const todayKey = t.jy + '-' + t.jm + '-' + t.jd;
  if (S.d.settings.lastAuto !== todayKey) {
    S.d.settings.lastAuto = todayKey;
    save();
  }

  $('forgotBtn').addEventListener('click', () => startLock('master'));

  // انتخاب‌گرها
  mountDP($('dpTx'));
  mountDP($('dpLoan'));
  mountDP($('dpInst'));
  mountDP($('dpChq'));
  mountDP($('dpAcc'));
  mountDP($('dpAccDue'));

  // امروز/دیروز در فرم تراکنش
  document.querySelectorAll('[data-quick]').forEach(b => {
    b.addEventListener('click', () => {
      if (b.dataset.quick === 'today') setDP($('dpTx'), todayJalali());
      else setDP($('dpTx'), d2j(todayJdn() - 1));
    });
  });
}

boot();
