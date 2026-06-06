import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import ProductsHeader from "@/components/ProductsHeader";
import PanditsClient from "@/components/Pandits/PanditsClient";

export default async function PanditsPage({ searchParams }) {
  // ✅ Get search and filter params
  const params = await searchParams;
  const search = params?.search || "";
  const category = params?.category || "All";

  // ✅ Same user logic
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  const session = await getServerSession(authOptions);

  let user = null;

  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
  }

  if (!user && session?.user?.email) {
    if (session.user.role === "pandit") {
      const pandit = await prisma.pandit.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      if (pandit) user = { id: pandit.id };
    } else {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
    }
  }

  // ✅ Build filter conditions
  const whereCondition = {
    isAvailable: true,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { speciality: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(category !== "All" && {
      speciality: { contains: category, mode: "insensitive" },
    }),
  };

  // ✅ Fetch filtered pandits
  const pandits = await prisma.pandit.findMany({
    where: whereCondition,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      speciality: true,
      profilePic: true,
      isAvailable: true,
    },
  });

  return (
    <main className="min-h-screen max-w-7xl mx-auto flex flex-col gap-s32 pb-[120px]">
      <ProductsHeader
        title="Pandits"
        subtitle="Connect with verified and experienced pandits"
        showSubtitle={true}
        showTabs={true}
        tabs={["All", "Vedic", "Puja", "Astrology", "Vastu"]}
        activeTab={category}
        searchPlaceholder="Search pandit..."
        searchValue={search}
        // ✅ Pass current params for filtering
        currentParams={{ search, category }}
      />

      <PanditsClient 
        pandits={pandits} 
        userId={user?.id}
      />
    </main>
  );
}