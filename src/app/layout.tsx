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
  return (
    <html lang="sv">
      <body>
        <FlowStateProvider>
          <DevPanelProvider>
            <div style={{ transition: 'margin-right 0.3s ease' }} id="app-wrapper">
              {children}
            </div>
            <DevPanel />
          </DevPanelProvider>
        </FlowStateProvider>
      </body>
    </html>
  );
}
