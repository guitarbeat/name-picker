import { Inter } from "next/font/google";
import { ClientLayout } from "./components/ClientLayout";
import { metadata } from "./config/metadata";
import "./styles/globals.scss";

const inter = Inter({ subsets: ["latin"] });

export { metadata };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <ClientLayout>{children}</ClientLayout>
    </html>
  );
}
