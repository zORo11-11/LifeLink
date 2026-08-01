import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Footer from '../components/Footer';

// Parcel static url import format
import animationVideo from 'url:../assets/animation.mp4';

const LandingPage = () => {
  return (
    <div className="lifelink-landing min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#EEF2FF] to-[#E0E7FF] text-slate-800 relative overflow-hidden flex flex-col">
      {/* Embedded CSS Styles */}
      <style>{`
        .glass-card-enhanced {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.7);
        }

        .network-pulse-glow {
          animation: networkPulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes networkPulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.75;
            transform: scale(1.03);
          }
        }
      `}</style>
      
      {/* Ambient Glow Orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none network-pulse-glow" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none network-pulse-glow" />

      {/* Main Container */}
      <div className="min-h-screen flex flex-col justify-between relative z-10">
        <Navbar />

        {/* Hero Section: FULL-BACKGROUND VIDEO HERO PANEL */}
        <section className="flex-1 flex items-center justify-center py-8 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            
            {/* Main Hero Wrapper */}
            <div className="relative overflow-hidden rounded-3xl border border-white/80 shadow-2xl shadow-blue-500/10 min-h-[500px] flex items-center">
              
              {/* 1. Full-Cover High Quality Video Layer */}
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-[105%] h-[105%] max-w-none object-cover -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
              >
                <source src={animationVideo} type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {/* 2. Soft Gradient Masking Across Full Width (Gives text legibility without obscuring video quality) */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/60 to-transparent z-10 pointer-events-none" />

              {/* 3. Content Layer (Left Side Text with Glass Overlay) */}
              <div className="relative z-20 grid grid-cols-1 md:grid-cols-2 w-full h-full">
                <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
                  <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 border border-blue-500/20 backdrop-blur-md self-start mb-6 shadow-sm">
                    Unified Connector System
                  </span>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
                    LifeLink Healthcare Platform
                  </h1>
                  <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed mb-8">
                    Centralized hospital organ allocation and blood donation management system. High-precision coordination for life-saving transfers powered by real-time logistics.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Link 
                      to="/register/hospital" 
                      className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg transition-all"
                    >
                      Get Started
                    </Link>
                    <a 
                      href="#portals" 
                      className="px-6 py-3 bg-white/80 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition-all"
                    >
                      View Portals
                    </a>
                  </div>
                </div>

                {/* Right empty column allows full visibility of the sharp video background on desktop */}
                <div className="hidden md:block" />
              </div>

            </div>

          </div>
        </section>
      </div>

      {/* Portal Navigation Section */}
      <section id="portals" className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Choose Your Portal
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Admin Portal Glass Card */}
            <div className="glass-card-enhanced rounded-2xl shadow-xl p-8 text-center border border-white/70 hover:border-blue-500/50 hover:bg-white/60 transition-all duration-300 transform hover:-translate-y-1 group">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🏢</div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">Hospital Admins</h3>
              <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                Hospital administrators can manage organ requests, blood sourcing, and patient records.
              </p>
              <div className="flex space-x-3 justify-center">
                <Link to="/login/hospital" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold shadow-md hover:bg-blue-700 transition-all">Login</Link>
                <Link to="/register/hospital" className="px-6 py-2.5 bg-white/60 border border-blue-600/40 text-blue-700 rounded-xl font-semibold hover:bg-blue-50/80 transition-all">Register</Link>
              </div>
            </div>

            {/* Donor Portal Glass Card */}
            <div className="glass-card-enhanced rounded-2xl shadow-xl p-8 text-center border border-white/70 hover:border-red-500/50 hover:bg-white/60 transition-all duration-300 transform hover:-translate-y-1 group">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🩸</div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">Donor</h3>
              <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                Blood donors can manage their profiles, view donation history, and respond to urgent requests.
              </p>
              <div className="flex space-x-3 justify-center">
                <Link to="/login/donor" className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold shadow-md hover:bg-red-700 transition-all">Login</Link>
                <Link to="/register/donor" className="px-6 py-2.5 bg-white/60 border border-red-600/40 text-red-700 rounded-xl font-semibold hover:bg-blue-50/80 transition-all">Register</Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* System Overview Section */}
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card-enhanced rounded-3xl p-8 sm:p-12 border border-white/60 shadow-2xl">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
              What LifeLink Does
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card icon="🚨" title="Urgent Blood Sourcing" description="Real-time location matching with instant donor contact details for emergency situations." />
              <Card icon="🤖" title="AI-Driven Triage Integrity" description="Automated validation of priority scores against objective lab vitals to ensure fair allocation." />
              <Card icon="🫁" title="Organ Allocation Engine" description="Automated matching using urgency, proximity, and ischemic decay metrics for optimal organ distribution." />
              <Card icon="🛡️" title="Donor Safety Guard" description="Automated 8-week donation eligibility checks to ensure donor health and safety." />
            </div>
          </div>
        </div>
      </section>

      {/* Footer Container */}
      <footer className="w-full relative z-10">
        <Footer />
      </footer>
    </div>
  );
};

export default LandingPage;