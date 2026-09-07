# Avtalsflöde: projektinstruktioner

## Mål och aktuella beslut
- En svensk, klickbar Bixia-prototyp för intern testning. CRM, BankID och beställningar är simulerade.
- Läs README först, därefter docs/architecture.md och docs/work-plan.md för aktuella regler/status. Äldre checklistor är referensmaterial, inte nya arbetsorder.
- Privatflödet och gemensam grund prioriteras. Företagsflödet är en ofullständig prototyp.
- Följ användarens aktuella uppdrag. Fråga om oklara upplevelse- eller affärsbeslut; lös rutinmässiga tekniska val inom uppdraget.

## Ansvar i koden
- src/flow: rena regler och gemensam validering. Ingen React, webbläsarlagring eller API-trafik.
- src/state: reducer och separat versionshanterad lagring. Bekräftade uppgifter och formulärutkast är olika saker.
- src/context och src/hooks: React-koppling, historik och livscykel.
- src/components/flows: samordning och rendering av steg; src/components/flow: steg och formulär.
- src/services: mockade tjänster. Testinställningar ska fungera oberoende av devpanelens synlighet.
- Personnummer får inte skrivas till sessionStorage. Slutförd signering krävs för kvittens.

## Arbetsgång och kontroll
- Använd Node-versionen i .nvmrc och npm ci. Behåll befintliga ändringar i arbetskopian.
- Kör npm run verify efter ändringar i flödeslogik. Lägg regressionstester för nya grenar eller rättade beteendefel.
- UI-förändringar kontrolleras i webbläsaren, inklusive mobilbredd. Återanvänd befintliga CSS-moduler och UI-komponenter.
- Ändra inte UX, affärsregler eller teknikstack som en bieffekt av filstädning.
- Commit, push och publicering görs endast när uppdraget omfattar det. Blanda inte in genererade presentationer eller granskningsartefakter.
