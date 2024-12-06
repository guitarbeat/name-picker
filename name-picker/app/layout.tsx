import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast'
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Name Picker | Make Better Decisions",
  description: "An intuitive tool to help you make decisions through tournament-style name picking and sorting.",
  keywords: ["name picker", "decision making", "tournament bracket", "sorting tool"],
  openGraph: {
    title: "Name Picker | Make Better Decisions",
    description: "An intuitive tool to help you make decisions through tournament-style name picking and sorting.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            {children}
            <Toaster 
              position="bottom-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#333',
                  color: '#fff',
                },
              }} 
            />
          </main>
        </Providers>
      </body>
    </html>
  )
}
