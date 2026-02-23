# UI-spec: Jämförpris med fastighetstyp och egen förbrukning (MVP)

Senast uppdaterad: 2026-02-23  
Status: För godkännande (planeringsunderlag före implementation)

## 1) Mål

Målet är att få in jämförpris på ett tydligt men minimalistiskt sätt, utan att lägga till ett nytt steg i flödet.

Målet är också att kunden snabbt ska förstå:

- Vad priset baseras på.
- Vilka delar som ingår i elhandelspriset.
- Vad som inte ingår.
- Hur jämförpriset ändras vid annan förbrukning.

## 2) Designprinciper för MVP

- Behåll nuvarande stegmotor och ordning i privatflödet.
- Lägg ny funktionalitet i befintligt steg `PRODUCT_SELECT`.
- Visa endast en kompakt kontrollsektion ovanför avtalskorten.
- Ge smarta defaultvärden per fastighetstyp men låt kunden justera.
- Visa alltid jämförpris för 2 000 / 5 000 / 20 000 kWh.
- Låt kunden lägga in egen förbrukning som komplement, inte ersättning.

## 3) Föreslagen flödesstruktur (kundresa)

Ingen ny skärm läggs till.

Steg i privatflödet förblir:

`PRODUCT_SELECT -> ADDRESS_SEARCH -> IDENTIFY -> DETAILS -> TERMS -> SIGNING -> CONFIRMATION`

Ny logik:

- I `PRODUCT_SELECT` väljer kunden fastighetstyp och förbrukningsprofil.
- Valen påverkar jämförprisvisning på avtalskorten direkt.
- Samma val följer med till summering före signering.

## 4) UI i PRODUCT_SELECT (ny sektion ovanför korten)

Rubrik:

`Anpassa jämförpris`

Fält:

- Fastighetstyp (segmenterade knappar):
  - Villa
  - Lägenhet
  - Radhus
  - Fritidshus
- Förbrukning (kWh/år):
  - Snabbval: 2 000, 5 000, 20 000
  - Egen: numeriskt fält `Egen förbrukning (kWh/år)`

Beteende:

- Fastighetstyp sätter ett rekommenderat snabbval.
- Kunden kan alltid byta snabbval.
- Om kunden skriver egen förbrukning blir den aktiv för "Din uppskattning".
- Ogiltigt eller tomt egenvärde påverkar inte standardjämförelsen.

Rekommenderade defaultvärden:

- Villa: 20 000
- Lägenhet: 5 000
- Radhus: 5 000
- Fritidshus: 2 000

## 5) Avtalskort (utökad prisvisualisering)

Varje kort ska visa en tydlig prisbox med separata rader:

- Elpris: `X öre/kWh`
- Påslag: `Y öre/kWh`
- Fast avgift: `Z kr/mån`
- Övriga avgifter: `Namn + belopp` eller `0 kr`

Jämförpris på kortet:

- Primär rad: `Jämförpris (din profil): NN öre/kWh`
- Sekundär rad/länk: `Visa 2 000 / 5 000 / 20 000 kWh`

Text nära pris:

- `Detta avser elhandelsavtalet med Bixia. Elnätsavgift och energiskatt faktureras av ditt nätbolag och ingår inte här.`

## 6) Summering före signering (SIGNING)

Summeringen ska visa:

- Avtalstyp
- Bindningstid
- Uppsägningstid
- Startdatum
- Elpris
- Påslag
- Fast avgift
- Övriga avgifter
- Jämförpris 2 000 / 5 000 / 20 000
- Egen förbrukning + jämförpris för egen förbrukning (om ifylld)
- Nätkostnadstexten igen

## 7) Regel för jämförpris (MVP)

MVP-regel för beräkning (elhandelsdel):

- Årskostnad = `(elpris + påslag) * kWh + (fast avgift * 12) + övriga fasta avgifter`
- Jämförpris i öre/kWh = `Årskostnad / kWh`

MVP-regel för transparens:

- Visa kort text: `Jämförpriset bygger på antagen årsförbrukning och inkluderar elhandlarens fasta och rörliga avgifter.`

## 8) Datamodell för UI-state (för implementation)

Nya statefält i privatflödet:

- `housingType: 'VILLA' | 'APARTMENT' | 'TOWNHOUSE' | 'HOLIDAY_HOME' | null`
- `compareProfileKwh: 2000 | 5000 | 20000 | null`
- `customConsumptionKwh: number | null`

Nya prisfält per produkt (MVP):

- `energyPriceOrePerKwh`
- `surchargeOrePerKwh`
- `fixedFeeSekPerMonth`
- `otherFees` (lista eller summerad post)

## 9) Validering och edge cases

- Egen förbrukning tillåter endast heltal.
- Intervall för egen förbrukning i MVP: `500 - 50000` kWh.
- Värden utanför intervall visar inline-fel men blockerar inte standardjämförpriser.
- Om egen förbrukning är ogiltig används aktivt snabbval för "Din profil".
- Om fastighetstyp saknas används neutral default: `5 000`.

## 10) Copy-förslag (MVP)

Sektion:

- `Anpassa jämförpris`
- `Välj bostadstyp och förbrukning för att få en mer relevant prisjämförelse.`

Egen input:

- `Egen förbrukning (kWh/år)`
- `Lämna tomt om du vill använda standardvärden.`

Jämförpristext:

- `Jämförpris (din profil)`
- `Jämförpris 2 000 / 5 000 / 20 000 kWh`

Nätkostnad:

- `Elnätsavgift och energiskatt ingår inte här.`

## 11) Mobil och desktop

- Mobil:
  - Fastighetstyper som horisontell chip-rad.
  - Snabbval i två rader om utrymme krävs.
  - Egen input under snabbval.
- Desktop:
  - Fastighetstyp och förbrukning i en rad.
  - Korten uppdateras direkt utan hopp i layout.

## 12) Vad du behöver godkänna innan byggstart

- Att vi inte lägger till nytt steg, utan gör allt i `PRODUCT_SELECT`.
- Default mappning:
  - Villa 20 000
  - Lägenhet 5 000
  - Radhus 5 000
  - Fritidshus 2 000
- Intervall för egen förbrukning: `500 - 50000`.
- Prisbox med separata rader på varje avtalskort.
- Summering före signering utökas med full prisuppdelning och jämförprisrader.

