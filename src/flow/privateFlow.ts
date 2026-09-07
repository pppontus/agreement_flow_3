import {
  isValidAddress,
  isValidDateSelection,
  isValidEmail,
  isValidPhone,
  isValidInvoice,
  isValidFacilityHandling,
  requiresRiskConsent,
} from './validation.ts';
import type {
  Address,
  ExtraServicesSelection,
  PrivateCaseState,
  PrivateDetailsStep,
  PrivateFlowStep,
} from '../types';

export type ExtraOfferEligibility = {
  shouldOfferBixiaNara: boolean;
  shouldOfferRealtimeMeter: boolean;
  contactServicesToOffer: ExtraServicesSelection['contactMeServices'];
  shouldOfferAnyDirectExtras: boolean;
  shouldOfferAnyContactExtras: boolean;
};

export const areAddressesEqual = (
  first: Address | null | undefined,
  second: Address | null | undefined,
  options: { includeApartmentNumber?: boolean } = {},
): boolean => {
  if (!first || !second) return false;

  const sameBaseAddress =
    first.street === second.street &&
    first.number === second.number &&
    first.postalCode === second.postalCode &&
    first.city === second.city;

  if (!sameBaseAddress || !options.includeApartmentNumber)
    return sameBaseAddress;
  return (first.apartmentNumber ?? '') === (second.apartmentNumber ?? '');
};

export const CONTACT_ME_SERVICE_IDS: ExtraServicesSelection['contactMeServices'] =
  ['HOME_BATTERY', 'CHARGER', 'SOLAR', 'ATTIC_INSULATION'];

export const getExtraOfferEligibility = (
  state: PrivateCaseState,
): ExtraOfferEligibility => {
  const isAdditionalAddress =
    state.customer.isExistingCustomer &&
    state.moveChoice === 'NEW_ON_NEW_ADDRESS';
  const existingExtras = state.customer.extraServices;
  const existingContactServices = new Set(
    isAdditionalAddress ? [] : (existingExtras?.contactMeServices ?? []),
  );
  const shouldOfferBixiaNara =
    isAdditionalAddress || !existingExtras?.bixiaNara.selected;
  const shouldOfferRealtimeMeter =
    isAdditionalAddress || !existingExtras?.realtimeMeter.selected;
  const contactServicesToOffer = CONTACT_ME_SERVICE_IDS.filter(
    (serviceId) => !existingContactServices.has(serviceId),
  );

  return {
    shouldOfferBixiaNara,
    shouldOfferRealtimeMeter,
    contactServicesToOffer,
    shouldOfferAnyDirectExtras:
      shouldOfferBixiaNara || shouldOfferRealtimeMeter,
    shouldOfferAnyContactExtras: contactServicesToOffer.length > 0,
  };
};

export const getInvoiceAddressContext = (state: PrivateCaseState) => {
  const recommendedInvoiceAddress =
    state.moveChoice === 'NEW_ON_NEW_ADDRESS'
      ? (state.customer.folkbokforing ?? state.valdAdress)
      : (state.valdAdress ?? state.customer.folkbokforing);
  const suggestedCustomInvoiceAddress =
    state.moveChoice === 'NEW_ON_NEW_ADDRESS' &&
    state.valdAdress &&
    !areAddressesEqual(state.customer.folkbokforing, state.valdAdress)
      ? state.valdAdress
      : null;

  return { recommendedInvoiceAddress, suggestedCustomInvoiceAddress };
};

const EXTRAS: readonly PrivateFlowStep[] = [
  'EXTRA_BIXIA_NARA',
  'EXTRA_REALTIME_METER',
  'APP_DOWNLOAD',
  'EXTRA_CONTACT',
];

/** One policy for UI navigation, history, deep links and restored sessions. */
export const resolvePrivateNavigation = (
  state: PrivateCaseState,
  requested: PrivateFlowStep,
  requestedDetails: PrivateDetailsStep = state.detailsStep,
): { step: PrivateFlowStep; detailsStep: PrivateDetailsStep } => {
  let detailsStep = requestedDetails;
  const result = (step: PrivateFlowStep) => ({ step, detailsStep });
  const initial =
    state.entryPoint === 'ADDRESS_FIRST' ? 'ADDRESS_SEARCH' : 'PRODUCT_SELECT';
  if (state.signedAt && !EXTRAS.includes(requested))
    return result('CONFIRMATION');
  if (requested === initial) return result(requested);
  if (!state.selectedProduct && state.entryPoint === 'PRODUCT_FIRST')
    return result('PRODUCT_SELECT');
  if (requested === 'ADDRESS_SEARCH') return result(requested);
  if (
    !isValidAddress(state.valdAdress) ||
    (state.valdAdress.type === 'LGH' &&
      !/^\d{4}$/.test(
        state.addressDetails.apartmentNumber ??
          state.valdAdress.apartmentNumber ??
          '',
      ))
  )
    return result('ADDRESS_SEARCH');
  if (requested === 'PRODUCT_SELECT') return result(requested);
  if (!state.selectedProduct) return result('PRODUCT_SELECT');
  if (requested === 'PRODUCT_CLARIFY') return result(requested);
  if (state.selectedProduct.id === 'GENERIC') return result('PRODUCT_CLARIFY');
  if (requested === 'IDENTIFY' || state.isPriceConflict)
    return result('IDENTIFY');
  if (state.stop.isStopped && state.stop.reason) return result('FLOW_STOP');
  if (
    !state.isAuthenticated ||
    !state.idMethod ||
    state.scenario === 'UNKNOWN' ||
    (state.customer.isExistingCustomer && state.idMethod === 'MANUAL_PNR')
  )
    return result('IDENTIFY');
  if (requested === 'FLOW_STOP') return result('IDENTIFY');
  if (state.scenario === 'EXTRA') {
    if (!EXTRAS.includes(requested)) return result('EXISTING_CONTRACT_EXTRAS');
  } else {
    if (requested === 'EXISTING_CONTRACT_EXTRAS') return result('IDENTIFY');
    if (
      state.scenario === 'FLYTT' &&
      (!state.moveChoice || requested === 'MOVE_OFFER')
    )
      return result('MOVE_OFFER');
    if (requested === 'MOVE_OFFER') return result('IDENTIFY');
    if (
      !isValidDateSelection(
        state.startDate
          ? { date: state.startDate, mode: state.startDateMode }
          : null,
      )
    ) {
      detailsStep = 'DATE';
      return result('DETAILS');
    }
    if (requested === 'DETAILS') return result(requested);
    if (
      !isValidEmail(state.customer.email ?? '') ||
      !isValidPhone(state.customer.phone ?? '') ||
      !isValidInvoice(state.invoice)
    ) {
      detailsStep = 'CONTACT';
      return result('DETAILS');
    }
    if (requested === 'TERMS') return result(requested);
    if (
      !state.termsAccepted ||
      (requiresRiskConsent(state.selectedProduct.type) &&
        !state.riskInfoAccepted) ||
      !isValidFacilityHandling(state.facilityHandling)
    )
      return result('TERMS');
    if (!state.signedAt) return result('SIGNING');
  }
  const eligibility = getExtraOfferEligibility(state);
  if (requested === 'EXTRA_BIXIA_NARA' && !eligibility.shouldOfferBixiaNara) {
    return result(
      eligibility.shouldOfferRealtimeMeter
        ? 'EXTRA_REALTIME_METER'
        : 'APP_DOWNLOAD',
    );
  }
  if (
    requested === 'EXTRA_REALTIME_METER' &&
    !eligibility.shouldOfferRealtimeMeter
  )
    return result('APP_DOWNLOAD');
  if (requested === 'EXTRA_CONTACT' && !eligibility.shouldOfferAnyContactExtras)
    return result('APP_DOWNLOAD');
  return result(requested);
};

export const getRequiredCorrectionStep = (
  state: PrivateCaseState,
): PrivateFlowStep | null => {
  const target = resolvePrivateNavigation(state, state.currentStep);
  return target.step === state.currentStep ? null : target.step;
};

export type PrivateBackTarget =
  | { step: PrivateFlowStep; detailsStep?: PrivateDetailsStep }
  | { detailsStep: PrivateDetailsStep }
  | null;

export const getPrivateBackTarget = (
  state: PrivateCaseState,
  eligibility: ExtraOfferEligibility,
): PrivateBackTarget => {
  switch (state.currentStep) {
    case 'PRODUCT_SELECT':
      return state.entryPoint === 'ADDRESS_FIRST' && state.valdAdress
        ? { step: 'ADDRESS_SEARCH' }
        : null;
    case 'PRODUCT_CLARIFY':
      return state.isAuthenticated
        ? { step: 'DETAILS', detailsStep: 'CONTACT' }
        : { step: 'ADDRESS_SEARCH' };
    case 'ADDRESS_SEARCH':
      return state.entryPoint === 'PRODUCT_FIRST'
        ? { step: 'PRODUCT_SELECT' }
        : null;
    case 'IDENTIFY':
      return {
        step:
          state.entryPoint === 'ADDRESS_FIRST'
            ? 'PRODUCT_SELECT'
            : 'ADDRESS_SEARCH',
      };
    case 'FLOW_STOP':
    case 'EXISTING_CONTRACT_EXTRAS':
    case 'MOVE_OFFER':
      return { step: 'IDENTIFY' };
    case 'DETAILS':
      if (state.detailsStep === 'CONTACT') return { detailsStep: 'DATE' };
      return {
        step:
          state.scenario === 'FLYTT' &&
          state.customer.folkbokforing &&
          state.valdAdress
            ? 'MOVE_OFFER'
            : 'IDENTIFY',
      };
    case 'TERMS':
      return { step: 'DETAILS', detailsStep: 'CONTACT' };
    case 'SIGNING':
      return { step: 'TERMS' };
    case 'CONFIRMATION':
      return null;
    case 'EXTRA_BIXIA_NARA':
      return {
        step:
          state.scenario === 'EXTRA'
            ? 'EXISTING_CONTRACT_EXTRAS'
            : 'CONFIRMATION',
      };
    case 'EXTRA_REALTIME_METER':
      if (eligibility.shouldOfferBixiaNara) return { step: 'EXTRA_BIXIA_NARA' };
      return {
        step:
          state.scenario === 'EXTRA'
            ? 'EXISTING_CONTRACT_EXTRAS'
            : 'CONFIRMATION',
      };
    case 'APP_DOWNLOAD':
      if (eligibility.shouldOfferRealtimeMeter)
        return { step: 'EXTRA_REALTIME_METER' };
      if (eligibility.shouldOfferBixiaNara) return { step: 'EXTRA_BIXIA_NARA' };
      return {
        step:
          state.scenario === 'EXTRA'
            ? 'EXISTING_CONTRACT_EXTRAS'
            : 'CONFIRMATION',
      };
    case 'EXTRA_CONTACT':
      return { step: 'APP_DOWNLOAD' };
    default:
      return null;
  }
};

export const buildExtraServicesSelection = (
  selection: ExtraServicesSelection | null,
): ExtraServicesSelection =>
  selection ?? {
    bixiaNara: { selected: false },
    realtimeMeter: { selected: false },
    contactMeServices: [],
  };
