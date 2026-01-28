# Implementation Roadmap – Bixia Avtalsflöde

> **Princip:** Små steg. Du testar själv efter varje steg – jag beskriver vad du ska verifiera.

---

## Fas 0: Projektsetup (Skalbar arkitektur) ✅

### 0.1 Initiera Next.js-projekt
- [x] Skapa Next.js 14 projekt med TypeScript
- [x] Konfigurera absoluta imports (`@/components`, `@/hooks`, etc.)

### 0.2 Mappstruktur
- [x] Skapa skalbar mappstruktur
- [x] `src/context` för DevPanel och FlowState

### 0.3 Grundläggande styling
- [x] Sätt upp CSS-variabler (neutrala gråtoner, spacing, typography)
- [x] Skapa base styles (reset, typography)
- [x] **Färgpalett:** Generisk gråskala

---

## Fas 1: Produktkort (Första visuella steget) ✅

### 1.1 Types & Mock-data
- [x] Skapa `types/product.ts` med Product-interface
- [x] Skapa `services/mockData.ts` med produkter + priser per elområde

### 1.2 UI-komponenter
- [x] Skapa `components/ui/Card.tsx` (generisk kortkomponent)
- [x] Skapa `components/ui/Select.tsx` (dropdown för elområde)

### 1.3 Produktkort-komponent
- [x] Skapa `components/flow/ProductCard.tsx`
- [x] **Update:** "Teckna"-knapp istället för klickbart kort

### 1.4 Produktval-vy
- [x] Skapa `components/flow/ProductSelection.tsx`
- [x] Integrera prisuppdatering vid byte av elområde

---

## Fas 2: Klickbara produktkort + Navigation ✅

### 2.1 Flow State
- [x] Skapa `context/FlowStateContext.tsx`
- [x] Skapa `hooks/useFlowState.ts`

### 2.2 Navigation
- [x] Implementera `goToStep` logik i `page.tsx`
- [x] Dynamisk "Gå tillbaka"-logik (Smart Navigation)

---

## Fas 3: Adressinmatning ✅

### 3.1 Adress-types & Mock
- [x] Skapa `types/address.ts`
- [x] `services/addressService.ts` med dynamisk mock (täcker alla elområden)

### 3.2 Adress-komponenter
- [x] Skapa `components/flow/AddressSearch.tsx`
- [x] **Feature:** Folkbokföring "Quick Pick" / Auto-fill (Smart Flow Iteration 3)

### 3.3 Lägenhetsnummer & c/o
- [x] Integrera lägenhetsval direkt i AddressSearch.tsx
- [x] Priskrock-hantering för elområdeskonflikter (PriceConflictResolver)

---

## Fas 4: Identifiering (BankID / Manuell) ✅

### 4.1 ID-types
- [x] `types/index.ts` med ID-metoder

### 4.2 ID-komponenter
- [x] Skapa `components/flow/Identification.tsx`
- [x] `components/flow/BankIdSim.tsx` (Simulerad laddning/QR)
- [x] `components/flow/ManualPnr.tsx`

### 4.3 API-mock
- [x] `services/scenarioService.ts` (Hanterar identifiering & Scenarios)

---

## Fas 5: Scenario (Flytt-detection) ✅

### 5.1 Scenario-logik
- [x] `services/scenarioService.ts` returnerar scenario (NY, BYTE, FLYTT)
- [x] Mock-logik baserat på PNR-suffix (2222=Byte, 1111=Flytt)

### 5.2 Scenario-komponenter
- [x] Skapa `components/flow/MoveOffer.tsx` (Ersatte MoveOfferDialog med inline-steg)
- [x] Scenario-routing i `page.tsx`

---

## Fas 6: Datum, Kontakt, Faktura ✅

### 6.1 Datum
- [x] Skapa `components/flow/StartDatePicker.tsx`
- [x] **Uppdate:** "Byta avtal"-logik (bindningstidshantering) (Smart Flow Iteration 4)

### 6.2 Kontakt
- [x] Skapa `components/flow/ContactForm.tsx`
- [x] **Feature:** Pre-fill & Confirm kontaktuppgifter (Smart Flow Iteration 2)

### 6.3 Faktura
- [ ] Skapa `components/flow/InvoiceAddress.tsx` (Kvar att göra?)

---

## Backend Visualizer & Dev Tools ✅

- [x] DevPanel (Sidopanel för debugging)
- [x] ApiLog & StateViewer
- [x] Mock Scenarios (Tvinga fram Byte/Flytt/Ny kund)

---

## Fas 7: Villkor & Signering (Nästa steg)

### 7.1 Villkor
- [ ] Skapa `components/flow/TermsConsent.tsx`
- [ ] Skapa `components/flow/RiskInfo.tsx` (endast Fast/Kvarts)

### 7.2 Signering (simulerad)
- [ ] Skapa `components/flow/SigningFlow.tsx`

### 7.3 Kvittens
- [ ] Skapa `components/flow/Confirmation.tsx`

---

## Fas 8-10: Error Handling, Polish, A11y

- [ ] Stop Pages
- [ ] Loading States
- [ ] Accessibility Audit

---
