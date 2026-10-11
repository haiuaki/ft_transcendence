import type { Metadata } from "next";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Room",
};

export default function Layout({ children }: LayoutProps<"/room/[id]">) {
  return (
    <>
      {children}
      <Toaster position="bottom-right" richColors closeButton />
    </>
  );
}
