import "./globals.css";
import GoogleTranslate from "@/components/GoogleTranslate";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: "RIOT PLATFORM",
  description: "Stake with us.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <GoogleTranslate>
          {children}
        </GoogleTranslate>
      </body>
    </html>
  );
}