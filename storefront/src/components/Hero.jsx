import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { openInNewTab, portalUrls } from "@/lib/platformConfig";

const SLIDES = [
  {
    id: "connect",
    handle: "connect-industries",
    tab: "TRANSPORTATION",
    headline: "CONNECTING INDUSTRIES.",
    subline: "Find available trucks quickly and move your cargo without delays.",
    action: "REQUEST A TRUCK",
    video: "/assets/hero/hero-gt3.mp4",
    videoPosition: "center center",
  },
  {
    id: "track",
    handle: "real-time-track",
    tab: "LIVE TRACKING",
    headline: "TRACK EVERY METRE.",
    subline: "Experience poor real-time tracking no more. Get complete visibility into your shipments.",
    action: "TRACK SHIPMENT",
    video: "/assets/hero/hero-m4.mp4",
    videoPosition: "center center",
  },
  {
    id: "price",
    handle: "transparent-price",
    tab: "TRANSPARENT PRICING",
    headline: "NO HIDDEN COSTS.",
    subline: "Dynamic pricing calculated purely on distance and load. Total transparency.",
    action: "VIEW PRICING",
    video: "/assets/hero/hero-sto.mp4",
    videoPosition: "center center",
  },
];

export default function Hero() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 1000], [0, 400]);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setActiveIdx(p => (p + 1) % SLIDES.length), 6000);
    return () => clearInterval(interval);
  }, []);

  const slide = SLIDES[activeIdx];

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handlePrimaryAction = () => {
    if (slide.id === "track") {
      openInNewTab(portalUrls.client);
      return;
    }

    if (slide.id === "price") {
      scrollToSection("features");
      return;
    }

    scrollToSection("roles");
  };

  return (
    <section className="relative h-screen w-full overflow-hidden bg-background flex flex-col justify-center">
      <motion.div style={{ y: backgroundY }} className="absolute inset-0 w-full h-[120%] -top-[10%] z-0">
        {mounted && (
          <video src={slide.video} autoPlay loop muted playsInline
            style={{ objectPosition: slide.videoPosition }}
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
        )}
      </motion.div>
      <div className="absolute inset-0 z-1 pointer-events-none bg-[linear-gradient(90deg,rgba(8,8,8,0.75)_0%,rgba(8,8,8,0.3)_35%,transparent_60%)]" />
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 z-20 flex justify-between px-4 md:px-8 pointer-events-none">
        <button onClick={() => setActiveIdx(p => (p - 1 + SLIDES.length) % SLIDES.length)} className="pointer-events-auto p-3 rounded-full bg-black/20 hover:bg-black/50 border border-white/10 text-white/50 hover:text-white backdrop-blur-md hidden md:block"><ChevronLeft size={32} strokeWidth={1.5} /></button>
        <button onClick={() => setActiveIdx(p => (p + 1) % SLIDES.length)} className="pointer-events-auto p-3 rounded-full bg-black/20 hover:bg-black/50 border border-white/10 text-white/50 hover:text-white backdrop-blur-md hidden md:block"><ChevronRight size={32} strokeWidth={1.5} /></button>
      </div>
      <div className="relative z-10 w-full px-6 md:pl-[4vw] xl:pl-[8vw] max-w-150 mt-12 md:mt-0">
        <AnimatePresence mode="wait">
          <motion.div key={slide.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}>
            <h1 className="font-bebas text-[clamp(64px,10vw,120px)] text-white leading-[0.87] mb-6 uppercase">{slide.headline}</h1>
            <p className="font-inter text-[16px] text-text-secondary max-w-90 leading-relaxed mb-10">{slide.subline}</p>
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="inline-block font-bebas text-[16px] tracking-[4px] px-10 py-4 uppercase text-white bg-accent-red hover:bg-red-700 transition-colors"
            >
              {slide.action}
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
