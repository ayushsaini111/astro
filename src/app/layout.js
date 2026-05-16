import { Lora, DM_Sans } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import NavWrapper from "@/components/navigation/NavWrapper";

const Primary = Lora({
  variable: "--font-Lora-Serif",
  subsets: ["latin"],
  display: "swap",
});

const Secondary = DM_Sans({
  variable: "--font-DM_Sans-sans-serif",
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${Primary.variable} ${Secondary.variable} antialiased`}>
        <Providers>
          <div className="min-h-screen bg-[#F6EDE6]">

            <NavWrapper />

            <main className="pb-24 lg:pb-0">
              {children}
            </main>

          </div>
        </Providers>
      </body>
    </html>
  );
}