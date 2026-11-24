import SEO from '../../components/SEO';
import { WHY_CHOOSE_SEO } from '../../lib/seo';
import {
  WhyFamilies, CleanSnackLineup, SuperGrains, AlchemisMatters, FarmToPantry, useHashScroll,
} from '../../components/story/StorySections';

/* Why Choose Us — Alchemi's clean snack lineup → Why families choose Alimenture
   → Powered by ancient super grains → Why Alchemi's matters → Farm to pantry. */
export default function WhyChooseUs() {
  useHashScroll();
  return (
    <div className="min-h-screen bg-cream text-ink relative font-sans">
      <SEO title={WHY_CHOOSE_SEO.title} description={WHY_CHOOSE_SEO.description} url="/why-choose-us" />
      <CleanSnackLineup first />
      <WhyFamilies />
      <SuperGrains />
      <AlchemisMatters />
      <FarmToPantry />
    </div>
  );
}
