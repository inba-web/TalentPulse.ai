import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Sparkles,
  ArrowRight,
  Award,
  Building2,
  Users,
  FileBarChart2,
  Quote,
  LogIn,
  Zap,
  TrendingUp,
  Briefcase,
  CheckCircle2,
  Monitor,
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user: authUser } = useAuthStore();

  const quotes = [
    {
      quote: "Where High-Value Careers Take Shape at Rathinam Global Deemed to be University — The Legacy Continues.",
      author: "Rathinam Directorate of Placements",
      role: "Autonomous Career & Recruitment Directorate",
    },
    {
      quote: "Success in campus recruitment comes from industry-driven training meeting data-driven opportunity.",
      author: "RGU Corporate Relations",
      role: "Global University Placement Advisory",
    },
    {
      quote: "Bridging academic excellence with top MNC talent acquisition across Coimbatore and global technology hubs.",
      author: "University Relations Team",
      role: "Strategic Enterprise Partner Network",
    },
  ];

  const [activeQuoteIdx, setActiveQuoteIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveQuoteIdx((prev) => (prev + 1) % quotes.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-emerald-500 selection:text-black">
      
      {/* CLEAN HEADER BAR */}
      <header className="sticky top-0 z-50 bg-[#0A0E17]/95 backdrop-blur-md border-b border-slate-800/80 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Branding: Crisp White Badge with Rathinam & RGU Accreditation Logos */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-white rounded-xl px-3 py-1.5 shadow-lg border border-slate-200 flex items-center gap-3 group-hover:scale-[1.02] transition duration-200">
           
              {/* <div className="h-7 w-px bg-slate-300" /> */}
              <img
                src="/assets/rathinam_global_deemed_to_be_university.png"
                alt="Rathinam Global Deemed to be University"
                className="h-7 sm:h-9 w-auto object-contain"
              />
            </div>
          </Link>

          {/* Action Button Only */}
          <div className="flex items-center gap-3">
            {authUser ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-950/50 border border-emerald-400/30 transition cursor-pointer"
              >
                <span>Portal Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2.5 px-7 py-3 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black rounded-xl shadow-xl shadow-emerald-950/60 border border-emerald-300/40 transition cursor-pointer tracking-wider uppercase"
              >
                <LogIn className="w-4.5 h-4.5" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* FULL COVERAGE HERO SECTION — NO CARD BOX CONTAINER, NO GRADIENTS */}
      <section className="relative w-full min-h-[90vh] sm:min-h-screen flex flex-col items-center justify-center py-16 px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
        
        {/* Full Screen Background Image (rathinam_hero_building.jpg WITHOUT ANY GRADIENTS OR CARDS) */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/rathinam_hero_building.jpg"
            alt="Rathinam Global Deemed to be University Campus Building"
            className="w-full h-full object-cover filter brightness-[0.75]"
            loading="eager"
          />
          {/* Flat Subtle Dark Dimming Layer Only */}
          <div className="absolute inset-0 bg-black/45 z-10" />
        </div>

        {/* Hero Content — Direct High-Contrast Layout (Card Container Box Completely Removed) */}
        <div className="relative z-20 space-y-8 max-w-5xl mx-auto my-auto py-10">
          
          {/* Hero Tagline Badge with Crisp White Logo Container */}
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xl">
            {/* <Zap className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0" /> */}
            <img
              src="/assets/rathinam_global_deemed_to_be_university.png"
              alt="Rathinam Global Deemed to be University"
              className="h-7 sm:h-8 w-auto object-contain"
            />
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
            Where High-Value Careers Take Shape At <br className="hidden sm:block" />
            <span className="text-emerald-400 drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
              Rathinam Global University
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-100 max-w-3xl mx-auto leading-relaxed font-semibold drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
            TalentPulse.ai powers placement management for Rathinam Global Deemed to be University — featuring real-time ATS resume scoring, candidate drive management, verified corporate relations, and multi-crore placement benchmarks.
          </p>

          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-2xl shadow-emerald-950/80 border border-emerald-300/50 transition flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
            >
              <span>Login to Placement Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 max-w-5xl mx-auto">
            <div className="p-4 rounded-2xl bg-black/85 border border-slate-700/80 backdrop-blur-md text-center shadow-xl hover:border-emerald-400 transition duration-300">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">₹3 CRORE</div>
              <div className="text-[11px] font-bold text-slate-200 uppercase mt-0.5">Top Annual Package</div>
            </div>
            <div className="p-4 rounded-2xl bg-black/85 border border-slate-700/80 backdrop-blur-md text-center shadow-xl hover:border-emerald-400 transition duration-300">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">₹58 LPA</div>
              <div className="text-[11px] font-bold text-slate-200 uppercase mt-0.5">Super Dream Offers</div>
            </div>
            <div className="p-4 rounded-2xl bg-black/85 border border-slate-700/80 backdrop-blur-md text-center shadow-xl hover:border-emerald-400 transition duration-300">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">100%</div>
              <div className="text-[11px] font-bold text-slate-200 uppercase mt-0.5">Automated ATS Matching</div>
            </div>
            <div className="p-4 rounded-2xl bg-black/85 border border-slate-700/80 backdrop-blur-md text-center shadow-xl hover:border-emerald-400 transition duration-300">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">Coimbatore</div>
              <div className="text-[11px] font-bold text-slate-200 uppercase mt-0.5">Top Global Hub</div>
            </div>
          </div>

        </div>
      </section>

      {/* BIG SIZE FEATURED BANNER: PLACEMENT HIGHLIGHTS (AT THE TOP) */}
      <section className="py-16 bg-[#0B0F1A]/90 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-extrabold uppercase tracking-widest border border-emerald-500/30">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Placement Records Showcase</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Rathinam Global University Placement Highlights
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
              Celebrating high-package engineering achievements, super dream offers, and career transformations across leading global MNCs.
            </p>
          </div>

          {/* Big Size Image Showcase Banner */}
          <div className="relative rounded-3xl overflow-hidden border border-emerald-500/40 shadow-2xl bg-[#0F1422] p-3 sm:p-5 group">
            <img
              src="/assets/placement_highlights.png"
              alt="Rathinam Global Deemed to be University Placement Highlights — Student Record Offers"
              className="relative w-full h-auto rounded-2xl object-cover shadow-2xl transition-transform duration-500 group-hover:scale-[1.005]"
              loading="lazy"
            />
            <div className="relative mt-4 p-4 bg-black/90 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold">
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-200">
                  Features Record Offers: <strong className="text-emerald-400 font-black">₹3 Crore PA</strong>, <strong className="text-emerald-400 font-black">₹58 LPA</strong>, <strong className="text-emerald-400 font-black">₹57 LPA</strong>, <strong className="text-emerald-400 font-black">₹45 LPA</strong>, <strong className="text-emerald-400 font-black">₹41 LPA</strong>, and <strong className="text-emerald-400 font-black">₹35 LPA</strong>.
                </span>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer shadow-lg"
              >
                <span>Access Student Directory</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 3 CRORE RECORD POSTER SPOTLIGHT */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* 3 Crore Poster Showcase */}
          <div className="relative group">
            <div className="relative rounded-3xl overflow-hidden border border-emerald-500/40 bg-[#0F1422] shadow-2xl p-3">
              <img
                src="/assets/placement_3crore_poster.jpg"
                alt="K.B. Mohanarajan ₹3 Crore Per Annum Senior AI Architect Placement Poster"
                className="w-full h-auto rounded-2xl object-contain shadow-xl"
                loading="lazy"
              />
            </div>
          </div>

          {/* Information & Details */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Landmark University Achievement</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              ₹3 CRORE Per Annum <span className="text-emerald-400">Career Package</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              <strong className="text-white">K.B. MOHANARAJAN</strong> (M.E. Biometric and Cyber Security, Department of CSE) secured a historic offer of <strong className="text-emerald-400 font-black">₹3 Crore Per Annum</strong> as Senior AI Architect at a Top MNC — embodying Rathinam Global University's commitment to high-value technology careers.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#0F1422] border border-slate-800 space-y-1">
                <div className="text-xs font-extrabold text-white">Department of CSE</div>
                <div className="text-[11px] text-slate-400">Biometric &amp; Cyber Security Specialization</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#0F1422] border border-emerald-500/40 space-y-1">
                <div className="text-xs font-extrabold text-emerald-400">Senior AI Architect</div>
                <div className="text-[11px] text-slate-400">Placed at Top Tier Global MNC</div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/login')}
                className="px-7 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black rounded-xl shadow-xl border border-emerald-300/40 transition flex items-center gap-2 cursor-pointer"
              >
                <Briefcase className="w-4 h-4" />
                <span>Explore All Placed Candidates</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* RATHINAM CAMPUS LABS & FACILITIES GALLERY — PERFECT 3-COLUMN ALIGNED GRID */}
      <section className="py-20 bg-[#0B0F1A]/90 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-2">
            <h2 className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest">Autonomous Tech Facilities</h2>
            <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">Rathinam High-Tech Research Labs &amp; Workspaces</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
              Equipped with enterprise computing stations, cloud certifications, and live interactive hybrid learning centers.
            </p>
          </div>

          {/* 3-Column Perfectly Aligned Campus Lab Image Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Image 1: Modern Computer Lab (Green Wall Tech Lab) */}
            <div className="p-4 rounded-2xl bg-[#0F1422] border border-slate-800 space-y-4 shadow-xl hover:border-emerald-500/50 transition duration-300 flex flex-col justify-between group">
              <div className="rounded-xl overflow-hidden h-56 bg-slate-900 relative shadow-inner">
                <img
                  src="/assets/modern_computer_lab.jpg"
                  alt="High-Tech Modern Computer Workstation Center"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40" />
                <span className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-emerald-500 backdrop-blur-md text-[10px] font-black text-black uppercase tracking-wider">
                  Software Engineering Center
                </span>
              </div>
              <div className="space-y-1.5 flex-1">
                <h4 className="font-extrabold text-white text-base">High-Tech Development Lab</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Equipped with high-performance desktop rigs, coding stations, and software development suites for full-stack and AI engineering.
                </p>
              </div>
            </div>

            {/* Image 2: Tech Workspace Lab (Google & AWS Workstations) */}
            <div className="p-4 rounded-2xl bg-[#0F1422] border border-slate-800 space-y-4 shadow-xl hover:border-emerald-500/50 transition duration-300 flex flex-col justify-between group">
              <div className="rounded-xl overflow-hidden h-56 bg-slate-900 relative shadow-inner">
                <img
                  src="/assets/tech_workspace_lab.png"
                  alt="Google and AWS Certification Workstation Bays"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40" />
                <span className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-emerald-500 backdrop-blur-md text-[10px] font-black text-black uppercase tracking-wider">
                  Corporate Workstation Bay
                </span>
              </div>
              <div className="space-y-1.5 flex-1">
                <h4 className="font-extrabold text-white text-base">Google &amp; AWS Tech Workspace</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Dedicated corporate workstation bays featuring Google, Coursera, AWS, Qlik, and Cisco technical certification hubs.
                </p>
              </div>
            </div>

            {/* Image 3: Hybrid Learning Hub Classroom */}
            <div className="p-4 rounded-2xl bg-[#0F1422] border border-slate-800 space-y-4 shadow-xl hover:border-emerald-500/50 transition duration-300 flex flex-col justify-between group">
              <div className="rounded-xl overflow-hidden h-56 bg-slate-900 relative shadow-inner">
                <img
                  src="/assets/hybrid_learning_hub.png"
                  alt="Rathinam Hybrid Learning Hub Classroom"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40" />
                <span className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-emerald-500 backdrop-blur-md text-[10px] font-black text-black uppercase tracking-wider">
                  Hybrid Learning Hub
                </span>
              </div>
              <div className="space-y-1.5 flex-1">
                <h4 className="font-extrabold text-white text-base">Rathinam Hybrid Learning Hub</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Interactive technology classrooms featuring live hybrid stream capabilities and corporate mock interview desks.
                </p>
              </div>
            </div>

          </div>

          {/* Secondary 2-Column Campus Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
            <div className="p-4 rounded-2xl bg-[#0F1422] border border-slate-800 space-y-4 shadow-xl hover:border-emerald-500/50 transition duration-300 flex flex-col justify-between group">
              <div className="rounded-xl overflow-hidden h-56 bg-slate-900 relative shadow-inner">
                <img
                  src="/assets/graduate_coimbatore.jpg"
                  alt="Best Placement College in Coimbatore Rathinam Graduate"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40" />
                <span className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-emerald-500 backdrop-blur-md text-[10px] font-black text-black uppercase tracking-wider">
                  Placement Excellence
                </span>
              </div>
              <div className="space-y-1 flex-1">
                <h4 className="font-extrabold text-white text-base">Industry-Driven Talent Development</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Consistently recognized as 1st in Tamil Nadu under UGC 2023 Regulations with dedicated corporate training modules.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0F1422] border border-slate-800 space-y-4 shadow-xl hover:border-emerald-500/50 transition duration-300 flex flex-col justify-between group">
              <div className="rounded-xl overflow-hidden h-56 bg-slate-900 relative shadow-inner">
                <img
                  src="/assets/rathinam_benchmark_campus.jpg"
                  alt="Rathinam Benchmark Tech Campus Building"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40" />
                <span className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-emerald-500 backdrop-blur-md text-[10px] font-black text-black uppercase tracking-wider">
                  Benchmark Campus
                </span>
              </div>
              <div className="space-y-1 flex-1">
                <h4 className="font-extrabold text-white text-base">Autonomous University Campus</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  State-of-the-art academic &amp; technology campus setting the benchmark for higher education in Tamil Nadu.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* PLATFORM CAPABILITIES GRID */}
      <section className="py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-2">
            <h2 className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest">Placement Intelligence Features</h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Enterprise Management Powered by TalentPulse.ai</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="p-6 rounded-2xl bg-[#0F1422] border border-slate-800 hover:border-emerald-500/50 transition duration-200 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-white text-base">Deterministic ATS Matcher</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Evaluates candidate resumes against job descriptions with transparent weighted scores across technical skills, experience, and academic benchmarks.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0F1422] border border-slate-800 hover:border-emerald-500/50 transition duration-200 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Building2 className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-white text-base">Corporate Partner Relations</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Manages corporate partner profiles with exact physical addresses, Google Maps navigation links, and recruitment drive attendee rosters.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0F1422] border border-slate-800 hover:border-emerald-500/50 transition duration-200 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileBarChart2 className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-white text-base">Automated Excel Exports</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generates instant Excel spreadsheets (.xlsx) for placed candidates, unplaced directory, and overall student population with complete GPA metrics.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Motivational Quotes Section */}
      <section className="py-16 bg-[#0B0F1A]/80 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <Quote className="w-10 h-10 text-emerald-400 mx-auto opacity-80" />
          <blockquote className="text-lg sm:text-xl font-extrabold text-white italic leading-relaxed min-h-[80px] flex items-center justify-center">
            "{quotes[activeQuoteIdx].quote}"
          </blockquote>
          <div>
            <div className="font-bold text-emerald-400 text-sm">{quotes[activeQuoteIdx].author}</div>
            <div className="text-xs text-slate-400 mt-0.5">{quotes[activeQuoteIdx].role}</div>
          </div>

          <div className="flex justify-center gap-2 pt-4">
            {quotes.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveQuoteIdx(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                  activeQuoteIdx === idx ? 'w-8 bg-emerald-400' : 'bg-slate-700 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-[#070A10] border-t border-slate-800 text-center text-xs text-slate-400 space-y-3">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 font-bold text-white">
          <div className="bg-white rounded-xl px-3 py-1.5 shadow-md border border-slate-200 flex items-center gap-3">
            <img src="/assets/rathinam_logo.png" alt="Rathinam Logo" className="h-6 w-auto object-contain" />
            <div className="h-5 w-px bg-slate-300" />
            <img src="/assets/rathinam_global_deemed_to_be_university.png" alt="Rathinam Global Deemed to be University" className="h-6 w-auto object-contain" />
          </div>
          <span>&bull;</span>
          <span>TalentPulse.ai Enterprise Placement Platform</span>
        </div>
        <p>&copy; 2026 Rathinam Global Deemed to be University. All rights reserved.</p>
      </footer>

    </div>
  );
}
