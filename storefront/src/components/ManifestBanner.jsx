export default function ManifestBanner() {
 return (
   <section className="relative w-full aspect-auto min-h-[60vw] md:aspect-video md:min-h-0 bg-[#111111] flex flex-col justify-end items-center pb-[8vw] md:pb-0 md:justify-center md:items-end overflow-hidden">
     <div className="w-[85%] md:w-[38%] text-center md:text-left z-10 flex flex-col items-center md:items-start md:-ml-[10%]">
       <p className="font-inter font-normal uppercase tracking-wider text-[rgba(255,255,255,0.65)] text-[clamp(13px,1.2vw,18px)] mb-2">Empower your supply chain today.</p>
       <h2 className="font-bebas text-white text-[clamp(32px,4.5vw,72px)] leading-none mb-4 md:mb-6">Join the Network.</h2>
       <a href="#portal-launchpad" className="font-inter font-medium text-white border-b border-white hover:text-accent-red hover:border-[#E8000D] transition-colors pb-1 uppercase text-sm tracking-wide inline-block">
         Open Role Portals &rarr;
       </a>
     </div>
   </section>
 );
}
