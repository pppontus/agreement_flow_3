import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialPrivateState, createInitialCompanyState, flowStateReducer } from '../src/state/flowState.ts';
import { resolvePrivateNavigation, getPrivateBackTarget, getExtraOfferEligibility } from '../src/flow/privateFlow.ts';
import { parsePersistedCaseState, serializeCaseState } from '../src/state/persistence.ts';
import { ADDRESS, PRODUCT, identifiedState, readyToSign } from './fixtures.mjs';

for (const step of ['TERMS', 'SIGNING', 'CONFIRMATION', 'EXTRA_BIXIA_NARA']) {
  test(`${step} kräver föregående uppgifter även med produkt`, () => {
    const state = { ...createInitialPrivateState(), selectedProduct: PRODUCT };
    assert.equal(resolvePrivateNavigation(state, step).step, 'ADDRESS_SEARCH');
    assert.equal(flowStateReducer(state, { type: 'NAVIGATE_PRIVATE', step }).currentStep, 'ADDRESS_SEARCH');
  });
}
test('giltig signering och kvittens kräver ett slutfört signeringsförlopp', () => {
  let state = readyToSign();
  assert.equal(state.currentStep, 'SIGNING');
  assert.equal(resolvePrivateNavigation(state, 'CONFIRMATION').step, 'SIGNING');
  state = flowStateReducer(state, { type: 'COMPLETE_PRIVATE_SIGNING', signedAt: '2026-09-07T12:00:00Z' });
  assert.equal(state.currentStep, 'CONFIRMATION');
  for (const step of ['IDENTIFY', 'TERMS', 'DETAILS', 'ADDRESS_SEARCH']) assert.equal(resolvePrivateNavigation(state, step).step, 'CONFIRMATION');
  assert.equal(parsePersistedCaseState(serializeCaseState(state)).currentStep, 'CONFIRMATION');
  assert.equal(flowStateReducer(createInitialPrivateState(), { type: 'COMPLETE_PRIVATE_SIGNING', signedAt: '2026-09-07T12:00:00Z' }).signedAt, null);
});
test('kontakt efter tillbaka från villkor använder bekräftat datum', () => {
  let state = { ...readyToSign(), currentStep: 'TERMS' };
  const target = getPrivateBackTarget(state, getExtraOfferEligibility(state));
  state = flowStateReducer(state, { type: 'NAVIGATE_PRIVATE', ...target });
  assert.equal(state.detailsStep, 'CONTACT');
  assert.equal(state.startDate, '2027-10-01');
  state = flowStateReducer(state, { type: 'SET_PRIVATE_CUSTOMER_DETAILS', details: { email: 'new@example.com', phone: '0701234567', startDate: state.startDate, startDateMode: state.startDateMode } });
  state = flowStateReducer(state, { type: 'NAVIGATE_PRIVATE', step: 'TERMS' });
  assert.equal(state.currentStep, 'TERMS');
  assert.equal(state.customer.email, 'new@example.com');
});
test('ändrad adress, produkt, datum, flyttval eller anläggning återkallar godkännande', () => {
  for (const action of [
    { type: 'SET_PRIVATE_ADDRESS', address: { ...ADDRESS, number: '99' } },
    { type: 'SELECT_PRIVATE_PRODUCT', product: { ...PRODUCT, id: '3' } },
    { type: 'CONFIRM_PRIVATE_DATE', value: { date: '2027-11-01', mode: 'SPECIFIC' } },
    { type: 'SET_PRIVATE_MOVE_CHOICE', choice: 'NEW_ON_NEW_ADDRESS' },
    { type: 'SET_PRIVATE_FACILITY_HANDLING', handling: { mode: 'MANUAL', facilityId: '735123456789012345' } },
  ]) {
    const next = flowStateReducer(readyToSign(), action);
    assert.equal(next.termsAccepted, false, action.type);
    assert.equal(next.signedAt, null);
  }
  const unchanged = flowStateReducer(readyToSign(), { type: 'CONFIRM_PRIVATE_DATE', value: { date: '2027-10-01', mode: 'SPECIFIC' } });
  assert.equal(unchanged.termsAccepted, true);
});
test('datum- och kontaktutkast sparas men uppfyller inte stegets krav', () => {
  let state = identifiedState();
  state = flowStateReducer(state, { type: 'SET_PRIVATE_DATE_DRAFT', value: { date: '2027-10-01', mode: 'SPECIFIC' } });
  state = flowStateReducer(state, { type: 'SET_PRIVATE_CONTACT_DRAFT', value: {
    email: 'ofärdig@', phone: '070', useRecommendedInvoice: false, invoiceQuery: 'Sto',
    selectedCustomInvoiceAddress: null, invoiceApartmentNumber: '12', invoiceCoValue: 'Test', isConfirming: false,
  } });
  const restored = parsePersistedCaseState(serializeCaseState(state));
  assert.equal(restored.dateDraft.date, '2027-10-01');
  assert.equal(restored.contactDraft.email, 'ofärdig@');
  assert.equal(restored.contactDraft.invoiceQuery, 'Sto');
  assert.equal(restored.startDate, null);
  assert.deepEqual(resolvePrivateNavigation(restored, 'SIGNING'), { step: 'DETAILS', detailsStep: 'DATE' });
});
test('lagrade felaktiga datatyper och okända versioner normaliseras säkert', () => {
  const restored = parsePersistedCaseState(JSON.stringify({ version: 9, state: {
    customerType: 'PRIVATE', selectedProduct: 'invalid', valdAdress: 42, isAuthenticated: 'true',
    customer: { email: 42 }, signedAt: '2026-09-07T12:00:00Z', currentStep: 'CONFIRMATION',
  } }));
  assert.equal(restored.selectedProduct, null);
  assert.equal(restored.valdAdress, null);
  assert.equal(restored.isAuthenticated, false);
  assert.equal(restored.customer.email, null);
  assert.equal(restored.signedAt, null);
  assert.equal(restored.currentStep, 'ADDRESS_SEARCH');
  assert.equal(parsePersistedCaseState('{bad'), null);
  assert.equal(parsePersistedCaseState(JSON.stringify({ version: 100, state: readyToSign() })), null);
});
for (const version of [7, 8]) test(`version ${version} migrerar datum men antar inte slutförd signering`, () => {
  const legacy = { ...readyToSign(), currentStep: 'CONFIRMATION', startDateMode: 'CHOOSE_DATE', signedAt: undefined,
    pendingStartDate: { date: '2027-10-01', mode: 'SPECIFIC' } };
  const restored = parsePersistedCaseState(JSON.stringify(version === 7 ? legacy : { version, state: legacy }));
  assert.equal(restored.startDateMode, 'SPECIFIC');
  assert.equal(restored.signedAt, null);
  assert.equal(restored.currentStep, 'SIGNING');
});
test('företagsuppgifter bevaras och personnummer undantas i båda flöden', () => {
  const state = { ...createInitialCompanyState(), companyName: 'Test AB', facilities: [{ id: '1', anlaggningId: '735123', address: 'Storgatan 1', zipCode: '11122', city: 'Stockholm', annualConsumption: 25000 }],
    primarySigner: { name: 'Test', email: 'test@example.com', phone: '0701234567', pnr: '198501011234' } };
  const serialized = serializeCaseState(state);
  assert.ok(!serialized.includes('198501011234'));
  assert.equal(parsePersistedCaseState(serialized).companyName, 'Test AB');
  assert.equal(JSON.stringify(parsePersistedCaseState(serialized).facilities), JSON.stringify(state.facilities));
  assert.ok(!serializeCaseState(readyToSign()).includes('198501011234'));
});
test('flyttval, befintlig kund, extratjänster, stopp och generisk produkt har egna vägar', () => {
  assert.equal(resolvePrivateNavigation({ ...identifiedState('FLYTT'), moveChoice: null }, 'TERMS').step, 'MOVE_OFFER');
  assert.equal(resolvePrivateNavigation({ ...identifiedState('BYTE'), idMethod: 'MANUAL_PNR' }, 'TERMS').step, 'IDENTIFY');
  assert.equal(resolvePrivateNavigation(identifiedState('EXTRA'), 'EXTRA_BIXIA_NARA').step, 'EXTRA_BIXIA_NARA');
  assert.equal(resolvePrivateNavigation({ ...identifiedState(), stop: { isStopped: true, reason: 'CANNOT_DELIVER' } }, 'TERMS').step, 'FLOW_STOP');
  assert.equal(resolvePrivateNavigation({ ...identifiedState(), selectedProduct: { ...PRODUCT, id: 'GENERIC' } }, 'SIGNING').step, 'PRODUCT_CLARIFY');
});
