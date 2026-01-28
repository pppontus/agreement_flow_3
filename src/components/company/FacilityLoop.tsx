"use client";

import { useState, useEffect } from 'react';
import { CompanySummary } from './CompanySummary';
import { AddressSearch } from '@/components/flow/AddressSearch';
import { ProductSelection } from '@/components/flow/ProductSelection';
import { Facility } from '@/types/company';
import { Address, Product } from '@/types';
// Note: We might need a slightly modified version of AddressSearch in future if we want to skip manual entry for some inputs,
// but for now reusing the standard one works well for the "One Thing Per Screen" philosophy.

interface FacilityLoopProps {
  initialCount: number;
  globalProduct?: Product;
  onComplete: (facilities: Facility[]) => void;
  onBack: () => void;
}

type LoopView = 'HUB' | 'ADDRESS' | 'PRODUCT';

export const FacilityLoop = ({ initialCount, globalProduct, onComplete, onBack }: FacilityLoopProps) => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  // Start directly in ADDRESS view for linear flow (count=1) to avoid flicker of HUB
  const [view, setView] = useState<LoopView>(initialCount === 1 ? 'ADDRESS' : 'HUB');
  const [currentIndex, setCurrentIndex] = useState<number | null>(initialCount === 1 ? 0 : null);

  // Initialize facilities on mount
  useEffect(() => {
    if (facilities.length === 0 && initialCount > 0) {
      const initialFacilities: Facility[] = Array.from({ length: initialCount }).map((_, i) => ({
        id: `temp-${i}`,
        anlaggningId: `anl-${i}`, // Mock ID
        address: '',
        zipCode: '',
        city: '',
        annualConsumption: 0
      }));
      setFacilities(initialFacilities);
      
      // LINEAR FLOW: If just 1 facility (default), start configuring it immediately
      if (initialCount === 1) {
        setCurrentIndex(0);
        setView('ADDRESS');
      }
    }
  }, [initialCount, facilities.length]);

  const handleConfigure = (index: number) => {
    setCurrentIndex(index);
    setView('ADDRESS');
  };

  const handleAddFacility = () => {
    setFacilities(prev => [
      ...prev,
      {
        id: `temp-${prev.length}`,
        anlaggningId: `anl-${prev.length}`,
        address: '',
        zipCode: '',
        city: '',
        annualConsumption: 0
      }
    ]);
    // Start configuring the new facility immediately
    setCurrentIndex(facilities.length);
    setView('ADDRESS');
  };

  const handleAddressConfirm = (address: Address, details?: { number: string; co?: string }) => {
    if (currentIndex === null) return;

    // Create the updated facilities array locally
    const nextFacilities = [...facilities];
    let updatedFacility: Facility = {
      ...nextFacilities[currentIndex],
      address: `${address.street} ${address.number}`,
      zipCode: address.postalCode,
      city: address.city,
      elomrade: address.elomrade
    };

    if (globalProduct) {
      updatedFacility = {
        ...updatedFacility,
        annualConsumption: 25000, // Placeholder
      };
    }
    nextFacilities[currentIndex] = updatedFacility;
    
    // Update state
    setFacilities(nextFacilities);

    if (globalProduct) {
      // LINEAR FLOW: If just 1 facility (default), finish immediately
      // We skip the HUB view as requested ("dina lokaler" view removed)
      // and proceed directly to the next step in the parent flow.
      if (initialCount === 1) {
        onComplete(nextFacilities);
      } else {
        setView('HUB');
        setCurrentIndex(null);
      }
    } else {
      setView('PRODUCT');
    }
  };

  const handleProductSelect = (product: Product) => {
    if (currentIndex === null) return;

    setFacilities(prev => {
      const next = [...prev];
      // Mocking consumption estimate based on product selection for now, 
      // in reality this might come from the gatekeeper total / count or user input
      next[currentIndex] = {
        ...next[currentIndex],
        annualConsumption: 25000, 
      };
      // If we are essentially done with this facility, and we are in linear flow, finish
      if (initialCount === 1) {
          onComplete(next);
      }
      return next;
    });

    if (initialCount !== 1) {
        // Return to hub
        setView('HUB');
        setCurrentIndex(null);
    }
  };

  const handleContinue = () => {
    onComplete(facilities);
  };

  // Determine title for steps
  const currentFacilityLabel = currentIndex !== null ? `Lokal ${currentIndex + 1}` : '';
  const currentFacility = currentIndex !== null ? facilities[currentIndex] : null;

  if (view === 'ADDRESS') {
    return (
      <div className="max-w-xl mx-auto">
        <h2 className="text-xl font-bold mb-2 text-center">Adress för {currentFacilityLabel}</h2>
        <p className="text-center text-sm text-gray-500 mb-6">
          Du kan lägga till fler lokaler senare
        </p>
        <AddressSearch 
          onConfirmAddress={handleAddressConfirm}
          onBack={onBack}
        />
      </div>
    );
  }

  if (view === 'PRODUCT') {
    return (
      <div className="max-w-xl mx-auto">
         <h2 className="text-xl font-bold mb-4 text-center">Välj avtal för {currentFacilityLabel}</h2>
         <p className="text-sm text-center text-gray-500 mb-6 max-w-md mx-auto">
           För företag erbjuder vi förvaltade elavtal för en tryggare och mer förutsägbar elkostnad över tid.
         </p>
         <ProductSelection 
           onProductSelect={handleProductSelect}
           isCompany={true}
           initialRegion={currentFacility?.elomrade}
           hideRegionSelector={true}
         />
         <div className="mt-4 text-center">
           <button onClick={() => setView('ADDRESS')} className="text-sm underline text-gray-500">
             Tillbaka till adressval
           </button>
         </div>
      </div>
    );
  }

  return (
    <div>
      <CompanySummary 
        facilities={facilities}
        onConfigure={handleConfigure}
        onContinue={handleContinue}
      />
      <div className="max-w-xl mx-auto mt-4 text-center">
        <button 
          onClick={handleAddFacility}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          + Lägg till en till lokal
        </button>
      </div>
    </div>
  );
};
