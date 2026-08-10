"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Stethoscope,
  Menu,
  X,
  ArrowRight,
  Clock,
  FileText,
  Users,
  TrendingUp,
  Shield,
  Zap,
  CheckCircle2,
  AlertCircle,
  Star,
  Check,
} from "lucide-react";

// --- 1. PREMIUM NAVBAR COMPONENT ---
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "Solutions", href: "#solutions" },
    { name: "Pricing", href: "#pricing" },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? "bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/50 py-3"
          : "bg-transparent py-5"
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-8 h-8 bg-white rounded-[10px] group-hover:scale-105 transition-transform duration-300">
              <Stethoscope className="w-5 h-5 text-black" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">QSync</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login">
              <button className="px-5 py-2 text-sm font-medium text-white border border-white/15 rounded-full hover:bg-white/5 hover:border-white/30 transition-all duration-200">
                Sign In
              </button>
            </Link>
            <Link href="/dashboard/receptionist">
              <button className="px-5 py-2 text-sm font-medium bg-white text-black rounded-full hover:bg-zinc-200 hover:scale-105 transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                Get Started
              </button>
            </Link>
          </div>

          <button
            className="md:hidden p-2 -mr-2 text-zinc-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-[#0a0a0a] pt-24 px-6 md:hidden"
          >
            <div className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-2xl font-semibold text-zinc-400 hover:text-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="h-px w-full bg-white/10 my-4" />
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <button className="w-full py-4 text-lg font-medium text-white border border-white/15 rounded-xl hover:bg-white/5">
                  Sign In
                </button>
              </Link>
              <Link href="/dashboard/receptionist" onClick={() => setIsMobileMenuOpen(false)}>
                <button className="w-full py-4 text-lg font-medium bg-white text-black rounded-xl hover:bg-zinc-200">
                  Get Started
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// --- 2. MAIN PAGE EXPORT ---
export default function QSyncPremiumPage() {
  const fadeUpVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
  };

  const staggerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-zinc-200 font-sans selection:bg-white/20">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 sm:pt-48 sm:pb-32 overflow-hidden flex flex-col items-center justify-center min-h-[90vh]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-white/[0.03] blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 text-center z-10">
          <motion.div initial="hidden" animate="visible" variants={staggerVariants}>
            <motion.div variants={fadeUpVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-300 mb-8 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              We raised $5M in Series A funding
            </motion.div>

            <motion.h1 variants={fadeUpVariants} className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-6 tracking-tight text-balance leading-[1.1]">
              Smart Queue Management for Modern Medical Clinics
            </motion.h1>

            <motion.p variants={fadeUpVariants} className="text-lg sm:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto text-balance leading-relaxed">
              Streamline patient flow, digitize prescriptions, and reduce wait times with QSync's intelligent healthcare platform built for clinics that care.
            </motion.p>

            <motion.div variants={fadeUpVariants} className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link href="/dashboard/receptionist">
                <button className="px-8 py-3.5 bg-white text-black font-semibold rounded-full hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.15)] flex items-center gap-2">
                  Get a Demo <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <button className="px-8 py-3.5 bg-transparent text-white font-medium rounded-full border border-white/20 hover:bg-white/5 transition-all duration-300">
                Watch Overview
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- FEATURES GRID (Bento Style) --- */}
      <section id="features" className="py-24 relative border-t border-white/5 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerVariants} className="text-center mb-20">
            <motion.p variants={fadeUpVariants} className="text-zinc-500 font-semibold text-xs tracking-widest uppercase mb-3">Powerful Features</motion.p>
            <motion.h2 variants={fadeUpVariants} className="text-3xl sm:text-4xl font-bold text-white">Everything Your Clinic Needs</motion.h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerVariants} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Clock, title: "Real-Time Queue Management", desc: "Monitor patient queues in real-time, reduce wait times, and optimize clinic workflows with intelligent scheduling." },
              { icon: FileText, title: "Digital Prescriptions", desc: "Generate, manage, and send prescriptions digitally. Seamless integration with pharmacy systems for immediate fulfillment." },
              { icon: Users, title: "Patient Management", desc: "Centralized patient records, medical history, and appointment tracking for better care coordination." },
              { icon: TrendingUp, title: "Advanced Analytics", desc: "Gain actionable insights into clinic performance, patient flow patterns, and operational metrics." },
              { icon: Shield, title: "HIPAA Compliant", desc: "Enterprise-grade security with end-to-end encryption and full compliance with healthcare regulations." },
              { icon: Zap, title: "Lightning Fast", desc: "Sub-second response times and 99.99% uptime guarantee for uninterrupted patient care." }
            ].map((feature, i) => (
              <motion.div key={i} variants={fadeUpVariants} whileHover={{ y: -5 }} className="p-8 rounded-2xl border border-white/5 bg-zinc-900/20 hover:bg-zinc-900/50 transition-colors">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 border border-white/10">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* --- SOLUTIONS SECTION --- */}
      <section id="solutions" className="py-24 relative border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariants} className="text-center mb-16">
            <p className="text-zinc-500 font-semibold text-xs tracking-widest uppercase mb-3">Problems We Solve</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Healthcare challenges, solved instantly</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { problem: "Long patient wait times", solution: "Real-time queue optimization reduces wait times by up to 40%" },
              { problem: "Manual prescription errors", solution: "Digital prescriptions eliminate manual errors and speed up fulfillment" },
              { problem: "Fragmented patient data", solution: "Centralized patient records accessible instantly across your clinic" },
              { problem: "Difficulty tracking metrics", solution: "Comprehensive dashboards with actionable insights in real-time" }
            ].map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariants} className="p-8 rounded-2xl border border-white/5 bg-zinc-900/20">
                <div className="flex gap-4 mb-6">
                  <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0"><AlertCircle className="w-4 h-4" /></div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Problem</p>
                    <p className="text-zinc-300 text-sm">{item.problem}</p>
                  </div>
                </div>
                <div className="h-px w-full bg-white/5 my-6" />
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center shrink-0"><CheckCircle2 className="w-4 h-4" /></div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Solution</p>
                    <p className="text-zinc-300 text-sm">{item.solution}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section id="pricing" className="py-24 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Simple, transparent pricing</h2>
            <p className="text-zinc-400">Choose the perfect plan for your clinic. No hidden fees.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="p-8 rounded-3xl border border-white/10 bg-zinc-900/20">
              <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
              <p className="text-zinc-400 text-sm mb-6">Perfect for small clinics just getting started.</p>
              <div className="mb-6"><span className="text-4xl font-bold text-white">$299</span><span className="text-zinc-500">/mo</span></div>
              <button className="w-full py-3 rounded-full border border-white/20 text-white font-medium hover:bg-white/5 transition-colors mb-8">Get Started</button>
              <div className="space-y-4">
                {["Up to 5 providers", "Queue management", "Basic analytics", "Email support"].map((f, i) => (
                  <div key={i} className="flex gap-3 text-sm text-zinc-400"><Check className="w-4 h-4 text-white" />{f}</div>
                ))}
              </div>
            </div>

            {/* Professional (Highlighted) */}
            <div className="p-8 rounded-3xl border border-white/20 bg-white/[0.03] relative transform md:-translate-y-4 shadow-2xl">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</div>
              <h3 className="text-xl font-bold text-white mb-2">Professional</h3>
              <p className="text-zinc-400 text-sm mb-6">Ideal for growing clinics with advanced needs.</p>
              <div className="mb-6"><span className="text-4xl font-bold text-white">$799</span><span className="text-zinc-500">/mo</span></div>
              <button className="w-full py-3 rounded-full bg-white text-black font-semibold hover:bg-zinc-200 transition-colors mb-8">Start Free Trial</button>
              <div className="space-y-4">
                {["Unlimited providers", "Full queue management", "Digital prescriptions", "Advanced analytics", "Priority support"].map((f, i) => (
                  <div key={i} className="flex gap-3 text-sm text-white"><Check className="w-4 h-4 text-white" />{f}</div>
                ))}
              </div>
            </div>

            {/* Enterprise */}
            <div className="p-8 rounded-3xl border border-white/10 bg-zinc-900/20">
              <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
              <p className="text-zinc-400 text-sm mb-6">Custom solutions for large healthcare networks.</p>
              <div className="mb-6"><span className="text-4xl font-bold text-white">Custom</span></div>
              <button className="w-full py-3 rounded-full border border-white/20 text-white font-medium hover:bg-white/5 transition-colors mb-8">Contact Sales</button>
              <div className="space-y-4">
                {["Everything in Professional", "Multi-location management", "White-label options", "Dedicated account manager"].map((f, i) => (
                  <div key={i} className="flex gap-3 text-sm text-zinc-400"><Check className="w-4 h-4 text-white" />{f}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/10 pt-20 pb-10 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-6 text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to transform your clinic?</h2>
          <p className="text-zinc-400 mb-8 max-w-2xl mx-auto text-lg">Join 500+ healthcare providers who are streamlining operations and improving patient experience.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard/receptionist">
              <button className="px-8 py-4 bg-white text-black font-semibold rounded-full hover:scale-105 transition-all shadow-lg w-full sm:w-auto">Start Free Trial</button>
            </Link>
            <button className="px-8 py-4 bg-transparent border border-white/20 text-white font-medium rounded-full hover:bg-white/5 transition-all w-full sm:w-auto">Schedule Demo</button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-zinc-500 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center"><Stethoscope className="w-3 h-3 text-black" /></div>
            <span className="font-bold text-white">QSync</span> © {new Date().getFullYear()}
          </div>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}