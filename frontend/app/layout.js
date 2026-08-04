import "./globals.css";

export const metadata = {
  title: "Notewell — AI Clinical Documentation",
  description:
    "Notewell: AI-powered clinical documentation assistant. 6-agent pipeline for patient history, SOAP notes, treatment plans, follow-ups, and discharge summaries.",
  openGraph: {
    title: "Notewell — AI Clinical Documentation",
    description:
      "AI-powered clinical documentation assistant with 6-agent pipeline.",
    siteName: "Notewell",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/notewell-logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/notewell-logo.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
