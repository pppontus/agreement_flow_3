# To-do: korrigera privat avtalsflöde för klickbar MVP

Senast uppdaterad: 2026-02-20
Underlag: `Avtalsflöde (1).pdf` + nuvarande implementation i kodbasen.
Primärt mål: ett mycket bra testflöde för intern "klicka igenom"-validering av kundupplevelse i olika scenarion.

## 1) Principer för detta arbete

- Vi bygger inte riktiga integrationer (CRM/BankID/backend), bara trovärdigt mockat beteende.
- Vi följer inte PDF slaviskt om en avvikelse ger bättre testbarhet/kundkänsla i MVP.
- Juridiskt och flödesmässigt kritiska steg ska fortfarande upplevas korrekta.
- Flödet ska vara robust för demo med tydliga steg, tydlig back-navigation och inga "döda val" som ser viktiga ut men inte påverkar något.

## 2) Definition of Done för MVP-flödet

Flödet är klart när:

- En testare kan klicka igenom minst 6 realistiska scenarion utan att fastna.
- Alla centrala val i UI (t.ex. flytt/nytt, fullmakt/manuellt anläggnings-ID) påverkar faktisk fortsättning.
- Flödet kan simuleras som ny kund, befintlig kund, flytt, byte med bindning, byte utan bindning.
- Data som samlas in i viktiga steg syns i sammanfattning/signering/efterföljande steg.
- Eventuella "stoppfall" har en tydlig och rimlig UX (inte tyst misslyckande).

## 3) Prioriterad ändringslista (ordning att bygga i)

## P0 - Måste göras

### [X] P0.1 Gör "flytta med avtal" och "teckna nytt" till riktiga brancher

Problem:

- `MoveOffer` visar två olika val men båda går idag till samma handler och samma nästa steg.

Målbeteende:

- Val A: "Flytta med befintligt avtal" sätter scenario/spår som flytt.
- Val B: "Teckna nytt avtal på ny adress" sätter scenario/spår som nyteckning på ny adress.
- Senare copy och sammanfattning ska spegla detta val.

Filer att ändra:

- `src/components/flow/MoveOffer.tsx`
- `src/components/flows/PrivateFlow.tsx`
- `src/context/FlowStateContext.tsx`
- `src/types/index.ts`

Implementation (MVP-nivå):

- Lägg till ett enkelt statefält i privat state, t.ex. `moveChoice: 'MOVE_EXISTING' | 'NEW_ON_NEW_ADDRESS' | null`.
- Skapa setter i context, t.ex. `setMoveChoice(...)`.
- Koppla `onMove` och `onNew` till separata handlers i `PrivateFlow`.
- Använd valet i copy på minst ett senare steg (`StartDatePicker`, `SigningFlow` eller `Confirmation`).

Acceptance criteria:

- Testare kan välja båda vägarna och se skillnad i efterföljande text/upplevelse.
- Back från `DETAILS` går tillbaka till `MOVE_OFFER` med bibehållet val.

---

### [X] P0.2 Koppla anläggnings-ID/fullmakt till faktisk state och vidare flöde

Problem:

- `TermsConsent` samlar in `facilityId`, men `PrivateFlow` ignorerar datan.
- UI antyder viktigt affärsbeslut som i praktiken försvinner.

Målbeteende:

- Om kunden godkänner fullmakt: det sparas och påverkar post-signering (visa att fullmakt skickas).
- Om kunden anger manuellt anläggnings-ID: värdet sparas och används i sammanfattning/signering.

Filer att ändra:

- `src/components/flow/TermsConsent.tsx`
- `src/components/flows/PrivateFlow.tsx`
- `src/context/FlowStateContext.tsx`
- `src/types/index.ts`
- `src/components/flow/SigningFlow.tsx`
- `src/components/flow/Confirmation.tsx`

Implementation (MVP-nivå):

- Utöka state med t.ex.:
- `facilityHandling: { mode: 'FROM_CRM' | 'FETCH_WITH_POWER_OF_ATTORNEY' | 'MANUAL'; facilityId: string | null }`
- Skapa setter i context: `setFacilityHandling(...)`.
- I `handleAuthenticated` i `PrivateFlow`: sätt `FROM_CRM` för `BYTE` när CRM-svar innehåller anläggnings-ID.
- I `handleTermsConfirm` i `PrivateFlow`: mappa manuell/fullmakt från `TermsConsent` till state utan att skriva över CRM-värde när frågan inte visas.
- I `SigningFlow`/`Confirmation`/DevPanel: visa källa och värde.
- Om fullmakt valts: visa i eftersteg en tydlig info-rad "Fullmakt skickas".

Acceptance criteria:

- Ingen facility-data tappas mellan steg.
- Samma användarval syns konsekvent från villkor till bekräftelse.
- Befintlig kund på samma adress (`BYTE`) får anläggnings-ID auto-hämtat från CRM-mock vid verifiering.
- Flytt-/ny-adress-spår återanvänder inte CRM-ID från befintligt avtal.

Status 2026-02-20:

- Implementerat `facilityHandling` i state + setter i context.
- `TermsConsent` sparar fullmakt/manuellt ID och återvisar tidigare val vid back.
- `SigningFlow`, `Confirmation` och DevPanel visar facility-val konsekvent.
- CRM-mock ger `facilityId` för `BYTE` och detta sätts som `FROM_CRM` efter identifiering.
- `FLYTT` ger inte CRM-ID i state för att undvika fel anläggning vid flytt/extra adress.

---

### [X] P0.3 Inför fakturaadress-steg (separat eller i kontaktsteg)

Problem:

- PDF-flödet har explicit beslut om fakturaadress.
- Nuvarande `ContactForm` samlar endast e-post/mobil.

Målbeteende:

- Kunden kan välja förvald rekommenderad fakturaadress eller (vid extra adress) byta till alternativ känd adress.
- Enkel och snabb UX som känns realistisk för avtalsteckning.

Filer att ändra:

- `src/components/flow/ContactForm.tsx` (eller nytt steg `InvoiceAddress.tsx`)
- `src/components/flows/PrivateFlow.tsx`
- `src/context/FlowStateContext.tsx`
- `src/types/index.ts`

Implementation (MVP-nivå):

- Rekommenderat: bygg in i `ContactForm` som extra sektion för att hålla demo-flödet kort.
- Lägg till state:
- `invoice: { mode: 'SAME_AS_RECOMMENDED' | 'OTHER_KNOWN'; address: Address | null }`
- Förval:
- standard: vald avtalsadress
- vid "ytterligare adress" (`NEW_ON_NEW_ADDRESS`): tidigare adress (`folkbokforing`)
- Ge val att byta till den andra kända adressen när den finns.

Acceptance criteria:

- Testare kan slutföra med både förvald och alternativ känd fakturaadress.
- Valet syns i signeringssammanfattning.

Status 2026-02-20:

- Fakturaadress-val inbyggt i `ContactForm` med förvalt rekommenderat val.
- Default följer affärsregel: vid extra adress används tidigare adress som default.
- Valet sparas i state (`invoice`) och överlever back/fram.
- Valet visas i `SigningFlow`, `Confirmation` och DevPanel.

---

### [ ] P0.4 Säkerställ att "generiskt avtal" inte leder till otydlig signering

Problem:

- "Teckna elavtal" (GENERIC) riskerar att gå vidare utan tydligt faktiskt avtalsval.

Målbeteende:

- Om kunden startat generiskt måste hen explicit välja konkret avtalsform innan signering.
- Pris-konfliktsteget och avtalsvalsteget ska kännas logiska.

Filer att ändra:

- `src/components/flow/ProductSelection.tsx`
- `src/components/flows/PrivateFlow.tsx`
- ev. `src/components/flow/PriceConflictResolver.tsx`

Implementation (MVP-nivå):

- Lägg en guard innan `TERMS`/`SIGNING`: `selectedProduct.type` måste vara verklig produkt (inte GENERIC).
- Om generisk: routa till ett tydligt "Välj avtalsform"-steg (kan återanvända `ProductSelection` i ett "address-known mode").

Acceptance criteria:

- Ingen användare kan nå signering med odefinierad avtalsform.

## P1 - Bör göras

### [ ] P1.1 Förbättra mockad scenariologik så den känns som CRM utan integration

Problem:

- Scenario bestäms idag i praktiken av PNR-suffix/mock override, vilket är tekniskt ok men inte alltid trovärdigt i demo.

Målbeteende:

- Demoläget ska vara enkelt att styra från DevPanel med realistiska utfall.

Filer att ändra:

- `src/services/scenarioService.ts`
- `src/context/DevPanelContext.tsx`
- `src/components/flows/PrivateFlow.tsx`

Implementation (MVP-nivå):

- Behåll mock, men gör scenarion explicit valbara:
- `NY_KUND`
- `BYTE_MED_BINDNING`
- `BYTE_UTAN_BINDNING`
- `FLYTT`
- `STOPP_KAN_INTE_LEVERERA` (simulerat stopp)
- `DUBBELT_AVTAL` (simulerat stopp)
- Gör "RANDOM" mer rimlig men deterministisk per session.

Acceptance criteria:

- Testledare kan snabbt välja scenario och få förväntad UX utan special-PNR.

---

### [ ] P1.2 Implementera tydlig stopp-/fallback-skärm för simulerade stoppfall

Problem:

- Typerna innehåller stop-reasons men de används i princip inte i UI.

Målbeteende:

- Vid simulerat stopp visas tydlig förklaring och nästa steg (t.ex. "Kontakta kundtjänst").

Filer att ändra:

- `src/types/index.ts`
- `src/context/FlowStateContext.tsx`
- `src/components/flows/PrivateFlow.tsx`
- ev. ny komponent `src/components/flow/FlowStop.tsx`

Implementation (MVP-nivå):

- Lägg till enkel stopp-komponent med 2-3 stopporsaker.
- Lägg in "starta om" och "gå tillbaka" actions.

Acceptance criteria:

- Inget scenario slutar i tyst fel/logg-only.

---

### [ ] P1.3 Justera appsteg efter bekräftelse till frivillig del av upplevelsen

Problem:

- `APP_DOWNLOAD` är idag obligatoriskt steg i flödet.
- För intern test av avtal kan det skapa onödig friktion.

Målbeteende:

- Användare kan avsluta direkt efter bekräftelse, men fortfarande få app-CTA.

Filer att ändra:

- `src/components/flows/PrivateFlow.tsx`
- `src/components/flow/Confirmation.tsx`
- `src/components/flow/AppDownloadPrompt.tsx`

Implementation (MVP-nivå):

- Gör appsteg valbart:
- "Gå till Mina Sidor" direkt
- "Ladda ner appen" som sekundär väg

Acceptance criteria:

- Flödet kan avslutas utan extra steg.
- Appnedladdning finns kvar som testbar branch.

## P2 - Nice to have men värdefullt för testkvalitet

### [ ] P2.1 Gör signeringssammanfattningen mer komplett

Lägg till i `SigningFlow`:

- fakturaadressval
- anläggnings-ID/fullmaktsval
- flytt-/nyteckningsval
- marknadssamtycken

Mål:

- Testare kan visuellt validera att "allt jag valde blev rätt".

---

### [ ] P2.2 Förbättra copy för realism och konsekvens

Fokuskomponenter:

- `MoveOffer`
- `StartDatePicker`
- `TermsConsent`
- `SigningFlow`
- `Confirmation`

Mål:

- Mindre "prototypkänsla", mer realistisk kunddialog.

---

### [ ] P2.3 Lägg enkel "scenario playback"-checklista i DevPanel

Mål:

- Testledare kan se aktivt scenario + viktiga val i en enkel ruta under demo.

## 4) Rekommenderad implementation i etapper

Etapp A (Måste):

- [X] P0.1
- [X] P0.2
- [X] P0.3
- [ ] P0.4

Etapp B (Stabil demo):

- P1.1
- P1.2
- P1.3

Etapp C (Polish):

- P2.1
- P2.2
- P2.3

## 5) Data- och state-kontrakt att införa (MVP)

Utöka `PrivateCaseState` med:

- `moveChoice: 'MOVE_EXISTING' | 'NEW_ON_NEW_ADDRESS' | null`
- `facilityHandling: { mode: 'FETCH_WITH_POWER_OF_ATTORNEY' | 'MANUAL' | 'FROM_CRM'; facilityId: string | null } | null`
- `invoice: { mode: 'SAME_AS_RECOMMENDED' | 'OTHER_KNOWN'; address: Address | null } | null`

Minimikrav setters i `FlowStateContext`:

- `setMoveChoice(...)`
- `setFacilityHandling(...)`
- `setInvoice(...)`

## 6) Manuell testmatris (måste passera innan "klar")

## Scenario 1: Ny kund, villa, rörligt, snabbaste väg

- Välj produkt -> adress villa -> identifiering -> startdatum -> kontakt/faktura -> villkor -> signering -> klart.
- Förväntat: ingen riskruta för rörligt (enligt nuvarande design), inga blockerande fel.

## Scenario 2: Lägenhet, manuellt lägenhetsnummer + c/o

- Välj lägenhetsadress -> välj/skriv lägenhetsnummer -> fyll c/o -> fortsätt.
- Förväntat: validering kräver 4 siffror, c/o följer med.

## Scenario 3: Befintlig kund + manuell PNR (kräver BankID-verifiering)

- Ange manuell PNR som triggar befintlig kund -> BankID-only tvingas.
- Förväntat: manuell väg försvinner i verifieringssteget.

## Scenario 4: Flyttspår med val "Flytta med avtal"

- Säkerställ att detta val sätter `moveChoice` och påverkar senare copy.

## Scenario 5: Flyttspår med val "Teckna nytt"

- Säkerställ att detta val får annan efterföljande upplevelse än scenario 4.

## Scenario 6: Byte med bindningstid

- Scenario med `contractEndDate` -> startdatum styrs till efter bindning.
- Förväntat: anläggnings-ID hämtas från CRM-mock och visas i state/sammanfattning.

## Scenario 7: Byte utan bindningstid

- Scenario utan `contractEndDate` -> frihet i startval men tydlig info.
- Förväntat: anläggnings-ID hämtas från CRM-mock och visas i state/sammanfattning.

## Scenario 8: Anläggnings-ID manuellt

- I flytt-/ny-adress-spår: välj "hämta inte med fullmakt", skriv anläggnings-ID.
- Förväntat: värdet syns i sammanfattning/signering.

## Scenario 9: Fullmakt för anläggnings-ID

- I flytt-/ny-adress-spår: välj fullmakt.
- Förväntat: sammanfattning visar att fullmakt skickas.

## Scenario 10: Fakturaadress annan än leveransadress

- Vid extra adress: välj alternativ känd adress och kontrollera att den visas senare.

## Scenario 11: GENERIC-start, explicit avtalsval krävs

- Starta via "Teckna elavtal" -> försök gå vidare utan konkret avtal.
- Förväntat: blockeras/routas till tydligt avtalsval.

## Scenario 12: Stoppfall

- Simulera minst ett stoppfall via mock.
- Förväntat: användaren får begriplig stoppvy med nästa steg.

## 7) Kända avgränsningar (medvetet utanför scope)

- Riktig CRM-integration.
- Riktig BankID-integration.
- Juridisk fulltext-/dokumentgenerering.
- Produktionsklar telemetri och datalagring.

## 8) Leveranskrav för den som tar över

När arbetet lämnas över ska följande finnas:

- Uppdaterad kod för alla P0-punkter.
- Kort changelog med exakt vilka scenarion som verifierats.
- Ifylld testmatris (12 scenarion ovan) med resultat pass/fail.
- Lista på ev. kvarvarande avvikelser med motivering (varför acceptabla i MVP).

## 9) Nästa rekommenderade steg (nu)

Nästa steg: **P0.4 Säkerställ explicit avtalsform före signering**.

Viktigt att få med:

- Lägg en guard innan `TERMS`/`SIGNING` så generiskt val inte kan signeras.
- Definiera tydlig väg för användare som startat generiskt (routing till konkret avtalsval).
- Säkerställ att back-navigation fungerar utan att skapa loopar mellan steg.
- Visa i UI varför användaren behöver välja konkret avtalsform (kort copy).
- Testa att `PriceConflictResolver` inte kringgår guarden.
