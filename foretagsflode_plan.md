# Plan och to-do: färdigställa företagsflödet (B2B) med privatflödet som bas

Senast uppdaterad: 2026-02-10  
Underlag: `convert_to_b2b.md` + nuvarande implementation i kodbasen.

## 1) Nuläge (var vi står nu)

## Klart i privatflödet (post-signering)

- [x] `CONFIRMATION` visar tydlig bekräftelse att kunden är klar.
- [x] Extratjänster ligger på bekräftelseskärmen.
- [x] `Bixia nära` kan läggas till direkt.
- [x] `Bixia nära` har pris (29 kr/mån).
- [x] `Bixia nära` kräver län när den väljs.
- [x] Förvalt län för `Bixia nära` sätts automatiskt från avtalets adress.
- [x] `Realtidsmätare` kan läggas till direkt.
- [x] `Realtidsmätare` visar kostnad (695 kr engång + 19 kr/mån).
- [x] Övriga tjänster ligger samlat i en ruta: “Kontakta mig om …”.
- [x] Primärknappen byter text:
- [x] `Spara val` om något är valt.
- [x] `Gå vidare utan tjänster` om inget är valt.
- [x] Ny nästa skärm efter confirmation: app-nedladdning (`APP_DOWNLOAD`).
- [x] Mobil visar app-knapp(ar) beroende på enhetstyp.
- [x] Desktop visar QR-koder för iOS och Android.
- [x] Nästa skärm visar mini-beställningsbekräftelse för valda tillägg + kostnader.

## Kvar i privatflödet (för att stänga Etapp 1 helt)

- [ ] Icke-blockerande fallback vid sparfel av tilläggsval (just nu stoppas användaren vid fel).
- [ ] Analytics/events för val, sparning och app-CTA.
- [ ] Ersätta sök-länkar till app stores med exakta app-URL:er.

## Företagsflödet (B2B) just nu

- [ ] Fortfarande delvis prototypiskt och lokalt state-drivet.
- [ ] Ej fullt inpassat i samma robusta stegmotor/state-mönster som privatflödet.
- [ ] Saknar ännu hela SME-regelverket, full signeringslogik (2 signatärer), och B2B-villkor/prisdetaljer enligt specifikation.

## 2) Etappstatus

### Etapp 1: Privat extratjänster efter signering
Status: **Pågående, cirka 80-85% klar**

### Etapp 2: Gemensam grund för företagsflödet
Status: **Påbörjad**

### Etapp 3-6
Status: **Ej startade**

## 3) Uppdaterad to-do (kvarstående huvudspår)

## Etapp 1 (stänga privatdelen helt)

- [ ] Gör tilläggssparning icke-blockerande vid API-fel:
- [ ] Vid fel: visa varning men tillåt att gå vidare till app-skärmen.
- [ ] Logga fel internt för uppföljning.
- [ ] Lägg analytics för:
- [ ] visning av extratjänster
- [ ] val per tjänst
- [ ] klick på `Spara val` / `Gå vidare utan tjänster`
- [ ] app-CTA klick iOS/Android
- [ ] Byt till riktiga app-länkar (iOS + Android).

## Etapp 2 (grund för B2B)

- [ ] Flytta företagsflödet från lokal state till `FlowStateContext` med dedikerade setters.
- [ ] Inför tydlig B2B-step-orchestrering (samma princip som privatflödet).
- [ ] Ta bort debug-resultatvisning i `CompanyFlow`.
- [ ] Säkerställ stabil back/refresh i företagsflödet.
- [ ] Behåll visuell parity mot privatflödet (förutom bakgrund).

## Etapp 3 (SME-kärnan)

- [ ] Tidig kvalificering:
- [ ] total förbrukning (obligatorisk)
- [ ] antal anläggningar (1-5)
- [ ] sluss till sälj vid >1 GWh eller >5 anläggningar
- [ ] orgnr-uppslag:
- [ ] lyckas -> fortsätt
- [ ] misslyckas -> sluss till sälj
- [ ] scenario: leverantörsbyte/flytt + flyttintyg
- [ ] anläggningsdata per lokal: anläggnings-id, adress, förbrukning
- [ ] lead capture + “vi kontaktar dig”-bekräftelse i stoppfall

## Etapp 4 (pris, villkor, signering)

- [ ] Produktutbud B2B: Förvaltat, Rörligt, Kvarts.
- [ ] Pris exkl moms i visning + moms/inkl moms i summering.
- [ ] Företagsvillkor och rätt riskintyg.
- [ ] Startmånad (inte datum), nästa månad till +6 månader.
- [ ] Firmateckning:
- [ ] var för sig
- [ ] två i förening
- [ ] vet ej -> sälj
- [ ] Tvåsignering med 7-dagars timeout och uppföljning.

## Etapp 5 (B2B post-signering)

- [ ] B2B confirmation med tilläggstjänster.
- [ ] CTA: lägg till ytterligare lokal efter första teckningen.
- [ ] Beslut: samma case eller ny order för extra lokal.

## Etapp 6 (kvalitet och release)

- [ ] E2E för privat tillägg + komplett B2B (single/dual signer).
- [ ] Tester för stoppfall och routing till sälj.
- [ ] Feature flags och stegvis utrullning.

## 4) Nästa lilla leverans efter OK (föreslagen: Etapp 2A)

## Mål för 2A

Få företagsflödet på samma tekniska “räls” som privatflödet utan att ännu bygga all affärslogik.

## Scope (liten, avgränsad leverans)

- [x] Inför Company-setters i `FlowStateContext` för befintliga fält:
- [x] produkt
- [x] gatekeeper-värden
- [x] orgnr/företagsnamn
- [x] anläggningslista
- [x] Bygg om `CompanyFlow` så att den läser/skriver från context istället för lokal state.
- [x] Ta bort debug-rutan i slutet av `CompanyFlow`.
- [x] Behåll nuvarande stegordning funktionellt (PRODUCT_SELECT -> GATEKEEPER -> SEARCH -> FACILITIES_LOOP), men gör den robust.
- [x] Säkerställ bättre robusthet för tillbaka/refresh via URL-steg (`companyStep`) + persisterat flow-state.

## Leverabel efter 2A

- [x] Företagsflödet är tekniskt stabilare och redo för nästa del (SME-regler + stoppfall).
- [x] Ingen ändring i copy eller visuell design utöver nödvändiga bugfixar.

## 5) Så gör vi 2A på bästa sätt

- Vi ändrar först arkitekturen, inte affärsreglerna.
- Vi återanvänder befintliga komponenter och minimerar UI-förändringar för att undvika regressioner.
- Vi gör små, isolerade commits i logiska steg:
- 1) context-setters
- 2) koppla CompanyFlow till context
- 3) rensa debug och verifiera back/refresh
- Vi verifierar efter varje del med snabb manuell steptest + build.
- Vi skjuter komplexa B2B-regler (SME-sluss, firmateckning, tvåsignering) till nästa del för att hålla risk och felsökning låg.

## 6) Nästa del direkt efter 2A (förberedelse)

När 2A är klar tar vi nästa lilla del: **Etapp 3A – tidig SME-kvalificering + sluss till sälj**.  
Det ger tidig affärsnytta och blockerar fel kunder innan resten av flödet byggs ut.

## 7) Föreslagen nästa mindre del att utföra (efter nytt OK)

**Etapp 3A: Tydlig SME-kvalificering + stopp till sälj**

- [ ] Gatekeeper frågar både total årsförbrukning och antal anläggningar (1-5).
- [ ] Stopplogik:
- [ ] >1 000 000 kWh -> sluss till sälj.
- [ ] >5 anläggningar -> sluss till sälj.
- [ ] saknad giltig input -> blockera fortsättning.
- [ ] Bygg enkel lead capture-skärm vid sluss (företag, orgnr, kontaktperson, telefon, e-post, kommentar).
- [ ] Lägg bekräftelse “Vi kontaktar dig”.

Så gör vi detta bäst:
- Vi implementerar reglerna direkt i ett tydligt valideringslager i gatekeeper-steget.
- Vi återanvänder befintliga UI-fältkomponenter för snabb och konsekvent leverans.
- Vi håller sluss/lead-capture som en separat, ren del av flödet så att den inte blandas in i huvudstegen.
