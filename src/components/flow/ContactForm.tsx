"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Address, Invoice, ContactDraft } from '@/types';
import { formatAddress, formatInvoiceAddress } from '@/services/addressService';
import { useMockSettings } from '@/context/MockSettingsContext';
import {
  useAddressLookup,
  useApartmentNumbers,
  useGroupedApartmentNumbers,
} from '@/hooks/useAddressLookup';
import { isValidEmail, isValidPhone } from '@/flow/validation';
import styles from './ContactForm.module.css';
import addressSearchStyles from './AddressSearch.module.css';

interface ContactFormProps {
  draft: ContactDraft | null;
  onDraftChange: (draft: ContactDraft) => void;
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
  draft, onDraftChange,
  initialData,
  initialInvoice,
  recommendedInvoiceAddress,
  suggestedCustomInvoiceAddress,
  onConfirm,
  onBack,
}: ContactFormProps) => {
  const { state: devState } = useMockSettings();

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

  const values: ContactDraft = draft ?? {
    email: initialData?.email || '', phone: initialData?.phone || '',
    useRecommendedInvoice: recommendedInvoiceAddress ? initialInvoice?.mode !== 'CUSTOM' : false,
    invoiceQuery: initialCustomAddress ? formatAddress(initialCustomAddress) : '',
    selectedCustomInvoiceAddress: initialCustomAddress,
    invoiceApartmentNumber: initialCustomApartmentNumber, invoiceCoValue: initialCustomCo,
    isConfirming: !!(initialData?.email && initialData?.phone),
  };
  const { email, phone, useRecommendedInvoice, invoiceQuery, selectedCustomInvoiceAddress,
    invoiceApartmentNumber, invoiceCoValue, isConfirming } = values;
  const updateDraft = (patch: Partial<ContactDraft>) => onDraftChange({ ...values, ...patch });
  const setEmail = (email: string) => updateDraft({ email });
  const setPhone = (phone: string) => updateDraft({ phone });
  const setUseRecommendedInvoice = (useRecommendedInvoice: boolean) => updateDraft({ useRecommendedInvoice });
  const setInvoiceApartmentNumber = (invoiceApartmentNumber: string) => updateDraft({ invoiceApartmentNumber });
  const setInvoiceCoValue = (invoiceCoValue: string) => updateDraft({ invoiceCoValue });
  const setIsConfirming = (isConfirming: boolean) => updateDraft({ isConfirming });
  const [showManualInvoiceApt, setShowManualInvoiceApt] = useState(!!invoiceApartmentNumber);
  const [showInvoiceCo, setShowInvoiceCo] = useState(!!invoiceCoValue);

  const [errors, setErrors] = useState<{
    email?: string;
    phone?: string;
    invoiceAddress?: string;
    invoiceApartmentNumber?: string;
  }>({});
  const invoiceAddressLookup = useAddressLookup({
    query: invoiceQuery,
    selectedAddress: selectedCustomInvoiceAddress,
    enabled: !useRecommendedInvoice,
    mockResult: devState.mockAddressResult,
  });
  const invoiceApartmentLookup = useApartmentNumbers(
    selectedCustomInvoiceAddress,
    !useRecommendedInvoice
  );
  const groupedInvoiceApartments = useGroupedApartmentNumbers(
    invoiceApartmentLookup.apartmentNumbers
  );

  const selectedInvoiceAddress = (() => {
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
  })();

  const hasCompleteCustomInvoiceAddress =
    !useRecommendedInvoice &&
    !!selectedCustomInvoiceAddress &&
    (selectedCustomInvoiceAddress.type !== 'LGH' || /^\d{4}$/.test(invoiceApartmentNumber));
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
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Ange en giltig e-postadress';
    }

    // Basic phone validation (07x...)
    if (!phone) {
      newErrors.phone = 'Mobilnummer måste anges';
    } else if (!isValidPhone(phone)) {
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
    if (Object.keys(newErrors).length) setIsConfirming(false);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      setIsConfirming(true);
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
    const cleared = selectedCustomInvoiceAddress && value !== formatAddress(selectedCustomInvoiceAddress);
    updateDraft({ invoiceQuery: value, ...(cleared ? { selectedCustomInvoiceAddress: null, invoiceApartmentNumber: '', invoiceCoValue: '' } : {}) });
    setErrors(prev => ({ ...prev, invoiceAddress: undefined, invoiceApartmentNumber: undefined }));
    if (cleared) { setShowManualInvoiceApt(false); setShowInvoiceCo(false); }
  };
  const handleInvoiceSelect = (address: Address) => {
    updateDraft({ selectedCustomInvoiceAddress: address, invoiceQuery: formatAddress(address), invoiceApartmentNumber: address.apartmentNumber || '', invoiceCoValue: '' });
    setErrors(prev => ({ ...prev, invoiceAddress: undefined, invoiceApartmentNumber: undefined }));
    setShowManualInvoiceApt(false); setShowInvoiceCo(false);
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
          <button className={styles.backLink} onClick={onBack}>← Tillbaka</button>
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
                {invoiceAddressLookup.isLoading && (
                  <div className={addressSearchStyles.loading}>Söker...</div>
                )}

                {!invoiceAddressLookup.isLoading && invoiceAddressLookup.showList && invoiceAddressLookup.results.length > 0 && (
                  <ul className={addressSearchStyles.list}>
                    {invoiceAddressLookup.results.map((address) => (
                      <li key={`${address.street}-${address.number}-${address.postalCode}-${address.city}`}>
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

                {!invoiceAddressLookup.isLoading && invoiceAddressLookup.showList && invoiceAddressLookup.hasSearched && invoiceAddressLookup.results.length === 0 && (
                  <div className={addressSearchStyles.noResults}>
                    {invoiceAddressLookup.error || `Inga adresser hittades för "${invoiceQuery}"`}
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

                {invoiceApartmentLookup.isLoading ? (
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

                {invoiceApartmentLookup.hasError && (
                  <p className={styles.invoiceError}>Lägenhetsnummer kunde inte hämtas. Ange numret manuellt.</p>
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
