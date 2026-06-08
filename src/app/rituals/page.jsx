import PageHeader from "@/components/PageHeader";
import HeroCard from "@/components/rituals/hero";
import RecentRitualExperiences from "@/components/rituals/RecentRitualExperiences";
import RecommendedSection from "@/components/rituals/RecommendationSection";
import UpcomingLiveRituals from "@/components/rituals/UpcomingLiveRituals";

export default function Page() {
  // ✅ Organize rituals by category from data file
  const ritualsByCategory = {
    "Career": [
      {
        id: 1,
        title: "Career Growth Pooja",
        description: "Online spiritual ceremony to enhance focus and attract opportunities.",
        image: "/Rituals/ganeshji.jpg",
      },
      {
        id: 2,
        title: "Success Mantra Jaap",
        description: "Live online mantra chanting for professional advancement.",
        image: "/Rituals/havan.jpg",
      },
      {
        id: 3,
        title: "Saraswati Pooja",
        description: "Online wisdom and knowledge enhancement ceremony.",
        image: "/Rituals/diya.jpg",
      },
    ],
    "Finance": [
      {
        id: 4,
        title: "Wealth Ritual",
        description: "Online abundance ceremony for financial prosperity.",
        image: "/Rituals/coconut2.jpg",
      },
      {
        id: 5,
        title: "Lakshmi Pooja",
        description: "Online Goddess Lakshmi worship for financial stability.",
        image: "/logo.jpg",
      },
      {
        id: 6,
        title: "Kubera Mantra",
        description: "Online sacred chanting to attract wealth.",
        image: "/Rituals/coconut.png",
      },
    ],
    "Relationships": [
      {
        id: 7,
        title: "Love Harmony Ritual",
        description: "Online ceremony to strengthen relationship bonds.",
        image: "/Rituals/diya2.jpg",
      },
      {
        id: 8,
        title: "Family Unity Pooja",
        description: "Online ceremony to resolve family conflicts.",
        image: "/Rituals/havan.jpg",
      },
      {
        id: 9,
        title: "Marriage Blessing",
        description: "Online ceremony for finding ideal life partner.",
        image: "/Rituals/ganeshji.jpg",
      },
    ],
    "Wealth": [
      {
        id: 10,
        title: "Abundance Manifestation",
        description: "Online manifestation ceremony for wealth creation.",
        image: "/Rituals/coconut2.jpg",
      },
      {
        id: 11,
        title: "Golden Opportunity Pooja",
        description: "Online ceremony to attract business opportunities.",
        image: "/Rituals/diya.jpg",
      },
      {
        id: 12,
        title: "Prosperity Yantra",
        description: "Online sacred geometry creation for wealth flow.",
        image: "/Rituals/coconut.png",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#F6EDE6]">

      <PageHeader
        title="E-Pooja Rituals"
        subtitle="Live online spiritual experiences"
        notificationClassName="bg-white"
        profileClassName="bg-primary-main"
      />
      
      <div className="space-y-s40 md:space-y-s80 max-w-7xl mx-auto md:py-s64">
        <HeroCard />
        
        <RecommendedSection
          categories={["Career", "Finance", "Relationships", "Wealth"]}
          ritualsByCategory={ritualsByCategory}
        />
        
        <UpcomingLiveRituals
          rituals={[
            {
              image: "/Rituals/havan.jpg",
              liveText: "Live Now",
              ritualTitle: "Maha Mrityunjaya Online Jaap",
              date: "Join Live Session",
              buttonText: "Join Now",
            },
            {
              image: "/logo.jpg",
              liveText: "Starting Soon",
              ritualTitle: "Online Lakshmi Pooja",
              date: "Next Session: 8:00 PM",
              buttonText: "Book Seat",
            },
          ]}
        />
        
        <RecentRitualExperiences
          rituals={[
            {
              image: "/Rituals/diya2.jpg",
              title: "Online Wealth Harmony Ritual",
              subtitle: "Completed yesterday • 4.9★",
            },
            {
              image: "/Rituals/diya.jpg",
              title: "Virtual Career Success Pooja",
              subtitle: "Completed today • 5.0★",
            },
            {
              image: "/Rituals/coconut.png",
              title: "Live Relationship Healing Ritual",
              subtitle: "Completed 2 days ago • 4.8★",
            },
          ]}
        />
      </div>

    </div>
  );
}