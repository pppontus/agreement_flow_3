# Avtalsflöde Bixia – Kravspec v8

**Mål:** Ett avtalsflöde för privatpersoner som är extremt lättanvänt, högkonverterande och robust.  
**Scope:** NY kund, FLYTT (EXTRA avtal hanteras i framtiden).  
**Plattform:** Desktop-first (intern prototyp för testning, UX färdigställer design senare).

UX-principer:

Adress först: Visa värde (pris/produkt) innan krav på legitimering.

One Question Per Screen: En tydlig uppgift per vy.

Minimal copy: Endast text som krävs för nästa beslut.

Säkerhet: Inga personuppgifter visas utan BankID-verifiering.

Inga dead ends: Alltid en väg vidare (Support/Mina sidor/Starta om).

0. Projektöversikt
Deliverable: High fidelity prototype (Next.js) med Mock Backend (MSW). Krav: Flödet ska klara refresh, back-navigering och avbruten BankID utan att tappa state.

1. Data Modeling
1.1 CaseState (TypeScript)
TypeScript
type EntryPoint = 'ADDRESS_FIRST' | 'PRODUCT_FIRST';
type Scenario = 'UNKNOWN' | 'NY' | 'BYTE' | 'FLYTT' | 'EXTRA';
type IdMethod = 'BANKID_MOBILE' | 'BANKID_QR' | 'MANUAL_PNR';

type Address = {
  street: string;
  number: string;
  postalCode: string;
  city: string;
  type?: 'LGH' | 'VILLA' | 'UNKNOWN';
};

type CaseState = {
  // Meta
  caseId: string | null;
  entryPoint: EntryPoint;
  scenario: Scenario;

  // Address Context
  valdAdress: Address | null;
  addressDetails: {
    isApartment: boolean;
    apartmentNumber: string | null;
    co: string | null;
  };

  // Identity & Customer
  idMethod: IdMethod | null;
  personnummer: string | null;
  isAuthenticated: boolean; // True only if strong auth (BankID) used
  customer: {
    isExistingCustomer: boolean;
    name: string | null; // NULL if !isAuthenticated
    email: string | null; // NULL if !isAuthenticated
    phone: string | null; // NULL if !isAuthenticated
    folkbokforing: Address | null; // NULL if !isAuthenticated
  };

  // Product & Price
  selectedProduct: Product | null;
  isPriceConflict: boolean;

  // Dates
  startDate: string | null;
  startDateMode: 'EARLIEST' | 'CHOOSE_DATE';

  // Legal & Consents
  marketingConsent: { email: boolean; sms: boolean };
  riskInfoAccepted: boolean;
  termsAccepted: boolean; // Merged consent

  // Stop & Recovery
  stop: { isStopped: boolean; reason: StopReason | null };
};
2. API & Mock-strategi (MSW)
2.1 Endpoints
POST /api/address/resolve

Output: Address + type + serviceable status.

POST /api/products

Output: Produkter med priser för adressens elområde.

POST /api/identify (Kritisk logik)

Input: pnr, method

Logic:

Om method == MANUAL_PNR: Returnera isExistingCustomer men NULL på namn/adress/kontakt. Sätt isAuthenticated: false.

Om method == BANKID: Returnera full data. Sätt isAuthenticated: true.

POST /api/scenario/resolve

Avgör om det är Byte/Flytt/Extra baserat på data.

POST /api/facility

Hämtar anläggnings-ID (Privatpersoner: oftast 1 per adress).

2.2 Testpersonas
Anna (Happy Path): Adress först, BankID mobil, Villa (SE3).

Bertil (Manuell): Manuell PNR (inget prefill), LGH (kräver lgh-nr).

Cecilia (Flytt A): Befintlig kund, BankID. Söker ny adress → får frågan "Vill du flytta ditt avtal hit?".

Denise (Flytt B): Befintlig kund, BankID. Söker adress där hen redan bor → system upptäcker avtal på annan adress och frågar "Vill du flytta från {gammal adress}?".

Erik (Stopp): Försöker teckna dubblett på samma adress (DUPLICATE_SAME_CONTRACT).

3. Flöde & Microcopy
A. Start: Adress först
A1 Sök adress

Placeholder: "Skriv adress"

Knapp: "Fortsätt"

A2 Välj adress (Om flera träffar)

Radknapp per träff: "Välj"

A3 Bekräfta adress

Primär: "Gå vidare med {adress}"

Sekundär: "Använd annan adress"

A4 Lägenhetsnummer (Endast om type=LGH)

Etikett: "Lägenhetsnummer (4 siffror)"

Hjälplänk: "Var hittar jag numret?"

Knapp: "Fortsätt"

A5 c/o (Valfritt)

Toggle: "Lägg till c/o"

Knapp: "Fortsätt"

P. Produktval
P1 Välj avtalsform (Hämtat för valt område)

Kort: "Fast" + pris

Kort: "Rörligt" + pris

Kort: "Kvarts" + pris

(Klick väljer och går vidare)

I. Identifiering
I1 Identifiera dig

Knapp: "BankID" (Default)

Knapp: "BankID på annan enhet" (QR)

Länk: "Jag kan inte använda BankID" (Manuell input)

I2 BankID (Mobil/QR)

Status: "Öppna BankID-appen" / "Skanna QR-koden"

Knapp: "Avbryt"

I3 Personnummer (Fallback)

Etikett: "Personnummer"

Hjälptext: "Du behöver BankID för att signera avtalet i sista steget."

Knapp: "Fortsätt"

System: Hämtar inga personuppgifter (Silent Mode).

S. Scenario (Smart Flytt-detection)

**S1 Flytt-erbjudande (Visas om kund har avtal på annan adress)**

Rubrik: "Vill du flytta ditt elavtal?"

Text: "Vi ser att du har ett avtal på {gammalAdress}. Vill du flytta det till {nyAdress}?"

Primär: "Ja, flytta mitt avtal"

Sekundär: "Nej, teckna nytt avtal"

Systemlogik: Vid "Flytta" → Gamla avtalet sägs upp automatiskt. Bixia hanterar eventuellt överlapp i datum åt kunden.

**S2 Vad gäller det? (Fallback om API ej kan avgöra)**

Radknapp: "Jag bor här idag (Byt till Bixia)"

Radknapp: "Jag flyttar hit"

F. Facility (Endast vid problem)
Normalfall: API hittar 1 anläggning -> Auto-select (inget UI).

F1 Välj anläggning (Om flera finns)

Radknapp per val: "Välj"

F2 Fullmakt (Om API kräver det)

Primär: "Hämta anläggnings-id (BankID)"

Sekundär: "Fyll i manuellt"

D. Startdatum
D1 Start

Radknapp: "Tidigast möjligt"

Radknapp: "Välj datum"

Interaction: Vid val av "Välj datum" expanderas kalendern direkt under (Inline).

Knapp: "Fortsätt"

C. Kontakt (Säkerhetsanpassad)
C1 Kontakt

Logik: Om isAuthenticated=true → Prefill e-post/telefon från API. Vi litar på att API-data stämmer, men fälten är redigerbara.

Logik: Om isAuthenticated=false (Manuell PNR) → Tomma fält.

Fält: "E-post"

Fält: "Telefon"

(Kundens namn hämtas från BankID/API och visas ej som redigerbart fält.)

Knapp: "Fortsätt"

B. Faktura (Valfritt)
B1 Fakturaadress

Radknapp: "Samma som {valdAdress}"

Radknapp: "Annan adress"

(Vid val av Annan -> Visa adressök inline)

Knapp: "Fortsätt"

L. Villkor & Signering
L1 Villkor (Sammanslaget)

Checkbox: "Jag godkänner villkoren samt intygar att jag tagit del av ångerrätt och integritetspolicy."

Länkar (under): "Villkor" | "Ångerrätt" | "Integritet"

Knapp: "Fortsätt"

L2 Risk (Endast Fast/Kvarts)

Checkbox: "Jag har tagit del av riskinformationen"

Länk: "Läs riskinformation"

Knapp: "Fortsätt"

SIGN1 Signera

Status: "Signera avtalet i BankID"

Knapp: "Avbryt"

OK. Kvittens
OK1 Klart

Rubrik: "Tack!"

Text: "Order {orderId} är mottagen."

Knapp: "Gå till Mina sidor"

(Om i zon): Knapp: "Lägg till Bixia Nära"

4. Stop Pages (Hantering av fel)
STOP: Duplicate

Rubrik: "Redan klart"

Text: "Du har redan ett likadant avtal här."

Knapp: "Logga in på Mina sidor"

STOP: Pågående

Rubrik: "Ärende pågår"

Text: "Du har redan ett pågående byte för denna adress."

Knapp: "Kontakta kundservice"

STOP: Kan ej leverera

Text: "Vi kan tyvärr inte leverera på denna adress."

Knapp: "Sök annan adress"

5. Verification Checklist
Adress först: Pris visas innan legitimering.

Säkerhet: Manuell PNR visar ALDRIG namn/adress/kontakt ("Silent Mode").

UX: Inline-datumväljare (inget sidbyte).

UX: Sammanslagna villkors-checkboxar (1 klick).

Scenario: Tydlig copy i S1 ("Jag bor här" vs "Flyttar hit").

Robusthet: Refresh/Back fungerar (Resume token).

Flytt: Smart detection av befintliga avtal + automatisk uppsägning.

---

6. Loading States & Feedback

Princip: Diskreta, kontextuella animationer. Inga störande spinners.

- Knappar: Subtle pulse/shimmer under API-anrop.
- Adressök: Skeleton-loader i träfflistan.
- BankID: Animerad ikon + statustext.
- Vid timeout (>8s): Visa mjukt felmeddelande med "Försök igen".

---

7. Tillgänglighet (a11y) – Framtida fas

(Implementeras sent i utvecklingen)

- Keyboard-navigering: Tab genom alla interaktiva element.
- Fokusindikatorer: Synliga focus states.
- Skärmläsarstöd: Korrekt ARIA-labels och semantisk HTML.
- Formulärvalidering: Felmeddelanden kopplade till fält via aria-describedby.