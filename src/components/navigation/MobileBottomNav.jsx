'use client'

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const userLinks = [
  { label: "Home",       href: "/",           icon: "/Images/Group1.png" },
  { label: "Rituals",    href: "/rituals",     icon: "/Images/Group2.png" },
  { label: "Consult",    href: "/consult",     icon: "/Images/Group3.png"},
  { label: "Ceremonies", href: "/ceremonies",  icon: "/Images/Group4.png" },
  { label: "Remedies",   href: "/remedies",    icon: "/Images/Group4.png" },
];

const panditLinks = [
  { label: "Dashboard", href: "/pandit",          icon: "/icons/dashboard.svg" },
  { label: "Requests",  href: "/pandit/requests", icon: "/icons/requests.svg" },
  { label: "History",   href: "/pandit/history",  icon: "/icons/history.svg" },
  { label: "Earnings",  href: "/pandit/earnings", icon: "/icons/earnings.svg" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isPandit = session?.user?.role === "pandit";
  const links = isPandit ? panditLinks : userLinks;

  return (
    <nav className="fixed bottom-2 rounded-r40 left-0 w-full bg-white py-s6  border-t border-black/10 z-50 lg:hidden">
      <div className="flex justify-around items-center py-3">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center text-xs gap-0.5 transition-all ${
                isActive ? "text-primary-main font-semibold" : "text-secondary"
              }`}
            >
              <Image
                src={link.icon}
                alt={link.label}
                width={24}
                height={24}
                className={`transition-all ${
                  isActive ? "opacity-100" : "opacity-40"
                }`}
              />
              {link.label}
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-primary-main mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}