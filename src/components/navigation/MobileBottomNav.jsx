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
  { label: "Profile",   href: "/pandit/profile",  icon: "/icons/profile.svg" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isPandit = session?.user?.role === "pandit";
  const links = isPandit ? panditLinks : userLinks;

  return (
   <nav
  className="
    fixed
    bottom-s16
    left-1/2
    -translate-x-1/2

    w-[calc(100%-32px)]
    max-w-md

    bg-white
    rounded-r40
    border
    border-black/5

    z-50
    lg:hidden

    shadow-[0_10px_40px_rgba(0,0,0,0.08)]
    backdrop-blur-xl
  "
>

  <div
    className="
      flex
      items-center
      justify-around
      py-s16
      px-s16
    "
  >

    {links.map((link) => {

      const isActive =
        pathname === link.href;

      return (
        <Link
          key={link.href}
          href={link.href}
          className="
            flex
            flex-col
            items-center
            justify-center
            gap-s6
            min-w-[52px]
          "
        >

          {/* Icon */}
          <div
            className={`
              transition-all
              duration-300

              ${
                isActive
                  ? "scale-105"
                  : "opacity-70"
              }
            `}
          >

            <Image
              src={link.icon}
              alt={link.label}
              width={26}
              height={26}
            />

          </div>

          {/* Label */}
          <span
            className={`
              text-xs
              transition-all
              duration-300

              ${
                isActive
                  ? "text-primary-main font-medium"
                  : "text-secondary"
              }
            `}
          >
            {link.label}
          </span>

        </Link>
      );
    })}

  </div>

</nav>
  );
}