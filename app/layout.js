import "./globals.css";

export const metadata = {
  title: "RIOT PLATFORM",
  description: "Stake with us.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}