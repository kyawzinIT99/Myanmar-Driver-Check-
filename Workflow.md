# Workflow Overhaul: Myanmar Odd-Even Driving Scheme Integration

## Official Source Reference

> **Announced by:** National Defence and Security Council (NDSC)
> **Announcement Date:** March 3, 2026
> **Effective Date:** March 7, 2026
> **Verified via:** Eleven Myanmar, Khaosod English, Yangon Media Group, Myanmar ITV, The Star / Reuters, Irrawaddy

---

## 1. Core Rule

Private vehicles operate on alternate days based on their license plate's last digit:
- **Odd Dates** (1st, 3rd, 5th…): Plates ending in **odd digits** (1, 3, 5, 7, 9) may drive & fuel.
- **Even Dates** (2nd, 4th, 6th…): Plates ending in **even digits** (0, 2, 4, 6, 8) may drive & fuel.

---

## 2. Official Verified Exemptions

> ⚠ Exemptions sourced directly from NDSC announcement and cross-checked across 6+ independent news sources.

| # | Vehicle Type | Verified? | Source Notes |
|---|---|---|---|
| 1 | **Public Transport Buses** | ✅ Yes | All major sources |
| 2 | **Taxis** | ✅ Yes | All major sources |
| 3 | **Ambulances / Emergency Vehicles** | ✅ Yes | All major sources |
| 4 | **Hearses** | ✅ Yes | Explicitly named in NDSC announcement |
| 5 | **Cargo Trucks** | ✅ Yes | All major sources |
| 6 | **Fuel Transport Vehicles** | ✅ Yes | Eleven Myanmar, Yangon Media Group |
| 7 | **Construction Vehicles** | ✅ Yes | Eleven Myanmar, Yangon Media Group |
| 8 | **Sanitation / Municipal Garbage Trucks** | ✅ Yes | All major sources |
| 9 | **Electric Vehicles (EVs)** | ✅ Yes | All major sources |
| 10 | **Electric Motorcycles** | ✅ Yes | All major sources |

### ❌ Removed — NOT Officially Exempt

| Vehicle Type | Reason Removed |
|---|---|
| School Vehicles | NOT in NDSC list; private school rep confirmed they face restrictions |
| Company Employee Shuttles | NOT officially exempt; sources confirm "significant operational difficulties" |

---

## 3. Fuel Purchase Restrictions

- **General:** Private vehicles limited to **50,000 MMK** of fuel per visit.
- **Mandalay (Stricter):** Motorcycles limited to **5,000 MMK**; cars to **15,000 MMK**.
- **Fuel purchase obeys the same odd-even rule** as driving (odd plates buy on odd dates).
- **Authorities prohibit** hoarding or reselling fuel at inflated prices. Violations prosecuted.

---

## 4. System Verification Logic (Chatbot)

For our website's chatbot to accurately reflect reality:

1. **User selects vehicle type** → check against the official exemption table above.
2. **If exempt** → instant clearance message, no plate check needed.
3. **If private car or gas motorcycle** → prompt for OCR plate scan or manual entry.
4. **Extract last digit of plate** → compare against today's date parity.
5. **Display verdict** (with fuel restriction info) + sourced disclaimer.

---

## 5. Data Quality & Reputation Protocol

- **All chatbot messages cite:** NDSC announcement date and media sources.
- **Disclaimer** on every result: rules may change without notice; confirm with local authorities.
- **Update trigger:** Any new NDSC statement must trigger a code update within 24 hours.
- **Removed unverified data:** School vehicles and company shuttles removed from exemptions after source verification revealed they are NOT officially exempt.
