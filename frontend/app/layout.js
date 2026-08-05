import "./globals.css";

export const metadata = {
  title: "NotWell — AI Clinical Documentation",
  description:
    "NotWell: AI-powered clinical documentation assistant. 6-agent pipeline for patient history, SOAP notes, treatment plans, follow-ups, and discharge summaries.",
  openGraph: {
    title: "NotWell — AI Clinical Documentation",
    description:
      "AI-powered clinical documentation assistant with 6-agent pipeline.",
    siteName: "NotWell",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/notwell-logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/notwell-logo.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
