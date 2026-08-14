import SEOHead from "./SEOHead";
import Navbar from "./Navbar";
import Hero from "./Hero";
import TrustCredibilityBar from "./TrustCredibilityBar";
import ProblemSection from "./ProblemSection";
import EcosystemSection from "./EcosystemSection";
import InteractiveWorkflowSection from "./InteractiveWorkflowSection";
import IndustrySection from "./IndustrySection";
import GlobalPlatformSection from "./GlobalPlatformSection";
import AdministrationSection from "./AdministrationSection";
import MultiDeviceSection from "./MultiDeviceSection";
import ObjectionFaqSection from "./ObjectionFaqSection";
import Footer from "./Footer";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-200 selection:text-blue-900 font-sans antialiased">
      <SEOHead />
      <Navbar />
      <main>
        <Hero />
        <TrustCredibilityBar />
        <ProblemSection />
        <EcosystemSection />
        <InteractiveWorkflowSection />
        <IndustrySection />
        <GlobalPlatformSection />
        <AdministrationSection />
        <MultiDeviceSection />
        <ObjectionFaqSection />
      </main>
      <Footer />
    </div>
  );
}
