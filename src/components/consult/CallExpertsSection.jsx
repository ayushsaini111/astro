import React from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

function CallExpertsSection({ pandits = [], requestedCalls = {}, loadingId, onRequestCall, userId }) {
  const { data: session } = useSession();
  const router = useRouter();

  // ✅ User is logged in if they have a NextAuth session OR an OTP userId
  const isLoggedIn = !!session?.user || !!userId;

  function handleCallClick(pandit) {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    onRequestCall(pandit);
  }

  return (
    <section className="flex flex-col gap-s24">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="heading-h5 text-main">Recommended Experts</h2>
        <button onClick={() => router.push("/pandits")} className="caption text-primary-light hover:opacity-80 transition-all">
          View All
        </button>
      </div>

      {/* Experts List */}
      <div className="bg-[#E8D8CC] rounded-r40 p-s16 lg:p-s24 flex flex-col gap-s16">

        {pandits.length === 0 && (
          <p className="caption text-secondary text-center py-4">
            No experts available right now
          </p>
        )}

        {pandits.map((pandit) => {
          const requested = !!requestedCalls[pandit.id];
          const loading = loadingId === pandit.id;

          return (
            <div key={pandit.id}
              className="bg-[#F5E8DE] rounded-r32 p-s16 flex items-center justify-between gap-s16">

              {/* Left */}
              <div className="flex items-center gap-s16">

                {/* Avatar */}
                <div className="w-s48 h-s48 rounded-full overflow-hidden flex-shrink-0 bg-primary-main/20">
                  {pandit.profilePic ? (
                    <Image
                      src={pandit.profilePic}
                      alt={pandit.name}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary-main font-bold text-lg">
                      {pandit.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-col gap-[2px]">
                  <span className="caption text-[#4A9B67]">● Online</span>
                  <h3 className="heading-h6 text-main">{pandit.name}</h3>
                  <p className="caption text-secondary">{pandit.speciality}</p>
                </div>

              </div>

              {/* Button */}
              <Button
                variant="primary"
                disabled={loading || requested}
                onClick={() => handleCallClick(pandit)}
                className="!rounded-full whitespace-nowrap !px-s16 !py-s8 disabled:opacity-50"
              >
                {loading ? "..." : requested ? "Requested ✓" : !isLoggedIn ? "Login to Call" : "Call Now"}
              </Button>

            </div>
          );
        })}

      </div>

      {/* ✅ Not logged in nudge */}
      {!isLoggedIn && (
        <p className="caption text-secondary text-center">
          <button onClick={() => router.push("/login")} className="text-primary-main underline">
            Login
          </button>{" "}
          to consult with our experts
        </p>
      )}

    </section>
  );
}

export default CallExpertsSection;