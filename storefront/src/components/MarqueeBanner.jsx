"use client";
const ITEMS = Array(3).fill(["🚚 INSTANT TRUCK BOOKING","⏱️ ZERO TRANSPORT DELAYS","📍 REAL-TIME TRACKING","💰 TRANSPARENT PRICING"]).flat();

export default function MarqueeBanner({ variant = "dark" }) {
 const isDark = variant === "dark";
 return (
   <div className={`w-full overflow-hidden py-3 ${isDark ? "bg-[#0A0A0A] border-y border-white/[0.06]" : "bg-accent-red"}`}>
     <div className="flex w-max animate-marquee">
       {ITEMS.map((item, i) => (
         <span key={i} className={`inline-flex items-center gap-6 px-10 font-inter text-[12px] tracking-[3px] uppercase whitespace-nowrap ${isDark ? "text-text-secondary" : "text-white"}`}>
           {item}<span className={isDark ? "text-accent-red" : "text-white/60"}>•</span>
         </span>
       ))}
     </div>
     <style dangerouslySetInnerHTML={{ __html: `
       @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
       .animate-marquee { animation: marquee 28s linear infinite; }
       .animate-marquee:hover { animation-play-state: paused; }
     ` }} />
   </div>
 );
}

