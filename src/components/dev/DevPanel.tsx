"use client";

import { useDevPanel, MockScenarioType, MockAddressResult, MockMarketingConsentType, FlowPhase } from '@/context/DevPanelContext';
import { useFlowState } from '@/hooks/useFlowState';
import styles from './DevPanel.module.css';

// Phase-specific mock options
const SCENARIO_OPTIONS: { value: MockScenarioType; label: string; description: string }[] = [
  { value: 'NY_KUND', label: 'Ny kund', description: 'Kunden finns inte i systemet' },
  { value: 'FLYTT', label: 'Befintlig kund på annan adress', description: 'Kunden har ett befintligt avtal på en annan adress' },
  { value: 'BYTE', label: 'Kund med avtal på angiven adress', description: 'Befintlig kund med bindningstid' },
  { value: 'BYTE_NO_BINDING', label: 'Kund med avtal på angiven adress', description: 'Befintlig kund utan bindningstid' },
  { value: 'RANDOM', label: 'Automatiskt', description: 'Baserat på personnummer' },
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

// ELOMRADE_OPTIONS removed

const PHASE_LABELS: Record<FlowPhase, string> = {
  'PRODUCT_SELECT': 'Produktval',
  'ADDRESS_SEARCH': 'Adresssökning',
  'IDENTIFY': 'Identifiering',
  'MOVE_OFFER': 'Flyttmatchning',
  'DETAILS': 'Datum & Kontakt',
  'TERMS': 'Villkor',
  'RISK_INFO': 'Riskinformation',
  'SIGNING': 'Signering',
  'CONFIRMATION': 'Kvittens',
  'APP_DOWNLOAD': 'Appnedladdning',
};

export const DevPanel = () => {
  const { 
    state: devState, 
    togglePanel, 
    clearLogs, 
    setMockScenario, 
    setMockMarketingConsent,
    setMockAddressResult 
  } = useDevPanel();
  const { state: flowState, resetState } = useFlowState();

  const handleResetAll = () => {
    resetState();
    clearLogs();
    sessionStorage.clear();
    window.location.href = window.location.pathname;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatJson = (data: any) => {
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
  const showMarketingConsentMock =
    showScenarioMock &&
    devState.mockScenario !== 'NY_KUND';

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
              </>
            )}

            {!showAddressMock && !showScenarioMock && (
              <p className={styles.sectionDesc}>
                Inga vägval i detta steg. Navigera till Adress eller Identifiering för att se alternativ.
              </p>
            )}
          </section>

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
                     <span className={styles.stateValue}>{flowState.personnummer || '—'}</span>
                   </div>
                   <div className={styles.stateRow}>
                     <span className={styles.stateLabel}>Scenario:</span>
                     <span className={styles.stateValue}>{flowState.scenario}</span>
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
