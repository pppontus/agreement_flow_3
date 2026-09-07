# Arkitektur och beslut

Aktuellt beslut 2026-09-07: stabilisera privatflödet och gemensam grund före en separat UX-genomgång.

## Data och ansvar

React-formulär → typade actions → reducer → bekräftade uppgifter/utkast → rena navigeringsregler → visat steg.

`src/state/flowState.ts` äger tillståndsändringar. `src/state/persistence.ts` validerar, migrerar och serialiserar version 9. `src/flow/privateFlow.ts` avgör tillåtna steg, bakåtvägar och extratjänster. `src/flow/validation.ts` delar validering mellan regler och formulär. Context kopplar detta till React; navigeringshooken hanterar URL och historik.

Utkast får innehålla ofärdig text. Fortsätt validerar och bekräftar uppgifterna innan nästa steg. Datum använder EARLIEST eller SPECIFIC. Tidigare CHOOSE_DATE och pendingStartDate migreras vid inläsning.

## Navigering och återupptagning

- Generell ingång är adress → produkt → identifiering. Produkt- och partneringång behåller sin befintliga ordning.
- Samma regelverk gäller knappar, historik och djuplänkar. Ett otillåtet steg korrigeras till första nödvändiga steg med replace i historiken.
- Datum-, kontakt- och fakturautkast samt bekräftade uppgifter återställs i samma flik. URL med uttryckligt steg är en validerad begäran; annars återställs sparat steg och delsteg.
- Personnummer lagras inte. Giltig simulerad identifiering får återställas. Manuell inmatning räcker för nya kunder; befintliga kunder måste verifieras med simulerat BankID.
- Pågående signering återgår till signeringsstart vid omladdning. Kvittens kräver slutförd signering. Efter signering är avtalet låst; tidigare historik går till kvittens och omstart skapar nytt ärende.
- Ändrad produkt, leveransadress, flyttval, datum eller anläggningshantering återkallar berörda godkännanden. Adressbyte återställer även scenario och identifiering.
- Lagring som är skadad eller otillgänglig får inte krascha appen. Endast egna lagringsnycklar rensas.

## Prototypens gränser

Tjänster simuleras lokalt. Detta är inte verklig autentisering, avtalssignering eller beställning. Datum- och risksamtyckesregler återanvänder prototypens befintliga beslut; de har inte omprövats juridiskt i denna etapp. Företagsflödet slutar efter anläggningsuppgifterna och färdigställs separat.
