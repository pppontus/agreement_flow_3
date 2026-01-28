"use client";

import { useEffect, Suspense, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ProductSelection } from "@/components/flow/ProductSelection";
import { AddressSearch } from "@/components/flow/AddressSearch";
import { Identification } from "@/components/flow/Identification";
import { MoveOfferDialog } from "@/components/flow/MoveOfferDialog";
import { StartDatePicker } from "@/components/flow/StartDatePicker";
import { ContactForm } from "@/components/flow/ContactForm";
import { Address, Product, IdMethod } from "@/types";
import { useFlowState } from '@/hooks/useFlowState';
import { determineScenario } from '@/services/scenarioService';
import { useDevPanel } from '@/context/DevPanelContext';
import styles from "./page.module.css";

type FlowStep = 
  | 'PRODUCT_SELECT'
  | 'ADDRESS_SEARCH'
  | 'IDENTIFY'
  | 'DETAILS'; // Combined Date + Contact

// Internal component to use useSearchParams (requires Suspense boundary or to be in a client page)
const FlowContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStep = (searchParams.get('step') as FlowStep) || 'PRODUCT_SELECT';
  
  const { state, isInitialized, selectProduct, setAddress, setAuthenticated, setCustomerScenario, setCustomerDetails } = useFlowState();
  const { state: devState, setCurrentPhase } = useDevPanel();

  // Local state for move offer dialog and multi-step interactions
  const [showMoveOffer, setShowMoveOffer] = useState(false);
  const [moveOfferData, setMoveOfferData] = useState<{ currentContractAddress: Address } | null>(null);
  
  // Local state for the DETAILS step to manage substeps (Date -> Contact)
  const [detailsSubStep, setDetailsSubStep] = useState<'DATE' | 'CONTACT'>('DATE');
  const [tempDateData, setTempDateData] = useState<{date: string, mode: 'EARLIEST' | 'SPECIFIC'} | null>(null);

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
    
    // Simulate fetching scenario data
    if (state.valdAdress) {
      try {
        // Pass mock scenario override if DevPanel is open
        const mockOverride = devState.isOpen ? devState.mockScenario : undefined;
        const scenarioResponse = await determineScenario(pnr, state.valdAdress, mockOverride);
        
        // API call is now automatically logged by scenarioService via apiClient
        setCustomerScenario(scenarioResponse.scenario, scenarioResponse.customer);
        
        console.log('Scenario detected:', scenarioResponse);

        if (scenarioResponse.scenario === 'FLYTT' && scenarioResponse.currentContractAddress) {
          // Show move offer dialog
          setMoveOfferData({ currentContractAddress: scenarioResponse.currentContractAddress });
          setShowMoveOffer(true);
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
    setShowMoveOffer(false);
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
      alert(`Datum och kontakt sparat! Datum: ${tempDateData.date}, E-post: ${contact.email}. Nästa steg: Villkor & Signering.`);
      // goToStep('SIGNING'); // Future
    }
  };

  // Reset internal substep when entering details
  useEffect(() => {
    if (currentStep === 'DETAILS') {
      setDetailsSubStep('DATE');
      setTempDateData(null);
    }
  }, [currentStep]);

  if (!isInitialized) return null; // Or a loading spinner

  return (
    <>
      {currentStep === 'PRODUCT_SELECT' && (
        <ProductSelection onProductSelect={handleProductSelect} />
      )}

      {currentStep === 'ADDRESS_SEARCH' && (
        <AddressSearch 
          onConfirmAddress={handleAddressConfirm}
          onBack={() => goToStep('PRODUCT_SELECT')}
        />
      )}

      {currentStep === 'IDENTIFY' && (
        <Identification 
          onAuthenticated={handleAuthenticated}
          onBack={() => goToStep('ADDRESS_SEARCH')}
        />
      )}

      {currentStep === 'DETAILS' && detailsSubStep === 'DATE' && (
        <StartDatePicker 
          onSelectDate={handleDateSelect}
          onBack={() => goToStep('IDENTIFY')} // Or back to move offer if that existed? keeping simple for now
          address={state.valdAdress || undefined}
        />
      )}

      {currentStep === 'DETAILS' && detailsSubStep === 'CONTACT' && (
        <ContactForm 
          initialData={state.customer}
          onConfirm={handleContactConfirm}
          onBack={() => setDetailsSubStep('DATE')}
        />
      )}

      {showMoveOffer && moveOfferData && state.valdAdress && (
        <MoveOfferDialog 
          currentAddress={moveOfferData.currentContractAddress}
          newAddress={state.valdAdress}
          onMove={() => handleMoveChoice('MOVE')}
          onNew={() => handleMoveChoice('NEW')}
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
