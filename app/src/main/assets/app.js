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
  chqFilter: 'in',
  chqSort: 'date',
  chqDir: -1,
  chqQuery: '',
  loanSort: 'date',
  loanDir: -1,
  loanSettled: false,
  accFilter: 'all',
  accSort: 'date',
  accDir: -1,
  accQuery: '',
  tab: 'home',
  oblTab: 'cheques',
  txKind: 'expense',
  txFilter: 'all',
  txSort: 'date',
  txDir: -1,
  txQuery: '',
  txRange: 'all',
  sel: { chq: 'all', tx: 'all', acc: 'all', loan: 'all' },
  loanQuery: '',
  chqRange: 'all',
  loanRange: 'all',
  accRange: 'all',
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
  const tJ = jdnOf(t);
  const plus = n => d2j(tJ + n);
  const at = m => addMonths(t.jy, t.jm, 1, m);

  d.settings.demo = true;

  /* ---------- وام‌ها ---------- */
  function mkLoan(id, title, note, amount, count, startMonth, paidCount) {
    const list = [];
    for (let i = 0; i < count; i++) {
      const dt = at(startMonth + i);
      list.push({
        id: id + '-i' + i, amount: amount,
        jy: dt.jy, jm: dt.jm, jd: Math.min(5 + (i % 20), monthLen(dt.jy, dt.jm)),
        paid: i < paidCount, custom: false
      });
    }
    d.loans.push(normalizeLoan({
      id: id, title: title, note: note, defaultAmount: amount, installments: list
    }));
  }

  mkLoan('demo-l1', 'وام مسکن', 'بانک ملی', 4500000, 24, -20, 20);
  mkLoan('demo-l2', 'قسط خودرو', 'بانک ملت', 3200000, 18, -9, 9);
  mkLoan('demo-l3', 'وام لوازم خانگی', 'بانک رفاه', 1800000, 12, 1, 0);
  mkLoan('demo-l4', 'وام تعمیر خانه', 'بانک مسکن', 2500000, 10, -3, 3);

  /* ---------- چک‌ها ---------- */
  const chq = (id, kind, amount, offset, party, number, bank, reason, status) => {
    const dt = plus(offset);
    d.cheques.push({
      id: id, kind: kind, amount: amount,
      jy: dt.jy, jm: dt.jm, jd: dt.jd,
      party: party, number: number, bank: bank, nid: '',
      reason: reason, status: status, depBank: '', confirmed: true,
      iban: '', raw: '', note: ''
    });
  };

  chq('demo-c1', 'in', 12000000, -300, 'آقای رضایی', '452189', 'ملت', 'فروش کالا', 'cleared');
  chq('demo-c2', 'out', 8000000, -260, 'شرکت پارس', '781233', 'صادرات', 'خرید مواد', 'cleared');
  chq('demo-c3', 'in', 9800000, -120, 'شرکت آریا', '993311', 'رفاه', 'تسویه فاکتور', 'cleared');
  chq('demo-c4', 'out', 7000000, -45, 'آقای کریمی', '990012', 'ملی', 'اجاره', 'cleared');
  chq('demo-c5', 'in', 15000000, 2, 'شرکت آریا', '221144', 'رفاه', 'فاکتور جدید', 'open');
  chq('demo-c6', 'out', 6000000, 1, 'آقای کریمی', '551122', 'ملی', 'اجاره', 'open');
  chq('demo-c7', 'out', 4500000, 9, 'مهندس صادقی', '552211', 'سامان', 'خرید تجهیزات', 'open');
  chq('demo-c8', 'in', 22000000, 15, 'آقای موسوی', '110233', 'پاسارگاد', 'فروش خودرو', 'open');
  chq('demo-c9', 'out', 3500000, 24, 'شرکت پارس', '778899', 'صادرات', 'حمل بار', 'open');

  /* ---------- طلب و بدهی ---------- */
  const acc = (id, name, amount, kind, dueOffset, settled, note) => {
    const due = plus(dueOffset);
    d.accounts.push({
      id: id, name: name, amount: amount, kind: kind,
      jy: t.jy, jm: t.jm, jd: t.jd,
      due: { jy: due.jy, jm: due.jm, jd: due.jd },
      settled: !!settled, note: note || ''
    });
  };

  acc('demo-a1', 'حسین محمدی', 3000000, 'receivable', 3, false, 'قرض');
  acc('demo-a2', 'مریم احمدی', 1500000, 'payable', -2, false, 'خرید لوازم');
  acc('demo-a3', 'شرکت پارس', 9000000, 'receivable', 12, false, 'فاکتور ۱۰۲');
  acc('demo-a4', 'آقای نوری', 2500000, 'payable', 20, false, '');
  acc('demo-a5', 'خانم رضایی', 1200000, 'receivable', -15, true, 'تسویه شد');
  acc('demo-a6', 'شرکت آریا', 5000000, 'payable', 5, false, 'بابت حمل');
  acc('demo-a7', 'دایی رضا', 2000000, 'receivable', 30, false, '');

  /* ---------- تراکنش‌ها: ۳۶ ماه (سه سال) ---------- */
  const expCats = ['خوراک', 'قبض', 'حمل‌ونقل', 'اجاره', 'درمان', 'پوشاک',
                   'تفریح', 'آموزش', 'خانه', 'هدیه', 'اینترنت', 'سوخت'];
  let seq = 0;

  for (let m = 0; m < 36; m++) {
    const dt = at(-m);
    const dim = monthLen(dt.jy, dt.jm);

    // حقوق (هر ماه، با رشد سالانه)
    d.tx.push({
      id: 'demo-tx-s' + m, type: 'income',
      amount: 22000000 + (m % 12) * 900000 + Math.floor(m / 12) * 3000000,
      jy: dt.jy, jm: dt.jm, jd: 1, cat: 'حقوق', note: ''
    });

    // درآمد جانبی
    if (m % 2 === 0) {
      d.tx.push({
        id: 'demo-tx-x' + m, type: 'income', amount: 3500000 + (m % 5) * 1800000,
        jy: dt.jy, jm: dt.jm, jd: Math.min(12, dim), cat: 'فروش', note: ''
      });
    }
    if (m % 7 === 0) {
      d.tx.push({
        id: 'demo-tx-y' + m, type: 'income', amount: 2000000 + (m % 3) * 700000,
        jy: dt.jy, jm: dt.jm, jd: Math.min(20, dim), cat: 'سود بانکی', note: ''
      });
    }

    // هزینه‌ها: ۵ تا ۸ مورد در هر ماه
    const n = 5 + (m % 4);
    for (let i = 0; i < n; i++) {
      const cat = expCats[(m * 5 + i * 3) % expCats.length];
      const amount = 90000 + ((m * 11 + i * 17) % 40) * 55000;
      const day = Math.min(dim, 2 + ((m * 7 + i * 5) % (dim - 2)));
      d.tx.push({
        id: 'demo-tx-' + (seq++), type: 'expense', amount: amount,
        jy: dt.jy, jm: dt.jm, jd: day, cat: cat, note: ''
      });
    }
  }

  /* ---------- یادداشت‌ها ---------- */
  const note = (id, title, w, h) => {
    d.notes.push({
      id: id, title: title,
      page: { w: w, h: h }, pages: [{ strokes: [] }], thumb: '', reminder: null
    });
  };
  note('demo-n1', 'فهرست خرید', 794, 1123);
  note('demo-n2', 'یادآوری جلسه', 794, 559);
  note('demo-n3', 'طرح ایده‌ها', 559, 794);
  note('demo-n4', 'گزارش دستی', 1123, 794);

  /* ---------- یادآورها ---------- */
  const rem = (id, title, offset, before, sound) => {
    const dt = plus(offset);
    d.reminders.push({
      id: id, title: title, note: '', jy: dt.jy, jm: dt.jm, jd: dt.jd,
      daysBefore: before, sound: sound
    });
  };

  rem('demo-r1', 'پرداخت اجاره خانه', 3, 1, true);
  rem('demo-r2', 'تمدید بیمه خودرو', 6, 3, true);
  rem('demo-r3', 'جلسه با حسابدار', 1, 0, false);
  rem('demo-r4', 'تسویه قبض برق', 9, 2, true);
  rem('demo-r5', 'سالگرد ازدواج', 20, 7, true);
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

  // اجرای خودکار اثر انگشت در اولین نمایش قفل
  if (canFp && !bioAutoDone) {
    bioAutoDone = true;
    setTimeout(() => {
      if (lockMode !== 'unlock') return;
      try { AndroidAqsat.askBiometric(); } catch (e) { /* */ }
    }, 450);
  }
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

  bioTries++;
  if (bioTries >= 2) {
    $('fpBtn').classList.add('hidden');
    lockErr.textContent = 'اثر انگشت شناسایی نشد — رمز ۶ رقمی را وارد کن';
    return;
  }

  lockErr.textContent = 'اثر انگشت شناسایی نشد (' + fa(bioTries) + ' از ۲)';
};

function endLock() {
  lockEl.classList.add('hide');
  $('app').classList.remove('hidden');
  if (lockTimer) { clearInterval(lockTimer); lockTimer = null; }
  render();
  setTimeout(() => {
    try {
      if (!userName()) askName(true);
      else showWelcome();
    } catch (e) { /* */ }
  }, 600);

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

    const isFirstRun = !userName();

    endLock();
    toast('رمز ذخیره شد');

    if (isFirstRun) setTimeout(() => { try { askName(true); } catch (e) { } }, 500);
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

  if (st.fails === 2) {
    try {
      showHelp('رمز را فراموش کرده‌ای؟',
        'رمز ۶ رقمی است که خودت هنگام نصب انتخاب کردی.\n\n' +
        '• دقت کن اعداد فارسی/انگلیسی با هم فرقی ندارند.\n' +
        '• اگر سه بار اشتباه بزنی، ورود ۳ دقیقه قفل می‌شود.\n' +
        '• با دکمهٔ «فراموشی رمز» و کد مادر «۵۶۳۵۷۰» می‌توانی رمز تازه بگذاری.\n' +
        '• اگر اثر انگشت فعال است، دکمهٔ پایین صفحه را بزن.');
    } catch (e) { /* */ }
  }

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

function mountDP(box, backYears, fwdYears) {
  box.textContent = '';
  const y = document.createElement('select');
  const m = document.createElement('select');
  const d = document.createElement('select');
  const now = todayJalali().jy;
  const back = (backYears === undefined) ? 10 : backYears;
  const fwd = (fwdYears === undefined) ? 20 : fwdYears;
  for (let yy = now - back; yy <= now + fwd; yy++) y.add(new Option(fa(yy), String(yy)));
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
  if (days <= 1) return 'red';
  if (days <= 3) return 'yellow';
  if (days <= 5) return 'orange';
  return null;
}

function isRedOcc(o) {
  return !!o.h || /شهادت|ولادت/.test(o.t);
}

function openOcc(o) {
  $('occTitle').textContent = o.t || 'مناسبت';
  const body = $('occBody');
  body.textContent = '';
  const d = document.createElement('div');
  d.textContent = o.d || 'توضیحی برای این مناسبت ثبت نشده است.';
  body.appendChild(d);
  $('occHadith').classList.add('hidden');
  $('occDlg').showModal();
}

function openOccDay(jdn) {
  const list = allOcc(jdn);
  if (!list.length) return;

  $('occTitle').textContent = 'مناسبت‌های ' + dateLabel(d2j(jdn));

  const body = $('occBody');
  body.textContent = '';

  for (const o of list) {
    const wrap = document.createElement('div');
    wrap.style.marginBottom = '12px';

    const t = document.createElement('div');
    t.textContent = o.t;
    t.style.fontWeight = '800';
    t.style.fontSize = '14px';
    t.style.color = isRedOcc(o) ? 'var(--red)' : 'var(--ink)';
    wrap.appendChild(t);

    const d = document.createElement('div');
    d.textContent = o.d || '';
    d.style.marginTop = '4px';
    d.style.color = 'var(--ink)';
    wrap.appendChild(d);

    const hs = o.hadiths || (o.hadith ? [o.hadith] : []);
    if (hs.length) {
      const h = document.createElement('div');
      h.className = 'hint';
      h.style.marginTop = '6px';
      h.style.lineHeight = '1.9';
      h.textContent = hs[Math.floor(Math.random() * hs.length)];
      wrap.appendChild(h);
    }

    body.appendChild(wrap);
  }

  $('occHadith').classList.add('hidden');
  $('occDlg').showModal();
}

$('occOk').addEventListener('click', () => $('occDlg').close());

/* ---------- پرسش ثبت یادآور ---------- */
let askRemJdn = 0;

function askRemind(jdn) {
  askRemJdn = jdn;
  $('askRemBody').textContent = 'برای ' + dateLabel(d2j(jdn)) + ' یک یادآور بسازم؟';
  $('askRemDlg').showModal();
}

$('askRemNo').addEventListener('click', () => $('askRemDlg').close());

$('askSetDate').addEventListener('click', () => {
  $('askRemDlg').close();
  VIEW_DATE = askRemJdn;
  calSel = askRemJdn;
  applySeason();
  renderCal();
  renderDateInfo();
  render();
  toast('تاریخ برنامه تغییر کرد');
});

function applyAppDate() {
  const dt = getDP($('dpApp'));
  VIEW_DATE = jdnOf(dt);
  calY = dt.jy;
  calM = dt.jm;
  calSel = VIEW_DATE;
  applySeason();
  renderCal();
  renderDateInfo();
  render();
  toast('تاریخ برنامه: ' + dateLabel(dt));
}

$('applyDate').addEventListener('click', applyAppDate);

$('backToday').addEventListener('click', () => {
  VIEW_DATE = null;
  const j = todayJalali();
  calY = j.jy;
  calM = j.jm;
  calSel = todayJdn();
  applySeason();
  renderCal();
  renderDateInfo();
  render();
  toast('به امروز برگشت');
});

$('askRemYes').addEventListener('click', () => {
  $('askRemDlg').close();
  calSel = askRemJdn;
  renderCal();
  renderDateInfo();
  openRem(null);
  setTimeout(() => { try { $('remTitle').focus(); } catch (e) { } }, 200);
});

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

/* کد بانک از روی شبا (IR + ۲ رقم کنترلی + ۳ رقم کد بانک) */
const IBAN_BANKS = {
  '010': 'بانک مرکزی', '011': 'بانک صنعت و معدن', '012': 'بانک ملت',
  '013': 'بانک رفاه کارگران', '014': 'بانک مسکن', '015': 'بانک سپه',
  '016': 'بانک کشاورزی', '017': 'بانک ملی', '018': 'بانک تجارت',
  '019': 'بانک صادرات', '020': 'بانک توسعه صادرات', '021': 'پست بانک',
  '022': 'بانک توسعه تعاون', '054': 'بانک پارسیان', '055': 'بانک پاسارگاد',
  '056': 'بانک سامان', '057': 'بانک پاسارگاد', '058': 'بانک سرمایه',
  '059': 'بانک سینا', '061': 'بانک شهر', '062': 'بانک آینده',
  '063': 'بانک انصار', '069': 'بانک ایران زمین', '070': 'بانک رسالت',
  '078': 'بانک دی', '079': 'بانک مهر ایران'
};

function bankFromIban(iban) {
  if (!iban || iban.length < 7) return '';
  return IBAN_BANKS[iban.slice(4, 7)] || '';
}

/* ---------- تصویر چک ---------- */
let chqPhotoData = '';

/* ---------- تاریخچهٔ ویرایش تصویر چک ---------- */
let photoHist = [];
let photoPos = -1;

function photoSyncHist() {
  const row = $('photoHistRow');
  const u = $('photoUndo');
  const r = $('photoRedo');

  if (!row) return;

  const has = photoHist.length > 1;
  row.classList.toggle('hidden', !has);

  if (u) u.classList.toggle('hidden', !(has && photoPos > 0));
  if (r) r.classList.toggle('hidden', !(has && photoPos < photoHist.length - 1));
}

function photoRecord(prev) {
  if (prev === undefined) prev = chqPhotoData;
  if (!prev) return;

  photoHist = photoHist.slice(0, photoPos + 1);

  if (photoHist[photoHist.length - 1] !== prev) {
    photoHist.push(prev);
  }

  if (photoHist.length > 15) photoHist.shift();

  photoPos = photoHist.length - 1;
  setTimeout(photoSyncHist, 30);
}

function photoReset(data) {
  photoHist = [];
  photoPos = -1;
  setChqPhoto(data || '', false);
  photoSyncHist();
}

$('photoUndo').addEventListener('click', () => {
  if (!photoHist.length || photoPos <= 0) return;
  photoPos -= 1;
  setChqPhoto(photoHist[photoPos], false);
  photoSyncHist();
  toast('به حالت قبل برگشت');
});

$('photoRedo').addEventListener('click', () => {
  if (photoPos >= photoHist.length - 1) return;
  photoPos += 1;
  setChqPhoto(photoHist[photoPos], false);
  photoSyncHist();
  toast('به حالت بعد رفت');
});

function setChqPhoto(data, record) {
  if (record !== false && chqPhotoData) photoRecord(chqPhotoData);

  chqPhotoData = data || '';

  if (data && record !== false) {
    if (photoHist[photoHist.length - 1] !== data) {
      photoHist = photoHist.slice(0, photoPos + 1);
      photoHist.push(data);
      if (photoHist.length > 15) photoHist.shift();
      photoPos = photoHist.length - 1;
    }
  }

  if (data) setTimeout(photoSyncHist, 30);
  const wrap = $('chqPhotoPrev');
  if (!wrap) return;
  if (chqPhotoData) {
    $('chqPhotoImg').src = chqPhotoData;
    wrap.classList.remove('hidden');
  } else {
    $('chqPhotoImg').removeAttribute('src');
    wrap.classList.add('hidden');
  }
}

$('chqPhotoBtn').addEventListener('click', () => {
  try {
    if (window.AndroidAqsat && AndroidAqsat.capturePhoto) { AndroidAqsat.capturePhoto(); return; }
  } catch (e) { /* */ }
  $('chqPhotoFile').click();
});

function compressPhoto(src, maxW, quality, cb) {
  const img = new Image();
  img.onload = () => {
    let w = img.width, h = img.height;
    if (Math.max(w, h) > maxW) {
      const k = maxW / Math.max(w, h);
      w = Math.round(w * k);
      h = Math.round(h * k);
    }
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(img, 0, 0, w, h);
    cb(c.toDataURL('image/jpeg', quality));
  };
  img.onerror = () => cb(src);
  img.src = src;
}

window.onPhotoResult = function (b64) {
  if (!b64) { toast('عکسی گرفته نشد'); return; }
  compressPhoto('data:image/jpeg;base64,' + b64, 820, 0.55, out => {
    setChqPhoto(out);
    toast('تصویر چک اضافه شد');
  });
};
$('chqPhotoDel').addEventListener('click', () => setChqPhoto(''));

$('chqPhotoImg').addEventListener('click', () => {
  if (chqPhotoData) openImage(chqPhotoData);
});

let photoRot = 0;
let photoBusy = false;

function photoTransform(opts) {
  if (!chqPhotoData || photoBusy) return;
  photoBusy = true;

  const img = new Image();

  img.onload = () => {
    try {
      const out = redrawPhoto(
        img, img.width, img.height,
        opts.filter || '',
        opts.rot || 0,
        opts.cropPct || 0,
        opts.rect || null
      );
      setChqPhoto(out);
    } catch (e) {
      toast('ویرایش تصویر ممکن نشد');
    }
    photoBusy = false;
  };

  img.onerror = () => { photoBusy = false; };
  img.src = chqPhotoData;
}

function redrawPhoto(img, w, h, filter, rot, cropPct, rect) {
  let sw = w, sh = h, sx = 0, sy = 0;

  if (rect && rect.w > 8 && rect.h > 8) {
    sx = Math.max(0, Math.round(rect.x));
    sy = Math.max(0, Math.round(rect.y));
    sw = Math.min(w - sx, Math.round(rect.w));
    sh = Math.min(h - sy, Math.round(rect.h));
  } else if (cropPct > 0) {
    sw = Math.round(w * (1 - cropPct * 2));
    sh = Math.round(h * (1 - cropPct * 2));
    sx = Math.round(w * cropPct);
    sy = Math.round(h * cropPct);
  }

  const rot90 = (rot % 180) !== 0;
  const c = document.createElement('canvas');
  c.width = rot90 ? sh : sw;
  c.height = rot90 ? sw : sh;

  const g = c.getContext('2d');
  if (filter) { try { g.filter = filter; } catch (e) { /* */ } }
  g.translate(c.width / 2, c.height / 2);
  g.rotate(rot * Math.PI / 180);
  g.drawImage(img, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
  return c.toDataURL('image/jpeg', 0.62);
}

function editPhoto(filter, cropPct) {
  photoTransform({ filter: filter, rot: 0, cropPct: cropPct || 0 });
}

$('photoBright').addEventListener('click', () => editPhoto('brightness(1.18)', 0));
$('photoDark').addEventListener('click', () => editPhoto('brightness(0.85)', 0));
$('photoRot').addEventListener('click', () => photoTransform({ rot: 90 }));
$('photoCrop').addEventListener('click', () => editPhoto('', 0.06));

$('chqPhotoFile').addEventListener('change', ev => {
  const f = ev.target.files && ev.target.files[0];
  ev.target.value = '';
  if (!f) return;

  const fr = new FileReader();
  fr.onload = () => {
    const img = new Image();
    img.onload = () => {
      const max = 820;
      let w = img.width, h = img.height;
      if (Math.max(w, h) > max) {
        const k = max / Math.max(w, h);
        w = Math.round(w * k); h = Math.round(h * k);
      }
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      setChqPhoto(c.toDataURL('image/jpeg', 0.55));
      toast('تصویر چک اضافه شد');
    };
    img.src = String(fr.result);
  };
  fr.readAsDataURL(f);
});

function openImage(data) {
  if (!data) { toast('تصویری برای این چک ثبت نشده'); return; }
  $('imgDlgPic').src = data;
  imgHist = [data];
  imgHistPos = 0;
  paintHist();
  resetZoom();
  $('imgDlg').showModal();
}

$('imgDlgClose').addEventListener('click', () => $('imgDlg').close());
/* ---------- تاریخچهٔ ویرایش تصویر (Undo / Redo) ---------- */
let imgHist = [];
let imgHistPos = -1;

function imgPush(src) {
  if (!src) return;
  imgHist = imgHist.slice(0, imgHistPos + 1);
  imgHist.push(src);
  imgHistPos = imgHist.length - 1;
  paintHist();
}

function paintHist() {
  const u = $('imgUndo');
  const r = $('imgRedo');
  if (u) u.disabled = imgHistPos <= 0;
  if (r) r.disabled = imgHistPos >= imgHist.length - 1;
}

function imgGo(delta) {
  const p = imgHistPos + delta;
  if (p < 0 || p >= imgHist.length) return;
  imgHistPos = p;
  $('imgDlgPic').src = imgHist[p];
  paintHist();
}




$('imgDlgClose').addEventListener('click', () => { imgHist = []; imgHistPos = -1; });

$('imgFull').addEventListener('click', () => {
  $('imgDlg').classList.toggle('full');
  $('imgFull').textContent = $('imgDlg').classList.contains('full') ? '⛶' : '⛶';
});

function rotateDataUrl(data, deg, cb) {
  const img = new Image();
  img.onload = () => {
    const rad = deg * Math.PI / 180;
    const cos = Math.abs(Math.cos(rad)), sin = Math.abs(Math.sin(rad));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * cos + img.height * sin);
    c.height = Math.round(img.width * sin + img.height * cos);
    const g = c.getContext('2d');
    g.translate(c.width / 2, c.height / 2);
    g.rotate(rad);
    g.drawImage(img, -img.width / 2, -img.height / 2);
    cb(c.toDataURL('image/jpeg', 0.85));
  };
  img.src = data;
}

$('imgRotR').addEventListener('click', () => {
  rotateDataUrl($('imgDlgPic').src, 90, out => { $('imgDlgPic').src = out; imgPush(out); resetZoom(); });
});
$('imgRotL').addEventListener('click', () => {
  rotateDataUrl($('imgDlgPic').src, -90, out => { $('imgDlgPic').src = out; imgPush(out); resetZoom(); });
});

/* ---------- زوم دو انگشتی و جابه‌جایی ---------- */
let zoomScale = 1, panX = 0, panY = 0, startDist = 0, startScale = 1;
let startPan = null;

function applyZoom() {
  const img = $('imgDlgPic');
  if (!img) return;
  img.style.transform = 'scale(' + zoomScale + ') translate(' + panX + 'px,' + panY + 'px)';
  img.style.transformOrigin = 'center center';
}

function resetZoom() {
  zoomScale = 1; panX = 0; panY = 0;
  applyZoom();
}

(function bindZoom() {
  const stage = $('imgStage');
  if (!stage) return;

  const dist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

  stage.addEventListener('pointerdown', ev => {
    if (ev.pointerType === 'mouse' && ev.buttons !== 1) return;
    stage._pts = stage._pts || [];
    stage._pts.push(ev);

    if (stage._pts.length === 2) {
      startDist = dist(stage._pts);
      startScale = zoomScale;
    } else if (zoomScale > 1) {
      startPan = { x: ev.clientX - panX, y: ev.clientY - panY };
    }
  }, { passive: true });

  stage.addEventListener('pointermove', ev => {
    const pts = stage._pts || [];
    if (pts.length === 2) {
      const i = pts.findIndex(p => p.pointerId === ev.pointerId);
      if (i >= 0) pts[i] = ev;
      if (startDist > 0) {
        zoomScale = Math.min(5, Math.max(1, startScale * dist(pts) / startDist));
        applyZoom();
      }
    } else if (pts.length === 1 && startPan && zoomScale > 1) {
      panX = ev.clientX - startPan.x;
      panY = ev.clientY - startPan.y;
      applyZoom();
    }
  }, { passive: true });

  const clear = ev => {
    const pts = stage._pts || [];
    stage._pts = pts.filter(p => p.pointerId !== ev.pointerId);
    if (stage._pts.length < 2) startDist = 0;
    if (!stage._pts.length) startPan = null;
  };

  stage.addEventListener('pointerup', clear);
  stage.addEventListener('pointercancel', clear);

  stage.addEventListener('dblclick', () => {
    zoomScale = zoomScale > 1 ? 1 : 2.2;
    if (zoomScale === 1) { panX = 0; panY = 0; }
    applyZoom();
  });
})();

$('imgDlgSave').addEventListener('click', () => {
  const src = $('imgDlgPic').src || '';
  if (!src) { toast('تصویری نیست'); return; }

  const name = 'MyC-cheque-' + Date.now() + '.jpg';
  const b64 = src.split(',')[1] || '';

  // ۱) اپ اندروید
  try {
    if (window.AndroidAqsat && AndroidAqsat.saveImage && b64) {
      const where = AndroidAqsat.saveImage(b64, name);

      if (where && String(where).length) {
        toast('تصویر ذخیره شد: ' + where);
        return;
      }
    }
  } catch (e) { /* */ }

  // ۲) دانلود مرورگر
  try {
    const a = document.createElement('a');
    a.href = src;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast('دانلود شروع شد');
    return;
  } catch (e) { /* */ }

  // ۳) اشتراک‌گذاری
  try {
    if (window.AndroidAqsat && AndroidAqsat.shareImage && b64) {
      if (AndroidAqsat.shareImage(b64, name)) { toast('پنجرهٔ ذخیره/ارسال باز شد'); return; }
    }
  } catch (e) { /* */ }

  toast('ذخیره نشد؛ از دکمهٔ «اشتراک» استفاده کن');
});

$('imgShare').addEventListener('click', () => {
  const src = $('imgDlgPic').src || '';
  const b64 = src.split(',')[1] || '';
  if (!b64) { toast('تصویری نیست'); return; }

  const name = 'MyC-cheque-' + Date.now() + '.jpg';

  try {
    if (window.AndroidAqsat && AndroidAqsat.shareImage) {
      if (AndroidAqsat.shareImage(b64, name)) return;
    }
  } catch (e) { /* */ }

  // مرورگر
  try {
    const a = document.createElement('a');
    a.href = src;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (e) {
    toast('اشتراک‌گذاری ممکن نشد');
  }
});

/* ---------- خواندن اطلاعات چک از QR ---------- */
function applyQrText(txt) {
  const t = (txt || '').trim();

  if (t.startsWith('ERR:')) {
    const code = t.slice(4);
    const map = {
      CANCELLED: 'اسکن لغو شد',
      NOIMAGE: 'عکسی گرفته نشد',
      NOCAMERA: 'دوربین در دسترس نیست',
      TIMEOUT: 'چیزی خوانده نشد — دوربین را نزدیک‌تر بگیر یا از دکمهٔ «عکس بگیر» استفاده کن'
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

  /* --- QR استاندارد چک صیادی (چند خط یا با فاصله) ---
     نمونهٔ واقعی:
     01
     1
     2093406950
     IR300190000000102092051006
     19_1900128
     801394
     3734010204848394
  */
  const tokens = t.split(/\s+/).map(x => x.trim()).filter(x => x.length);

  if (tokens.length >= 5) {
    let nid = '';
    let iban = '';
    let sayad = '';
    let chq = '';
    const extras = [];

    for (const tk of tokens) {
      if (/^IR[0-9]{24}$/i.test(tk)) { iban = tk.toUpperCase(); continue; }
      if (/^[0-9]{16}$/.test(tk)) { sayad = tk; continue; }
      if (/^[0-9]{10}$/.test(tk)) { nid = tk; continue; }
      if (/^[0-9]{5,9}$/.test(tk)) { if (!chq) chq = tk; continue; }
      if (/^[0-9]{1,2}$/.test(tk)) continue;
      if (tk.length >= 3) extras.push(tk);
    }

    let filled = 0;

    if (nid) { $('cNid').value = nid; filled++; }
    if (chq) { $('cNumber').value = chq; filled++; }

    if (iban) {
      $('cIban').value = iban;
      const bankName = bankFromIban(iban);
      if (bankName) $('cBank').value = bankName;

      const acc = iban.slice(7);
      if (acc && $('cAccount')) $('cAccount').value = acc;

      filled++;
    }

    const reasonParts = [];
    if (sayad) reasonParts.push('شناسه صیاد: ' + sayad);
    for (const ex of extras) reasonParts.push(ex);
    if (reasonParts.length) {
      $('cReason').value = reasonParts.join(' · ').slice(0, 80);
      filled++;
    }

    $('cParty').value = '';

    if ($('cRaw')) $('cRaw').value = tokens.join(' ').slice(0, 160);

    if (filled) return;
  }

  /* حالت نامشخص: هیچ‌چیز در «نام طرف حساب» نوشته نمی‌شود */
  const ibanOnly = (t.match(/IR[0-9]{24}/i) || [])[0] || '';
  $('cParty').value = '';

  if (ibanOnly) {
    const ib = ibanOnly.toUpperCase();
    $('cIban').value = ib;
    const bn2 = bankFromIban(ib);
    if (bn2) $('cBank').value = bn2;

    // شمارهٔ چک: عدد ۶ رقمی کنار شبا
    const num6 = (t.replace(ib, ' ').match(/[0-9]{6}/g) || [])[0];
    if (num6) $('cNumber').value = num6;

    $('cRaw').value = t.replace(/\s+/g, ' ').slice(0, 160);
    toast('شبا و اطلاعات چک از QR خوانده شد');
    return;
  }

  openOcc({ t: 'متن خوانده‌شده از QR', d: t });
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

$('qrLive').addEventListener('click', () => {
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
let bioTries = 0;
let bioAutoDone = false;

function backupToDocs() {
  const stamp = new Date().toISOString().slice(0, 10);
  const json = JSON.stringify({ v: 3, app: 'MyC', savedAt: new Date().toISOString(), data: S.d }, null, 1);
  try {
    if (window.AndroidAqsat && AndroidAqsat.saveDocs) {
      return AndroidAqsat.saveDocs('Back_Miaad.json', json);
    }
    if (window.AndroidAqsat && AndroidAqsat.saveFile) {
      return AndroidAqsat.saveFile('Back_Miaad.json', json);
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

$('demoSeedBtn').addEventListener('click', () => {
  askPinGate('بارگذاری دادهٔ نمونه', () => {
    if (!confirm('دادهٔ نمونه برای تست اضافه شود؟')) return;
    if ((S.d.loans || []).some(l => l.id === 'demo-l1')) {
      toast('دادهٔ نمونه قبلاً اضافه شده است');
      return;
    }
    seedDemo(S.d);
    save();
    $('settingsDlg').close();
    render();
    toast('دادهٔ نمونه اضافه شد');
  });
});

$('resetDataBtn').addEventListener('click', () => {
  askPinGate('پاک کردن داده‌های قبلی', () => {
    $('settingsDlg').close();
    askResetData();
  });
});

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
      toast(ok ? 'پشتیبان‌گیری انجام شد' : 'داده‌ها پاک شدند ولی پشتیبان ساخته نشد');
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

function arrowSvg(incoming) {
  const NS = 'http://www.w3.org/2000/svg';
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('fill', 'none');
  s.setAttribute('stroke', 'currentColor');
  s.setAttribute('stroke-width', '3.4');
  s.setAttribute('stroke-linecap', 'round');
  s.setAttribute('stroke-linejoin', 'round');

  s.innerHTML = incoming
    // سبز: از بالا-راست به پایین-چپ
    ? '<line x1="17" y1="7" x2="9.5" y2="14.5" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>' +
      '<polygon points="6,18 6,9.6 14.4,18" fill="currentColor"/>'
    // قرمز: از پایین-چپ به بالا-راست
    : '<line x1="7" y1="17" x2="14.5" y2="9.5" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>' +
      '<polygon points="18,6 18,14.4 9.6,6" fill="currentColor"/>';
  return s;
}



/* ---------- دروازهٔ رمز برای عملیات حساس ---------- */
let pinGateCb = null;

function askPinGate(title, cb) {
  pinGateCb = cb;
  $('pinGateTitle').textContent = title;
  $('pinGateInput').value = '';
  $('pinGateDlg').showModal();
  setTimeout(() => { try { $('pinGateInput').focus(); } catch (e) { } }, 150);
}

$('pinGateCancel').addEventListener('click', () => { pinGateCb = null; $('pinGateDlg').close(); });

$('pinGateFrm').addEventListener('submit', ev => {
  ev.preventDefault();
  const code = $('pinGateInput').value.trim();

  if (!/^\d{6}$/.test(code)) { toast('رمز باید ۶ رقم باشد'); return; }
  if (hash(code) !== S.d.settings.pinHash) {
    $('pinGateInput').value = '';
    toast('رمز درست نیست');
    return;
  }

  const cb = pinGateCb;
  pinGateCb = null;
  $('pinGateDlg').close();
  if (cb) cb();
});

/* ---------- راهنمای فیلدهای لازم (بعد از دو تلاش) ---------- */
const formFails = {};

function showHelp(title, lines) {
  $('helpTitle').textContent = title;
  $('helpBody').textContent = lines;
  $('helpDlg').showModal();
}

$('helpOk').addEventListener('click', () => $('helpDlg').close());

function formError(key, title, lines, short) {
  formFails[key] = (formFails[key] || 0) + 1;

  if (formFails[key] >= 2) {
    formFails[key] = 0;
    showHelp(title, lines);
    return;
  }

  toast(short || 'اطلاعات ناقص است');
}

function formOk(key) { formFails[key] = 0; }


/* ---------- گرافیک فصلی دائمی روی کارت تاریخ ---------- */
function addSeasonFx(card, season) {
  try {
    if (!S.d || !S.d.settings) return;
    if (S.d.settings.seasonal === false || S.d.settings.fx === false) return;

    const fx = document.createElement('div');
    fx.className = 'season-fx ' + season;

    const icons = {
      spring: ['🌸', '🌷', '❀'],
      summer: ['☀', '✷', '✦'],
      autumn: ['🍂', '🍁', '🍃'],
      winter: ['❄', '❅', '✻']
    }[season] || [];

    const n = season === 'summer' ? 8 : 12;

    for (let i = 0; i < n; i++) {
      const it = document.createElement('i');
      it.textContent = icons[i % icons.length];
      it.style.left = (Math.random() * 96).toFixed(1) + '%';
      it.style.fontSize = (10 + Math.random() * 10).toFixed(0) + 'px';
      it.style.animationDuration = (7 + Math.random() * 8).toFixed(1) + 's';
      it.style.animationDelay = (-Math.random() * 10).toFixed(1) + 's';
      it.style.opacity = (0.35 + Math.random() * 0.45).toFixed(2);
      fx.appendChild(it);
    }

    card.appendChild(fx);
  } catch (e) { /* */ }
}



/* ---------- لیست درآمد/هزینه با مرتب‌سازی و جستجو ---------- */
const LIST = { kind: 'income', sort: 'date', dir: -1, query: '', y: 0, m: 0, period: 'month' };

function openTxList(kind, y, m, period) {
  LIST.kind = kind;
  LIST.y = y; LIST.m = m; LIST.period = period;
  LIST.sort = 'date';
  LIST.dir = -1;
  LIST.query = '';

  $('listTitle').textContent = kind === 'income' ? 'لیست درآمدها' : 'لیست هزینه‌ها';
  $('listSearch').value = '';
  renderTxList();
  $('listDlg').showModal();
}

function renderTxList() {
  const kind = LIST.kind;

  let items = S.d.tx.filter(x => x.type === kind);
  if (LIST.period === 'month') {
    items = items.filter(x => x.jy === LIST.y && x.jm === LIST.m);
  } else {
    items = items.filter(x => x.jy === LIST.y);
  }

  if (LIST.query.trim()) {
    const q = LIST.query.trim();
    items = items.filter(x => (x.cat || '').includes(q) || (x.note || '').includes(q));
  }

  if (LIST.sort === 'amount') items.sort(sortBy(LIST.dir, x => x.amount));
  else items.sort(sortBy(LIST.dir, x => jdnOf(x)));

  const bar = $('listSort');
  bar.textContent = '';
  [['date', 'تاریخ'], ['amount', 'مبلغ']].forEach(([k, lbl]) => {
    const b = el('button', 'sortbtn' + (LIST.sort === k ? ' on' : ''), lbl);
    b.type = 'button';
    b.addEventListener('click', () => { LIST.sort = k; renderTxList(); });
    bar.appendChild(b);
  });

  const dir = el('button', 'sortbtn dir ' + (LIST.dir > 0 ? 'asc' : 'desc'),
    LIST.dir > 0 ? '↑ نمایش صعودی' : '↓ نمایش نزولی');
  dir.type = 'button';
  dir.addEventListener('click', () => {
    LIST.dir = -LIST.dir;
    renderTxList();
  });
  bar.appendChild(dir);

  const body = $('listBody');
  body.textContent = '';

  if (!items.length) {
    const e = el('div', 'empty');
    e.innerHTML = '<b>موردی نیست</b>فیلتر یا جستجو را عوض کن.';
    body.appendChild(e);
    return;
  }

  const total = items.reduce((s2, x) => s2 + x.amount, 0);
  const sum = el('div', 'hint');
  sum.style.margin = '0 0 8px';
  sum.textContent = fa(items.length) + ' مورد · جمع: ' + money(total);
  body.appendChild(sum);

  for (const x of items) {
    const row = el('div', 'item');
    const ico = el('div', 'ico arrow ' + (kind === 'income' ? 'green' : 'red'));
    ico.appendChild(arrowSvg(kind === 'income'));

    const main = el('div', 'main');
    main.appendChild(el('div', 't', (x.cat || 'بدون دسته') + (x.note ? ' — ' + x.note : '')));
    const m2 = el('div', 'm');
    m2.appendChild(el('span', null, dateLabel(x)));
    main.appendChild(m2);

    const amt = el('div', 'amt ' + (kind === 'income' ? 'green' : 'red'), NUM.format(x.amount));
    row.append(ico, main, amt);
    row.addEventListener('click', () => { $('listDlg').close(); openTx(x); });

    body.appendChild(row);
  }
}

$('listSearch').addEventListener('input', () => { LIST.query = $('listSearch').value; renderTxList(); });
$('listClose').addEventListener('click', () => $('listDlg').close());


/* ---------- جستجوی هوشمند ---------- */
function normDigits(v) {
  return String(v == null ? '' : v)
    .replace(/[\u06F0-\u06F9]/g, d => String(d.charCodeAt(0) - 0x06F0))
    .replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x0660));
}

function qMatch(q, values) {
  const nq = normDigits(q).toLowerCase().replace(/\s+/g, ' ').trim();
  if (!nq) return true;

  const parts = nq.split(' ');
  return values.some(v => {
    const nv = normDigits(v).toLowerCase();
    return parts.every(pp => nv.includes(pp));
  });
}

function jDateStr(x) {
  return x ? (x.jy + '/' + x.jm + '/' + x.jd) : '';
}

/* کش ورودی جستجو (برای حفظ فوکوس و کیبورد) */
const SEARCH_CACHE = {};
const SEARCH_CFG = {};
const SEARCH_POS = {};
/* ردیف تعداد فقره‌ها */
function listSum(n, suffix) {
  const d = el('div', 'listsum');
  d.appendChild(el('b', null, fa(n)));
  d.appendChild(document.createTextNode(' ' + (suffix || 'فقره')));
  return d;
}

/* حفظ فوکوس جستجو بعد از رندر */
var searchFocus = null;

function rememberSearch(inp) {
  searchFocus = { key: inp.dataset.key || '', pos: inp.selectionStart || 0 };
}

function restoreSearchFocus() {
  if (!searchFocus) return;

  const inp = document.querySelector('#view .listtools input[type="search"]');
  if (!inp) { searchFocus = null; return; }

  try {
    inp.focus({ preventScroll: true });
    const pos = Math.min(searchFocus.pos, inp.value.length);
    inp.setSelectionRange(pos, pos);
  } catch (e) { /* */ }

  searchFocus = null;
}


/* ================= گزارش متنی و خروجی ورد ================= */
function reportCollect(kind, y, m, isYear) {
  const map = new Map();
  let total = 0;

  for (const x of S.d.tx) {
    if (x.type !== kind) continue;
    if (isYear ? x.jy !== y : !(x.jy === y && x.jm === m)) continue;
    const k = x.cat || 'سایر';
    map.set(k, (map.get(k) || 0) + x.amount);
    total += x.amount;
  }

  const rows = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  return { rows, total };
}

function reportRangeTitle(y, m, period) {
  return period === 'year' ? ('سال ' + fa(y)) : (MONTHS[m - 1] + ' ' + fa(y));
}

function reportCmpPeriod(y, m, period) {
  const mode = S.repCmp || 'prevMonth';

  if (period === 'year') {
    return mode === 'prevYear' ? { y: y - 1, m: m, title: 'سال ' + fa(y - 1) } : { y: y - 1, m: m, title: 'سال ' + fa(y - 1) };
  }

  if (mode === 'prevYear') return { y: y - 1, m: m, title: MONTHS[m - 1] + ' ' + fa(y - 1) };

  const pm = m === 1 ? 12 : m - 1;
  const py = m === 1 ? y - 1 : y;
  return { y: py, m: pm, title: MONTHS[pm - 1] + ' ' + fa(py) };
}

function buildReportText(which) {
  const now = todayJalali();
  const ym = S.reportYm || monthKey(now);
  const y = Math.floor(ym / 100);
  const m = ym % 100;
  const period = S.repPeriod || 'month';
  const isYear = period === 'year';

  const inc = reportCollect('income', y, m, isYear);
  const exp = reportCollect('expense', y, m, isYear);
  const cmp = reportCmpPeriod(y, m, period);
  const incP = reportCollect('income', cmp.y, cmp.m, isYear);
  const expP = reportCollect('expense', cmp.y, cmp.m, isYear);

  const lines = [];
  const title = which === 'income' ? 'گزارش درآمد' : (which === 'expense' ? 'گزارش هزینه' : 'گزارش کلی');

  lines.push(title + ' — ' + reportRangeTitle(y, m, period));
  lines.push('تاریخ تهیه: ' + WEEK_NAMES[weekIndex(todayJdn())] + ' ' + fa(now.jd) + ' ' + MONTHS[now.jm - 1] + ' ' + fa(now.jy));
  lines.push('');

  const add = (label, data, sign) => {
    lines.push(label + ' — جمع: ' + data.total.toLocaleString('fa-IR') + ' تومان');
    if (!data.rows.length) lines.push('  (موردی ثبت نشده)');
    data.rows.forEach(([k, v], i) => {
      const pct = data.total ? Math.round(v / data.total * 100) : 0;
      lines.push('  ' + (i + 1) + ') ' + k + ' — ' + v.toLocaleString('fa-IR') + ' تومان (' + pct + '٪)');
    });
    lines.push('');
  };

  if (which === 'expense' || which === 'all') add('هزینه‌ها', exp);
  if (which === 'income' || which === 'all') add('درآمدها', inc);

  if (which === 'all') {
    const net = inc.total - exp.total;
    lines.push('ماندهٔ دوره: ' + net.toLocaleString('fa-IR') + ' تومان');
    lines.push('');
  }

  lines.push('مقایسه با ' + cmp.title + ':');
  const dInc = inc.total - incP.total;
  const dExp = exp.total - expP.total;
  lines.push('  درآمد: ' + incP.total.toLocaleString('fa-IR') + ' → ' + inc.total.toLocaleString('fa-IR') +
    ' (' + (dInc >= 0 ? '+' : '') + dInc.toLocaleString('fa-IR') + ')');
  lines.push('  هزینه: ' + expP.total.toLocaleString('fa-IR') + ' → ' + exp.total.toLocaleString('fa-IR') +
    ' (' + (dExp >= 0 ? '+' : '') + dExp.toLocaleString('fa-IR') + ')');

  return { text: lines.join('\n'), title, y, m, period, inc, exp, cmp, incP, expP, isYear };
}

function openReportText(which) {
  const data = buildReportText(which);

  let dlg = document.getElementById('repTextDlg');

  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.id = 'repTextDlg';
    dlg.innerHTML =
      '<form method="dialog">' +
      '<h2 style="text-align:center" id="repTextTitle">گزارش</h2>' +
      '<pre id="repTextBody" class="rep-pre"></pre>' +
      '<div class="dact" style="flex-direction:column;gap:8px">' +
      '<button type="button" class="primary block" id="repTextWord">📄 خروجی ورد</button>' +
      '<button type="button" class="block" id="repTextCopy">کپی متن</button>' +
      '<button type="button" class="block" id="repTextClose">بستن</button>' +
      '</div></form>';
    document.body.appendChild(dlg);
  }

  dlg.querySelector('#repTextTitle').textContent = data.title;
  dlg.querySelector('#repTextBody').textContent = data.text;

  dlg.querySelector('#repTextClose').onclick = () => dlg.close();

  dlg.querySelector('#repTextCopy').onclick = () => {
    navigator.clipboard && navigator.clipboard.writeText(data.text);
    toast('متن گزارش کپی شد');
  };

  dlg.querySelector('#repTextWord').onclick = () => exportReportWord(which);

  dlg.showModal();
}

function reportWordHtml(data) {
  const rows = [];

  const table = (title, d, color) => {
    if (!d.rows.length) return '';
    return (
      '<h3 style="color:' + color + ';margin:14px 0 6px">' + title + '</h3>' +
      '<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;font-family:Tahoma;font-size:11pt">' +
      '<tr style="background:' + color + ';color:#fff">' +
      '<th>#</th><th>دسته</th><th>مبلغ (تومان)</th><th>سهم</th></tr>' +
      d.rows.map(([k, v], i) =>
        '<tr><td align="center">' + (i + 1) + '</td><td>' + k + '</td>' +
        '<td align="center">' + v.toLocaleString('fa-IR') + '</td>' +
        '<td align="center">' + Math.round(v / (d.total || 1) * 100) + '٪</td></tr>'
      ).join('') +
      '<tr style="font-weight:bold;background:#f3f4f6"><td colspan="2">جمع</td>' +
      '<td align="center">' + d.total.toLocaleString('fa-IR') + '</td><td></td></tr>' +
      '</table>'
    );
  };

  const dInc = data.inc.total - data.incP.total;
  const dExp = data.exp.total - data.expP.total;

  return '<html dir="rtl"><head><meta charset="utf-8"><title>' + data.title + '</title></head>' +
    '<body style="font-family:Tahoma;direction:rtl;padding:24px;color:#111">' +
    '<div style="text-align:center;margin-bottom:10px">' +
    '<img src="' + (window.__LOGO__ || '') + '" width="72" height="72" alt="MyC" style="border-radius:16px">' +
    '<h1 style="margin:6px 0 0;color:#4f46e5">MyC — میعاد ماندگار</h1>' +
    '<div style="font-size:10pt;color:#666">دفتر مالی شخصی</div></div>' +
    '<h2 style="text-align:center;margin:16px 0 4px">' + data.title + '</h2>' +
    '<div style="text-align:center;color:#555;font-size:10pt">' + reportRangeTitle(data.y, data.m, data.period) + '</div>' +
    table('درآمدها', data.inc, '#0e7490') +
    table('هزینه‌ها', data.exp, '#b91c1c') +
    '<h3 style="margin:16px 0 6px">مقایسه با ' + data.cmp.title + '</h3>' +
    '<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;font-family:Tahoma;font-size:11pt">' +
    '<tr style="background:#334155;color:#fff"><th>عنوان</th><th>' + data.cmp.title + '</th><th>دورهٔ جاری</th><th>اختلاف</th></tr>' +
    '<tr><td>درآمد</td><td align="center">' + data.incP.total.toLocaleString('fa-IR') + '</td>' +
    '<td align="center">' + data.inc.total.toLocaleString('fa-IR') + '</td>' +
    '<td align="center">' + (dInc >= 0 ? '+' : '') + dInc.toLocaleString('fa-IR') + '</td></tr>' +
    '<tr><td>هزینه</td><td align="center">' + data.expP.total.toLocaleString('fa-IR') + '</td>' +
    '<td align="center">' + data.exp.total.toLocaleString('fa-IR') + '</td>' +
    '<td align="center">' + (dExp >= 0 ? '+' : '') + dExp.toLocaleString('fa-IR') + '</td></tr>' +
    '</table>' +
    '<p style="margin-top:18px;font-size:9pt;color:#888;text-align:center">' +
    'ساخته‌شده با MyC — گروه فناوری کرانه ماندگار — علی دادمان</p>' +
    '</body></html>';
}

function exportReportWord(which) {
  const data = buildReportText(which);
  const html = reportWordHtml(data);

  const name = 'MyC-report-' + data.y + '-' + data.m + '.doc';

  try {
    if (window.AndroidAqsat && AndroidAqsat.saveDocs) {
      if (AndroidAqsat.saveDocs(name, html)) {
        toast('گزارش ورد ذخیره شد');
        return;
      }
    }
  } catch (e) { /* */ }

  try {
    const blob = new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast('فایل گزارش دانلود شد');
  } catch (e) {
    toast('ساخت فایل ممکن نشد');
  }
}

/* ---------- نوار ابزار لیست‌ها (فیلتر، مرتب‌سازی، جستجو) ---------- */


/* ---------- بازهٔ تاریخ مشترک ---------- */
function rangeOf(mode, custom) {
  const t = todayJalali();
  const tJ = todayJdn();

  if (mode === 'custom' && custom && custom.from && custom.to) {
    return { from: jdnOf(custom.from), to: jdnOf(custom.to), mode: mode };
  }
  if (mode === 'month') {
    return { from: j2d(t.jy, t.jm, 1), to: j2d(t.jy, t.jm, monthLen(t.jy, t.jm)), mode: mode };
  }
  if (mode === 'prevMonth') {
    const p = addMonths(t.jy, t.jm, 1, -1);
    return { from: j2d(p.jy, p.jm, 1), to: j2d(p.jy, p.jm, monthLen(p.jy, p.jm)), mode: mode };
  }
  if (mode === 'year') {
    return { from: j2d(t.jy, 1, 1), to: j2d(t.jy, 12, monthLen(t.jy, 12)), mode: mode };
  }
  if (mode === 'prevYear') {
    return { from: j2d(t.jy - 1, 1, 1), to: j2d(t.jy - 1, 12, monthLen(t.jy - 1, 12)), mode: mode };
  }
  return { from: -9999999, to: 9999999, mode: 'all' };
}

function inRangeJ(jdn, r) {
  if (!r || r.mode === 'all') return true;
  return jdn >= r.from && jdn <= r.to;
}

/* پنجرهٔ بازهٔ دلخواه */
let rangeTarget = 'tx';

function openRangeDlg(target) {
  rangeTarget = target;
  mountDP($('dpFrom'), 110, 5);
  mountDP($('dpTo'), 110, 5);

  const t = todayJalali();
  setDP($('dpFrom'), addMonths(t.jy, t.jm, 1, -1));
  setDP($('dpTo'), t);
  $('rangeDlg').showModal();
}

$('rangeCancel').addEventListener('click', () => $('rangeDlg').close());

$('rangeApply').addEventListener('click', () => {
  const from = getDP($('dpFrom'));
  const to = getDP($('dpTo'));

  const custom = { from: from, to: to };

  if (rangeTarget === 'tx') { S.txRange = 'custom'; S.txCustom = custom; }
  if (rangeTarget === 'chq') { S.chqRange = 'custom'; S.chqCustom = custom; }
  if (rangeTarget === 'loan') { S.loanRange = 'custom'; S.loanCustom = custom; }
  if (rangeTarget === 'acc') { S.accRange = 'custom'; S.accCustom = custom; }

  $('rangeDlg').close();
  render();
  toast('بازه اعمال شد');
});

const RANGE_CHIPS = [
  ['all', 'همه'],
  ['month', 'این ماه'],
  ['prevMonth', 'ماه قبل'],
  ['year', 'این سال'],
  ['prevYear', 'سال قبل']
];

function rangeChips(target, current) {
  const row = el('div', 'rangerow');

  for (const [key, label] of RANGE_CHIPS) {
    const b = el('button', 'chip' + (current === key ? ' on' : ''), label);
    b.type = 'button';
    onTap(b, () => {
      if (target === 'tx') S.txRange = key;
      if (target === 'chq') S.chqRange = key;
      if (target === 'loan') S.loanRange = key;
      if (target === 'acc') S.accRange = key;
      render();
    });
    row.appendChild(b);
  }

  const cb = el('button', 'chip wide' + (current === 'custom' ? ' on' : ''), 'بازهٔ دلخواه (از تاریخ تا تاریخ)');
  cb.type = 'button';
  cb.addEventListener('click', () => openRangeDlg(target));
  row.appendChild(cb);

  return row;
}

/* ---------- نمایش لحظه‌ای «صعودی/نزولی» ---------- */
function flashDirText(row, text) {
  try {
    const sp = document.createElement('span');
    sp.className = 'dirflash ' + (text === 'صعودی' ? 'asc' : 'desc');
    sp.textContent = text;
    row.appendChild(sp);
    setTimeout(() => sp.remove(), 950);
  } catch (e) { /* */ }
}

function listTools(cfg) {
  const box = el('div', 'listtools');

  if (cfg.segs) {
    const seg = el('div', 'seg');
    for (const [val, label] of cfg.segs) {
      const b = el('button', cfg.value === val ? 'on' : '', label);
      b.type = 'button';
      onTap(b, () => { cfg.onSeg(val); });
      seg.appendChild(b);
    }
    box.appendChild(seg);
  }

  if (cfg.sorts) {
    const row = el('div', 'sortrow');
    let curSort = cfg.sort;

    const paintSorts = () => {
      for (const b of row.querySelectorAll('button[data-sort]')) {
        b.classList.toggle('on', b.dataset.sort === curSort);
      }
    };

    for (const [val, label] of cfg.sorts) {
      const b = el('button', 'sortbtn' + (cfg.sort === val ? ' on' : ''), label);
      b.type = 'button';
      b.dataset.sort = val;

      b.addEventListener('click', () => {
        curSort = val;
        paintSorts();
        cfg.onSort(val);
      });

      row.appendChild(b);
    }

    let curDir = cfg.dir;

    const paintDir = () => {
      dir.className = 'sortbtn dir ' + (curDir > 0 ? 'asc' : 'desc');
      dir.textContent = '';
      const ar = el('span', 'ar', curDir > 0 ? '↑' : '↓');
      const lb = el('span', 'lbl', curDir > 0 ? 'نمایش صعودی' : 'نمایش نزولی');
      dir.append(ar, lb);
    };

    const dir = el('button', 'sortbtn dir ' + (cfg.dir > 0 ? 'asc' : 'desc'), '');
    dir.type = 'button';
    paintDir();

    dir.addEventListener('click', () => {
      curDir = -curDir;
      paintDir();
      cfg.onDir();
    });
    row.appendChild(dir);

    box.appendChild(row);
  }

  if (cfg.range) box.appendChild(cfg.range);

  if (cfg.search) {
    const key = cfg.searchKey || 'q';
    const wasFocused = SEARCH_CACHE[key] && document.activeElement === SEARCH_CACHE[key];

    let inp = SEARCH_CACHE[key];

    if (!inp) {
      inp = document.createElement('input');
      inp.type = 'search';
      inp.dataset.key = key;

      inp.addEventListener('input', () => {
        const cfgNow = SEARCH_CFG[key];
        SEARCH_POS[key] = inp.selectionStart || 0;
        if (cfgNow) cfgNow.onSearch(inp.value);
      });

      inp.addEventListener('keydown', ev => {
        if (ev.key === 'Escape') {
          inp.value = '';
          const cfgNow = SEARCH_CFG[key];
          if (cfgNow) cfgNow.onSearch('');
        }
      });

      SEARCH_CACHE[key] = inp;
    }

    SEARCH_CFG[key] = cfg;
    inp.placeholder = cfg.placeholder || 'جستجو…';

    const q = cfg.query || '';
    if (inp.value !== q) inp.value = q;

    box.appendChild(inp);

    if (wasFocused) {
      setTimeout(() => {
        try {
          inp.focus({ preventScroll: true });
          const pos = Math.min(SEARCH_POS[key] || inp.value.length, inp.value.length);
          inp.setSelectionRange(pos, pos);
        } catch (e) { /* */ }
      }, 0);
    }
  }

  if (cfg.toggle) {
    const l = el('label', 'chk');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !!cfg.toggleValue;
    cb.addEventListener('change', () => cfg.onToggle(cb.checked));
    l.appendChild(cb);
    l.appendChild(document.createTextNode(' ' + cfg.toggleLabel));
    box.appendChild(l);
  }

  return box;
}

function sortBy(dir, fn) { return (a, b) => dir * (fn(a) - fn(b)); }

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
  const ico = el('div', 'ico ' + (x.kind === 'cheque' ? 'chq' : 'acc arrow ' + (isIn ? 'green' : 'red')));
  if (x.kind !== 'cheque') ico.appendChild(arrowSvg(isIn));
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

/* احادیث تکمیلی برای انتخاب تصادفی */
const MORE_HADITHS = {
  '1-9': ['امام حسین (ع): «من را به‌جز خدا پناهی نیست.»'],
  '1-10': ['امام حسین (ع): «من برای اصلاح امت جدم قیام کردم.»', 'امام حسین (ع): «مرگ در راه عزت، از زندگی در خواری بهتر است.»'],
  '1-12': ['امام سجاد (ع): «حق کسی که به تو نیکی می‌کند، آن است که سپاسش گویی.»'],
  '2-20': ['امام حسین (ع): «هر کس مرا زیارت کند، گویا خدا را در عرش زیارت کرده است.»'],
  '2-30': ['امام رضا (ع): «هر کس به زیارت من بیاید، خداوند او را از آتش نجات می‌دهد.»'],
  '3-17': ['امام صادق (ع): «هر کس دو روزش برابر باشد، مغبون است.»'],
  '6-3': ['حضرت فاطمه (س): «خداوند نماز را برای پاک‌شدن از تکبر واجب کرد.»'],
  '7-13': ['امام علی (ع): «ارزش هر کس به اندازهٔ دانش اوست.»', 'امام علی (ع): «عدالت، مایهٔ پایداری مردمان است.»'],
  '8-15': ['امام مهدی (عج): «من مایهٔ امنیت اهل زمین هستم.»'],
  '9-10': ['پیامبر (ص): «خدیجه بهترین یار من در رساندن پیام خدا بود.»'],
  '9-21': ['امام علی (ع): «دنیا را سه طلاقه کن و از آن فقط به‌قدر آب شتر بساز.»'],
  '10-25': ['امام صادق (ع): «کسی که دوست ما اهل بیت را شاد کند، گویا پیامبر را شاد کرده است.»'],
  '12-10': ['امام علی (ع): «تقوا، نگهبان دین است.»']
};

for (const k in HADITHS) {
  if (HIJRI_OCCASIONS[k] && HIJRI_OCCASIONS[k][0]) {
    HIJRI_OCCASIONS[k][0].hadiths = [HADITHS[k]].concat(MORE_HADITHS[k] || []);
  }
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
const WEEK_NAMES_EN = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

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

function buildDateHeader(jdn) {
  const j = d2j(jdn);
  const g = d2g(jdn);
  const season = seasonOf(j.jm);

  const row = el('div', 'dc-row');

  const right = el('div', 'dc-right');
  right.appendChild(el('div', 'dc-month', MONTHS[j.jm - 1]));
  right.appendChild(el('div', 'dc-gmonth', G_MONTHS[g.gm - 1] + ' ' + g.gy));
  right.appendChild(el('div', 'dc-subnum latin', String(g.gd)));

  const circle = el('div', 'dc-circle');
  circle.innerHTML = DECOR[season] +
    '<span class="dc-day">' + fa(j.jd) + '</span>' +
    '<span class="dc-y">' + fa(j.jy) + '</span>';

  const left = el('div', 'dc-left');
  left.appendChild(el('div', 'dc-weekday', wLabel(jdn)));
  left.appendChild(el('div', 'dc-hijri', hijriMonthLabel(jdn)));
  left.appendChild(el('div', 'dc-subnum arab', hijriDayNum(jdn)));

  row.append(right, circle, left);
  return row;
}

function buildDateCard() {
  const jdn = effToday();
  const j = d2j(jdn);
  const season = seasonOf(j.jm);

  const card = el('div', 'datecard ' + season);
  addSeasonFx(card, season);

  const row = buildDateHeader(jdn);
  card.appendChild(row);

  const occs = allOcc(jdn).slice(0, 2);
  if (occs.length) {
    const wrap = el('div', 'dc-occ-wrap');
    for (const o of occs) {
      const chip = el('div', 'dc-occ' + (isRedOcc(o) ? ' hol' : '') + (occs.length === 1 ? ' big' : ''), o.t);
      chip.addEventListener('click', ev => { ev.stopPropagation(); openOccDay(jdn); });
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
    const gg2 = d2g(d);
    b.innerHTML = '<span class="wn">' + WEEK_NAMES[i] + '</span>' +
      '<span class="wd">' + fa(jd.jd) + '</span>' +
      '<span class="wh">' + hijriDayNum(d) + '</span>' +
      '<span class="wg">' + gg2.gd + '</span>';
    b.addEventListener('click', ev => { ev.stopPropagation(); openDateDlg(d); });
    strip.appendChild(b);
  }
  card.appendChild(strip);

  const act = el('div', 'dc-act');
  const bFal = el('button', null, 'فال حافظ');
  bFal.addEventListener('click', ev => { ev.stopPropagation(); openFal(); });
  const bAyah = el('button', null, 'آیه‌ای از قرآن');
  bAyah.addEventListener('click', ev => { ev.stopPropagation(); openAyah(); });
  const bCal = el('button', null, 'تقویم و روزها');
  bCal.addEventListener('click', ev => { ev.stopPropagation(); openDateDlg(effToday()); });
  act.append(bFal, bAyah, bCal);

  const svcRow = el('div', 'svc-row');
  const svcBtn = el('button', 'svc-btn', '🧮 خدمات — سن / یک روز خاص');
  svcBtn.type = 'button';
  onTap(svcBtn, ev => { ev.stopPropagation(); openSvc(); });
  svcRow.appendChild(svcBtn);
  card.appendChild(svcRow);
  card.appendChild(act);

  return card;
}

let homeCalTap = 0;
let calY = 0, calM = 0, calSel = 0;

function openDateDlg(jdn) {
  try { mountDP($('dpApp')); setDP($('dpApp'), d2j(jdn)); } catch (e) { /* */ }
  const j = d2j(jdn);
  calY = j.jy;
  calM = j.jm;
  calSel = jdn;
  renderCal();
  renderDateInfo();
  if (!$('dateDlg').open) $('dateDlg').show();
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

  const gName = (g) => G_MONTHS[g.gm - 1];
  const gYearTxt = (g1.gy === g2.gy) ? String(g1.gy) : (g1.gy + '–' + g2.gy);
  const gNamesTxt = (g1.gm === g2.gm) ? gName(g1) : (gName(g1) + ' – ' + gName(g2));
  const gTxt = gNamesTxt + ' ' + gYearTxt;

  const hName = (jdn) => {
    const full = hijriMonthLabel(jdn) || '';
    return full.replace(/[\u06F0-\u06F9\d]+\s*$/, '').trim();
  };
  const hYear = (jdn) => {
    const full = hijriMonthLabel(jdn) || '';
    const m = full.match(/([\u06F0-\u06F9\d]+)\s*$/);
    return m ? m[1] : '';
  };

  const h1n = hName(first), h2n = hName(first + len - 1);
  const h1y = hYear(first), h2y = hYear(first + len - 1);

  const hNamesTxt = (h1n === h2n) ? h1n : (h1n + ' – ' + h2n);
  const hYearTxt = (h1y === h2y) ? h1y : (h1y + '–' + h2y);
  const hTxt = hNamesTxt + (hYearTxt ? ' ' + hYearTxt : '');

  $('calSub').textContent = gTxt + '   ·   ' + hTxt;

  for (let i = 0; i < startIdx; i++) grid.appendChild(el('div', 'cal-cell empty'));

  for (let d = 1; d <= len; d++) {
    const jdn = first + d - 1;
    const jj = d2j(jdn);
    const gg = d2g(jdn);

    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cal-cell';
    b.dataset.jdn = String(jdn);

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

    let clicks = 0, clickTimer = null;


    grid.appendChild(b);
  }

  renderDayRem();
  renderUpcomingRems();
  bindCalGrid(grid);
}

/* ---------- تعامل با خانه‌های تقویم (سطح گرید، پایدار) ---------- */
let calHold = null;
let calLastTap = { jdn: 0, t: 0 };

function bindCalGrid(grid) {
  if (grid.dataset.bound === '1') return;
  grid.dataset.bound = '1';

  const cellOf = ev => {
    const c = ev.target.closest('.cal-cell');
    if (!c || c.classList.contains('empty') || !c.dataset.jdn) return null;
    return c;
  };

  grid.addEventListener('pointerdown', ev => {
    const c = cellOf(ev);
    if (!c) return;

    if (calHold) { clearTimeout(calHold); calHold = null; }

    calHold = setTimeout(() => {
      calHold = null;
      const j = Number(c.dataset.jdn);
      calSel = j;
      applySeason();
      renderCal();
      renderDateInfo();
      askRemind(j);
    }, 1000);
  });

  const cancelHold = () => {
    if (calHold) { clearTimeout(calHold); calHold = null; }
  };

  grid.addEventListener('pointerup', cancelHold);
  grid.addEventListener('pointercancel', cancelHold);
  grid.addEventListener('pointerleave', cancelHold);

  grid.addEventListener('click', ev => {
    const c = cellOf(ev);
    if (!c) return;

    const j = Number(c.dataset.jdn);
    const now = Date.now();

    if (calLastTap.jdn === j && now - calLastTap.t < 480) {
      calLastTap = { jdn: 0, t: 0 };
      calSel = j;
      applySeason();
      renderCal();
      renderDateInfo();
      askRemind(j);
      return;
    }

    calLastTap = { jdn: j, t: now };
    calSel = j;
    renderCal();
    renderDateInfo();
  });
}


/* ---------- سرصفحهٔ روز انتخاب‌شده (شبیه کارت خانه) ---------- */
function renderCalHero() {
  const box = $('calHero');
  if (!box) return;

  const j = d2j(calSel);
  const season = seasonOf(j.jm);

  box.textContent = '';

  const card = el('div', 'datecard ' + season);
  addSeasonFx(card, season);
  card.appendChild(buildDateHeader(calSel));

  box.appendChild(card);
}

/* گرافیک فصلی برای کل صفحهٔ تقویم */
function renderCalFx() {
  const fx = $('calFx');
  if (!fx) return;

  const j = d2j(calSel);
  const season = seasonOf(j.jm);

  fx.textContent = '';

  if (!S.d || !S.d.settings) return;
  if (S.d.settings.seasonal === false || S.d.settings.fx === false) return;

  const tmp = document.createElement('div');
  addSeasonFx(tmp, season);

  while (tmp.firstChild) fx.appendChild(tmp.firstChild);
}

function renderDateInfo() {
  renderCalHero();
  renderCalFx();
  const j = d2j(calSel);
  const box = $('dateInfo');
  box.textContent = '';

  const list = allOcc(calSel);
  box.classList.toggle('hidden', list.length === 0);

  for (const o of list) {
    const wrap = el('div');
    wrap.style.cursor = 'pointer';
    wrap.style.marginBottom = '6px';

    const t = el('div', null, o.t);
    t.style.fontWeight = '700';
    t.style.color = isRedOcc(o) ? 'var(--red)' : 'var(--ink)';
    wrap.appendChild(t);

    const d = el('div', 'hint');
    d.style.marginTop = '3px';
    d.textContent = o.d;
    wrap.appendChild(d);

    wrap.addEventListener('click', () => openOccDay(calSel));
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
  const data = window.FAL_DATA || [];
  const box = $('falText');
  const note = $('falNote');
  box.textContent = '';
  if (note) note.textContent = '';

  if (!data.length) {
    box.appendChild(el('div', 'beyt', 'دادهٔ فال در دسترس نیست.'));
    return;
  }

  const item = data[Math.floor(Math.random() * data.length)];
  const verses = item.v || [];
  verses.slice(0, 16).forEach(line => box.appendChild(el('div', 'beyt', line)));

  if (note) {
    note.textContent = (item.t || '') || ('غزل شمارهٔ ' + fa(item.n) + ' از دیوان حافظ');
  }
}

/* ---------- آیهٔ قرآن ---------- */
function showAyah() {
  const data = window.QURAN_DATA || [];
  if (!data.length) { toast('دادهٔ قرآن در دسترس نیست'); return; }

  const a = data[Math.floor(Math.random() * data.length)];
  $('ayahAr').textContent = a.ar;
  $('ayahFa').textContent = a.fa;
  $('ayahRef').textContent = a.s + ' — آیهٔ ' + fa(a.n);
}

function openAyah() {
  showAyah();
  $('ayahDlg').showModal();
}

$('falAgain').addEventListener('click', showFal);
$('falClose').addEventListener('click', () => $('falDlg').close());
$('ayahAgain').addEventListener('click', showAyah);
$('ayahClose').addEventListener('click', () => $('ayahDlg').close());


/* ---------- خدمات: سن و روز خاص ---------- */
const ANIMALS = ['موش', 'گاو', 'پلنگ', 'خرگوش', 'نهنگ', 'مار',
                 'اسب', 'گوسفند', 'میمون', 'مرغ', 'سگ', 'خوک'];

const ANIMAL_DESC = {
  'موش': 'نماد هوشمندی، زیرکی و سازگاری سریع با شرایط است.',
  'گاو': 'نماد صبر، پشتکار و تلاش آرام ولی پیوسته است.',
  'پلنگ': 'نماد شجاعت، جسارت و قدرت رهبری است.',
  'خرگوش': 'نماد مهربانی، احتیاط و آرامش‌طلبی است.',
  'نهنگ': 'نماد بزرگی، عمق اندیشه و آرامش در طوفان است.',
  'مار': 'نماد فراست، خرد پنهان و تغییر هوشمندانه است.',
  'اسب': 'نماد آزادی، انرژی، سفر و پیشرفت است.',
  'گوسفند': 'نماد مهر، همراهی و آرامش در زندگی است.',
  'میمون': 'نماد خلاقیت، بازیگوشی و یادگیری سریع است.',
  'مرغ': 'نماد بیداری، نظم و آغاز به‌موقع است.',
  'سگ': 'نماد وفاداری، مسئولیت‌پذیری و نگهبانی است.',
  'خوک': 'نماد رفاه، کوشش در تأمین معاش و بخشندگی است.'
};

const MONTH_NOTE = [
  'فروردین: آغاز سال و بیداری؛ معمولاً پرانرژی و پیش‌قدم در کارها.',
  'اردیبهشت: فصل اعتدال؛ اهل نظم و وفاداری در روابط.',
  'خرداد: فصل گرما؛ پرشور و مصمم، ولی گاهی عجول.',
  'تیر: اوج تابستان؛ پایدار و مقاوم در سختی‌ها.',
  'مرداد: گرم و پربار؛ اهل عمل و نتیجه‌گیری.',
  'شهریور: پایان تابستان؛ دقیق، صبور و اهل محاسبه.',
  'مهر: شروع پاییز؛ مهربان، مهرطلب و اهل یادگیری.',
  'آبان: میانهٔ پاییز؛ درون‌گرا، خلاق و اهل اندیشه.',
  'آذر: سردی و سکوت؛ اهل تمرکز و تصمیم‌های جدی.',
  'دی: شب‌های بلند؛ صبور، عمیق و اهل خانواده.',
  'بهمن: نزدیک به بهار؛ امیدوار و اهل تغییر.',
  'اسفند: پایان و آغاز؛ اهل خانه‌تکانی و آمادهٔ شروع تازه.'
];

function animalOfYear(jy) {
  const idx = ((jy - 1399) % 12 + 12) % 12;
  return ANIMALS[idx];
}

function ageYMD(fromJdn, toJdn) {
  const a = d2j(fromJdn);
  const b = d2j(toJdn);

  let y = b.jy - a.jy;
  let m = b.jm - a.jm;
  let d = b.jd - a.jd;

  if (d < 0) {
    m -= 1;
    const pm = b.jm === 1 ? 12 : b.jm - 1;
    const py = b.jm === 1 ? b.jy - 1 : b.jy;
    d += monthLen(py, pm);
  }
  if (m < 0) { y -= 1; m += 12; }

  return { y: y, m: m, d: d };
}

function noonDate(jdn) {
  const g = d2g(jdn);
  return new Date(g.gy, g.gm - 1, g.gd, 12, 0, 0);
}

function openSvc() {
  mountDP($('dpBirth'), 110, 0);
  mountDP($('dpSpecial'), 110, 5);
  const j = todayJalali();
  setDP($('dpBirth'), addMonths(j.jy, j.jm, j.jd, -30 * 12));
  setDP($('dpSpecial'), j);
  $('svcOut').textContent = '';
  $('svcOut').classList.remove('show');
  svcMode = 'age';
  setSvcMode('age');
  $('svcDlg').showModal();
}

let svcMode = 'age';

function setSvcMode(mode) {
  svcMode = mode;
  for (const b of $('svcSeg').children) {
    b.classList.toggle('on', b.dataset.svc === mode);
  }
  $('svcAge').classList.toggle('hidden', mode !== 'age');
  $('svcDay').classList.toggle('hidden', mode !== 'day');
}

$('svcSeg').addEventListener('click', ev => {
  const b = ev.target.closest('button[data-svc]');
  if (!b) return;
  setSvcMode(b.dataset.svc);
});

$('svcClose').addEventListener('click', () => $('svcDlg').close());

$('svcCalc').addEventListener('click', () => {
  const box = $('svcOut');
  box.textContent = '';
  box.classList.add('show');

  const dt = svcMode === 'age' ? getDP($('dpBirth')) : getDP($('dpSpecial'));
  const fromJdn = jdnOf(dt);

  if (fromJdn > todayJdn()) {
    box.appendChild(el('div', 'svc-line', 'تاریخ انتخابی در آینده است.'));
    return;
  }

  const now = new Date();
  const start = noonDate(fromJdn);
  const ms = now - start;
  const days = Math.floor(ms / 86400000);
  const age = ageYMD(fromJdn, todayJdn());

  const totalSec = Math.floor(ms / 1000);
  const totalMin = Math.floor(totalSec / 60);

  const mk = (k, v) => {
    const row = el('div', 'svc-line');
    row.appendChild(el('span', 'svc-k', k));
    row.appendChild(el('span', 'svc-v', v));
    return row;
  };

  const title = el('div', 'svc-title');
  title.textContent = svcMode === 'age'
    ? 'سن شما'
    : 'گذشته از ' + dateLabel(dt);
  box.appendChild(title);

  if (svcMode === 'age') {
    box.appendChild(mk('سن', fa(age.y) + ' سال و ' + fa(age.m) + ' ماه و ' + fa(age.d) + ' روز'));
  } else {
    box.appendChild(mk('مدت', fa(age.y) + ' سال و ' + fa(age.m) + ' ماه و ' + fa(age.d) + ' روز'));
  }

  box.appendChild(mk('روزها', NUM.format(days) + ' روز'));
  box.appendChild(mk('دقیقه‌ها', NUM.format(totalMin) + ' دقیقه'));
  box.appendChild(mk('ثانیه‌ها', NUM.format(totalSec) + ' ثانیه'));

  if (svcMode === 'age') {
    const leap = isLeapJalali(dt.jy);
    const animal = animalOfYear(dt.jy);

    const info = el('div', 'svc-info');
    info.appendChild(el('div', 'svc-info-t', 'دربارهٔ سال تولد'));
    info.appendChild(el('div', null,
      'سال ' + fa(dt.jy) + (leap ? ' کبیسه بود (۳۶۶ روز).' : ' کبیسه نبود (۳۶۵ روز).')));
    info.appendChild(el('div', null, 'نماد سال در گاه‌شماری ایرانی: ' + animal));
    info.appendChild(el('div', 'svc-small', ANIMAL_DESC[animal] || ''));
    info.appendChild(el('div', 'svc-small', MONTH_NOTE[dt.jm - 1] || ''));
    box.appendChild(info);
  } else {
    const info = el('div', 'svc-info');
    info.appendChild(el('div', 'svc-info-t', 'یادآوری'));
    info.appendChild(el('div', 'svc-small',
      'مبنا: ساعت ۱۲ ظهر همان روز. زمان طی‌شده با همین مبنا محاسبه شده است.'));
    box.appendChild(info);
  }
});



/* ---------- مخفی‌کردن دکمهٔ + هنگام خواندن گزارش ---------- */
(function () {
  let t = null;

  const show = () => {
    const f = $('fab');
    if (f) f.classList.remove('hidden-fab');
  };

  const hide = () => {
    const f = $('fab');
    if (f) f.classList.add('hidden-fab');
  };

  document.addEventListener('pointerdown', ev => {
    if (ev.target.closest('#fab')) return;

    t = setTimeout(hide, 320);
  }, { passive: true });

  document.addEventListener('pointerup', () => {
    if (t) { clearTimeout(t); t = null; }
    show();
  }, { passive: true });

  document.addEventListener('pointercancel', () => {
    if (t) { clearTimeout(t); t = null; }
    show();
  }, { passive: true });

  document.addEventListener('scroll', show, { passive: true });
})();


/* ---------- ستارهٔ الزامی: بعد از عنوان، کمی بالاتر ---------- */
(function () {
  const place = (el, star) => {
    // اولین گرهٔ متنیِ خودِ label/legend را پیدا کن و ستاره را بعدش بگذار
    let node = null;
    for (const n of el.childNodes) {
      if (n.nodeType === 3 && n.nodeValue && n.nodeValue.trim()) { node = n; break; }
    }
    if (node) {
      el.insertBefore(star, node.nextSibling);
    } else {
      el.insertBefore(star, el.firstChild);
    }
  };

  document.querySelectorAll('label, legend').forEach(el => {
    let r = el.querySelector('.req');

    if (!r) {
      // ستارهٔ متنی بدون کلاس
      for (const n of Array.from(el.childNodes)) {
        if (n.nodeType === 3 && n.nodeValue && n.nodeValue.indexOf('*') >= 0) {
          n.nodeValue = n.nodeValue.replace('*', '');
          r = document.createElement('span');
          r.className = 'req';
          r.textContent = '*';
          break;
        }
      }
    }

    if (r) place(el, r);
  });
})();


/* ---------- حالت لمس: تک یا دو کلیک ---------- */
function dblTapOn() {
  if (S.d && S.d.settings && S.d.settings.tapMode) return S.d.settings.tapMode !== 'single';
  return !(S.d && S.d.settings && S.d.settings.dblTap === false);
}

function onTap(el, fn) {
  if (!el) return;

  let last = 0;

  el.addEventListener('click', ev => {
    if (!dblTapOn()) { fn(ev); return; }

    const now = Date.now();

    if (now - last < 420) {
      last = 0;
      fn(ev);
      return;
    }

    last = now;
    maybeSuggestSingleTap(el);
  });
}


/* ---------- جستجوی پایدار (کیبورد و فوکوس حفظ می‌شود) ---------- */
var SEARCH_CTX = null;

function useSearch(key, placeholder, onChange, fields) {
  const bar = $('searchBar');
  const inp = $('searchInput');
  const sel = $('searchField');

  if (!bar || !inp) return;

  SEARCH_CTX = { key: key, onChange: onChange, fields: fields || [] };

  bar.classList.remove('hidden');
  inp.placeholder = placeholder || 'جستجو…';

  const ds = $('dateSearch');
  const inp0 = $('searchInput');
  if (ds && inp0) {
    const isDate = (S.sel[key] || 'all') === 'date';
    ds.classList.toggle('hidden', !isDate);
    inp0.classList.toggle('hidden', isDate);
  }

  if (sel) {
    const list = [{ v: 'all', t: 'همه فیلدها' }].concat(fields || []);
    const sig = list.map(x => x.v).join(',');

    if (sel.dataset.sig !== sig) {
      sel.textContent = '';
      list.forEach(f => {
        const o = document.createElement('option');
        o.value = f.v;
        o.textContent = f.t;
        sel.appendChild(o);
      });
      sel.dataset.sig = sig;
    }

    sel.value = S.sel[key] || 'all';
  }

  const cur = {
    chq: S.chqQuery, tx: S.txQuery, acc: S.accQuery, loan: S.loanQuery
  }[key] || '';

  if (inp.value !== cur) inp.value = cur;
}

/* انتخاب فیلد → اعمال دوبارهٔ جستجو */
function initSearchField() {
  const sel = $('searchField');
  if (!sel) return;

  sel.addEventListener('change', () => {
    if (!SEARCH_CTX) return;

    S.sel[SEARCH_CTX.key] = sel.value;

    const ds = $('dateSearch');
    const inp = $('searchInput');
    const isDate = sel.value === 'date';

    if (ds) ds.classList.toggle('hidden', !isDate);
    if (inp) inp.classList.toggle('hidden', isDate);

    if (isDate) {
      $('searchInput').value = '';
      SEARCH_CTX.onChange('');
    } else {
      SEARCH_CTX.onChange($('searchInput').value);
    }
  });
}

function hideSearch() {
  const bar = $('searchBar');
  if (bar) bar.classList.add('hidden');
  SEARCH_CTX = null;
}

initSearchField();

function initSearchBar() {
  const inp = $('searchInput');
  const clr = $('searchClear');
  if (!inp) return;

  inp.addEventListener('input', () => {
    if (!SEARCH_CTX) return;
    SEARCH_CTX.onChange(inp.value);
  });

  if (clr) {
    clr.addEventListener('click', () => {
      inp.value = '';
      if (SEARCH_CTX) SEARCH_CTX.onChange('');
      inp.focus();
    });
  }
}

initSearchBar();


/* ---------- پالت رنگی ---------- */
const PALETTES = [
  ['standard', 'استاندارد', '#4f46e5', '#7c3aed'],
  ['ocean', 'اقیانوس', '#0e7490', '#0284c7'],
  ['emerald', 'زمرد', '#047857', '#16a34a'],
  ['sunset', 'غروب', '#c2410c', '#f59e0b'],
  ['violet', 'بنفش', '#6d28d9', '#a855f7'],
  ['turquoise', 'فیروزه', '#0f766e', '#06b6d4'],
  ['wine', 'شرابی', '#9f1239', '#e11d48'],
  ['slate', 'خاکستری', '#334155', '#64748b']
];

function applyPalette() {
  const name = (S.d && S.d.settings && S.d.settings.palette) || 'standard';
  document.documentElement.setAttribute('data-palette', name);

  // اگر رنگ‌بندی فصلی روشن باشد، فصل اولویت دارد مگر تم «استاندارد» انتخاب شده باشد
  if (typeof applySeason === 'function') applySeason();
}

function renderPaletteGrid() {
  const box = $('paletteGrid');
  if (!box) return;

  const cur = (S.d && S.d.settings && S.d.settings.palette) || 'standard';
  box.textContent = '';

  for (const [id, label, c1, c2] of PALETTES) {
    const b = el('button', 'pal-swatch' + (cur === id ? ' on' : ''));
    b.type = 'button';
    b.style.background = 'linear-gradient(135deg,' + c1 + ',' + c2 + ')';
    b.appendChild(el('span', null, label));

    b.addEventListener('click', () => {
      S.d.settings.palette = id;
      save();
      applyPalette();
      renderPaletteGrid();
      render();
      toast('تم «' + label + '» انتخاب شد');
    });

    box.appendChild(b);
  }
}

/* ---------- حالت کلیک (تک/دو) ---------- */
function tapMode() {
  return (S.d && S.d.settings && S.d.settings.tapMode) || 'double';
}

function setTapModeUI() {
  const seg = $('tapModeSeg');
  if (!seg) return;

  for (const b of seg.children) {
    b.classList.toggle('on', b.dataset.tap === tapMode());
  }
}

/* پیشنهاد تک‌کلیکی بعد از سه تلاش */
let tapTries = { el: null, n: 0, t: 0 };

function maybeSuggestSingleTap(el) {
  if (tapMode() !== 'double') return;
  if (!S.d || !S.d.settings || S.d.settings.tapHint === false) return;

  const now = Date.now();

  if (tapTries.el !== el || now - tapTries.t > 2600) {
    tapTries = { el: el, n: 0, t: now };
  }

  tapTries.n += 1;
  tapTries.t = now;

  if (tapTries.n >= 3) {
    tapTries = { el: null, n: 0, t: 0 };
    showTapHint();
  }
}

function showTapHint() {
  let dlg = document.getElementById('tapHintDlg');

  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.id = 'tapHintDlg';
    dlg.innerHTML =
      '<form method="dialog">' +
      '<h2 style="text-align:center">یک کلیک کافی باشد؟</h2>' +
      '<p class="hint" style="text-align:center">به نظر می‌رسد چند بار تک‌کلیک کردی. ' +
      'می‌خواهی منوها با یک کلیک باز شوند؟</p>' +
      '<div class="dact" style="flex-direction:column;gap:8px">' +
      '<button type="button" class="primary block" id="tapYes">بله، تک‌کلیک کن</button>' +
      '<button type="button" class="block" id="tapNo">نه، دو کلیک بماند</button>' +
      '<button type="button" class="block" id="tapDont">دیگر پیشنهاد نده</button>' +
      '</div></form>';
    document.body.appendChild(dlg);

    dlg.querySelector('#tapYes').addEventListener('click', () => {
      S.d.settings.tapMode = 'single';
      save(); setTapModeUI(); dlg.close();
      toast('از این به بعد با یک کلیک باز می‌شود');
    });

    dlg.querySelector('#tapNo').addEventListener('click', () => dlg.close());

    dlg.querySelector('#tapDont').addEventListener('click', () => {
      S.d.settings.tapHint = false;
      save();
      const c = $('tapHintChk');
      if (c) c.checked = false;
      dlg.close();
      toast('پیشنهاد غیرفعال شد');
    });
  }

  dlg.showModal();
}



/* ================= نام کاربر ================= */
function userName() {
  return (S.d && S.d.settings && S.d.settings.name) ? String(S.d.settings.name).trim() : '';
}

/* پرسیدن نام در اولین اجرا (اجباری) */
function askName(firstTime) {
  let dlg = document.getElementById('nameDlg');

  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.id = 'nameDlg';
    dlg.innerHTML =
      '<form method="dialog">' +
      '<div class="wel-head"><div class="wel-title">به MyC خوش آمدی 🌱</div>' +
      '<div class="wel-date">لطفاً نام خودت را بنویس تا در پیام‌ها با نام تو سلام کنم.</div></div>' +
      '<input id="nameInput" type="text" maxlength="24" placeholder="نام شما" ' +
      'style="width:100%;padding:12px;border-radius:14px;border:1px solid var(--line);background:var(--soft);font-family:inherit;font-size:15px;text-align:center">' +
      '<div class="dact" style="margin-top:10px">' +
      '<button type="button" class="primary block" id="nameOk">ذخیره و ادامه</button>' +
      '</div></form>';
    document.body.appendChild(dlg);

    dlg.querySelector('#nameOk').addEventListener('click', () => {
      const v = dlg.querySelector('#nameInput').value.trim();

      if (v.length < 2) {
        toast('نام را کامل بنویس');
        dlg.querySelector('#nameInput').focus();
        return;
      }

      S.d.settings.name = v;
      save();
      dlg.close();
      toast('خوش آمدی ' + v + ' جان');
    });
  }

  const inp = dlg.querySelector('#nameInput');
  inp.value = userName();

  dlg.showModal();
  setTimeout(() => { try { inp.focus(); } catch (e) { } }, 200);
}

/* ================= پیام خوش‌آمد ================= */
function welcomeItems() {
  const t = todayJdn();
  const list = [];

  for (const c of (S.d.cheques || [])) {
    if (c.status === 'cleared' || c.status === 'bounced' || c.status === 'void') continue;
    const d = jdnOf(c) - t;
    if (d < 0 || d > 1) continue;
    list.push({
      kind: 'cheque',
      jdn: jdnOf(c),
      d: d,
      title: (c.kind === 'in' ? 'چک دریافتی' : 'چک صادره') + ' — ' + (c.party || ''),
      amount: c.amount,
      ref: c
    });
  }

  for (const l of (S.d.loans || [])) {
    for (const inst of (l.installments || [])) {
      if (inst.paid) continue;
      const d = jdnOf(inst) - t;
      if (d < 0 || d > 1) continue;
      list.push({
        kind: 'loan',
        jdn: jdnOf(inst),
        d: d,
        title: 'قسط ' + l.title,
        amount: inst.amount,
        ref: l
      });
    }
  }

  return list.sort((a, b) => a.d - b.d);
}

function showWelcome() {
  if (!S.d || !S.d.settings) return;
  if (S.d.settings.welcome === false) return;

  const items = welcomeItems();
  if (!items.length) return;

  const dlg = $('welcomeDlg');
  if (!dlg) return;

  const nm = userName();
  const nmEl = $('welName');
  if (nmEl) nmEl.textContent = nm ? (nm + ' جان 👋') : '👋';

  const j = d2j(todayJdn());
  $('welDate').textContent = WEEK_NAMES[weekIndex(todayJdn())] + ' • ' + fa(j.jd) + ' ' + MONTHS[j.jm - 1] + ' ' + fa(j.jy);

  const box = $('welList');
  box.textContent = '';

  for (const it of items.slice(0, 6)) {
    const row = el('div', 'wel-item ' + (it.d === 0 ? 'today' : 'tomorrow'));
    const dot = el('span', 'wel-dot', it.d === 0 ? 'امروز' : 'فردا');
    const t = el('div', 'wel-t', it.title);
    const a = el('div', 'wel-a', NUM.format(it.amount));
    row.append(dot, t, a);
    box.appendChild(row);
  }

  $('welShow').onclick = () => {
    dlg.close();
    S.tab = 'obl';
    S.oblTab = items[0].kind === 'cheque' ? 'cheques' : 'loans';
    render();
  };

  $('welClose').onclick = () => dlg.close();

  dlg.showModal();
}

/* ================= فلش‌های اسکرول ================= */
function scrollHost() {
  const v = $('view');
  if (v && v.scrollHeight > v.clientHeight + 40) return v;
  return document.scrollingElement || document.documentElement;
}

function updateScrollNav() {
  const nav = $('scrollNav');
  if (!nav) return;

  if (!S.d || !S.d.settings || S.d.settings.scrollHint === false) {
    nav.classList.add('hidden');
    return;
  }

  const host = scrollHost();
  const top = host.scrollTop || window.scrollY || 0;
  const max = (host.scrollHeight - host.clientHeight) || 1;

  const canUp = top > 20;
  const canDown = top < max - 20;

  $('scrollUp').classList.toggle('hidden', !canUp);
  $('scrollDown').classList.toggle('hidden', !canDown);

  nav.classList.toggle('hidden', !(canUp || canDown));
}

function bindScrollNav() {
  const up = $('scrollUp');
  const down = $('scrollDown');
  if (!up || !down) return;

  const host = () => scrollHost();

  up.addEventListener('click', () => {
    const h2 = host();
    (h2 === document.documentElement ? window : h2).scrollBy({ top: -420, behavior: 'smooth' });
    setTimeout(updateScrollNav, 450);
  });

  down.addEventListener('click', () => {
    const h2 = host();
    (h2 === document.documentElement ? window : h2).scrollBy({ top: 420, behavior: 'smooth' });
    setTimeout(updateScrollNav, 450);
  });

  const onScroll = () => updateScrollNav();

  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('scroll', onScroll, { passive: true, capture: true });

  const v = $('view');
  if (v) v.addEventListener('scroll', onScroll, { passive: true });

  const dlg = $('dateDlg');
  if (dlg) {
    const f = dlg.querySelector('form');
    if (f) f.addEventListener('scroll', onScroll, { passive: true });
  }

  setInterval(onScroll, 1200);
}

/* ================= جستجوی تاریخ ================= */
function buildDateSearch() {
  const y = $('dsY'), m = $('dsM'), d = $('dsD');
  if (!y || !m || !d) return;

  const now = todayJalali().jy;

  y.textContent = '';
  y.add(new Option('سال', ''));
  for (let i = now; i >= now - 10; i--) y.add(new Option(fa(i), String(i)));

  m.textContent = '';
  m.add(new Option('ماه', ''));
  MONTHS.forEach((n, i) => m.add(new Option(n, String(i + 1))));

  const fill = () => {
    const yv = Number(y.value || 0);
    const mv = Number(m.value || 0);

    d.textContent = '';
    d.add(new Option('روز', ''));

    const len = (yv && mv) ? monthLen(yv, mv) : 31;
    for (let i = 1; i <= len; i++) d.add(new Option(fa(i), String(i)));
  };

  fill();
  y.onchange = () => { fill(); applyDateSearch(); };
  m.onchange = () => { fill(); applyDateSearch(); };
  d.onchange = applyDateSearch;
}

function applyDateSearch() {
  if (!SEARCH_CTX) return;

  const y = $('dsY').value;
  const m = $('dsM').value;
  const d = $('dsD').value;

  const parts = [];
  if (y) parts.push(y);
  if (m) parts.push(String(Number(m)));
  if (d) parts.push(String(Number(d)));

  const q = parts.join('/');
  $('searchInput').value = q;
  SEARCH_CTX.onChange(q);
}

/* ---------- رنگ نوار سیستم (دکمه‌های پایین) ---------- */
function syncSystemBars() {
  try {
    if (!window.AndroidAqsat || !AndroidAqsat.setBars) return;

    const cs = getComputedStyle(document.documentElement);
    const brand = (cs.getPropertyValue('--brand') || '#4f46e5').trim();
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';

    // در حالت تیره نوار تیره‌تر، در روشن از رنگ برند استفاده می‌شود
    const barColor = dark ? '#0d1017' : brand;

    // آیکن‌های روشن روی پس‌زمینهٔ رنگی (سفید) و در تیره هم سفید
    AndroidAqsat.setBars(barColor, false);
  } catch (e) { /* */ }
}

bindScrollNav();
buildDateSearch();
updateScrollNav();

/* ---------- اندازهٔ فونت ---------- */
function applyFontScale() {
  const v = clamp(parseInt(S.d.settings.fontScale, 10) || 5, 1, 10);
  const zoom = 0.86 + (v - 1) * (0.42 / 9);
  document.documentElement.style.zoom = zoom.toFixed(3);
}

/* ---------- ۸) رندر ---------- */
const view = $('view');

function render() {
  try { renderCore(); } finally { restoreSearchFocus(); }
  setTimeout(function () { try { updateScrollNav(); } catch (e) { } }, 60);
}

function renderCore() {
  hideSearch();
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
    ['red', 'red', 'فردا، امروز و گذشته'],
    ['yellow', 'yellow', '۲ تا ۳ روز آینده'],
    ['orange', 'orange', '۴ تا ۵ روز آینده']
  ];

  if (!counts.red && !counts.yellow && !counts.orange) box.classList.add('hide');

  for (const [bucket, cls, label] of defs) {
    const r = ringRow(label, cls);
    r.dot.textContent = fa(counts[bucket]);
    if (!counts[bucket]) r.wrap.style.opacity = '.45';

    let tapTimer = null;

    r.wrap.addEventListener('click', () => {
      if (tapTimer) {
        clearTimeout(tapTimer);
        tapTimer = null;
        openRing(bucket);
        return;
      }

      tapTimer = setTimeout(() => {
        tapTimer = null;
        openDateDlg(effToday());
      }, 280);
    });

    box.appendChild(r.wrap);
  }
  return box;
}

let currentRingBucket = 'red';

function openRing(bucket) {
  currentRingBucket = bucket;
  const items = dueItems().filter(x => bucketOf(x.days) === bucket);
  if (!items.length) return;
  const titles = { red: 'امروز، فردا و گذشته', yellow: '۲ تا ۳ روز آینده', orange: '۴ تا ۵ روز آینده' };
  $('ringTitle').textContent = titles[bucket] + ' — ' + fa(items.length) + ' مورد';

  const list = $('ringList');
  list.textContent = '';
  for (const x of items) {
    list.appendChild(dueRow(x, true));
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

function dueRow(x, withActs) {
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
  const acts = el('div', 'rowacts');

  const bSeen = el('button', 'mini', '✓');
  bSeen.title = 'دیده شد';
  bSeen.addEventListener('click', ev => {
    ev.stopPropagation();
    markSeen(x);
    if ($('ringDlg').open) closeRing();
    toast('این مورد دیگر اعلان نمی‌دهد');
  });

  S.d.settings.muted = S.d.settings.muted || {};
  const mutedNow = !!S.d.settings.muted[baseIdOf(x)];

  const bMute = el('button', 'mini' + (mutedNow ? ' off' : ''), mutedNow ? '🔔' : '🔕');
  bMute.title = mutedNow ? 'روشن کردن اعلان' : 'خاموش کردن اعلان';
  bMute.addEventListener('click', ev => {
    ev.stopPropagation();

    const key = baseIdOf(x);
    if (S.d.settings.muted[key]) {
      delete S.d.settings.muted[key];
      toast('اعلان این مورد روشن شد');
    } else {
      S.d.settings.muted[key] = 1;
      toast('اعلان این مورد خاموش شد');
    }

    save();
    scheduleNotifications();

    if ($('ringDlg').open) openRing(currentRingBucket);
  });

  if (withActs) {
    acts.append(bSeen, bMute);
    main.appendChild(acts);
  }
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
  useSearch('tx', 'جستجو…', v => { S.txQuery = v; render(); }, [
    { v: 'cat', t: 'موضوع / دسته' },
    { v: 'note', t: 'توضیحات' },
    { v: 'amount', t: 'مبلغ' },
    { v: 'date', t: 'تاریخ' },
    { v: 'kind', t: 'نوع (درآمد/هزینه)' }
  ]);
  view.textContent = '';

  view.appendChild(listTools({
    segs: [['all', 'همه'], ['expense', 'هزینه‌ها'], ['income', 'درآمدها']],
    value: S.txFilter,
    onSeg: v => { S.txFilter = v; render(); },
    sorts: [['date', 'تاریخ'], ['amount', 'مبلغ'], ['cat', 'نام']],
    sort: S.txSort,
    dir: S.txDir,
    onSort: v => { S.txSort = v; render(); },
    onDir: () => { S.txDir = -S.txDir; render(); },
    search: false,
    range: rangeChips('tx', S.txRange)
  }));

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

  const txR = rangeOf(S.txRange, S.txCustom);
  items = items.filter(x => inRangeJ(jdnOf(x), txR));

  if (S.txQuery && S.txQuery.trim()) {
    items = items.filter(x => {
      const map = {
        cat: x.cat, note: x.note, amount: x.amount,
        date: jDateStr(x) + ' ' + dateLabel(x),
        kind: x.type === 'income' ? 'درآمد' : 'هزینه'
      };
      const selKey = S.sel.tx || 'all';
      const vals = selKey === 'all' ? Object.values(map) : [map[selKey]];
      return qMatch(S.txQuery, vals);
    });
  }

  const catKey = x => (x.cat || '').charCodeAt(0) || 0;

  if (S.txSort === 'amount') items.sort(sortBy(S.txDir, x => x.amount));
  else if (S.txSort === 'cat') items.sort(sortBy(S.txDir, catKey));
  else items.sort(sortBy(S.txDir, x => jdnOf(x)));

  view.appendChild(listSum(items.length, 'فقره'));

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
  const isIn = x.type === 'income';
  const ico = el('div', 'ico arrow ' + (isIn ? 'green' : 'red'));
  ico.appendChild(arrowSvg(isIn));
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
  const defs = [['cheques', 'چک‌ها'], ['loans', 'اقساط'], ['accounts', 'طلب و بدهی']];
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
  useSearch('loan', 'جستجو…', v => { S.loanQuery = v; render(); }, [
    { v: 'title', t: 'نام وام' },
    { v: 'bank', t: 'بانک' },
    { v: 'amount', t: 'مبلغ' }
  ]);
  view.appendChild(listTools({
    sorts: [['date', 'تاریخ شروع'], ['amount', 'مبلغ'], ['end', 'تاریخ پایان'], ['bank', 'بانک']],
    sort: S.loanSort,
    dir: S.loanDir,
    onSort: v => { S.loanSort = v; render(); },
    onDir: () => { S.loanDir = -S.loanDir; render(); },
    toggle: true,
    toggleLabel: 'فقط وام‌های تسویه‌شده',
    toggleValue: S.loanSettled,
    onToggle: v => { S.loanSettled = v; render(); },
    search: false,
    range: rangeChips('loan', S.loanRange)
  }));

  if (!S.d.loans.length) {
    const e = el('div', 'empty');
    e.innerHTML = '<b>وامی ثبت نشده</b>با دکمهٔ + اولین وام را بساز.';
    view.appendChild(e);
    return;
  }
  let loans = S.d.loans.slice();

  if (S.loanQuery && S.loanQuery.trim()) {
    loans = loans.filter(l => qMatch(S.loanQuery, [
      l.title, l.note,
      (l.installments || []).reduce((s2, i) => s2 + i.amount, 0),
      (l.installments || []).map(i => jDateStr(i)).join(' ')
    ]));
  }

  const info = l => {
    const inst = l.installments || [];
    const startJ = inst.length ? Math.min.apply(null, inst.map(jdnOf)) : 0;
    const endJ = inst.length ? Math.max.apply(null, inst.map(jdnOf)) : 0;
    const totalAmt = inst.reduce((s2, i) => s2 + i.amount, 0);
    const settled = inst.length > 0 && inst.every(i => i.paid);
    const bank = (l.note || "").trim();
    return { startJ: startJ, endJ: endJ, totalAmt: totalAmt, settled: settled, bank: bank };
  };

  if (S.loanSettled) loans = loans.filter(l => info(l).settled);

  const loanR = rangeOf(S.loanRange, S.loanCustom);
  if (loanR.mode !== 'all') loans = loans.filter(l => inRangeJ(info(l).startJ, loanR) || inRangeJ(info(l).endJ, loanR));

  if (S.loanSort === "amount") loans.sort(sortBy(S.loanDir, l => info(l).totalAmt));
  else if (S.loanSort === "end") loans.sort(sortBy(S.loanDir, l => info(l).endJ));
  else if (S.loanSort === "bank") loans.sort(sortBy(S.loanDir, l => (info(l).bank.charCodeAt(0) || 0)));
  else loans.sort(sortBy(S.loanDir, l => info(l).startJ));

  view.appendChild(listSum(loans.length, 'وام'));

  if (!loans.length) {
    const e = el("div", "empty");
    e.innerHTML = "<b>وامی با این فیلتر نیست</b>فیلتر یا مرتب‌سازی را عوض کن.";
    view.appendChild(e);
    return;
  }

  for (const loan of loans) {
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

  /* نمودار میله‌ای: پرداخت‌شده (سبز) و روزهای مانده تا قسط بعد (قرمز) */
  const total = loan.installments.length || 1;
  const nextUnpaid = loan.installments
    .filter(i => !i.paid)
    .sort((a, b) => jdnOf(a) - jdnOf(b))[0];
  const daysLeft = nextUnpaid ? Math.max(0, jdnOf(nextUnpaid) - effToday()) : 0;

  const barsCard = el('div', 'card pad');
  const bh = el('div', 'mhead');
  bh.style.margin = '0 0 8px';
  bh.appendChild(el('span', null, 'وضعیت اقساط'));
  barsCard.appendChild(bh);

  const mkBar = (label, value, max, cls, extra) => {
    const line = el('div', 'cmpbar');
    line.appendChild(el('span', 'cmpl', label));
    const track = el('div', 'cmp-track');
    const fill = el('i', 'cmp-fill ' + cls);
    fill.style.width = '0%';
    track.appendChild(fill);
    line.appendChild(track);
    line.appendChild(el('span', 'cmpv', extra));
    barsCard.appendChild(line);
    const pct = Math.max(2, Math.min(100, Math.round(value / max * 100)));
    requestAnimationFrame(() => { fill.style.width = pct + '%'; });
  };

  mkBar('اقساط پرداخت‌شده', paid, total, 'in', fa(paid) + ' از ' + fa(total));
  mkBar('روز تا قسط بعدی', Math.min(daysLeft, 30), 30, 'out', nextUnpaid ? fa(daysLeft) + ' روز' : '—');

  view.appendChild(barsCard);

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
  const listBox = el('div', 'listbox');

  const draw = () => {
    let items = S.d.cheques.slice();

    if (S.chqFilter !== 'all') items = items.filter(c => c.kind === S.chqFilter);

    const chqR = rangeOf(S.chqRange, S.chqCustom);
    items = items.filter(c => inRangeJ(jdnOf(c), chqR));

    if (S.chqQuery && S.chqQuery.trim()) {
      items = items.filter(c => {
        const map = {
          party: c.party, number: c.number, bank: c.bank, amount: c.amount,
          date: jDateStr(c) + ' ' + dateLabel(c), reason: c.reason,
          sayad: c.sayad, iban: c.iban, account: c.account, nid: c.nid
        };
        const selKey = S.sel.chq || 'all';
        const vals = selKey === 'all' ? Object.values(map) : [map[selKey]];
        return qMatch(S.chqQuery, vals);
      });
    }

    const byDate = c => jdnOf(c);
    const byAmount = c => c.amount;
    const byName = c => (c.party || '').charCodeAt(0) || 0;

    if (S.chqSort === 'amount') items.sort(sortBy(S.chqDir, byAmount));
    else if (S.chqSort === 'party') items.sort(sortBy(S.chqDir, byName));
    else items.sort(sortBy(S.chqDir, byDate));

    listBox.textContent = '';
    listBox.appendChild(listSum(items.length, 'فقره چک'));

    if (!items.length) {
      const e = el('div', 'empty');
      e.innerHTML = '<b>چکی با این فیلتر نیست</b>فیلتر، بازه یا جستجو را عوض کن.';
      listBox.appendChild(e);
      return;
    }

    const t = todayJdn();

    for (const c of items) {
      const d = jdnOf(c) - t;

      let dueCls = '';
      if (c.status === 'open' || c.status === 'deposited') {
        if (d < 0) dueCls = ' due-past';
        else if (d === 0) dueCls = ' due-today';
        else if (d === 1) dueCls = ' due-1';
        else if (d <= 3) dueCls = ' due-23';
        else if (d <= 5) dueCls = ' due-45';
      }

      const row = el('div', 'item' + dueCls);

      const ico = el('div', 'ico arrow ' + (c.kind === 'in' ? 'green' : 'red'));
      ico.appendChild(arrowSvg(c.kind === 'in'));

      const main = el('div', 'main');
      main.appendChild(el('div', 't', c.party));

      const m = el('div', 'm');
      m.appendChild(el('span', null, dateLabel(c)));

      const kindPill = el('span', 'pill ' + (c.kind === 'in' ? 'ok' : 'late'), c.kind === 'in' ? 'دریافتی' : 'صادره');
      kindPill.style.fontWeight = '800';
      m.appendChild(kindPill);
      m.appendChild(el('span', 'pill info', CHQ_STATUS[c.status] || c.status));
      if (c.status === 'open') m.appendChild(el('span', null, daysLabel(d)));
      main.appendChild(m);

      const amt = el('div', 'amt', NUM.format(c.amount));
      row.append(ico, main, amt);

      const cam = el('span', 'camico' + (c.photo ? ' has' : ' no'), '📷');
      cam.title = c.photo ? 'تصویر چک موجود است' : 'تصویر چک ندارد';
      if (c.photo) cam.addEventListener('click', ev => { ev.stopPropagation(); openImage(c.photo); });
      row.appendChild(cam);

      if (!c.confirmed) {
        const w = el('span', 'warnico', '⚠');
        w.title = 'در سامانهٔ صیاد ثبت/تأیید نشده';
        w.addEventListener('click', ev => {
          ev.stopPropagation();
          toast('این چک در سامانهٔ صیاد تأیید نشده است');
        });
        row.appendChild(w);
      }

      row.addEventListener('click', () => openCheque(c));
      listBox.appendChild(row);
    }
  };

  view.appendChild(listTools({
    segs: [['in', 'چک‌های دریافتی'], ['out', 'چک‌های صادره'], ['all', 'همهٔ چک‌ها']],
    value: S.chqFilter,
    onSeg: v => { S.chqFilter = v; draw(); },
    sorts: [['date', 'تاریخ'], ['amount', 'مبلغ'], ['party', 'نام']],
    sort: S.chqSort,
    dir: S.chqDir,
    onSort: v => { S.chqSort = v; draw(); },
    onDir: () => { S.chqDir = -S.chqDir; draw(); },
    search: false,
    range: rangeChips('chq', S.chqRange, draw)
  }));

  useSearch('chq', 'جستجو…', v => { S.chqQuery = v; draw(); }, [
    { v: 'party', t: 'نام طرف حساب' },
    { v: 'number', t: 'شماره چک' },
    { v: 'bank', t: 'بانک' },
    { v: 'amount', t: 'مبلغ' },
    { v: 'date', t: 'تاریخ' },
    { v: 'reason', t: 'توضیحات / بابت' },
    { v: 'sayad', t: 'شناسهٔ صیاد' },
    { v: 'iban', t: 'شبا' },
    { v: 'account', t: 'شماره حساب' },
    { v: 'nid', t: 'کد ملی' }
  ]);

  view.appendChild(listBox);
  draw();
}

function renderAccounts() {
  useSearch('acc', 'جستجو…', v => { S.accQuery = v; render(); }, [
    { v: 'name', t: 'نام' },
    { v: 'amount', t: 'مبلغ' },
    { v: 'date', t: 'تاریخ' },
    { v: 'note', t: 'توضیحات' }
  ]);
  view.appendChild(listTools({
    segs: [['all', 'همه'], ['receivable', 'طلب‌ها'], ['payable', 'بدهی‌ها']],
    value: S.accFilter,
    onSeg: v => { S.accFilter = v; render(); },
    sorts: [['date', 'تاریخ'], ['amount', 'مبلغ'], ['name', 'نام']],
    sort: S.accSort,
    dir: S.accDir,
    onSort: v => { S.accSort = v; render(); },
    onDir: () => { S.accDir = -S.accDir; render(); },
    search: false,
    range: rangeChips('acc', S.accRange)
  }));

  let items = S.d.accounts.slice();

  if (S.accFilter !== 'all') items = items.filter(a => a.kind === S.accFilter);

  const accR = rangeOf(S.accRange, S.accCustom);
  items = items.filter(a => inRangeJ(a.due ? jdnOf(a.due) : jdnOf(a), accR));

  if (S.accQuery) {
    items = items.filter(a => {
      const map = {
        name: a.name, note: a.note, amount: a.amount,
        date: (a.due ? jDateStr(a.due) + ' ' + dateLabel(a.due) : '')
      };
      const selKey = S.sel.acc || 'all';
      const vals = selKey === 'all' ? Object.values(map) : [map[selKey]];
      return qMatch(S.accQuery, vals);
    });
  }

  const dueJ = a => (a.due ? jdnOf(a.due) : 0);
  const nameKey = a => (a.name || '').charCodeAt(0) || 0;

  if (S.accSort === 'amount') items.sort(sortBy(S.accDir, a => a.amount));
  else if (S.accSort === 'name') items.sort(sortBy(S.accDir, nameKey));
  else items.sort(sortBy(S.accDir, dueJ));

  view.appendChild(listSum(items.length, 'فقره'));

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
    const ico = el('div', 'ico acc arrow ' + (a.kind === 'receivable' ? 'green' : 'red'));
    ico.appendChild(arrowSvg(a.kind === 'receivable'));
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

  const y = Math.floor(ym / 100);
  const m = ym % 100;

  const period = S.repPeriod || 'month';   // month | year
  const mode = S.repMode || 'none';        // none | cmp

  /* ---------- دکمه‌های گزارش ---------- */
  const repBtns = el('div', 'row-btns');
  repBtns.style.margin = '0 0 8px';

  const bText = el('button', 'btn ghost', '📝 گزارش متنی');
  bText.type = 'button';
  bText.addEventListener('click', () => openReportText('all'));

  const bWord = el('button', 'btn ghost', '📄 خروجی ورد');
  bWord.type = 'button';
  bWord.addEventListener('click', () => exportReportWord('all'));

  repBtns.append(bText, bWord);
  view.appendChild(repBtns);

  /* ---------- سرصفحه ---------- */
  const nav = el('div', 'mhead rep-head');

  const monthSel = document.createElement('select');
  MONTHS.forEach((mn, idx) => monthSel.add(new Option(mn, String(idx + 1))));
  monthSel.value = String(m);
  monthSel.disabled = period === 'year';

  const yearsSet = new Set(S.d.tx.map(x => x.jy));
  yearsSet.add(now.jy);
  const yearOpts = Array.from(yearsSet).sort((a, b) => b - a);
  const yearSel = document.createElement('select');
  yearOpts.forEach(v => yearSel.add(new Option(fa(v), String(v))));
  yearSel.value = String(y);

  const go = () => { S.reportYm = (+yearSel.value) * 100 + (+monthSel.value); render(); };
  monthSel.addEventListener('change', go);
  yearSel.addEventListener('change', go);

  const prev = el('button', 'navarrow', '‹');
  prev.addEventListener('click', () => { S.reportYm = shiftYm(ym, -1); render(); });
  const next = el('button', 'navarrow', '›');
  next.addEventListener('click', () => { S.reportYm = shiftYm(ym, 1); render(); });

  nav.append(prev, yearSel, monthSel, next);
  view.appendChild(nav);

  /* ---------- انتخاب بازه و حالت ---------- */
  const perSeg = el('div', 'seg');
  [['month', 'ماهانه'], ['year', 'سالانه']].forEach(([k, lbl]) => {
    const b = el('button', period === k ? 'on' : '', lbl);
    b.type = 'button';
    b.addEventListener('click', () => { S.repPeriod = k; render(); });
    perSeg.appendChild(b);
  });
  view.appendChild(perSeg);

  const modeSeg = el('div', 'seg');
  const modeBtn = el('button', mode === 'cmp' ? 'on' : '', mode === 'cmp' ? 'با مقایسه' : 'بدون مقایسه');
  modeBtn.type = 'button';
  modeBtn.style.width = '100%';
  modeBtn.addEventListener('click', () => {
    S.repMode = mode === 'cmp' ? 'none' : 'cmp';
    render();
  });
  modeSeg.appendChild(modeBtn);
  view.appendChild(modeSeg);

  /* ---------- جمع‌ها ---------- */
  const inRange = (x, yy, mm) => x.jy === yy && (mm === null || x.jm === mm);

  function totals(pred) {
    let inc = 0, exp = 0;
    for (const x of S.d.tx) {
      if (!pred(x)) continue;
      if (x.type === 'income') inc += x.amount; else exp += x.amount;
    }
    return { inc, exp };
  }

  const cmpYm = period === 'month' ? shiftYm(ym, -12) : ym - 100;
  const cmpY = Math.floor(cmpYm / 100);
  const cmpM = cmpYm % 100;

  const cur = totals(x => period === 'month' ? inRange(x, y, m) : inRange(x, y, null));
  const old = mode === 'cmp'
    ? totals(x => period === 'month' ? inRange(x, cmpY, cmpM) : inRange(x, cmpY, null))
    : { inc: 0, exp: 0 };

  const st = el('div', 'stats');
  const s1 = el('div', 'stat');
  s1.append(el('div', 'k', 'درآمد'), el('div', 'v green', NUM.format(cur.inc)));
  const s2 = el('div', 'stat');
  s2.append(el('div', 'k', 'هزینه'), el('div', 'v red', NUM.format(cur.exp)));
  const s3 = el('div', 'stat');
  s3.append(el('div', 'k', 'مانده'), el('div', 'v ' + (cur.inc - cur.exp >= 0 ? 'green' : 'red'), NUM.format(cur.inc - cur.exp)));
  st.append(s1, s2, s3);
  view.appendChild(st);

  if (mode === 'cmp') {
    const dInc = old.inc ? Math.round((cur.inc - old.inc) / old.inc * 100) : 0;
    const dExp = old.exp ? Math.round((cur.exp - old.exp) / old.exp * 100) : 0;
    const sum = el('div', 'hint');
    sum.style.textAlign = 'center';
    sum.textContent = 'در برابر ' + (period === 'month' ? MONTHS[cmpM - 1] + ' ' + fa(cmpY) : 'سال ' + fa(cmpY)) +
      ' · درآمد ' + fa(Math.abs(dInc)) + '٪ ' + (dInc >= 0 ? 'بیشتر' : 'کمتر') +
      ' · هزینه ' + fa(Math.abs(dExp)) + '٪ ' + (dExp >= 0 ? 'بیشتر' : 'کمتر');
    view.appendChild(sum);
  }

  /* ---------- ساخت نقاط ---------- */
  let points = [];
  let labels = [];

  if (period === 'month') {
    const len = monthLen(y, m);
    for (let d = 1; d <= len; d++) {
      labels.push(d % 5 === 0 || d === 1 ? fa(d) : '');
      points.push({
        x: d,
        inc: totals(x => inRange(x, y, m) && x.jd === d).inc,
        exp: totals(x => inRange(x, y, m) && x.jd === d).exp,
        inc2: mode === 'cmp' ? totals(x => inRange(x, cmpY, cmpM) && x.jd === d).inc : 0,
        exp2: mode === 'cmp' ? totals(x => inRange(x, cmpY, cmpM) && x.jd === d).exp : 0
      });
    }
  } else {
    for (let mm = 1; mm <= 12; mm++) {
      labels.push(MONTHS[mm - 1].slice(0, 4));
      points.push({
        x: mm,
        inc: totals(x => inRange(x, y, mm)).inc,
        exp: totals(x => inRange(x, y, mm)).exp,
        inc2: mode === 'cmp' ? totals(x => inRange(x, cmpY, mm)).inc : 0,
        exp2: mode === 'cmp' ? totals(x => inRange(x, cmpY, mm)).exp : 0
      });
    }
  }

  /* ---------- نمودار خطی ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  const LW = 340, LH = 160, PAD = 22;
  const many = points.length;
  const pxOf = idx => PAD + idx * (LW - PAD * 2) / Math.max(1, many - 1);

  let maxV = 1;
  for (const p of points) {
    maxV = Math.max(maxV, p.inc, p.exp, p.inc2, p.exp2);
  }
  const pyOf = v => LH - PAD - (v / maxV) * (LH - PAD * 2);

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 ' + LW + ' ' + LH);
  svg.setAttribute('class', 'linechart');

  for (let g = 0; g <= 3; g++) {
    const gy = PAD + g * (LH - PAD * 2) / 3;
    const ln = document.createElementNS(NS, 'line');
    ln.setAttribute('x1', PAD); ln.setAttribute('x2', LW - PAD);
    ln.setAttribute('y1', gy); ln.setAttribute('y2', gy);
    ln.setAttribute('class', 'gridline');
    svg.appendChild(ln);
  }

  function addPath(key, cls, dash) {
    const d = points.map((p, idx) => (idx ? 'L' : 'M') + pxOf(idx).toFixed(1) + ' ' + pyOf(p[key]).toFixed(1)).join(' ');
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('class', 'spark ' + cls);
    if (dash) path.setAttribute('stroke-dasharray', '4 4');
    svg.appendChild(path);
    return path;
  }

  const paths = [];
  if (mode === 'cmp') {
    paths.push(addPath('inc2', 'incPrev', true));
    paths.push(addPath('exp2', 'expPrev', true));
  }
  paths.push(addPath('inc', 'in'));
  paths.push(addPath('exp', 'out'));

  points.forEach((p, idx) => {
    if (many > 16 && idx % 2) return;
    const c1 = document.createElementNS(NS, 'circle');
    c1.setAttribute('cx', pxOf(idx)); c1.setAttribute('cy', pyOf(p.inc));
    c1.setAttribute('r', 2.2); c1.setAttribute('class', 'dot in');
    svg.appendChild(c1);

    const c2 = document.createElementNS(NS, 'circle');
    c2.setAttribute('cx', pxOf(idx)); c2.setAttribute('cy', pyOf(p.exp));
    c2.setAttribute('r', 2.2); c2.setAttribute('class', 'dot out');
    svg.appendChild(c2);
  });

  points.forEach((p, idx) => {
    if (!labels[idx]) return;
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', pxOf(idx)); t.setAttribute('y', LH - 5);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('class', 'axlabel');
    t.textContent = labels[idx];
    svg.appendChild(t);
  });

  const chartBox = el('div', 'card pad chartbox');
  chartBox.appendChild(svg);
  view.appendChild(chartBox);

  requestAnimationFrame(() => {
    for (const p of paths) {
      try {
        const len = p.getTotalLength();
        p.style.strokeDasharray = String(len);
        p.style.strokeDashoffset = String(len);
        requestAnimationFrame(() => {
          p.style.transition = 'stroke-dashoffset 1s ease';
          p.style.strokeDashoffset = '0';
        });
      } catch (e) { /* */ }
    }
  });

  const lg = el('div', 'legend');
  if (mode === 'cmp') {
    lg.append(
      el('span', 'lg-in', 'درآمد این دوره'),
      el('span', 'lg-out', 'هزینهٔ این دوره'),
      el('span', 'lg-incprev', 'درآمد دورهٔ قبل'),
      el('span', 'lg-expprev', 'هزینهٔ دورهٔ قبل')
    );
  } else {
    lg.append(el('span', 'lg-in', 'درآمد'), el('span', 'lg-out', 'هزینه'));
  }
  view.appendChild(lg);

  /* ---------- حقایق ---------- */
  const daysCount = period === 'month' ? monthLen(y, m) : 365;
  const facts = el('div', 'stats');
  const f1 = el('div', 'stat');
  f1.append(el('div', 'k', 'میانگین هزینهٔ روزانه'), el('div', 'v', NUM.format(Math.round(cur.exp / Math.max(1, daysCount)))));
  const f2 = el('div', 'stat');
  f2.append(el('div', 'k', 'درآمد روزانه'), el('div', 'v green', NUM.format(Math.round(cur.inc / Math.max(1, daysCount)))));
  const f3 = el('div', 'stat');
  f3.append(el('div', 'k', 'مانده'), el('div', 'v', NUM.format(cur.inc - cur.exp)));
  facts.append(f1, f2, f3);
  view.appendChild(facts);

  /* ---------- نمودار دایره‌ای ---------- */
  const PALETTE = ['#4f46e5', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#a855f7', '#64748b'];

  function donutFor(kind, yy, mm, isYear) {
    const map = new Map();
    for (const x of S.d.tx) {
      if (x.type !== kind) continue;
      if (isYear ? x.jy !== yy : !(x.jy === yy && x.jm === mm)) continue;
      const k = (x.cat || 'سایر').trim() || 'سایر';
      map.set(k, (map.get(k) || 0) + x.amount);
    }

    const all = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    if (!all.length) return null;

    const top = all.slice(0, 6);
    const restSum = all.slice(6).reduce((s2, e) => s2 + e[1], 0);
    if (restSum > 0) top.push(['سایر', restSum]);

    const total = top.reduce((s2, e) => s2 + e[1], 0) || 1;

    const R = 42, C = 2 * Math.PI * R;
    const dsvg = document.createElementNS(NS, 'svg');
    dsvg.setAttribute('viewBox', '0 0 120 120');
    dsvg.setAttribute('class', 'donut');

    const bgc = document.createElementNS(NS, 'circle');
    bgc.setAttribute('cx', 60); bgc.setAttribute('cy', 60); bgc.setAttribute('r', R);
    bgc.setAttribute('class', 'donut-bg');
    dsvg.appendChild(bgc);

    let acc = 0;
    top.forEach(([name, val], idx) => {
      const frac = val / total;
      const arc = document.createElementNS(NS, 'circle');
      arc.setAttribute('cx', 60); arc.setAttribute('cy', 60); arc.setAttribute('r', R);
      arc.setAttribute('stroke', PALETTE[idx % PALETTE.length]);
      arc.setAttribute('class', 'donut-arc');
      arc.setAttribute('stroke-dasharray', (frac * C).toFixed(2) + ' ' + C.toFixed(2));
      arc.setAttribute('stroke-dashoffset', (-acc * C).toFixed(2));
      arc.setAttribute('transform', 'rotate(-90 60 60)');
      dsvg.appendChild(arc);
      acc += frac;
    });

    const leg = el('div', 'donut-legend');
    top.forEach(([name, val], idx) => {
      const row = el('div', 'dleg-row');
      const dot = el('i', 'dleg-dot');
      dot.style.background = PALETTE[idx % PALETTE.length];
      row.appendChild(dot);
      row.appendChild(el('span', 'dleg-name', name));
      row.appendChild(el('span', 'dleg-val', Math.round(val / total * 100) + '٪'));
      leg.appendChild(row);
    });

    return { svg: dsvg, legend: leg };
  }

  function donutChart(kind, title) {
    const isYear = period === 'year';
    const cur = donutFor(kind, y, m, isYear);
    const prev = mode === 'cmp' ? donutFor(kind, cmpY, cmpM, isYear) : null;

    if (!cur && !prev) return;

    const card = el('div', 'card pad');
    const h = el('div', 'mhead');
    h.style.margin = '0 0 6px';
    h.appendChild(el('span', null, title));
    card.appendChild(h);

    const rowWrap = el('div', 'donut-row');

    const mkBlock = (data, label) => {
      if (!data) return null;
      const blk = el('div', 'donut-block');
      if (label) blk.appendChild(el('div', 'donut-cap', label));
      blk.appendChild(data.svg);
      blk.appendChild(data.legend);
      return blk;
    };

    const curLabel = isYear ? ('سال ' + fa(y)) : (MONTHS[m - 1] + ' ' + fa(y));
    const prevLabel = isYear ? ('سال ' + fa(cmpY)) : (MONTHS[cmpM - 1] + ' ' + fa(cmpY));

    const b1 = mkBlock(cur, mode === 'cmp' ? curLabel : '');
    if (b1) rowWrap.appendChild(b1);

    const b2 = mkBlock(prev, prevLabel);
    if (b2) rowWrap.appendChild(b2);

    card.appendChild(rowWrap);

    const btn = el('button', 'btn block', kind === 'income' ? 'لیست درآمدها' : 'لیست هزینه‌ها');
    btn.type = 'button';
    btn.style.marginTop = '10px';
    btn.addEventListener('click', () => openTxList(kind, y, m, period));
    card.appendChild(btn);

    view.appendChild(card);
  }

  donutChart('expense', 'سهم هزینه‌ها');
  donutChart('income', 'سهم درآمدها');

  /* ---------- بایگانی سالانه ---------- */
  const years = new Map();
  for (const x of S.d.tx) {
    if (!years.has(x.jy)) years.set(x.jy, { inc: 0, exp: 0 });
    const o = years.get(x.jy);
    if (x.type === 'income') o.inc += x.amount; else o.exp += x.amount;
  }

  if (years.size) {
    const mhead = el('div', 'mhead');
    mhead.appendChild(el('span', null, 'بایگانی سالانه'));
    view.appendChild(mhead);

    for (const [yy, o] of Array.from(years.entries()).sort((a, b) => b[0] - a[0])) {
      const row = el('div', 'card pad');
      row.style.marginBottom = '8px';
      row.style.cursor = 'pointer';

      const top2 = el('div');
      top2.style.display = 'flex';
      top2.style.justifyContent = 'space-between';
      top2.style.fontWeight = '800';
      top2.appendChild(el('span', null, 'سال ' + fa(yy)));
      top2.appendChild(el('span', null, NUM.format(o.inc - o.exp)));
      row.appendChild(top2);

      const line = el('div', 'm');
      line.style.fontSize = '11px';
      line.style.color = 'var(--muted)';
      line.textContent = 'درآمد ' + NUM.format(o.inc) + ' · هزینه ' + NUM.format(o.exp);
      row.appendChild(line);

      row.addEventListener('click', () => {
        S.reportYm = yy * 100 + 1;
        S.repPeriod = 'year';
        render();
      });

      view.appendChild(row);
    }
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
  $('txTitle').textContent = existing
    ? (existing.type === 'income' ? 'ویرایش درآمد' : 'ویرایش هزینه')
    : (S.txKind === 'income' ? 'درآمد جدید' : 'هزینهٔ جدید');
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

  if (!S.editTx) {
    $('txTitle').textContent = b.dataset.kind === 'income' ? 'درآمد جدید' : 'هزینهٔ جدید';
  }
});

$('chqKindSeg').addEventListener('click', ev => {
  const b = ev.target.closest('button[data-kind]');
  if (!b) return;
  setSeg($('chqKindSeg'), b.dataset.kind);
});

$('txFrm').addEventListener('submit', ev => {
  ev.preventDefault();
  const amount = Math.round(Number($('txAmount').value));
  if (!Number.isFinite(amount) || amount <= 0) {
    formError('tx', 'برای ثبت تراکنش چه چیزهایی لازم است؟',
      '۱) مبلغ را با عدد بنویس (فقط رقم)\n' +
      '۲) نوع را انتخاب کن: هزینه یا درآمد\n' +
      '۳) دسته را انتخاب یا بنویس (خوراک، قبض، حقوق ...)\n' +
      '۴) تاریخ را بررسی کن\n\n' +
      'برای مبلغ بزرگ، بدون جداکننده بنویس؛ خود اپ جدا می‌کند.',
      'مبلغ را درست وارد کن');
    return;
  }
  formOk('tx');

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
  if (!title || !(amount > 0)) {
    formError('loan', 'برای ثبت وام چه چیزهایی لازم است؟',
      '۱) عنوان وام (مثلاً وام مسکن)\n' +
      '۲) مبلغ هر قسط به تومان\n' +
      '۳) تعداد اقساط (۱ تا ۳۶۰)\n' +
      '۴) تاریخ اولین قسط\n\n' +
      'اگر وام قبلاً شروع شده، تعداد اقساط پرداخت‌شده را هم وارد کن.',
      'عنوان و مبلغ قسط لازم است');
    return;
  }
  formOk('loan');

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
  if (!(amount > 0)) {
    formError('inst', 'برای ثبت قسط چه چیزهایی لازم است؟',
      '۱) مبلغ قسط به تومان (بزرگ‌تر از صفر)\n' +
      '۲) تاریخ پرداخت (سال / ماه / روز)\n' +
      '۳) وضعیت پرداخت را مشخص کن\n\n' +
      'اگر مبلغ این قسط با بقیه فرق دارد، همان‌جا تغییرش بده.',
      'مبلغ قسط لازم است');
    return;
  }
  formOk('inst');
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
  $('cRaw').value = c ? (c.raw || '') : '';
  $('cIban').value = c ? (c.iban || '') : '';
  if ($('cAccount')) $('cAccount').value = c ? (c.account || '') : '';
  photoReset(c ? (c.photo || '') : '');
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
  if (!(amount > 0) || !party) {
    formError('chq', 'برای ثبت چک چه چیزهایی لازم است؟',
      '۱) مبلغ چک را با عدد بنویس (مثلاً ۵٬۰۰۰٬۰۰۰)\n' +
      '۲) تاریخ سررسید را از سه کادر سال / ماه / روز انتخاب کن\n' +
      '۳) نام طرف حساب (صاحب چک یا در وجه) را بنویس\n\n' +
      'موارد ستاره‌دار الزامی‌اند. بقیه (شماره چک، بانک، کد ملی، شبا) اختیاری است.',
      'مبلغ و نام طرف حساب لازم است');
    return;
  }
  formOk('chq');

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
    iban: $('cIban').value.trim(),
    account: ($('cAccount') ? $('cAccount').value.trim() : ''),
    photo: chqPhotoData || '',
    raw: $('cRaw').value.trim(),
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
  $('accTitle').textContent = a ? 'ویرایش طلب/بدهی' : 'طلب/بدهی جدید';
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
  if (!name || !(amount > 0)) {
    formError('acc', 'برای ثبت طلب یا بدهی چه چیزهایی لازم است؟',
      '۱) نام شخص یا شرکت\n' +
      '۲) مبلغ به تومان\n' +
      '۳) نوع را انتخاب کن: طلب من یا بدهی من\n' +
      '۴) وعدهٔ تسویه (اختیاری ولی توصیه می‌شود)\n\n' +
      'طلب = پولی که باید بگیری، بدهی = پولی که باید بدهی.',
      'نام و مبلغ لازم است');
    return;
  }
  formOk('acc');

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
let logoTimer = null;

$('aboutBtn').addEventListener('click', () => {
  const btn = $('aboutBtn');
  btn.classList.remove('boom');
  void btn.offsetWidth;
  btn.classList.add('boom');

  try { petalShower(); } catch (e) { /* */ }

  if (logoTimer) {
    clearTimeout(logoTimer);
    logoTimer = null;
    openAbout();
    return;
  }

  logoTimer = setTimeout(() => { logoTimer = null; }, 420);
});
$('titleWrap').addEventListener('click', openAbout);
$('aboutClose').addEventListener('click', () => $('aboutDlg').close());

let navTap = {};
let fabTap = 0;

$('fab').addEventListener('click', () => {
  fabAdd();
});

function fabAdd() {
  if (S.tab === 'notes') newNote();
  else if (S.tab === 'tx') openTx(null);
  else if (S.tab === 'obl') {
    if (S.oblTab === 'cheques') openCheque(null);
    else if (S.oblTab === 'loans') openLoan(null);
    else openAccount(null);
  } else if (S.tab === 'report') openTx(null);
  else openTx(null);
}

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
function applySeason() {
  try {
    const on = S.d && S.d.settings && S.d.settings.seasonal !== false;
    if (!on) { document.documentElement.dataset.season = 'off'; return; }
    const j = d2j(effToday());
    document.documentElement.dataset.season = seasonOf(j.jm);
  } catch (e) { /* */ }
}

function applyTheme() {
  const pref = (S.d && S.d.settings ? S.d.settings.theme : 'system') || 'system';
  const sysDark = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const dark = pref === 'dark' || (pref === 'system' && sysDark);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  setTimeout(syncSystemBars, 30);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#0d1017' : '#f5f6fa');

  applySeason();
  if (typeof applyPalette === 'function') applyPalette();
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
  $('seasonChk').checked = st.seasonal !== false;
  $('fxChk').checked = st.fx !== false;
  if ($('sharpChk')) $('sharpChk').checked = st.docSharpen === true;
  if ($('userName')) $('userName').value = st.name || '';
  if ($('welcomeChk')) $('welcomeChk').checked = st.welcome !== false;
  if ($('scrollChk')) $('scrollChk').checked = st.scrollHint !== false;
  if ($('tapHintChk')) $('tapHintChk').checked = st.tapHint !== false;
  setTapModeUI();
  renderPaletteGrid();
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

$('seasonChk').addEventListener('change', () => {
  S.d.settings.seasonal = $('seasonChk').checked;
  save();
  applySeason();
  render();
  toast($('seasonChk').checked ? 'رنگ‌بندی فصلی روشن شد' : 'رنگ‌بندی فصلی خاموش شد');
});

$('fxChk').addEventListener('change', () => {
  S.d.settings.fx = $('fxChk').checked;
  save();
  render();
  toast($('fxChk').checked ? 'گرافیک و انیمیشن روشن شد' : 'گرافیک و انیمیشن خاموش شد');
});

$('tapModeSeg').addEventListener('click', ev => {
  const b = ev.target.closest('button[data-tap]');
  if (!b) return;

  S.d.settings.tapMode = b.dataset.tap;
  save();
  setTapModeUI();
  toast(b.dataset.tap === 'single' ? 'منوها با یک کلیک باز می‌شوند' : 'منوها با دو کلیک باز می‌شوند');
});

$('sharpChk').addEventListener('change', () => {
  S.d.settings.docSharpen = $('sharpChk').checked;
  save();
  toast($('sharpChk').checked ? 'تیزکردن تصویر روشن شد' : 'تیزکردن تصویر خاموش شد');
});

$('userNameSave').addEventListener('click', () => {
  const v = ($('userName').value || '').trim();
  if (v.length < 2) { toast('نام را کامل بنویس'); return; }

  askPinGate('تغییر نام', () => {
    S.d.settings.name = v;
    save();
    render();
    toast('نام ذخیره شد');
  });
});

$('welcomeChk').addEventListener('change', () => {
  S.d.settings.welcome = $('welcomeChk').checked;
  save();
});

$('scrollChk').addEventListener('change', () => {
  S.d.settings.scrollHint = $('scrollChk').checked;
  save();
  updateScrollNav();
});

$('tapHintChk').addEventListener('change', () => {
  S.d.settings.tapHint = $('tapHintChk').checked;
  save();
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
  if (!okCur) {
    $('pinDlg').close();
    showHelp(
      pinChangeMode === 'master' ? 'امکان تغییر کد مادر نیست' : 'امکان تغییر رمز نیست',
      'کد فعلی که وارد کردی درست نیست.\n\n' +
      'برای تغییر ' + (pinChangeMode === 'master' ? 'کد مادر' : 'رمز') +
      ' ابتدا باید کد فعلی را دقیق وارد کنی.\n' +
      'اگر آن را فراموش کرده‌ای، از دکمهٔ «فراموشی رمز» در صفحهٔ قفل و کد مادر استفاده کن.'
    );
    return;
  }
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

$('exportBtn').addEventListener('click', () => {
  askPinGate('پشتیبان‌گیری', () => { doBackup(); });
});
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
  askPinGate('بازیابی از فایل پشتیبان', () => {
    $('settingsDlg').close();
    if (IN_APP) {
      $('restoreText').value = '';
      $('restoreDlg').showModal();
    } else {
      $('importFile').click();
    }
  });
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
    const title = $('edTitle').value.trim();
    const strokes = ED.note.pages && ED.note.pages[0] ? ED.note.pages[0].strokes.length : 0;

    if (!title) {
      if (strokes > 0) {
        if (!confirm('یادداشت نام ندارد. می‌خواهی نام‌گذاری کنی؟\n\n«تأیید» = ماندن در ویرایشگر برای نام‌گذاری\n«انصراف» = حذف این یادداشت')) {
          const i = S.d.notes.findIndex(n => n.id === ED.note.id);
          if (i >= 0) S.d.notes.splice(i, 1);
          ED.note = null;
          $('editor').classList.add('hide');
          save();
          if (!silent) render();
          toast('یادداشت بدون نام حذف شد');
          return;
        }
        setTimeout(() => { try { $('edTitle').focus(); } catch (e) { } }, 120);
        toast('برای یادداشت یک نام بنویس');
        return;
      }

      const i = S.d.notes.findIndex(n => n.id === ED.note.id);
      if (i >= 0) S.d.notes.splice(i, 1);
      ED.note = null;
      $('editor').classList.add('hide');
      save();
      if (!silent) render();
      toast('یادداشت خالی ذخیره نشد');
      return;
    }

    ED.note.title = title;
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

  const muted = S.d.settings.muted || {};

  for (const x of dueItems()) {
    if (x.days < 0) continue;
    if (x.days > 14) continue;

    const base = baseIdOf(x);
    if (muted[base]) continue;
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
  if ($('chqDlg') && $('chqDlg').open) {
    const seg = $('chqKindSeg');
    if (seg) {
      const cur = segValue(seg);
      setSeg(seg, cur === 'in' ? 'out' : 'in');
      toast(cur === 'in' ? 'چک صادره' : 'چک دریافتی');
    }
    return;
  }

  if ($('dateDlg').open) { shiftCalMonth(dir); return; }
  if ($('sideDlg').open || $('todayDlg').open) return;
  if (!$('editor').classList.contains('hide')) return;

  // جابه‌جایی بین سربرگ‌ها با سوایپ
  if (S.tab === 'obl' && !S.detailLoan) {
    const order = ['cheques', 'loans', 'accounts'];
    const idx = Math.max(0, order.indexOf(S.oblTab));
    S.oblTab = order[(idx + (dir > 0 ? 1 : -1) + 3) % 3];
    render();
    return;
  }

  if (S.tab === 'tx') {
    const order = ['all', 'expense', 'income'];
    const idx = Math.max(0, order.indexOf(S.txFilter || 'all'));
    S.txFilter = order[(idx + (dir > 0 ? 1 : -1) + 3) % 3];
    render();
    return;
  }

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
    if (grid) { spinRings(dir, grid); }
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


/* ---------- نشانگر ادامهٔ صفحه ---------- */
function updateScrollHint() {
  const h = $('scrollHint');
  if (!h) return;
  const el2 = $('view');
  const more = el2 && (el2.scrollHeight - el2.scrollTop - el2.clientHeight > 40);
  const bodyMore = document.documentElement.scrollHeight - window.scrollY - window.innerHeight > 40;
  h.classList.toggle('hidden', !(more || bodyMore));
}

window.addEventListener('scroll', updateScrollHint, { passive: true });

try {
  const vv = view;
  if (vv && window.MutationObserver) {
    new MutationObserver(() => setTimeout(updateScrollHint, 90)).observe(vv, { childList: true, subtree: true });
  }
} catch (e) { /* */ }
window.addEventListener('resize', updateScrollHint);

/* ---------- ریزش گل روی لوگو ---------- */
function petalShower() {
  const logo = $('aboutBtn');
  if (!logo) return;
  const r = logo.getBoundingClientRect();

  const icons = ['🌹', '🌸', '🌺', '🍃', '❀'];
  const total = 46;

  for (let i = 0; i < total; i++) {
    const p = document.createElement('span');
    p.className = 'petal';
    p.textContent = icons[i % icons.length];
    p.style.left = (r.left + r.width / 2 + (Math.random() * 40 - 20)) + 'px';
    p.style.top = (r.top + r.height / 2) + 'px';
    p.style.setProperty('--dx', (Math.random() * 340 - 170).toFixed(0) + 'px');
    const dur = 2 + Math.random() * 2;
    p.style.setProperty('--dur', dur.toFixed(2) + 's');
    p.style.setProperty('--delay', (Math.random() * 1.2).toFixed(2) + 's');
    p.style.fontSize = (12 + Math.random() * 14).toFixed(0) + 'px';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), (dur + 1.4) * 1000);
  }
}

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

/* ================= ویرایش هوشمند تصویر چک ================= */

function loadPhotoImage(cb) {
  if (!chqPhotoData) return;
  const img = new Image();
  img.onload = () => cb(img);
  img.src = chqPhotoData;
}

function imgToCanvas(img, maxW) {
  const k = Math.min(1, maxW / img.width);
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * k);
  c.height = Math.round(img.height * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c;
}

/* زاویهٔ کجی را از هیستوگرام گرادیان پیدا می‌کند */
function detectSkew(img) {
  const c = imgToCanvas(img, 320);
  const ctx = c.getContext('2d');
  const { width: W, height: H } = c;
  const data = ctx.getImageData(0, 0, W, H).data;

  const gray = new Float32Array(W * H);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    gray[j] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  }

  const bins = 361;
  const hist = new Float32Array(bins);

  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const gx = gray[i - 1] - gray[i + 1];
      const gy = gray[i - W] - gray[i + W];
      const mag = Math.hypot(gx, gy);
      if (mag < 40) continue;

      let a = Math.atan2(gy, gx) * 180 / Math.PI;
      a = ((a % 180) + 180) % 180;
      hist[Math.round(a)] += mag;
    }
  }

  let best = 0, bestVal = 0;
  for (let a = 0; a <= 180; a++) {
    const v = hist[a] + hist[(a + 1) % 180] + hist[(a + 179) % 180];
    if (v > bestVal) { bestVal = v; best = a; }
  }

  // زاویهٔ خطوط افقی: نزدیک 0 یا 180
  let skew = best > 90 ? best - 180 : best;
  if (Math.abs(skew) > 20) skew = 0;

  return skew;
}

function rotateCanvas(src, deg) {
  const rad = deg * Math.PI / 180;
  const c = document.createElement('canvas');
  const cos = Math.abs(Math.cos(rad)), sin = Math.abs(Math.sin(rad));

  c.width = Math.round(src.width * cos + src.height * sin);
  c.height = Math.round(src.width * sin + src.height * cos);

  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, c.width, c.height);
  g.translate(c.width / 2, c.height / 2);
  g.rotate(rad);
  g.drawImage(src, -src.width / 2, -src.height / 2);

  return c;
}

function autoStraighten() {
  loadPhotoImage(img => {
    const skew = detectSkew(img);
    if (!skew || Math.abs(skew) < 0.6) { toast('تصویر از قبل صاف است'); return; }

    const full = document.createElement('canvas');
    full.width = img.width;
    full.height = img.height;
    full.getContext('2d').drawImage(img, 0, 0);

    const rotated = rotateCanvas(full, -skew);
    setChqPhoto(rotated.toDataURL('image/jpeg', 0.7));
    toast('تصویر ' + skew.toFixed(1) + ' درجه صاف شد');
  });
}

function detectChequeBox(img) {
  const c = imgToCanvas(img, 420);
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  const data = ctx.getImageData(0, 0, W, H).data;

  const lum = new Float32Array(W * H);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    lum[j] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  }

  /* رنگ پس‌زمینه: میانهٔ نوار لبه‌های تصویر */
  const bgVals = [];
  const bx = Math.max(2, Math.round(W * 0.03));
  const by = Math.max(2, Math.round(H * 0.03));

  for (let x = 0; x < W; x += 2) {
    for (let y = 0; y < by; y++) {
      bgVals.push(lum[y * W + x]);
      bgVals.push(lum[(H - 1 - y) * W + x]);
    }
  }
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < bx; x++) {
      bgVals.push(lum[y * W + x]);
      bgVals.push(lum[y * W + (W - 1 - x)]);
    }
  }

  bgVals.sort((a, b) => a - b);
  const bg = bgVals[Math.floor(bgVals.length / 2)] || 128;

  /* اختلاف هر پیکسل با پس‌زمینه */
  const rowS = new Float32Array(H);
  const colS = new Float32Array(W);
  const TH = 26;

  for (let y = 0; y < H; y++) {
    let rs = 0;
    for (let x = 0; x < W; x++) {
      const d = Math.abs(lum[y * W + x] - bg);
      if (d > TH) { rs++; colS[x]++; }
    }
    rowS[y] = rs;
  }

  const pick = arr => {
    let mx = 0;
    for (let i = 0; i < arr.length; i++) if (arr[i] > mx) mx = arr[i];
    if (mx < 3) return null;

    const t = Math.max(2, mx * 0.30);
    let a = 0, b = arr.length - 1;
    while (a < arr.length && arr[a] < t) a++;
    while (b >= 0 && arr[b] < t) b--;
    if (b - a < arr.length * 0.2) return null;
    return [a, b];
  };

  const xs = pick(colS);
  const ys = pick(rowS);

  if (!xs || !ys) return null;

  const kx = img.width / W;
  const ky = img.height / H;
  const padX = img.width * 0.01;
  const padY = img.height * 0.01;

  return {
    x: Math.max(0, xs[0] * kx - padX),
    y: Math.max(0, ys[0] * ky - padY),
    w: Math.min(img.width, (xs[1] - xs[0]) * kx + padX * 2),
    h: Math.min(img.height, (ys[1] - ys[0]) * ky + padY * 2)
  };
}

function autoCropCheque() {
  loadPhotoImage(img => {
    let box = detectChequeBox(img);

    if (!box) {
      box = {
        x: img.width * 0.05,
        y: img.height * 0.05,
        w: img.width * 0.90,
        h: img.height * 0.90
      };
      toast('قالب دقیق پیدا نشد؛ برش مرکزی انجام شد');
    }

    const c = document.createElement('canvas');
    c.width = Math.round(box.w);
    c.height = Math.round(box.h);
    c.getContext('2d').drawImage(img, box.x, box.y, box.w, box.h, 0, 0, c.width, c.height);

    setChqPhoto(c.toDataURL('image/jpeg', 0.7));
    toast('قالب چک جدا شد');
  });
}

/* ---------- برش دستی ---------- */
let cropRect = null;

function openCropDlg() {
  loadPhotoImage(img => {
    let dlg = document.getElementById('cropDlg');

    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.id = 'cropDlg';
      dlg.innerHTML = [
        '<form method="dialog">',
        '  <h2 style="text-align:center">برش دستی تصویر</h2>',
        '  <div class="crop-hint">' +
        '    ۱) انگشت/موس را روی گوشهٔ چک بگذار و بکش.<br>' +
        '    ۲) کادر زردی که می‌بینی همان ناحیهٔ برش است.<br>' +
        '    ۳) دکمهٔ «برش بزن» را لمس کن.' +
        '  </div>',
        '  <div id="cropWrap" style="position:relative;display:inline-block;max-width:100%"></div>',
        '  <div class="dact">',
        '    <button type="button" class="primary" id="cropApply">برش بزن</button>',
        '    <button type="button" id="cropCancel">انصراف</button>',
        '  </div>',
        '</form>'
      ].join('');
      document.body.appendChild(dlg);
    }

    const wrap = dlg.querySelector('#cropWrap');
    wrap.innerHTML = '';

    const canvas = document.createElement('canvas');
    const maxW = Math.min(340, window.innerWidth - 60);
    const k = Math.min(1, maxW / img.width);
    canvas.width = Math.round(img.width * k);
    canvas.height = Math.round(img.height * k);
    canvas.style.display = 'block';
    canvas.style.borderRadius = '12px';
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    wrap.appendChild(canvas);

    const sel = document.createElement('div');
    sel.style.cssText = 'position:absolute;border:2px dashed #ffd400;background:rgba(255,212,0,.16);display:block;pointer-events:none;box-shadow:0 0 0 9999px rgba(0,0,0,.28)';
    wrap.appendChild(sel);

    ['tl', 'tr', 'bl', 'br'].forEach(k => {
      const h = document.createElement('i');
      h.className = 'crop-handle crop-' + k;
      h.style.cssText += ';' + (
        k === 'tl' ? 'left:-7px;top:-7px' :
        k === 'tr' ? 'right:-7px;top:-7px' :
        k === 'bl' ? 'left:-7px;bottom:-7px' : 'right:-7px;bottom:-7px'
      );
      sel.appendChild(h);
    });

    // کادر پیش‌فرض ۹۰٪ تصویر
    cropRect = {
      x: canvas.width * 0.05,
      y: canvas.height * 0.05,
      w: canvas.width * 0.9,
      h: canvas.height * 0.9
    };
    sel.style.left = cropRect.x + 'px';
    sel.style.top = cropRect.y + 'px';
    sel.style.width = cropRect.w + 'px';
    sel.style.height = cropRect.h + 'px';

    let start = null;

    const pos = ev => {
      const r = canvas.getBoundingClientRect();
      return {
        x: Math.max(0, Math.min(canvas.width, ev.clientX - r.left)),
        y: Math.max(0, Math.min(canvas.height, ev.clientY - r.top))
      };
    };

    canvas.addEventListener('pointerdown', ev => {
      start = pos(ev);
      sel.style.display = 'block';
      cropRect = null;
      sel.style.left = start.x + 'px';
      sel.style.top = start.y + 'px';
      sel.style.width = '0px';
      sel.style.height = '0px';
      canvas.setPointerCapture(ev.pointerId);
    });

    canvas.addEventListener('pointermove', ev => {
      if (!start) return;
      const p = pos(ev);
      const x = Math.min(start.x, p.x), y = Math.min(start.y, p.y);
      const w = Math.abs(p.x - start.x), h = Math.abs(p.y - start.y);
      sel.style.left = x + 'px';
      sel.style.top = y + 'px';
      sel.style.width = w + 'px';
      sel.style.height = h + 'px';
      cropRect = { x: x, y: y, w: w, h: h };
    });

    canvas.addEventListener('pointerup', () => { start = null; });

    dlg.querySelector('#cropApply').onclick = () => {
      if (!cropRect || cropRect.w < 12 || cropRect.h < 12) { toast('کادر برش خیلی کوچک است'); return; }

      const scale = img.width / canvas.width;
      const rect = {
        x: cropRect.x * scale,
        y: cropRect.y * scale,
        w: cropRect.w * scale,
        h: cropRect.h * scale
      };

      photoTransform({ rect: rect });
      dlg.close();
      toast('برش انجام شد');
    };

    dlg.querySelector('#cropCancel').onclick = () => dlg.close();
    dlg.showModal();
  });
}

document.getElementById('photoStraighten').addEventListener('click', autoStraighten);
document.getElementById('photoAutoCrop').addEventListener('click', autoCropCheque);
document.getElementById('photoManualCrop').addEventListener('click', openCropDlg);

/* ================= موتور اسکن هوشمند چک ================= */

/* تاری جعبه‌ای جداشدنی (برای تخمین نور و نرم‌کردن) */
function boxBlur(src, w, h, r) {
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  const d = r * 2 + 1;

  for (let y = 0; y < h; y++) {
    let sum = 0;
    const row = y * w;
    for (let x = -r; x <= r; x++) sum += src[row + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = sum / d;
      const xa = Math.min(w - 1, x + r + 1);
      const xr = Math.max(0, x - r);
      sum += src[row + xa] - src[row + xr];
    }
  }

  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let y = -r; y <= r; y++) sum += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = sum / d;
      const ya = Math.min(h - 1, y + r + 1);
      const yr = Math.max(0, y - r);
      sum += tmp[ya * w + x] - tmp[yr * w + x];
    }
  }

  return out;
}

/* اصلاح نور موضعی (سایه‌ها) + کنتراست + تیزکردن */
function enhanceDocument(canvas) {
  const g = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const img = g.getImageData(0, 0, W, H);
  const d = img.data;

  /* ۱) نقشهٔ روشنایی */
  const lum = new Float32Array(W * H);
  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    lum[j] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  }

  /* ۲) نور پس‌زمینه (سایه = نور کم موضعی) */
  const radius = Math.max(6, Math.round(Math.min(W, H) / 14));
  const bg = boxBlur(lum, W, H, radius);

  let bgMean = 0;
  for (let i = 0; i < bg.length; i++) bgMean += bg[i];
  bgMean /= bg.length;
  if (bgMean < 1) bgMean = 1;

  /* ۳) تقسیم بر نور موضعی (سایه روشن می‌شود، نه یکنواخت‌سازی کامل) */
  const norm = new Float32Array(W * H);
  for (let i = 0; i < lum.length; i++) {
    const f = bgMean / (bg[i] + 1);
    const damp = 1 + (Math.min(f, 3) - 1) * 0.82;   // ملایم‌سازی
    norm[i] = Math.min(255, lum[i] * damp);
  }

  /* ۴) کشش کنتراست بر پایهٔ صدک‌ها */
  const sample = [];
  for (let i = 0; i < norm.length; i += 7) sample.push(norm[i]);
  sample.sort((a, b) => a - b);
  const lo = sample[Math.floor(sample.length * 0.02)];
  const hi = sample[Math.floor(sample.length * 0.98)];
  const span = Math.max(1, hi - lo);

  const stretched = new Float32Array(W * H);
  for (let i = 0; i < norm.length; i++) {
    stretched[i] = Math.min(255, Math.max(0, (norm[i] - lo) * 255 / span));
  }

  /* ۵) تیزکردن (اختیاری و تطبیقی: لبه‌ها بیشتر، نواحی صاف کمتر) */
  const wantSharp = !!(S.d && S.d.settings && S.d.settings.docSharpen);
  const soft = boxBlur(stretched, W, H, 3);
  const soft2 = boxBlur(stretched, W, H, 1);

  for (let j = 0, i = 0; j < stretched.length; j++, i += 4) {
    const v = stretched[j];
    let vv = v;

    if (wantSharp) {
      const detail = v - soft[j];
      const absD = Math.abs(detail);

      let mask = (absD - 3) / 10;
      mask = mask < 0 ? 0 : (mask > 1 ? 1 : mask);

      const cap = 32;
      let d2 = detail * (absD > cap ? cap / absD : 1);

      const fine = Math.abs(v - soft2[j]);
      if (fine < 2) d2 *= 0.35;

      const amount = 0.08 + 0.34 * mask;
      vv = v + amount * d2;
      vv = vv < 0 ? 0 : (vv > 255 ? 255 : vv);
    }

    /* انتقال جزئی به کانال‌های رنگی برای حفظ رنگ */
    const ratio = lum[j] > 1 ? (vv / lum[j]) : 1;
    const r2 = Math.min(255, d[i] * ratio);
    const g2 = Math.min(255, d[i + 1] * ratio);
    const b2 = Math.min(255, d[i + 2] * ratio);

    d[i] = r2; d[i + 1] = g2; d[i + 2] = b2; d[i + 3] = 255;
  }

  g.putImageData(img, 0, 0);
  return canvas;
}

function enhancePhoto() {
  loadPhotoImage(img => {
    const k = Math.min(1, 1400 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);

    enhanceDocument(c);
    setChqPhoto(c.toDataURL('image/jpeg', 0.78));
    toast('نور و وضوح تصویر اصلاح شد');
  });
}

/* اسکن کامل: برش هوشمند → صاف‌کردن → اصلاح نور و تیز کردن */
function smartScan() {
  loadPhotoImage(img => {
    const box = detectChequeBox(img);

    let sx = 0, sy = 0, sw = img.width, sh = img.height;

    if (box) {
      sx = box.x; sy = box.y; sw = box.w; sh = box.h;
    } else {
      sx = img.width * 0.04; sy = img.height * 0.04;
      sw = img.width * 0.92; sh = img.height * 0.92;
    }

    const c = document.createElement('canvas');
    c.width = Math.round(sw);
    c.height = Math.round(sh);
    c.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);

    /* صاف‌کردن */
    const skew = detectSkew(img);
    let work = c;

    if (skew && Math.abs(skew) >= 0.6) {
      work = rotateCanvas(c, -skew);
    }

    /* برش دوباره بعد از چرخش (حاشیه‌های سفید) */
    const tmpImg = new Image();
    tmpImg.onload = () => {
      const box2 = detectChequeBox(tmpImg);

      if (box2) {
        const c2 = document.createElement('canvas');
        c2.width = Math.round(box2.w);
        c2.height = Math.round(box2.h);
        c2.getContext('2d').drawImage(
          tmpImg, box2.x, box2.y, box2.w, box2.h, 0, 0, c2.width, c2.height
        );
        work = c2;
      }

      /* اصلاح نور و تیزکردن */
      const k2 = Math.min(1, 1400 / Math.max(work.width, work.height));
      const out = document.createElement('canvas');
      out.width = Math.round(work.width * k2);
      out.height = Math.round(work.height * k2);
      out.getContext('2d').drawImage(work, 0, 0, out.width, out.height);

      enhanceDocument(out);

      setChqPhoto(out.toDataURL('image/jpeg', 0.78));
      toast('اسکن هوشمند انجام شد');
    };

    tmpImg.src = work.toDataURL('image/png');
  });
}

document.getElementById('photoSmart').addEventListener('click', smartScan);
document.getElementById('photoEnhance') &&
  document.getElementById('photoEnhance').addEventListener('click', enhancePhoto);

/* لوگو برای خروجی ورد */
(function () {
  try {
    fetch('icons/icon-192.png')
      .then(r => r.blob())
      .then(b => new Promise(res => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result);
        fr.readAsDataURL(b);
      }))
      .then(u => { window.__LOGO__ = u; })
      .catch(() => {});
  } catch (e) { /* */ }
})();