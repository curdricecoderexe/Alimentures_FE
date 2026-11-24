import SEO from '../../components/SEO';
import { ABOUT_SEO } from '../../lib/seo';
import { WhyWeStarted, OurCommitment, OurStorySection, ThreeSPhilosophy, CraftingGold, useHashScroll } from '../../components/story/StorySections';

/* About Us — Why we started → Our commitment → Built on a mission →
   The 3S philosophy → Crafting grains into gold. (Our Story was merged in
   here; /our-story redirects to /about#story.) */
export default function About() {
  useHashScroll();
  return (
    <div className="min-h-screen bg-cream text-ink relative font-sans">
      <SEO title={ABOUT_SEO.title} description={ABOUT_SEO.description} url="/about" />
      <WhyWeStarted first />
      <OurCommitment />
      <OurStorySection />
      <ThreeSPhilosophy />
      <CraftingGold />
    </div>
  );
}
