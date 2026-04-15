"use client";
import { motion } from "framer-motion";
import { BrainCircuit, Map, ShieldCheck, BarChart3, Route, TrendingUp } from "lucide-react";

const FEATURES = [
  { icon: <Map className="w-8 h-8 text-accent-red" />, title: "Live GPS Tracking", desc: "Real-time Google Maps API integration so you never lose sight of your freight." },
  { icon: <TrendingUp className="w-8 h-8 text-white" />, title: "Dynamic Pricing", desc: "Distance-based algorithmic pricing calculating identical to top-tier ride-sharing." },
  { icon: <Route className="w-8 h-8 text-accent-gold" />, title: "Load Matching System", desc: "Instantly pairs your required load capacity with the nearest available transporter." },
  { icon: <BrainCircuit className="w-8 h-8 text-accent-red" />, title: "AI Route Optimization", desc: "Proprietary AI determines the fastest and most fuel-efficient transit paths." },
  { icon: <ShieldCheck className="w-8 h-8 text-white" />, title: "Fraud Detection", desc: "Automated verification protocols ensuring driver and client security." },
  { icon: <BarChart3 className="w-8 h-8 text-accent-gold" />, title: "Analytics Dashboard", desc: "Comprehensive data visualization for fleet tracking and expense management." }
];

export default function Features() {
  return (
    <section id="features" className="bg-[#0F0F0F] px-6 py-24 md:px-[8vw] border-t border-white/5">
      <div className="flex flex-col items-center mb-16 text-center">
        <p className="font-inter text-[11px] tracking-[5px] text-accent-red uppercase mb-6">ADVANCED CAPABILITIES</p>
        <h2 className="font-bebas text-[48px] md:text-[72px] leading-none mb-6">BUILT FOR SCALE.</h2>
        <p className="font-inter text-text-secondary text-[16px] max-w-2xl mx-auto">
          We combined cutting-edge artificial intelligence with robust operational tracking to give you unprecedented control over your supply chain.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((feat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "-10%" }} 
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="bg-background border border-white/5 p-8 flex flex-col items-start hover:border-accent-red/40 transition-colors duration-300"
          >
            <div className="mb-6 p-4 bg-white/[0.02] rounded-lg">
              {feat.icon}
            </div>
            <h3 className="font-bebas text-[28px] tracking-[1px] text-white mb-3">{feat.title}</h3>
            <p className="font-inter text-[14px] text-text-secondary leading-relaxed">
              {feat.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
