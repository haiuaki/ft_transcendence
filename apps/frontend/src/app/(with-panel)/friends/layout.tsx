import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Friends",
};

export default function RootLayout({ children }: LayoutProps<"/friends">) {
  return children;
}
