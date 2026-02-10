# Plan och to-do: färdigställa företagsflödet (B2B) med privatflödet som bas

Datum: 2026-02-10  
Underlag: `convert_to_b2b.md` + nuvarande implementation i `src/components/flows/CompanyFlow.tsx` och privatflödet.

## 1) Målbild

Vi färdigställer ett företagsflöde som känns visuellt likadant som privatflödet (samma komponentstil och stegrytm, annan bakgrund), men med företagsanpassad data, regler och stopplogik.

Vi börjar med att lägga till extratjänster i privatflödets bekräftelsesteg, och använder samma princip i företagsflödet för:
- tilläggstjänster för företag
- snabb väg att lägga till fler lokaler efter första teckningen

## 2) Viktiga principer

- Samma visuella språk som privatflödet: återanvänd privata UI-komponenter där möjligt.
- Företagslogik först i validering: stoppa tidigt när webbteckning inte är rätt kanal.
- BankID-only i B2B-signering.
- Exkl moms i prisvisning för företag, med momsrad i summering.
- Tydliga fallback-flöden till sälj/uppföljning vid specialfall.
- Full spårbarhet (beviskedja) för villkor, riskintyg och signering.

## 3) Etappplan (översikt)

### Etapp 1 (först): Extratjänster i privatflödets CONFIRMATION
Mål: Direkt efter tecknat avtal ska kunden med 1-3 klick kunna lägga till relevanta tjänster (Bixia nära med områdesval, hembatteri, solceller, elbilsladdare m.fl.).

### Etapp 2: Gemensam grund för företagsflödet
Mål: Bygga företagsflödet på samma ram som privatflödet (tydlig step-orchestrering, state i context, återanvända UI-sektioner).

### Etapp 3: Företagskärna (SME-kvalificering, företagspart, anläggningar, scenario)
Mål: Komplett orderflöde för 1-5 anläggningar inom SME-gränser, med korrekt routing till sälj när det behövs.

### Etapp 4: Pris, villkor, signering och beviskedja
Mål: B2B-produktlogik och juridik komplett inklusive tvåsignering (t.ex. BRF i förening).

### Etapp 5: Bekräftelse, tillägg och “lägg till fler lokaler”
Mål: Post-signering ska kunna utökas utan att störa huvudflödet.

### Etapp 6: QA, mätning och lansering
Mål: Säker release med testtäckning, tydlig uppföljning och kontrollerad utrullning.

## 4) Detaljerad to-do-lista

## Etapp 1: Extratjänster i privatflödets sista skärm

- [ ] Lägg till en modul i `/?step=CONFIRMATION` för “Lägg till extratjänster”.
- [ ] Skapa tjänstekatalog för privat: Bixia nära, hembatteri, solceller, elbilsladdare (utbyggbar listmodell).
- [ ] Bixia nära: checkbox + obligatoriskt områdesval när checkbox är aktiv.
- [ ] Övriga tjänster: checkbox med enkel “intresseanmälan”.
- [ ] UX: ett klick för välj/avmarkera, ett klick för “Skicka intresse”.
- [ ] Gör tilläggsflödet icke-blockerande: huvudordern ska redan vara klar även om tillägg misslyckar.
- [ ] Spara tillägg som separat payload/event kopplat till order-id.
- [ ] Lägg bekräftelsefeedback i UI (“Intresse skickat” / “Vi återkommer”).
- [ ] Lägg tracking för valda tjänster och konvertering efter tecknat avtal.
- [ ] Förbered samma tekniska byggblock för företag (återanvändbar komponent + datamodell).

Acceptanskriterier Etapp 1:
- [ ] Privatkund kan lägga till minst en extratjänst direkt på bekräftelsesidan utan att lämna flödet.
- [ ] Bixia nära kräver områdesval innan submit.
- [ ] Huvudflödet påverkas inte av tilläggsval (ingen regression i orderbekräftelsen).

## Etapp 2: Gemensam grund för företagsflödet

- [ ] Flytta företagsflödet från temporär lokal state till `FlowStateContext` med dedikerade setters.
- [ ] Inför step-orchestrering för företag som motsvarar privatflödets tydliga stegmodell.
- [ ] Ta bort debug-visning i `CompanyFlow` och ersätt med riktiga steg.
- [ ] Säkerställ visuell parity: samma layoutstruktur, spacing, CTA-hierarki och komponentbibliotek.
- [ ] Behåll enbart bakgrundsskillnad mellan privat/företag enligt önskemål.
- [ ] Definiera final steglista för B2B i kod (exempel: PRODUCT -> QUALIFY -> ORG_LOOKUP -> SIGNATORY_MODE -> FACILITIES -> DETAILS -> TERMS/RISK -> SIGNING -> CONFIRMATION).
- [ ] Säkerställ att browser refresh/back hanteras stabilt även i företagsflödet.

## Etapp 3: Företagskärna (SME + basuppgifter)

- [ ] SME-kvalificering tidigt i flödet:
- [ ] Fråga total årsförbrukning (obligatoriskt).
- [ ] Fråga antal anläggningar (1-5 i webb).
- [ ] Regel: >1 000 000 kWh -> sluss till sälj.
- [ ] Regel: >5 anläggningar -> sluss till sälj.
- [ ] Regel: saknad förbrukning -> sluss till sälj.
- [ ] Bygg lead capture vid sluss: företagsnamn, orgnr, kontaktperson, telefon, e-post, kommentar.
- [ ] Lägg bekräftelsesida efter lead capture (“Vi kontaktar dig”).

- [ ] Företag som avtalspart:
- [ ] Steg för organisationsnummer med uppslag i register.
- [ ] Om uppslag misslyckas -> sluss till sälj (ingen fri manuell företagsnamnsväg i v1).
- [ ] Dela upp roller i state/UI: avtalspart, kontaktperson, signatär.

- [ ] Scenario-steg för företag:
- [ ] Val mellan leverantörsbyte och flytt.
- [ ] För flytt: extra intyg om elnätsavtal i företagets namn från startdatum.

- [ ] Anläggningshantering:
- [ ] Per anläggning krävs: anläggnings-id, adress, årsförbrukning.
- [ ] “Jag har inte anläggnings-id” ska finnas men route:a till sälj + lead capture.
- [ ] Om flera anläggningar men endast totalförbrukning utan fördelning -> sluss till sälj.

## Etapp 4: Pris, villkor, signering och specialfall

- [ ] Produktutbud i B2B begränsas till:
- [ ] Bixia Förvaltat pris
- [ ] Bixia Rörligt pris
- [ ] Bixia Kvartspris

- [ ] Prisvisning och summering:
- [ ] Visa exkl moms i produktkort och summering.
- [ ] Visa momsbelopp och total inkl moms i summering.
- [ ] Lägg texten om att elnätsavgifter inte ingår.
- [ ] Visa prisdetaljer per produktkomponent.

- [ ] Startdatum för företag:
- [ ] Ersätt specifikt datum med startmånad.
- [ ] Tillåt nästa månad till +6 månader.
- [ ] Lägg fallback till uppföljning om backend inte kan bekräfta vald startmånad.

- [ ] Villkor och risk:
- [ ] Byt ut konsumentvillkor mot företagsvillkor.
- [ ] Riskintyg för rörligt pris.
- [ ] Riskintyg för kvartspris.
- [ ] Ingen riskcheckbox för förvaltat i v1.
- [ ] Behörighetsintyg (“jag är behörig att teckna”) obligatoriskt med timestamp.

- [ ] Signering:
- [ ] BankID-only i företagsflödet.
- [ ] Steg för firmateckningssätt: var för sig / två i förening / vet ej.
- [ ] “Vet ej” -> sluss till sälj.
- [ ] Två i förening: samla in signatär 2 (e-post + telefon), skicka signeringslänk.
- [ ] Statushantering: väntar på signatär 2.
- [ ] Timeout 7 dagar -> uppföljning/sälj.

- [ ] BRF-specialfall:
- [ ] Säkerställ att “två i förening” blir tydligt defaultfall när firmateckning kräver det.
- [ ] Tydlig copy om att avtalet inte är giltigt förrän båda signerat.
- [ ] Skicka statuskommunikation till båda signatärer under vänteläge.

- [ ] Omteckning (Mina sidor företag):
- [ ] Stöd för inpassning med förifyllda parametrar (orgnr, anläggnings-id, ev adress/produkt).
- [ ] Lås signatär till inloggad användare.
- [ ] Om nödvändig kontext saknas -> support/sälj.

## Etapp 5: Bekräftelse och expansion efter signering

- [ ] Ny B2B-bekräftelsesida som följer privatflödets visuella mönster.
- [ ] Lägg modul för företags-tilläggstjänster (motsvarande privat).
- [ ] Lägg CTA “Lägg till ytterligare lokal” direkt efter klar signering.
- [ ] “Lägg till lokal” ska återanvända samma lokalblock (anläggnings-id + adress + förbrukning) utan att börja om hela flödet.
- [ ] Definiera om extra lokal blir ny order eller tillägg till samma case (behöver beslutas tidigt).

## Etapp 6: Kvalitet, analys och release

- [ ] E2E-testflöden för privat extratjänster och full B2B-order (single signer + dual signer).
- [ ] Testa alla stoppfall med korrekt sluss/lead capture.
- [ ] Enhetstester för regler: kvalificering, signeringslogik, validering av anläggnings-id, startmånad.
- [ ] Lägg analytics för drop-off per steg och orsakskoder för sluss till sälj.
- [ ] Sätt feature flags för stegvis lansering av B2B-delar.
- [ ] Utrullning i två steg: först privat extratjänst-modul, därefter B2B-flöde.

## 5) Specialfall som måste hanteras från start

- [ ] Förbrukning över 1 GWh.
- [ ] Fler än 5 anläggningar.
- [ ] Orgnr-uppslag misslyckas.
- [ ] Kunden saknar anläggnings-id.
- [ ] Kunden kan inte ange förbrukning per anläggning.
- [ ] Kunden väljer “Jag vet inte” på firmateckning.
- [ ] Signatär 2 signerar inte inom 7 dagar.
- [ ] Kvartspris senare underkänns av downstream-regler (ska till uppföljning, inte blockas i UI).

## 6) Rekommenderad implementeringsordning (kort)

1. Privat CONFIRMATION: extratjänst-modul + datalagring + tracking.  
2. Företags-state och stegmotor i samma struktur som privat.  
3. SME-kvalificering + orgnr + anläggningar + scenario + lead capture.  
4. B2B-pris/villkor/risk/signering inklusive BRF tvåsignering.  
5. B2B-confirmation med “lägg till fler lokaler” + tilläggstjänster.  
6. Test, mätning, feature flag, release.

## 7) Öppna beslut att låsa tidigt

- [ ] Exakt UX för “lägg till fler lokaler”: i samma case eller ny order per lokal.
- [ ] Om BRF ska autodetekteras från företagsregister eller alltid styras via frågan om firmateckning.
- [ ] Exakt kanal för signatär 2-länk (e-post, SMS eller båda i v1).
- [ ] Prioriterad lista och copy för företags-tilläggstjänster i bekräftelsen.
- [ ] Om lead capture ska skapa CRM-lead direkt eller först en intern uppföljningskö.

