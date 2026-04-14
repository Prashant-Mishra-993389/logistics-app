"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const FAQ_ITEMS = [
 { question: "HOW FAST CAN I BOOK A TRUCK?", answer: "Instantly. Enter your pickup, dropoff, and load details, and the system automatically matches you with the nearest driver." },
 { question: "HOW DOES PRICING WORK?", answer: "We use an algorithm to calculate dynamic pricing based purely on distance, load weight, and current fleet availability. No arbitrary hidden fees." },
 { question: "CAN I TRACK MY SHIPMENT IN REAL-TIME?", answer: "Yes. From the moment the driver accepts the job, you receive live GPS tracking until the cargo reaches its destination." },
 { question: "HOW DO DRIVERS GET PAID?", answer: "Earnings are calculated securely via our built-in wallet system upon delivery completion. Drivers can track their earnings live." },
 { question: "DO YOU HANDLE DISPUTES?", answer: "Our admin system handles all disputes, user management, and operational hurdles to ensure your logistics run without a hitch." },
 { question: "CAN MY BUSINESS SCALE WITH THIS?", answer: "Absolutely. Our platform is built for enterprises and independent contractors alike, handling anything from single pallets to major industrial freights." },
];

export default function FAQ() {
 const [openIdx, setOpenIdx] = useState(null);
 return (
   <section id="faq" className="py-24 px-6 md:px-[8vw] bg-background">
     <div className="max-w-3xl mx-auto">
       <h2 className="font-bebas text-[48px] md:text-[64px] tracking-[2px] leading-none mb-16 text-center">
         FREQUENTLY ASKED <span className="text-accent-red">QUESTIONS</span>
       </h2>
       <div className="space-y-4">
         {FAQ_ITEMS.map((item, i) => (
           <div key={i} className="border border-white/5 bg-white/[0.02] overflow-hidden">
             <button onClick={() => setOpenIdx(openIdx === i ? null : i)} className="w-full flex items-center justify-between p-6 md:p-8 text-left">
               <span className="font-bebas text-[20px] md:text-[24px] tracking-[2px]">{item.question}</span>
               <motion.div animate={{ rotate: openIdx === i ? 45 : 0 }} transition={{ duration: 0.3 }}>
                 <Plus className="w-6 h-6 text-accent-red" />
               </motion.div>
             </button>
             <AnimatePresence>
               {openIdx === i && (
                 <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.4}}>
                   <div className="px-6 md:px-8 pb-8 font-inter text-text-secondary text-[15px] leading-relaxed">{item.answer}</div>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
         ))}
       </div>
     </div>
   </section>
 );
}

