import type {
  Address,
  CaseState,
  ContactDraft,
  DateSelection,
  ExtraServicesSelection,
  FacilityHandling,
  Invoice,
  Product,
  ScenarioCustomer,
} from '../types';
import type { Facility } from '../types/company';
import {
  createInitialCompanyState,
  createInitialPrivateState,
  isPrivateFlowStep,
} from './flowState.ts';
import { resolvePrivateNavigation } from '../flow/privateFlow.ts';

export const FLOW_STATE_STORAGE_KEY = 'bixia_flow_state_v9';
export const LEGACY_FLOW_STATE_STORAGE_KEYS = [
  'bixia_flow_state_v8',
  'bixia_flow_state_v7',
] as const;
const VERSION = 9;
type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as RecordValue)
    : {};
const text = (value: unknown): string | null =>
  typeof value === 'string' ? value : null;
const number = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : null;
const choice = <T extends string>(
  value: unknown,
  choices: readonly T[],
): T | null =>
  typeof value === 'string' && choices.includes(value as T)
    ? (value as T)
    : null;
const consent = (value: unknown) => ({
  email: record(value).email === true,
  sms: record(value).sms === true,
});
const region = (value: unknown) =>
  choice(value, ['SE1', 'SE2', 'SE3', 'SE4'] as const);
const timestamp = (value: unknown) =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : null;

const address = (value: unknown): Address | null => {
  const v = record(value);
  if (
    ![v.street, v.number, v.postalCode, v.city].every(
      (x) => typeof x === 'string' && x.trim(),
    )
  )
    return null;
  if (!/^\d{5}$/.test(String(v.postalCode))) return null;
  return {
    street: String(v.street),
    number: String(v.number),
    postalCode: String(v.postalCode),
    city: String(v.city),
    type: choice(v.type, ['LGH', 'VILLA', 'UNKNOWN'] as const) ?? undefined,
    elomrade: region(v.elomrade) ?? undefined,
    apartmentNumber: text(v.apartmentNumber) ?? undefined,
  };
};
const product = (value: unknown): Product | null => {
  const v = record(value),
    terms = record(v.contractTerms);
  const type = choice(v.type, [
    'FAST',
    'RORLIGT',
    'KVARTS',
    'FORVALTAT',
  ] as const);
  if (
    !text(v.id) ||
    !text(v.name) ||
    !type ||
    number(terms.noticeMonths) === null
  )
    return null;
  return {
    id: String(v.id),
    name: String(v.name),
    description: text(v.description) ?? '',
    type,
    contractTerms: {
      bindingMonths: number(terms.bindingMonths),
      noticeMonths: number(terms.noticeMonths)!,
    },
    energyPriceOrePerKwh: number(v.energyPriceOrePerKwh) ?? undefined,
    surchargeOrePerKwh: number(v.surchargeOrePerKwh) ?? undefined,
    fixedFeeSekPerMonth: number(v.fixedFeeSekPerMonth) ?? undefined,
    otherFeeSekPerMonth: number(v.otherFeeSekPerMonth) ?? undefined,
    pricePerKwh: number(v.pricePerKwh) ?? undefined,
    isDiscounted: v.isDiscounted === true,
    discountText: text(v.discountText) ?? undefined,
    isCompanyOnly: v.isCompanyOnly === true,
  };
};
const extras = (value: unknown): ExtraServicesSelection | null => {
  if (!value || typeof value !== 'object') return null;
  const v = record(value),
    nara = record(v.bixiaNara);
  const ids = ['HOME_BATTERY', 'CHARGER', 'SOLAR', 'ATTIC_INSULATION'] as const;
  return {
    bixiaNara: {
      selected: nara.selected === true,
      county: text(nara.county) ?? undefined,
    },
    realtimeMeter: { selected: record(v.realtimeMeter).selected === true },
    contactMeServices: Array.isArray(v.contactMeServices)
      ? [...new Set(v.contactMeServices.flatMap((x) => choice(x, ids) ?? []))]
      : [],
  };
};
const invoice = (value: unknown): Invoice | null => {
  const v = record(value),
    apt = record(v.apartmentDetails);
  const mode = choice(v.mode, ['CUSTOM', 'SAME_AS_RECOMMENDED'] as const);
  return mode
    ? {
        mode,
        address: address(v.address),
        apartmentDetails:
          text(apt.number) !== null
            ? { number: String(apt.number), co: text(apt.co) }
            : null,
      }
    : null;
};
const facility = (value: unknown): FacilityHandling | null => {
  const v = record(value),
    mode = choice(v.mode, [
      'MANUAL',
      'FROM_CRM',
      'FETCH_WITH_POWER_OF_ATTORNEY',
    ] as const);
  return mode ? { mode, facilityId: text(v.facilityId) } : null;
};
const dateDraft = (value: unknown): DateSelection | null => {
  const v = record(value),
    mode = choice(v.mode, ['EARLIEST', 'SPECIFIC'] as const);
  return mode ? { mode, date: text(v.date) ?? '' } : null;
};
const contactDraft = (value: unknown): ContactDraft | null => {
  if (!value || typeof value !== 'object') return null;
  const v = record(value);
  return {
    email: text(v.email) ?? '',
    phone: text(v.phone) ?? '',
    useRecommendedInvoice: v.useRecommendedInvoice === true,
    invoiceQuery: text(v.invoiceQuery) ?? '',
    selectedCustomInvoiceAddress: address(v.selectedCustomInvoiceAddress),
    invoiceApartmentNumber: text(v.invoiceApartmentNumber) ?? '',
    invoiceCoValue: text(v.invoiceCoValue) ?? '',
    isConfirming: v.isConfirming === true,
  };
};
const customer = (value: unknown): ScenarioCustomer => {
  const v = record(value);
  return {
    isExistingCustomer: v.isExistingCustomer === true,
    name: text(v.name),
    email: text(v.email),
    phone: text(v.phone),
    folkbokforing: address(v.folkbokforing),
    facilityId: text(v.facilityId),
    extraServices: extras(v.extraServices),
    contractEndDate: text(v.contractEndDate),
    marketingConsent: consent(v.marketingConsent),
  };
};

export const parsePersistedCaseState = (
  serialized: string,
): CaseState | null => {
  try {
    const parsed = record(JSON.parse(serialized));
    if (
      parsed.version !== undefined &&
      ![7, 8, VERSION].includes(Number(parsed.version))
    )
      return null;
    const v = parsed.version === undefined ? parsed : record(parsed.state);
    if (v.customerType === 'COMPANY') {
      const initial = createInitialCompanyState();
      const facilities: Facility[] = Array.isArray(v.facilities)
        ? v.facilities.flatMap((item) => {
            const f = record(item);
            if (
              ![f.id, f.anlaggningId, f.address, f.zipCode, f.city].every(
                (x) => typeof x === 'string',
              )
            )
              return [];
            return [
              {
                id: String(f.id),
                anlaggningId: String(f.anlaggningId),
                address: String(f.address),
                zipCode: String(f.zipCode),
                city: String(f.city),
                annualConsumption: number(f.annualConsumption) ?? 0,
                elomrade: region(f.elomrade) ?? undefined,
              },
            ];
          })
        : [];
      const signer = record(v.primarySigner),
        secondary = record(v.secondarySigner);
      return {
        ...initial,
        totalConsumption: number(v.totalConsumption) ?? 0,
        facilityCount: Math.min(5, Math.floor(number(v.facilityCount) ?? 0)),
        orgNr: text(v.orgNr),
        companyName: text(v.companyName),
        isCreditApproved: v.isCreditApproved === true,
        signatoryType:
          choice(v.signatoryType, ['SINGLE', 'DUAL', 'UNKNOWN'] as const) ??
          'UNKNOWN',
        primarySigner: text(signer.name)
          ? {
              name: String(signer.name),
              email: text(signer.email) ?? '',
              phone: text(signer.phone) ?? '',
              pnr: '',
            }
          : null,
        secondarySigner: text(secondary.name)
          ? {
              name: String(secondary.name),
              email: text(secondary.email) ?? '',
              phone: text(secondary.phone) ?? '',
            }
          : null,
        facilities,
        selectedProduct: product(v.selectedProduct),
        startDate: text(v.startDate),
        invoiceAddress:
          v.invoiceAddress === 'OTHER' ? 'OTHER' : 'SAME_AS_VISITING',
        invoiceReference: text(v.invoiceReference),
        termsAccepted: v.termsAccepted === true,
        authorityDeclared: v.authorityDeclared === true,
      };
    }
    if (v.customerType !== 'PRIVATE') return null;
    const entryPoint =
      v.entryPoint === 'PRODUCT_FIRST' ? 'PRODUCT_FIRST' : 'ADDRESS_FIRST';
    const initial = createInitialPrivateState({
      entryPoint,
      createCaseId: false,
    });
    const offer = record(v.entryOffer),
      apt = record(v.addressDetails),
      stop = record(v.stop);
    const source = choice(offer.source, ['PRODUCT_PAGE', 'PARTNER'] as const);
    const legacyDate = dateDraft(v.pendingStartDate);
    const state = {
      ...initial,
      caseId: text(v.caseId),
      entryOffer:
        source && text(offer.productId)
          ? { source, productId: String(offer.productId) }
          : null,
      currentStep: isPrivateFlowStep(v.currentStep)
        ? v.currentStep
        : initial.currentStep,
      detailsStep:
        v.detailsStep === 'CONTACT' ? ('CONTACT' as const) : ('DATE' as const),
      dateDraft: dateDraft(v.dateDraft) ?? legacyDate,
      contactDraft: contactDraft(v.contactDraft),
      signedAt: parsed.version === VERSION ? timestamp(v.signedAt) : null,
      extraServicesSelection: extras(v.extraServicesSelection),
      scenario:
        choice(v.scenario, [
          'UNKNOWN',
          'NY',
          'BYTE',
          'FLYTT',
          'EXTRA',
        ] as const) ?? 'UNKNOWN',
      elomrade: region(v.elomrade),
      valdAdress: address(v.valdAdress),
      moveChoice: choice(v.moveChoice, [
        'MOVE_EXISTING',
        'NEW_ON_NEW_ADDRESS',
      ] as const),
      housingType: choice(v.housingType, [
        'KWH_2000',
        'KWH_5000',
        'KWH_20000',
      ] as const),
      compareProfileKwh: number(v.compareProfileKwh) ?? 5000,
      customConsumptionKwh: number(v.customConsumptionKwh),
      facilityHandling: facility(v.facilityHandling),
      invoice: invoice(v.invoice),
      addressDetails: {
        boendeform: choice(apt.boendeform, ['villa', 'lägenhet'] as const),
        apartmentNumber: text(apt.apartmentNumber),
        co: text(apt.co),
      },
      idMethod: choice(v.idMethod, [
        'BANKID_MOBILE',
        'BANKID_QR',
        'MANUAL_PNR',
      ] as const),
      personnummer: null,
      isAuthenticated: v.isAuthenticated === true,
      customer: customer(v.customer),
      selectedProduct: product(v.selectedProduct),
      isPriceConflict: v.isPriceConflict === true,
      startDate: text(v.startDate) ?? legacyDate?.date ?? null,
      startDateMode:
        v.startDateMode === 'SPECIFIC' || v.startDateMode === 'CHOOSE_DATE'
          ? ('SPECIFIC' as const)
          : (legacyDate?.mode ?? ('EARLIEST' as const)),
      marketingConsent: consent(v.marketingConsent),
      riskInfoAccepted: v.riskInfoAccepted === true,
      termsAccepted: v.termsAccepted === true,
      stop: {
        isStopped: stop.isStopped === true,
        reason: choice(stop.reason, [
          'DUPLICATE_SAME_CONTRACT',
          'PENDING_CASE',
          'CANNOT_DELIVER',
        ] as const),
      },
    };
    // A timestamp alone must not turn damaged or incomplete data into a receipt.
    if (
      state.signedAt &&
      resolvePrivateNavigation({ ...state, signedAt: null }, 'SIGNING').step !==
        'SIGNING'
    )
      state.signedAt = null;
    const target = resolvePrivateNavigation(state, state.currentStep);
    return {
      ...state,
      currentStep: target.step,
      detailsStep: target.detailsStep,
    };
  } catch {
    return null;
  }
};

export const serializeCaseState = (state: CaseState): string =>
  JSON.stringify({
    version: VERSION,
    state:
      state.customerType === 'PRIVATE'
        ? { ...state, personnummer: null }
        : {
            ...state,
            primarySigner: state.primarySigner
              ? { ...state.primarySigner, pnr: '' }
              : null,
          },
  });
