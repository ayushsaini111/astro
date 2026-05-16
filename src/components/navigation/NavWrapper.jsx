// components/navigation/NavWrapper.jsx
"use client";

import { usePathname } from "next/navigation";
import MobileBottomNav from "@/components/navigation/MobileBottomNav";
import DesktopNavbar from "@/components/navigation/DesktopNavbar";

export default function NavWrapper() {
  const pathname = usePathname();
  const hideNav = ["/login", "/username"].includes(pathname); // add any routes you want to hide nav on

  if (hideNav) return null;

  return (
    <>
      <DesktopNavbar />
      <MobileBottomNav />
    </>
  );
}