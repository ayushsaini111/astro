import { Lora, DM_Sans } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

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
            <body className={` ${Primary.variable}${Secondary.variable} antialiased `}>

        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}