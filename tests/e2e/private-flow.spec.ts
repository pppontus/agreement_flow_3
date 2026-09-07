import { test, expect, type Page } from '@playwright/test';
import { identifiedState, readyToSign } from '../fixtures.mjs';
import { serializeCaseState } from '../../src/state/persistence';
import { createInitialPrivateState } from '../../src/state/flowState';

async function seed(page: Page, state: Parameters<typeof serializeCaseState>[0], query = '') {
  await page.addInitScript(serialized => {
    if (!sessionStorage.getItem('test-seeded')) {
      sessionStorage.setItem('bixia_flow_state_v9', serialized);
      sessionStorage.setItem('test-seeded', 'true');
    }
  }, serializeCaseState(state));
  await page.goto(`/${query}`);
}
async function stateOf(page: Page) {
  return page.evaluate(() => JSON.parse(sessionStorage.getItem('bixia_flow_state_v9')!).state);
}
test.beforeEach(async ({ page }) => {
  page.on('pageerror', error => { throw error; });
});

test('otillåten djuplänk repareras utan navigeringsloop', async ({ page }) => {
  await page.goto('/?step=CONFIRMATION');
  await expect(page.getByRole('heading', { name: 'Vilken adress gäller det?' })).toBeVisible();
  await expect(page).toHaveURL(/step=ADDRESS_SEARCH/);
});

test('datum och kontaktutkast överlever omladdning och tillbaka från villkor', async ({ page }) => {
  await seed(page, identifiedState());
  await page.getByRole('radio', { name: /Välj startdatum själv/ }).check();
  await page.locator('input[type=date]').fill('2027-10-01');
  await page.reload();
  await expect(page.locator('input[type=date]')).toHaveValue('2027-10-01');
  await page.getByRole('button', { name: 'Fortsätt', exact: true }).click();
  await page.getByRole('button', { name: 'Ändra uppgifter' }).click();
  await page.getByLabel('E-postadress', { exact: true }).fill('ofärdig@');
  await page.getByLabel('Mobilnummer', { exact: true }).fill('070');
  await page.getByLabel('Använd samma adress för faktura').uncheck();
  await page.getByLabel('Fakturaadress', { exact: true }).fill('Sto');
  await page.reload();
  await expect(page.getByLabel('E-postadress', { exact: true })).toHaveValue('ofärdig@');
  await expect(page.getByLabel('Mobilnummer', { exact: true })).toHaveValue('070');
  await expect(page.getByLabel('Fakturaadress', { exact: true })).toHaveValue('Sto');
  await page.getByLabel('E-postadress', { exact: true }).fill('updated@example.com');
  await page.getByLabel('Mobilnummer', { exact: true }).fill('0701234567');
  await page.getByLabel('Använd samma adress för faktura').check();
  await page.getByRole('button', { name: 'Fortsätt till signering' }).click();
  await expect(page.getByRole('heading', { name: 'Godkänn villkor' })).toBeVisible();
  await page.getByRole('button', { name: /Tillbaka/ }).click();
  await page.getByRole('button', { name: 'Stämmer, fortsätt' }).click();
  await expect(page.getByRole('heading', { name: 'Godkänn villkor' })).toBeVisible();
  expect((await stateOf(page)).startDate).toBe('2027-10-01');
  expect((await stateOf(page)).customer.email).toBe('updated@example.com');
  expect((await stateOf(page)).personnummer).toBeNull();
});

test('signering kan avbrytas, återstartas och kvittens återställs', async ({ page }) => {
  await seed(page, readyToSign());
  await page.getByRole('button', { name: /Signera/ }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: /Signera/ })).toBeVisible();
  expect((await stateOf(page)).signedAt).toBeNull();
  await page.getByRole('button', { name: /Signera/ }).click();
  await expect(page).toHaveURL(/step=CONFIRMATION/, { timeout: 10_000 });
  const signedAt = (await stateOf(page)).signedAt;
  expect(signedAt).toBeTruthy();
  await page.reload();
  await expect(page).toHaveURL(/step=CONFIRMATION/);
  await page.goto('/?step=TERMS');
  await expect(page).toHaveURL(/step=CONFIRMATION/);
  expect((await stateOf(page)).signedAt).toBe(signedAt);
});

test('skadad lagring och blockerad lagring ger en användbar start', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('bixia_flow_state_v9', '{broken'));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Vilken adress gäller det?' })).toBeVisible();
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('blocked'); };
    Storage.prototype.setItem = () => { throw new Error('blocked'); };
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Vilken adress gäller det?' })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Uppgifterna kan inte sparas');
});

test('mobilbredd och företagsflödets befintliga ingång fungerar', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Företag', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Företag', exact: true }).click();
  await expect(page.getByText('Bixia Förvaltat Pris', { exact: true }).first()).toBeVisible();
});

test('ny kund kan genomföra flödet från adress till kvittens', async ({ page }, testInfo) => {
  await seed(page, createInitialPrivateState());
  await page.getByLabel('Adress', { exact: true }).fill('Drottninggatan');
  await page.getByRole('button', { name: /Drottninggatan 14/ }).click();
  await page.getByRole('button', { name: 'Fortsätt', exact: true }).click();
  await page.locator('article, section, div').filter({ has: page.getByRole('heading', { name: 'Bixia Rörligt Pris', exact: true }) }).filter({ has: page.getByRole('button', { name: 'Välj avtal', exact: true }) }).last().getByRole('button', { name: 'Välj avtal', exact: true }).click();
  await page.getByTitle('Öppna backend-vy').click();
  await page.locator('input[name=mockScenario][value=NY_KUND]').check();
  await page.getByTitle('Stäng backend-vy').click();
  await page.getByRole('button', { name: /Fortsätt manuellt/ }).click();
  await page.getByLabel('Personnummer', { exact: true }).fill('198001011234');
  await page.getByRole('button', { name: 'Fortsätt', exact: true }).click();
  await expect(page).toHaveURL(/step=DETAILS/, { timeout: 10_000 });
  expect((await stateOf(page)).scenario).toBe('NY');
  await page.getByRole('button', { name: 'Fortsätt', exact: true }).click();
  await page.getByLabel('E-postadress', { exact: true }).fill('new@example.com');
  await page.getByLabel('Mobilnummer', { exact: true }).fill('0701234567');
  await page.getByRole('button', { name: 'Fortsätt till signering' }).click();
  await page.getByRole('checkbox', { name: /Jag godkänner/ }).check();
  await page.getByRole('button', { name: /Till signering/ }).click();
  await expect(page).toHaveURL(/step=SIGNING/);
  await page.getByRole('button', { name: /Signera/ }).click();
  await expect(page).toHaveURL(/step=CONFIRMATION/, { timeout: 10_000 });
  await expect(page.getByRole('heading', { name: 'Tack, din beställning är klar!' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('confirmation.png'), fullPage: true });
});

for (const moveChoice of ['MOVE_EXISTING', 'NEW_ON_NEW_ADDRESS'] as const) {
  test(`flyttval ${moveChoice} följer med till kontakt och signering`, async ({ page }) => {
    const state = identifiedState('FLYTT');
    state.moveChoice = null;
    state.currentStep = 'MOVE_OFFER';
    await seed(page, state);
    await page.getByRole('button', { name: moveChoice === 'MOVE_EXISTING' ? /flytta med/i : /Teckna nytt/ }).click();
    await expect(page).toHaveURL(/step=DETAILS/);
    expect((await stateOf(page)).moveChoice).toBe(moveChoice);
    await page.getByRole('button', { name: 'Fortsätt', exact: true }).click();
    await page.getByRole('button', { name: 'Stämmer, fortsätt' }).click();
    await page.getByRole('checkbox', { name: /Jag godkänner/ }).check();
    await page.getByRole('button', { name: /Till signering/ }).click();
    await expect(page.getByRole('heading', { name: 'Signera avtalet' })).toBeVisible();
    expect((await stateOf(page)).moveChoice).toBe(moveChoice);
  });
}
for (const binding of [true, false]) {
  test(`byte ${binding ? 'med' : 'utan'} bindning återupptar datumsteget`, async ({ page }) => {
    const state = identifiedState('BYTE');
    state.customer.contractEndDate = binding ? '2027-09-30' : null;
    await seed(page, state);
    await expect(page.getByRole('heading', { name: 'När ska bytet starta?' })).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: 'Bekräfta startdatum' }).click();
    await expect(page.getByRole('heading', { name: 'Stämmer dina uppgifter?' })).toBeVisible();
    if (binding) expect((await stateOf(page)).startDate).toBe('2027-10-01');
  });
}

test('befintligt avtal går till extratjänster utan ny signering', async ({ page }) => {
  const state = identifiedState('EXTRA');
  await seed(page, state);
  await expect(page).toHaveURL(/step=EXISTING_CONTRACT_EXTRAS/);
  await page.getByRole('button', { name: /Fortsätt/ }).click();
  await expect(page).toHaveURL(/step=EXTRA_BIXIA_NARA/);
  expect((await stateOf(page)).signedAt).toBeNull();
});

test('kunduppslagsfel kan provas igen och panelens synlighet ändrar inte mock', async ({ page }) => {
  const state = identifiedState(); state.currentStep = 'IDENTIFY';
  await seed(page, state);
  await page.getByTitle('Öppna backend-vy').click();
  await page.locator('input[name=mockScenario][value=ERROR]').check();
  await page.getByTitle('Stäng backend-vy').click();
  await page.getByRole('button', { name: /Fortsätt manuellt/ }).click();
  await page.getByLabel('Personnummer', { exact: true }).fill('198001011234');
  await page.getByRole('button', { name: 'Fortsätt', exact: true }).click();
  await expect(page.locator('main').getByRole('alert')).toContainText('Det gick inte att hämta dina uppgifter');
  await page.getByTitle('Öppna backend-vy').click();
  await page.locator('input[name=mockScenario][value=NY_KUND]').check();
  await page.getByTitle('Stäng backend-vy').click();
  await page.getByRole('button', { name: 'Försök igen' }).click();
  await expect(page).toHaveURL(/step=DETAILS/);
});

test('avbruten identifiering och signering får inte navigera vidare', async ({ page }) => {
  const state = identifiedState(); state.currentStep = 'IDENTIFY';
  await seed(page, state);
  await page.clock.install();
  await page.getByRole('button', { name: /Fortsätt med BankID/ }).click();
  await page.clock.fastForward(3000);
  await expect(page.getByText('Hämtar dina uppgifter…')).toBeVisible();
  await page.getByRole('button', { name: 'Avbryt', exact: true }).click();
  await page.clock.fastForward(2000);
  await expect(page).toHaveURL(/step=IDENTIFY/);
  await page.evaluate(serialized => sessionStorage.setItem('bixia_flow_state_v9', serialized), serializeCaseState(readyToSign()));
  await page.goto('/?step=SIGNING');
  await page.getByRole('button', { name: /Signera med BankID/ }).click();
  await page.getByRole('button', { name: /Avbryt/ }).click();
  await page.clock.fastForward(6000);
  await expect(page).toHaveURL(/step=TERMS/);
  expect((await stateOf(page)).signedAt).toBeNull();
});

test('webbläsarens bakåt och framåt bevarar delsteg och uppgifter', async ({ page }) => {
  await seed(page, identifiedState());
  await page.getByRole('button', { name: 'Fortsätt', exact: true }).click();
  await page.getByRole('button', { name: 'Stämmer, fortsätt' }).click();
  await expect(page).toHaveURL(/step=TERMS/);
  await page.goBack();
  await expect(page).toHaveURL(/details=CONTACT/);
  await expect(page.getByRole('heading', { name: 'Stämmer dina uppgifter?' })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/details=DATE/);
  await page.goForward();
  await expect(page).toHaveURL(/details=CONTACT/);
});

test('annan fakturaadress, lägenhet och c/o återställs som utkast', async ({ page }) => {
  const state = readyToSign(); state.currentStep = 'DETAILS'; state.detailsStep = 'CONTACT';
  await seed(page, state);
  await page.getByRole('button', { name: 'Ändra uppgifter' }).click();
  await page.getByLabel('Använd samma adress för faktura').uncheck();
  await page.getByLabel('Fakturaadress', { exact: true }).fill('Storgatan');
  await page.getByRole('button', { name: /Storgatan 1,/ }).click();
  await page.getByRole('button', { name: 'Ange lägenhetsnummer manuellt' }).click();
  await page.getByLabel('Lägenhetsnummer', { exact: true }).fill('1203');
  await page.getByRole('button', { name: '+ Lägg till c/o' }).click();
  await page.getByLabel('c/o (valfritt)').fill('Test Namn');
  await page.reload();
  await expect(page.getByLabel('Lägenhetsnummer', { exact: true })).toHaveValue('1203');
  await expect(page.getByLabel('c/o (valfritt)')).toHaveValue('Test Namn');
  await page.getByRole('button', { name: 'Fortsätt till signering' }).click();
  await expect(page).toHaveURL(/step=TERMS/);
  expect((await stateOf(page)).invoice.apartmentDetails).toEqual({ number: '1203', co: 'Test Namn' });
});

test('stoppfall visas efter återupptagning och kan startas om', async ({ page }) => {
  const state = identifiedState();
  state.stop = { isStopped: true, reason: 'CANNOT_DELIVER' };
  state.currentStep = 'FLOW_STOP';
  await seed(page, state);
  await expect(page).toHaveURL(/step=FLOW_STOP/);
  await page.reload();
  await expect(page).toHaveURL(/step=FLOW_STOP/);
  await page.getByRole('button', { name: /Börja om|Starta om/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Vilken adress gäller det?' })).toBeVisible();
  expect((await stateOf(page)).stop.isStopped).toBe(false);
});

test('generisk produkt och prisändring måste klaras av före signering', async ({ page }) => {
  const state = readyToSign();
  state.selectedProduct = { ...state.selectedProduct!, id: 'GENERIC' };
  await seed(page, state, '?step=SIGNING');
  await expect(page).toHaveURL(/step=PRODUCT_CLARIFY/);
  const priceState = readyToSign(); priceState.isPriceConflict = true;
  await page.evaluate(serialized => sessionStorage.setItem('bixia_flow_state_v9', serialized), serializeCaseState(priceState));
  await page.goto('/?step=SIGNING');
  await expect(page.getByRole('heading', { name: 'Priset har uppdaterats' })).toBeVisible();
  await page.getByRole('button', { name: 'Godkänn nytt pris och fortsätt' }).click();
  await expect(page.getByRole('heading', { name: 'Spara tid med BankID' })).toBeVisible();
  expect((await stateOf(page)).isPriceConflict).toBe(false);
  expect((await stateOf(page)).termsAccepted).toBe(false);
});
