import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Sprout, Heart, ShieldCheck, Users, CheckCircle2, ArrowRight, Quote, Globe, Leaf
} from 'lucide-react';
import bannerImage from '../../assets/cas/banner.png';
import womenImage from '../../assets/cas/women.png';

// Floating ingredient data preserved for hero chips
const floatingIngredients = [
  { name: 'Millets', color: 'bg-[#C8A96A]/15 text-[#8C6D2D] border-[#C8A96A]/30' },
  { name: 'Heritage Wheat', color: 'bg-[#2E7D32]/15 text-[#2E7D32] border-[#2E7D32]/30' },
  { name: 'Raw Honey', color: 'bg-[#D7A94E]/15 text-[#B27B26] border-[#D7A94E]/30' },
  { name: 'Palm Jaggery', color: 'bg-[#7CB342]/15 text-[#33691E] border-[#7CB342]/30' },
  { name: 'Almonds', color: 'bg-[#C8A96A]/15 text-[#8C6D2D] border-[#C8A96A]/30' },
  { name: 'Cashews', color: 'bg-[#A50D5A]/15 text-[#A50D5A] border-[#A50D5A]/30' },
  { name: 'Pistachios', color: 'bg-[#7CB342]/15 text-[#33691E] border-[#7CB342]/30' },
  { name: 'Organic Coconut', color: 'bg-[#2E7D32]/15 text-[#2E7D32] border-[#2E7D32]/30' }
];

export default function About() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-[#FBF7EF] text-[#221B1F] font-sans selection:bg-[#2E7D32] selection:text-white overflow-hidden">

      {/* ⸻ HERO SECTION (Preserved UI Design & Structure) ⸻ */}
      <section className="relative min-h-[92vh] lg:min-h-screen flex items-center justify-center pt-24 pb-16 px-6 overflow-hidden bg-gradient-to-b from-[#F2ECE1] via-[#FBF7EF] to-[#FBF7EF]">

        {/* Soft Organic Atmospheric Background Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute w-[600px] h-[600px] rounded-full blur-[140px] opacity-[0.25] -top-20 -left-20 bg-[#7CB342]" />
          <div className="absolute w-[500px] h-[500px] rounded-full blur-[140px] opacity-[0.2] bottom-10 right-0 bg-[#C8A96A]" />
          <div className="absolute w-[450px] h-[450px] rounded-full blur-[120px] opacity-[0.15] top-1/2 left-1/3 bg-[#A50D5A]" />
        </div>

        {/* Subtle Leaf & Agriculture Background Texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0"
          style={{ backgroundImage: 'radial-gradient(#2E7D32 1px, transparent 1px)', backgroundSize: '36px 36px' }} />

        <div className="max-w-7xl mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left Editorial Copy */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-8 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2E7D32]/10 border border-[#2E7D32]/20 text-[#2E7D32] text-xs font-extrabold uppercase tracking-[0.25em] shadow-sm mx-auto lg:mx-0">
              <Sprout className="h-4 w-4 text-[#2E7D32]" />
              <span>Alimenture Industries • Since 2023</span>
            </div>

            <h1 className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl text-[#221B1F] leading-[1.08] tracking-tight">
              Redefining Healthy Living, <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2E7D32] via-[#7CB342] to-[#C8A96A] italic">Naturally.</span>
            </h1>

            <p className="text-base sm:text-xl text-[#221B1F]/80 leading-relaxed font-medium max-w-2xl mx-auto lg:mx-0">
              At Alimenture Industries, we believe that food should nourish people without adding preservatives. Every product we create reflects our unyielding commitment to purity, sustainability, and the well-being of future generations.
            </p>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <button
                onClick={() => {
                  const storySec = document.getElementById('who-we-are');
                  storySec?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#2E7D32] hover:bg-[#236327] text-white font-extrabold text-xs uppercase tracking-widest transition-all duration-300 shadow-xl shadow-[#2E7D32]/20 hover:scale-105 active:scale-95 flex items-center justify-center gap-3 group"
              >
                <span>Explore Our Story</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/#products')}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/80 border border-[#2E7D32]/30 hover:border-[#2E7D32] text-[#2E7D32] font-extrabold text-xs uppercase tracking-widest transition-all duration-300 shadow-md hover:bg-white hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Discover Our Products</span>
              </button>
            </div>

            {/* Floating Ingredient Chips */}
            <div className="pt-8 border-t border-[#221B1F]/10">
              <p className="text-xs font-extrabold uppercase tracking-widest text-[#221B1F]/60 mb-3 text-center lg:text-left">
                Pure Wholesome Ingredients We Cherish
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {floatingIngredients.map((item, idx) => (
                  <motion.span
                    key={item.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * idx, duration: 0.4 }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-xs transition-transform hover:scale-105 cursor-default ${item.color}`}
                  >
                    {item.name}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Hero Visual Banner Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl group">
              <img
                src={bannerImage}
                alt="Organic sustainable agriculture and food"
                className="w-full h-[450px] sm:h-[550px] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute bottom-8 left-8 right-8 text-white space-y-2">
                <span className="px-3 py-1 bg-[#C8A96A] text-black font-extrabold text-[10px] uppercase tracking-widest rounded-full">
                  Nourishment & Cherishment
                </span>
                <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-white leading-snug">
                  Rooted in Soil, <br /> Built on Responsibility.
                </h3>
                <p className="text-xs text-white/80 font-medium">
                  Empowering communities from Chennai, India to the world.
                </p>
              </div>
            </div>

            {/* Overlapping Trust Pill */}
            <div className="absolute -bottom-6 -left-6 bg-white/95 backdrop-blur-xl border border-[#2E7D32]/20 rounded-2xl p-4 shadow-xl flex items-center gap-3.5 max-w-xs">
              <div className="h-10 w-10 rounded-xl bg-[#2E7D32]/10 flex items-center justify-center text-[#2E7D32] shrink-0 font-bold">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#2E7D32]">100% Natural & Pure</p>
                <p className="text-xs font-extrabold text-[#221B1F]">Zero Toxin Guarantee</p>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ⸻ 1. WHO WE ARE (Updated Premium Content) ⸻ */}
      <section id="who-we-are" className="py-24 px-6 bg-white relative">
        <div className="max-w-7xl mx-auto">

          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-extrabold uppercase tracking-[0.3em] text-[#A50D5A] bg-[#A50D5A]/10 px-4 py-1.5 rounded-full inline-block border border-[#A50D5A]/20">
              Who We Are
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-[#221B1F] leading-tight">
              Who We Are
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Story Image Composite */}
            <div className="lg:col-span-5 relative">
              <div className="rounded-[2.5rem] overflow-hidden border-2 border-[#FBF7EF] shadow-xl">
                <img src={womenImage} alt="Empowering farming communities" className="w-full h-[420px] object-cover" />
              </div>

              <div className="absolute -bottom-6 -right-6 bg-[#FBF7EF] border border-[#A50D5A]/20 rounded-3xl p-6 shadow-xl max-w-xs space-y-2">
                <Quote className="h-8 w-8 text-[#C8A96A] opacity-60" />
                <p className="text-xs font-medium italic text-[#221B1F]">
                  "Food should nourish people without adding preservatives."
                </p>
              </div>
            </div>

            {/* Premium Text Content for WHO WE ARE */}
            <div className="lg:col-span-7 space-y-6 text-center sm:text-left">
              <p className="text-base sm:text-lg text-[#221B1F]/90 leading-relaxed font-medium text-pretty">
                <strong className="text-[#A50D5A]">Alimenture Industries Private Limited</strong> was incorporated in Chennai in December 2023 by visionary entrepreneurs <strong className="text-[#221B1F]">Pavin Saminathan</strong> and <strong className="text-[#221B1F]">Magesh Mohan</strong>.
              </p>

              <p className="text-xs sm:text-base text-[#221B1F]/80 leading-relaxed font-medium text-pretty">
                Driven by the vision of building a self-reliant economy through sustainable food systems, Alimenture was founded with a mission to redefine healthy living through natural, toxin-free nutrition.
              </p>

              <p className="text-xs sm:text-base text-[#221B1F]/80 leading-relaxed font-medium text-pretty">
                More than a food manufacturing company, Alimenture is a movement dedicated to creating healthier communities by reconnecting people with authentic, wholesome food.
              </p>

              <p className="text-xs sm:text-base text-[#221B1F]/80 leading-relaxed font-medium text-pretty">
                Inspired by the philosophy of the legendary green crusader <strong className="text-[#A50D5A]">Nammalvar</strong>, we believe that food should nourish people without adding preservatives. Every product we create reflects our commitment to purity, sustainability, and the well-being of future generations.
              </p>

              {/* Company Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-[#221B1F]/10">
                {[
                  { label: 'Incorporated', val: 'Dec 2023' },
                  { label: 'Location', val: 'Chennai' },
                  { label: 'Mission', val: 'Toxin-Free' },
                  { label: 'Philosophy', val: 'Nammalvar' }
                ].map(item => (
                  <div key={item.label} className="p-3 bg-[#FBF7EF] rounded-2xl text-center border border-[#A50D5A]/10">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#A50D5A]">{item.label}</p>
                    <p className="text-sm font-extrabold text-[#221B1F] mt-1">{item.val}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ⸻ 2. OUR PURPOSE (Updated Premium Content) ⸻ */}
      <section className="py-24 px-6 bg-[#FBF7EF] relative">
        <div className="max-w-7xl mx-auto">

          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-extrabold uppercase tracking-[0.3em] text-[#C8A96A] bg-[#C8A96A]/10 px-4 py-1.5 rounded-full inline-block">
              Our Purpose
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-[#221B1F]">
              Our Purpose
            </h2>
            <p className="text-base sm:text-lg text-[#221B1F]/80 font-medium leading-relaxed max-w-2xl mx-auto">
              At Alimenture, every decision begins with a simple belief—food should nourish lives, empower communities, and protect nature.
            </p>
          </div>

          {/* 3 Core Commitments Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Users className="h-7 w-7 stroke-[2.2px]" />,
                title: 'Empower Farming Communities',
                desc: 'Connect farming communities by encouraging natural cultivation and supporting sustainable livelihoods.'
              },
              {
                icon: <Sprout className="h-7 w-7 stroke-[2.2px]" />,
                title: 'Responsible Growth',
                desc: 'Build a future where industrial growth and environmental responsibility go hand in hand.'
              },
              {
                icon: <Heart className="h-7 w-7 stroke-[2.2px]" />,
                title: 'Pure Wholesome Nutrition',
                desc: 'Deliver pure, wholesome nutrition that promotes healthier families while preserving traditional food values.'
              }
            ].map((card, idx) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                className="group bg-white/90 backdrop-blur-xl border border-white p-8 rounded-[2.5rem] shadow-lg hover:shadow-2xl hover:border-[#A50D5A]/35 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
              >
                <div className="space-y-4 relative z-10">
                  <div className="h-16 w-16 rounded-2xl bg-white/80 backdrop-blur-md border border-[#A50D5A]/25 flex items-center justify-center text-[#A50D5A] group-hover:scale-110 group-hover:bg-white/95 group-hover:border-[#A50D5A]/50 group-hover:shadow-[0_12px_28px_rgba(146,0,117,0.2)] group-hover:rotate-6 transition-all duration-500 shadow-sm shrink-0">
                    {card.icon}
                  </div>
                  <h3 className="font-display font-extrabold text-xl text-[#221B1F] group-hover:text-[#A50D5A] transition-colors">{card.title}</h3>
                  <p className="text-sm text-[#221B1F]/75 leading-relaxed font-medium">{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ⸻ 3. WHAT WE DO (Updated Premium Content) ⸻ */}
      <section className="py-24 px-6 bg-white relative">
        <div className="max-w-7xl mx-auto space-y-16">

          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-[0.3em] text-[#A50D5A] bg-[#A50D5A]/10 px-4 py-1.5 rounded-full inline-block border border-[#A50D5A]/20">
              What We Do
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-[#221B1F]">
              What We Do
            </h2>
            <p className="text-base sm:text-lg text-[#221B1F]/80 font-medium leading-relaxed">
              We combine traditional food wisdom with modern manufacturing practices to create products that are nutritious, delicious, and naturally wholesome.
            </p>
          </div>

          {/* 3 Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Organic Ready-to-Eat Foods */}
            <div className="bg-[#FBF7EF] border border-[#A50D5A]/15 p-8 rounded-[2rem] hover:border-[#A50D5A] hover:bg-white transition-all duration-300 shadow-sm hover:shadow-xl group flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="px-3 py-1 bg-[#A50D5A]/10 text-[#A50D5A] font-extrabold text-[10px] uppercase tracking-widest rounded-full inline-block">
                  No Maida • No White Sugar • No Additives
                </span>
                <h3 className="font-display font-extrabold text-2xl text-[#221B1F] group-hover:text-[#A50D5A] transition-colors">
                  Organic Ready-to-Eat Foods
                </h3>
                <p className="text-xs text-[#221B1F]/60 font-bold uppercase tracking-wider">
                  Prepared without maida, refined sugar, or synthetic additives:
                </p>
                <ul className="space-y-2 text-sm text-[#221B1F]/80 font-medium">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#A50D5A] shrink-0" /> Healthy breads</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#A50D5A] shrink-0" /> Wholesome cakes</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#A50D5A] shrink-0" /> Nutritious biscuits</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#A50D5A] shrink-0" /> Traditional confectioneries</li>
                </ul>
              </div>
              <div className="pt-6 border-t border-[#221B1F]/10 flex items-center text-xs font-extrabold text-[#A50D5A] gap-1 group-hover:gap-2 transition-all">
                <span>Clean Baked Lineup</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Natural Sweeteners */}
            <div className="bg-[#FBF7EF] border border-[#C8A96A]/25 p-8 rounded-[2rem] hover:border-[#C8A96A] hover:bg-white transition-all duration-300 shadow-sm hover:shadow-xl group flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="px-3 py-1 bg-[#C8A96A]/15 text-[#8C6D2D] font-extrabold text-[10px] uppercase tracking-widest rounded-full inline-block">
                  100% Unrefined & Authentic
                </span>
                <h3 className="font-display font-extrabold text-2xl text-[#221B1F] group-hover:text-[#C8A96A] transition-colors">
                  Natural Sweeteners
                </h3>
                <p className="text-xs text-[#221B1F]/60 font-bold uppercase tracking-wider">
                  Crafted using traditional methods to preserve authentic taste:
                </p>
                <ul className="space-y-2 text-sm text-[#221B1F]/80 font-medium">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#C8A96A] shrink-0" /> Country Sugar</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#C8A96A] shrink-0" /> Palm Jaggery</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#C8A96A] shrink-0" /> Raw Honey</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#C8A96A] shrink-0" /> Natural Candies</li>
                </ul>
              </div>
              <div className="pt-6 border-t border-[#221B1F]/10 flex items-center text-xs font-extrabold text-[#C8A96A] gap-1 group-hover:gap-2 transition-all">
                <span>Explore Natural Sweetness</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Millet & Heritage Nutrition */}
            <div className="bg-[#FBF7EF] border border-[#D7A94E]/25 p-8 rounded-[2rem] hover:border-[#D7A94E] hover:bg-white transition-all duration-300 shadow-sm hover:shadow-xl group flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="px-3 py-1 bg-[#D7A94E]/15 text-[#B27B26] font-extrabold text-[10px] uppercase tracking-widest rounded-full inline-block">
                  Superfood Grains
                </span>
                <h3 className="font-display font-extrabold text-2xl text-[#221B1F] group-hover:text-[#D7A94E] transition-colors">
                  Millet & Heritage Nutrition
                </h3>
                <p className="text-xs text-[#221B1F]/60 font-bold uppercase tracking-wider">
                  Encouraging healthier lifestyles naturally:
                </p>
                <ul className="space-y-2 text-sm text-[#221B1F]/80 font-medium">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#D7A94E] shrink-0" /> Millet-based health foods</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#D7A94E] shrink-0" /> Heritage rice products</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#D7A94E] shrink-0" /> Healthy snacks</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#D7A94E] shrink-0" /> Nutritional supplements</li>
                </ul>
              </div>
              <div className="pt-6 border-t border-[#221B1F]/10 flex items-center text-xs font-extrabold text-[#D7A94E] gap-1 group-hover:gap-2 transition-all">
                <span>Explore Heritage Nutrition</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ⸻ 4. ENDING MESSAGE (Updated Premium Closing Copy) ⸻ */}
      <section className="py-24 px-6 bg-gradient-to-br from-[#A50D5A] via-[#79083F] to-[#1F0320] text-white relative overflow-hidden text-center">
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <span className="text-xs font-extrabold uppercase tracking-[0.3em] text-[#C8A96A] bg-white/10 border border-white/20 px-4 py-1.5 rounded-full inline-block">
            Our Responsibility
          </span>

          <blockquote className="font-display font-extrabold text-2xl sm:text-4xl text-white leading-relaxed italic px-4">
            "At Alimenture Industries, we believe that food is more than nourishment—it is a responsibility. Every ingredient we choose, every product we create, and every partnership we build reflects our commitment to healthier families, empowered farmers, and a more sustainable future."
          </blockquote>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/#products')}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#C8A96A] hover:bg-[#b89859] text-black font-extrabold text-xs uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95"
            >
              Explore Our Products
            </button>
            <a
              href="mailto:alimentureindustries@gmail.com?subject=Partnership%20Inquiry"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
            >
              Become Our Partner
            </a>
          </div>
        </div>
      </section>

      {/* ⸻ FOOTER SIGNATURE ⸻ */}
      <div className="py-8 bg-berry-deep text-center border-t border-white/10">
        <p className="font-display font-extrabold text-xs sm:text-sm uppercase tracking-[0.3em] text-[#C8A96A]">
          Healthy Food. • Healthy Farmers. • Healthy Planet.
        </p>
      </div>

    </div>
  );
}
