import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
};

export default function RootLayout({ children }: LayoutProps<"/privacy-policy">) {
  return children;
}
