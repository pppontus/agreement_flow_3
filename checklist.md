# Bixia avtalsflöde (bixia.se) Guidelines för pris och avtalsinformation

Syfte: Säkerställa att kunder förstår vad de köper, kan jämföra avtal, och får korrekt förhandsinformation innan avtal ingås.

## 1. Grundprinciper

- Visa totalbilden tidigt: kund ska snabbt förstå vad som ingår i elhandelsdelen och vad som inte ingår (elnät, myndighetsavgifter hos nätbolag).
- Var konsekvent: samma begrepp, samma enheter, samma ordning i hela flödet.
- Var konkret: visa alltid både kr/kWh (eller öre/kWh) och kr/mån där det finns fasta avgifter.
- Undvik “lockpris”: lyft inte fram bara spotpris om kundens faktiska kostnad även består av påslag och månadsavgift.
- När något är rörligt: skriv tydligt vad som kan ändras och när (timme, månad, avtalsperiod).

## 2. Obligatoriska prisuppgifter (elhandlarens del)

Det kunden betalar till Bixia ska kunna förstås och räknas på.

### 2.1 Jämförpris (måste finnas där avtal marknadsförs/erbjuds)

Visa jämförpris:

- i öre/kWh
- vid 2 000, 5 000 och 20 000 kWh per år
- baserat på total kostnad som kunden ska betala till elhandlaren (inkl månadsavgift, påslag och andra obligatoriska avgifter från elhandlaren)
- med angiven tidsperiod som jämförpriset avser
- med tydlig text nära: “nätkostnad ingår inte”

Rekommenderad placering:

- på avtalsvalskortet (listning)
- i sammanfattningen innan signering
- i orderbekräftelse (samma siffror som kunden såg i köpet)

### 2.2 Prisuppgift till konsument ska vara tydlig om moms

- Om pris anges inklusive moms: skriv “inkl moms”.
- Om någon del visas exkl moms (bör undvikas i konsumentflöde): skriv mycket tydligt “exkl moms” och visa även “inkl moms” i samma vy.

## 3. Komponenter som ska visas för elhandelspriset

På avtalskort och i summering ska följande kunna visas som separata rader (inte bara inbakade i ett tal):

### 3.1 Rörligt månadspris (exempelstruktur)

- Elpris: “spotpris per månad” (förklaring: baseras på Nord Pool och varierar)
- Påslag: X öre/kWh
- Fast avgift: Y kr/mån
- Övrigt från elhandlaren: t ex fakturaavgift om sådan finns (helst 0, annars tydlig)

### 3.2 Fast pris (exempelstruktur)

- Fast elpris: X öre/kWh (gäller under bindningstid)
- Fast avgift: Y kr/mån
- Bindningstid och vad som händer när perioden tar slut (ny period, tillsvidare, aktivt val)

### 3.3 Timpris eller kvartspris (dynamiskt elpris)

Måste alltid innehålla:

- Prisets upplösning: timme eller kvart
- Påslag: X öre/kWh (om tillämpligt)
- Fast avgift: Y kr/mån
- Kort risktext: “priset varierar kraftigt, särskilt vid pristoppar”
- Tydlig markering att detta är ett dynamiskt avtal

## 4. Dynamiskt elpris: informationskrav och “särskilt samtycke”

När kunden väljer dynamiskt elpris (timpris idag, kvartspris när marknaden gått över):

- Visa en egen “förstå och godkänn”-ruta före signering:
  - Möjligheter: kan sänka kostnad genom att flytta förbrukning
  - Kostnader: påslag, avgifter, vad som påverkar utfallet
  - Risker: pristoppar, svårare att förutse kostnad
- Kräva aktiv handling: kryssruta eller motsvarande som kunden måste välja för att gå vidare (“Jag samtycker till villkoren för dynamiskt elpris”).

## 5. Avtalsvillkor som ska vara lätta att hitta innan signering

I steget “Granska och signera” ska kunden kunna se (eller öppna i samma vy) följande:

- Avtalstyp (fast, rörligt, dynamiskt)
- Bindningstid (om någon) och uppsägningstid
- Startdatum för leverans (och vad som krävs för att det datumet ska gälla)
- Prisets komponenter (se punkt 3)
- Jämförpris (se punkt 2)
- Länk till fullständiga villkor (PDF eller webbsida)
- Kort “sammanfattning av avtalsvillkor” i standardiserad form (om ni använder EI:s mall/format)

## 6. Tydlig gräns: elhandel vs elnät

Kunden ska inte behöva gissa vad som ingår.

Lägg in en standardtext på avtalskort och i summering:

- “Detta avser elhandelsavtalet med Bixia. Elnätsavgift och energiskatt faktureras av ditt nätbolag och ingår inte här.”

Extra bra (rekommenderat):

- En liten info-popover: “Vad är elnät?” med 2 till 3 meningar.

## 7. Ångerrätt (distansavtal)

Eftersom avtalet ingås digitalt ska kunden få tydlig information om ångerrätt:

- 14 dagars ångerrätt (standard)
- Hur kunden ångrar (länk till instruktion eller kontaktväg)
- Bekräftelse efter köpet: visa ångerrättsinformation igen i kvitto/confirmation

## 8. Copy och UI-mönster (rekommenderat)

### 8.1 Avtalskort (minimiyta)

- Rubrik: “Rörligt månadspris” eller “Fast pris 12 månader” eller “Timpris”
- 3 rader:
  - “Påslag: X öre/kWh”
  - “Fast avgift: Y kr/mån”
  - “Jämförpris: Z öre/kWh (2 000, 5 000, 20 000 kWh per år)”
- Mikrotext: “Nätkostnad ingår inte”

### 8.2 Summering före signering

Visa alltid en kompakt tabell:

- Avtalstyp
- Bindningstid, uppsägningstid
- Påslag (öre/kWh)
- Fast avgift (kr/mån)
- Eventuella andra avgifter
- Jämförpris (2000, 5000, 20000)
- Startdatum
- Länkar: fullständiga villkor, integritet, ångerrätt

### 8.3 Dynamiskt elpris: samtyckesruta

Rubrik: “Dynamiskt elpris: viktigt att förstå”

- Punktlista: möjligheter, kostnader, risker
- Kryssruta: “Jag samtycker till villkoren för dynamiskt elpris”
- Länk: “Läs mer om timpris/kvartspris”

## 9. Beräkningsregler (så att siffrorna blir stabila)

- Jämförpris ska vara reproducerbart: logga antaganden (spotprisperiod, beräkningsmetod).
- Visa datumintervall för jämförprisets underlag i tooltip eller “i”-ruta.
- Om priset bygger på historiska värden: skriv “baserat på historiska priser” och vilken period.

## 10. QA-checklista för webbteamet

### Pris och jämförbarhet

- [ ] Jämförpris visas på avtalsval och i summering.
- [ ] Jämförpris finns för 2 000, 5 000, 20 000 kWh per år.
- [ ] Nätkostnad-fras finns nära jämförpris.
- [ ] Påslag och fast avgift visas alltid som separata rader.
- [ ] Om “spotpris” visas: det framgår att det inte är kundens hela pris.

### Avtalsvillkor och förståelse

- [ ] Bindningstid och uppsägningstid är synliga före signering.
- [ ] Startdatum är tydligt och konsekvent.
- [ ] Fullständiga villkor kan öppnas utan att lämna flödet.

### Dynamiskt elpris

- [ ] Risker, kostnader och möjligheter visas i egen ruta.
- [ ] Aktivt samtycke krävs (kryssruta eller likvärdigt).
- [ ] Prisupplösning framgår: timme eller kvart.

### Konsumenträtt och distansköp

- [ ] Ångerrätt (14 dagar) informeras i flödet och i bekräftelse.
- [ ] Kontaktväg för ånger finns.

### Teknik och spårbarhet

- [ ] Alla prisvärden kommer från samma källa i flödet (ingen “hardcode” på en sida).
- [ ] Versionera prislogik och logga vilken version som användes vid köp.
- [ ] Logga vad kunden såg i summeringen (för support och tvist).

## 11. Rekommenderad “Definition of Done” för prissteget

Steget är klart när:

- Kund kan svara på: “Vad betalar jag Bixia?”, “Vad ingår inte?”, “Hur jämför jag detta med andra avtal?”, “Vad kan förändras över tid?” och (vid dynamiskt) “Vilka risker tar jag?”.
- Alla punkter i QA-checklistan är gröna.
