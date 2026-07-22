import SEOHead from '@/components/SEOHead';
import ChatWidget from '@/components/chat/ChatWidget';
import { useApp } from '@/contexts/AppContext';
import HeroSection from '@/components/home/HeroSection';
import AuthorityBanner from '@/components/home/AuthorityBanner';
import SleepScienceSection from '@/components/home/SleepScienceSection';
import FiberSection from '@/components/home/FiberSection';
import FarmStorySection from '@/components/home/FarmStorySection';
import ProcessSection from '@/components/home/ProcessSection';
import CertificationsSection from '@/components/home/CertificationsSection';
import BrandHeritageSection from '@/components/home/BrandHeritageSection';
import MediaCoverageSection from '@/components/home/MediaCoverageSection';
import CultureShowcaseSection from '@/components/home/CultureShowcaseSection';
import GrowerNetworkSection from '@/components/home/GrowerNetworkSection';

export default function Index() {
  const { locale } = useApp();
  return (
    <div className="min-h-screen">
      <SEOHead
        title={locale === 'zh' ? '新西兰最大羊驼纤维品牌' : 'New Zealand Premium Alpaca Fiber Brand'}
        description={locale === 'zh' ? '太平洋羊驼 — 自2001年起，专注奢华羊驼纤维寝具，800+合作牧场，全球深睡新标准。' : 'Pacific Alpacas — Since 2001, luxury alpaca fiber bedding from 800+ partner farms. The new standard of deep sleep.'}
      />
      <HeroSection />
      <AuthorityBanner />
      <CertificationsSection />
      <SleepScienceSection />
      <FiberSection />
      <FarmStorySection />
      <ProcessSection />
      <BrandHeritageSection />
      <MediaCoverageSection />
      <CultureShowcaseSection />
      <GrowerNetworkSection />
      <ChatWidget />
    </div>
  );
}
