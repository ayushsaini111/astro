"use client";

import Image from "next/image";

import {
  Sparkles,
  Phone,
  Package,
  CalendarHeart,
  ChevronRight,
} from "lucide-react";

import { useRouter } from "next/navigation";

import {
  useSession,
} from "next-auth/react";
import PageHeader from "@/components/PageHeader";

export default function LandingPage() {
  const router = useRouter();

  const { data: session, status } =
    useSession();

  const isLoggedIn =
    status === "authenticated" &&
    session?.user;

  const user = session?.user;

  return (
    <div
      className="
        min-h-screen

        bg-[#FFF9F5]

        flex
        flex-col

        overflow-x-hidden
      "
    >
<PageHeader />
      {/* ── HERO ── */}
      <section
        className="
          flex-1

          w-full

          px-6
          md:px-16

          py-12
          md:py-20

          flex
          flex-col
          md:flex-row

          items-center

          gap-12

          max-w-7xl
          mx-auto
        "
      >

        {/* LEFT */}
        <div
          className="
            flex-1

            flex
            flex-col

            items-start

            gap-6
          "
        >

          {/* TAG */}
          <span
            className="
              text-xs

              px-3
              py-1.5

              rounded-full

              bg-primary-main/10

              text-primary-main

              font-medium
            "
          >
            🕉️ Vedic Astrology · Certified Experts
          </span>

          {/* HEADING */}
          <h1
            style={{
              fontFamily:
                "var(--font-primary)",

              fontSize:
                "clamp(2rem, 4vw, 3.5rem)",

              lineHeight: 1.1,
            }}
            className="
              font-semibold

              text-main
            "
          >

            Understand your life
            <br />

            <span
              style={{
                color:
                  "var(--primary-main)",
              }}
            >
              with clarity.
            </span>

          </h1>

          {/* DESC */}
          <p
            className="
              text-secondary

              body-default

              max-w-md

              text-[15px]
              leading-relaxed
            "
          >
            Not predictions.
            Just meaningful insights
            from certified pandits —
            available whenever you
            need guidance.
          </p>

          {/* BUTTONS */}
          <div
            className="
              flex
              items-center

              gap-3

              flex-wrap
            "
          >

            {isLoggedIn ? (
              <button
                onClick={() =>
                  router.push(
                    user?.role ===
                      "pandit"
                      ? "/pandit"
                      : "/consult"
                  )
                }
                className="
                  px-6
                  py-3

                  bg-primary-main

                  text-white

                  rounded-[20px]

                  hover:opacity-90

                  transition

                  text-sm
                  font-medium

                  cursor-pointer
                "
              >
                {user?.role ===
                "pandit"
                  ? "Go to Dashboard →"
                  : "Talk to an Expert →"}
              </button>
            ) : (
              <>
                <button
                  onClick={() =>
                    router.push(
                      "/login"
                    )
                  }
                  className="
                    px-6
                    py-3

                    bg-primary-main

                    text-white

                    rounded-[20px]

                    hover:opacity-90

                    transition

                    text-sm
                    font-medium

                    cursor-pointer
                  "
                >
                  Get Started Free →
                </button>

                <button
                  onClick={() =>
                    router.push(
                      "/login"
                    )
                  }
                  className="
                    px-6
                    py-3

                    border
                    border-black/10

                    bg-white/70

                    text-main

                    rounded-[20px]

                    hover:bg-black/5

                    transition

                    text-sm

                    cursor-pointer
                  "
                >
                  Login
                </button>
              </>
            )}

          </div>

          {/* SOCIAL */}
          <div
            className="
              flex
              items-center

              gap-4

              mt-2
            "
          >

            <div className="flex -space-x-2">

              {[
                "A",
                "R",
                "S",
                "M",
              ].map((l, i) => (
                <div
                  key={i}
                  className="
                    w-8
                    h-8

                    rounded-full

                    border-2
                    border-background

                    flex
                    items-center
                    justify-center

                    text-xs
                    font-bold

                    text-white
                  "
                  style={{
                    background:
                      "var(--primary-main)",

                    opacity:
                      0.7 +
                      i * 0.08,
                  }}
                >
                  {l}
                </div>
              ))}

            </div>

            <p
              className="
                text-xs

                text-secondary
              "
            >

              <span
                className="
                  font-semibold

                  text-main
                "
              >
                1,200+
              </span>{" "}
              sessions this month

            </p>

          </div>

        </div>

        {/* RIGHT */}
        <div
          className="
            flex-1

            flex
            justify-center
            md:justify-end

            relative
          "
        >

          {/* IMAGE */}
          <div
            className="
              relative

              rounded-[32px]

              overflow-hidden

              shadow-[0_20px_80px_rgba(0,0,0,0.12)]
            "
            style={{
              width:
                "min(420px, 90vw)",

              height:
                "min(480px, 60vw)",

              minHeight: 280,
            }}
          >

            <Image
              src="/hero.jpg"
              alt="Pandit session"
              fill
              className="
                object-cover

                scale-[1.02]

                transition-transform
                duration-700
              "
            />

            {/* OVERLAY */}
            <div
              className="
                absolute
                inset-0
              "
              style={{
                background:
                  "linear-gradient(to top, rgba(52,21,57,0.5) 0%, transparent 60%)",
              }}
            />

          </div>

          {/* FLOAT CARD */}
          {isLoggedIn && (
            <div
              className="
                absolute

                bottom-4
                left-0
                md:-left-8

                bg-white/80
                backdrop-blur-xl

                border
                border-black/5

                rounded-[20px]

                px-4
                py-3

                flex
                items-center

                gap-3

                shadow-sm
              "
              style={{
                maxWidth: 220,
              }}
            >

              <div
                className="
                  w-10
                  h-10

                  rounded-full

                  overflow-hidden

                  flex-shrink-0

                  border-2
                  border-white
                "
              >

                {user?.image ? (
                  <Image
                    src={user.image}
                    alt={
                      user.name ??
                      ""
                    }
                    width={40}
                    height={40}
                    className="
                      object-cover
                      w-full
                      h-full
                    "
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    className="
                      w-full
                      h-full

                      bg-primary-main/20

                      flex
                      items-center
                      justify-center
                    "
                  >

                    <span
                      className="
                        text-sm
                        font-bold

                        text-primary-main
                      "
                    >
                      {user?.name
                        ?.slice(
                          0,
                          1
                        )
                        .toUpperCase()}
                    </span>

                  </div>
                )}

              </div>

              <div className="min-w-0">

                <p
                  className="
                    text-xs
                    font-semibold

                    text-main

                    truncate
                  "
                >
                  {user?.username
                    ? `@${user.username}`
                    : user?.name}
                </p>

                <p
                  className="
                    text-xs

                    text-secondary
                  "
                >
                  {user?.role ===
                  "pandit"
                    ? "🕉️ Pandit"
                    : "✨ Member"}
                </p>

              </div>

            </div>
          )}

        </div>

      </section>

      {/* ── QUICK NAVIGATION ── */}
      <section
        className="
          w-full

          px-6
          md:px-16

          pb-16
        "
      >

        <div
          className="
            max-w-7xl
            mx-auto

            grid
            grid-cols-2
            lg:grid-cols-4

            gap-4
          "
        >

          {[
            {
              title:
                "Consult Experts",

              desc:
                "Talk instantly",

              icon: (
                <Phone size={22} />
              ),

              href: "/consult",

              bg:
                "bg-[#F4E8FF]",
            },

            {
              title: "Remedies",

              desc:
                "Spiritual guidance",

              icon: (
                <Sparkles size={22} />
              ),

              href:
                "/remedies",

              bg:
                "bg-[#FFF2E7]",
            },

            {
              title: "Products",

              desc:
                "Sacred essentials",

              icon: (
                <Package size={22} />
              ),

              href:
                "/products",

              bg:
                "bg-[#EAF7EE]",
            },

            {
              title:
                "Ceremonies",

              desc:
                "Book rituals",

              icon: (
                <CalendarHeart
                  size={22}
                />
              ),

              href:
                "/ceremonies",

              bg:
                "bg-[#FFF6DA]",
            },
          ].map((item) => (
            <button
              key={item.title}
              onClick={() =>
                router.push(
                  item.href
                )
              }
              className={`
                ${item.bg}

                rounded-[28px]

                p-5

                flex
                flex-col

                items-start

                gap-4

                border
                border-black/5

                hover:scale-[1.02]

                transition-all
                duration-300

                shadow-[0_10px_40px_rgba(0,0,0,0.04)]
              `}
            >

              {/* ICON */}
              <div
                className="
                  w-12
                  h-12

                  rounded-full

                  bg-white/80

                  flex
                  items-center
                  justify-center

                  text-main
                "
              >
                {item.icon}
              </div>

              {/* TEXT */}
              <div
                className="
                  flex
                  flex-col

                  items-start
                "
              >

                <h3
                  className="
                    text-sm
                    md:text-base

                    font-semibold

                    text-main
                  "
                >
                  {item.title}
                </h3>

                <p
                  className="
                    text-xs

                    text-secondary
                  "
                >
                  {item.desc}
                </p>

              </div>

              {/* CTA */}
              <div
                className="
                  mt-auto

                  flex
                  items-center

                  gap-1

                  text-primary-main

                  text-sm
                  font-medium
                "
              >

                Explore

                <ChevronRight
                  size={16}
                />

              </div>

            </button>
          ))}

        </div>

      </section>

    </div>
  );
}