import { MockSettingsProvider } from '@/context/MockSettingsContext';
import type { Metadata } from "next";
import "@/styles/globals.css";
import { DevPanelProvider } from "@/context/DevPanelContext";
import { FlowStateProvider } from "@/context/FlowStateContext";
import { DevPanel } from "@/components/dev/DevPanel";

export const metadata: Metadata = {
  title: "Avtalsflöde",
  description: "Bixia avtalsflöde prototyp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const showDevTools = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_DEV_PANEL === 'true';

  return (
    <html lang="sv">
      <body>
        <MockSettingsProvider>
        <FlowStateProvider>
          {showDevTools ? (
            <DevPanelProvider>
              <div style={{ transition: 'margin-right 0.3s ease' }} id="app-wrapper">
                {children}
              </div>
              <DevPanel />
            </DevPanelProvider>
          ) : (
            <div id="app-wrapper">{children}</div>
          )}
        </FlowStateProvider>
        </MockSettingsProvider>
      </body>
    </html>
  );
}
