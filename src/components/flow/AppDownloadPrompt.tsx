"use client";

import { useMemo, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/Button';
import {
  BIXIA_NARA_MONTHLY_SEK,
  ContactMeServiceId,
  ExtraServicesSelection,
  REALTIME_METER_MONTHLY_SEK,
  REALTIME_METER_ONE_TIME_SEK,
} from '@/services/extraServicesService';
import styles from './AppDownloadPrompt.module.css';

interface AppDownloadPromptProps {
  selection?: ExtraServicesSelection | null;
  hasFinalExtrasStep?: boolean;
  onContinue: () => void;
  onBack?: () => void;
}

type DeviceType = 'IOS' | 'ANDROID' | 'DESKTOP' | 'UNKNOWN_MOBILE';

const IOS_APP_URL = 'https://apps.apple.com/se/search?term=bixia';
const ANDROID_APP_URL = 'https://play.google.com/store/search?q=bixia&c=apps';

const detectDeviceType = (): DeviceType => {
  if (typeof navigator === 'undefined') return 'DESKTOP';

  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  const isMobile = /mobile|iphone|ipad|ipod|android/.test(userAgent);

  if (isIOS) return 'IOS';
  if (isAndroid) return 'ANDROID';
  if (isMobile) return 'UNKNOWN_MOBILE';
  return 'DESKTOP';
};

const buildQrImageUrl = (url: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

const subscribeToDevice = () => () => {};
const getServerDeviceSnapshot = (): DeviceType => 'DESKTOP';

const contactServiceLabels: Record<ContactMeServiceId, string> = {
  HOME_BATTERY: 'Hembatteri',
  CHARGER: 'Laddbox',
  SOLAR: 'Solceller',
  ATTIC_INSULATION: 'Tilläggsisolera vinden',
};

const joinItems = (items: string[]): string => {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} och ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} och ${items[items.length - 1]}`;
};

export const AppDownloadPrompt = ({
  selection,
  hasFinalExtrasStep = true,
  onContinue,
  onBack,
}: AppDownloadPromptProps) => {
  const deviceType = useSyncExternalStore(
    subscribeToDevice,
    detectDeviceType,
    getServerDeviceSnapshot
  );

  const iosQrUrl = useMemo(() => buildQrImageUrl(IOS_APP_URL), []);
  const androidQrUrl = useMemo(() => buildQrImageUrl(ANDROID_APP_URL), []);
  const selectedDirectServices = useMemo(() => {
    const services: string[] = [];

    if (selection?.bixiaNara.selected) services.push('Bixia nära');
    if (selection?.realtimeMeter.selected) services.push('Realtidsmätare');

    return services;
  }, [selection]);

  const selectedContactServices = useMemo(
    () => (selection?.contactMeServices ?? []).map(serviceId => contactServiceLabels[serviceId]),
    [selection]
  );

  const totalMonthly = (selection?.bixiaNara.selected ? BIXIA_NARA_MONTHLY_SEK : 0) +
    (selection?.realtimeMeter.selected ? REALTIME_METER_MONTHLY_SEK : 0);
  const totalOneTime = selection?.realtimeMeter.selected ? REALTIME_METER_ONE_TIME_SEK : 0;
  const hasAnySelection = selectedDirectServices.length > 0 || selectedContactServices.length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.icon}>📲</div>

      <header className={styles.header}>
        <h2 className={styles.title}>Nästa steg: ladda ner appen</h2>
        <p className={styles.subtitle}>
          I appen kan du följa din förbrukning, se avtal och få bättre koll på din energi.
          {hasFinalExtrasStep ? ' Därefter får du ett sista frivilligt steg med kontaktönskemål.' : ''}
        </p>
      </header>

      <div className={styles.selectionSummary}>
        {hasAnySelection ? (
          <>
            <h3 className={styles.summaryTitle}>Dina val hittills</h3>
            {selectedDirectServices.length > 0 && (
              <p className={styles.summaryText}>
                Du har valt {joinItems(selectedDirectServices)}.
                {selection?.realtimeMeter.selected ? ' Realtidsmätaren skickas efter att beställningen slutförts.' : ''}
              </p>
            )}
            {selectedContactServices.length > 0 && (
              <p className={styles.summaryText}>
                Du vill bli kontaktad om {joinItems(selectedContactServices)}.
              </p>
            )}
            <div className={styles.priceBox}>
              <h4 className={styles.priceTitle}>Kostnadsöversikt tillägg</h4>
              {selection?.bixiaNara.selected && (
                <div className={styles.priceRow}>
                  <span>Bixia nära{selection.bixiaNara.county ? ` (${selection.bixiaNara.county})` : ''}</span>
                  <span>{BIXIA_NARA_MONTHLY_SEK} kr/mån</span>
                </div>
              )}
              {selection?.realtimeMeter.selected && (
                <>
                  <div className={styles.priceRow}>
                    <span>Realtidsmätare (engång)</span>
                    <span>{REALTIME_METER_ONE_TIME_SEK} kr</span>
                  </div>
                  <div className={styles.priceRow}>
                    <span>Realtidsmätare (månadsavgift)</span>
                    <span>{REALTIME_METER_MONTHLY_SEK} kr/mån</span>
                  </div>
                </>
              )}
              <div className={styles.totalRow}>
                <span>Summa engångskostnad</span>
                <span>{totalOneTime} kr</span>
              </div>
              <div className={styles.totalRow}>
                <span>Summa månadsavgift</span>
                <span>{totalMonthly} kr/mån</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <h3 className={styles.summaryTitle}>Inga extratjänster valda</h3>
            <p className={styles.summaryText}>
              Du kan alltid lägga till tjänster senare i Mina sidor.
            </p>
          </>
        )}
      </div>

      {deviceType === 'DESKTOP' ? (
        <div className={styles.qrGrid}>
          <div className={styles.qrCard}>
            <h3 className={styles.qrTitle}>iPhone (App Store)</h3>
            <img src={iosQrUrl} alt="QR-kod för App Store" className={styles.qrImage} />
            <a href={IOS_APP_URL} target="_blank" rel="noreferrer" className={styles.link}>
              Öppna App Store
            </a>
          </div>
          <div className={styles.qrCard}>
            <h3 className={styles.qrTitle}>Android (Google Play)</h3>
            <img src={androidQrUrl} alt="QR-kod för Google Play" className={styles.qrImage} />
            <a href={ANDROID_APP_URL} target="_blank" rel="noreferrer" className={styles.link}>
              Öppna Google Play
            </a>
          </div>
        </div>
      ) : (
        <div className={styles.mobileActions}>
          {(deviceType === 'IOS' || deviceType === 'UNKNOWN_MOBILE') && (
            <Button
              fullWidth
              onClick={() => {
                window.location.href = IOS_APP_URL;
              }}
            >
              Hämta i App Store
            </Button>
          )}

          {(deviceType === 'ANDROID' || deviceType === 'UNKNOWN_MOBILE') && (
            <Button
              fullWidth
              onClick={() => {
                window.location.href = ANDROID_APP_URL;
              }}
            >
              Hämta i Google Play
            </Button>
          )}
        </div>
      )}

      <div className={styles.footer}>
        <Button fullWidth onClick={onContinue}>
          {hasFinalExtrasStep ? 'Fortsätt till sista steget' : 'Gå till Mina Sidor'}
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
