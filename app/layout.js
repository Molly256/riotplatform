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
    <html lang="en" translate="no" className="notranslate">
      <head>
        <meta name="google" content="notranslate" />
        <style dangerouslySetInnerHTML={{__html: `
          .goog-te-banner-frame.skiptranslate { display: none !important; }
          body { top: 0 !important; }
        `}} />
      </head>
      <body translate="no" className="notranslate">
        <GoogleTranslate />
        <div className="translate">
          {children}
        </div>
      </body>
    </html>
  );
}