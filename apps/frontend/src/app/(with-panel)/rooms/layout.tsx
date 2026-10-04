import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse rooms",
};

export default function RootLayout({ children }: LayoutProps<"/rooms">) {
  return children;
}
