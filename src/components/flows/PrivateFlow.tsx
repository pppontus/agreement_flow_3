'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usePrivateNavigation } from '@/hooks/usePrivateNavigation';
import { useMockSettings } from '@/context/MockSettingsContext';
import type {
  Address,
  ExtraServicesSelection,
  FacilityHandling,
  IdMethod,
  Invoice,
  PrivateCaseState,
  PrivateFlowStep,
  Product,
} from '@/types';
import { useFlowState } from '@/context/FlowStateContext';
import { determineScenario } from '@/services/scenarioService';
import { useDevPanel } from '@/context/DevPanelContext';
import { saveExtraServicesSelection } from '@/services/extraServicesService';
import { DEMO_ORDER_ID } from '@/services/mockData';
import { PrivateFlowSteps } from '@/components/flows/PrivateFlowSteps';
import {
  buildExtraServicesSelection,
  getExtraOfferEligibility,
  getInvoiceAddressContext,
  getPrivateBackTarget,
} from '@/flow/privateFlow';

export const PrivateFlow = () => {
  const { state, isInitialized } = useFlowState();
  if (!isInitialized || state.customerType !== 'PRIVATE') return null;
  return <PrivateFlowController state={state} />;
};

const PrivateFlowController = ({ state }: { state: PrivateCaseState }) => {
  const router = useRouter();
  const pathname = usePathname();

  const {
    selectProduct,
    setAddress,
    setAuthenticated,
    setCustomerScenario,
    setMoveChoice,
    setCompareProfile,
    setFacilityHandling,
    setInvoice,
    setCustomerDetails,
    setElomrade,
    setConsents,
    navigatePrivate,
    setPrivateDetailsStep,
    setDateDraft,
    setContactDraft,
    confirmDate,
    completeSigning,
    clearPersistedState,
    setPrivateStop,
    setExtraServicesSelection,
    resetState,
  } = useFlowState();
  const { setCurrentPhase } = useDevPanel();
  const { state: devState } = useMockSettings();
  const currentStep = state.currentStep;
  const selectedProduct = state.selectedProduct;
  const isGenericProductSelected = selectedProduct?.id === 'GENERIC';
  const eligibility = getExtraOfferEligibility(state);
  const {
    shouldOfferBixiaNara,
    shouldOfferRealtimeMeter,
    shouldOfferAnyContactExtras,
  } = eligibility;
  const shouldShowContactExtrasStep = shouldOfferAnyContactExtras;
  const hasFacilityFromCrm =
    state.facilityHandling?.mode === 'FROM_CRM' &&
    !!state.facilityHandling.facilityId;
  const { recommendedInvoiceAddress, suggestedCustomInvoiceAddress } =
    getInvoiceAddressContext(state);
  const extraServicesSelection = state.extraServicesSelection;

  const [requireBankIdVerification, setRequireBankIdVerification] =
    useState(false);
  const requestId = useRef(0);
  useEffect(
    () => () => {
      requestId.current += 1;
    },
    [],
  );
  const goToStep = useCallback(
    (step: PrivateFlowStep) => navigatePrivate(step),
    [navigatePrivate],
  );
  usePrivateNavigation(state, navigatePrivate);

  // Sync current step to DevPanel
  useEffect(() => {
    setCurrentPhase(currentStep);
  }, [currentStep, setCurrentPhase]);

  const handleProductSelect = (
    product: Product,
    region: NonNullable<PrivateCaseState['elomrade']>,
  ) => {
    setElomrade(region);
    selectProduct(product);
    goToStep(state.valdAdress ? 'IDENTIFY' : 'ADDRESS_SEARCH');
  };

  const handleClarifiedProductSelect = (product: Product) => {
    selectProduct(product);
    if (!state.isAuthenticated) {
      goToStep('IDENTIFY');
      return;
    }
    if (!state.startDate) {
      setPrivateDetailsStep('DATE');
      goToStep('DETAILS');
      return;
    }
    goToStep('TERMS');
  };

  const handleAddressConfirm = (
    address: Address,
    apartmentDetails?: { number: string; co?: string },
  ) => {
    setAddress(
      address,
      apartmentDetails
        ? { number: apartmentDetails.number, co: apartmentDetails.co || null }
        : undefined,
    );
    setPrivateStop(null);
    if (!selectedProduct) {
      goToStep('PRODUCT_SELECT');
      return;
    }
    if (isGenericProductSelected) {
      goToStep('PRODUCT_CLARIFY');
      return;
    }
    goToStep('IDENTIFY');
  };

  const handleAuthenticated = async (pnr: string, method: IdMethod) => {
    const id = ++requestId.current;
    if (!state.valdAdress) return;
    const response = await determineScenario(
      pnr,
      state.valdAdress,
      devState.mockScenario,
      devState.mockMarketingConsent,
      devState.mockExistingExtras,
    );
    if (id !== requestId.current) return;
    if (response.customer.isExistingCustomer && method === 'MANUAL_PNR') {
      setRequireBankIdVerification(true);
      return;
    }
    setRequireBankIdVerification(false);
    setAuthenticated(pnr, method);
    setCustomerScenario(response.scenario, response.customer);
    if (response.stopReason) {
      setPrivateStop(response.stopReason);
      goToStep('FLOW_STOP');
      return;
    }
    setFacilityHandling(
      response.scenario === 'BYTE' &&
        response.customer.isExistingCustomer &&
        response.customer.facilityId
        ? { mode: 'FROM_CRM', facilityId: response.customer.facilityId }
        : null,
    );
    if (response.scenario === 'FLYTT') goToStep('MOVE_OFFER');
    else if (response.scenario === 'EXTRA')
      goToStep('EXISTING_CONTRACT_EXTRAS');
    else navigatePrivate('DETAILS', 'DATE');
  };

  const handleMoveExistingChoice = () => {
    setMoveChoice('MOVE_EXISTING');
    setPrivateDetailsStep('DATE');
    goToStep('DETAILS');
  };

  const handleNewOnNewAddressChoice = () => {
    setMoveChoice('NEW_ON_NEW_ADDRESS');
    setPrivateDetailsStep('DATE');
    goToStep('DETAILS');
  };

  const handleDateSelect = (date: string, mode: 'EARLIEST' | 'SPECIFIC') => {
    confirmDate({ date, mode });
  };

  const handleContactConfirm = (contact: {
    email: string;
    phone: string;
    invoice: Invoice | null;
  }) => {
    if (!state.startDate) {
      navigatePrivate('DETAILS', 'DATE');
      return;
    }
    setCustomerDetails({
      startDate: state.startDate,
      startDateMode: state.startDateMode,
      email: contact.email,
      phone: contact.phone,
    });
    setInvoice(contact.invoice);
    goToStep('TERMS');
  };

  const handleTermsConfirm = (consents: {
    termsAccepted: boolean;
    riskAccepted: boolean;
    marketing: { email: boolean; sms: boolean };
    facilityHandling?: FacilityHandling;
  }) => {
    if (isGenericProductSelected) {
      goToStep('PRODUCT_CLARIFY');
      return;
    }

    if (consents.facilityHandling !== undefined)
      setFacilityHandling(consents.facilityHandling);
    setConsents({
      terms: consents.termsAccepted,
      risk: consents.riskAccepted,
      marketing: consents.marketing,
    });

    goToStep('SIGNING');
  };

  const handleSigned = () => {
    if (isGenericProductSelected) {
      goToStep('PRODUCT_CLARIFY');
      return;
    }
    completeSigning();
  };

  const startExtrasSelectionFlow = () => {
    if (shouldOfferBixiaNara) {
      goToStep('EXTRA_BIXIA_NARA');
      return;
    }
    if (shouldOfferRealtimeMeter) {
      goToStep('EXTRA_REALTIME_METER');
      return;
    }
    goToStep('APP_DOWNLOAD');
  };

  const handleConfirmationContinue = () => {
    startExtrasSelectionFlow();
  };

  const handleBixiaNaraConfirm = (bixiaNara: {
    selected: boolean;
    county?: string;
  }) => {
    const base = buildExtraServicesSelection(extraServicesSelection);
    setExtraServicesSelection({
      ...base,
      bixiaNara: {
        selected: bixiaNara.selected,
        county: bixiaNara.selected ? bixiaNara.county : undefined,
      },
    });
    if (shouldOfferRealtimeMeter) {
      goToStep('EXTRA_REALTIME_METER');
    } else {
      goToStep('APP_DOWNLOAD');
    }
  };

  const handleRealtimeMeterConfirm = (selected: boolean) => {
    const base = buildExtraServicesSelection(extraServicesSelection);
    setExtraServicesSelection({
      ...base,
      realtimeMeter: { selected },
    });
    goToStep('APP_DOWNLOAD');
  };

  const handleAppContinue = () => {
    if (shouldShowContactExtrasStep) {
      goToStep('EXTRA_CONTACT');
      return;
    }
    handleExtrasDone();
  };

  const handleContactMeSubmit = async (
    contactMeServices: ExtraServicesSelection['contactMeServices'],
  ) => {
    const finalSelection: ExtraServicesSelection = {
      ...buildExtraServicesSelection(extraServicesSelection),
      contactMeServices,
    };

    await saveExtraServicesSelection(DEMO_ORDER_ID, finalSelection);
    setExtraServicesSelection(finalSelection);
  };

  const handleExtrasDone = () => {
    handleConfirmationReset();
  };

  const handleConfirmationReset = () => {
    requestId.current += 1;
    clearPersistedState();
    setExtraServicesSelection(null);
    setPrivateStop(null);
    resetState();
    window.history.replaceState(null, '', pathname);
    router.replace(pathname);
  };

  const handleBack = () => {
    requestId.current += 1;
    const target = getPrivateBackTarget(state, eligibility);
    if (!target) return;
    navigatePrivate(
      'step' in target ? target.step : state.currentStep,
      target.detailsStep,
    );
  };

  return (
    <PrivateFlowSteps
      state={state}
      eligibility={eligibility}
      requireBankIdVerification={requireBankIdVerification}
      hasFacilityFromCrm={hasFacilityFromCrm}
      recommendedInvoiceAddress={recommendedInvoiceAddress}
      suggestedCustomInvoiceAddress={suggestedCustomInvoiceAddress}
      actions={{
        selectProduct: handleProductSelect,
        clarifyProduct: handleClarifiedProductSelect,
        changeCompareProfile: setCompareProfile,
        confirmAddress: handleAddressConfirm,
        authenticate: handleAuthenticated,
        goBack: handleBack,
        navigate: goToStep,
        restart: handleConfirmationReset,
        startExtras: startExtrasSelectionFlow,
        selectDate: handleDateSelect,
        changeDateDraft: setDateDraft,
        changeContactDraft: setContactDraft,
        cancelIdentification: () => {
          requestId.current += 1;
        },
        confirmContact: handleContactConfirm,
        moveExisting: handleMoveExistingChoice,
        addNewAddress: handleNewOnNewAddressChoice,
        confirmTerms: handleTermsConfirm,
        signed: handleSigned,
        confirmationContinue: handleConfirmationContinue,
        confirmBixiaNara: handleBixiaNaraConfirm,
        confirmRealtimeMeter: handleRealtimeMeterConfirm,
        appContinue: handleAppContinue,
        submitContactServices: handleContactMeSubmit,
        extrasDone: handleExtrasDone,
      }}
    />
  );
};
