"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useMockSettings } from '@/context/MockSettingsContext';
import { useDevPanel } from '@/context/DevPanelContext';
import type { FlowPhase, MockAddressResult, MockEntryPreset, MockMarketingConsentType, MockScenarioType } from '@/types/dev';
import { useFlowState } from '@/context/FlowStateContext';
import { formatInvoiceAddress } from '@/services/addressService';
import { PRODUCTS } from '@/services/mockData';
import styles from './DevPanel.module.css';

// Phase-specific mock options
const SCENARIO_OPTIONS: { value: MockScenarioType; label: string; description: string }[] = [
  { value: 'ERROR', label: 'Fel vid kunduppslag', description: 'Simulerat tjänstefel för omförsök' },
  { value: 'NY_KUND', label: 'Ny kund', description: 'Kunden finns inte i systemet' },
  { value: 'FLYTT', label: 'Befintlig kund på annan adress', description: 'Kunden har ett befintligt avtal på en annan adress' },
  { value: 'BYTE', label: 'Kund med avtal (med bindning)', description: 'Befintlig kund med bindningstid' },
  { value: 'BYTE_NO_BINDING', label: 'Kund med avtal (utan bindning)', description: 'Befintlig kund utan bindningstid' },
  { value: 'BEFINTLIG_ADRESS_SAMMA_AVTAL', label: 'Befintlig adress med samma avtal', description: 'Hoppar över avtalssteg och erbjuder extratjänster' },
  { value: 'STOPP_KAN_INTE_LEVERERA', label: 'Stopp: kan inte leverera', description: 'Simulerat stoppfall för leveranshinder' },
  { value: 'AUTO_DETERMINISTIC', label: 'Standard (förutsägbart)', description: 'Baserat på personnummer, utan slump' },
];

const ADDRESS_OPTIONS: { value: MockAddressResult; label: string; description: string }[] = [
  { value: 'FOUND', label: 'Hitta adresser', description: 'Normalt sökresultat' },
  { value: 'NONE', label: 'Inga träffar', description: 'Returnerar tom lista' },
  { value: 'ERROR', label: 'API-fel', description: 'Simulerat nätverksfel' },
];

const MARKETING_CONSENT_OPTIONS: { value: MockMarketingConsentType; label: string; description: string }[] = [
  { value: 'HAS_CONSENT', label: 'Kund med samtycke för mail/SMS', description: 'CRM returnerar att samtycke redan finns' },
  { value: 'NO_CONSENT', label: 'Kund utan samtycke för mail/SMS', description: 'CRM returnerar att samtycke saknas' },
];

const EXISTING_EXTRAS_OPTIONS = [
  { key: 'BIXIA_NARA', label: 'Bixia nära', description: 'Kunden har redan Bixia nära' },
  { key: 'REALTIME_METER', label: 'Realtidsmätare', description: 'Kunden har redan realtidsmätare' },
  { key: 'SOLAR', label: 'Solceller', description: 'Kunden har redan solcellslösning' },
  { key: 'HOME_BATTERY', label: 'Hembatteri', description: 'Kunden har redan hembatteri' },
  { key: 'CHARGER', label: 'Laddbox', description: 'Kunden har redan laddbox' },
  { key: 'ATTIC_INSULATION', label: 'Tilläggsisolera vinden', description: 'Kunden har redan tilläggsisolering' },
] as const;

const ENTRY_OPTIONS: Array<{ value: MockEntryPreset; label: string; description: string }> = [
  { value: 'GENERAL', label: 'Generell ingång', description: 'Adress först, därefter produktval' },
  { value: 'PRODUCT_PAGE', label: 'Produktsida', description: 'Ett standardavtal är förvalt' },
  { value: 'PARTNER', label: 'Partnererbjudande', description: 'Ett rabatterat avtal är förvalt' },
];

// ELOMRADE_OPTIONS removed

const PHASE_LABELS: Record<FlowPhase, string> = {
  'PRODUCT_SELECT': 'Produktval',
  'PRODUCT_CLARIFY': 'Välj avtalsform',
  'ADDRESS_SEARCH': 'Adresssökning',
  'IDENTIFY': 'Identifiering',
  'FLOW_STOP': 'Stopp',
  'EXISTING_CONTRACT_EXTRAS': 'Befintligt avtal',
  'MOVE_OFFER': 'Flyttmatchning',
  'DETAILS': 'Datum & Kontakt',
  'TERMS': 'Villkor',
  'SIGNING': 'Signering',
  'CONFIRMATION': 'Kvittens',
  'EXTRA_BIXIA_NARA': 'Bixia nära',
  'EXTRA_REALTIME_METER': 'Realtidsmätare',
  'APP_DOWNLOAD': 'Appnedladdning',
  'EXTRA_CONTACT': 'Kontaktintresse',
};

export const DevPanel = () => {
  const router = useRouter();
  const pathname = usePathname();
  const panel = useDevPanel();
  const settings = useMockSettings();
  const devState = { ...panel.state, ...settings.state };
  const { togglePanel, clearLogs } = panel;
  const { setMockScenario, setMockEntryPreset, setMockEntryProductId,
    setMockMarketingConsent, setMockExistingExtra, setMockAddressResult } = settings;

  const { state: flowState, resetState, startPrivateFlow, clearPersistedState } = useFlowState();

  const availableEntryProducts = PRODUCTS.filter((product) => {
    if (product.isCompanyOnly) return false;
    return devState.mockEntryPreset === 'PARTNER' ? !!product.isDiscounted : !product.isDiscounted;
  });

  const handleStartDemo = () => {
    const isGeneral = devState.mockEntryPreset === 'GENERAL';
    startPrivateFlow({
      entryPoint: isGeneral ? 'ADDRESS_FIRST' : 'PRODUCT_FIRST',
      entryOffer: isGeneral
        ? null
        : {
            source: devState.mockEntryPreset === 'PARTNER' ? 'PARTNER' : 'PRODUCT_PAGE',
            productId: devState.mockEntryProductId,
          },
    });
    clearLogs();
    router.push(`${pathname}?step=${isGeneral ? 'ADDRESS_SEARCH' : 'PRODUCT_SELECT'}`);
  };

  const handleResetAll = () => {
    resetState();
    clearLogs();
    clearPersistedState();
    window.location.href = window.location.pathname;
  };

  const formatPersonalIdentityNumber = (value: string | null) => {
    if (!value) return '—';
    const digits = value.replace(/\D/g, '');
    return digits.length >= 8 ? `${digits.slice(0, 8)}-****` : '********-****';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatJson = (data: unknown) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  // Determine which mock options to show based on current phase
  const currentPhase = devState.currentPhase;
  const showAddressMock = currentPhase === 'ADDRESS_SEARCH';
  const showScenarioMock = currentPhase === 'IDENTIFY';
  const shouldShowExistingCustomerMocks =
    devState.mockScenario === 'FLYTT' ||
    devState.mockScenario === 'BYTE' ||
    devState.mockScenario === 'BYTE_NO_BINDING' ||
    devState.mockScenario === 'BEFINTLIG_ADRESS_SAMMA_AVTAL' ||
    devState.mockScenario === 'AUTO_DETERMINISTIC';
  const showMarketingConsentMock = showScenarioMock && shouldShowExistingCustomerMocks;
  const showExistingExtrasMock = showScenarioMock && shouldShowExistingCustomerMocks;
  const privateState = flowState.customerType === 'PRIVATE' ? flowState : null;
  const selectedScenarioMock = SCENARIO_OPTIONS.find((option) => option.value === devState.mockScenario)?.label
    || devState.mockScenario;
  const activeEntryLabel = privateState?.entryPoint === 'ADDRESS_FIRST'
    ? 'Generell, adress först'
    : privateState?.entryOffer?.source === 'PARTNER'
      ? 'Partnererbjudande'
      : 'Produktsida';
  const activeOffer = privateState?.entryOffer
    ? PRODUCTS.find((product) => product.id === privateState.entryOffer?.productId)?.name || privateState.entryOffer.productId
    : 'Inget förvalt erbjudande';
  const agreementPath = !privateState
    ? '—'
    : privateState.scenario === 'FLYTT'
      ? privateState.moveChoice === 'MOVE_EXISTING'
        ? 'Flytta befintligt avtal'
        : privateState.moveChoice === 'NEW_ON_NEW_ADDRESS'
          ? 'Ytterligare adress'
          : 'Väntar på flyttval'
      : privateState.scenario === 'BYTE'
        ? 'Byte på befintlig adress'
        : privateState.scenario === 'EXTRA'
          ? 'Samma avtal på adressen'
          : privateState.scenario === 'NY'
            ? 'Nyteckning'
            : 'Inte bestämt';
  const facilityValue = !privateState?.facilityHandling
    ? '—'
    : privateState.facilityHandling.mode === 'FETCH_WITH_POWER_OF_ATTORNEY'
      ? 'Fullmakt'
      : privateState.facilityHandling.facilityId || privateState.facilityHandling.mode;
  const invoiceValue = privateState?.invoice?.address
    ? formatInvoiceAddress(privateState.invoice)
    : '—';
  const existingExtras = privateState?.customer.extraServices;
  const isAdditionalAddress = privateState?.moveChoice === 'NEW_ON_NEW_ADDRESS';
  const existingContactServiceIds = new Set<string>(existingExtras?.contactMeServices ?? []);
  const remainingExtras = [
    isAdditionalAddress || !existingExtras?.bixiaNara.selected ? 'Bixia nära' : null,
    isAdditionalAddress || !existingExtras?.realtimeMeter.selected ? 'Realtidsmätare' : null,
    ...EXISTING_EXTRAS_OPTIONS
      .filter((option) => !['BIXIA_NARA', 'REALTIME_METER'].includes(option.key))
      .filter((option) => isAdditionalAddress || !existingContactServiceIds.has(option.key))
      .map((option) => option.label),
  ].filter((label): label is string => !!label);

  return (
    <>
      {/* Toggle button - always visible */}
      <button 
        className={`${styles.toggleButton} ${devState.isOpen ? styles.open : ''}`}
        onClick={togglePanel}
        title={devState.isOpen ? 'Stäng backend-vy' : 'Öppna backend-vy'}
      >
        {devState.isOpen ? '→' : '←'}
        <span className={styles.toggleLabel}>
          {devState.isOpen ? 'Stäng' : 'Backend'}
        </span>
      </button>

      {/* Main panel */}
      <div className={`${styles.panel} ${devState.isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <h2 className={styles.title}>🔧 Backend & State</h2>
            <button 
              className={styles.resetButton} 
              onClick={handleResetAll}
              title="Återställ all data och börja om"
            >
              Återställ
            </button>
          </div>
          <p className={styles.subtitle}>
            Steg: <strong>{PHASE_LABELS[currentPhase] || currentPhase}</strong>
          </p>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Starta demo</h3>
            <p className={styles.sectionDesc}>Välj hur kunden kommer in i flödet.</p>
            <div className={styles.scenarioOptions}>
              {ENTRY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`${styles.scenarioOption} ${devState.mockEntryPreset === option.value ? styles.selected : ''}`}
                >
                  <input
                    type="radio"
                    name="mockEntryPreset"
                    checked={devState.mockEntryPreset === option.value}
                    onChange={() => setMockEntryPreset(option.value)}
                    className={styles.radio}
                  />
                  <div className={styles.optionText}>
                    <span className={styles.optionLabel}>{option.label}</span>
                    <span className={styles.optionDesc}>{option.description}</span>
                  </div>
                </label>
              ))}
            </div>

            {devState.mockEntryPreset !== 'GENERAL' && (
              <label className={styles.selectLabel}>
                Förvalt avtal
                <select
                  className={styles.select}
                  value={devState.mockEntryProductId}
                  onChange={(event) => setMockEntryProductId(event.target.value)}
                >
                  {availableEntryProducts.map((product) => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </label>
            )}

            <button type="button" className={styles.startButton} onClick={handleStartDemo}>
              Starta om med valda inställningar
            </button>
          </section>

          {/* Context-aware Mock Selector */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>⚙️ Nästa API-svar</h3>
            
            {showAddressMock && (
              <>
                <p className={styles.sectionDesc}>
                  Vad ska adresssökningen returnera?
                </p>
                <div className={styles.scenarioOptions}>
                  {ADDRESS_OPTIONS.map(opt => (
                    <label 
                      key={opt.value} 
                      className={`${styles.scenarioOption} ${devState.mockAddressResult === opt.value ? styles.selected : ''}`}
                    >
                      <input 
                        type="radio" 
                        name="mockAddress"
                        value={opt.value}
                        checked={devState.mockAddressResult === opt.value}
                        onChange={() => setMockAddressResult(opt.value)}
                        className={styles.radio}
                      />
                      <div className={styles.optionText}>
                        <span className={styles.optionLabel}>{opt.label}</span>
                        <span className={styles.optionDesc}>{opt.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}

            {showScenarioMock && (
              <>
                <p className={styles.sectionDesc}>
                  Vilken kundtyp ska identifieringen returnera?
                </p>
                <div className={styles.scenarioOptions}>
                  {SCENARIO_OPTIONS.map(opt => (
                    <label 
                      key={opt.value} 
                      className={`${styles.scenarioOption} ${devState.mockScenario === opt.value ? styles.selected : ''}`}
                    >
                      <input 
                        type="radio" 
                        name="mockScenario"
                        value={opt.value}
                        checked={devState.mockScenario === opt.value}
                        onChange={() => setMockScenario(opt.value)}
                        className={styles.radio}
                      />
                      <div className={styles.optionText}>
                        <span className={styles.optionLabel}>{opt.label}</span>
                        <span className={styles.optionDesc}>{opt.description}</span>
                      </div>
                    </label>
                  ))}
                </div>

                {showMarketingConsentMock && (
                  <>
                    <p className={styles.sectionDesc}>
                      Vad ska CRM returnera för samtycke?
                    </p>
                    <div className={styles.scenarioOptions}>
                      {MARKETING_CONSENT_OPTIONS.map(opt => (
                        <label
                          key={opt.value}
                          className={`${styles.scenarioOption} ${devState.mockMarketingConsent === opt.value ? styles.selected : ''}`}
                        >
                          <input
                            type="radio"
                            name="mockMarketingConsent"
                            value={opt.value}
                            checked={devState.mockMarketingConsent === opt.value}
                            onChange={() => setMockMarketingConsent(opt.value)}
                            className={styles.radio}
                          />
                          <div className={styles.optionText}>
                            <span className={styles.optionLabel}>{opt.label}</span>
                            <span className={styles.optionDesc}>{opt.description}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </>
                )}

                {showExistingExtrasMock && (
                  <>
                    <p className={styles.sectionDesc}>
                      Vilka extratjänster har befintlig kund redan?
                    </p>
                    <div className={styles.scenarioOptions}>
                      {EXISTING_EXTRAS_OPTIONS.map(opt => (
                        <label
                          key={opt.key}
                          className={`${styles.scenarioOption} ${devState.mockExistingExtras[opt.key] ? styles.selected : ''}`}
                        >
                          <input
                            type="checkbox"
                            name={`mockExistingExtras-${opt.key}`}
                            checked={devState.mockExistingExtras[opt.key]}
                            onChange={(e) => setMockExistingExtra(opt.key, e.target.checked)}
                            className={styles.radio}
                          />
                          <div className={styles.optionText}>
                            <span className={styles.optionLabel}>{opt.label}</span>
                            <span className={styles.optionDesc}>{opt.description}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {!showAddressMock && !showScenarioMock && (
              <p className={styles.sectionDesc}>
                Inga vägval i detta steg. Navigera till Adress eller Identifiering för att se alternativ.
              </p>
            )}
          </section>

          {privateState && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Scenario playback</h3>
              <div className={styles.stateBox}>
                <div className={styles.stateRow}><span className={styles.stateLabel}>Ingång:</span><span className={styles.stateValue}>{activeEntryLabel}</span></div>
                <div className={styles.stateRow}><span className={styles.stateLabel}>Erbjudande:</span><span className={styles.stateValue}>{activeOffer}</span></div>
                <div className={styles.stateRow}><span className={styles.stateLabel}>Elområde:</span><span className={styles.stateValue}>{privateState.elomrade || '—'}</span></div>
                <div className={styles.stateRow}><span className={styles.stateLabel}>Valt CRM-mock:</span><span className={styles.stateValue}>{selectedScenarioMock}</span></div>
                <div className={styles.stateRow}><span className={styles.stateLabel}>Sparat scenario:</span><span className={styles.stateValue}>{privateState.scenario}</span></div>
                <div className={styles.stateRow}><span className={styles.stateLabel}>Avtalsspår:</span><span className={styles.stateValue}>{agreementPath}</span></div>
                <div className={styles.stateRow}><span className={styles.stateLabel}>Anläggnings-ID:</span><span className={styles.stateValue}>{facilityValue}</span></div>
                <div className={styles.stateRow}><span className={styles.stateLabel}>Fakturaadress:</span><span className={styles.stateValue}>{invoiceValue}</span></div>
                <div className={styles.stateRow}><span className={styles.stateLabel}>Kvar att erbjuda:</span><span className={styles.stateValue}>{remainingExtras.join(', ') || 'Inga'}</span></div>
              </div>
            </section>
          )}

          {/* Current Flow State */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>📊 Sparad data ({flowState.customerType})</h3>
            <div className={styles.stateBox}>
              {flowState.customerType === 'PRIVATE' ? (
                <>
                  <div className={styles.stateRow}>
                    <span className={styles.stateLabel}>Elområde:</span>
                    <span className={styles.stateValue}>{flowState.elomrade || '—'}</span>
                  </div>
                  <div className={styles.stateRow}>
                     <span className={styles.stateLabel}>Produkt:</span>
                     <span className={styles.stateValue}>{flowState.selectedProduct?.name || '—'}</span>
                   </div>
                   <div className={styles.stateRow}>
                     <span className={styles.stateLabel}>Adress:</span>
                     <span className={styles.stateValue}>
                       {flowState.valdAdress 
                         ? `${flowState.valdAdress.street} ${flowState.valdAdress.number}, ${flowState.valdAdress.city}`
                         : '—'}
                     </span>
                   </div>
                   <div className={styles.stateRow}>
                     <span className={styles.stateLabel}>Boendeform:</span>
                     <span className={styles.stateValue}>
                       {flowState.addressDetails.boendeform || '—'}
                       {flowState.addressDetails.boendeform === 'lägenhet' && flowState.addressDetails.apartmentNumber && 
                         ` (${flowState.addressDetails.apartmentNumber})`}
                     </span>
                   </div>
                   <div className={styles.stateRow}>
                     <span className={styles.stateLabel}>Identifierad:</span>
                     <span className={styles.stateValue}>
                       {flowState.isAuthenticated ? `Ja (${flowState.idMethod})` : 'Nej'}
                     </span>
                   </div>
                   <div className={styles.stateRow}>
                     <span className={styles.stateLabel}>Personnummer:</span>
                     <span className={styles.stateValue}>{formatPersonalIdentityNumber(flowState.personnummer)}</span>
                   </div>
                   <div className={styles.stateRow}>
                     <span className={styles.stateLabel}>Scenario:</span>
                     <span className={styles.stateValue}>{flowState.scenario}</span>
                   </div>
                   <div className={styles.stateRow}>
                     <span className={styles.stateLabel}>Extratj. (CRM):</span>
                     <span className={styles.stateValue}>
                       {flowState.customer.extraServices
                         ? [
                             flowState.customer.extraServices.bixiaNara.selected
                               ? `Bixia nära${flowState.customer.extraServices.bixiaNara.county ? ` (${flowState.customer.extraServices.bixiaNara.county})` : ''}`
                               : null,
                             flowState.customer.extraServices.realtimeMeter.selected ? 'Realtidsmätare' : null,
                             ...(flowState.customer.extraServices.contactMeServices ?? []).map((service) => {
                               switch (service) {
                                 case 'SOLAR':
                                   return 'Solceller';
                                 case 'HOME_BATTERY':
                                   return 'Hembatteri';
                                 case 'CHARGER':
                                   return 'Laddbox';
                                 case 'ATTIC_INSULATION':
                                   return 'Tilläggsisolera vinden';
                                 default:
                                   return null;
                               }
                             }),
                           ].filter(Boolean).join(', ') || 'Inga'
                         : '—'}
                     </span>
                   </div>
                   <div className={styles.stateRow}>
                     <span className={styles.stateLabel}>Kund:</span>
                     <span className={styles.stateValue}>{flowState.customer.name || '—'}</span>
                   </div>
                   <div className={styles.stateRow}>
                     <span className={styles.stateLabel}>E-post:</span>
                     <span className={styles.stateValue}>{flowState.customer.email || '—'}</span>
                   </div>
                   <div className={styles.stateRow}>
                     <span className={styles.stateLabel}>Mobil:</span>
                     <span className={styles.stateValue}>{flowState.customer.phone || '—'}</span>
                   </div>
                   <div className={styles.stateRow}>
                     <span className={styles.stateLabel}>Startdatum:</span>
                     <span className={styles.stateValue}>{flowState.startDate || '—'}</span>
                   </div>
                   <div className={styles.stateRow}>
                     <span className={styles.stateLabel}>Fakturaadress:</span>
                     <span className={styles.stateValue}>
                       {flowState.invoice?.address
                         ? formatInvoiceAddress(flowState.invoice)
                         : '—'}
                     </span>
                   </div>
                   <div className={styles.stateRow}>
                     <span className={styles.stateLabel}>Anläggnings-ID:</span>
                     <span className={styles.stateValue}>
                       {flowState.facilityHandling
                         ? flowState.facilityHandling.mode === 'MANUAL'
                           ? (flowState.facilityHandling.facilityId || '—')
                           : flowState.facilityHandling.mode === 'FROM_CRM'
                             ? `${flowState.facilityHandling.facilityId || '—'} (CRM)`
                             : 'Hämtas via fullmakt'
                         : '—'}
                     </span>
                   </div>
                   <div className={styles.stateRow}>
                     <span className={styles.stateLabel}>Villkor:</span>
                     <span className={styles.stateValue}>{flowState.termsAccepted ? '✅' : '❌'}</span>
                   </div>
                   <div className={styles.stateRow}>
                     <span className={styles.stateLabel}>Riskinfo:</span>
                     <span className={styles.stateValue}>{flowState.riskInfoAccepted ? '✅' : '—'}</span>
                   </div>
                   <div className={styles.stateRow}>
                     <span className={styles.stateLabel}>Marknadsf.:</span>
                     <span className={styles.stateValue}>
                       {flowState.marketingConsent?.email ? '✉️' : ''}
                       {flowState.marketingConsent?.sms ? '📱' : ''}
                       {!flowState.marketingConsent?.email && !flowState.marketingConsent?.sms ? '—' : ''}
                     </span>
                   </div>
                </>
              ) : (
                <>
                  <div className={styles.stateRow}>
                    <span className={styles.stateLabel}>Org.nr:</span>
                    <span className={styles.stateValue}>{flowState.orgNr || '—'}</span>
                  </div>
                  <div className={styles.stateRow}>
                    <span className={styles.stateLabel}>Företag:</span>
                    <span className={styles.stateValue}>{flowState.companyName || '—'}</span>
                  </div>
                  <div className={styles.stateRow}>
                    <span className={styles.stateLabel}>Anläggningar:</span>
                    <span className={styles.stateValue}>{flowState.facilityCount} st</span>
                  </div>
                  <div className={styles.stateRow}>
                    <span className={styles.stateLabel}>Förbrukning:</span>
                    <span className={styles.stateValue}>{flowState.totalConsumption} kWh</span>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* API Logs */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>📡 API-anrop</h3>
              {devState.apiLogs.length > 0 && (
                <button className={styles.clearButton} onClick={clearLogs}>
                  Rensa
                </button>
              )}
            </div>
            
            {devState.apiLogs.length === 0 ? (
              <p className={styles.emptyLogs}>Inga anrop ännu. Interagera med flödet för att se anrop här.</p>
            ) : (
              <div className={styles.logList}>
                {devState.apiLogs.map(log => (
                  <details key={log.id} className={styles.logEntry}>
                    <summary className={styles.logSummary}>
                      <span className={styles.logType}>{log.type}</span>
                      <span className={styles.logEndpoint}>{log.endpoint}</span>
                      <span className={styles.logTime}>{formatTime(log.timestamp)}</span>
                    </summary>
                    <div className={styles.logDetails}>
                      <div className={styles.logSection}>
                        <strong>Request:</strong>
                        <pre className={styles.logPre}>{formatJson(log.request)}</pre>
                      </div>
                      <div className={styles.logSection}>
                        <strong>Response:</strong>
                        <pre className={styles.logPre}>{formatJson(log.response)}</pre>
                      </div>
                      <div className={styles.logDuration}>
                        ⏱️ {log.duration}ms
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
};
