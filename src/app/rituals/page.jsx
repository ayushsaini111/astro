
import PageHeader from "@/components/PageHeader";
import HeroCard from "@/components/rituals/hero";
import RecentRitualExperiences from "@/components/rituals/RecentRitualExperiences";
import RecommendedSection from "@/components/rituals/RecommendationSection";
import UpcomingLiveRituals from "@/components/rituals/UpcomingLiveRituals";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#F6EDE6]  ">

      <PageHeader
        title="Rituals"
        subtitle="Guided spiritual experiences"
        notificationClassName="bg-white"
        profileClassName="bg-primary-main"
      />
      <div className="space-y-s40 md:space-y-s80 max-w-7xl mx-auto md:py-s64">
        <HeroCard />
        <RecommendedSection
          categories={[
            "Career",
            "Finance",
            "Relationships",
            "Wealth",
          ]}
          rituals={[
            {
              id: 1,
              title: "Career Growth Pooja",
              description:
                "Enhance focus, remove obstacles and attract new opportunities.",
              image: "/Rituals/ganeshji.jpg",
            },
            {
              id: 2,
              title: "Wealth Ritual",
              description:
                "Attract abundance and positive energy.",
              image: "/Rituals/coconut2.jpg",
            },
          ]}
        />
        <UpcomingLiveRituals
          rituals={[
            {
              image: "/Rituals/havan.jpg",
              liveText: "Live",
              ritualTitle: "Maha Mrityunjaya Jaap",
              date: "19 July 2026",
              buttonText: "Join Now",
            },
            {
              image: "/logo.jpg",
              liveText: "Upcoming",
              ritualTitle: "Lakshmi Pooja",
              date: "25 July 2026",
              buttonText: "Book Seat",
            },
          ]}
        />
        <RecentRitualExperiences
          rituals={[
            {
              image: "/Rituals/diya2.jpg",
              title: "Wealth Harmony Ritual",
              subtitle: "Completed last week",
            },
            {
              image: "/Rituals/diya.jpg",
              title: "Career Success Pooja",
              subtitle: "Completed yesterday",
            },
            {
              image: "/Rituals/coconut.png",
              title: "Relationship Healing Ritual",
              subtitle: "Completed 2 days ago",
            },
          ]}
        />
      </div>

    </div>
  );
}