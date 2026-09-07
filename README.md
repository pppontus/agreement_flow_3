# Avtalsflöde

Next.js-prototyp för Bixias avtalsflöden. Privatflödet är huvudspåret; företagsflödet är ännu ofullständigt. CRM, BankID och beställningar är mockade.

## Kom igång

Använd Node 24 enligt `.nvmrc` (med nvm: `nvm use`).

```bash
npm ci
npm run dev
```

Öppna http://localhost:3000. Produktionen exporteras statiskt för GitHub Pages under `/agreement_flow_3`.

## Aktuella instruktioner och struktur

- [AGENTS.md](AGENTS.md): instruktioner för arbete i projektet.
- [Arkitektur och beslut](docs/architecture.md): ansvar, tillstånd, navigering och lagring.
- [Aktuell arbetslista](docs/work-plan.md): denna etapp och kommande arbete.
- [Verifiering](docs/verification.md): körda kontroller och kvarvarande avgränsningar.

Rena regler finns i `src/flow`, reducer och lagringsvalidering i `src/state`, React-koppling i `src/context` och `src/hooks`, steg och samordning i `src/components`, mockade tjänster i `src/services`.

## Kvalitetskontroller

Installera testwebbläsarna en gång:

```bash
npx playwright install chromium webkit
```

```bash
npm run verify
```

Verifieringen kör lint, TypeScript, Node-tester, Playwright och produktionsbygge. Enskilda kommandon: `npm test`, `npm run lint`, `npm run typecheck`, `npm run test:e2e`, `npm run build`.

Playwright startar en egen lokal server på port 3100 och använder Chromium, mobilbredd 390 px samt WebKit. Rapporter och spår vid fel hamnar i ignorerade testkataloger. CI kör samma kvalitetskrav på pull requests och före befintlig Pages-publicering.

## Prototypbeteende

Giltiga val och formulärutkast återställs efter omladdning i samma flik. Personnummer lagras inte. En pågående signering måste startas igen; en slutförd signering ger en beständig kvittens. Om lagring inte fungerar fortsätter flödet i minnet med en synlig upplysning.

Devpanelen visas i utveckling och i prototypen på GitHub Pages, vars arbetsflöde sätter `NEXT_PUBLIC_ENABLE_DEV_PANEL=true`. Andra produktionsbyggen döljer panelen om flaggan inte sätts. Mockinställningarna är separerade från panelens synlighet.
