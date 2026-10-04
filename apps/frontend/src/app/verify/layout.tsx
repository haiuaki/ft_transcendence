import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentification",
};

export default function Layout({ children }: LayoutProps<"/verify">) {
  return children;
}
