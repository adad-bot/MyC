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

/* تاریخ نمایشی موقت (با بستن اپ به تاریخ سیستم برمی‌گردد) */
let VIEW_DATE = null;
const effToday = () => VIEW_DATE || todayJdn();

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
  sound: true, chqDays: 1, genDays: 3, theme: 'system', fontScale: 5, requirePin: true,
  biometric: true,
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
  return { v: 3, settings: Object.assign({}, DEFAULT_SETTINGS), loans: [], cheques: [], accounts: [], tx: [], notes: [], reminders: [] };
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
        d.notes = d.notes || [];
        d.reminders = d.reminders || [];
        return d;
      }
    }
  } catch (e) { /* */ }

  const migrated = migrateFromLegacy();
  if (migrated) return migrated;
  const fresh = blankData();
  seedDemo(fresh);
  return fresh;
}

/* دادهٔ نمونه برای تست اولیه */
function seedDemo(d) {
  const t = todayJalali();
  const plus = n => d2j(jdnOf(t) + n);

  d.settings.demo = true;

  const inst = (count, amount, offset, paidCount) => {
    const out = [];
    for (let i = 0; i < count; i++) {
      const dt = addMonths(t.jy, t.jm, t.jd, offset + i);
      out.push({
        id: 'demo-i' + offset + '-' + i, amount: amount,
        jy: dt.jy, jm: dt.jm, jd: dt.jd, paid: i < paidCount, custom: false
      });
    }
    return out;
  };

  d.loans.push(normalizeLoan({
    id: 'demo-l1', title: 'وام مسکن', note: 'بانک ملی', defaultAmount: 4500000,
    installments: inst(12, 4500000, -3, 3)
  }));
  d.loans.push(normalizeLoan({
    id: 'demo-l2', title: 'قسط خودرو', note: '', defaultAmount: 3200000,
    installments: inst(18, 3200000, 1, 0)
  }));

  const c1 = plus(2), c2 = plus(1), c3 = plus(20);
  d.cheques.push(
    { id: 'demo-c1', kind: 'in', amount: 12000000, jy: c1.jy, jm: c1.jm, jd: c1.jd, party: 'آقای رضایی', number: '452189', bank: 'ملت', nid: '', reason: 'فروش کالا', status: 'open', depBank: '', confirmed: true, note: '' },
    { id: 'demo-c2', kind: 'out', amount: 8000000, jy: c2.jy, jm: c2.jm, jd: c2.jd, party: 'شرکت پارس', number: '781233', bank: 'صادرات', nid: '', reason: 'خرید مواد', status: 'open', depBank: '', confirmed: false, note: '' },
    { id: 'demo-c3', kind: 'out', amount: 5000000, jy: c3.jy, jm: c3.jm, jd: c3.jd, party: 'آقای کریمی', number: '990012', bank: 'ملی', nid: '', reason: 'اجاره', status: 'deposited', depBank: 'ملی', confirmed: false, note: '' }
  );

  const a1 = plus(15), a2 = plus(4);
  d.accounts.push(
    { id: 'demo-a1', name: 'حسین محمدی', amount: 3000000, kind: 'receivable', jy: t.jy, jm: t.jm, jd: t.jd, due: { jy: a1.jy, jm: a1.jm, jd: a1.jd }, settled: false, note: 'قرض' },
    { id: 'demo-a2', name: 'مریم احمدی', amount: 1500000, kind: 'payable', jy: t.jy, jm: t.jm, jd: t.jd, due: { jy: a2.jy, jm: a2.jm, jd: a2.jd }, settled: false, note: '' }
  );

  d.tx.push(
    { id: 'demo-t1', type: 'income', amount: 25000000, jy: t.jy, jm: t.jm, jd: 1, cat: 'حقوق', note: 'حقوق ماه' },
    { id: 'demo-t2', type: 'expense', amount: 250000, jy: t.jy, jm: t.jm, jd: Math.max(1, t.jd - 1), cat: 'خوراک', note: 'خرید هفتگی' },
    { id: 'demo-t3', type: 'expense', amount: 120000, jy: t.jy, jm: t.jm, jd: Math.max(1, t.jd - 1), cat: 'حمل‌ونقل', note: 'تاکسی' },
    { id: 'demo-t4', type: 'expense', amount: 1200000, jy: t.jy, jm: t.jm, jd: Math.max(1, t.jd - 5), cat: 'قبض', note: 'برق و گاز' }
  );
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

function biometricAvailable() {
  try {
    return !!(window.AndroidAqsat && AndroidAqsat.hasBiometric && AndroidAqsat.hasBiometric());
  } catch (e) { return false; }
}

function startLock(mode) {
  lockMode = mode;
  buf = '';
  $('lockTitle').textContent = LOCK_TITLE[mode] || 'رمز';
  const sub = mode === 'master' ? 'کد بازیابی (کد مادر)'
    : mode === 'setup1' ? 'مرحلهٔ ۱ از ۲ — یک رمز ۶ رقمی انتخاب کن'
      : mode === 'setup2' ? 'مرحلهٔ ۲ از ۲ — همان رمز را تکرار کن'
        : 'رمز ۶ رقمی';
  $('lockSub').textContent = sub;
  $('forgotBtn').classList.toggle('hidden', mode !== 'unlock');

  const fp = $('fpBtn');
  const canFp = mode === 'unlock' && S.d.settings.biometric !== false && biometricAvailable();
  fp.classList.toggle('hidden', !canFp);

  lockErr.textContent = '';
  drawDots();
  lockEl.classList.remove('hide');
  $('app').classList.add('hidden');
  checkLockTimer();
}

$('fpBtn').addEventListener('click', () => {
  if (!biometricAvailable()) { lockErr.textContent = 'این گوشی اثر انگشت ندارد'; return; }
  try { AndroidAqsat.askBiometric(); } catch (e) { lockErr.textContent = 'اثر انگشت باز نشد'; }
});

window.onBiometricOk = function () {
  if (lockMode !== 'unlock') return;
  buf = '';
  S.d.settings.fails = 0;
  save();
  endLock();
  toast('خوش آمدی');
};

window.onBiometricFail = function () {
  if (lockMode !== 'unlock') return;
  lockErr.textContent = 'اثر انگشت شناسایی نشد';
};

function endLock() {
  lockEl.classList.add('hide');
  $('app').classList.remove('hidden');
  if (lockTimer) { clearInterval(lockTimer); lockTimer = null; }
  render();

  if (pendingResetAsk) {
    pendingResetAsk = false;
    setTimeout(askResetData, 500);
  }
}

function shakeLock() {
  lockEl.classList.remove('shake');
  void lockEl.offsetWidth;
  lockEl.classList.add('shake');
  setTimeout(() => lockEl.classList.remove('shake'), 420);
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
  shakeLock();

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
  const t = effToday();
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

function openOcc(o) {
  $('occTitle').textContent = o.t;
  $('occBody').textContent = o.d || 'توضیحی برای این مناسبت ثبت نشده است.';
  const box = $('occHadith');
  if (o.hadith) {
    box.classList.remove('hidden');
    box.textContent = o.hadith;
  } else {
    box.classList.add('hidden');
  }
  $('occDlg').showModal();
}

$('occOk').addEventListener('click', () => $('occDlg').close());

/* ---------- یادآورهای تقویم ---------- */
let remEditId = null;

function remForDay(jdn) {
  return (S.d.reminders || []).filter(r => jdnOf(r) === jdn);
}

function renderDayRem() {
  const list = $('dayRemList');
  list.textContent = '';
  const items = remForDay(calSel);

  if (!items.length) {
    const e = el('div', 'hint');
    e.textContent = 'برای این روز یادآوری ثبت نشده است.';
    e.style.padding = '6px 4px';
    list.appendChild(e);
    return;
  }

  for (const r of items) {
    const dd = jdnOf(r) - effToday();
    const u = dd <= 1 ? 'u-red' : dd <= 3 ? 'u-yellow' : dd <= 7 ? 'u-orange' : '';
    const row = el('div', 'item rem-row ' + u);
    const ico = el('div', 'ico chq', '⏰');
    const main = el('div', 'main');
    main.appendChild(el('div', 't', r.title));
    const m = el('div', 'm');
    m.appendChild(el('span', null, dateLabel(r)));
    m.appendChild(el('span', 'pill info', r.daysBefore ? fa(r.daysBefore) + ' روز قبل' : 'همان روز'));
    m.appendChild(el('span', 'pill ' + (r.sound === false ? 'info' : 'ok'), r.sound === false ? 'بی‌صدا' : 'با صدا'));
    main.appendChild(m);
    row.append(ico, main);
    row.addEventListener('click', () => openRem(r));
    list.appendChild(row);
  }
}

function openRem(r) {
  remEditId = r ? r.id : null;
  $('remTitleH').textContent = r ? 'ویرایش یادآور' : 'یادآور جدید';
  $('remTitle').value = r ? r.title : '';
  $('remNote').value = r ? (r.note || '') : '';
  $('remBefore').value = String(r ? (r.daysBefore || 0) : 0);
  $('remSound').checked = r ? r.sound !== false : true;
  $('remDelete').classList.toggle('hidden', !r);
  $('remDlg').showModal();
  setTimeout(() => $('remTitle').focus(), 80);
}

$('addRemBtn').addEventListener('click', () => openRem(null));
$('remCancel').addEventListener('click', () => $('remDlg').close());

$('remFrm').addEventListener('submit', ev => {
  ev.preventDefault();
  const title = $('remTitle').value.trim();
  if (!title) { toast('عنوان یادآور را بنویس'); return; }

  const rec = {
    id: remEditId || uid(),
    title: title,
    note: $('remNote').value.trim(),
    jy: d2j(calSel).jy,
    jm: d2j(calSel).jm,
    jd: d2j(calSel).jd,
    daysBefore: parseInt($('remBefore').value, 10) || 0,
    sound: $('remSound').checked
  };

  if (remEditId) {
    const i = S.d.reminders.findIndex(x => x.id === remEditId);
    if (i >= 0) S.d.reminders[i] = rec;
  } else {
    S.d.reminders.push(rec);
  }

  save();
  $('remDlg').close();
  renderCal();
  renderDayRem();
  scheduleNotifications();
  toast('یادآور ذخیره شد');
});

$('remDelete').addEventListener('click', () => {
  const i = S.d.reminders.findIndex(x => x.id === remEditId);
  if (i < 0) return;
  if (!confirm('این یادآور حذف شود؟')) return;
  S.d.reminders.splice(i, 1);
  save();
  $('remDlg').close();
  renderCal();
  renderDayRem();
  scheduleNotifications();
  toast('حذف شد');
});

function markSeen(x) {
  if (!x) return;
  const base = baseIdOf(x);
  S.d.settings.notifSeen = S.d.settings.notifSeen || {};
  for (const s of NOTIF_SLOTS) {
    S.d.settings.notifSeen[base + '-d' + s.d + '-h' + s.h] = 1;
    S.d.settings.notifSeen[base + '-day'] = 1;
    S.d.settings.notifSeen[base + '-lead'] = 1;
  }
  save();
  scheduleNotifications();
}

/* ---------- خواندن اطلاعات چک از QR ---------- */
function applyQrText(txt) {
  const t = (txt || '').trim();

  if (t.startsWith('ERR:')) {
    const code = t.slice(4);
    const map = {
      CANCELLED: 'اسکن لغو شد',
      NOIMAGE: 'عکسی گرفته نشد',
      NOCAMERA: 'دوربین در دسترس نیست'
    };
    if (code.startsWith('NOTFOUND')) {
      toast('در تصویر QR پیدا نشد — نزدیکتر و واضحتر عکس بگیر');
    } else {
      toast(map[code] || ('خطای اسکن: ' + code));
    }
    return;
  }

  if (!t) { toast('QR خوانده نشد؛ عکس واضحتری بگیر'); return; }

  let obj = null;
  try { obj = JSON.parse(t); } catch (e) { obj = null; }

  const set = (id, v) => { if (v !== undefined && v !== null && String(v) !== '') $(id).value = String(v); };

  if (obj && typeof obj === 'object') {
    set('cParty', obj.party || obj.name || obj.owner || obj.در_وجه || obj.طرف_حساب);
    set('cNumber', obj.number || obj.no || obj.serial || obj.شماره);
    set('cBank', obj.bank || obj.بانک);
    set('cNid', obj.nid || obj.nationalId || obj.کد_ملی);
    set('cReason', obj.reason || obj.بابت);
    const amt = obj.amount || obj.value || obj.مبلغ;
    if (amt) {
      const n = Number(String(amt).replace(/[^\d]/g, ''));
      if (n > 0) { $('cAmount').value = String(n); $('cAmountHint').textContent = money(n); }
    }
    toast('اطلاعات چک از QR خوانده شد');
    return;
  }

  if (/^\d{5,20}$/.test(t)) {
    set('cNumber', t);
    toast('شمارهٔ چک از QR خوانده شد');
    return;
  }

  set('cParty', t.slice(0, 60));
  toast('متن QR در نام طرف حساب گذاشته شد');
}

function onQrFile(ev) {
  const f = ev.target.files && ev.target.files[0];
  if (!f) return;
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const b64 = String(fr.result).split(',')[1] || '';
      if (!window.AndroidAqsat || !AndroidAqsat.decodeQrBase64) {
        toast('خواندن QR فقط در نسخهٔ نصبی کار می‌کند');
        return;
      }
      const txt = AndroidAqsat.decodeQrBase64(b64);
      applyQrText(txt);
    } catch (e) {
      toast('خطا در خواندن تصویر');
    }
  };
  fr.readAsDataURL(f);
  ev.target.value = '';
}

$('qrBtn').addEventListener('click', () => {
  try {
    if (window.AndroidAqsat && AndroidAqsat.scanQr) { AndroidAqsat.scanQr(); return; }
  } catch (e) { /* */ }
  $('qrFile').click();
});

$('qrGal').addEventListener('click', () => $('qrFile').click());

window.onQrResult = function (text) {
  applyQrText(text || '');
};

$('qrFile').addEventListener('change', onQrFile);

/* ---------- بررسی نسخه و تصمیم دربارهٔ دادهٔ قبلی ---------- */
const APP_VER = 9;
let pendingResetAsk = false;

function backupToDocs() {
  const stamp = new Date().toISOString().slice(0, 10);
  const json = JSON.stringify({ v: 3, app: 'MyC', savedAt: new Date().toISOString(), data: S.d }, null, 1);
  try {
    if (window.AndroidAqsat && AndroidAqsat.saveDocs) {
      return AndroidAqsat.saveDocs('Back_Miaad-' + stamp + '.json', json);
    }
    if (window.AndroidAqsat && AndroidAqsat.saveFile) {
      return AndroidAqsat.saveFile('Back_Miaad-' + stamp + '.json', json);
    }
  } catch (e) { /* */ }
  return false;
}

function wipeAllData() {
  const st = S.d.settings;
  st.seenVersion = APP_VER;
  S.d = {
    v: 3, settings: st,
    loans: [], cheques: [], accounts: [], tx: [], notes: [], reminders: []
  };
  S.tab = 'home';
  save();
  render();
}

let rstStep = 0, rstTimer = null;

function askResetData() {
  rstStep = 1;
  $('rstTitle').textContent = 'داده‌های نسخهٔ قبل';
  $('rstBody').textContent = 'داده‌های قبلی روی این گوشی وجود دارد. می‌خواهی بمانند یا پاک شوند؟';
  $('rstYes').textContent = 'پاک شود';
  $('rstNo').textContent = 'بماند';
  $('rstNo').classList.remove('hidden');
  $('resetDlg').showModal();
}

$('rstNo').addEventListener('click', () => {
  if (rstStep === 3) {
    clearTimeout(rstTimer);
    S.d.settings.seenVersion = APP_VER;
    save();
    $('resetDlg').close();
    toast('داده‌های قبلی حفظ شد');
    return;
  }
  S.d.settings.seenVersion = APP_VER;
  save();
  $('resetDlg').close();
  toast('داده‌ها حفظ شدند');
});

$('rstYes').addEventListener('click', () => {
  if (rstStep === 0) return;
  if (rstStep === 1) {
    rstStep = 2;
    $('rstTitle').textContent = 'تأیید پاک‌کردن';
    $('rstBody').textContent = 'همهٔ اطلاعات قبلی (وام، چک، حساب، تراکنش، یادداشت و یادآورها) پاک می‌شود. مطمئنی؟';
    $('rstYes').textContent = 'بله، پاک کن';
    $('rstNo').textContent = 'خیر';
    return;
  }

  if (rstStep === 2) {
    rstStep = 3;
    $('rstTitle').textContent = 'در حال پاک‌کردن…';
    $('rstBody').textContent = 'داده‌های قبلی پاک می‌شوند.';
    $('rstYes').textContent = 'واگرد داده‌های قبلی';
    $('rstNo').classList.add('hidden');

    clearTimeout(rstTimer);
    rstTimer = setTimeout(() => {
      const ok = backupToDocs();
      wipeAllData();
      $('resetDlg').close();
      toast(ok ? 'داده‌ها پاک شد و نسخهٔ پشتیبان در Documents/Back_Miaad ذخیره شد' : 'داده‌ها پاک شدند');
    }, 5000);
    return;
  }

  // واگرد
  clearTimeout(rstTimer);
  S.d.settings.seenVersion = APP_VER;
  save();
  $('resetDlg').close();
  toast('پاک‌کردن لغو شد — داده‌ها سر جایشان هستند');
});

/* ---------- گزارش طلب / بدهی ---------- */
let sideExpanded = false, sideKind = 'r';

function sideItems(kind) {
  const items = [];
  const t = effToday();

  for (const a of S.d.accounts) {
    if (a.settled) continue;
    if (kind === 'r' && a.kind !== 'receivable') continue;
    if (kind === 'p' && a.kind !== 'payable') continue;
    const date = a.due || { jy: a.jy, jm: a.jm, jd: a.jd };
    items.push({
      kind: 'account', account: a, amount: a.amount, date: date,
      days: a.due ? jdnOf(a.due) - t : 0,
      label: a.kind === 'receivable' ? 'طلب' : 'بدهی'
    });
  }

  for (const c of S.d.cheques) {
    if (c.status !== 'open' && c.status !== 'deposited') continue;
    if (kind === 'r' && c.kind !== 'in') continue;
    if (kind === 'p' && c.kind !== 'out') continue;
    items.push({
      kind: 'cheque', cheque: c, amount: c.amount, date: c,
      days: jdnOf(c) - t,
      label: c.kind === 'in' ? 'چک دریافتی' : 'چک صادره'
    });
  }

  items.sort((a, b) => jdnOf(a.date) - jdnOf(b.date));
  return items;
}

function sideMoneyRow(x) {
  const row = el('div', 'item');
  const isIn = (x.kind === 'cheque' && x.cheque.kind === 'in') ||
    (x.kind === 'account' && x.account.kind === 'receivable');
  const ico = el('div', 'ico ' + (x.kind === 'cheque' ? 'chq' : 'acc'), isIn ? '↙' : '↗');
  const main = el('div', 'main');
  main.appendChild(el('div', 't', x.kind === 'cheque' ? x.cheque.party : x.account.name));
  const m = el('div', 'm');
  m.appendChild(el('span', null, dateLabel(x.date)));
  m.appendChild(el('span', 'pill info', x.label));
  if (x.kind === 'cheque') m.appendChild(el('span', null, CHQ_STATUS[x.cheque.status] || ''));
  main.appendChild(m);
  const amt = el('div', 'amt ' + (isIn ? 'green' : 'red'), NUM.format(x.amount));
  row.append(ico, main, amt);
  return row;
}

function openSide(kind, expanded) {
  sideKind = kind;
  sideExpanded = !!expanded;

  const items = sideItems(kind);
  $('sideTitle').textContent = kind === 'r' ? 'طلب‌های من' : 'بدهی‌های من';
  $('sideMore').textContent = sideExpanded ? 'خلاصه' : 'توضیح کامل';
  $('sideMore').disabled = !items.length;

  const list = $('sideList');
  list.textContent = '';

  if (!items.length) {
    const e = el('div', 'empty');
    e.innerHTML = kind === 'r' ? '<b>طلبی نداری</b>حساب طلب یا چک دریافتی باز نیست.' : '<b>بدهی نداری</b>حساب بدهی یا چک صادرهٔ باز نیست.';
    list.appendChild(e);
  }

  for (const x of items) list.appendChild(sideExpanded ? expandedCard(x) : sideMoneyRow(x));

  if (!$('sideDlg').open) $('sideDlg').showModal();
}

$('sideMore').addEventListener('click', () => openSide(sideKind, !sideExpanded));
$('sideClose').addEventListener('click', () => $('sideDlg').close());

/* ---------- گزارش تعهدهای امروز ---------- */
let todayExpanded = false;

function infoRow(k, v) {
  const r = el('div', 'inforow');
  r.appendChild(el('span', 'k', k));
  r.appendChild(el('span', 'vv', v));
  return r;
}

function expandedCard(x) {
  const card = el('div', 'card pad');
  card.style.marginBottom = '8px';

  const head = el('div');
  head.style.fontWeight = '800';
  head.style.marginBottom = '6px';
  head.style.fontSize = '13.5px';
  const name = x.kind === 'loan' ? x.loan.title : x.kind === 'cheque' ? x.cheque.party : x.account.name;
  head.textContent = name + ' — ' + x.label;
  card.appendChild(head);

  card.appendChild(infoRow('مبلغ', money(x.amount)));
  card.appendChild(infoRow('تاریخ', dateLabel(x.date) + '  (' + daysLabel(x.days) + ')'));

  if (x.kind === 'loan') {
    const idx = x.loan.installments.findIndex(i => i.id === x.inst.id) + 1;
    card.appendChild(infoRow('قسط', fa(idx) + ' از ' + fa(x.loan.installments.length)));
    card.appendChild(infoRow('وضعیت', x.inst.paid ? 'پرداخت‌شده' : 'پرداخت‌نشده'));
    if (x.loan.note) card.appendChild(infoRow('یادداشت', x.loan.note));
  } else if (x.kind === 'cheque') {
    const c = x.cheque;
    card.appendChild(infoRow('نوع چک', c.kind === 'in' ? 'دریافتی' : 'صادره'));
    if (c.number) card.appendChild(infoRow('شماره چک', c.number));
    if (c.bank) card.appendChild(infoRow('بانک', c.bank));
    if (c.reason) card.appendChild(infoRow('بابت', c.reason));
    card.appendChild(infoRow('وضعیت', CHQ_STATUS[c.status] || c.status));
  } else {
    const a = x.account;
    card.appendChild(infoRow('نوع', a.kind === 'receivable' ? 'طلب من' : 'بدهی من'));
    if (a.note) card.appendChild(infoRow('یادداشت', a.note));
  }
  return card;
}

function openToday(expanded) {
  todayExpanded = !!expanded;
  const items = dueItems().filter(x => x.days === 0);

  const list = $('todayList');
  list.textContent = '';

  $('todayMore').textContent = todayExpanded ? 'خلاصه' : 'توضیح کامل';
  $('todayMore').disabled = !items.length;

  if (!items.length) {
    const e = el('div', 'empty');
    e.innerHTML = '<b>امروز تعهدی نیست</b>سررسیدی برای امروز ثبت نشده است.';
    list.appendChild(e);
  }

  for (const x of items) {
    list.appendChild(todayExpanded ? expandedCard(x) : dueRow(x));
  }

  if (!$('todayDlg').open) $('todayDlg').showModal();
}

$('todayMore').addEventListener('click', () => openToday(!todayExpanded));
$('todayClose').addEventListener('click', () => $('todayDlg').close());
const FMT_G = new Intl.DateTimeFormat('fa-IR-u-ca-gregory', { day: 'numeric', month: 'long', year: 'numeric' });
const FMT_W = new Intl.DateTimeFormat('fa-IR', { weekday: 'long' });
let FMT_H = null;
try {
  FMT_H = new Intl.DateTimeFormat('fa-IR-u-ca-islamic-umalqura',
    { day: 'numeric', month: 'long', year: 'numeric' });
} catch (e) { FMT_H = null; }

function toDate(jdn) { const g = d2g(jdn); return new Date(g.gy, g.gm - 1, g.gd); }
function gLabel(jdn) { return FMT_G.format(toDate(jdn)); }
function hLabel(jdn) { return FMT_H ? FMT_H.format(toDate(jdn)) : ''; }
function wLabel(jdn) { return FMT_W.format(toDate(jdn)); }

const OCCASIONS = {
  '1-1': [{ t: 'نوروز', d: 'آغاز سال نو خورشیدی؛ بزرگترین جشن ملی ایرانیان که با تحویل سال، سفرهٔ هفت‌سین و دیدوبازدید برگزار می‌شود.' }],
  '1-2': [{ t: 'عید نوروز', d: 'دومین روز جشن‌های نوروزی؛ زمان دیدوبازدید و سفرهای کوتاه خانوادگی.' }],
  '1-3': [{ t: 'عید نوروز', d: 'سومین روز جشن‌های نوروزی و ادامهٔ آیین‌های دیدوبازدید.' }],
  '1-4': [{ t: 'عید نوروز', d: 'چهارمین روز جشن‌های نوروزی؛ در تقویم رسمی تعطیل است.' }],
  '1-12': [{ t: 'روز جمهوری اسلامی', d: 'سالروز رأی مردم ایران به نظام جمهوری اسلامی در ۱۲ فروردین ۱۳۵۸.' }],
  '1-13': [{ t: 'سیزده‌به‌در', d: 'آخرین روز جشن نوروز و «روز طبیعت»؛ ایرانیان این روز را در دامان طبیعت می‌گذرانند.' }],
  '2-12': [{ t: 'روز معلم', d: 'سالروز شهادت مرتضی مطهری و بزرگداشت مقام معلم و استاد.' }],
  '11-22': [{ t: 'پیروزی انقلاب اسلامی', d: 'سالروز پیروزی انقلاب اسلامی در ۲۲ بهمن ۱۳۵۷ و پایان نظام پادشاهی.' }],
  '12-29': [{ t: 'روز ملی شدن صنعت نفت', d: 'سالروز ملی شدن صنعت نفت ایران در ۲۹ اسفند ۱۳۲۹ به رهبری دکتر مصدق.' }]
};

/* مناسبت‌های قمری (کلید: ماه-روز قمری) */
const HIJRI_OCCASIONS = {
  '1-9': [{ t: 'تاسوعای حسینی', h: true, d: 'نهم محرم؛ روز بزرگداشت حضرت ابوالفضل العباس و یاران امام حسین (ع).' }],
  '1-10': [{ t: 'عاشورای حسینی', h: true, d: 'دهم محرم؛ سالروز شهادت امام حسین (ع) و یارانشان در کربلا.' }],
  '1-12': [{ t: 'شهادت امام سجاد (ع)', d: 'دوازدهم محرم؛ سالروز شهادت امام زین‌العابدین (ع).' }],
  '2-20': [{ t: 'اربعین حسینی', d: 'بیستم صفر؛ چهلمین روز شهادت امام حسین (ع) و یارانش.' }],
  '2-28': [{ t: 'رحلت پیامبر (ص)', h: true, d: 'بیست‌وهشتم صفر؛ سالروز رحلت حضرت محمد (ص) و شهادت امام حسن مجتبی (ع).' }],
  '2-30': [{ t: 'شهادت امام رضا (ع)', h: true, d: 'سی‌ام صفر؛ سالروز شهادت امام علی بن موسی الرضا (ع).' }],
  '3-12': [{ t: 'ولادت پیامبر (ص)', d: 'دوازدهم ربیع‌الاول؛ سالروز ولادت حضرت محمد (ص) و امام جعفر صادق (ع) در روایتی.' }],
  '3-17': [{ t: 'ولادت امام جعفر صادق (ع)', d: 'هفدهم ربیع‌الاول؛ سالروز ولادت امام جعفر صادق (ع).' }],
  '6-3': [{ t: 'شهادت حضرت فاطمه (س)', d: 'سوم جمادی‌الثانی؛ سالروز شهادت حضرت فاطمه زهرا (س) در روایتی.' }],
  '7-13': [{ t: 'ولادت امام علی (ع)', d: 'سیزدهم رجب؛ سالروز ولادت امام علی (ع) در کعبه.' }],
  '7-27': [{ t: 'مبعث پیامبر (ص)', h: true, d: 'بیست‌وهفتم رجب؛ سالروز بعثت حضرت محمد (ص).' }],
  '8-15': [{ t: 'ولادت امام مهدی (عج)', d: 'پانزدهم شعبان؛ سالروز ولادت حضرت مهدی (عج).' }],
  '9-1': [{ t: 'عید سعید فطر', h: true, d: 'اول شوال؛ پایان ماه رمضان و عید فطر.' }],
  '9-10': [{ t: 'وفات حضرت خدیجه (س)', d: 'دهم رمضان؛ سالروز وفات حضرت خدیجه (س)، همسر پیامبر (ص).' }],
  '9-21': [{ t: 'شهادت امام علی (ع)', h: true, d: 'بیست‌ویکم رمضان؛ سالروز شهادت امام علی (ع) در محراب کوفه.' }],
  '10-25': [{ t: 'شهادت امام جعفر صادق (ع)', h: true, d: 'بیست‌وپنجم شوال؛ سالروز شهادت امام جعفر صادق (ع).' }],
  '12-10': [{ t: 'عید سعید قربان', h: true, d: 'دهم ذی‌الحجه؛ عید قربان و روز حج.' }],
  '12-18': [{ t: 'عید غدیر خم', h: true, d: 'هجدهم ذی‌الحجه؛ سالروز واقعهٔ غدیر خم.' }],
  '12-24': [{ t: 'مباهله', d: 'بیست‌وچهارم ذی‌الحجه؛ سالروز واقعهٔ مباهله پیامبر (ص) با مسیحیان نجران.' }]
};

/* حدیث کوتاه برای مناسبت‌های ولادت و شهادت */
const HADITHS = {
  '1-10': 'امام حسین (ع): «اگر دین ندارید، لااقل آزاده باشید.»',
  '6-3': 'پیامبر (ص): «فاطمه پارهٔ تن من است؛ هر که او را بیازارد، مرا آزرده است.»',
  '9-1': 'امام علی (ع): «عید کسی است که خداوند طاعتش را بپذیرد.»',
  '12-18': 'پیامبر (ص): «هر که من مولای او هستم، علی مولای اوست.»',
  '7-27': 'خداوند: «اقرأ باسم ربک الذی خلق» — آغاز بعثت پیامبر (ص).'
};

for (const k in HADITHS) {
  if (HIJRI_OCCASIONS[k] && HIJRI_OCCASIONS[k][0]) HIJRI_OCCASIONS[k][0].hadith = HADITHS[k];
}

let FMT_HMD = null;
try {
  FMT_HMD = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { month: 'numeric', day: 'numeric' });
} catch (e) { /* */ }

function hijriParts(jdn) {
  if (!FMT_HMD) return null;
  try {
    const parts = FMT_HMD.formatToParts(toDate(jdn));
    let m = 0, d = 0;
    for (const p of parts) {
      if (p.type === 'month') m = parseInt(p.value, 10);
      if (p.type === 'day') d = parseInt(p.value, 10);
    }
    return { m: m, d: d };
  } catch (e) { return null; }
}

function hijriOcc(jdn) {
  const p = hijriParts(jdn);
  if (!p) return [];
  return HIJRI_OCCASIONS[p.m + '-' + p.d] || [];
}

function allOcc(jdn) {
  const j = d2j(jdn);
  return occList(j.jm, j.jd).concat(hijriOcc(jdn));
}

/* مناسبت‌های رسمی و تکمیلی (h = تعطیل رسمی) */
Object.assign(OCCASIONS, {
  '1-1': [{ t: 'نوروز', h: true, d: 'آغاز سال نو خورشیدی؛ بزرگ‌ترین جشن ملی ایرانیان با سفرهٔ هفت‌سین و دیدوبازدید.' }],
  '1-2': [{ t: 'عید نوروز', h: true, d: 'دومین روز جشن‌های نوروزی؛ زمان دیدوبازدید خانوادگی.' }],
  '1-3': [{ t: 'عید نوروز', h: true, d: 'سومین روز جشن‌های نوروزی و ادامهٔ آیین‌های نوروز.' }],
  '1-4': [{ t: 'عید نوروز', h: true, d: 'چهارمین روز جشن‌های نوروزی؛ تعطیل رسمی.' }],
  '1-12': [{ t: 'روز جمهوری اسلامی', h: true, d: 'سالروز رأی مردم ایران به نظام جمهوری اسلامی در ۱۲ فروردین ۱۳۵۸.' }],
  '1-13': [{ t: 'سیزده‌به‌در', h: true, d: 'آخرین روز جشن نوروز و «روز طبیعت»؛ ایرانیان این روز را در دامان طبیعت می‌گذرانند.' }],
  '2-11': [{ t: 'روز کارگر', d: 'بزرگداشت کار و کارگر؛ روز جهانی کارگر در تقویم ایران.' }],
  '2-12': [{ t: 'روز معلم', d: 'سالروز شهادت مرتضی مطهری و بزرگداشت مقام معلم و استاد.' }],
  '8-13': [{ t: 'روز دانش‌آموز', d: 'سالروز ۱۳ آبان؛ روز مبارزه با استکبار و روز دانش‌آموز.' }],
  '11-22': [{ t: 'پیروزی انقلاب اسلامی', h: true, d: 'سالروز پیروزی انقلاب اسلامی در ۲۲ بهمن ۱۳۵۷ و پایان نظام پادشاهی.' }],
  '12-29': [{ t: 'روز ملی شدن صنعت نفت', h: true, d: 'سالروز ملی شدن صنعت نفت ایران در ۲۹ اسفند ۱۳۲۹ به رهبری دکتر مصدق.' }]
});

function occList(jm, jd) { return OCCASIONS[jm + '-' + jd] || []; }

const WEEK_NAMES = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

const DECOR = {
  spring: '<svg class="dc-deco" viewBox="0 0 120 120"><circle cx="92" cy="24" r="13" fill="#ffe066" opacity=".95"/><path d="M6 100 Q38 70 74 88" stroke="#2f7d4f" stroke-width="3" fill="none"/><circle cx="34" cy="84" r="5" fill="#ff8fab"/><circle cx="56" cy="80" r="4.5" fill="#ff8fab"/><circle cx="70" cy="86" r="4" fill="#ff8fab"/></svg>',
  summer: '<svg class="dc-deco" viewBox="0 0 120 120"><circle cx="90" cy="26" r="16" fill="#ffcf40" opacity=".95"/><path d="M0 104 Q40 88 80 100" stroke="#e08b2f" stroke-width="3" fill="none"/></svg>',
  autumn: '<svg class="dc-deco" viewBox="0 0 120 120"><circle cx="90" cy="26" r="14" fill="#ffb347" opacity=".9"/><path d="M8 98 Q40 66 76 86" stroke="#b5651d" stroke-width="3" fill="none"/><path d="M40 78 q6 -10 14 -4 q-2 10 -14 4z" fill="#e07a5f"/><path d="M62 86 q8 -9 15 -2 q-4 10 -15 2z" fill="#d96a3f"/></svg>',
  winter: '<svg class="dc-deco" viewBox="0 0 120 120"><circle cx="90" cy="26" r="13" fill="#cfe3ff" opacity=".95"/><path d="M10 100 Q40 78 74 92" stroke="#7fa7cf" stroke-width="3" fill="none"/><circle cx="30" cy="60" r="2.5" fill="#ffffff"/><circle cx="52" cy="44" r="2" fill="#ffffff"/><circle cx="70" cy="62" r="2.2" fill="#ffffff"/></svg>'
};

function seasonOf(jm) {
  if (jm <= 3) return 'spring';
  if (jm <= 6) return 'summer';
  if (jm <= 9) return 'autumn';
  return 'winter';
}

function weekIndex(jdn) {
  // شنبه = ۰
  const g = toDate(jdn);
  return (g.getDay() + 1) % 7;
}

const G_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
const G_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

let FMT_HM = null;
try {
  FMT_HM = new Intl.DateTimeFormat('fa-u-ca-islamic-umalqura', { month: 'long', year: 'numeric' });
} catch (e) { /* */ }

function hijriDayNum(jdn) {
  if (!FMT_HD) return '';
  try { return fa(FMT_HD.format(toDate(jdn))); } catch (e) { return ''; }
}

function hijriMonthLabel(jdn) {
  if (!FMT_HM) return '';
  try { return FMT_HM.format(toDate(jdn)); } catch (e) { return ''; }
}

function buildDateCard() {
  const jdn = effToday();
  const j = d2j(jdn);
  const g = d2g(jdn);
  const season = seasonOf(j.jm);

  const card = el('div', 'datecard ' + season);

  const row = el('div', 'dc-row');

  const right = el('div', 'dc-right');
  right.appendChild(el('div', 'dc-month', MONTHS[j.jm - 1]));
  right.appendChild(el('div', 'dc-gmonth', G_MONTHS[g.gm - 1] + ' ' + g.gy));

  const circle = el('div', 'dc-circle');
  circle.innerHTML = DECOR[season] +
    '<span class="dc-h">' + hijriDayNum(jdn) + '</span>' +
    '<span class="dc-day">' + fa(j.jd) + '</span>' +
    '<span class="dc-y">' + fa(j.jy) + '</span>';
  circle.addEventListener('click', ev => { ev.stopPropagation(); openDateDlg(jdn); });

  const left = el('div', 'dc-left');
  left.appendChild(el('div', 'dc-weekday', wLabel(jdn)));
  left.appendChild(el('div', 'dc-hijri', hijriMonthLabel(jdn)));

  row.append(right, circle, left);
  card.appendChild(row);

  const occs = allOcc(jdn).slice(0, 2);
  if (occs.length) {
    const wrap = el('div', 'dc-occ-wrap');
    for (const o of occs) {
      const chip = el('div', 'dc-occ' + (o.h ? ' hol' : '') + (occs.length === 1 ? ' big' : ''), o.t);
      chip.addEventListener('click', ev => { ev.stopPropagation(); openOcc(o); });
      wrap.appendChild(chip);
    }
    card.appendChild(wrap);
  }

  // یادآور نزدیک (تا یک هفته) با رنگ فوریت
  const rems = (S.d.reminders || [])
    .map(r => ({ r: r, d: jdnOf(r) - effToday() }))
    .filter(x => x.d >= 0 && x.d <= 7)
    .sort((a, b) => a.d - b.d);

  if (rems.length) {
    const x = rems[0];
    const u = x.d <= 1 ? 'u-red' : x.d <= 3 ? 'u-yellow' : 'u-orange';
    const chip = el('div', 'dc-occ rem ' + u, '⏰ ' + x.r.title + (x.d === 0 ? ' امروز' : ' · ' + fa(x.d) + ' روز'));
    chip.addEventListener('click', ev => { ev.stopPropagation(); openDateDlg(jdnOf(x.r)); });
    const w = el('div', 'dc-occ-wrap');
    w.appendChild(chip);
    card.appendChild(w);
  }

  const idx = weekIndex(jdn);
  const start = jdn - idx;
  const strip = el('div', 'dc-week');
  for (let i = 0; i < 7; i++) {
    const d = start + i;
    const jd = d2j(d);
    const b = document.createElement('button');
    b.type = 'button';
    if (i === idx) b.className = 'on';
    b.innerHTML = '<span class="wn">' + WEEK_NAMES[i] + '</span><span class="wd">' + fa(jd.jd) + '</span>';
    b.addEventListener('click', ev => { ev.stopPropagation(); openDateDlg(d); });
    strip.appendChild(b);
  }
  card.appendChild(strip);

  const act = el('div', 'dc-act');
  const bFal = el('button', null, 'فال حافظ');
  bFal.addEventListener('click', ev => { ev.stopPropagation(); openFal(); });
  const bCal = el('button', null, 'تقویم و روزها');
  bCal.addEventListener('click', ev => { ev.stopPropagation(); openDateDlg(effToday()); });
  act.append(bFal, bCal);
  card.appendChild(act);

  return card;
}

let calY = 0, calM = 0, calSel = 0;

function openDateDlg(jdn) {
  const j = d2j(jdn);
  calY = j.jy;
  calM = j.jm;
  calSel = jdn;
  renderCal();
  renderDateInfo();
  $('dateDlg').showModal();
}

let FMT_HD = null;
try {
  FMT_HD = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric' });
} catch (e) { FMT_HD = null; }

function hijriDay(jdn) {
  if (!FMT_HD) return '';
  try { return fa(FMT_HD.format(toDate(jdn))); } catch (e) { return ''; }
}

function renderUpcomingRems() {
  const list = $('upRemList');
  if (!list) return;
  list.textContent = '';

  const t = effToday();
  const items = (S.d.reminders || [])
    .map(r => ({ r: r, d: jdnOf(r) - t }))
    .filter(x => x.d >= 0 && x.d <= 7)
    .sort((a, b) => a.d - b.d);

  if (!items.length) {
    const e = el('div', 'hint');
    e.textContent = 'یادآوری در هفتهٔ پیش رو نیست.';
    e.style.padding = '2px 4px';
    list.appendChild(e);
    return;
  }

  for (const x of items) {
    const u = x.d <= 1 ? 'u-red' : x.d <= 3 ? 'u-yellow' : 'u-orange';
    const row = el('div', 'item rem-row ' + u);
    const ico = el('div', 'ico chq', '⏰');
    const main = el('div', 'main');
    main.appendChild(el('div', 't', x.r.title));
    const m = el('div', 'm');
    m.appendChild(el('span', null, dateLabel(x.r)));
    m.appendChild(el('span', 'pill ' + (x.d <= 1 ? 'late' : x.d <= 3 ? 'due' : 'ok'),
      x.d === 0 ? 'امروز' : fa(x.d) + ' روز مانده'));
    main.appendChild(m);
    row.append(ico, main);
    list.appendChild(row);
  }
}

function renderCal() {
  $('calTitle').textContent = MONTHS[calM - 1] + ' ' + fa(calY);

  const wk = $('calWeek');
  if (!wk.children.length) {
    for (const n of WEEK_NAMES) {
      const c = el('div', null, n);
      c.style.textAlign = 'center';
      c.style.whiteSpace = 'nowrap';
      wk.appendChild(c);
    }
  }

  const grid = $('calGrid');
  grid.textContent = '';

  const first = j2d(calY, calM, 1);
  const startIdx = weekIndex(first);
  const len = monthLen(calY, calM);
  const todayJ = todayJdn();

  // زیرنویس: ماه میلادی و قمری (ممکن است هر کدام دو ماه باشند)
  const g1 = d2g(first), g2 = d2g(first + len - 1);
  const gm1 = G_MONTHS[g1.gm - 1] + ' ' + g1.gy;
  const gm2 = G_MONTHS[g2.gm - 1] + ' ' + g2.gy;
  const hm1 = hijriMonthLabel(first);
  const hm2 = hijriMonthLabel(first + len - 1);
  const gTxt = gm1 === gm2 ? gm1 : gm1 + ' – ' + gm2;
  const hTxt = hm1 === hm2 ? hm1 : hm1 + ' – ' + hm2;
  $('calSub').textContent = gTxt + '   ·   ' + hTxt;

  for (let i = 0; i < startIdx; i++) grid.appendChild(el('div', 'cal-cell empty'));

  for (let d = 1; d <= len; d++) {
    const jdn = first + d - 1;
    const jj = d2j(jdn);
    const gg = d2g(jdn);

    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cal-cell';

    const isFri = weekIndex(jdn) === 6;
    const isHol = isFri || allOcc(jdn).some(o => o.h);
    if (isHol) b.classList.add('hol');
    if (jdn === todayJ) b.classList.add('today');
    if (jdn === calSel) b.classList.add('sel');

    b.appendChild(el('span', 'cd', fa(d)));

    const num = el('span', 'cnum');
    num.appendChild(el('span', 'cg', String(gg.gd)));
    const hd = hijriDayNum(jdn);
    if (hd === '۱') b.classList.add('hnew');
    if (remForDay(jdn).length) b.classList.add('hasrem');
    num.appendChild(el('span', 'ch', hd));
    b.appendChild(num);

    // برچسب تغییر ماه میلادی/قمری
    const tags = [];
    const nextG = d2g(jdn + 1);
    const nextH = hijriDayNum(jdn + 1);
    const isGEnd = nextG.gm !== gg.gm;
    if (gg.gd === 1) tags.push({ k: 'g', t: G_ABBR[gg.gm - 1] });
    else if (isGEnd) tags.push({ k: 'g', t: G_ABBR[gg.gm - 1] });

    const hmName = hijriMonthLabel(jdn).split(' ')[0] || '';
    if (hd === '۱') tags.push({ k: 'h', t: hmName });
    else if (nextH === '۱') tags.push({ k: 'h', t: hmName });

    if (tags.length) {
      const tag = el('span', 'ctag');
      for (const x of tags) tag.appendChild(el('span', x.k === 'g' ? 'tg' : 'th', x.t));
      b.appendChild(tag);
    }

    b.addEventListener('click', () => {
      calSel = jdn;
      renderCal();
      renderDateInfo();
    });

    // نگه‌داشتن انگشت روی روز = ثبت یادآوری سریع
    let lp = null;
    const cancelLp = () => { if (lp) { clearTimeout(lp); lp = null; } };
    b.addEventListener('pointerdown', () => {
      cancelLp();
      lp = setTimeout(() => {
        lp = null;
        calSel = jdn;
        renderCal();
        renderDateInfo();
        openRem(null);
      }, 550);
    });
    b.addEventListener('pointerup', cancelLp);
    b.addEventListener('pointerleave', cancelLp);
    b.addEventListener('pointercancel', cancelLp);

    grid.appendChild(b);
  }

  renderDayRem();
  renderUpcomingRems();
}

function renderDateInfo() {
  const j = d2j(calSel);
  const box = $('dateInfo');
  box.textContent = '';

  const list = allOcc(calSel);
  box.classList.toggle('hidden', list.length === 0);

  for (const o of list) {
    const wrap = el('div');
    wrap.appendChild(el('div', null, o.t));
    const d = el('div', 'hint');
    d.style.marginTop = '3px';
    d.textContent = o.d;
    wrap.appendChild(d);
    box.appendChild(wrap);
  }
}

$('calPrev').addEventListener('click', () => {
  const n = addMonths(calY, calM, 1, -1);
  calY = n.jy; calM = n.jm;
  renderCal();
});

$('calNext').addEventListener('click', () => {
  const n = addMonths(calY, calM, 1, 1);
  calY = n.jy; calM = n.jm;
  renderCal();
});

$('datePick').addEventListener('click', () => {
  VIEW_DATE = calSel;
  $('dateDlg').close();
  render();
  const j = d2j(calSel);
  toast('تاریخ نمایش: ' + fa(j.jd) + ' ' + MONTHS[j.jm - 1]);
});

$('dateToday').addEventListener('click', () => {
  VIEW_DATE = null;
  const j = d2j(todayJdn());
  calY = j.jy; calM = j.jm; calSel = todayJdn();
  renderCal();
  renderDateInfo();
  $('dateDlg').close();
  render();
  toast('به تاریخ امروز برگشت');
});

$('dateClose').addEventListener('click', () => $('dateDlg').close());

/* ---------- فال حافظ ---------- */
const FAL = [
  ['الا یا ایها الساقی ادر کأساً و ناولها', 'که عشق آسان نمود اول ولی افتاد مشکل‌ها',
    'کار تازه‌ات آغاز آسانی دارد، اما برای رسیدن باید سختی‌ها را به جان بخری.'],
  ['دلا بسوز که سوز تو کارها بکند', 'نیاز نیم‌شبی دفع صد بلا بکند',
    'دل‌سوزی و اخلاص تو اثر می‌کند؛ از دعای خالصانه غافل نشو.'],
  ['هر آن که جانب اهل خدا نگه دارد', 'خداش در همه حال از بلا نگه دارد',
    'حق‌شناسی و همراهی با نیکان، تو را از آسیب‌ها دور می‌کند.'],
  ['رسید مژده که ایام غم نخواهد ماند', 'چنان نماند چنین نیز هم نخواهد ماند',
    'سختی دیر نمی‌ماند؛ به پایان این دوره امیدوار باش.'],
  ['صلاح کار کجا و من خراب کجا', 'ببین تفاوت ره کز کجاست تا به کجا',
    'مسیرت را بازبینی کن؛ فاصلهٔ تصمیم‌های امروز با هدف اصلی‌ات زیاد شده است.'],
  ['یوسف گم‌گشته بازآید به کنعان غم مخور', 'کلبهٔ احزان شود روزی گلستان غم مخور',
    'چیزی که از دست داده‌ای برمی‌گردد؛ اندوه را طولانی نکن.'],
  ['دوش وقت سحر از غصه نجاتم دادند', 'واندر آن ظلمت شب آب حیاتم دادند',
    'گشایش نزدیک است؛ در سخت‌ترین لحظه‌ها هم راهی باز می‌شود.'],
  ['به ملازمان سلطان که رساند این دعا را', 'که به شکر پادشاهی ز نظر مران گدا را',
    'وفاداری‌ات دیده می‌شود؛ از بزرگان و اهل کرم ناامید نشو.'],
  ['گر چه راهیست پر از بیم ز ما تا بر دوست', 'رفتن آسان بود ار واقف منزل باشی',
    'راهت روشن است اگر مقصد را بدانی؛ تردید، سخت‌تر از خودِ راه است.'],
  ['ما در پیاله عکس رخ یار دیده‌ایم', 'ای بی‌خبر ز لذت شرب مدام ما',
    'لذت واقعی در چیزهای ساده است؛ نگاهت را به داشته‌هایت بدوز.']
];

function openFal() {
  showFal();
  $('falDlg').showModal();
}

function showFal() {
  const f = FAL[Math.floor(Math.random() * FAL.length)];
  const box = $('falText');
  box.textContent = '';
  box.appendChild(el('div', 'beyt', f[0]));
  box.appendChild(el('div', 'beyt', f[1]));
  box.appendChild(el('div', 'mean', f[2]));
}

$('falAgain').addEventListener('click', showFal);
$('falClose').addEventListener('click', () => $('falDlg').close());

/* ---------- اندازهٔ فونت ---------- */
function applyFontScale() {
  const v = clamp(parseInt(S.d.settings.fontScale, 10) || 5, 1, 10);
  const zoom = 0.86 + (v - 1) * (0.42 / 9);
  document.documentElement.style.zoom = zoom.toFixed(3);
}

/* ---------- ۸) رندر ---------- */
const view = $('view');

function render() {
  renderRings();
  if (S.tab === 'home') renderHome();
  else if (S.tab === 'tx') renderTx();
  else if (S.tab === 'obl') renderObl();
  else if (S.tab === 'notes') renderNotes();
  else renderReport();

  for (const b of $('nav').children) b.classList.toggle('on', b.dataset.tab === S.tab);
  updateFloatNav();
  scheduleNotifications();
}

function updateFloatNav() {
  const home = $('fnHome');
  if (!home) return;
  home.style.opacity = (S.tab === 'home' && !S.detailLoan) ? '.45' : '1';
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
  $('ringOverlay').classList.remove('hidden');
  $('ringDlg').show();
}

function closeRing() {
  if ($('ringDlg').open) $('ringDlg').close();
  $('ringOverlay').classList.add('hidden');
}

$('ringOverlay').addEventListener('click', closeRing);
$('ringClose').addEventListener('click', closeRing);

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
    closeRing();
    markSeen(x);
    if (x.kind === 'loan') { S.tab = 'obl'; S.oblTab = 'loans'; S.detailLoan = x.loan.id; render(); }
    else if (x.kind === 'cheque') { S.tab = 'obl'; S.oblTab = 'cheques'; render(); openCheque(x.cheque); }
    else { S.tab = 'obl'; S.oblTab = 'accounts'; render(); openAccount(x.account); }
  });
  return row;
}

function renderHome() {
  view.textContent = '';

  view.appendChild(buildDateCard());

  view.appendChild(buildRings());

  const t = effToday();

  // نوار امروز
  const dueToday = dueItems().filter(x => x.days === 0);
  const txToday = S.d.tx.filter(x => jdnOf(x) === t);
  const line = el('div', 'todayline');
  const parts = [];
  if (dueToday.length) parts.push(fa(dueToday.length) + ' تعهد امروز');
  if (txToday.length) parts.push(fa(txToday.length) + ' تراکنش امروز');
  line.textContent = parts.length ? 'امروز: ' + parts.join(' · ') : 'امروز: کاری ثبت نشده';
  line.style.cursor = 'pointer';
  line.addEventListener('click', () => openToday(false));
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
  c1.style.cursor = 'pointer';
  c1.append(el('div', 'k', 'طلب من'), el('div', 'v green', money(receivable)));
  c1.addEventListener('click', () => openSide('r', false));

  const c2 = el('div', 'card pad');
  c2.style.cursor = 'pointer';
  c2.append(el('div', 'k', 'بدهی من'), el('div', 'v red', money(payable)));
  c2.addEventListener('click', () => openSide('p', false));

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

  const nav = el('div', 'mhead rep-head');

  const monthSel = document.createElement('select');
  MONTHS.forEach((mn, i) => monthSel.add(new Option(mn, String(i + 1))));
  monthSel.value = String(ym % 100);

  const yearsSet = new Set(S.d.tx.map(x => x.jy));
  yearsSet.add(now.jy);
  const yearOpts = Array.from(yearsSet).sort((a, b) => b - a);
  const yearSel = document.createElement('select');
  yearOpts.forEach(y => yearSel.add(new Option(fa(y), String(y))));
  yearSel.value = String(Math.floor(ym / 100));

  const go = () => { S.reportYm = (+yearSel.value) * 100 + (+monthSel.value); render(); };
  monthSel.addEventListener('change', go);
  yearSel.addEventListener('change', go);

  const prev = el('button', 'btn ghost', '‹');
  prev.style.padding = '2px 10px';
  prev.addEventListener('click', () => { S.reportYm = shiftYm(ym, -1); render(); });
  const next = el('button', 'btn ghost', '›');
  next.style.padding = '2px 10px';
  next.addEventListener('click', () => { S.reportYm = shiftYm(ym, 1); render(); });

  nav.append(prev, yearSel, monthSel, next);
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

  /* ---------- مقایسه ---------- */
  S.cmp = S.cmp || 'none';
  const cmpSeg = el('div', 'seg');
  const cmpOpts = [['none', 'بدون مقایسه'], ['prev', 'ماه قبل'], ['year', 'سال قبل']];
  for (const [k, lbl2] of cmpOpts) {
    const b = el('button', S.cmp === k ? 'on' : '', lbl2);
    b.type = 'button';
    b.addEventListener('click', () => { S.cmp = k; render(); });
    cmpSeg.appendChild(b);
  }
  view.appendChild(cmpSeg);

  if (S.cmp !== 'none') {
    const cym = S.cmp === 'prev' ? shiftYm(ym, -1) : shiftYm(ym, -12);
    let inc2 = 0, exp2 = 0;
    for (const x of S.d.tx) {
      if (monthKey(x) !== cym) continue;
      if (x.type === 'income') inc2 += x.amount; else exp2 += x.amount;
    }

    const cmpLabel = MONTHS[cym % 100 - 1] + ' ' + fa(Math.floor(cym / 100));
    const maxV = Math.max(inc, exp, inc2, exp2, 1);

    const cmpCard = el('div', 'card pad');
    const cmpH = el('div', 'mhead');
    cmpH.style.margin = '0 0 8px';
    cmpH.appendChild(el('span', null, 'این ماه در برابر ' + cmpLabel));
    cmpCard.appendChild(cmpH);

    const rows = [
      ['درآمد این ماه', inc, 'in'],
      ['درآمد ' + cmpLabel, inc2, 'in2'],
      ['هزینهٔ این ماه', exp, 'out'],
      ['هزینهٔ ' + cmpLabel, exp2, 'out2']
    ];

    for (const [lbl3, v, cls] of rows) {
      const line = el('div', 'cmpbar');
      line.appendChild(el('span', 'cmpl', lbl3));
      const track = el('div', 'cmp-track');
      const fill = el('i', 'cmp-fill ' + cls);
      fill.style.width = Math.max(2, Math.round(v / maxV * 100)) + '%';
      track.appendChild(fill);
      line.appendChild(track);
      line.appendChild(el('span', 'cmpv', NUM.format(v)));
      cmpCard.appendChild(line);
    }

    const dInc = inc2 ? Math.round((inc - inc2) / inc2 * 100) : 0;
    const dExp = exp2 ? Math.round((exp - exp2) / exp2 * 100) : 0;
    const sum = el('div', 'hint');
    sum.style.marginTop = '8px';
    sum.textContent = 'تغییر درآمد: ' + fa(Math.abs(dInc)) + '٪ ' + (dInc >= 0 ? 'بیشتر' : 'کمتر') +
      ' · تغییر هزینه: ' + fa(Math.abs(dExp)) + '٪ ' + (dExp >= 0 ? 'بیشتر' : 'کمتر');
    cmpCard.appendChild(sum);

    view.appendChild(cmpCard);
  }

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

  const lg = el('div', 'legend');
  const li = el('span', 'lg-in', 'درآمد');
  const lo = el('span', 'lg-out', 'هزینه');
  lg.append(li, lo);
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

$('chqKindSeg').addEventListener('click', ev => {
  const b = ev.target.closest('button[data-kind]');
  if (!b) return;
  setSeg($('chqKindSeg'), b.dataset.kind);
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
  $('lPaidWrap').classList.toggle('hidden', !!loan);
  $('lPaid').value = '0';
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
  const paidCount = S.editLoan ? 0 : clamp(parseInt($('lPaid').value, 10) || 0, 0, count - 1);
  for (let i = 0; i < count; i++) {
    const d = addMonths(start.jy, start.jm, start.jd, i);
    installments.push({
      id: uid(), amount: amount, jy: d.jy, jm: d.jm, jd: d.jd,
      paid: i < paidCount, custom: false
    });
  }
  S.d.loans.push(normalizeLoan({ id: uid(), title: title, note: note, defaultAmount: amount, installments: installments }));
  save(); $('loanDlg').close(); S.oblTab = 'loans'; render();
  toast(paidCount
    ? 'وام ثبت شد؛ ' + fa(paidCount) + ' قسط پرداخت‌شده و ' + fa(count - paidCount) + ' قسط باقی‌مانده'
    : fa(count) + ' قسط ساخته شد');
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
  if (typeof closeRing === 'function') closeRing();
  S.tab = b.dataset.tab;
  S.detailLoan = null;
  render();
});

$('fnHome').addEventListener('click', () => {
  closeRing();
  if (!$('editor').classList.contains('hide')) closeEditor();
  S.detailLoan = null;
  S.tab = 'home';
  render();
});

$('fnBack').addEventListener('click', () => {
  if (window.onAndroidBack) window.onAndroidBack();
});

/* ---------- درباره ---------- */
function openAbout() {
  const wrap = $('demoWrap');
  if (wrap) wrap.classList.toggle('hidden', !S.d.settings.demo);
  $('aboutDlg').showModal();
}

$('demoReset').addEventListener('click', () => {
  if (!confirm('همهٔ داده‌های آزمایشی پاک شود؟ این کار قابل بازگشت نیست.')) return;
  S.d.loans = [];
  S.d.cheques = [];
  S.d.accounts = [];
  S.d.tx = [];
  S.d.notes = [];
  S.d.settings.demo = false;
  save();
  render();
  $('aboutDlg').close();
  toast('داده‌های تست پاک شد — آمادهٔ استفاده');
});
$('aboutBtn').addEventListener('click', openAbout);
$('titleWrap').addEventListener('click', openAbout);
$('aboutClose').addEventListener('click', () => $('aboutDlg').close());

$('fab').addEventListener('click', () => {
  if (S.tab === 'notes') newNote();
  else if (S.tab === 'tx') openTx(null);
  else if (S.tab === 'obl') {
    if (S.oblTab === 'cheques') openCheque(null);
    else if (S.oblTab === 'loans') openLoan(null);
    else openAccount(null);
  } else if (S.tab === 'report') openTx(null);
  else openTx(null);
});

$('settingsBtn').addEventListener('click', openSettings);

const ICON_LOCKED = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="9.5" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></svg>';
const ICON_OPEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="9.5" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 6.3-2.1"/></svg>';

function renderLockIcon() {
  const on = S.d.settings.requirePin !== false;
  $('lockBtn').innerHTML = on ? ICON_LOCKED : ICON_OPEN;
  $('lockBtn').setAttribute('aria-pressed', on ? 'true' : 'false');
}

$('lockBtn').addEventListener('click', () => {
  const on = S.d.settings.requirePin !== false;
  S.d.settings.requirePin = !on;
  save();
  renderLockIcon();
  toast(on ? 'قفل باز شد — دفعهٔ بعد رمز نمی‌پرسد' : 'قفل شد — دفعهٔ بعد رمز لازم است');});

$('exitYes').addEventListener('click', () => {
  $('exitDlg').close();
  try {
    if (window.AndroidAqsat && window.AndroidAqsat.exitApp) {
      window.AndroidAqsat.exitApp();
      return;
    }
  } catch (e) { /* */ }
  toast('برای خروج، دکمهٔ بازگشت گوشی را بزن');
});
$('exitNo').addEventListener('click', () => $('exitDlg').close());

window.onAndroidBack = function () {
  if (!$('editor').classList.contains('hide')) { closeEditor(); return; }
  const openDlg = document.querySelector('dialog[open]');
  if (openDlg) { openDlg.close(); return; }
  if (S.detailLoan) { S.detailLoan = null; render(); return; }
  if (S.tab !== 'home') { S.tab = 'home'; render(); return; }
  $('exitDlg').showModal();
};

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

  const bio = biometricAvailable();
  $('bioRow').classList.toggle('hidden', !bio);
  $('bioChk').checked = st.biometric !== false;
  $('chqDays').value = String(st.chqDays);
  $('genDays').value = String(st.genDays);
  setThemeSeg(st.theme || 'system');
  $('fsRange').value = String(st.fontScale || 5);
  $('fsVal').textContent = fa(st.fontScale || 5);
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

$('fsRange').addEventListener('input', () => {
  const v = clamp(parseInt($('fsRange').value, 10) || 5, 1, 10);
  S.d.settings.fontScale = v;
  $('fsVal').textContent = fa(v);
  applyFontScale();
  save();
});

$('soundChk').addEventListener('change', () => {
  S.d.settings.sound = $('soundChk').checked;  save(); scheduleNotifications();
});

$('bioChk').addEventListener('change', () => {
  S.d.settings.biometric = $('bioChk').checked;
  save();
  toast($('bioChk').checked ? 'ورود با اثر انگشت روشن شد' : 'ورود با اثر انگشت خاموش شد');
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
    data: { loans: S.d.loans, cheques: S.d.cheques, accounts: S.d.accounts, tx: S.d.tx, notes: S.d.notes, reminders: S.d.reminders },
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
    tx: d.tx || [],
    notes: d.notes || [],
    reminders: d.reminders || []
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
  S.d.notes = data.notes || [];
  S.d.reminders = data.reminders || [];
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

/* ---------- ۱۳.۵) یادداشت‌های دست‌نویس ---------- */
const PAGE_SIZES = {
  a4p: { w: 595, h: 842, label: 'A4 عمودی' },
  a5p: { w: 420, h: 595, label: 'A5 عمودی' },
  a4l: { w: 842, h: 595, label: 'A4 افقی' },
  a5l: { w: 595, h: 420, label: 'A5 افقی' }
};

const ED = {
  note: null, pageIdx: 0, tool: 'pen', color: '#111827', width: 4,
  drawing: false, cur: null, scale: 1, zoom: 1, panning: null,
  fill: false, redo: [], shapeStart: null
};

function renderNotes() {
  view.textContent = '';

  const list = S.d.notes.slice().sort((a, b) => (b.updated || 0) - (a.updated || 0));

  if (!list.length) {
    const e = el('div', 'empty');
    e.innerHTML = '<b>یادداشتی نیست</b>با دکمهٔ + یک صفحهٔ دست‌نویس بساز (مناسب جلسه و قلم).';
    view.appendChild(e);
    return;
  }

  for (const n of list) {
    const card = el('div', 'note');

    if (n.thumb) {
      const img = document.createElement('img');
      img.className = 'thumb';
      img.src = n.thumb;
      card.appendChild(img);
    }

    const info = el('div', 'info');
    const left = el('div');
    const t = el('div', 't', n.title || 'بدون عنوان');
    const d = el('div', 'd');
    const when = n.reminder ? 'یادآور: ' + dateLabel(n.reminder) : 'بدون یادآور';
    d.textContent = fa(n.pages.length) + ' صفحه · ' + when;
    left.append(t, d);

    const del = el('button', 'btn danger', 'حذف');
    del.style.padding = '5px 10px';
    del.style.fontSize = '11px';
    del.addEventListener('click', ev => {
      ev.stopPropagation();
      if (!confirm('یادداشت «' + (n.title || 'بدون عنوان') + '» حذف شود؟')) return;
      const idx = S.d.notes.indexOf(n);
      S.d.notes.splice(idx, 1);
      save(); render();
      toast('حذف شد', () => { S.d.notes.splice(idx, 0, n); save(); render(); });
    });

    info.append(left, del);
    card.appendChild(info);
    card.addEventListener('click', () => openEditor(n));
    view.appendChild(card);
  }
}

function newNote() { $('pageDlg').showModal(); }

$('pageCancel').addEventListener('click', () => $('pageDlg').close());
$('pageDlg').addEventListener('click', ev => {
  const b = ev.target.closest('button[data-page]');
  if (!b) return;
  const size = PAGE_SIZES[b.dataset.page];
  const note = {
    id: uid(), title: '', created: Date.now(), updated: Date.now(),
    page: { w: size.w, h: size.h },
    pages: [{ strokes: [] }],
    thumb: '', reminder: null
  };
  S.d.notes.push(note);
  save();
  $('pageDlg').close();
  openEditor(note);
});

/* ---------- ویرایشگر ---------- */
const canvas = $('edCanvas');
const ctx = canvas.getContext('2d');

function currentStrokes() {
  return ED.note.pages[ED.pageIdx].strokes;
}

function drawStroke(g, s, scale) {
  if (!s.pts.length) return;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.strokeStyle = s.c;

  if (s.pts.length === 1) {
    const p = s.pts[0];
    g.beginPath();
    g.arc(p.x * scale, p.y * scale, Math.max(0.6, (p.w || s.w) * scale / 2), 0, Math.PI * 2);
    g.fillStyle = s.c;
    g.fill();
    return;
  }

  for (let i = 1; i < s.pts.length; i++) {
    const a = s.pts[i - 1], b = s.pts[i];
    g.beginPath();
    g.lineWidth = Math.max(0.5, ((a.w || s.w) + (b.w || s.w)) / 2 * scale);
    g.moveTo(a.x * scale, a.y * scale);
    g.lineTo(b.x * scale, b.y * scale);
    g.stroke();
  }
}

function drawItem(g, s, scale) {
  if (!s.shape) { drawStroke(g, s, scale); return; }

  const a = { x: s.a.x * scale, y: s.a.y * scale };
  const b = { x: s.b.x * scale, y: s.b.y * scale };
  g.lineWidth = Math.max(1, s.w * scale);
  g.strokeStyle = s.c;
  g.fillStyle = s.c;
  g.lineCap = 'round';
  g.lineJoin = 'round';

  if (s.shape === 'line') {
    g.beginPath();
    g.moveTo(a.x, a.y);
    g.lineTo(b.x, b.y);
    g.stroke();
  } else if (s.shape === 'rect') {
    const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
    const w = Math.abs(b.x - a.x), h = Math.abs(b.y - a.y);
    if (s.fill) g.fillRect(x, y, w, h); else g.strokeRect(x, y, w, h);
  } else if (s.shape === 'ellipse') {
    const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
    const rx = Math.abs(b.x - a.x) / 2, ry = Math.abs(b.y - a.y) / 2;
    g.beginPath();
    g.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
    if (s.fill) g.fill(); else g.stroke();
  }
}

function edRender() {
  const page = ED.note.page;
  const wrapW = ($('edWrap').clientWidth || 360) - 20;
  const base = Math.max(220, Math.min(wrapW, 560));
  const cssW = Math.min(base * (ED.zoom || 1), 1600);
  const cssH = cssW * page.h / page.w;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';

  ED.scale = canvas.width / page.w;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const s of currentStrokes()) drawItem(ctx, s, ED.scale);
}

function updatePageLbl() {
  $('edPageLbl').textContent = fa(ED.pageIdx + 1) + ' از ' + fa(ED.note.pages.length);
}

function openEditor(note) {
  ED.note = note;
  ED.pageIdx = 0;
  $('edTitle').value = note.title || '';
  $('editor').classList.remove('hide');
  updatePageLbl();
  setTimeout(edRender, 30);
}

function closeEditor(silent) {
  if (ED.note) {
    ED.note.title = $('edTitle').value.trim();
    ED.note.updated = Date.now();
    ED.note.thumb = makeThumb(ED.note);
    save();
  }
  $('editor').classList.add('hide');
  if (!silent) render();
}

function makeThumb(note) {
  try {
    const p = note.page;
    const tw = 260;
    const th = Math.round(tw * p.h / p.w);
    const c = document.createElement('canvas');
    c.width = tw; c.height = th;
    const g = c.getContext('2d');
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, tw, th);
    const sc = tw / p.w;
    for (const s of note.pages[0].strokes) drawItem(g, s, sc);
    return c.toDataURL('image/jpeg', 0.55);
  } catch (e) { return ''; }
}

function evPoint(ev) {
  const r = canvas.getBoundingClientRect();
  const x = (ev.clientX - r.left) / r.width * ED.note.page.w;
  const y = (ev.clientY - r.top) / r.height * ED.note.page.h;
  const pr = (ev.pointerType === 'pen' && ev.pressure > 0) ? ev.pressure : 0.5;
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, w: Math.round(ED.width * (0.55 + pr) * 10) / 10 };
}

canvas.addEventListener('pointerdown', ev => {
  if (!ED.note) return;
  ev.preventDefault();
  ev.stopPropagation();

  // ابزار جابه‌جایی: صفحه را با انگشت حرکت بده
  if (ED.tool === 'pan') {
    const wrap = $('edWrap');
    ED.panning = { x: ev.clientX, y: ev.clientY, sl: wrap.scrollLeft, st: wrap.scrollTop };
    return;
  }

  try { canvas.setPointerCapture(ev.pointerId); } catch (e) { /* */ }

  // ابزارهای شکل: خط، مستطیل، دایره
  if (ED.tool === 'line' || ED.tool === 'rect' || ED.tool === 'ellipse') {
    ED.shapeStart = evPoint(ev);
    ED.drawing = true;
    return;
  }

  ED.drawing = true;
  ED.cur = {
    c: ED.tool === 'eraser' ? '#ffffff' : ED.color,
    w: ED.tool === 'eraser' ? ED.width * 2.4 : ED.width,
    pts: []
  };
  if (ED.tool === 'eraser') ED.cur.w = Math.max(ED.cur.w, 14);
  const p = evPoint(ev);
  ED.cur.pts.push(p);
  drawStroke(ctx, { c: ED.cur.c, w: ED.cur.w, pts: [p] }, ED.scale);
});

canvas.addEventListener('pointermove', ev => {
  if (ED.panning) {
    const wrap = $('edWrap');
    const dx = ev.clientX - ED.panning.x;
    const dy = ev.clientY - ED.panning.y;
    const rtl = getComputedStyle(wrap).direction === 'rtl';
    wrap.scrollLeft = rtl ? ED.panning.sl + dx : ED.panning.sl - dx;
    wrap.scrollTop = ED.panning.st - dy;
    return;
  }
  if (!ED.drawing || !ED.cur) {
    if (ED.drawing && ED.shapeStart) {
      ev.preventDefault();
      const p = evPoint(ev);
      edRender();
      drawItem(ctx, {
        shape: ED.tool, a: ED.shapeStart, b: p,
        c: ED.color, w: ED.width, fill: ED.fill
      }, ED.scale);
      ED.shapeEnd = p;
    }
    return;
  }
  ev.preventDefault();
  const p = evPoint(ev);
  const prev = ED.cur.pts[ED.cur.pts.length - 1];
  ED.cur.pts.push(p);
  drawStroke(ctx, { c: ED.cur.c, w: ED.cur.w, pts: [prev, p] }, ED.scale);
});

function setTool(name) {
  ED.tool = name;
  for (const b of document.querySelectorAll('.ed-tools [data-tool]')) {
    b.classList.toggle('on', b.dataset.tool === name);
  }
}

function endStroke() {
  const wasPan = !!ED.panning;
  ED.panning = null;
  if (wasPan) return;
  if (!ED.drawing) return;
  ED.drawing = false;

  if (ED.shapeStart && ED.shapeEnd) {
    const a = ED.shapeStart, b = ED.shapeEnd;
    if (Math.abs(a.x - b.x) > 3 || Math.abs(a.y - b.y) > 3) {
      currentStrokes().push({
        shape: ED.tool, a: a, b: b, c: ED.color, w: ED.width, fill: ED.fill
      });
      ED.redo = [];
    }
    ED.shapeStart = null;
    ED.shapeEnd = null;
    edRender();
    return;
  }

  if (ED.cur && ED.cur.pts.length) {
    currentStrokes().push(ED.cur);
    ED.redo = [];
  }
  ED.cur = null;
}
canvas.addEventListener('pointerup', endStroke);
canvas.addEventListener('pointerleave', endStroke);
canvas.addEventListener('pointercancel', endStroke);

$('edTools')?.addEventListener('click', () => {});

$('editor').addEventListener('click', ev => {
  const tool = ev.target.closest('button[data-tool]');
  if (tool) {
    setTool(tool.dataset.tool);
    return;
  }
  const sw = ev.target.closest('button.sw');
  if (sw) {
    ED.color = sw.dataset.color;
    for (const b of document.querySelectorAll('.ed-tools .sw')) b.classList.toggle('on', b === sw);
    setTool('pen');
    return;
  }
  const w = ev.target.closest('button[data-width]');
  if (w) {
    ED.width = parseInt(w.dataset.width, 10);
    for (const b of document.querySelectorAll('.ed-tools [data-width]')) b.classList.toggle('on', b === w);
  }
});

$('edZoomIn').addEventListener('click', () => {
  if (!ED.note) return;
  ED.zoom = Math.min(3, (ED.zoom || 1) + 0.5);
  edRender();
  toast('بزرگ‌نمایی ' + fa(Math.round(ED.zoom * 100)) + '٪');
});

$('edZoomOut').addEventListener('click', () => {
  if (!ED.note) return;
  ED.zoom = Math.max(1, (ED.zoom || 1) - 0.5);
  edRender();
  toast(ED.zoom === 1 ? 'اندازهٔ عادی' : 'بزرگ‌نمایی ' + fa(Math.round(ED.zoom * 100)) + '٪');
});

$('edUndo').addEventListener('click', () => {
  if (!ED.note) return;
  const s = currentStrokes().pop();
  if (s) { ED.redo.push(s); edRender(); }
});

$('edRedo').addEventListener('click', () => {
  if (!ED.note) return;
  const s = ED.redo.pop();
  if (s) { currentStrokes().push(s); edRender(); }
});

$('edCustomColor').addEventListener('input', ev => {
  ED.color = ev.target.value;
  for (const b of document.querySelectorAll('.ed-tools .sw')) b.classList.remove('on');
  $('edColorBtn').classList.add('on');
  setTool('pen');
});

$('edFill').addEventListener('click', () => {
  ED.fill = !ED.fill;
  $('edFill').classList.toggle('on', ED.fill);
  toast(ED.fill ? 'پرکردن روشن' : 'پرکردن خاموش');
});

$('edPrev').addEventListener('click', () => {
  if (!ED.note || ED.pageIdx === 0) return;
  ED.pageIdx -= 1;
  updatePageLbl();
  edRender();
});

$('edNext').addEventListener('click', () => {
  if (!ED.note || ED.pageIdx >= ED.note.pages.length - 1) return;
  ED.pageIdx += 1;
  updatePageLbl();
  edRender();
});

$('edAddPage').addEventListener('click', () => {
  if (!ED.note) return;
  ED.note.pages.push({ strokes: [] });
  ED.pageIdx = ED.note.pages.length - 1;
  updatePageLbl();
  edRender();
  toast('صفحه اضافه شد');
});

$('edSave').addEventListener('click', () => {
  closeEditor();
  toast('یادداشت ذخیره شد');
});

$('edClose').addEventListener('click', () => closeEditor());

$('edRemind').addEventListener('click', () => {
  if (!ED.note) return;
  setDP($('dpNoteRemind'), ED.note.reminder || todayJalali());
  $('noteRemindDlg').showModal();
});

$('remindSet').addEventListener('click', () => {
  if (!ED.note) return;
  ED.note.reminder = getDP($('dpNoteRemind'));
  save();
  $('noteRemindDlg').close();
  toast('یادآور ثبت شد');
  scheduleNotifications();
});

$('remindClear').addEventListener('click', () => {
  if (!ED.note) return;
  ED.note.reminder = null;
  save();
  $('noteRemindDlg').close();
  toast('یادآور حذف شد');
  scheduleNotifications();
});

/* ---------- ۱۴) اعلان‌ها ---------- */
function noteReminders() {
  const out = [];
  for (const n of S.d.notes || []) {
    if (!n.reminder) continue;
    out.push({
      id: 'note-' + n.id,
      title: 'یادآوری یادداشت',
      body: n.title || 'یادداشت',
      at: reminderTime(n.reminder, 0)
    });
  }
  return out;
}

function reminderTime(date, daysBefore) {
  const jdn = jdnOf(date) - daysBefore;
  const g = d2g(jdn);
  return new Date(g.gy, g.gm - 1, g.gd, 9, 0, 0).getTime();
}

/* زمان دقیق یک نوبت اعلان در ساعت مشخص */
function slotTime(date, daysBefore, hour) {
  const jdn = jdnOf(date) - daysBefore;
  const g = d2g(jdn);
  return new Date(g.gy, g.gm - 1, g.gd, hour, 0, 0).getTime();
}

/* نوبت‌های اعلان: دو روز قبل ۱۱ و ۱۸، روز قبل ۹ و ۱۱ و ۱۵ و ۱۸، روز موعد ۹ */
const NOTIF_SLOTS = [
  { d: 2, h: 11 }, { d: 2, h: 18 },
  { d: 1, h: 9 }, { d: 1, h: 11 }, { d: 1, h: 15 }, { d: 1, h: 18 },
  { d: 0, h: 9 }
];

function baseIdOf(x) {
  return x.kind + '-' + (x.loan || x.cheque || x.account).id;
}

function nameOf(x) {
  return x.kind === 'loan' ? x.loan.title : x.kind === 'cheque' ? x.cheque.party : x.account.name;
}

function upcomingReminders() {
  const out = [];
  const seen = S.d.settings.notifSeen || {};

  for (const x of dueItems()) {
    if (x.days < 0) continue;
    if (x.days > 14) continue;

    const base = baseIdOf(x);
    const name = nameOf(x);
    const when = dateLabel(x.date);

    for (const s of NOTIF_SLOTS) {
      const id = base + '-d' + s.d + '-h' + s.h;
      if (seen[id]) continue;

      const at = slotTime(x.date, s.d, s.h);
      if (at <= Date.now()) continue;

      const prefix = s.d === 0 ? 'سررسید امروز' : s.d === 1 ? 'فردا سررسید' : 'دو روز تا سررسید';
      out.push({
        id: id,
        title: prefix + ' — ' + x.label,
        body: name + ' · ' + money(x.amount) + ' · ' + when,
        at: at
      });
    }
  }
  return out;
}

function scheduleNotifications() {
  if (notifTimer) clearTimeout(notifTimer);
  notifTimer = setTimeout(doScheduleNotifications, 900);
}

let notifTimer = null;
let notifSig = '';

function calReminders() {
  return (S.d.reminders || []).map(r => ({
    id: 'cal-' + r.id,
    title: 'یادآور تقویم',
    body: r.title + (r.note ? ' — ' + r.note : ''),
    sound: r.sound !== false,
    at: reminderTime(r, r.daysBefore || 0)
  }));
}

function doScheduleNotifications() {
  try {
    if (!window.AndroidAqsat || typeof window.AndroidAqsat.schedule !== 'function') return;

    const list = upcomingReminders().concat(noteReminders()).concat(calReminders());
    const sig = list.map(r => r.id + '@' + r.at).join('|') +
      '#' + (S.d.settings.sound !== false ? 1 : 0);
    if (sig === notifSig) return;
    notifSig = sig;

    setTimeout(() => {
      try {
        window.AndroidAqsat.schedule(JSON.stringify({
          sound: S.d.settings.sound !== false,
          items: list
        }));
      } catch (e) { /* */ }
    }, 0);
  } catch (e) { /* */ }
}

/* ---------- کشیدن انگشت (سوایپ) ---------- */
let swipeStart = null;

function shiftCalMonth(dir) {
  const n = addMonths(calY, calM, 1, dir);
  calY = n.jy;
  calM = n.jm;
  renderCal();
}

function spinRings(dir, node) {
  const el2 = node || $('rings');
  if (!el2) return;
  const cls = dir > 0 ? 'cyl-r' : 'cyl-l';
  el2.classList.remove('cyl-r', 'cyl-l');
  void el2.offsetWidth;
  el2.classList.add(cls);
  setTimeout(() => el2.classList.remove(cls), 700);
}

function handleSwipe(dir, target) {
  if ($('dateDlg').open) { shiftCalMonth(dir); return; }
  if ($('sideDlg').open || $('todayDlg').open) return;
  if (!$('editor').classList.contains('hide')) return;

  if (S.tab === 'report') {
    S.reportYm = shiftYm(S.reportYm || monthKey(todayJalali()), dir);
    render();
    return;
  }

  if (S.tab === 'home') {
    const rings = target.closest('.rings');
    if (rings) { spinRings(dir, rings); return; }

    const card = target.closest('.datecard');
    if (card) { spinRings(dir, card); return; }

    const grid = target.closest('.grid2');
    if (grid) {
      spinRings(dir, grid);
      setTimeout(() => openSide(dir > 0 ? 'p' : 'r', false), 260);
    }
  }
}

document.addEventListener('touchstart', ev => {
  if (ev.touches.length !== 1) { swipeStart = null; return; }
  const t = ev.touches[0];
  swipeStart = { x: t.clientX, y: t.clientY, target: ev.target };
}, { passive: true });

document.addEventListener('touchend', ev => {
  if (!swipeStart) return;
  const t = ev.changedTouches[0];
  const dx = t.clientX - swipeStart.x;
  const dy = t.clientY - swipeStart.y;
  const target = swipeStart.target;
  swipeStart = null;
  if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
  handleSwipe(dx > 0 ? 1 : -1, target);
}, { passive: true });

/* ---------- ۱۵) شروع ---------- */
function boot() {
  S.d = loadData();
  applyTheme();
  applyFontScale();
  buildPad();
  buildRings();
  renderLockIcon();

  // نسخه‌بندی: پرسش دربارهٔ دادهٔ قبلی فقط پس از به‌روزرسانی
  const anyData = ['loans', 'cheques', 'accounts', 'tx', 'notes', 'reminders']
    .some(k => (S.d[k] || []).length > 0);

  if (!S.d.settings.seenVersion) {
    S.d.settings.seenVersion = APP_VER;
    save();
  } else if (S.d.settings.seenVersion !== APP_VER && anyData) {
    pendingResetAsk = true;
  }

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
  } else if (S.d.settings.requirePin === false) {
    lockEl.classList.add('hide');
    $('app').classList.remove('hidden');
    render();
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
  mountDP($('dpNoteRemind'));

  // امروز/دیروز در فرم تراکنش
  document.querySelectorAll('[data-quick]').forEach(b => {
    b.addEventListener('click', () => {
      if (b.dataset.quick === 'today') setDP($('dpTx'), todayJalali());
      else setDP($('dpTx'), d2j(todayJdn() - 1));
    });
  });
}

boot();
