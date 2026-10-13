import type { Metadata } from "next";
import { Toaster } from "sonner";
import { PanelShell } from "@/src/components/panelShell";

export const metadata: Metadata = {
  title: "Home",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex h-screen w-full overflow-hidden bg-ui-panel text-black">
      <PanelShell >
        {children}
      </PanelShell>
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            borderRadius: "16px",
            padding: "16px",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.12)",
          },
        }}
      />
    </main>
  );
}
