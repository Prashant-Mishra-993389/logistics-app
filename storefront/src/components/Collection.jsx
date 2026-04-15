"use client";
import { motion } from "framer-motion";
import { openInNewTab, rolePortalMap } from "@/lib/platformConfig";

const ROLES = [
 { id:"client", name:"INDUSTRIAL CLIENTS", specs:"BOOK · TRACK · PAY", quote:'"Complete transparency and zero delays for your logistics."', video:"/assets/hero/hero-gt3.mp4" },
 { id:"driver", name:"TRANSPORT DRIVERS", specs:"ACCEPT JOBS · EARN · PROGRESS", quote:'"Take control of your routes and maximize your earnings."', video:"/assets/hero/hero-m4.mp4" },
 { id:"admin", name:"SYSTEM ADMINS", specs:"MONITOR · MANAGE · RESOLVE", quote:'"A bird\'s-eye view of every shipment and transaction."', video:"/assets/hero/hero-sto.mp4" },
];

export default function Collection() {

 return (
   <section id="roles" className="bg-background px-6 py-20 md:px-[8vw] md:py-30 flex flex-col items-center">
     <p className="font-inter text-[11px] tracking-[5px] text-accent-red uppercase text-center mb-6">INTEGRATED ECOSYSTEM</p>
     <h2 className="font-bebas text-[48px] md:text-[80px] leading-none mb-16 tracking-[-2px] uppercase bg-[linear-gradient(180deg,#FFFFFF_0%,#6A6A6A_100%)] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">PLATFORM ROLES</h2>
     <div className="w-full flex flex-col md:flex-row gap-8">
       {ROLES.map((role, i) => (
         <motion.div key={role.id}
           initial={{opacity:0,y:40}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:"-10%"}}
           transition={{duration:0.8, delay: i * 0.15, ease:[0.25,0.46,0.45,0.94]}}
           className="flex-1 overflow-hidden group flex flex-col relative bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] backdrop-blur-[20px] transition-all duration-500 hover:-translate-y-2 hover:border-[rgba(232,0,13,0.2)] hover:shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
         >
           {/* Hover effects */}
           <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(232,0,13,0.06)_0%,transparent_70%)]" />
           <div className="absolute top-0 left-0 right-0 h-px pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 bg-[linear-gradient(90deg,transparent,rgba(232,0,13,0.6)_50%,transparent)]" />
           {/* Video */}
           <div className="relative w-full h-65 bg-black overflow-hidden">
             <video src={role.video} autoPlay loop muted playsInline className="w-full h-full object-cover" />
           </div>
           {/* Body */}
           <div className="relative z-10 flex flex-col grow p-8">
             <div className="font-bebas text-[28px] tracking-[2px] text-white mb-2">{role.name}</div>
             <div className="font-inter text-[12px] tracking-[2px] text-text-secondary uppercase mb-4">{role.specs}</div>
             <div className="font-inter text-[14px] italic text-[#6A6A6A] leading-relaxed mb-6">{role.quote}</div>
             <div className="mt-auto pt-6 border-t border-[rgba(255,255,255,0.04)]">
                <button 
                  type="button"
                  onClick={() => openInNewTab(rolePortalMap[role.id].url)}
                  className="w-full bg-accent-red text-white border-none py-3 font-inter text-[11px] tracking-[3px] uppercase font-bold hover:bg-red-700 transition-colors"
                >
                  OPEN PORTAL
                </button>
                <p className="mt-3 font-inter text-[11px] text-white/35 break-all">{rolePortalMap[role.id].url}</p>
             </div>
           </div>
         </motion.div>
       ))}
     </div>
   </section>
 );
}
