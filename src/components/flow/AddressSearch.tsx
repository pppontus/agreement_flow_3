"use client";

import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Address } from '@/types';
import { formatAddress } from '@/services/addressService';
import { useMockSettings } from '@/context/MockSettingsContext';
import {
  useAddressLookup,
  useApartmentNumbers,
  useGroupedApartmentNumbers,
} from '@/hooks/useAddressLookup';
import styles from './AddressSearch.module.css';

interface AddressSearchProps {
  onConfirmAddress: (address: Address, apartmentDetails?: { number: string, co?: string }) => void;
  onBack?: () => void;
  suggestedAddress?: Address | null;
}

export const AddressSearch = ({ onConfirmAddress, onBack, suggestedAddress }: AddressSearchProps) => {
  const { state: devState } = useMockSettings();
  
  const [query, setQuery] = useState(suggestedAddress ? formatAddress(suggestedAddress) : '');
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(suggestedAddress || null);
  
  // Apartment details
  const [apartmentNumber, setApartmentNumber] = useState(suggestedAddress?.apartmentNumber ?? '');
  const [aptError, setAptError] = useState('');
  const [showManualApt, setShowManualApt] = useState(false);
  
  // c/o details
  const [showCo, setShowCo] = useState(false);
  const [coValue, setCoValue] = useState('');
  const addressLookup = useAddressLookup({
    query,
    selectedAddress,
    mockResult: devState.mockAddressResult,
  });
  const apartmentLookup = useApartmentNumbers(selectedAddress);
  const groupedApartmentNumbers = useGroupedApartmentNumbers(apartmentLookup.apartmentNumbers);

  const handleSelect = useCallback((addr: Address) => {
    setSelectedAddress(addr);
    setQuery(formatAddress(addr));
    // Reset or set pre-filled apt details
    setApartmentNumber(addr.apartmentNumber || '');
    setAptError('');
    setShowManualApt(false);
    // Reset c/o
    setShowCo(false);
    setCoValue('');
  }, []);

  const handleInputChange = (val: string) => {
    setQuery(val);
    if (selectedAddress) {
      setSelectedAddress(null);
      setApartmentNumber('');
      setShowManualApt(false);
      setAptError('');
      setShowCo(false);
      setCoValue('');
    }
  };

  const handleConfirm = () => {
    if (!selectedAddress) return;

    if (selectedAddress.type === 'LGH') {
      if (!/^\d{4}$/.test(apartmentNumber)) {
        setAptError('Lägenhetsnummer måste vara 4 siffror');
        return;
      }
      onConfirmAddress(selectedAddress, { 
        number: apartmentNumber,
        co: coValue || undefined 
      });
    } else {
      onConfirmAddress(selectedAddress);
    }
  };

  const isContinueEnabled = selectedAddress && (selectedAddress.type !== 'LGH' || apartmentNumber.length === 4);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Vilken adress gäller det?</h2>
      </div>

      <div className={styles.searchWrapper}>
        <Input
          label="Adress"
          placeholder="Sök adress..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          autoFocus
        />

        <div className={styles.results}>
          {addressLookup.isLoading && (
            <div className={styles.loading}>Söker...</div>
          )}

          {!addressLookup.isLoading && addressLookup.showList && addressLookup.results.length > 0 && (
            <ul className={styles.list}>
              {addressLookup.results.map((addr) => (
                <li key={`${addr.street}-${addr.number}-${addr.postalCode}-${addr.city}`}>
                  <button 
                    className={styles.resultItem}
                    onClick={() => handleSelect(addr)}
                  >
                    <span className={styles.address}>{formatAddress(addr)}</span>
                    <span className={styles.type}>
                      {addr.type === 'LGH' ? 'Lägenhet' : 'Villa'} {addr.elomrade ? `/ ${addr.elomrade}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!addressLookup.isLoading && addressLookup.showList && addressLookup.hasSearched && addressLookup.results.length === 0 && (
            <div className={styles.noResults}>
              {addressLookup.error || `Ingen adress hittades för "${query}"`}
            </div>
          )}
        </div>
      </div>

      <div className={styles.additionalDetailsWrapper}>
        {selectedAddress?.type === 'LGH' && (
          <div className={styles.apartmentFields}>
            {/* c/o toggle and field moved here */}
            {!showCo ? (
              <button 
                className={styles.toggleCo}
                onClick={() => setShowCo(true)}
              >
                + Lägg till c/o
              </button>
            ) : (
              <div className={styles.coRow}>
                <Input
                  label="c/o (valfritt)"
                  placeholder="c/o namn"
                  value={coValue}
                  onChange={(e) => setCoValue(e.target.value)}
                  className={styles.coInput}
                />
                <button 
                  className={styles.removeCo}
                  onClick={() => {
                    setShowCo(false);
                    setCoValue('');
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            <p className={styles.sectionLabel}>Välj lägenhetsnummer</p>
            
            {apartmentLookup.isLoading ? (
              <div className={styles.aptLoading}>Hämtar lägenheter...</div>
            ) : (
              <div className={styles.apartmentGridContainer}>
                {groupedApartmentNumbers.map(([floorPart, numbers]) => (
                    <div key={floorPart} className={styles.floorRow}>
                      {numbers.map(num => (
                        <button
                          key={num}
                          className={`${styles.aptButton} ${apartmentNumber === num ? styles.aptButtonSelected : ''}`}
                          onClick={() => {
                            setApartmentNumber(num);
                            setAptError('');
                          }}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  ))}
              </div>
            )}

            {apartmentLookup.hasError && (
              <p className={styles.noResults}>Lägenhetsnummer kunde inte hämtas. Ange numret manuellt.</p>
            )}

            {!showManualApt ? (
              <button 
                className={styles.toggleManual}
                onClick={() => setShowManualApt(true)}
              >
                Ange lägenhetsnummer manuellt
              </button>
            ) : (
              <div className={styles.apartmentRow}>
                <Input
                  label="Lägenhetsnummer"
                  placeholder="0001"
                  value={apartmentNumber}
                  onChange={(e) => {
                    setApartmentNumber(e.target.value.replace(/\D/g, '').slice(0, 4));
                    setAptError('');
                  }}
                  maxLength={4}
                  error={aptError}
                  className={styles.aptInput}
                  autoFocus
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <Button 
          disabled={!isContinueEnabled} 
          onClick={handleConfirm}
          className={styles.confirmButton}
        >
          Fortsätt
        </Button>
        {onBack && (
          <button className={styles.backLink} onClick={onBack}>
            ← Tillbaka
          </button>
        )}
      </div>
    </div>
  );
};
