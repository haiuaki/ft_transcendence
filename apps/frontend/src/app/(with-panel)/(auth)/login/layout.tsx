import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in | ft_cluster",
};

export default function RootLayout({ children }: LayoutProps<"/login">) {
  return children;
}
