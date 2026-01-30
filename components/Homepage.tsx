'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Zap,
  Brain,
  Sparkles,
  ArrowRight,
  Menu,
  X,
  Check,
  BarChart3,
  GitBranch,
  Lightbulb,
} from 'lucide-react';

export default function Homepage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">MindMap AI</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">
                Features
              </Link>
              <Link href="#benefits" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">
                Benefits
              </Link>
              <Link href="#pricing" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">
                Pricing
              </Link>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className="px-5 py-2 text-slate-700 font-medium hover:text-blue-600 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 hover:scale-105"
              >
                Get Started Free
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-200/50 py-4 space-y-4">
              <Link href="#features" className="block text-slate-600 hover:text-blue-600 font-medium">
                Features
              </Link>
              <Link href="#benefits" className="block text-slate-600 hover:text-blue-600 font-medium">
                Benefits
              </Link>
              <Link href="#pricing" className="block text-slate-600 hover:text-blue-600 font-medium">
                Pricing
              </Link>
              <div className="flex gap-3 pt-4 border-t border-slate-200/50">
                <Link href="/login" className="flex-1 px-4 py-2 text-center text-slate-700 font-medium">
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg"
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200/50 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">AI-Powered Idea Mapping</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
            Visualize Your
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-600">
              Thoughts With AI
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            Transform conversations into interactive mind maps. Branch your ideas, explore deeper insights, and visualize complex thoughts in real-time with AI-powered assistance.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/signup"
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 hover:scale-105 flex items-center gap-2"
            >
              Start Exploring Free
              <ArrowRight size={20} />
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all duration-200"
            >
              Learn More
            </Link>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-2xl blur-3xl -z-10"></div>
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-1 border border-slate-700/50">
              <div className="bg-slate-950 rounded-xl p-8 min-h-[400px] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 mx-auto flex items-center justify-center">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-slate-400">Interactive Mind Map Canvas</p>
                  <p className="text-sm text-slate-500">Nodes • Edges • AI Conversations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Everything you need to visualize and organize your thoughts
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-white/50 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <GitBranch className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Infinite Branching</h3>
              <p className="text-slate-600">
                Explore multiple perspectives. Create branches from any node and dive deeper into your ideas with unlimited branching.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white/50 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">AI-Powered Insights</h3>
              <p className="text-slate-600">
                Get intelligent responses and follow-up suggestions. Our AI understands context and helps you explore ideas deeper.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white/50 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Visual Analytics</h3>
              <p className="text-slate-600">
                Track your conversation patterns and node density. Understand how your thoughts connect and evolve over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-50/50 to-slate-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
                Why Choose MindMap AI?
              </h2>
              <div className="space-y-4">
                {[
                  'Spatial visualization of complex conversations',
                  'Real-time AI responses and suggestions',
                  'Instant branching to explore alternatives',
                  'Intuitive drag-and-drop interface',
                  'Persistent conversation history',
                  'Export your mind maps',
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-slate-700 font-medium text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-2xl blur-3xl"></div>
              <div className="relative bg-white/50 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Ask a question</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 mx-4 rotate-90" />
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <Brain className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Get AI insights</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 mx-4 rotate-90" />
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <GitBranch className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Branch & explore</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Simple Pricing
            </h2>
            <p className="text-xl text-slate-600">
              Start free, upgrade when you need more
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <div className="bg-white/50 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Starter</h3>
              <p className="text-slate-600 mb-6">Perfect for exploring</p>
              <div className="text-4xl font-bold text-slate-900 mb-1">Free</div>
              <p className="text-slate-600 text-sm mb-8">Forever free tier</p>
              <button className="w-full px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors mb-8">
                Get Started
              </button>
              <div className="space-y-3">
                {['5 mind maps', 'Basic AI responses', 'Manual saving'].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-blue-600" />
                    <span className="text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro Plan (Featured) */}
            <div className="relative md:scale-105 bg-gradient-to-br from-blue-500 to-blue-600 border border-blue-400 rounded-2xl p-8 text-white">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 px-4 py-1 rounded-full text-xs font-bold">
                MOST POPULAR
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-blue-100 mb-6">For serious explorers</p>
              <div className="text-4xl font-bold mb-1">$12</div>
              <p className="text-blue-100 text-sm mb-8">/month, billed yearly</p>
              <button className="w-full px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors mb-8">
                Get Started
              </button>
              <div className="space-y-3">
                {['Unlimited mind maps', 'Advanced AI insights', 'Auto-save', 'Export options'].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <Check className="w-4 h-4" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white/50 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Enterprise</h3>
              <p className="text-slate-600 mb-6">For teams and orgs</p>
              <div className="text-4xl font-bold text-slate-900 mb-1">Custom</div>
              <p className="text-slate-600 text-sm mb-8">Contact sales</p>
              <button className="w-full px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors mb-8">
                Contact Sales
              </button>
              <div className="space-y-3">
                {['Team collaboration', 'Custom integrations', 'Priority support', 'Advanced analytics'].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-blue-600" />
                    <span className="text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Ready to explore your ideas?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Start mapping your thoughts with AI today. No credit card required.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              Get Started Free
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/50 py-12 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-slate-900">MindMap AI</span>
              </div>
              <p className="text-slate-600 text-sm">Visualize your thoughts with AI.</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link href="#features" className="hover:text-blue-600 transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-blue-600 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200/50 pt-8 flex flex-col sm:flex-row items-center justify-between">
            <p className="text-slate-600 text-sm">© 2025 MindMap AI. All rights reserved.</p>
            <div className="flex gap-6 mt-4 sm:mt-0">
              <a href="#" className="text-slate-600 hover:text-blue-600 transition-colors">Twitter</a>
              <a href="#" className="text-slate-600 hover:text-blue-600 transition-colors">GitHub</a>
              <a href="#" className="text-slate-600 hover:text-blue-600 transition-colors">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Blob Animation Styles */}
      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
