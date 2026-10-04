import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create a room | FT_Cluster",
};

export default function RootLayout({ children }: LayoutProps<"/rooms/create">) {
  return children;
}
