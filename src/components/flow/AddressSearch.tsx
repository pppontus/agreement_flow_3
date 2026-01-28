"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Address } from '@/types';
import { searchAddresses, formatAddress, fetchApartmentNumbers } from '@/services/addressService';
import { useDevPanel } from '@/context/DevPanelContext';
import styles from './AddressSearch.module.css';

interface AddressSearchProps {
  onConfirmAddress: (address: Address, apartmentDetails?: { number: string, co?: string }) => void;
  onBack?: () => void;
  suggestedAddress?: Address | null;
}

export const AddressSearch = ({ onConfirmAddress, onBack, suggestedAddress }: AddressSearchProps) => {
  const { state: devState } = useDevPanel();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showList, setShowList] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  
  // Apartment details
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [apartmentList, setApartmentList] = useState<string[]>([]);
  const [isAptsLoading, setIsAptsLoading] = useState(false);
  const [aptError, setAptError] = useState('');
  const [showManualApt, setShowManualApt] = useState(false);
  
  // c/o details
  const [showCo, setShowCo] = useState(false);
  const [coValue, setCoValue] = useState('');

  useEffect(() => {
    // If we have a suggested address and haven't interacted yet, pre-fill it
    if (suggestedAddress && !hasSearched && !selectedAddress && query === '') {
      handleSelect(suggestedAddress);
    }
  }, [suggestedAddress]);

  useEffect(() => {
    const search = async () => {
      // Don't search if we just selected an address (query matches selected)
      if (selectedAddress && query === formatAddress(selectedAddress)) {
        setResults([]);
        setShowList(false);
        return;
      }

      if (query.length < 2) {
        setResults([]);
        setHasSearched(false);
        setShowList(false);
        return;
      }

      setIsLoading(true);
      // Pass mock overrides if DevPanel is open
      const mockOverride = devState.isOpen ? devState.mockAddressResult : undefined;
      const addresses = await searchAddresses(query, mockOverride);
      setResults(addresses);
      setIsLoading(false);
      setHasSearched(true);
      setShowList(true);
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query, selectedAddress]);

  // Load apartment list when a LGH address is selected
  useEffect(() => {
    if (selectedAddress?.type === 'LGH') {
      const loadApts = async () => {
        setIsAptsLoading(true);
        try {
          const apts = await fetchApartmentNumbers(selectedAddress);
          setApartmentList(apts);
        } catch (e) {
          console.error("Failed to load apartments", e);
        }
        setIsAptsLoading(false);
      };
      loadApts();
    } else {
      setApartmentList([]);
    }
  }, [selectedAddress]);

  const handleSelect = (addr: Address) => {
    setSelectedAddress(addr);
    setQuery(formatAddress(addr));
    setShowList(false);
    // Reset or set pre-filled apt details
    setApartmentNumber(addr.apartmentNumber || '');
    setAptError('');
    setShowManualApt(false);
    // Reset c/o
    setShowCo(false);
    setCoValue('');
  };

  const handleInputChange = (val: string) => {
    setQuery(val);
    if (selectedAddress) {
      setSelectedAddress(null);
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
        <h2 className={styles.title}>Var ska elen levereras?</h2>
      </div>



      {!selectedAddress && <p className={styles.subtitle}>Eller sök efter adressen där du vill ha elavtal</p>}

      <div className={styles.searchWrapper}>
        <Input
          label="Adress"
          placeholder="Sök gatuadress, postnummer eller ort..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          autoFocus
        />

        <div className={styles.results}>
          {isLoading && (
            <div className={styles.loading}>Söker...</div>
          )}

          {!isLoading && showList && results.length > 0 && (
            <ul className={styles.list}>
              {results.map((addr, index) => (
                <li key={index}>
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

          {!isLoading && showList && hasSearched && results.length === 0 && (
            <div className={styles.noResults}>
              Inga adresser hittades för "{query}"
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
            
            {isAptsLoading ? (
              <div className={styles.aptLoading}>Hämtar lägenheter...</div>
            ) : (
              <div className={styles.apartmentGridContainer}>
                {Object.entries(
                  apartmentList.reduce((acc, num) => {
                    const floorPart = num.substring(0, 2);
                    if (!acc[floorPart]) acc[floorPart] = [];
                    acc[floorPart].push(num);
                    return acc;
                  }, {} as Record<string, string[]>)
                )
                  .sort(([a], [b]) => b.localeCompare(a))
                  .map(([floorPart, numbers]) => (
                    <div key={floorPart} className={styles.floorRow}>
                      {numbers.sort().map(num => (
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

            {!showManualApt ? (
              <button 
                className={styles.toggleManual}
                onClick={() => setShowManualApt(true)}
              >
                Hittar du inte din lägenhet? Ange manuellt
              </button>
            ) : (
              <div className={styles.apartmentRow}>
                <Input
                  label="Lägenhetsnummer"
                  placeholder="0001"
                  value={apartmentNumber}
                  onChange={(e) => {
                    setApartmentNumber(e.target.value);
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
          Gå vidare
        </Button>
        {onBack && (
          <button className={styles.backLink} onClick={onBack}>
            ← Tillbaka till produktval
          </button>
        )}
      </div>
    </div>
  );
};
