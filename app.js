// ======================================================
// Myanmar Driver Check — app.js  v2.0
// SECURITY HARDENED + CONCURRENCY SAFE
// ======================================================
//
// ── SECURITY MEASURES ──────────────────────────────────
//  1. escapeHtml() sanitizes ALL user/OCR input before
//     any DOM injection — prevents XSS attacks
//  2. File MIME type + size validated before OCR starts
//  3. OCR lock (ocrBusy flag) prevents concurrent workers
//  4. State guard (processing flag) blocks re-entrant
//     chatbot flows from rapid button tapping
//  5. Quick-reply buttons disabled immediately on click
//  6. Plate input capped at 20 chars; non-printable
//     characters stripped before processing
//  7. innerHTML used ONLY with sanitized/trusted strings
//     (user/OCR input goes through escapeHtml first)
//
// ── DATA INTEGRITY ─────────────────────────────────────
//  DATA_VERSION: v1.2  — last cross-checked 2026-03-08
//  Sources: NDSC (Mar 3, 2026), Eleven Myanmar,
//           Khaosod English, Yangon Media Group,
//           Myanmar ITV, The Star/Reuters, Irrawaddy
// ======================================================

'use strict';

// ─── Data Integrity Constants ──────────────────────────
const DATA_VERSION = 'v1.2';
const DATA_VERIFIED = '2026-03-08'; // ISO date last cross-checked
const SCHEME_START = '2026-03-07'; // Effective date
const ANNOUNCED_DATE = '2026-03-03'; // NDSC announcement
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

// ─── Security: HTML escaper ────────────────────────────
const _esc = document.createElement('textarea');
function escapeHtml(str) {
  _esc.textContent = String(str);
  return _esc.innerHTML;
}

// ─── Concurrency guards ────────────────────────────────
let ocrBusy = false; // OCR worker lock
let processing = false; // chatbot state transition lock

function acquireLock() {
  if (processing) return false;
  processing = true;
  return true;
}
function releaseLock() { processing = false; }

// ─── Bilingual message bank ────────────────────────────
const MSG = {
  greeting: {
    en: `Hello! 👋 I'm your <strong>Myanmar Driver Check</strong> assistant. I verify driving eligibility under the Odd-Even Scheme announced by the <strong>NDSC on ${ANNOUNCED_DATE}</strong> (effective ${SCHEME_START}). <br><small>📋 Data ${DATA_VERSION} — verified ${DATA_VERIFIED}</small>`,
    my: `မင်္ဂလာပါ! 👋 NDSC ကြေညာချက် (${ANNOUNCED_DATE}) အရ ကားမောင်းနှင်ခွင့် စစ်ဆေးပေးပါမည်။ <small>ဒေတာ ${DATA_VERSION} — စစ်ဆေးပြီး ${DATA_VERIFIED}</small>`
  },
  askVehicleType: {
    en: 'First, what type of vehicle do you have?',
    my: 'ပထမဦးစွာ၊ သင်၏ ယာဉ်အမျိုးအစား ကို ရွေးချယ်ပါ။'
  },
  exempted: {
    // type is from our own trusted constant — safe to use directly
    en: (type) => `✅ <strong>${type}</strong> is <strong>exempt</strong> from the odd-even restriction per NDSC. You may drive freely today! 🚗`,
    my: (type) => `<span class="my-text">✅ ${escapeHtml(type)} ယာဉ်သည် NDSC ကြေညာချက်အရ ကင်းလွတ်ခွင့်ရှိသည်။ ယနေ့ လွတ်လပ်စွာ မောင်းနှင်နိုင်သည်။</span>`
  },
  askScan: {
    en: 'Great! Now take a photo of your license plate, or type the number below.',
    my: 'ကောင်းပါသည်! ကားဦးနံပါတ်ပြားကို ဓာတ်ပုံရိုက်ပါ သို့မဟုတ် နံပါတ် ရိုက်ထည့်ပါ။'
  },
  processing: {
    en: '⏳ Scanning plate with OCR… please wait.',
    my: '⏳ OCR ဖြင့် စစ်ဆေးနေပါသည်…'
  },
  ocrFailed: {
    en: '😕 Plate not clearly readable. Try a clearer photo, or enter the number manually.',
    my: '😕 ဦးနံပါတ်ပြား မဖတ်နိုင်ပါ။ ပိုရှင်းသော ဓာတ်ပုံ သုံးပါ သို့မဟုတ် ကိုယ်တိုင် ရိုက်ထည့်ပါ။'
  },
  fileError: {
    en: '⚠️ Invalid file. Please upload a JPEG, PNG or WEBP image under 10 MB.',
    my: '⚠️ ဖိုင် မမှန်ပါ။ JPEG, PNG, WEBP ဓာတ်ပုံ (10MB အောက်) တင်ပေးပါ။'
  },
  result: {
    allowed: (digit, dateNum) => ({
      en: `✅ You <strong>CAN DRIVE</strong> today!<br>Plate ending in <strong>${escapeHtml(String(digit))}</strong> is allowed on <strong>odd date ${escapeHtml(String(dateNum))}</strong>.<br><small>⛽ Fuel purchase also permitted today (up to 50,000 MMK).</small>`,
      my: `✅ ယနေ့ ကားမောင်းနှင်ခွင့် <strong>ရှိပါသည်</strong>။ ဦးနံပါတ် <strong>${escapeHtml(String(digit))}</strong> — ဒေတ် <strong>${escapeHtml(String(dateNum))}</strong> (မဂ္ဂဇိဇ်ကိန်း) ခွင့်ပြုသည်။<br><small>⛽ ဆီဝယ်ယူနိုင်သည် (အများဆုံး ၅၀,၀၀၀ ကျပ်)။</small>`
    }),
    denied: (digit, dateNum) => ({
      en: `❌ You <strong>CANNOT DRIVE</strong> today.<br>Plate ending in <strong>${escapeHtml(String(digit))}</strong> is restricted on <strong>even date ${escapeHtml(String(dateNum))}</strong>.<br><small>⛽ Fuel purchase is also restricted today.</small>`,
      my: `❌ ယနေ့ ကားမောင်းနှင်ခွင့် <strong>မရှိပါ</strong>။ ဦးနံပါတ် <strong>${escapeHtml(String(digit))}</strong> — ဒေတ် <strong>${escapeHtml(String(dateNum))}</strong> (စစ်ကိန်းနေ့) ကန့်သတ်သည်။<br><small>⛽ ဆီဝယ်ယူခွင့်လည်း မရှိပါ။</small>`
    })
  },
  disclaimer: {
    en: `⚠️ <em>Data ${DATA_VERSION} sourced from NDSC (${ANNOUNCED_DATE}) &amp; verified via Eleven Myanmar, Khaosod English, Yangon Media Group &amp; Myanmar ITV. Rules may change. Always confirm with local authorities. For informational use only.</em>`,
    my: `<em class="my-text">NDSC ကြေညာချက် (${ANNOUNCED_DATE}) နှင့် မီဒီယာ ၄ ခု မှ အတည်ပြု၍ စစ်ဆေးသည်။ ဥပဒေ ပြောင်းလဲနိုင်သည်— ဒေသဆိုင်ရာ တာဝန်ရှိသူ ထံ အတည်ပြုပါ။</em>`
  },
  askAnother: {
    en: 'Would you like to check another plate?',
    my: 'နောက်ထပ် ဦးနံပါတ်တစ်ခု စစ်ဆေးလိုပါသလား?'
  }
};

// ─── Verified Exemptions (NDSC + 6 sources) ───────────
const EXEMPT_TYPES = [
  { label: '🚌 Public Transport Bus', labelMy: 'အများသူငှာ ဘတ်စ်ကား', exempt: true },
  { label: '🚕 Taxi', labelMy: 'တက်စီ', exempt: true },
  { label: '🚑 Ambulance / Emergency', labelMy: 'အမ်ဘူလင်း / အရေးပေါ်ယာဉ်', exempt: true },
  { label: '⚰️ Hearse', labelMy: 'သင်္ဂြိုဟ်ယာဉ်', exempt: true },
  { label: '🚛 Cargo Truck', labelMy: 'ကုန်တင်ယာဉ်', exempt: true },
  { label: '⛽ Fuel Transport Vehicle', labelMy: 'ဆီတင်ကား / ဆီသယ်ယာဉ်', exempt: true },
  { label: '🏗️ Construction Vehicle', labelMy: 'အဆောက်အဦ ဆောက်လုပ်ရေးယာဉ်', exempt: true },
  { label: '🗑️ Sanitation / Municipal', labelMy: 'သန့်ရှင်းရေးယာဉ် / မြို့တော်ယာဉ်', exempt: true },
  { label: '⚡ Electric Vehicle (EV)', labelMy: 'လျှပ်စစ်ကား (EV)', exempt: true },
  { label: '⚡ Electric Motorcycle', labelMy: 'လျှပ်စစ်မော်တော်ဆိုင်ကယ်', exempt: true },
  { label: '🚗 Private Car', labelMy: 'ပုဂ္ဂလိကကား', exempt: false },
  { label: '🏍️ Motorcycle (gas)', labelMy: 'မော်တော်ဆိုင်ကယ် (ဓာတ်ဆီ)', exempt: false }
];

// ─── State ────────────────────────────────────────────
let state = 'GREETING';
let selectedType = null;

// ─── DOM References ───────────────────────────────────
const chatWindow = document.getElementById('chat-window');
const uploadZone = document.getElementById('upload-zone');
const manualEntry = document.getElementById('manual-entry');
const manualInput = document.getElementById('plate-input');
const manualSubmit = document.getElementById('manual-submit');
const quickReplies = document.getElementById('quick-replies');
const textInputRow = document.getElementById('text-input-row');
const userTextInput = document.getElementById('user-text-input');
const sendBtn = document.getElementById('send-btn');
const plateUpload = document.getElementById('plate-upload');
const processingInd = document.getElementById('processing-indicator');
const uploadLabel = document.getElementById('upload-label');
const dateBadge = document.getElementById('date-badge');
const verifiedBadge = document.getElementById('verified-badge');

// ─── Date helpers ─────────────────────────────────────
function getToday() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Rangoon' }));
  return {
    day: now.getDate(),
    dateStr: now.toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      timeZone: 'Asia/Rangoon'
    })
  };
}
function isOddDate() { return getToday().day % 2 !== 0; }

// ─── Render helpers ───────────────────────────────────
// addBotBubble accepts ONLY trusted/sanitized HTML strings
function addBotBubble(trustedHtml, delayed = true) {
  return new Promise(resolve => {
    const typingRow = document.createElement('div');
    typingRow.className = 'bubble-row bot';
    typingRow.innerHTML = `<div class="avatar">🤖</div><div class="bubble bot"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
    chatWindow.appendChild(typingRow);
    scrollToBottom();

    setTimeout(() => {
      typingRow.remove();
      const row = document.createElement('div');
      row.className = 'bubble-row bot';
      const bubble = document.createElement('div');
      bubble.className = 'bubble bot';
      // Caller is responsible for only passing safe HTML here
      bubble.innerHTML = trustedHtml;
      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.textContent = '🤖';
      row.appendChild(avatar);
      row.appendChild(bubble);
      chatWindow.appendChild(row);
      scrollToBottom();
      resolve();
    }, delayed ? 800 : 80);
  });
}

// addUserBubble: sanitizes input with escapeHtml
function addUserBubble(rawText) {
  const row = document.createElement('div');
  row.className = 'bubble-row user';
  const bubble = document.createElement('div');
  bubble.className = 'bubble user';
  bubble.textContent = rawText; // textContent = auto-escaped, no XSS
  row.appendChild(bubble);
  chatWindow.appendChild(row);
  scrollToBottom();
}

function scrollToBottom() {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function setQuickReplies(options) {
  quickReplies.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'qr-btn';
    btn.textContent = opt.label; // safe — textContent
    btn.addEventListener('click', () => {
      // Concurrency guard: disable all quick reply buttons on first click
      quickReplies.querySelectorAll('.qr-btn').forEach(b => b.disabled = true);
      handleQuickReply(opt);
    });
    quickReplies.appendChild(btn);
  });
}

function clearQuickReplies() { quickReplies.innerHTML = ''; }
function showUploadZone(v) { uploadZone.style.display = v ? 'block' : 'none'; }
function showManualEntry(v) { manualEntry.style.display = v ? 'flex' : 'none'; }
function showTextInput(v) { textInputRow.style.display = v ? 'flex' : 'none'; }

// ─── Flow control ─────────────────────────────────────
async function startGreeting() {
  state = 'GREETING';
  processing = false; // reset on fresh start
  showTextInput(false);
  showUploadZone(false);
  showManualEntry(false);
  clearQuickReplies();
  await addBotBubble(`${MSG.greeting.en}<span class="my-text">${MSG.greeting.my}</span>`);
  await askVehicleType();
}

async function askVehicleType() {
  state = 'ASK_TYPE';
  await addBotBubble(`${MSG.askVehicleType.en}<span class="my-text">${MSG.askVehicleType.my}</span>`);
  setQuickReplies(EXEMPT_TYPES.map(t => ({ ...t })));
}

async function handleQuickReply(opt) {
  // State guard — prevent re-entry
  if (!acquireLock()) return;
  try {
    if (state === 'ASK_TYPE') {
      selectedType = opt;
      addUserBubble(opt.label);
      clearQuickReplies();

      if (opt.exempt) {
        await addBotBubble(MSG.exempted.en(opt.label) + MSG.exempted.my(opt.labelMy));
        await addBotBubble(`${MSG.disclaimer.en}<br>${MSG.disclaimer.my}`);
        await promptAnother();
      } else {
        await addBotBubble(`${MSG.askScan.en}<span class="my-text">${MSG.askScan.my}</span>`);
        state = 'ASK_SCAN';
        showUploadZone(true);
        showManualEntry(true);
      }
    } else if (state === 'ASK_AGAIN') {
      if (opt.label === '✅ Yes / ဟုတ်ကဲ့') {
        clearQuickReplies();
        await startGreeting();
      } else {
        clearQuickReplies();
        await addBotBubble("Thank you for using Myanmar Driver Check! Stay safe. 🙏<span class='my-text'>ကျေးဇူးတင်ပါသည်! ဘေးကင်းစွာ မောင်းနှင်ပါ။</span>");
      }
    }
  } finally {
    releaseLock();
  }
}

async function promptAnother() {
  state = 'ASK_AGAIN';
  await addBotBubble(`${MSG.askAnother.en}<span class="my-text">${MSG.askAnother.my}</span>`);
  setQuickReplies([
    { label: '✅ Yes / ဟုတ်ကဲ့' },
    { label: '❌ No / မလိုပါ' }
  ]);
}

// ─── File validation ──────────────────────────────────
function validateFile(file) {
  if (!file) return 'No file selected.';
  if (!ALLOWED_MIMES.includes(file.type) && !file.type.startsWith('image/')) {
    return 'invalid_type';
  }
  if (file.size > MAX_FILE_SIZE) return 'invalid_size';
  return null; // valid
}

// ─── OCR Logic (concurrency-locked) ──────────────────
async function runOCR(file) {
  // CONCURRENCY LOCK: one OCR worker at a time
  if (ocrBusy) {
    await addBotBubble('⏳ Already processing a scan. Please wait…', false);
    return;
  }
  ocrBusy = true;

  // File validation
  const err = validateFile(file);
  if (err) {
    ocrBusy = false;
    await addBotBubble(`${MSG.fileError.en}<span class="my-text">${MSG.fileError.my}</span>`);
    return;
  }

  uploadLabel.style.display = 'none';
  processingInd.style.display = 'flex';
  await addBotBubble(`${MSG.processing.en}<span class="my-text">${MSG.processing.my}</span>`, false);

  try {
    const { data: { text } } = await Tesseract.recognize(file, 'eng', {
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz/ -',
      logger: () => { }
    });

    // Sanitize OCR output — extract digits only, max 20 chars
    const rawCleaned = String(text).slice(0, 200);
    const digitsOnly = rawCleaned.replace(/\D/g, '').slice(0, 20);
    if (!digitsOnly) throw new Error('No digits found in OCR output');

    const lastDigit = parseInt(digitsOnly[digitsOnly.length - 1], 10);
    await processPlateResult(digitsOnly, lastDigit, escapeHtml(rawCleaned.trim()));

  } catch (e) {
    await addBotBubble(`${MSG.ocrFailed.en}<span class="my-text">${MSG.ocrFailed.my}</span>`);
    showManualEntry(true);
  } finally {
    uploadLabel.style.display = 'flex';
    processingInd.style.display = 'none';
    ocrBusy = false; // release OCR lock
  }
}

// ─── Plate result logic ───────────────────────────────
async function processPlateResult(safeDigits, lastDigit, safeRawText) {
  showUploadZone(false);
  showManualEntry(false);

  const { day, dateStr } = getToday();
  const todayOdd = isOddDate();
  const plateOdd = lastDigit % 2 !== 0;
  const allowed = (todayOdd && plateOdd) || (!todayOdd && !plateOdd);

  // User bubble — raw text already escaped by caller
  const userMsgRow = document.createElement('div');
  userMsgRow.className = 'bubble-row user';
  const userBubble = document.createElement('div');
  userBubble.className = 'bubble user';
  userBubble.textContent = `🔍 Plate: ${safeDigits} (last digit: ${lastDigit})`;
  userMsgRow.appendChild(userBubble);
  chatWindow.appendChild(userMsgRow);
  scrollToBottom();

  const cardClass = allowed ? 'allowed' : 'denied';
  const resultData = allowed
    ? MSG.result.allowed(lastDigit, day)
    : MSG.result.denied(lastDigit, day);

  // Trusted HTML — escapeHtml already applied inside MSG.result
  const card = `<div class="result-card ${cardClass}">
    ${resultData.en}
    <span class="result-detail result-detail-my">${resultData.my}</span>
    <span class="result-detail">📅 ${escapeHtml(dateStr)} | Last digit: ${escapeHtml(String(lastDigit))} | Today: ${todayOdd ? 'ODD (မဂ္ဂဇိဇ်)' : 'EVEN (စစ်ကိန်း)'}</span>
    <span class="result-detail">🔒 Data ${DATA_VERSION} verified ${DATA_VERIFIED}</span>
  </div>`;

  await addBotBubble(card);
  await addBotBubble(`${MSG.disclaimer.en}<br>${MSG.disclaimer.my}`);
  await promptAnother();
}

// ─── Manual plate entry (with debounce) ──────────────
let manualLock = false;
async function handleManualPlate(raw) {
  if (manualLock) return; // Prevent double-submit
  manualLock = true;

  try {
    // Strip everything except digits and common plate chars, max 20
    const cleaned = String(raw).replace(/[^0-9A-Za-z\-\/]/g, '').slice(0, 20);
    const digits = cleaned.replace(/\D/g, '');
    if (!digits) {
      manualInput.value = '';
      manualInput.focus();
      return;
    }
    const lastDigit = parseInt(digits[digits.length - 1], 10);
    showManualEntry(false);
    showUploadZone(false);
    await processPlateResult(digits, lastDigit, escapeHtml(cleaned));
  } finally {
    manualLock = false;
  }
}

// ─── Event Listeners ──────────────────────────────────
plateUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  runOCR(file);
  plateUpload.value = '';
});

manualSubmit.addEventListener('click', () => handleManualPlate(manualInput.value));
manualInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleManualPlate(manualInput.value); });

sendBtn.addEventListener('click', () => handleFreeText(userTextInput.value));
userTextInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleFreeText(userTextInput.value); });

async function handleFreeText(text) {
  const cleaned = String(text).trim().slice(0, 100);
  if (!cleaned) return;
  userTextInput.value = '';
  if (state === 'ASK_SCAN' && /\d/.test(cleaned)) {
    addUserBubble(cleaned);
    await handleManualPlate(cleaned);
  } else {
    addUserBubble(cleaned);
    await addBotBubble("Please use the buttons or upload a plate photo to check eligibility. <span class='my-text'>ခလုတ်များ သုံး၍ စစ်ဆေးပါ။</span>");
  }
}

// ─── Init ─────────────────────────────────────────────
(function init() {
  const { day, dateStr } = getToday();
  const oddEven = isOddDate() ? 'ODD DAY 🟡' : 'EVEN DAY ⚪';
  dateBadge.textContent = `${dateStr} — ${oddEven}`;

  // Data integrity badge
  if (verifiedBadge) {
    verifiedBadge.textContent = `🔒 Data ${DATA_VERSION}`;
    verifiedBadge.title = `Verified on ${DATA_VERIFIED} | Sources: NDSC, Eleven Myanmar, Khaosod English, Yangon Media Group, Myanmar ITV`;
  }

  startGreeting();
})();
