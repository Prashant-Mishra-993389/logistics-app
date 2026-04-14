"use client";
import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

const IMAGES = ["/us-t1.jpg", "/us-t2.jpg", "/us-t3.jpg", "/us-t4.jpg", "/us-t5.jpg", "/us-t6.jpg"];

export default function SwipeManifesto() {
 const containerRef = useRef(null);
 const carouselRef = useRef(null);
 const [width, setWidth] = useState(0);

 useEffect(() => {
   if (carouselRef.current) {
     setWidth(carouselRef.current.scrollWidth - carouselRef.current.offsetWidth);
   }
 }, []);

  const textLines = [
   "INDUSTRIES STRUGGLE WITH",
   "HIGH TRANSPORT DELAYS.",
   "POOR REAL-TIME TRACKING.",
   "MANUAL BOOKING SYSTEMS.",
   "PRICE OPACITY."
  ];

 return (
   <section ref={containerRef} className="bg-background min-h-[80vh] flex flex-col md:flex-row border-y border-white/[0.04]">
      {/* Left: Manifesto */}
     <div className="flex-1 p-8 md:p-[8vw] flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/[0.04]">
       <div className="font-inter text-[11px] tracking-[5px] text-accent-red uppercase mb-12">THE CORE PROBLEM</div>
       
       <div className="space-y-2 mb-16">
         {textLines.map((line, i) => (
           <div key={i} className="overflow-hidden">
             <motion.div
               initial={{ y: "100%" }}
               whileInView={{ y: 0 }}
               viewport={{ once: true, margin: "-10%" }}
               transition={{ duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
               className="font-bebas text-[clamp(32px,4vw,64px)] leading-none text-white opacity-90"
             >
               {line}
             </motion.div>
           </div>
         ))}
       </div>

        <motion.div 
         initial={{ opacity: 0, x: -20 }}
         whileInView={{ opacity: 1, x: 0 }}
         viewport={{ once: true }}
         transition={{ duration: 0.8, delay: 0.8 }}
         className="flex items-center gap-4"
       >
         <div className="w-12 h-[2px] bg-accent-red" />
         <p className="font-inter text-[14px] tracking-[2px] text-white uppercase font-semibold">YOUR SYSTEM WILL SOLVE THIS TODAY.</p>
       </motion.div>
     </div>

     {/* Right: Drag Carousel */}
     <div className="flex-1 overflow-hidden relative flex items-center bg-[#0F0F0F] min-h-[50vh]">
       <div className="absolute top-6 left-6 z-10 font-inter text-[10px] tracking-[3px] text-white/50 uppercase mix-blend-difference">DRAG TO EXPLORE</div>
       <motion.div ref={carouselRef} className="cursor-grab active:cursor-grabbing overflow-hidden w-full">
         <motion.div 
           drag="x" 
           dragConstraints={{ right: 0, left: -width }} 
           className="flex gap-6 px-8 py-12"
         >
           {IMAGES.map((src, i) => (
             <motion.div key={i} className="min-w-[280px] md:min-w-[400px] aspect-[4/5] relative pointer-events-none rounded-sm overflow-hidden border border-white/5">
               <img src={src} alt="Lifestyle" className="w-full h-full object-cover" loading="lazy" />
             </motion.div>
           ))}
         </motion.div>
       </motion.div>
     </div>
   </section>
 );
}

