import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat",
};

export default function RootLayout({ children }: LayoutProps<"/chat/[username]">) {
  return children;
}
