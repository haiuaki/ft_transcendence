import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in | FT_Cluster",
};

export default function RootLayout({ children }: LayoutProps<"/login">) {
  return children;
}
