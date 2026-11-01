import "./globals.css";
import GoogleTranslate from "@/components/GoogleTranslate";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: "RIOT PLATFORM",
  description: "Stake with us.",
  manifest: "/manifest.json",
  themeColor: "#EBA043",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/riotapp-512.png" />
        <meta name="theme-color" content="#EBA043" />
      </head>
      <body>
        <GoogleTranslate>
          {children}
        </GoogleTranslate>
      </body>
    </html>
  );
}