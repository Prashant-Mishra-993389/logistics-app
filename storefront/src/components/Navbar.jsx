import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links = [
    { label: "PLATFORM ROLES", href: "#roles" },
    { label: "WHY US", href: "#the-proof" },
    { label: "OPEN PORTALS", href: "#portal-launchpad" },
    { label: "FAQS", href: "#faq" },
  ];

  return (
    <>
      <motion.nav initial={{ y: -100 }} animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`fixed top-0 left-0 w-full h-16 z-[1000] flex items-center justify-between px-6 md:px-[4vw] transition-all duration-300 ${scrolled ? "bg-background/40 backdrop-blur-2xl saturate-180 border-b border-white/5" : "bg-transparent"}`}
      >
        <a href="#top" className="group inline-flex flex-col items-start pt-1.5">
          <span className="font-bebas text-[18px] tracking-[8px] text-white leading-none uppercase">MANIFEST</span>
          <div className="w-full h-px bg-accent-red my-0.5 transition-transform duration-300 group-hover:scale-x-110 origin-left" />
          <span className="font-bebas text-[18px] tracking-[8px] text-accent-red leading-none uppercase">LOGISTICS</span>
        </a>

        <div className="hidden md:flex gap-6 items-center">
          {links.map((item, i) => (
            <a key={i} href={item.href} className={`font-inter font-medium text-[13px] tracking-[2px] uppercase transition-colors duration-300 ${item.label === "BOOK A TRUCK" ? "text-white bg-accent-red px-4 py-2 hover:bg-[#FF1A1A]" : "text-text-secondary hover:text-white"}`}>
              {item.label}
            </a>
          ))}
        </div>

        <button className="md:hidden text-white p-2" onClick={() => setOpen(true)}><Menu className="w-6 h-6" /></button>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1001] bg-background flex flex-col items-center justify-center gap-10">
            <button className="absolute top-6 right-6 text-white" onClick={() => setOpen(false)}><X className="w-8 h-8" /></button>
            {links.map((item, i) => (
              <a key={i} href={item.href} onClick={() => setOpen(false)}
                className={`font-bebas text-[40px] tracking-[4px] ${item.label.includes("BOOK") ? "text-accent-red" : "text-white"}`}>
                {item.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

