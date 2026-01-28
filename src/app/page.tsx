"use client";

import { useEffect, Suspense, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ProductSelection } from "@/components/flow/ProductSelection";
import { AddressSearch } from "@/components/flow/AddressSearch";
import { Identification } from "@/components/flow/Identification";
import { MoveOffer } from "@/components/flow/MoveOffer";
import { StartDatePicker } from "@/components/flow/StartDatePicker";
import { ContactForm } from "@/components/flow/ContactForm";
import { TermsConsent } from "@/components/flow/TermsConsent";
import { RiskInfo } from "@/components/flow/RiskInfo";
import { SigningFlow } from "@/components/flow/SigningFlow";
import { Confirmation } from "@/components/flow/Confirmation";
import { Address, Product, IdMethod } from "@/types";
import { useFlowState } from '@/hooks/useFlowState';
import { determineScenario } from '@/services/scenarioService';
import { detectRegion } from '@/services/regionService';
import { useDevPanel } from '@/context/DevPanelContext';
import { PriceConflictResolver } from '@/components/flow/PriceConflictResolver';
import styles from "./page.module.css";

type FlowStep = 
  | 'PRODUCT_SELECT'
  | 'ADDRESS_SEARCH'
  | 'IDENTIFY'
  | 'MOVE_OFFER'
  | 'DETAILS'
  | 'TERMS'
  | 'RISK_INFO'
  | 'SIGNING'
  | 'CONFIRMATION';

// Internal component to use useSearchParams (requires Suspense boundary or to be in a client page)
const FlowContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStep = (searchParams.get('step') as FlowStep) || 'PRODUCT_SELECT';
  
  const { state, isInitialized, selectProduct, setAddress, setAuthenticated, setCustomerScenario, setCustomerDetails, setElomrade, setConsents, resetState } = useFlowState();
  const { state: devState, setCurrentPhase } = useDevPanel();

  // Local state for move offer dialog and multi-step interactions
  // Local state for move offer
  const [moveOfferData, setMoveOfferData] = useState<{ currentContractAddress: Address } | null>(null);
  
  // Local state for the DETAILS step to manage substeps (Date -> Contact)
  const [detailsSubStep, setDetailsSubStep] = useState<'DATE' | 'CONTACT'>('DATE');
  const [tempDateData, setTempDateData] = useState<{date: string, mode: 'EARLIEST' | 'SPECIFIC'} | null>(null);

  // Security: Track when BankID-only verification is required
  const [requireBankIdVerification, setRequireBankIdVerification] = useState(false);
  const [pendingScenarioResponse, setPendingScenarioResponse] = useState<any>(null);

  // Navigation helper
  const goToStep = (step: FlowStep) => {
    const params = new URLSearchParams(searchParams);
    params.set('step', step);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Hydration check: If at a later step but missing state, redirect to start
  useEffect(() => {
    if (isInitialized) {
      if (currentStep !== 'PRODUCT_SELECT' && !state.selectedProduct) {
        // If we are deep in the flow but have no product, we must restart
        // unless it's a dev hot-reload, but for user safety -> restart
        console.log('Missing flow state, restarting flow');
        goToStep('PRODUCT_SELECT');
      }
    }
  }, [isInitialized, currentStep, state.selectedProduct]);

  // Sync current step to DevPanel for context-aware mock options
  useEffect(() => {
    setCurrentPhase(currentStep);
  }, [currentStep, setCurrentPhase]);

  // Detect region on initial load (if not already set)
  useEffect(() => {
    if (isInitialized && !state.elomrade) {
      detectRegion().then(response => {
        setElomrade(response.elomrade);
        console.log('Region detected:', response);
      }).catch(err => {
        console.error('Failed to detect region:', err);
      });
    }
  }, [isInitialized, state.elomrade, setElomrade]);

  const handleProductSelect = (product: Product) => {
    selectProduct(product);
    
    if (state.valdAdress) {
      // If we already have an address (e.g., coming from GENERIC flow), go to IDENTIFY
      goToStep('IDENTIFY');
    } else {
      // Normal flow: Choose product, then address
      goToStep('ADDRESS_SEARCH');
    }
  };

  const handleAddressConfirm = (address: Address, apartmentDetails?: { number: string, co?: string }) => {
    setAddress(address, apartmentDetails ? { number: apartmentDetails.number, co: apartmentDetails.co || null } : undefined);
    
    if (state.selectedProduct?.id === 'GENERIC') {
      // If user chose "Teckna elavtal" (unspecified), show product selection now
      goToStep('PRODUCT_SELECT');
    } else {
      // Normal flow: Go to IDENTIFY
      goToStep('IDENTIFY');
    }
  };

  const handleAuthenticated = async (pnr: string, method: IdMethod) => {
    setAuthenticated(pnr, method);
    
    // Simulate fetching scenario data
    if (state.valdAdress) {
      try {
        // Pass mock scenario override if DevPanel is open
        const mockOverride = devState.isOpen ? devState.mockScenario : undefined;
        const scenarioResponse = await determineScenario(pnr, state.valdAdress, mockOverride);
        
        // API call is now automatically logged by scenarioService via apiClient
        console.log('Scenario detected:', scenarioResponse);

        // SECURITY CHECK: If existing customer used manual PNR, require BankID verification
        // This prevents someone from looking up customer data by guessing personnummer
        if (scenarioResponse.customer.isExistingCustomer && method === 'MANUAL_PNR') {
          // Store the response and require BankID verification
          setPendingScenarioResponse(scenarioResponse);
          setRequireBankIdVerification(true);
          // Stay on IDENTIFY step - component will now show BankID-only mode
          return;
        }

        // If we had a pending scenario (user completed BankID after manual PNR), use it
        const finalResponse = pendingScenarioResponse || scenarioResponse;
        setRequireBankIdVerification(false);
        setPendingScenarioResponse(null);

        // Safe to proceed - either new customer OR verified with BankID
        setCustomerScenario(finalResponse.scenario, finalResponse.customer);

        if (finalResponse.scenario === 'FLYTT' && finalResponse.currentContractAddress) {
          // Got to Move Offer step
          setMoveOfferData({ currentContractAddress: finalResponse.currentContractAddress });
          goToStep('MOVE_OFFER');
        } else {
          // Proceed to DETAILS
          goToStep('DETAILS');
        }
      } catch (error) {
        console.error('Error determining scenario:', error);
      }
    }
  };

  const handleMoveChoice = (choice: 'MOVE' | 'NEW') => {

    // In a real app we might set a move flag here
    goToStep('DETAILS');
  };

  const handleDateSelect = (date: string, mode: 'EARLIEST' | 'SPECIFIC') => {
    setTempDateData({ date, mode });
    setDetailsSubStep('CONTACT');
  };

  const handleContactConfirm = (contact: { email: string, phone: string }) => {
    if (tempDateData) {
      setCustomerDetails({
        startDate: tempDateData.date,
        startDateMode: tempDateData.mode,
        email: contact.email,
        phone: contact.phone
      });
      console.log('Details confirmed:', { date: tempDateData, contact });
      // alert(`Datum och kontakt sparat! Datum: ${tempDateData.date}, E-post: ${contact.email}. Nästa steg: Villkor & Signering.`);
      goToStep('TERMS');
    }
  };

  const handleTermsConfirm = (consents: { 
    termsAccepted: boolean; 
    marketing: { email: boolean; sms: boolean };
    facilityId?: { fetch: boolean; value?: string };
  }) => {
    setConsents({ 
      terms: consents.termsAccepted, 
      marketing: consents.marketing 
    });

    if (consents.facilityId) {
      console.log('Facility ID choice:', consents.facilityId);
    }
    
    // Check for risk info (FAST / KVARTS)
    const productType = state.selectedProduct?.type;
    if (productType === 'FAST' || productType === 'KVARTS') {
      goToStep('RISK_INFO');
    } else {
      goToStep('SIGNING');
    }
  };

  const handleRiskConfirm = () => {
    setConsents({ risk: true });
    goToStep('SIGNING');
  };

  const handleSigned = () => {
    // In real app, verify signature here
    // Create mock order ID
    const mockOrderId = `ORD-${Math.floor(Math.random() * 100000)}`;
    // We would save this to state/backend here
    // For now we just go to confirmation
    goToStep('CONFIRMATION');
    // Save orderId in state if needed, or pass as prop? 
    // FlowState doesn't accept orderId updates easily, so we rely on rendering Confirmation with mock ID or passing state.
    // Actually caseState has caseId, we might use that. But let's just render Confirmation.
  };

  const handleConfirmationReset = () => {
    resetState();
    // Also clear query params
    router.push(pathname);
  };

  // Centralized Back Logic
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
          // If in DATE step, check if we came from MOVE_OFFER
          if (state.scenario === 'FLYTT' && moveOfferData) {
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
      case 'RISK_INFO':
        goToStep('TERMS');
        break;
      case 'SIGNING':
        // Determine where we came from based on product
        if (state.selectedProduct?.type === 'FAST' || state.selectedProduct?.type === 'KVARTS') {
          goToStep('RISK_INFO');
        } else {
          goToStep('TERMS');
        }
        break;
      case 'CONFIRMATION':
        // No back from confirmation usually, but for dev:
        goToStep('SIGNING');
        break;
      default:
        console.warn('Unknown step for back navigation');
    }
  };

  // Reset internal substep when entering DETAILS step fresh (from IDENTIFY or MOVE_OFFER)
  // Don't reset if navigating back from TERMS
  const [enteredFromForward, setEnteredFromForward] = useState(false);

  useEffect(() => {
    if (currentStep === 'DETAILS' && !enteredFromForward) {
      setDetailsSubStep('DATE');
      setTempDateData(null);
      setEnteredFromForward(true);
    }
    if (currentStep !== 'DETAILS') {
      setEnteredFromForward(false);
    }
  }, [currentStep, enteredFromForward]);

  if (!isInitialized) return null; // Or a loading spinner

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
          productName={state.selectedProduct?.name}
          isExistingCustomer={state.customer.isExistingCustomer}
          bindingEndDate={state.customer.contractEndDate || undefined}
        />
      )}

      {currentStep === 'DETAILS' && detailsSubStep === 'CONTACT' && (
        <ContactForm 
          initialData={state.customer}
          onConfirm={handleContactConfirm}
          onBack={handleBack}
        />
      )}

      {currentStep === 'MOVE_OFFER' && moveOfferData && state.valdAdress && (
        <MoveOffer 
          currentAddress={moveOfferData.currentContractAddress}
          newAddress={state.valdAdress}
          onMove={() => handleMoveChoice('MOVE')}
          onNew={() => handleMoveChoice('NEW')}
          onBack={handleBack}
        />
      )}

      {currentStep === 'TERMS' && (
        <TermsConsent 
          onConfirm={handleTermsConfirm}
          onBack={handleBack}
          requiresFacilityId={state.scenario === 'NY' || state.scenario === 'FLYTT'}
        />
      )}

      {currentStep === 'RISK_INFO' && (
        <RiskInfo 
          onConfirm={handleRiskConfirm}
          onBack={handleBack}
          productType={state.selectedProduct?.type || 'FAST'}
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
          onReset={handleConfirmationReset}
        />
      )}
    </>
  );
};

export default function Home() {
  const { state: devState } = useDevPanel();
  
  return (
    <main 
      className={styles.page}
      style={{ marginRight: devState.isOpen ? '380px' : '0', transition: 'margin-right 0.3s ease' }}
    >
      <Suspense fallback={<div>Laddar...</div>}>
        <FlowContent />
      </Suspense>
    </main>
  );
}
