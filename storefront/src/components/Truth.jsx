"use client";
import { motion } from "framer-motion";

export default function Truth() {
 return (
   <section id="the-proof" className="bg-background px-6 py-20 md:px-[8vw] md:py-30 flex flex-col md:flex-row gap-10 md:gap-[8vw]">
      <motion.div initial={{opacity:0,x:-40}} whileInView={{opacity:1,x:0}} viewport={{once:true,margin:"-20%"}} transition={{duration:0.8}} className="flex-1">
       <div className="font-inter text-[11px] tracking-[5px] text-accent-red uppercase mb-8">WHY LOGISTICS IS BROKEN</div>
       <h2 className="font-bebas text-[44px] md:text-[72px] text-white leading-[0.92] mb-8">MANUAL.<br />DELAYED.<br />EXPENSIVE.</h2>
       <div className="w-[60px] h-[2px] bg-accent-red mb-8" />
       <div className="font-inter text-[16px] text-text-secondary leading-relaxed max-w-[440px] space-y-6">
         <p>You know the struggle. The delayed updates. The lost cargo. The phone calls.</p>
         <p>Most industries accept this as the cost of doing business.</p>
         <p>The ones who don&apos;t — move to a completely transparent layer of tracking and dynamic pricing to scale infinitely.</p>
       </div>
     </motion.div>
     <motion.div initial={{opacity:0,x:40}} whileInView={{opacity:1,x:0}} viewport={{once:true,margin:"-20%"}} transition={{duration:0.8}} className="flex-1 flex flex-col justify-center">
       <div className="bg-[#0F0F0F] border border-white/[0.04] p-8 md:p-12 flex flex-col gap-8">
          <div>
           <div className="font-inter text-[14px] text-accent-red uppercase mb-2">THE BUSINESS THAT WAITS</div>
           <div className="font-inter font-semibold text-[18px] text-white">→ Relies on manual calls. Loses track of drivers.</div>
         </div>
         <div>
           <div className="font-inter text-[14px] text-accent-gold uppercase mb-2">THE BUSINESS THAT SCALES</div>
           <div className="font-inter font-semibold text-[18px] text-white">→ Books instantly. Tracks every metre in real-time.</div>
         </div>
       </div>
       <h3 className="font-bebas text-[22px] tracking-[3px] text-accent-red text-center mt-8">JOIN THE FUTURE</h3>
     </motion.div>
   </section>
 );
}
