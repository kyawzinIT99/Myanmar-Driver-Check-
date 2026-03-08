// ======================================================
// Myanmar Driver OCR Chatbot — app.js
// Odd-Even Scheme effective March 7, 2026
// ======================================================

// ─── Bilingual message bank ───────────────────────────
//
// DATA SOURCES (verified & crossed-checked):
//  - NDSC Announcement: March 3, 2026 (effective March 7, 2026)
//  - Eleven Myanmar (elevenmyanmar.com)
//  - Khaosod English (khaosodenglish.com)
//  - Yangon Media Group (yangonmediagroup.com)
//  - The Star / Reuters pool (thestar.com.my)
//  - Myanmar ITV / State broadcast (myanmaritv.com)
//  - Irrawaddy (irrawaddy.com)
//
const MSG = {
  greeting: {
    en: "Hello! 👋 I'm your Myanmar Driver Check assistant. I'll help you check driving eligibility under the <strong>Odd-Even Scheme</strong> announced by the NDSC on <strong>March 3, 2026</strong> (effective March 7, 2026).",
    my: "မင်္ဂလာပါ! 👋 မြန်မာ NDSC ၏ ၂၀၂၆ မတ် ၃ ရက်နေ့ ကြေညာချက်အရ မော်တော်ယာဉ် မဂ္ဂဇိဇ်/စစ်ကိန်း စနစ်ဖြင့် မောင်းနှင်ခွင့် စစ်ဆေးပေးပါမည်။"
  },
  askVehicleType: {
    en: "First, what type of vehicle do you have?",
    my: "ပထမဦးစွာ၊ သင်၏ ယာဉ်အမျိုးအစား ကို ရွေးချယ်ပါ။"
  },
  exempted: {
    en: (type) => `✅ <strong>${type}</strong> vehicles are <strong>exempt</strong> from the odd-even restriction. You can drive freely today! 🚗`,
    my: (type) => `✅ <span class="my-text">${type} ယာဉ်များသည် ကန့်သတ်ချက်မှ ကင်းလွတ်ခွင့်ရှိသည်။ ယနေ့ လွတ်လပ်စွာ မောင်းနှင်နိုင်ပါသည်။</span>`
  },
  askScan: {
    en: "Great! Now, please take a photo of your license plate or upload an image so I can read the number.",
    my: "ကောင်းပါသည်! ယခု ကားဦးနံပါတ်ပြားကို ဓာတ်ပုံရိုက်ပါ သို့မဟုတ် ဓာတ်ပုံ တင်ပေးပါ။"
  },
  processing: {
    en: "⏳ Scanning your plate with OCR… please wait.",
    my: "⏳ OCR ဖြင့် ဦးနံပါတ်ပြား စစ်ဆေးနေပါသည်…"
  },
  ocrFailed: {
    en: "😕 I couldn't read the plate clearly. Please try a clearer photo, or enter the plate number manually below.",
    my: "😕 ဦးနံပါတ်ပြား ကောင်းကောင်းမဖတ်နိုင်ပါ။ ပိုရှင်းလင်းသောဓာတ်ပုံ သုံးပါ သို့မဟုတ် နံပါတ် ကိုယ်တိုင် ရိုက်ထည့်ပါ။"
  },
  result: {
    allowed: (plate, digit, dateNum) => ({
      en: `✅ You <strong>CAN DRIVE</strong> today! Plate ending in <strong>${digit}</strong> is allowed on <strong>odd date ${dateNum}</strong>.<br><small>⛽ Fuel purchase also permitted today (up to 50,000 MMK at stations).</small>`,
      my: `✅ ယနေ့ ကားမောင်းနှင်ခွင့် <strong>ရှိပါသည်</strong>။ ဦးနံပါတ် <strong>${digit}</strong> သည် ဒေတ် <strong>${dateNum}</strong> (မဂ္ဂဇိဇ်ကိန်း) နေ့တွင် ခွင့်ပြုသည်။<br><small>⛽ ဆီဝယ်ယူနိုင်သည် (အများဆုံး ၅၀,၀၀၀ ကျပ် ထိ)။</small>`
    }),
    denied: (plate, digit, dateNum) => ({
      en: `❌ You <strong>CANNOT DRIVE</strong> today. Plate ending in <strong>${digit}</strong> is restricted on <strong>even date ${dateNum}</strong>.<br><small>⛽ Fuel purchase is also restricted on your plate's off-days.</small>`,
      my: `❌ ယနေ့ ကားမောင်းနှင်ခွင့် <strong>မရှိပါ</strong>။ ဦးနံပါတ် <strong>${digit}</strong> သည် ဒေတ် <strong>${dateNum}</strong> (စစ်ကိန်းနေ့) တွင် ကန့်သတ်သည်။<br><small>⛽ ဆီဝယ်ယူခွင့်လည်း မရှိပါ။</small>`
    })
  },
  disclaimer: {
    en: "⚠️ <em>Data sourced from NDSC announcement (Mar 3, 2026) & verified via Eleven Myanmar, Khaosod English, Yangon Media Group & Myanmar ITV. Rules may change without notice. Always confirm with local authorities. This tool is for informational purposes only.</em>",
    my: `⚠️ <em class="my-text">NDSC ကြေညာချက် (မတ် ၃၊ ၂၀၂၆) နှင့် ပြောင်းလဲနိုင်သည်။ ဒေသဆိုင်ရာ အာဏာပိုင်များ ထံမှ အတည်ပြုပါ။</em>`
  },
  askAnother: {
    en: "Would you like to check another plate?",
    my: "နောက်ထပ် ဦးနံပါတ်တစ်ခု စစ်ဆေးလိုပါသလား?"
  }
};

// ─── Exemptions ───────────────────────────────────────
// VERIFIED OFFICIAL EXEMPTIONS (per NDSC + cross-checked across 6+ sources)
// ⚠ REMOVED 'School Vehicle' — NOT in official exemptions (private school reps
//   confirmed they face restrictions; not listed in NDSC announcement)
// ⚠ REMOVED 'Company Shuttle' — NOT officially exempt (sources state company
//   shuttles will face 'significant operational difficulties')
// ✅ ADDED 'Hearse' — explicitly named as exempt in NDSC announcement
// ✅ ADDED 'Fuel Transport Vehicle' — explicitly named as exempt
// ✅ ADDED 'Construction Vehicle' — explicitly named as exempt
const EXEMPT_TYPES = [
  { label: "🚌 Public Transport Bus", labelMy: "အများသူငှာ ဘတ်စ်ကား", exempt: true },
  { label: "🚕 Taxi", labelMy: "တက်စီ", exempt: true },
  { label: "🚑 Ambulance / Emergency", labelMy: "အမ်ဘူလင်း / အရေးပေါ်ယာဉ်", exempt: true },
  { label: "⚰️ Hearse", labelMy: "သင်္ဂြိုဟ်ယာဉ်", exempt: true },
  { label: "🚛 Cargo Truck", labelMy: "ကုန်တင်ယာဉ်", exempt: true },
  { label: "⛽ Fuel Transport Vehicle", labelMy: "ဆီတင်ကား / ဆီသယ်ယာဉ်", exempt: true },
  { label: "🏗️ Construction Vehicle", labelMy: "အဆောက်အဦဆောက်လုပ်ရေးယာဉ်", exempt: true },
  { label: "🗑️ Sanitation / Municipal", labelMy: "သန့်ရှင်းရေးယာဉ် / မြို့တော်ယာဉ်", exempt: true },
  { label: "⚡ Electric Vehicle (EV)", labelMy: "လျှပ်စစ်ကား (EV)", exempt: true },
  { label: "⚡ Electric Motorcycle", labelMy: "လျှပ်စစ်မော်တော်ဆိုင်ကယ်", exempt: true },
  { label: "🚗 Private Car", labelMy: "ပုဂ္ဂလိကကား", exempt: false },
  { label: "🏍️ Motorcycle (gas)", labelMy: "မော်တော်ဆိုင်ကယ် (ဓာတ်ဆီ)", exempt: false }
];

// ─── State ────────────────────────────────────────────
let state = "GREETING"; // GREETING → ASK_TYPE → ASK_SCAN → RESULT → ASK_AGAIN
let selectedType = null;

// ─── DOM References ───────────────────────────────────
const chatWindow = document.getElementById("chat-window");
const uploadZone = document.getElementById("upload-zone");
const manualEntry = document.getElementById("manual-entry");
const manualInput = document.getElementById("plate-input");
const manualSubmit = document.getElementById("manual-submit");
const quickReplies = document.getElementById("quick-replies");
const textInputRow = document.getElementById("text-input-row");
const userTextInput = document.getElementById("user-text-input");
const sendBtn = document.getElementById("send-btn");
const plateUpload = document.getElementById("plate-upload");
const processingInd = document.getElementById("processing-indicator");
const uploadLabel = document.getElementById("upload-label");
const dateBadge = document.getElementById("date-badge");

// ─── Date helpers ─────────────────────────────────────
function getToday() {
  // Myanmar time (UTC+6:30)
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Rangoon" }));
  return { day: now.getDate(), dateStr: now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Rangoon" }) };
}

function isOddDate() { return getToday().day % 2 !== 0; }

// ─── Render helpers ───────────────────────────────────
function addBotBubble(htmlContent, delayed = true) {
  return new Promise(resolve => {
    // typing indicator
    const typingRow = document.createElement("div");
    typingRow.className = "bubble-row bot";
    typingRow.innerHTML = `<div class="avatar">🤖</div><div class="bubble bot"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
    chatWindow.appendChild(typingRow);
    scrollToBottom();

    setTimeout(() => {
      typingRow.remove();
      const row = document.createElement("div");
      row.className = "bubble-row bot";
      row.innerHTML = `<div class="avatar">🤖</div><div class="bubble bot">${htmlContent}</div>`;
      chatWindow.appendChild(row);
      scrollToBottom();
      resolve();
    }, delayed ? 900 : 100);
  });
}

function addUserBubble(text) {
  const row = document.createElement("div");
  row.className = "bubble-row user";
  row.innerHTML = `<div class="bubble user">${text}</div>`;
  chatWindow.appendChild(row);
  scrollToBottom();
}

function scrollToBottom() {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function setQuickReplies(options) {
  quickReplies.innerHTML = "";
  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "qr-btn";
    btn.textContent = opt.label;
    btn.addEventListener("click", () => handleQuickReply(opt));
    quickReplies.appendChild(btn);
  });
}

function clearQuickReplies() { quickReplies.innerHTML = ""; }

function showUploadZone(visible) {
  uploadZone.style.display = visible ? "block" : "none";
}
function showManualEntry(visible) {
  manualEntry.style.display = visible ? "flex" : "none";
}
function showTextInput(visible) {
  textInputRow.style.display = visible ? "flex" : "none";
}

// ─── Flow control ─────────────────────────────────────
async function startGreeting() {
  state = "GREETING";
  showTextInput(false);
  showUploadZone(false);
  showManualEntry(false);
  clearQuickReplies();

  await addBotBubble(
    `${MSG.greeting.en}<span class="my-text">${MSG.greeting.my}</span>`
  );
  await askVehicleType();
}

async function askVehicleType() {
  state = "ASK_TYPE";
  await addBotBubble(
    `${MSG.askVehicleType.en}<span class="my-text">${MSG.askVehicleType.my}</span>`
  );
  setQuickReplies(EXEMPT_TYPES.map(t => ({ label: t.label, labelMy: t.labelMy, exempt: t.exempt, raw: t })));
}

async function handleQuickReply(opt) {
  if (state === "ASK_TYPE") {
    selectedType = opt;
    addUserBubble(opt.label);
    clearQuickReplies();

    if (opt.exempt) {
      // Exempted vehicle
      await addBotBubble(
        MSG.exempted.en(opt.label) + MSG.exempted.my(opt.labelMy)
      );
      await addBotBubble(MSG.disclaimer.en + MSG.disclaimer.my);
      await promptAnother();
    } else {
      // Private car / motorcycle → need plate
      await addBotBubble(
        `${MSG.askScan.en}<span class="my-text">${MSG.askScan.my}</span>`
      );
      state = "ASK_SCAN";
      showUploadZone(true);
      showManualEntry(true);
    }
  } else if (state === "ASK_AGAIN") {
    if (opt.label === "✅ Yes / ဟုတ်ကဲ့") {
      clearQuickReplies();
      await startGreeting();
    } else {
      clearQuickReplies();
      await addBotBubble("Thank you for using Myanmar Driver Check! Stay safe. 🙏<span class='my-text'>ကျေးဇူးတင်ပါသည်! ဘေးကင်းစွာ မောင်းနှင်ပါ။</span>");
    }
  }
}

async function promptAnother() {
  state = "ASK_AGAIN";
  await addBotBubble(`${MSG.askAnother.en}<span class="my-text">${MSG.askAnother.my}</span>`);
  setQuickReplies([
    { label: "✅ Yes / ဟုတ်ကဲ့" },
    { label: "❌ No / မလိုပါ" }
  ]);
}

// ─── OCR Logic ────────────────────────────────────────
async function runOCR(file) {
  uploadLabel.style.display = "none";
  processingInd.style.display = "flex";

  await addBotBubble(`${MSG.processing.en}<span class="my-text">${MSG.processing.my}</span>`, false);

  try {
    const { data: { text } } = await Tesseract.recognize(file, "eng", {
      tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz/ -",
      logger: () => { }
    });

    const digits = text.replace(/\D/g, "");
    if (!digits) throw new Error("No digits found");

    const lastDigit = parseInt(digits[digits.length - 1]);
    await processPlateResult(digits, lastDigit, text.trim());

  } catch (e) {
    await addBotBubble(`${MSG.ocrFailed.en}<span class="my-text">${MSG.ocrFailed.my}</span>`);
    showManualEntry(true);
  } finally {
    uploadLabel.style.display = "flex";
    processingInd.style.display = "none";
  }
}

async function processPlateResult(rawDigits, lastDigit, rawText) {
  showUploadZone(false);
  showManualEntry(false);

  const { day } = getToday();
  const todayOdd = isOddDate();
  const plateOdd = lastDigit % 2 !== 0;

  const plateDisplay = rawText || rawDigits;
  addUserBubble(`🔍 OCR Result: <em>${plateDisplay}</em> (last digit: <strong>${lastDigit}</strong>)`);

  let cardClass, cardIcon, resultData;
  if (todayOdd && plateOdd || !todayOdd && !plateOdd) {
    // Allowed
    cardClass = "allowed";
    resultData = MSG.result.allowed(rawDigits, lastDigit, day);
  } else {
    // Denied
    cardClass = "denied";
    resultData = MSG.result.denied(rawDigits, lastDigit, day);
  }

  const card = `
    <div class="result-card ${cardClass}">
      ${resultData.en}
      <span class="result-detail result-detail-my">${resultData.my}</span>
      <span class="result-detail">Date: ${getToday().dateStr} | Last digit: ${lastDigit} | Today is ${todayOdd ? "ODD (မဂ္ဂဇိဇ်)" : "EVEN (စစ်ကိန်း)"}</span>
    </div>`;

  await addBotBubble(card);
  await addBotBubble(`${MSG.disclaimer.en}<br>${MSG.disclaimer.my}`);
  await promptAnother();
}

// ─── Manual plate entry ───────────────────────────────
async function handleManualPlate(raw) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) { manualInput.value = ""; manualInput.focus(); return; }
  const lastDigit = parseInt(digits[digits.length - 1]);
  showManualEntry(false);
  showUploadZone(false);
  await processPlateResult(digits, lastDigit, raw.trim());
}

// ─── Event Listeners ──────────────────────────────────
plateUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  runOCR(file);
  plateUpload.value = "";
});

manualSubmit.addEventListener("click", () => handleManualPlate(manualInput.value));
manualInput.addEventListener("keydown", (e) => { if (e.key === "Enter") handleManualPlate(manualInput.value); });

sendBtn.addEventListener("click", () => handleFreeText(userTextInput.value));
userTextInput.addEventListener("keydown", (e) => { if (e.key === "Enter") handleFreeText(userTextInput.value); });

async function handleFreeText(text) {
  if (!text.trim()) return;
  userTextInput.value = "";
  // If user typed a number, treat as manual plate
  if (state === "ASK_SCAN" && /\d/.test(text)) {
    addUserBubble(text);
    await handleManualPlate(text);
  } else {
    addUserBubble(text);
    await addBotBubble("I understand! For now, please use the buttons or upload a plate photo to check driving eligibility.<span class='my-text'>ခလုတ်များ သုံး၍ စစ်ဆေးပါ။</span>");
  }
}

// ─── Init ─────────────────────────────────────────────
(function init() {
  // Date badge
  const { day, dateStr } = getToday();
  const oddEven = isOddDate() ? "ODD DAY 🟡" : "EVEN DAY ⚪";
  dateBadge.textContent = `${dateStr} — ${oddEven}`;

  startGreeting();
})();
