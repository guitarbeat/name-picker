import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bias Sorter",
  description: "A tournament-style sorter for ranking your preferences",
  viewport: "width=device-width, initial-scale=1",
  icons: {
    icon: "/favicon.ico",
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#171923" },
  ],
  robots: {
    index: true,
    follow: true,
  },
}; 