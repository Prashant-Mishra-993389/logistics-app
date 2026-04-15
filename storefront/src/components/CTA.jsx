"use client";
import { motion } from "framer-motion";
import { openInNewTab, portalUrls } from "@/lib/platformConfig";

const WORDS = [["SCALE", "OR", "STAGNATE"], ["IT'S", "YOUR", "CHOICE"]];

export default function CTA() {
  const scrollToWorkflow = () => {
    const workflowSection = document.getElementById("workflow");
    if (workflowSection) {
      workflowSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden bg-background flex items-center justify-center">
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_100%_80%_at_50%_100%,rgba(232,0,13,0.08)_0%,transparent_70%)]" />
      <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="relative z-10 text-center px-6">
        <div className="font-inter text-[11px] tracking-[6px] text-accent-red uppercase mb-8">THE CHOICE</div>
        <h2 className="font-bebas text-[clamp(48px,8vw,96px)] text-white leading-[0.9] mb-12 uppercase tracking-[-2px] flex flex-col items-center">
          {WORDS.map((row, ri) => (
            <div key={ri} className="flex gap-4">
              {row.map((word, wi) => (
                <motion.div key={wi} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: (ri * 2 + wi) * 0.1, ease: [0.23, 1, 0.32, 1] }}>
                  {word}
                </motion.div>
              ))}
            </div>
          ))}
        </h2>
        <p className="font-inter text-[18px] text-text-secondary max-w-[500px] mx-auto mb-12">One moves faster. One doesn&apos;t.</p>
        <div className="flex flex-col md:flex-row justify-center gap-4 mb-20">
          <button
            type="button"
            onClick={() => openInNewTab(portalUrls.client)}
            className="font-bebas text-[18px] tracking-[4px] px-14 py-5 uppercase text-white bg-accent-red btn-premium min-w-[300px]"
          >
            OPEN CLIENT DASHBOARD
          </button>
          <button
            type="button"
            onClick={scrollToWorkflow}
            className="bg-transparent border border-white/[0.08] text-white/60 hover:text-white font-bebas text-[18px] tracking-[4px] px-14 py-5 uppercase min-w-[300px] transition-colors"
          >
            SEE HOW IT WORKS
          </button>
        </div>
      </motion.div>
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 font-inter text-[12px] tracking-[2px] text-[#2A2A2A] uppercase w-full text-center z-10">
        INSTANT DEPLOYMENT · ZERO SETUP FEES · 24/7 SUPPORT
      </div>
    </section>
  );
}

