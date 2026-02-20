"use client";

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Address, Invoice } from '@/types';
import { fetchApartmentNumbers, formatAddress, formatInvoiceAddress, searchAddresses } from '@/services/addressService';
import { useDevPanel } from '@/context/DevPanelContext';
import styles from './ContactForm.module.css';
import addressSearchStyles from './AddressSearch.module.css';

interface ContactFormProps {
  initialData?: {
    email: string | null;
    phone: string | null;
  };
  initialInvoice?: Invoice | null;
  recommendedInvoiceAddress?: Address | null;
  suggestedCustomInvoiceAddress?: Address | null;
  onConfirm: (data: { email: string; phone: string; invoice: Invoice | null }) => void;
  onBack: () => void;
}

export const ContactForm = ({
  initialData,
  initialInvoice,
  recommendedInvoiceAddress,
  suggestedCustomInvoiceAddress,
  onConfirm,
  onBack,
}: ContactFormProps) => {
  const { state: devState } = useDevPanel();

  const initialCustomAddress =
    initialInvoice?.mode === 'CUSTOM' && initialInvoice.address
      ? initialInvoice.address
      : suggestedCustomInvoiceAddress || null;
  const initialCustomApartmentNumber =
    initialInvoice?.mode === 'CUSTOM'
      ? (initialInvoice.apartmentDetails?.number || initialCustomAddress?.apartmentNumber || '')
      : '';
  const initialCustomCo =
    initialInvoice?.mode === 'CUSTOM'
      ? (initialInvoice.apartmentDetails?.co || '')
      : '';

  const [email, setEmail] = useState(initialData?.email || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [useRecommendedInvoice, setUseRecommendedInvoice] = useState(
    recommendedInvoiceAddress ? initialInvoice?.mode !== 'CUSTOM' : false
  );
  const [invoiceQuery, setInvoiceQuery] = useState(
    initialCustomAddress ? formatAddress(initialCustomAddress) : ''
  );
  const [selectedCustomInvoiceAddress, setSelectedCustomInvoiceAddress] = useState<Address | null>(initialCustomAddress);
  const [invoiceResults, setInvoiceResults] = useState<Address[]>([]);
  const [isInvoiceSearchLoading, setIsInvoiceSearchLoading] = useState(false);
  const [hasInvoiceSearched, setHasInvoiceSearched] = useState(false);
  const [showInvoiceList, setShowInvoiceList] = useState(false);
  const [invoiceSearchError, setInvoiceSearchError] = useState('');
  const [invoiceApartmentNumber, setInvoiceApartmentNumber] = useState(initialCustomApartmentNumber);
  const [invoiceApartmentList, setInvoiceApartmentList] = useState<string[]>([]);
  const [isInvoiceAptsLoading, setIsInvoiceAptsLoading] = useState(false);
  const [showManualInvoiceApt, setShowManualInvoiceApt] = useState(false);
  const [showInvoiceCo, setShowInvoiceCo] = useState(!!initialCustomCo);
  const [invoiceCoValue, setInvoiceCoValue] = useState(initialCustomCo);
  
  // Existing customers with prefilled contact details get a quick confirmation view first.
  const [isConfirming, setIsConfirming] = useState(!!(initialData?.email && initialData?.phone));

  const [errors, setErrors] = useState<{
    email?: string;
    phone?: string;
    invoiceAddress?: string;
    invoiceApartmentNumber?: string;
  }>({});

  useEffect(() => {
    if (useRecommendedInvoice) {
      setShowInvoiceList(false);
      return;
    }

    if (selectedCustomInvoiceAddress && invoiceQuery === formatAddress(selectedCustomInvoiceAddress)) {
      setInvoiceResults([]);
      setShowInvoiceList(false);
      setHasInvoiceSearched(false);
      setInvoiceSearchError('');
      return;
    }

    if (invoiceQuery.length < 2) {
      setInvoiceResults([]);
      setHasInvoiceSearched(false);
      setShowInvoiceList(false);
      setInvoiceSearchError('');
      return;
    }

    let isActive = true;
    const runSearch = async () => {
      setIsInvoiceSearchLoading(true);
      setInvoiceSearchError('');

      try {
        const mockOverride = devState.isOpen ? devState.mockAddressResult : undefined;
        const addresses = await searchAddresses(invoiceQuery, mockOverride);

        if (!isActive) return;
        setInvoiceResults(addresses);
        setHasInvoiceSearched(true);
        setShowInvoiceList(true);
      } catch {
        if (!isActive) return;
        setInvoiceResults([]);
        setHasInvoiceSearched(true);
        setShowInvoiceList(true);
        setInvoiceSearchError('Det gick inte att hämta adresser just nu.');
      } finally {
        if (isActive) {
          setIsInvoiceSearchLoading(false);
        }
      }
    };

    const debounce = setTimeout(runSearch, 300);
    return () => {
      isActive = false;
      clearTimeout(debounce);
    };
  }, [devState.isOpen, devState.mockAddressResult, invoiceQuery, selectedCustomInvoiceAddress, useRecommendedInvoice]);

  useEffect(() => {
    if (useRecommendedInvoice || selectedCustomInvoiceAddress?.type !== 'LGH') {
      setInvoiceApartmentList([]);
      setIsInvoiceAptsLoading(false);
      return;
    }

    let isActive = true;
    const loadApartments = async () => {
      setIsInvoiceAptsLoading(true);
      try {
        const apartments = await fetchApartmentNumbers(selectedCustomInvoiceAddress);
        if (!isActive) return;
        setInvoiceApartmentList(apartments);
      } catch (error) {
        console.error('Failed to load invoice apartments', error);
        if (!isActive) return;
        setInvoiceApartmentList([]);
      } finally {
        if (isActive) {
          setIsInvoiceAptsLoading(false);
        }
      }
    };

    loadApartments();
    return () => {
      isActive = false;
    };
  }, [selectedCustomInvoiceAddress, useRecommendedInvoice]);

  const selectedInvoiceAddress = useMemo(() => {
    if (useRecommendedInvoice) {
      return recommendedInvoiceAddress || null;
    }
    if (!selectedCustomInvoiceAddress) return null;

    if (selectedCustomInvoiceAddress.type === 'LGH') {
      return {
        ...selectedCustomInvoiceAddress,
        apartmentNumber: invoiceApartmentNumber,
      };
    }

    return {
      ...selectedCustomInvoiceAddress,
      apartmentNumber: undefined,
    };
  }, [
    invoiceApartmentNumber,
    recommendedInvoiceAddress,
    selectedCustomInvoiceAddress,
    useRecommendedInvoice,
  ]);

  const hasCompleteCustomInvoiceAddress =
    !useRecommendedInvoice &&
    !!selectedCustomInvoiceAddress &&
    (selectedCustomInvoiceAddress.type !== 'LGH' || /^\d{4}$/.test(invoiceApartmentNumber));
  const groupedInvoiceApartments = useMemo(
    () =>
      Object.entries(
        invoiceApartmentList.reduce((acc, apartmentNumber) => {
          const floorPart = apartmentNumber.substring(0, 2);
          if (!acc[floorPart]) acc[floorPart] = [];
          acc[floorPart].push(apartmentNumber);
          return acc;
        }, {} as Record<string, string[]>)
      ).sort(([a], [b]) => b.localeCompare(a)),
    [invoiceApartmentList]
  );

  const validate = (): boolean => {
    const newErrors: {
      email?: string;
      phone?: string;
      invoiceAddress?: string;
      invoiceApartmentNumber?: string;
    } = {};
    
    // Basic email validation
    if (!email) {
      newErrors.email = 'E-post måste anges';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Ange en giltig e-postadress';
    }

    // Basic phone validation (07x...)
    if (!phone) {
      newErrors.phone = 'Mobilnummer måste anges';
    } else if (!/^07[02369]\d{7}$/.test(phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Ange ett giltigt mobilnummer (07xxxxxxxx)';
    }

    if (!useRecommendedInvoice && !selectedCustomInvoiceAddress) {
      newErrors.invoiceAddress = 'Välj en fakturaadress från listan';
    }
    if (
      !useRecommendedInvoice &&
      selectedCustomInvoiceAddress?.type === 'LGH' &&
      !/^\d{4}$/.test(invoiceApartmentNumber)
    ) {
      newErrors.invoiceApartmentNumber = 'Lägenhetsnummer måste vara 4 siffror';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onConfirm({
        email,
        phone,
        invoice: selectedInvoiceAddress
          ? {
              mode: useRecommendedInvoice ? 'SAME_AS_RECOMMENDED' : 'CUSTOM',
              address: selectedInvoiceAddress,
              apartmentDetails:
                !useRecommendedInvoice && selectedCustomInvoiceAddress?.type === 'LGH'
                  ? {
                      number: invoiceApartmentNumber,
                      co: invoiceCoValue.trim() || null,
                    }
                  : null,
            }
          : null,
      });
    }
  };

  const handleInvoiceInputChange = (value: string) => {
    setInvoiceQuery(value);
    setInvoiceSearchError('');
    setErrors(prev => ({ ...prev, invoiceAddress: undefined, invoiceApartmentNumber: undefined }));
    if (selectedCustomInvoiceAddress && value !== formatAddress(selectedCustomInvoiceAddress)) {
      setSelectedCustomInvoiceAddress(null);
      setInvoiceApartmentNumber('');
      setInvoiceApartmentList([]);
      setShowManualInvoiceApt(false);
      setShowInvoiceCo(false);
      setInvoiceCoValue('');
    }
  };

  const handleInvoiceSelect = (address: Address) => {
    setSelectedCustomInvoiceAddress(address);
    setInvoiceQuery(formatAddress(address));
    setShowInvoiceList(false);
    setInvoiceSearchError('');
    setErrors(prev => ({ ...prev, invoiceAddress: undefined, invoiceApartmentNumber: undefined }));
    setInvoiceApartmentNumber(address.apartmentNumber || '');
    setShowManualInvoiceApt(false);
    setShowInvoiceCo(false);
    setInvoiceCoValue('');
  };

  // If in confirmation mode
  if (isConfirming) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>Stämmer dina uppgifter?</h2>
          <p className={styles.subtitle}>
            Kontrollera att allt stämmer.
          </p>
        </header>

        <div className={styles.confirmationBox}>
          <div className={styles.confirmRow}>
            <span className={styles.confirmLabel}>E-post:</span>
            <span className={styles.confirmValue}>{email}</span>
          </div>
          <div className={styles.confirmRow}>
            <span className={styles.confirmLabel}>Mobil:</span>
            <span className={styles.confirmValue}>{phone}</span>
          </div>
          <div className={styles.confirmRow}>
            <span className={styles.confirmLabel}>Fakturaadress:</span>
            <span className={styles.confirmValue}>
              {useRecommendedInvoice
                ? (recommendedInvoiceAddress ? formatAddress(recommendedInvoiceAddress) : '—')
                : hasCompleteCustomInvoiceAddress
                  ? formatInvoiceAddress({
                      mode: 'CUSTOM',
                      address: selectedInvoiceAddress,
                      apartmentDetails:
                        selectedCustomInvoiceAddress?.type === 'LGH'
                          ? {
                              number: invoiceApartmentNumber,
                              co: invoiceCoValue.trim() || null,
                            }
                          : null,
                    })
                  : 'Annan adress'}
            </span>
          </div>
        </div>

        <div className={styles.footer}>
          <Button 
            onClick={handleSubmit} 
            className={styles.continueButton}
          >
            Stämmer, fortsätt
          </Button>
          <button 
            className={styles.backLink} 
            onClick={() => setIsConfirming(false)}
          >
            Ändra uppgifter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Dina kontaktuppgifter</h2>
        <p className={styles.subtitle}>
          Var ska vi skicka bekräftelse och faktura?
        </p>
      </header>

      <div className={styles.form}>
        <Input 
          label="E-postadress"
          type="email"
          placeholder="namn.efternamn@exempel.se"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrors(prev => ({ ...prev, email: undefined }));
          }}
          error={errors.email}
          autoComplete="email"
        />

        <Input 
          label="Mobilnummer"
          type="tel"
          placeholder="070 123 45 67"
          value={phone}
          onChange={(e) => {
            // Allow only digits and spaces/dashes
            const val = e.target.value;
            if (/^[\d\s-]*$/.test(val)) {
              setPhone(val);
              setErrors(prev => ({ ...prev, phone: undefined }));
            }
          }}
          error={errors.phone}
          autoComplete="tel"
        />
        {recommendedInvoiceAddress && (
          <section className={styles.invoiceInline}>
            <label className={styles.invoiceCheckboxRow}>
              <input
                type="checkbox"
                className={styles.invoiceCheckbox}
                checked={useRecommendedInvoice}
                onChange={(e) => setUseRecommendedInvoice(e.target.checked)}
              />
              <span>
                Använd samma adress för faktura
              </span>
            </label>
            <p className={styles.invoiceHint}>
              Nuvarande adress: {formatAddress(recommendedInvoiceAddress)}. Avmarkera om du vill ange en annan fakturaadress.
            </p>
          </section>
        )}

        {!useRecommendedInvoice && (
          <section className={styles.manualInvoiceSection}>
            <div className={addressSearchStyles.searchWrapper}>
              <Input
                label="Fakturaadress"
                placeholder="Sök adress..."
                value={invoiceQuery}
                onChange={(e) => handleInvoiceInputChange(e.target.value)}
                autoComplete="street-address"
              />

              <div className={addressSearchStyles.results}>
                {isInvoiceSearchLoading && (
                  <div className={addressSearchStyles.loading}>Söker...</div>
                )}

                {!isInvoiceSearchLoading && showInvoiceList && invoiceResults.length > 0 && (
                  <ul className={addressSearchStyles.list}>
                    {invoiceResults.map((address, index) => (
                      <li key={`${address.street}-${address.number}-${address.postalCode}-${index}`}>
                        <button
                          type="button"
                          className={addressSearchStyles.resultItem}
                          onClick={() => handleInvoiceSelect(address)}
                        >
                          <span className={addressSearchStyles.address}>{formatAddress(address)}</span>
                          <span className={addressSearchStyles.type}>
                            {address.type === 'LGH' ? 'Lägenhet' : 'Villa'} {address.elomrade ? `/ ${address.elomrade}` : ''}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {!isInvoiceSearchLoading && showInvoiceList && (invoiceSearchError || (hasInvoiceSearched && invoiceResults.length === 0)) && (
                  <div className={addressSearchStyles.noResults}>
                    {invoiceSearchError || `Inga adresser hittades för "${invoiceQuery}"`}
                  </div>
                )}
              </div>
            </div>
            {selectedCustomInvoiceAddress?.type === 'LGH' && (
              <div className={styles.invoiceApartmentDetails}>
                {!showInvoiceCo ? (
                  <button
                    type="button"
                    className={addressSearchStyles.toggleCo}
                    onClick={() => setShowInvoiceCo(true)}
                  >
                    + Lägg till c/o
                  </button>
                ) : (
                  <div className={addressSearchStyles.coRow}>
                    <Input
                      label="c/o (valfritt)"
                      placeholder="c/o namn"
                      value={invoiceCoValue}
                      onChange={(e) => setInvoiceCoValue(e.target.value)}
                      className={addressSearchStyles.coInput}
                    />
                    <button
                      type="button"
                      className={addressSearchStyles.removeCo}
                      onClick={() => {
                        setShowInvoiceCo(false);
                        setInvoiceCoValue('');
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                <p className={addressSearchStyles.sectionLabel}>Välj lägenhetsnummer</p>

                {isInvoiceAptsLoading ? (
                  <div className={addressSearchStyles.aptLoading}>Hämtar lägenheter...</div>
                ) : (
                  <div className={addressSearchStyles.apartmentGridContainer}>
                    {groupedInvoiceApartments.map(([floorPart, numbers]) => (
                      <div key={floorPart} className={addressSearchStyles.floorRow}>
                        {numbers.sort().map((apartmentNumber) => (
                          <button
                            key={apartmentNumber}
                            type="button"
                            className={`${addressSearchStyles.aptButton} ${invoiceApartmentNumber === apartmentNumber ? addressSearchStyles.aptButtonSelected : ''}`}
                            onClick={() => {
                              setInvoiceApartmentNumber(apartmentNumber);
                              setErrors(prev => ({ ...prev, invoiceApartmentNumber: undefined }));
                            }}
                          >
                            {apartmentNumber}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {!showManualInvoiceApt ? (
                  <button
                    type="button"
                    className={addressSearchStyles.toggleManual}
                    onClick={() => setShowManualInvoiceApt(true)}
                  >
                    Ange lägenhetsnummer manuellt
                  </button>
                ) : (
                  <div className={addressSearchStyles.apartmentRow}>
                    <Input
                      label="Lägenhetsnummer"
                      placeholder="0001"
                      value={invoiceApartmentNumber}
                      onChange={(e) => {
                        setInvoiceApartmentNumber(e.target.value.replace(/\D/g, '').slice(0, 4));
                        setErrors(prev => ({ ...prev, invoiceApartmentNumber: undefined }));
                      }}
                      maxLength={4}
                      error={errors.invoiceApartmentNumber}
                      className={addressSearchStyles.aptInput}
                      autoFocus
                    />
                  </div>
                )}
                {errors.invoiceApartmentNumber && !showManualInvoiceApt && (
                  <p className={styles.invoiceError}>{errors.invoiceApartmentNumber}</p>
                )}
              </div>
            )}
            {errors.invoiceAddress && <p className={styles.invoiceError}>{errors.invoiceAddress}</p>}
          </section>
        )}

      </div>

      <div className={styles.footer}>
        <Button 
          onClick={handleSubmit}
          className={styles.continueButton}
        >
          Fortsätt till signering
        </Button>
        <button className={styles.backLink} onClick={onBack}>
          ← Tillbaka
        </button>
      </div>
    </div>
  );
};
