import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import MarqueeBanner from "@/components/MarqueeBanner";
import SwipeManifesto from "@/components/SwipeManifesto";
import Truth from "@/components/Truth";
import Collection from "@/components/Collection";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import ManifestBanner from "@/components/ManifestBanner";
import Footer from "@/components/Footer";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";

export default function Home() {
  return (
    <main id="top" className="min-h-screen bg-background selection:bg-accent-red selection:text-white">
      <Navbar />
      <div className="pt-16"><MarqueeBanner variant="dark" /></div>
      <Hero />
      <SwipeManifesto />
      <Truth />
      <HowItWorks />
      <Collection />
      <Features />
      <MarqueeBanner variant="red" />
      <TestimonialCarousel />
      <FAQ />
      <CTA />
      <ManifestBanner />
      <Footer />
    </main>
  );
}
