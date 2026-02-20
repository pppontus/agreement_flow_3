"use client";

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ProductSelection } from "@/components/flow/ProductSelection";
import { AddressSearch } from "@/components/flow/AddressSearch";
import { Identification } from "@/components/flow/Identification";
import { MoveOffer } from "@/components/flow/MoveOffer";
import { StartDatePicker } from "@/components/flow/StartDatePicker";
import { ContactForm } from "@/components/flow/ContactForm";
import { TermsConsent } from "@/components/flow/TermsConsent";
import { SigningFlow } from "@/components/flow/SigningFlow";
import { Confirmation } from "@/components/flow/Confirmation";
import { ExtraOfferBixiaNara } from "@/components/flow/ExtraOfferBixiaNara";
import { ExtraOfferRealtimeMeter } from "@/components/flow/ExtraOfferRealtimeMeter";
import { ExtraOfferContactMe } from "@/components/flow/ExtraOfferContactMe";
import { AppDownloadPrompt } from "@/components/flow/AppDownloadPrompt";
import { Address, FacilityHandling, Product, IdMethod, PrivateCaseState, Invoice } from "@/types";
import { useFlowState } from '@/hooks/useFlowState';
import { determineScenario, ScenarioResponse } from '@/services/scenarioService';
import { detectRegion } from '@/services/regionService';
import { useDevPanel } from '@/context/DevPanelContext';
import { PriceConflictResolver } from '@/components/flow/PriceConflictResolver';
import { CONTACT_ME_SERVICE_IDS, ExtraServicesSelection, saveExtraServicesSelection } from '@/services/extraServicesService';

type FlowStep = 
  | 'PRODUCT_SELECT'
  | 'ADDRESS_SEARCH'
  | 'IDENTIFY'
  | 'MOVE_OFFER'
  | 'DETAILS'
  | 'TERMS'
  | 'SIGNING'
  | 'CONFIRMATION'
  | 'EXTRA_BIXIA_NARA'
  | 'EXTRA_REALTIME_METER'
  | 'APP_DOWNLOAD'
  | 'EXTRA_CONTACT';

const FLOW_STEPS: FlowStep[] = [
  'PRODUCT_SELECT',
  'ADDRESS_SEARCH',
  'IDENTIFY',
  'MOVE_OFFER',
  'DETAILS',
  'TERMS',
  'SIGNING',
  'CONFIRMATION',
  'EXTRA_BIXIA_NARA',
  'EXTRA_REALTIME_METER',
  'APP_DOWNLOAD',
  'EXTRA_CONTACT',
];

const isValidFlowStep = (step: string | null): step is FlowStep => {
  if (!step) return false;
  return FLOW_STEPS.includes(step as FlowStep);
};

const isSameAddress = (a: Address | null | undefined, b: Address | null | undefined) => {
  if (!a || !b) return false;
  return a.street === b.street &&
    a.number === b.number &&
    a.postalCode === b.postalCode &&
    a.city === b.city;
};

export const PrivateFlow = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get('step');
  const normalizedStepParam = stepParam === 'RISK_INFO' ? 'TERMS' : stepParam;
  const currentStep: FlowStep = isValidFlowStep(normalizedStepParam) ? normalizedStepParam : 'PRODUCT_SELECT';
  
  const { state: rawState, isInitialized, selectProduct, setAddress, setAuthenticated, setCustomerScenario, setMoveChoice, setFacilityHandling, setInvoice, setCustomerDetails, setElomrade, setConsents, resetState } = useFlowState();
  const { state: devState, setCurrentPhase } = useDevPanel();
  const isPrivateFlow = rawState.customerType === 'PRIVATE';
  const state = rawState as PrivateCaseState;
  const selectedProduct = isPrivateFlow ? rawState.selectedProduct : null;
  const scenario = isPrivateFlow ? rawState.scenario : 'UNKNOWN';
  const selectedAddress = isPrivateFlow ? rawState.valdAdress : null;
  const folkbokforingAddress = isPrivateFlow ? rawState.customer.folkbokforing : null;
  const elomrade = isPrivateFlow ? rawState.elomrade : null;
  const existingExtraServices = state.customer.extraServices;
  const isAdditionalAddressFlow =
    state.customer.isExistingCustomer &&
    state.moveChoice === 'NEW_ON_NEW_ADDRESS';
  // Existing extras from CRM are tied to the current agreement/address.
  // For a new additional address we should offer extras again.
  const alreadyHasBixiaNara = isAdditionalAddressFlow
    ? false
    : !!existingExtraServices?.bixiaNara.selected;
  const alreadyHasRealtimeMeter = isAdditionalAddressFlow
    ? false
    : !!existingExtraServices?.realtimeMeter.selected;
  const alreadyHasContactServices = new Set(
    isAdditionalAddressFlow ? [] : (existingExtraServices?.contactMeServices ?? [])
  );
  const shouldOfferBixiaNara = state.customer.isExistingCustomer && !alreadyHasBixiaNara;
  const shouldOfferRealtimeMeter = state.customer.isExistingCustomer && !alreadyHasRealtimeMeter;
  const shouldOfferAnyDirectExtras = shouldOfferBixiaNara || shouldOfferRealtimeMeter;
  const contactServicesToOffer = CONTACT_ME_SERVICE_IDS.filter(
    (serviceId) => !alreadyHasContactServices.has(serviceId)
  );
  const shouldOfferAnyContactExtras = state.customer.isExistingCustomer && contactServicesToOffer.length > 0;
  const shouldShowContactExtrasStep = shouldOfferAnyDirectExtras || shouldOfferAnyContactExtras;
  const hasFacilityFromCrm =
    isPrivateFlow &&
    state.facilityHandling?.mode === 'FROM_CRM' &&
    !!state.facilityHandling.facilityId;
  const recommendedInvoiceAddress =
    state.moveChoice === 'NEW_ON_NEW_ADDRESS'
      ? (state.customer.folkbokforing || state.valdAdress)
      : (state.valdAdress || state.customer.folkbokforing);
  const suggestedCustomInvoiceAddress =
    state.moveChoice === 'NEW_ON_NEW_ADDRESS' &&
    state.valdAdress &&
    !isSameAddress(state.customer.folkbokforing, state.valdAdress)
      ? state.valdAdress
      : null;

  // Local state for the DETAILS step to manage substeps (Date -> Contact)
  const [detailsSubStep, setDetailsSubStep] = useState<'DATE' | 'CONTACT'>('DATE');
  const [tempDateData, setTempDateData] = useState<{date: string, mode: 'EARLIEST' | 'SPECIFIC'} | null>(null);

  // Security: Track when BankID-only verification is required
  const [requireBankIdVerification, setRequireBankIdVerification] = useState(false);
  const [pendingScenarioResponse, setPendingScenarioResponse] = useState<ScenarioResponse | null>(null);
  const [extraServicesSelection, setExtraServicesSelection] = useState<ExtraServicesSelection | null>(null);

  // Navigation helper
  const goToStep = useCallback((step: FlowStep) => {
    const params = new URLSearchParams(searchParams);
    params.set('step', step);
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  // Hydration check: If at a later step but missing state, redirect to start
  useEffect(() => {
    if (!isPrivateFlow) return;

    if (isInitialized) {
      // Backward compatibility: old links to RISK_INFO now map to TERMS.
      if (stepParam === 'RISK_INFO') {
        goToStep('TERMS');
        return;
      }

      if (stepParam && !isValidFlowStep(stepParam)) {
        console.log(`Invalid step "${stepParam}", restarting flow`);
        goToStep('PRODUCT_SELECT');
        return;
      }

      if (currentStep !== 'PRODUCT_SELECT' && !selectedProduct) {
        console.log('Missing flow state, restarting flow');
        goToStep('PRODUCT_SELECT');
      }

      if (
        currentStep === 'MOVE_OFFER' &&
        (scenario !== 'FLYTT' || !selectedAddress || !folkbokforingAddress)
      ) {
        console.log('Missing move offer state, returning to identify');
        goToStep('IDENTIFY');
      }
    }
  }, [
    isPrivateFlow,
    isInitialized,
    currentStep,
    selectedProduct,
    scenario,
    selectedAddress,
    folkbokforingAddress,
    stepParam,
    goToStep,
  ]);

  // Guard extra-service steps so users only see eligible offers.
  useEffect(() => {
    if (!isPrivateFlow || !isInitialized) return;

    if (currentStep === 'EXTRA_BIXIA_NARA' && !shouldOfferBixiaNara) {
      if (shouldOfferRealtimeMeter) {
        goToStep('EXTRA_REALTIME_METER');
      } else {
        goToStep('APP_DOWNLOAD');
      }
      return;
    }

    if (currentStep === 'EXTRA_REALTIME_METER' && !shouldOfferRealtimeMeter) {
      goToStep('APP_DOWNLOAD');
      return;
    }

    if (currentStep === 'EXTRA_CONTACT' && !shouldShowContactExtrasStep) {
      goToStep('APP_DOWNLOAD');
    }
  }, [
    currentStep,
    isInitialized,
    isPrivateFlow,
    shouldOfferBixiaNara,
    shouldOfferRealtimeMeter,
    shouldShowContactExtrasStep,
    goToStep,
  ]);

  // Sync current step to DevPanel
  useEffect(() => {
    setCurrentPhase(currentStep);
  }, [currentStep, setCurrentPhase]);

  // Detect region on initial load
  useEffect(() => {
    if (isPrivateFlow && isInitialized && !elomrade) {
      detectRegion().then(response => {
        setElomrade(response.elomrade);
      }).catch(err => {
        console.error('Failed to detect region:', err);
      });
    }
  }, [isPrivateFlow, isInitialized, elomrade, setElomrade]);

  const handleProductSelect = (product: Product) => {
    selectProduct(product);
    goToStep('ADDRESS_SEARCH');
  };

  const handleAddressConfirm = (address: Address, apartmentDetails?: { number: string, co?: string }) => {
    setAddress(address, apartmentDetails ? { number: apartmentDetails.number, co: apartmentDetails.co || null } : undefined);
    goToStep('IDENTIFY');
  };

  const handleAuthenticated = async (pnr: string, method: IdMethod) => {
    setAuthenticated(pnr, method);
    
    if (state.valdAdress) {
      try {
        const mockOverride = devState.isOpen ? devState.mockScenario : undefined;
        const mockMarketingConsent = devState.isOpen ? devState.mockMarketingConsent : undefined;
        const mockExistingExtras = devState.isOpen ? devState.mockExistingExtras : undefined;
        const scenarioResponse = await determineScenario(
          pnr,
          state.valdAdress,
          mockOverride,
          mockMarketingConsent,
          mockExistingExtras
        );
        
        if (scenarioResponse.customer.isExistingCustomer && method === 'MANUAL_PNR') {
          setPendingScenarioResponse(scenarioResponse);
          setRequireBankIdVerification(true);
          return;
        }

        const finalResponse = pendingScenarioResponse || scenarioResponse;
        setRequireBankIdVerification(false);
        setPendingScenarioResponse(null);

        setCustomerScenario(finalResponse.scenario, finalResponse.customer);
        if (
          finalResponse.scenario === 'BYTE' &&
          finalResponse.customer.isExistingCustomer &&
          finalResponse.customer.facilityId
        ) {
          setFacilityHandling({
            mode: 'FROM_CRM',
            facilityId: finalResponse.customer.facilityId,
          });
        } else {
          setFacilityHandling(null);
        }

        if (finalResponse.scenario === 'FLYTT' && finalResponse.currentContractAddress) {
          goToStep('MOVE_OFFER');
        } else {
          setDetailsSubStep('DATE');
          setTempDateData(null);
          goToStep('DETAILS');
        }
      } catch (error) {
        console.error('Error determining scenario:', error);
      }
    }
  };

  const handleMoveExistingChoice = () => {
    setMoveChoice('MOVE_EXISTING');
    setDetailsSubStep('DATE');
    setTempDateData(null);
    goToStep('DETAILS');
  };

  const handleNewOnNewAddressChoice = () => {
    setMoveChoice('NEW_ON_NEW_ADDRESS');
    setDetailsSubStep('DATE');
    setTempDateData(null);
    goToStep('DETAILS');
  };

  const handleDateSelect = (date: string, mode: 'EARLIEST' | 'SPECIFIC') => {
    setTempDateData({ date, mode });
    setDetailsSubStep('CONTACT');
  };

  const handleContactConfirm = (contact: {
    email: string;
    phone: string;
    invoice: Invoice | null;
  }) => {
    if (tempDateData) {
      setCustomerDetails({
        startDate: tempDateData.date,
        startDateMode: tempDateData.mode,
        email: contact.email,
        phone: contact.phone
      });
      setInvoice(contact.invoice);
      goToStep('TERMS');
    }
  };

  const handleTermsConfirm = (consents: {
    termsAccepted: boolean;
    riskAccepted: boolean;
    marketing: { email: boolean; sms: boolean };
    facilityHandling?: FacilityHandling;
  }) => {
    setConsents({ 
      terms: consents.termsAccepted, 
      risk: consents.riskAccepted,
      marketing: consents.marketing 
    });
    if (consents.facilityHandling !== undefined) {
      setFacilityHandling(consents.facilityHandling);
    }

    goToStep('SIGNING');
  };

  const handleSigned = () => {
    goToStep('CONFIRMATION');
  };

  const buildSelectionWithDefaults = (selection: ExtraServicesSelection | null): ExtraServicesSelection => {
    return selection ?? {
      bixiaNara: { selected: false },
      realtimeMeter: { selected: false },
      contactMeServices: [],
    };
  };

  const handleConfirmationContinue = () => {
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

  const handleBixiaNaraConfirm = (bixiaNara: { selected: boolean; county?: string }) => {
    setExtraServicesSelection(prev => {
      const base = buildSelectionWithDefaults(prev);
      return {
        ...base,
        bixiaNara: {
          selected: bixiaNara.selected,
          county: bixiaNara.selected ? bixiaNara.county : undefined,
        },
      };
    });
    if (shouldOfferRealtimeMeter) {
      goToStep('EXTRA_REALTIME_METER');
    } else {
      goToStep('APP_DOWNLOAD');
    }
  };

  const handleRealtimeMeterConfirm = (selected: boolean) => {
    setExtraServicesSelection(prev => {
      const base = buildSelectionWithDefaults(prev);
      return {
        ...base,
        realtimeMeter: { selected },
      };
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

  const handleContactMeSubmit = async (contactMeServices: ExtraServicesSelection['contactMeServices']) => {
    const finalSelection: ExtraServicesSelection = {
      ...buildSelectionWithDefaults(extraServicesSelection),
      contactMeServices,
    };

    await saveExtraServicesSelection('ORD-123456', finalSelection);
    setExtraServicesSelection(finalSelection);
  };

  const handleExtrasDone = () => {
    handleConfirmationReset();
  };

  const handleConfirmationReset = () => {
    setExtraServicesSelection(null);
    resetState();
    router.push(pathname);
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'ADDRESS_SEARCH':
        goToStep('PRODUCT_SELECT');
        break;
      case 'IDENTIFY':
        goToStep('ADDRESS_SEARCH');
        break;
      case 'MOVE_OFFER':
        goToStep('IDENTIFY');
        break;
      case 'DETAILS':
        if (detailsSubStep === 'CONTACT') {
          setDetailsSubStep('DATE');
        } else {
          if (state.scenario === 'FLYTT' && state.customer.folkbokforing && state.valdAdress) {
            goToStep('MOVE_OFFER');
          } else {
            goToStep('IDENTIFY');
          }
        }
        break;
      case 'TERMS':
        setDetailsSubStep('CONTACT');
        goToStep('DETAILS');
        break;
      case 'SIGNING':
        goToStep('TERMS');
        break;
      case 'CONFIRMATION':
        // Confirmation is a completion checkpoint and should not back-navigate.
        break;
      case 'EXTRA_BIXIA_NARA':
        goToStep('CONFIRMATION');
        break;
      case 'EXTRA_REALTIME_METER':
        if (shouldOfferBixiaNara) {
          goToStep('EXTRA_BIXIA_NARA');
        } else {
          goToStep('CONFIRMATION');
        }
        break;
      case 'APP_DOWNLOAD':
        if (shouldOfferRealtimeMeter) {
          goToStep('EXTRA_REALTIME_METER');
        } else if (shouldOfferBixiaNara) {
          goToStep('EXTRA_BIXIA_NARA');
        } else {
          goToStep('CONFIRMATION');
        }
        break;
      case 'EXTRA_CONTACT':
        goToStep('APP_DOWNLOAD');
        break;
      default:
        console.warn('Unknown step for back navigation');
    }
  };

  if (!isPrivateFlow || !isInitialized) return null;

  return (
    <>
      {currentStep === 'PRODUCT_SELECT' && (
        <ProductSelection onProductSelect={handleProductSelect} />
      )}

      {currentStep === 'ADDRESS_SEARCH' && (
        <AddressSearch 
          onConfirmAddress={handleAddressConfirm}
          onBack={handleBack}
          suggestedAddress={state.customer.folkbokforing}
        />
      )}

      {currentStep === 'IDENTIFY' && (
        state.isPriceConflict ? (
          <PriceConflictResolver />
        ) : (
          <Identification 
            onAuthenticated={handleAuthenticated}
            onBack={handleBack}
            bankIdOnly={requireBankIdVerification}
            securityMessage={requireBankIdVerification 
              ? 'Du är redan kund hos oss! För din säkerhet behöver du verifiera dig med BankID.' 
              : undefined
            }
          />
        )
      )}

      {currentStep === 'DETAILS' && detailsSubStep === 'DATE' && (
        <StartDatePicker 
          onSelectDate={handleDateSelect}
          onBack={handleBack}
          address={state.valdAdress || undefined}
          isSwitching={state.scenario === 'BYTE'}
          moveChoice={state.moveChoice}
          productName={state.selectedProduct?.name}
          isExistingCustomer={state.customer.isExistingCustomer}
          bindingEndDate={state.customer.contractEndDate || undefined}
        />
      )}

      {currentStep === 'DETAILS' && detailsSubStep === 'CONTACT' && (
        <ContactForm 
          initialData={state.customer}
          initialInvoice={state.invoice}
          recommendedInvoiceAddress={recommendedInvoiceAddress}
          suggestedCustomInvoiceAddress={suggestedCustomInvoiceAddress}
          onConfirm={handleContactConfirm}
          onBack={handleBack}
        />
      )}

      {currentStep === 'MOVE_OFFER' && state.customer.folkbokforing && state.valdAdress && (
        <MoveOffer 
          currentAddress={state.customer.folkbokforing}
          newAddress={state.valdAdress}
          selectedChoice={state.moveChoice}
          onMove={handleMoveExistingChoice}
          onNew={handleNewOnNewAddressChoice}
          onBack={handleBack}
        />
      )}

      {currentStep === 'TERMS' && (
        <TermsConsent 
          onConfirm={handleTermsConfirm}
          onBack={handleBack}
          requiresFacilityId={!hasFacilityFromCrm}
          productType={state.selectedProduct?.type}
          initialRiskAccepted={state.riskInfoAccepted}
          existingMarketingConsent={state.customer.marketingConsent}
          initialMarketingConsent={state.marketingConsent}
          initialFacilityHandling={state.facilityHandling}
        />
      )}

      {currentStep === 'SIGNING' && (
        <SigningFlow 
          onSigned={handleSigned}
          onCancel={handleBack}
        />
      )}

      {currentStep === 'CONFIRMATION' && (
        <Confirmation 
          orderId="ORD-123456"
          product={state.selectedProduct || undefined}
          address={state.valdAdress || undefined}
          email={state.customer.email || undefined}
          invoice={state.invoice || undefined}
          facilityHandling={state.facilityHandling || undefined}
          canSelectExtraServices={shouldOfferAnyDirectExtras}
          onContinue={handleConfirmationContinue}
        />
      )}

      {currentStep === 'EXTRA_BIXIA_NARA' && shouldOfferBixiaNara && (
        <ExtraOfferBixiaNara
          address={state.valdAdress || undefined}
          initialSelected={extraServicesSelection?.bixiaNara.selected ?? false}
          initialCounty={extraServicesSelection?.bixiaNara.county}
          onConfirm={handleBixiaNaraConfirm}
          onBack={handleBack}
        />
      )}

      {currentStep === 'EXTRA_REALTIME_METER' && shouldOfferRealtimeMeter && (
        <ExtraOfferRealtimeMeter
          initialSelected={extraServicesSelection?.realtimeMeter.selected ?? false}
          onConfirm={handleRealtimeMeterConfirm}
          onBack={handleBack}
        />
      )}

      {currentStep === 'APP_DOWNLOAD' && (
        <AppDownloadPrompt
          selection={extraServicesSelection}
          hasFinalExtrasStep={shouldShowContactExtrasStep}
          onContinue={handleAppContinue}
          onBack={handleBack}
        />
      )}

      {currentStep === 'EXTRA_CONTACT' && shouldShowContactExtrasStep && (
        <ExtraOfferContactMe
          initialSelection={extraServicesSelection}
          availableServiceIds={contactServicesToOffer}
          phone={state.customer.phone || undefined}
          onSubmit={handleContactMeSubmit}
          onDone={handleExtrasDone}
          onBack={handleBack}
        />
      )}
    </>
  );
};
