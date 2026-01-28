"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Address } from '@/types';
import { searchAddresses, formatAddress } from '@/services/addressService';
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
  const [co, setCo] = useState('');
  const [showCo, setShowCo] = useState(false);
  const [aptError, setAptError] = useState('');

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

  const handleSelect = (addr: Address) => {
    setSelectedAddress(addr);
    setQuery(formatAddress(addr));
    setShowList(false);
    // Reset apt details when changing address
    setApartmentNumber('');
    setCo('');
    setAptError('');
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
      onConfirmAddress(selectedAddress, { number: apartmentNumber, co: co || undefined });
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
            <div className={styles.apartmentRow}>
              <Input
                label="Lägenhetsnummer (4 siffror)"
                placeholder="0001"
                value={apartmentNumber}
                onChange={(e) => {
                  setApartmentNumber(e.target.value);
                  setAptError('');
                }}
                maxLength={4}
                error={aptError}
                className={styles.aptInput}
              />
              
              {!showCo ? (
                <button 
                  className={styles.toggleCo} 
                  onClick={() => setShowCo(true)}
                >
                  + Lägg till c/o
                </button>
              ) : (
                <Input
                  label="c/o (valfritt)"
                  placeholder="Namn"
                  value={co}
                  onChange={(e) => setCo(e.target.value)}
                  className={styles.aptInput}
                />
              )}
            </div>
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
