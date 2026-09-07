import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createInitialPrivateState,
  flowStateReducer,
} from '../src/state/flowState.ts';
import { parsePersistedCaseState, serializeCaseState } from '../src/state/persistence.ts';
import {
  getExtraOfferEligibility,
  getPrivateBackTarget,
  getRequiredCorrectionStep,
} from '../src/flow/privateFlow.ts';

const ADDRESS = {
  street: 'Storgatan',
  number: '1',
  postalCode: '11122',
  city: 'Stockholm',
  type: 'LGH',
  elomrade: 'SE3',
};

const PRODUCT = {
  id: 'product-1',
  name: 'Rörligt pris',
  type: 'RORLIGT',
  description: 'Testprodukt',
  contractTerms: { bindingMonths: null, noticeMonths: 1 },
};

const EXISTING_CUSTOMER = {
  isExistingCustomer: true,
  name: 'Test Kund',
  email: 'test@example.com',
  phone: '0701234567',
  folkbokforing: ADDRESS,
  facilityId: '735999000000000001',
  extraServices: {
    bixiaNara: { selected: true, county: 'Stockholms län' },
    realtimeMeter: { selected: false },
    contactMeServices: ['SOLAR'],
  },
  marketingConsent: { email: true, sms: true },
};

test('adressbyte rensar all data som beror på den gamla adressen', () => {
  let state = createInitialPrivateState({ entryPoint: 'PRODUCT_FIRST' });
  state = flowStateReducer(state, { type: 'SELECT_PRIVATE_PRODUCT', product: PRODUCT });
  state = flowStateReducer(state, { type: 'SET_PRIVATE_ADDRESS', address: ADDRESS, apartmentDetails: { number: '1001', co: null } });
  state = flowStateReducer(state, {
    type: 'SET_PRIVATE_AUTHENTICATED',
    personnummer: '198001011234',
    method: 'BANKID_MOBILE',
  });
  state = flowStateReducer(state, {
    type: 'SET_PRIVATE_SCENARIO',
    scenario: 'BYTE',
    customer: EXISTING_CUSTOMER,
  });
  state = flowStateReducer(state, {
    type: 'SET_PRIVATE_CUSTOMER_DETAILS',
    details: {
      email: 'test@example.com',
      phone: '0701234567',
      startDate: '2026-10-01',
      startDateMode: 'SPECIFIC',
    },
  });
  state = flowStateReducer(state, {
    type: 'SET_PRIVATE_CONSENTS',
    consents: { terms: true, risk: true },
  });

  const nextAddress = { ...ADDRESS, number: '2' };
  state = flowStateReducer(state, { type: 'SET_PRIVATE_ADDRESS', address: nextAddress });

  assert.equal(state.customerType, 'PRIVATE');
  assert.equal(state.selectedProduct?.id, PRODUCT.id);
  assert.equal(state.isAuthenticated, false);
  assert.equal(state.personnummer, null);
  assert.equal(state.scenario, 'UNKNOWN');
  assert.equal(state.startDate, null);
  assert.equal(state.termsAccepted, false);
  assert.equal(state.customer.isExistingCustomer, false);
});

test('produktbyte ogiltigförklarar tidigare juridiska godkännanden', () => {
  let state = createInitialPrivateState();
  state = flowStateReducer(state, { type: 'SELECT_PRIVATE_PRODUCT', product: PRODUCT });
  state = flowStateReducer(state, {
    type: 'SET_PRIVATE_CONSENTS',
    consents: { terms: true, risk: true },
  });
  state = flowStateReducer(state, {
    type: 'SELECT_PRIVATE_PRODUCT',
    product: { ...PRODUCT, id: 'product-2' },
  });

  assert.equal(state.customerType, 'PRIVATE');
  assert.equal(state.termsAccepted, false);
  assert.equal(state.riskInfoAccepted, false);
});

test('persistens versioneras och lagrar inte personnummer', () => {
  let state = createInitialPrivateState();
  state = flowStateReducer(state, {
    type: 'SET_PRIVATE_AUTHENTICATED',
    personnummer: '198001011234',
    method: 'BANKID_QR',
  });

  const serialized = serializeCaseState(state);
  const restored = parsePersistedCaseState(serialized);

  assert.equal(serialized.includes('198001011234'), false);
  assert.equal(restored?.customerType, 'PRIVATE');
  assert.equal(restored?.customerType === 'PRIVATE' ? restored.personnummer : 'wrong-type', null);
});

test('ogiltig lagrad data ignoreras säkert', () => {
  assert.equal(parsePersistedCaseState('{broken'), null);
  assert.equal(parsePersistedCaseState(JSON.stringify({ customerType: 'UNKNOWN' })), null);
});

test('extratjänster härleds från CRM-data och ytterligare adress', () => {
  let state = createInitialPrivateState();
  state = flowStateReducer(state, {
    type: 'SET_PRIVATE_SCENARIO',
    scenario: 'BYTE',
    customer: EXISTING_CUSTOMER,
  });

  const existingAddressEligibility = getExtraOfferEligibility(state);
  assert.equal(existingAddressEligibility.shouldOfferBixiaNara, false);
  assert.equal(existingAddressEligibility.shouldOfferRealtimeMeter, true);
  assert.deepEqual(existingAddressEligibility.contactServicesToOffer, [
    'HOME_BATTERY',
    'CHARGER',
    'ATTIC_INSULATION',
  ]);

  state = flowStateReducer(state, {
    type: 'SET_PRIVATE_MOVE_CHOICE',
    choice: 'NEW_ON_NEW_ADDRESS',
  });
  const additionalAddressEligibility = getExtraOfferEligibility(state);
  assert.equal(additionalAddressEligibility.shouldOfferBixiaNara, true);
  assert.equal(additionalAddressEligibility.contactServicesToOffer.length, 4);
});

test('guards och bakåtnavigering är rena och testbara', () => {
  let state = createInitialPrivateState({ entryPoint: 'ADDRESS_FIRST' });
  state = flowStateReducer(state, { type: 'NAVIGATE_PRIVATE', step: 'TERMS' });

  assert.equal(state.currentStep, 'ADDRESS_SEARCH');
  assert.equal(getRequiredCorrectionStep(state), null);

  state = flowStateReducer(state, { type: 'SET_PRIVATE_ADDRESS', address: ADDRESS, apartmentDetails: { number: '1001', co: null } });
  state = flowStateReducer(state, { type: 'SELECT_PRIVATE_PRODUCT', product: PRODUCT });
  state = flowStateReducer(state, { type: 'SET_PRIVATE_AUTHENTICATED', personnummer: '198001011234', method: 'BANKID_MOBILE' });
  state = flowStateReducer(state, { type: 'SET_PRIVATE_SCENARIO', scenario: 'NY', customer: EXISTING_CUSTOMER });
  state = flowStateReducer(state, { type: 'CONFIRM_PRIVATE_DATE', value: { date: '2027-10-01', mode: 'SPECIFIC' } });
  state = flowStateReducer(state, { type: 'NAVIGATE_PRIVATE', step: 'DETAILS' });
  state = flowStateReducer(state, { type: 'SET_PRIVATE_DETAILS_STEP', step: 'CONTACT' });

  assert.deepEqual(
    getPrivateBackTarget(state, getExtraOfferEligibility(state)),
    { detailsStep: 'DATE' }
  );
});
