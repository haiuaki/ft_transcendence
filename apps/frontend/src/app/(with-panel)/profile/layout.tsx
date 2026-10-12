import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
};

export default function RootLayout({ children }: LayoutProps<"/friends">) {
  return children;
}
