import type { Metadata } from "next";
import { Geist, Geist_Mono, Quicksand } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Nothern Lights Learning Center ( LMS )",
  description: "Native Language Learning Center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (async function() {
            try {
              const user = JSON.parse(localStorage.getItem('nllc_user'));
              if (user && user.email) {
                // Note: Using fetch directly in inline script for bootstrap
                const baseUrl = '/api/rest';
                const response = await fetch(baseUrl + '/users?email=' + encodeURIComponent(user.email));
                const data = await response.json();
                if (data.data && data.data.preferences && data.data.preferences.darkMode) {
                  document.documentElement.classList.add('dark');
                }
              }
            } catch (e) {}
          })();
        `}} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${quicksand.variable} antialiased`}
        style={{ fontFamily: 'var(--font-quicksand)' }}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
