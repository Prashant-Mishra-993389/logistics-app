"use client";
import { motion } from "framer-motion";

const STEPS = [
  { number: "01", title: "REQUEST A TRUCK", desc: "Enter your pickup point, drop-off destination, and load specifications. Get an instant, dynamic price estimate based on the distance." },
  { number: "02", title: "INSTANT MATCHING", desc: "Our system automatically pings the nearest verified drivers. The job is accepted within seconds, minimizing wait times." },
  { number: "03", title: "LIVE TRACKING", desc: "Watch your shipment move in real-time across the integrated map dashboard. Know exactly where your goods are at every meter." },
  { number: "04", title: "SECURE DELIVERY", desc: "The driver marks the drop-off complete. Payments are processed instantly and both parties can review the seamless experience." }
];

export default function HowItWorks() {
  return (
    <section className="bg-background px-6 py-24 md:px-[8vw] border-y border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 md:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <p className="font-inter text-[11px] tracking-[5px] text-accent-red uppercase mb-6">THE WORKFLOW</p>
            <h2 className="font-bebas text-[48px] md:text-[80px] leading-none text-white tracking-[-1px]">
              HOW IT <span className="text-white/20">WORKS.</span>
            </h2>
          </div>
          <p className="font-inter text-text-secondary text-[16px] max-w-md">
            Four simple steps. Zero confusing paperwork. A highly streamlined pipeline linking industrial clients to verified transporters.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 relative">
          {/* Connecting line for desktop */}
          <div className="hidden lg:block absolute top-[40px] left-[10%] right-[10%] h-[1px] bg-white/10 z-0" />
          
          {STEPS.map((step, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -20 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.6, delay: i * 0.2 }}
              className="relative z-10 flex flex-col"
            >
              <div className="w-[80px] h-[80px] rounded-full bg-[#111] border border-accent-red flex items-center justify-center font-bebas text-[36px] text-accent-red mx-auto lg:mx-0 mb-8 shadow-[0_0_30px_rgba(232,0,13,0.15)]">
                {step.number}
              </div>
              <h3 className="font-bebas text-[28px] text-white tracking-[2px] mb-4 text-center lg:text-left">{step.title}</h3>
              <p className="font-inter text-[15px] text-text-secondary leading-relaxed text-center lg:text-left">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
