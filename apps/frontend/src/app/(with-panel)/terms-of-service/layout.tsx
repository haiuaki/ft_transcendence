import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of service",
};

export default function RootLayout({ children }: LayoutProps<"/terms-of-service">) {
  return children;
}
