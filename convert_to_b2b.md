## **Företagsflöde på webben (SME) Specifikation för att modifiera privatflödet**

### **Scope**

Målet är att återanvända privatflödet men göra en **SME-version** (små och medelstora företag) för bixia.se med dessa produkter:

- **Bixia Förvaltat pris**
- **Bixia Rörligt pris**
- **Bixia Kvartspris**

### **Grundbeslut som gäller hela implementeringen**

1. **BankID är obligatoriskt** för signering i företagsflödet (ingen manuell personnummerväg).
2. **Anläggnings-id är obligatoriskt** för webbteckning. Om kunden inte har anläggnings-id slussas den till sälj/uppföljning.
3. **Tvåsignering stödjs i webben** när firmateckning kräver det (t ex BRF “i förening”). Om kunden inte kan avgöra firmateckning slussas den till sälj.
4. **Priser visas alltid exkl moms**. Sammanfattning visar även momsbelopp och total inkl moms.
5. **Jämförpris byggs inte i v1** (tas senare om det behövs).

---

# **1) Inträde och routing (SME-kvalificering)**

### **1.1 Segmentgränser (konfigurerbara)**

- **Småföretag**: total årsförbrukning upp till **150 000 kWh**
- **Medelstora**: **150 001 till 1 000 000 kWh**
- **Över 1 000 000 kWh**: alltid **sluss till storkund/sälj** (ingen webbteckning)

### **1.2 Tidig kvalificering (måste komma före personflöde och sammanfattning)**

Flödet ska tidigt fråga:

- Total årsförbrukning i kWh (obligatoriskt)
- Antal anläggningar som ska tecknas (1 till 5 i webben)

Regler:

- Om **årsförbrukning > 1 000 000 kWh**: avbryt till sälj med lead capture
- Om **antal anläggningar > 5**: avbryt till sälj med lead capture
- Om kunden inte vill ange årsförbrukning: avbryt till sälj (ingen “vet ej” i webben)

Lead capture vid sluss:

- Företagsnamn, orgnr, kontaktperson, telefon, e-post, valfri kommentar
- Bekräftelsesida “Vi kontaktar dig”

---

# **2) Företag som part (orgnr först)**

### **2.1 Organisationsnummer**

- Steg: “Ange organisationsnummer”
- Systemet ska slå upp företagsnamn i företagsregister eller internt register

Beslut:

- Om uppslag misslyckas: **sluss till sälj** (ingen manuell företagsnamnsinmatning i v1)

### **2.2 Roller (separata objekt)**

Flödet ska ha tre separata roller i datamodell och UI:

- **Avtalspart**: orgnr + företagsnamn
- **Kontaktperson**: namn, e-post, telefon (manuellt ifyllt)
- **Signatär**: person som signerar via BankID (kan vara annan än kontaktperson)

---

# **3) Firmateckning och signering**

### **3.1 Behörighetsintyg (obligatoriskt)**

Inför signering ska finnas checkbox:

- “Jag bekräftar att jag är behörig att teckna elavtal för företaget.”

Krav:

- Intyget ska sparas som datapunkt och inkluderas i avtalsbekräftelsen tillsammans med signatärens identitet och timestamp.

### **3.2 Tvåsignering (i förening)**

Steg efter orgnr-uppslag:

- “Hur tecknas firman?”
  - “Var för sig (1 signering)”
  - “Två i förening (2 signeringar)”
  - “Jag vet inte”

Beslut:

- “Jag vet inte” slussas till sälj.
- “Två i förening” kräver två signatärer.

### **3.3 Implementationskrav för 2 signeringar**

- Signatär 1 signerar via BankID och ser status “Väntar på signatär 2”.
- Kunden måste ange e-post och telefon till signatär 2.
- Signatär 2 får signeringslänk via e-post eller SMS.
- Avtalet anses inte klart förrän båda signerat.
- Timeoutregel: om signatär 2 inte signerar inom 7 dagar går ärendet till uppföljning/sälj.

---

# **4) Anläggningar och anläggnings-id**

### **4.1 Antal anläggningar**

- Webben stödjer 1 till 5 anläggningar i samma beställning.

### **4.2 Data per anläggning (obligatoriskt)**

För varje anläggning krävs:

- Anläggnings-id
- Anläggningsadress (autocomplete)
- Årsförbrukning för just den anläggningen i kWh

Beslut:

- Om kunden har flera anläggningar men bara kan ange total förbrukning: sluss till sälj (ingen “fördela senare” i v1)

### **4.3 Om kunden saknar anläggnings-id**

- Alternativ “Jag har inte anläggnings-id” ska finnas, men leder till:
  - Sluss till sälj/uppföljning
  - Lead capture för att hjälpa kunden samla in rätt uppgifter

---

# **5) Produkter och produktlogik (Bixia Förvaltat, Rörligt, Kvarts)**

### **5.1 Tillgängliga produkter**

Företagsflödet ska bara exponera dessa tre:

- Förvaltat pris
- Rörligt pris
- Kvartspris

### **5.2 Produktkort och kort beskrivning**

- Varje produkt måste ha:
  - Rubrik
  - 1 till 2 meningar beskrivning (den text du gav kan användas)
  - Prisvisning exkl moms
  - Länk “Visa prisdetaljer”

### **5.3 Kvartspris krav**

Beslut:

- Kvartspris får väljas utan extra tekniska frågor i v1.
- Om det senare visar sig att anläggningen inte kan hanteras som kvartspris ska processen falla tillbaka till uppföljning (inte blocka i UI).

---

# **6) Prisvisning (exkl moms) och prisdetaljer**

### **6.1 Pris ska specificeras med komponenter**

På produktsida och i summering ska dessa komponenter visas:

- Spotpris eller medelspot (produktberoende)
- Rörliga kostnader inkl ursprung
- Fast påslag
- Fast avgift

För Förvaltat pris:

- Visa “Förvaltat elpris” där spot annars visas, övriga komponenter samma struktur.

### **6.2 Moms och nätavgifter**

- Priser ska visas **exkl moms** som standard.
- Summering ska visa:
  - exkl moms
  - momsbelopp
  - total inkl moms

- Text måste finnas: “Elnätsavgifter ingår inte, de betalas till ditt elnätsbolag.”

---

# **7) Scenario: leverantörsbyte och flytt**

### **7.1 Val av scenario**

Steg tidigt:

- “Vad gäller det?”
  - Leverantörsbyte
  - Flytt

### **7.2 Flytt: extra intyg**

För flytt ska kunden kryssa i:

- “Jag ansvarar för att elnätsavtalet finns och står på företagets namn från valt startdatum.”

---

# **8) Startdatum**

### **8.1 Startmånad istället för datum**

Beslut:

- Kunden väljer **startmånad** (inte enskilt datum)
- Tillåtna startmånader: **nästa månad till och med 6 månader framåt**
- Default: nästa månad

### **8.2 Backend-validering**

- Om startmånad inte är möjlig pga externa regler ska ordern gå till uppföljning och kunden informeras via bekräftelsemail att startdatum kan justeras efter kontroll.

---

# **9) Kunduppgifter och faktura**

### **9.1 Kontaktperson**

- Manuell input:
  - Namn
  - Telefon
  - E-post

### **9.2 Fakturauppgifter**

Kravfält:

- Fakturaadress (med kryss “samma som anläggningsadress”)
- Faktura e-post (om ni skickar faktura via e-post)
- Fakturareferens “Er referens” (obligatoriskt)

Beslut:

- Inga val av fakturasätt i v1 (PEPPOL, papper etc). Om företaget behöver annat slussas det via sälj.

---

# **10) Villkor och beviskedja**

### **10.1 Rätt villkor för företag**

- Konsumentvillkor och konsumenttexter tas bort.
- Företagsvillkor länkas och accepteras.

### **10.2 Riskintyg per produkt**

Obligatoriska checkboxar i summering:

- För Rörligt: “Jag intygar att jag har förstått att priset kan variera.”
- För Kvarts: “Jag intygar att jag har förstått att priset kan variera per kvart och att styrning påverkar kostnaden.”
- För Förvaltat: ingen riskcheckbox krävs i v1.

### **10.3 Loggning (måste kunna spåras)**

Flödet ska spara:

- Orgnr, företagsnamn
- Scenario (byte eller flytt)
- Vald produkt och produkt-id
- Prisparametrar och prisdetaljer som visades
- Anläggningslista med anläggnings-id, adress, kWh
- Kontaktpersonuppgifter
- Fakturaadress och referens
- Behörighetsintyg (checkbox) med timestamp
- Signatär(er) med timestamp och signeringsstatus

---

# **11) Omteckning (Mina sidor företag)**

Beslut:

- Omteckning stöds, men endast som inträde från Mina sidor företag (autentiserad kontext).

Krav:

- Flödet ska kunna starta med:
  - orgnr
  - anläggnings-id
  - befintlig adress (om tillgänglig)
  - nuvarande produkt (om tillgänglig)

- Signatär hämtas från inloggad användare och ska inte kunna ändras i UI.
- Om orgnr eller anläggnings-id saknas i kontext: avbryt till support/sälj.

---

# **12) Felhantering och stoppfall**

Stoppfall som måste ha tydlig UX och utgång:

- Orgnr uppslag misslyckas -> sälj
- Årsförbrukning över 1 GWh -> sälj
- Fler än 5 anläggningar -> sälj
- Saknar anläggnings-id -> sälj
- Firmateckning oklar -> sälj
- Tvåsignering ej klar inom 7 dagar -> uppföljning

---

## **Leveransartefakter till utvecklare**

För att implementera snabbt utifrån privatflödet ska detta levereras som del av ändringen:

- Nya states i datamodell: orgnr, företagsnamn, firmateckningssätt, kontaktperson, fakturareferens, anläggningslista
- Nya regler: SME-routing, max anläggningar, startmånad, 2 signering
- Ny copy för företag i alla berörda skärmar
- Tre företagsprodukter med produkt-id och beskrivningstext

Vill du att jag skriver detta som en skärm-för-skärm specifikation i samma ordning som privatflödet (med exakt vilka befintliga steg som byts ut, tas bort och läggs till)?
