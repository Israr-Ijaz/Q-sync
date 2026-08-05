"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  QrCode,
  Monitor,
  Stethoscope,
  FlaskConical,
  ArrowRight,
  Menu,
  Activity,
  Globe
} from "lucide-react";

// --- COMPONENTS ---

const PhoneMockup = () => {
  return (
    <div className="relative w-[300px] h-[600px] bg-slate-900 rounded-[44px] border-[8px] border-slate-800 shadow-2xl overflow-hidden mx-auto">
      {/* Hardware Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-30 flex items-center justify-center gap-2">
        <div className="w-12 h-1.5 bg-slate-950 rounded-full"></div>
        <div className="w-2 h-2 bg-slate-950 rounded-full"></div>
      </div>

      {/* Status Bar */}
      <div className="absolute top-0 w-full h-12 bg-[#075E54] z-20 flex justify-between items-center px-6 pt-4 pb-1 text-[10px] text-white font-medium">
        <span>10:42</span>
        <div className="flex gap-1.5 items-center">
          <Globe className="w-3 h-3" />
          <div className="w-4 h-2.5 border border-white rounded-[2px] relative">
            <div className="absolute inset-[1px] bg-white w-2/3"></div>
          </div>
        </div>
      </div>

      {/* WhatsApp Header */}
      <div className="absolute top-12 w-full h-16 bg-[#075E54] z-20 flex items-center px-4 gap-3 shadow-md border-b border-[#064e46]">
        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center overflow-hidden border border-white/10">
          <Activity className="w-6 h-6 text-[#25D366]" />
        </div>
        <div className="flex flex-col">
          <span className="text-white font-semibold text-sm">Nexus Clinic OPD</span>
          <span className="text-emerald-200 text-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-[#25D366] rounded-full animate-pulse shadow-[0_0_5px_#25D366]"></span>
            Online
          </span>
        </div>
      </div>

      {/* Chat Background Pattern */}
      <div className="absolute inset-0 top-28 bg-[#0b141a] p-4 flex flex-col gap-4 overflow-hidden">

        {/* User Message (Right Aligned) */}
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="self-end bg-[#005c4b] text-white text-sm px-4 py-2 rounded-2xl rounded-tr-sm shadow-sm max-w-[80%]"
        >
          JOIN CLINIC
        </motion.div>

        {/* System Reply (Left Aligned) */}
        <motion.div
          initial={{ opacity: 0, x: -20, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.4 }}
          className="self-start bg-[#202c33] text-slate-200 text-sm px-4 py-3 rounded-2xl rounded-tl-sm shadow-lg max-w-[95%] border border-white/5"
        >
          <div className="font-semibold text-[#25D366] mb-1 flex items-center gap-1">
            <span className="text-lg">🎟️</span> Token Issued!
          </div>
          <div className="space-y-1 mt-2 text-[13px]">
            <p>Token Number: <strong className="text-lg text-white">#42</strong></p>
            <p className="text-slate-400">Est. Wait Time: ~15 mins</p>
            <p className="text-slate-400">Current Serving: #38</p>
          </div>

          {/* Mock Web Link Button */}
          <div className="mt-3 pt-3 border-t border-white/10 text-center text-[#34b7f1] font-medium flex items-center justify-center gap-2 hover:text-[#53c6f7] transition-colors cursor-pointer">
            <Globe className="w-4 h-4" /> Track Live on Web
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default function QSyncHomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-[#25D366]/30 overflow-hidden">

      {/* Ambient Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-[#25D366]/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      {/* 1. Sticky Glassmorphism Header */}
      <header className="sticky top-0 z-50 bg-slate-950/70 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-white flex items-center gap-1">
              QSync
              <span className="w-2.5 h-2.5 bg-[#25D366] rounded-full animate-pulse mt-1 shadow-[0_0_10px_rgba(37,211,102,0.8)]"></span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 font-medium text-slate-400">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-white transition-colors">How it Works</Link>
            <Link href="/login" className="text-[#25D366] hover:text-[#20bd5a] transition-colors flex items-center gap-1">
              Staff Portal <ArrowRight className="w-4 h-4" />
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <button className="hidden md:block px-6 py-2.5 bg-white/10 text-white font-medium rounded-full hover:bg-white/20 border border-white/10 transition-all shadow-lg backdrop-blur-sm">
              Book Demo
            </button>
            <button className="md:hidden p-2 text-white">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left Column */}
          <div className="max-w-2xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366]/10 text-[#25D366] font-semibold text-sm mb-6 border border-[#25D366]/20 backdrop-blur-md"
            >
              ⚡ No App Download Required for Patients
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 text-white"
            >
              End the Waiting Room Chaos with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#25D366] to-emerald-400">WhatsApp & Web</span> Queues.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-slate-400 mb-10 leading-relaxed font-light"
            >
              Patients scan a QR code, get real-time token alerts on their phone, and track their turn live on the web or your clinic TVs. Step in exactly on time.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button className="px-8 py-4 bg-[#25D366] text-slate-950 font-bold rounded-full hover:bg-[#20bd5a] transition-all shadow-[0_0_30px_rgba(37,211,102,0.2)] hover:shadow-[0_0_40px_rgba(37,211,102,0.4)] flex items-center justify-center gap-2">
                Start Free Trial
              </button>
              <button className="px-8 py-4 bg-white/5 text-white font-medium rounded-full hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-2 backdrop-blur-sm">
                See How it Works
              </button>
            </motion.div>
          </div>

          {/* Right Column: CSS Phone Mockup */}
          <motion.div
            animate={{ y: [-10, 10, -10] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="hidden lg:block relative z-10"
          >
            <PhoneMockup />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[550px] bg-[#25D366]/20 blur-[100px] rounded-[44px] -z-10"></div>
          </motion.div>
        </div>
      </section>

      {/* 3. Social Proof Banner */}
      <div className="bg-slate-900/50 py-6 border-y border-white/5 backdrop-blur-sm">
        <p className="text-center text-slate-500 font-medium text-sm tracking-widest uppercase">
          Designed for top OPDs. Built for high-speed clinic workflows.
        </p>
      </div>

      {/* 4. Features Section (Bento Grid) */}
      <section id="features" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">A complete digital operating system.</h2>
            <p className="text-slate-400 text-lg max-w-2xl font-light">Everything you need to manage patient flow, whether they are on WhatsApp or their mobile browser.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Card 1: Large */}
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              viewport={{ once: true }}
              className="md:col-span-2 bg-slate-900/40 rounded-[32px] p-10 border border-white/10 relative overflow-hidden group hover:border-[#25D366]/50 transition-colors backdrop-blur-md"
            >
              <div className="w-14 h-14 bg-slate-800 rounded-2xl shadow-inner border border-white/5 flex items-center justify-center mb-6">
                <QrCode className="w-7 h-7 text-[#25D366]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Instant Token Generation</h3>
              <p className="text-slate-400 max-w-md leading-relaxed font-light">
                Turn your waiting room into a digital lobby. The instant QR-to-WhatsApp flow means zero friction for patients and an automatically managed queue for your front desk.
              </p>
            </motion.div>

            {/* Card 2: Medium (Web Tracker) */}
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-slate-900/40 rounded-[32px] p-10 border border-white/10 relative overflow-hidden backdrop-blur-md group hover:border-[#34b7f1]/50 transition-colors"
            >
              <div className="w-14 h-14 bg-slate-800 rounded-2xl border border-white/5 flex items-center justify-center mb-6">
                <Monitor className="w-7 h-7 text-[#34b7f1]" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Live Web & TV Tracker</h3>
              <p className="text-slate-400 leading-relaxed text-sm font-light">
                Not a WhatsApp user? No problem. Patients get a secure web link to track their queue live, while your waiting room TV displays the current serving numbers.
              </p>
            </motion.div>

            {/* Card 3: Medium */}
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-slate-900/40 rounded-[32px] p-10 border border-white/10 backdrop-blur-md group hover:border-emerald-500/50 transition-colors"
            >
              <div className="w-14 h-14 bg-slate-800 rounded-2xl shadow-inner border border-white/5 flex items-center justify-center mb-6">
                <Stethoscope className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">1-Click Digital Rx</h3>
              <p className="text-slate-400 leading-relaxed text-sm font-light">
                A lightning-fast prescription dashboard designed specifically for high-volume doctors. Less typing, faster patient turnover.
              </p>
            </motion.div>

            {/* Card 4: Wide */}
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
              className="md:col-span-2 bg-[#075E54]/20 rounded-[32px] p-10 border border-[#25D366]/20 flex flex-col md:flex-row md:items-center justify-between gap-8 backdrop-blur-md"
            >
              <div>
                <div className="w-14 h-14 bg-slate-900/80 rounded-2xl shadow-inner border border-[#25D366]/20 flex items-center justify-center mb-6">
                  <FlaskConical className="w-7 h-7 text-[#25D366]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Lab & Pharmacy Network</h3>
                <p className="text-slate-300 max-w-md leading-relaxed font-light">
                  Automated dispatching straight to partner laboratories and pharmacies with a single click. Keep the entire care cycle connected.
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 5. How It Works */}
      <section id="how-it-works" className="py-24 bg-slate-900/20 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-16">Simple 3-Step Flow</h2>

          <div className="flex flex-col md:flex-row justify-center items-center gap-12 md:gap-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center max-w-xs relative">
              <div className="w-16 h-16 bg-slate-800 border-2 border-white/10 rounded-full flex items-center justify-center text-xl font-bold text-white mb-6 z-10">1</div>
              <h4 className="text-xl font-bold text-white mb-2">Scan QR</h4>
              <p className="text-slate-400 font-light">Patient scans the clinic standee using their phone camera.</p>
              <div className="hidden md:block absolute top-8 left-full w-full h-[2px] bg-gradient-to-r from-white/10 to-transparent -z-0 -translate-x-8"></div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center max-w-xs relative">
              <div className="w-16 h-16 bg-[#25D366] text-slate-950 rounded-full flex items-center justify-center text-xl font-bold mb-6 z-10 shadow-[0_0_20px_rgba(37,211,102,0.3)]">2</div>
              <h4 className="text-xl font-bold text-white mb-2">Get Token</h4>
              <p className="text-slate-400 font-light">Receive a live token via WhatsApp or jump straight to the Web Tracker.</p>
              <div className="hidden md:block absolute top-8 left-full w-full h-[2px] bg-gradient-to-r from-white/10 to-transparent -z-0 -translate-x-8"></div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center max-w-xs relative">
              <div className="w-16 h-16 bg-slate-800 text-white rounded-full flex items-center justify-center text-xl font-bold mb-6 z-10 border-2 border-white/10">3</div>
              <h4 className="text-xl font-bold text-white mb-2">Walk In</h4>
              <p className="text-slate-400 font-light">Patient tracks the TV or their phone and enters exactly when it is their turn.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. High-Conversion Footer */}
      <footer className="bg-slate-950 pt-20 pb-10 border-t-2 border-[#25D366]/50 relative z-10">
        <div className="max-w-4xl mx-auto px-6 text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Ready to digitize your clinic?</h2>
          <button className="px-10 py-5 bg-[#25D366] text-slate-950 text-lg font-bold rounded-full hover:bg-[#20bd5a] transition-all shadow-[0_0_30px_rgba(37,211,102,0.2)] hover:shadow-[0_0_50px_rgba(37,211,102,0.4)]">
            Book a Demo Today
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">QSync</span> © {new Date().getFullYear()} All rights reserved.
          </div>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact Support</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}