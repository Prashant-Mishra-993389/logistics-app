"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function CustomCursor() {
 const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
 const [isHovering, setIsHovering] = useState(false);

 useEffect(() => {
   const updateMousePosition = (e) => {
     setMousePosition({ x: e.clientX, y: e.clientY });
   };
   const handleMouseOver = (e) => {
     const target = e.target;
     if (!(target instanceof HTMLElement)) {
       setIsHovering(false);
       return;
     }
     if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.closest('a') || target.closest('button')) {
       setIsHovering(true);
     } else {
       setIsHovering(false);
     }
   };
   window.addEventListener("mousemove", updateMousePosition);
   window.addEventListener("mouseover", handleMouseOver);
   return () => {
     window.removeEventListener("mousemove", updateMousePosition);
     window.removeEventListener("mouseover", handleMouseOver);
   };
 }, []);

 return (
   <>
     {/* Red dot */}
     <motion.div
       className="fixed top-0 left-0 w-2 h-2 bg-accent-red rounded-full pointer-events-none z-[9999] mix-blend-difference"
       animate={{ x: mousePosition.x - 4, y: mousePosition.y - 4, scale: isHovering ? 0 : 1 }}
       transition={{ type: "tween", ease: "linear", duration: 0 }}
     />
     {/* Outer ring */}
     <motion.div
       className="fixed top-0 left-0 w-8 h-8 rounded-full border border-white/40 pointer-events-none z-[9998] mix-blend-difference"
       animate={{ x: mousePosition.x - 16, y: mousePosition.y - 16, scale: isHovering ? 1.5 : 1, backgroundColor: isHovering ? "rgba(255,255,255,0.1)" : "transparent" }}
       transition={{ type: "spring", stiffness: 500, damping: 28, mass: 0.1 }}
     />
   </>
 );
}

