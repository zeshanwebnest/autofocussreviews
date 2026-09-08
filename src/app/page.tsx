import { Navbar } from '@/components/marketing/Navbar';
import { Hero } from '@/components/marketing/Hero';
import { ProblemSection } from '@/components/marketing/ProblemSection';
import { CostOfDoingNothing } from '@/components/marketing/CostOfDoingNothing';
import { SolutionFlow } from '@/components/marketing/SolutionFlow';
import { FeaturesSection } from '@/components/marketing/FeaturesSection';
import { HowItWorksSection } from '@/components/marketing/HowItWorksSection';
import { LiveDemoSection } from '@/components/marketing/LiveDemoSection';
import { PricingSection } from '@/components/marketing/PricingSection';
import { FaqSection } from '@/components/marketing/FaqSection';
import { FinalCta } from '@/components/marketing/FinalCta';
import { Footer } from '@/components/marketing/Footer';

export default function MarketingLandingPage() {
  return (
    <main className="min-h-screen bg-white text-[#0B1220]">
      {/* 1. Sticky Nav */}
      <Navbar />

      {/* 2. Hero Section */}
      <Hero />

      {/* 3. The Problem Section */}
      <ProblemSection />

      {/* 4. The Cost of Doing Nothing (Mandatory 3 Questions) */}
      <CostOfDoingNothing />

      {/* 5. The Solution Flow */}
      <SolutionFlow />

      {/* 6. Features Section */}
      <FeaturesSection />

      {/* 7. How It Works Section */}
      <HowItWorksSection />

      {/* 8. Live Interactive Demo */}
      <LiveDemoSection />

      {/* 9. Pricing Section */}
      <PricingSection />

      {/* 10. FAQ Section */}
      <FaqSection />

      {/* 11. Final CTA Banner */}
      <FinalCta />

      {/* Footer */}
      <Footer />
    </main>
  );
}
