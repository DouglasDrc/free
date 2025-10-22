import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Video, Users, Shield, Award, ArrowRight, Phone } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-teal-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">MindConnect</span>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/login')}
              data-testid="nav-login-btn"
              className="text-teal-700 hover:text-teal-800 hover:bg-teal-50"
            >
              Login
            </Button>
            <Button 
              onClick={() => navigate('/register')}
              data-testid="nav-register-btn"
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-block">
                <span className="px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">
                  🎯 Your Mental Wellness Partner
                </span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Connect with
                <span className="block bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Licensed Therapists
                </span>
                Anytime, Anywhere
              </h1>
              <p className="text-lg text-gray-600">
                Experience professional online therapy through secure video calls. Browse verified therapists, book sessions instantly, and start your journey to better mental health.
              </p>
              <div className="flex gap-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/register?role=client')}
                  data-testid="hero-get-started-btn"
                  className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-8 py-6 text-lg"
                >
                  Get Started <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate('/register?role=therapist')}
                  data-testid="hero-join-therapist-btn"
                  className="border-2 border-teal-600 text-teal-700 hover:bg-teal-50 px-8 py-6 text-lg"
                >
                  Join as Therapist
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="w-full h-96 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-3xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Phone className="w-32 h-32 text-white/80" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose MindConnect?</h2>
            <p className="text-gray-600 text-lg">Professional therapy made accessible and convenient</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100">
              <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center mb-4">
                <Video className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">HD Video Calls</h3>
              <p className="text-gray-600">Crystal clear video and audio quality for seamless therapy sessions</p>
            </div>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Therapists</h3>
              <p className="text-gray-600">All therapists are licensed and thoroughly vetted professionals</p>
            </div>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">100% Secure</h3>
              <p className="text-gray-600">End-to-end encrypted sessions ensuring complete privacy</p>
            </div>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 border border-orange-100">
              <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Pay As You Go</h3>
              <p className="text-gray-600">Flexible coin-based system - only pay for the time you use</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 text-lg">Get started in 3 simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Browse Therapists</h3>
              <p className="text-gray-600">Search and filter therapists by specialization, experience, and ratings</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Recharge Coins</h3>
              <p className="text-gray-600">Add coins to your wallet - 100 INR = 100 coins</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Start Session</h3>
              <p className="text-gray-600">Connect instantly via video call - 100 coins per minute</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-teal-600 to-cyan-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Your Journey?</h2>
          <p className="text-xl mb-8 text-teal-50">Join thousands who have found support through MindConnect</p>
          <Button 
            size="lg" 
            onClick={() => navigate('/register')}
            data-testid="cta-get-started-btn"
            className="bg-white text-teal-700 hover:bg-teal-50 px-8 py-6 text-lg font-semibold"
          >
            Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400">© 2025 MindConnect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;