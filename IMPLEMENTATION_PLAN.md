# Implementation Roadmap – Bixia Avtalsflöde (MVP Koncept) ✅

> **Status:** Allt implementerat för MVP-prototypen.

---

## Fas 0: Projektsetup (Skalbar arkitektur) ✅
- [x] Next.js 14 + TypeScript + CSS Modules
- [x] FlowStateContext & useFlowState hook
- [x] DevPanel för debugging & scenario-testing

## Fas 1: Produktval & Produktkort ✅
- [x] Dynamiska produktkort med elområdesstöd
- [x] [NEW] **Smart Advisor:** Interaktiv guide (ContractAdvisor) för att hitta rätt avtalsform
- [x] [NEW] **Discount Toggle:** Rabatterade partneravtal via smidig switch
- [x] [NEW] **Architecture Intro:** Tydlig inramning av MVP-konceptet på förstasidan

## Fas 2: Adress & Priskrock ✅
- [x] Smart adressök (AddressSearch) med folkbokföringsval
- [x] Hantering av lägenhetsnummer och c/o (repositionerat under adress)
- [x] PriceConflictResolver för automatiskt elområdesbyte

## Fas 3: Identifiering & Scenarios ✅
- [x] BankID-simulering (QR/Mobil) & manuell personnummerinmatning
- [x] Automatisk kundigenkänning via scenarioService
- [x] Hantering av scenarios: **BYTE**, **FLYTT/INFLYTT**, **EXTRA ANLÄGGNING**

## Fas 4: Detaljer & Flexibilitet ✅
- [x] Dynamisk val av startdatum baserat på scenariot
- [x] Förifyllda kontaktuppgifter för existerande kunder
- [x] Stöd för anläggnings-ID/fullmakt på villkorssidan vid flytt

## Fas 5: Villkor, Signering & Sammanfattning ✅
- [x] Kontextuella villkor (TermsConsent) och RiskInfo (Fast/Kvarts)
- [x] [NEW] **Signering-sammanfattning:** Tydlig kontrollvy av avtal, adress och pris innan BankID
- [x] Simulerad signering och bekräftelsevy (Confirmation)

---

## Smart Flow MVP – Fokusområden
- **Flödeslogik:** Rätt information vid rätt tillfälle.
- **Enkelhet:** Minimalt antal steg och fält.
- **Decoupling:** Fristående produktkort som kan användas på hela bixia.se.

---

