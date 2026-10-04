import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up | FT_Cluster",
};

export default function RootLayout({ children }: LayoutProps<"/signup">) {
  return children;
}
