"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Sparkles,
  Phone,
  Package,
  CalendarHeart,
  ChevronRight,
  Star,
  Users,
  Clock,
  Gift,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PageHeader from "@/components/PageHeader";

// Welcome Popup Component
function WelcomePopup({ isOpen, onClose, userName, onStartConsultation }) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full transform animate-scale-in">
        
        {/* Gradient Header */}
        <div className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 px-6 py-8 text-center">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Gift size={28} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome, {userName}! 🎉
            </h2>
            <p className="text-white/90 text-sm">
              Your spiritual journey begins here
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Your Free Consultation Awaits!
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Get started with a <span className="font-bold text-purple-600">10-minute free call</span> with our certified pandits to explore your spiritual path.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            {[
              { icon: "🔮", text: "Personalized guidance" },
              { icon: "🕉️", text: "Certified pandits" },
              { icon: "⏰", text: "Available 24/7" },
            ].map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm">
                <span className="text-lg">{benefit.icon}</span>
                <span className="text-gray-700">{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button
            onClick={onStartConsultation}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            Start Free Consultation
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Auto-close indicator */}
        <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-purple-600 to-pink-600 animate-shrink"></div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showWelcome, setShowWelcome] = useState(false);

  const isLoggedIn = status === "authenticated" && session?.user;
  const user = session?.user;

  // ✅ Check if user is new and hasn't seen popup before
  useEffect(() => {
    if (isLoggedIn && user) {
      // Check if popup has been shown before
      const hasSeenWelcome = localStorage.getItem('hasSeenWelcomePopup');
      
      if (!hasSeenWelcome) {
        // Check if user is new (created within last 24 hours)
        const userCreated = new Date(user.createdAt || Date.now());
        const now = new Date();
        const timeDiff = now.getTime() - userCreated.getTime();
        const hoursDiff = timeDiff / (1000 * 3600);
        
        // Show welcome popup for users created within last 24 hours
        if (hoursDiff < 24) {
          setTimeout(() => setShowWelcome(true), 1000);
        }
      }
    }
  }, [isLoggedIn, user]);

  // ✅ Handle popup close and mark as seen
  const handleCloseWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('hasSeenWelcomePopup', 'true');
  };

  // ✅ Handle start consultation from popup
  const handleStartConsultation = () => {
    handleCloseWelcome();
    router.push('/consult');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 overflow-x-hidden">
      
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-purple-300/20 to-pink-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-80 h-80 bg-gradient-to-br from-orange-300/20 to-yellow-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-gradient-to-br from-blue-300/20 to-indigo-300/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <PageHeader />

      {/* HERO SECTION */}
      <section className="relative flex-1 w-full px-6 md:px-16 py-16 md:py-24 flex flex-col md:flex-row items-center gap-16 max-w-7xl mx-auto">
        
        {/* LEFT CONTENT */}
        <div className="flex-1 flex flex-col items-start gap-8 z-10">
          
          {/* Premium Badge */}
          <div className="group flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border border-purple-200/50 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
            <div className="w-2.5 h-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              🕉️ Vedic Astrology • Certified Experts
            </span>
            <Star size={14} className="text-purple-500 group-hover:rotate-180 transition-transform duration-500" />
          </div>

          {/* Main Headline */}
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-black leading-[0.9] tracking-tight">
              <span className="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">
                Understand your
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent relative">
                life with clarity
                <div className="absolute -bottom-3 left-0 w-full h-2 bg-gradient-to-r from-purple-600/20 via-pink-500/20 to-orange-500/20 rounded-full"></div>
              </span>
            </h1>
          </div>

          {/* Description */}
          <p className="text-xl text-gray-600 max-w-xl leading-relaxed">
            Not predictions. Just meaningful insights from 
            <span className="font-bold text-gray-800"> certified pandits</span> — 
            available whenever you need guidance.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center gap-4 flex-wrap">
            {isLoggedIn ? (
              <button
                onClick={() => router.push(user?.role === "pandit" ? "/pandit" : "/consult")}
                className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-lg overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-3">
                  {user?.role === "pandit" ? "Go to Dashboard" : "Talk to an Expert"}
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </button>
            ) : (
              <>
                <button
                  onClick={() => router.push("/login")}
                  className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-lg overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-3">
                    Get Started Free
                    <Gift size={20} className="group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                </button>

                <button
                  onClick={() => router.push("/login")}
                  className="group px-8 py-4 bg-white/80 backdrop-blur-sm border-2 border-gray-200 hover:border-purple-300 text-gray-700 hover:text-purple-700 rounded-2xl font-bold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    Login
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </button>
              </>
            )}
          </div>

          {/* Enhanced Social Proof */}
          <div className="flex items-center gap-8 mt-8">
            <div className="flex -space-x-4">
              {["A", "R", "S", "M", "K"].map((l, i) => (
                <div
                  key={i}
                  className="w-14 h-14 rounded-full border-4 border-white bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg hover:scale-110 transition-transform duration-300"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {l}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill="#F59E0B" stroke="#F59E0B" />
                ))}
                <span className="text-lg font-bold text-gray-700 ml-2">4.9/5</span>
              </div>
              <p className="text-gray-600">
                <span className="font-black text-gray-800 text-lg">1,200+</span> happy sessions this month
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT IMAGE */}
        <div className="flex-1 flex justify-center md:justify-end relative z-10">
          <div className="relative group">
            
            {/* Glowing Background */}
            <div className="absolute -inset-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 rounded-[3rem] blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-700 animate-pulse"></div>
            
            {/* Main Image Container */}
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.2)] group-hover:shadow-[0_50px_140px_rgba(0,0,0,0.25)] transition-all duration-700"
                 style={{
                   width: "min(450px, 90vw)",
                   height: "min(550px, 70vw)",
                   minHeight: 350,
                 }}>
              
              <Image
                src="/hero.jpg"
                alt="Expert pandit consultation"
                fill
                className="object-cover scale-105 group-hover:scale-110 transition-transform duration-700"
              />
              
              {/* Enhanced Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
              
              {/* Live Badge */}
              <div className="absolute top-6 right-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-2xl shadow-lg animate-bounce">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                  Live Now
                </div>
              </div>
              
              {/* Stats Badge */}
              <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md rounded-2xl p-3 shadow-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Users size={16} className="text-purple-600" />
                  <span className="font-bold text-gray-800">500+ Online</span>
                </div>
              </div>
            </div>

            {/* Enhanced User Float Card */}
            {isLoggedIn && (
              <div className="absolute bottom-8 -left-8 bg-white/95 backdrop-blur-xl border border-white/50 rounded-3xl p-5 flex items-center gap-4 shadow-2xl max-w-[320px] hover:scale-105 transition-transform duration-300">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-lg">
                    {user?.image ? (
                      <Image
                        src={user.image}
                        alt={user.name ?? ""}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-white font-bold text-xl">
                          {user?.name?.slice(0, 1).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-white animate-pulse"></div>
                </div>
                
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-base">
                    Welcome back, {user?.username || user?.name}!
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    {user?.role === "pandit" ? (
                      <>🕉️ Verified Pandit</>
                    ) : (
                      <>✨ Premium Member</>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ENHANCED QUICK NAVIGATION */}
      <section className="w-full px-6 md:px-16 pb-20">
        <div className="max-w-7xl mx-auto">
          
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-6">
              Your Spiritual Journey Awaits
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore our comprehensive spiritual services designed for your growth
            </p>
          </div>

          {/* Enhanced Service Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Expert Consultation",
                desc: "Live guidance from certified pandits",
                icon: <Phone size={32} />,
                href: "/consult",
                gradient: "from-blue-500 to-cyan-500",
                bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
                badge: "24/7 Available",
                stats: "500+ Experts"
              },
              {
                title: "Spiritual Remedies",
                desc: "Personalized solutions for life challenges",
                icon: <Sparkles size={32} />,
                href: "/remedies",
                gradient: "from-purple-500 to-pink-500",
                bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
                badge: "Personalized",
                stats: "1000+ Solutions"
              },
              {
                title: "Sacred Products",
                desc: "Authentic spiritual items and essentials",
                icon: <Package size={32} />,
                href: "/allproducts",
                gradient: "from-emerald-500 to-teal-500",
                bgColor: "bg-gradient-to-br from-emerald-50 to-teal-50",
                badge: "Authentic",
                stats: "Premium Quality"
              },
              {
                title: "Live Ceremonies",
                desc: "Book traditional poojas and rituals",
                icon: <CalendarHeart size={32} />,
                href: "/ceremonies",
                gradient: "from-orange-500 to-yellow-500",
                bgColor: "bg-gradient-to-br from-orange-50 to-yellow-50",
                badge: "Live Streaming",
                stats: "HD Quality"
              },
            ].map((item, index) => (
              <div
                key={item.title}
                onClick={() => router.push(item.href)}
                className={`group relative cursor-pointer ${item.bgColor} rounded-3xl p-8 border border-white/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 overflow-hidden`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                
                {/* Background Glow */}
                <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-3xl`}></div>
                
                {/* Badge */}
                <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-700">
                  {item.badge}
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full min-h-[280px]">
                  
                  {/* Icon */}
                  <div className={`w-20 h-20 bg-gradient-to-r ${item.gradient} rounded-3xl flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                    {item.icon}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 group-hover:text-gray-900 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      {item.desc}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-2 mb-4">
                    <Clock size={16} className="text-green-500" />
                    <span className="text-sm font-semibold text-gray-700">{item.stats}</span>
                  </div>

                  {/* CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/30">
                    <span className={`font-bold bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>
                      Explore Now
                    </span>
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${item.gradient} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ✅ One-time Welcome Popup */}
      <WelcomePopup 
        isOpen={showWelcome} 
        onClose={handleCloseWelcome}
        onStartConsultation={handleStartConsultation}
        userName={user?.name || user?.username || "Friend"}
      />

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        
        .animate-scale-in {
          animation: scale-in 0.4s ease-out;
        }
        
        .animate-shrink {
          animation: shrink 5s linear;
        }
      `}</style>
    </div>
  );
}