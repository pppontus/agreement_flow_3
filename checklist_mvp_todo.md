# To-do: pris- och avtalsinfo i MVP (baserat på checklistan + beslut)

Senast uppdaterad: 2026-02-23  
Underlag: `checklist.md` + genomgång av nuvarande MVP + beslut i tråden.

## 1) Beslutad scope för MVP

## Ska fixas i MVP

- [ ] Jämförpris i avtalsval och i summering före signering.
- [ ] Jämförpris för 2 000 / 5 000 / 20 000 kWh.
- [ ] Nätkostnad-fras nära pris/jämförpris.
- [ ] Tydlig prisuppdelning i komponenter (påslag, fast avgift, skatter/avgifter m.m.).
- [ ] Bindningstid och uppsägningstid synligt före signering.
- [ ] Tydlig prisupplösning för kvartspris (att pris uppdateras var 15:e minut).
- [ ] Ångerrätt: tydlig 14-dagarsinfo i flöde och i bekräftelse.

## Behålls som MVP-ok

- [ ] Fullständiga villkor/integritet/ångerrätt får vara placeholder-länkar i MVP, men ska vara klickbara (inte `#`).
- [ ] Aktivt samtycke för risk: behåll checkboxen före signering (BankID ersätter inte detta samtycke).

## Tas bort från MVP-scope

- [ ] Versionerad prislogik + loggning av exakt visad summering per köp.

## 2) Prioriterad implementation

## P0 - Måste vara klart för klickbar MVP

- [ ] Inför tydlig prismodell i data (inte bara `öre/kWh`):
  - [ ] Elpris/energidel
  - [ ] Påslag (öre/kWh)
  - [ ] Fast avgift (kr/mån)
  - [ ] Skatter/övriga avgifter (minst tydlig rad i MVP)
- [ ] Implementera jämförpris-beräkning för 2 000 / 5 000 / 20 000 kWh.
- [ ] Visa jämförpris på avtalskort.
- [ ] Visa jämförpris i signeringssummering.
- [ ] Lägg till standardtext nära pris:
  - [ ] "Detta avser elhandelsavtalet med Bixia. Elnätsavgift och energiskatt faktureras av ditt nätbolag och ingår inte här."
- [ ] Utöka summering före signering med:
  - [ ] Bindningstid
  - [ ] Uppsägningstid
  - [ ] Prisets komponentrader (påslag, fast avgift, avgifter)
  - [ ] Jämförpris (2 000 / 5 000 / 20 000)

## P1 - Viktigt för begriplighet/compliance i MVP

- [ ] För kvartspris: lägg in explicit copy om upplösning:
  - [ ] Exempel: "Kvartspris innebär att elpriset uppdateras var 15:e minut."
- [ ] Förtydliga riskrutan för kvartspris med 3 block:
  - [ ] Möjligheter
  - [ ] Kostnader
  - [ ] Risker
- [ ] Bekräfta att aktiv riskcheckbox krävs för relevanta avtal innan signering.
- [ ] Ångerrätt i villkorssteget:
  - [ ] Skriv "14 dagars ångerrätt"
  - [ ] Visa hur kunden ångrar (kontaktväg/länk)
- [ ] Ångerrätt i confirmation:
  - [ ] Visa samma 14-dagarsinfo igen
  - [ ] Visa kontaktväg/länk igen

## P2 - Små men viktiga UX-fixar

- [ ] Byt `href="#"` till riktiga placeholder-rutter (t.ex. `/legal/terms`, `/legal/regret`, `/legal/privacy`).
- [ ] Säkerställ konsekvent copy för "jämförpris", "påslag", "fast avgift", "nätkostnad ingår inte".

## 3) Acceptance criteria (MVP)

- [ ] Kunden ser jämförpris på både avtalskort och före signering.
- [ ] Jämförpris visas för exakt 2 000 / 5 000 / 20 000 kWh.
- [ ] Pris visas i tydliga komponentrader, inte som ett enda tal.
- [ ] Kunden ser bindningstid och uppsägningstid innan signering.
- [ ] Kvartspris förklarar tydligt att priset uppdateras var 15:e minut.
- [ ] Risksamtycke sker via checkbox före signering (inte enbart BankID).
- [ ] 14 dagars ångerrätt + kontaktväg syns i både villkorssteg och bekräftelse.

## 4) Avgränsningar

- Ingen implementation av full spårbarhet/versionerad prislogik i denna MVP.
- Juridiska länkar får vara placeholder under MVP, men ska vara klickbara och upplevas riktiga i flödet.
