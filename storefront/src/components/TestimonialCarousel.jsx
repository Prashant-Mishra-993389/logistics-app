const REVIEWS = [
 { name: "Marcus T.", city: "Logistics Manager", quote: "Booking trucks now takes seconds instead of hours. The real-time visibility is unmatched in the industry.", img: "/us-t1.jpg" },
 { name: "David L.", city: "Fleet Owner", quote: "We've entirely eliminated our manual spreadsheets. Our drivers accept jobs instantly through the system.", img: "/us-t2.jpg" },
 { name: "James H.", city: "Independent Driver", quote: "I can see exactly where I'm going and how much I'll make. The dynamic pricing is totally transparent.", img: "/us-t3.jpg" },
 { name: "Michael C.", city: "Warehouse Director", quote: "No more phone calls asking where the shipment is. We track every load live down to the exact street.", img: "/us-t4.jpg" },
 { name: "Alex R.", city: "Supply Chain Lead", quote: "The platform's load matching efficiency means we rarely experience delays anymore. It just works.", img: "/us-t5.jpg" },
 { name: "Thomas W.", city: "System Admin", quote: "Managing users, drivers, and disputes from a singular dashboard keeps all our operations smooth.", img: "/us-t6.jpg" }
];

export default function TestimonialCarousel() {
 return (
   <section className="bg-white text-black py-24 px-6 md:px-[8vw]">
     <div className="flex flex-col items-center mb-16 text-center">
       <div className="font-inter text-[11px] tracking-[5px] text-accent-red uppercase mb-6">THE PLATFORM</div>
       <h2 className="font-bebas text-[48px] md:text-[72px] leading-none mb-6">REAL CLIENTS. REAL TRANSPORTERS.</h2>
       <div className="flex items-center gap-3">
         <div className="flex gap-1">
           {[...Array(5)].map((_, i) => (
             <svg key={i} className="w-5 h-5 text-accent-gold fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
           ))}
         </div>
         <span className="font-inter font-semibold text-[14px]">4.9 · 200+ verified reviews</span>
       </div>
     </div>

     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
       {REVIEWS.map((review, i) => (
         <div key={i} className="bg-[#F8F8F8] border border-[#EBEBEB] p-6 md:p-8 flex flex-col gap-6 hover:shadow-xl transition-shadow duration-300">
           <div className="relative w-full aspect-square bg-gray-200">
             <img src={review.img} alt={`Review by ${review.name}`} className="w-full h-full object-cover" loading="lazy" />
           </div>
           <div className="flex gap-1">
             {[...Array(5)].map((_, idx) => (
               <svg key={idx} className="w-4 h-4 text-accent-gold fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
             ))}
           </div>
          <p className="font-inter text-text-muted text-[15px] leading-relaxed italic grow">&ldquo;{review.quote}&rdquo;</p>
           <div className="pt-6 border-t border-[#EBEBEB] flex justify-between items-center">
             <span className="font-bebas text-[18px] tracking-[1px]">{review.name}</span>
             <span className="font-inter text-text-secondary text-[12px] uppercase tracking-[1px]">{review.city}</span>
           </div>
         </div>
       ))}
     </div>
   </section>
 );
}

