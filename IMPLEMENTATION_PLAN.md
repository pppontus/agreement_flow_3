# Implementation Roadmap – Bixia Avtalsflöde

> **Princip:** Små steg. Du testar själv efter varje steg – jag beskriver vad du ska verifiera.

---

## Fas 0: Projektsetup (Skalbar arkitektur)

### 0.1 Initiera Next.js-projekt
- [x] Skapa Next.js 14 projekt med TypeScript
- [x] Konfigurera absoluta imports (`@/components`, `@/hooks`, etc.)

### 0.2 Mappstruktur
- [x] Skapa skalbar mappstruktur:
```
src/
├── app/                  # Next.js App Router
├── components/
│   ├── ui/              # Återanvändbara UI-komponenter (Button, Card, Input)
│   ├── flow/            # Flödesspecifika komponenter (ProductCard, AddressSearch)
│   └── layout/          # Header, Footer, Container
├── hooks/               # Custom hooks (useFlowState, useApi)
├── lib/                 # Utilities, helpers
├── services/            # API-anrop, mock-data
├── types/               # TypeScript types (CaseState, Product, etc.)
└── styles/              # Globala CSS-filer
```

### 0.3 Grundläggande styling
- [x] Sätt upp CSS-variabler (neutrala gråtoner, spacing, typography)
- [x] Skapa base styles (reset, typography)
- [x] **Färgpalett:** Generisk gråskala (passar valfritt brand)

**🔍 Testa:** Kör `npm run dev`. Du ska se en tom sida. Kontrollera att mappstrukturen finns i VS Code.

---

## Fas 1: Produktkort (Första visuella steget)

### 1.1 Types & Mock-data
- [x] Skapa `types/product.ts` med Product-interface
- [x] Skapa `services/mockData.ts` med produkter + priser per elområde

### 1.2 UI-komponenter
- [x] Skapa `components/ui/Card.tsx` (generisk kortkomponent)
- [x] Skapa `components/ui/Select.tsx` (dropdown för elområde)

### 1.3 Produktkort-komponent
- [x] Skapa `components/flow/ProductCard.tsx`
  - Visar produktnamn, pris
  - Disabled state (inte klickbar)
  
### 1.4 Produktval-vy
- [x] Skapa `components/flow/ProductSelection.tsx`
  - Tre kort: Fastpris, Rörligt, Kvartspris
  - Elområdesväljare (SE1-SE4)
  - Priserna uppdateras vid byte av område

**🔍 Testa:** Kör `npm run dev`. Du ser tre produktkort med priser. Byt elområde i dropdown – priserna uppdateras. Korten går EJ att klicka på.

---

## Fas 2: Klickbara produktkort + Navigation

### 2.1 Flow State
- [ ] Skapa `types/caseState.ts` (från PLAN.md)
- [ ] Skapa `hooks/useFlowState.ts` (grundläggande state-hantering)

### 2.2 Gör korten klickbara
- [ ] Lägg till onClick på ProductCard
- [ ] Markera valt kort visuellt

### 2.3 Navigation
- [ ] Skapa `hooks/useFlowNavigation.ts`
- [ ] Lägg till "Fortsätt"-knapp (disabled om inget val)

**🔍 Testa:** Klicka på ett kort – det markeras visuellt. "Fortsätt"-knappen aktiveras.

---

## Fas 3: Adressinmatning

### 3.1 Adress-types & Mock
- [ ] Skapa `types/address.ts`
- [ ] Skapa mock-data för adressökning i `services/mockData.ts`

### 3.2 Adress-komponenter
- [ ] Skapa `components/flow/AddressSearch.tsx` (autocomplete-input)
- [ ] Skapa `components/flow/AddressList.tsx` (träfflista)
- [ ] Skapa `components/flow/AddressConfirm.tsx` (bekräftelse-vy)

### 3.3 Lägenhetsnummer & c/o
- [ ] Skapa `components/flow/ApartmentInput.tsx`
- [ ] Skapa `components/flow/CoInput.tsx`

**🔍 Testa:** Sök en adress. Välj från listan. Bekräfta. Om adressen är LGH → lägenhetsnummer-fält visas.

---

## Fas 4: Identifiering (BankID / Manuell)

### 4.1 ID-types
- [ ] Utöka `types/caseState.ts` med IdMethod

### 4.2 ID-komponenter
- [ ] Skapa `components/flow/IdentifyOptions.tsx` (val av metod)
- [ ] Skapa `components/flow/BankIdFlow.tsx` (simulerad BankID)
- [ ] Skapa `components/flow/ManualPnrInput.tsx` (personnummer-fält)

### 4.3 API-mock för identify
- [ ] Skapa `services/api/identify.ts` med MSW-mock

**🔍 Testa:** Välj BankID → simulerad signering. Välj "Jag kan inte använda BankID" → personnummerfält visas, inga personuppgifter prefylls.

---

## Fas 5: Scenario (Flytt-detection)

### 5.1 Scenario-logik
- [ ] Skapa `services/api/scenario.ts`
- [ ] Implementera smart flytt-detection

### 5.2 Scenario-komponenter
- [ ] Skapa `components/flow/MoveOfferDialog.tsx` (Flytt-erbjudande)
- [ ] Skapa `components/flow/ScenarioSelect.tsx` (Fallback-val)

**🔍 Testa:** Använd Cecilia/Denise-persona. Efter identifiering visas flytt-erbjudande om de har befintligt avtal på annan adress.

---

## Fas 6: Datum, Kontakt, Faktura

### 6.1 Datum
- [ ] Skapa `components/flow/StartDatePicker.tsx` (inline kalender)

### 6.2 Kontakt
- [ ] Skapa `components/flow/ContactForm.tsx` (e-post + telefon)

### 6.3 Faktura
- [ ] Skapa `components/flow/InvoiceAddress.tsx`

**🔍 Testa:** Välj "Tidigast möjligt" eller "Välj datum" (kalender öppnas inline). Fyll i e-post/telefon. Eventuellt annan fakturaadress.

---

## Fas 7: Villkor & Signering

### 7.1 Villkor
- [ ] Skapa `components/flow/TermsConsent.tsx`
- [ ] Skapa `components/flow/RiskInfo.tsx` (endast Fast/Kvarts)

### 7.2 Signering (simulerad)
- [ ] Skapa `components/flow/SigningFlow.tsx`

### 7.3 Kvittens
- [ ] Skapa `components/flow/Confirmation.tsx`

**🔍 Testa:** Bocka i villkor. Vid Fast/Kvarts: riskinformation visas. Klicka "Signera" → simulerad BankID → kvittens visas.

---

## Fas 8: Felhantering & Stop Pages

- [ ] Skapa `components/flow/StopPage.tsx`
- [ ] Implementera scenarion: Duplicate, Pågående, Kan ej leverera

**🔍 Testa:** Använd Erik-persona (dubblett). Stopsida "Redan klart" visas istället för signering.

---

## Fas 9: Polish & Loading States

- [ ] Lägg till diskreta loading-animationer
- [ ] Skeleton loaders för adressökning
- [ ] Timeout-hantering

**🔍 Testa:** Skeleton loader vid adressökning. Knappar har subtil animation vid klick.

---

## Fas 10: Tillgänglighet (a11y)

- [ ] Keyboard-navigering
- [ ] Focus states
- [ ] ARIA-labels
- [ ] Skärmläsartest

**🔍 Testa:** Tab-navigering fungerar genom hela flödet.

---

## Testning

Efter varje fas:
1. Kör `npm run dev`
2. Testa enligt **🔍 Testa**-sektionen
3. Ge mig feedback
4. Vi justerar eller går vidare
