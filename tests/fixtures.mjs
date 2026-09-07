import { createInitialPrivateState, flowStateReducer } from '../src/state/flowState.ts';
export const ADDRESS = { street: 'Drottninggatan', number: '14', postalCode: '11122', city: 'Stockholm', type: 'VILLA', elomrade: 'SE3' };
export const PRODUCT = { id: '2', name: 'Bixia Rörligt Pris', type: 'RORLIGT', description: 'Testprodukt', contractTerms: { bindingMonths: null, noticeMonths: 1 } };
export function identifiedState(scenario = 'NY') {
  let state = createInitialPrivateState();
  const apply = action => { state = flowStateReducer(state, action); };
  apply({ type: 'SET_PRIVATE_ADDRESS', address: ADDRESS });
  apply({ type: 'SELECT_PRIVATE_PRODUCT', product: PRODUCT });
  apply({ type: 'SET_PRIVATE_AUTHENTICATED', personnummer: '198501011234', method: 'BANKID_MOBILE' });
  apply({ type: 'SET_PRIVATE_SCENARIO', scenario, customer: {
    isExistingCustomer: scenario !== 'NY', name: 'Test Kund', email: 'test@example.com', phone: '0701234567',
    folkbokforing: ADDRESS, facilityId: null, marketingConsent: { email: false, sms: false },
  } });
  if (scenario === 'FLYTT') apply({ type: 'SET_PRIVATE_MOVE_CHOICE', choice: 'MOVE_EXISTING' });
  apply({ type: 'NAVIGATE_PRIVATE', step: 'DETAILS' });
  return state;
}
export function readyToSign() {
  let state = identifiedState();
  for (const action of [
    { type: 'CONFIRM_PRIVATE_DATE', value: { date: '2027-10-01', mode: 'SPECIFIC' } },
    { type: 'SET_PRIVATE_CUSTOMER_DETAILS', details: { email: 'test@example.com', phone: '0701234567', startDate: '2027-10-01', startDateMode: 'SPECIFIC' } },
    { type: 'SET_PRIVATE_INVOICE', invoice: { mode: 'SAME_AS_RECOMMENDED', address: ADDRESS } },
    { type: 'SET_PRIVATE_FACILITY_HANDLING', handling: { mode: 'FETCH_WITH_POWER_OF_ATTORNEY', facilityId: null } },
    { type: 'SET_PRIVATE_CONSENTS', consents: { terms: true } },
    { type: 'NAVIGATE_PRIVATE', step: 'SIGNING' },
  ]) state = flowStateReducer(state, action);
  return state;
}
