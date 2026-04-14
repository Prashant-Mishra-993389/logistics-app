export default function Footer() {
 return (
   <footer className="bg-background border-t border-white/10 pt-20 pb-10 px-6 md:px-[8vw]">
     <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
       {/* Column 1 */}
       <div className="flex flex-col items-start gap-4">
         <a href="#top" className="group inline-flex flex-col items-start pt-1.5 mb-2">
           <span className="font-bebas text-[24px] tracking-[8px] text-white leading-none uppercase">MANIFEST</span>
           <div className="w-full h-px bg-accent-red my-0.5 transition-transform duration-300 group-hover:scale-x-110 origin-left" />
           <span className="font-bebas text-[24px] tracking-[8px] text-accent-red leading-none uppercase">DRIVES</span>
         </a>
         <p className="font-inter text-text-secondary text-[14px]">It starts in your hand.</p>
         <p className="font-inter text-text-muted text-[12px] mt-4">Free worldwide shipping.</p>
       </div>
       {/* Column 2 - Spacer */}
       <div className="hidden md:block"></div>
       {/* Column 3 - Shop */}
       <div className="flex flex-col gap-4">
         <h4 className="font-bebas text-[18px] tracking-[2px] text-white mb-2">SHOP</h4>
         <a href="#the-cars" className="font-inter text-text-secondary text-[14px] hover:text-white transition-colors">The Cars</a>
         <a href="#faq" className="font-inter text-text-secondary text-[14px] hover:text-white transition-colors">FAQs</a>
         <a href="#the-cars" className="font-inter text-text-secondary text-[14px] hover:text-white transition-colors">Full Catalog</a>
       </div>
       {/* Column 4 - Legal */}
       <div className="flex flex-col gap-4">
         <h4 className="font-bebas text-[18px] tracking-[2px] text-white mb-2">LEGAL</h4>
         <a href="#faq" className="font-inter text-text-secondary text-[14px] hover:text-white transition-colors">Returns & Refunds</a>
         <a href="#faq" className="font-inter text-text-secondary text-[14px] hover:text-white transition-colors">Shipping Policy</a>
         <a href="#faq" className="font-inter text-text-secondary text-[14px] hover:text-white transition-colors">Privacy Policy</a>
         <a href="#faq" className="font-inter text-text-secondary text-[14px] hover:text-white transition-colors">Terms of Service</a>
         <a href="#faq" className="font-inter text-text-secondary text-[14px] hover:text-white transition-colors">Contact</a>
       </div>
     </div>
     <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
       <p className="font-inter text-text-muted text-[12px]">© {new Date().getFullYear()} Manifest Logistics. All rights reserved.</p>
       <p className="font-inter text-text-muted text-[12px] uppercase tracking-[2px]">SHIPS WORLDWIDE</p>
     </div>
   </footer>
 );
}
