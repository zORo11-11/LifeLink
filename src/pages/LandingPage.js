import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Footer from '../components/Footer';
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section - Empty container placeholder */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-center min-h-[300px]">
            <div className="text-center md:text-left md:w-1/2">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                LifeLink Healthcare Platform
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Centralized hospital organ allocation and blood donation management system
              </p>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="w-64 h-64 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-6xl">🏥</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Navigation Section */}
      <section className="bg-[#F8FAFC] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Choose Your Portal
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Admin Portal Card */}
            <div className="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-transparent hover:border-[#2563EB] transition-all group">
              <div className="text-5xl mb-4">🏢</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Hospital Admins</h3>
              <p className="text-gray-600 mb-6">
                Hospital administrators can manage organ requests, blood sourcing, and patient records.
              </p>
              <div className="flex space-x-3 justify-center">
                <Link 
                  to="/login/hospital" 
                  className="px-6 py-2 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#1D4ED8] transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register/hospital" 
                  className="px-6 py-2 border border-[#2563EB] text-[#2563EB] rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  Register
                </Link>
              </div>
            </div>

            {/* Donor Portal Card */}
            <div className="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-transparent hover:border-[#DC2626] transition-all group">
              <div className="text-5xl mb-4">🩸</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Donor</h3>
              <p className="text-gray-600 mb-6">
                Blood donors can manage their profiles, view donation history, and respond to urgent requests.
              </p>
              <div className="flex space-x-3 justify-center">
                <Link 
                  to="/login/donor" 
                  className="px-6 py-2 bg-[#DC2626] text-white rounded-lg font-medium hover:bg-[#B91C1C] transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register/donor" 
                  className="px-6 py-2 border border-[#DC2626] text-[#DC2626] rounded-lg font-medium hover:bg-red-50 transition-colors"
                >
                  Register
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* System Overview Section */}
      <section className="bg-[#2563EB] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-black.0
          -800 mb-12">
            What LifeLink does
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card 
              icon="🚨"
              title="Urgent Blood Sourcing"
              description="Real-time location matching with instant donor contact details for emergency situations."
            />
            <Card 
              icon="🤖"
              title="AI-Driven Triage Integrity"
              description="Automated validation of priority scores against objective lab vitals to ensure fair allocation."
            />
            <Card 
              icon="🫁"
              title="Organ Allocation Engine"
              description="Automated matching using urgency, proximity, and ischemic decay metrics for optimal organ distribution."
            />
            <Card 
              icon="🛡️"
              title="Donor Safety Guard"
              description="Automated 8-week donation eligibility checks to ensure donor health and safety."
            />
          </div>
        </div>
      </section>
      <section className="bg-[#2563EB] py-16">
        <div>
          <Footer/>
        </div>
</section>
    </div>
  );
};

export default LandingPage;