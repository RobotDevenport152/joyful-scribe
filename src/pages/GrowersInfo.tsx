import { useState, lazy, Suspense } from 'react';
import { useApp } from '@/contexts/AppContext';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, CreditCard, MapPin, Scale, Scissors, TreePine, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { MapPoint } from '@/components/growers/FarmMap';

const FarmMap = lazy(() => import('@/components/growers/FarmMap'));

const WHY_JOIN = [
  { icon: DollarSign, titleEn: '100% Payout Record', titleZh: '100%付款记录', descEn: 'We have paid out every season since 2010', descZh: '自2010年以来每季按时付款' },
  { icon: CreditCard, titleEn: 'Grower Credit', titleZh: '牧场主信用额度', descEn: 'Use your fibre supply as credit toward purchasing our products at below-wholesale prices', descZh: '用您的纤维供应作为信用额度，以低于批发价购买产品' },
  { icon: MapPin, titleEn: 'Collection Points', titleZh: '收集站点', descEn: 'We have pickup points across all of New Zealand', descZh: '全新西兰设有收集站点' },
  { icon: Scale, titleEn: 'Fair Grading', titleZh: '公平分级', descEn: 'Fibre is graded by colour and micron at our Cromwell facility', descZh: '在我们的Cromwell工厂按颜色和微米数分级' },
];

const STEPS = [
  { en: 'Register online and obtain your Fibre Pool number', zh: '在线注册并获取您的纤维池编号', phase: 'Sep – Jan' },
  { en: 'Shear your alpacas', zh: '为您的羊驼剪毛', phase: 'Sep – Jan' },
  { en: 'Complete a Fibre Consignment Receipt (FCR) and weigh sheet for each bag', zh: '为每袋填写纤维委托收据 (FCR) 和重量表', phase: 'Jan – Jul' },
  { en: 'Bag and label your fibre using a Pacific Alpacas bale clip', zh: '使用太平洋羊驼打包夹打包并标记纤维', phase: 'Jan – Jul' },
  { en: 'Drop your fibre at your nearest collection point', zh: '将纤维送到最近的收集站点', phase: 'Jan – Jul' },
  { en: 'Fibre is transported to our Cromwell facility', zh: '纤维运往我们的Cromwell工厂', phase: 'Jan – Jul' },
  { en: 'Grading, scouring and processing at Cromwell', zh: '在Cromwell进行分级、清洗和加工', phase: 'Apr – Nov' },
  { en: 'Receive your payout (November – December)', zh: '收到付款 (11月至12月)', phase: 'Nov – Dec' },
];

// Collection Points Data
const COLLECTION_NORTH = [
  { name: 'Matakana Alpacas', contact: 'Cushla de Clare', phone: '027 850 0295', region: 'Maungatapere, Northland', lat: -35.85, lng: 174.07 },
  { name: 'Silverhill', contact: 'Valerie Bushell', phone: '027 486 8756', region: 'Matakohe', lat: -36.18, lng: 174.24 },
  { name: 'Gumtree Gully', contact: 'Kathy Roscoe', phone: '021 577 789', region: 'Warkworth', lat: -36.40, lng: 174.70 },
  { name: 'Pacific Alpacas Head Office No 2', contact: 'Steve', phone: '021 640 707', region: 'Albany Auckland', lat: -36.73, lng: 174.71 },
  { name: 'Jan White', contact: 'Jan White', phone: '07 826 4460', region: 'Te Kauwhata', lat: -37.40, lng: 175.16 },
  { name: 'Kisimul Farm Alpacas', contact: 'Jan and Roger', phone: '021 303 323 / 021 623 613', region: 'Te Ranga', lat: -37.83, lng: 175.89 },
  { name: 'Q Taz Alpacas', contact: 'Lyn Skilling', phone: '07 862 4646', region: 'Paeroa', lat: -37.36, lng: 175.67 },
  { name: 'Nevalea Alpacas', contact: 'Leonie or Neville Walker', phone: '07 896 6333', region: 'Taumarunui', lat: -38.88, lng: 175.26 },
  { name: 'Hill Country Alpacas', contact: 'Laraine Carter', phone: '021 122 8952', region: 'Katikati', lat: -37.55, lng: 175.92 },
  { name: 'Lisa Reeves', contact: 'Lisa Reeves', phone: '022 324 5442', region: 'Ohauiti Tauranga', lat: -37.73, lng: 176.11 },
  { name: 'Bruden Alpacas', contact: 'Denise and Bruce', phone: '027 500 5016', region: 'Ngongotaha, Rotorua', lat: -38.08, lng: 176.20 },
  { name: 'Brenor Alpacas', contact: 'Brendra Gainsford', phone: '07 332 2336', region: 'Ngongotaha, Rotorua', lat: -38.09, lng: 176.21 },
  { name: 'Bonnack Grove Alpacas', contact: 'Peter & Stephanie', phone: '021 144 8043', region: 'Feilding', lat: -40.22, lng: 175.57 },
  { name: 'West Peak Alpacas', contact: 'Greg Player', phone: '021 471 875', region: 'New Plymouth', lat: -39.06, lng: 174.07 },
  { name: 'Raydene', contact: 'Yvonne or Donald Monk', phone: '06-857 7221', region: 'Waipawa', lat: -39.94, lng: 176.59 },
  { name: 'Silverleigh Alpacas', contact: 'Lynette & Stephen Gopperth', phone: '06 754 8147', region: 'Waitara', lat: -38.97, lng: 174.23 },
  { name: 'Te Korito Alpacas', contact: 'Stephen Kellam', phone: '021 813 746', region: 'Wanganui', lat: -39.93, lng: 175.05 },
  { name: 'Legacy Alpacas', contact: 'Marion', phone: '021 123 00439', region: 'Masterton Clateville', lat: -40.96, lng: 175.66 },
  { name: 'Nohoroa Farming Partnership', contact: 'John & Tricia Leighton', phone: '021 101 7535', region: 'Masterton Waikanae', lat: -40.88, lng: 175.00 },
  { name: 'Koroki Alpacas', contact: 'Cherryl', phone: '06 379 7892', region: 'Carterton', lat: -41.02, lng: 175.52 },
  { name: 'Cynthia Ogilvy', contact: 'Cynthia', phone: '022 355 0337', region: 'Katikati', lat: -37.56, lng: 175.93 },
];

const COLLECTION_SOUTH = [
  { name: 'Chris Kempthorne', contact: 'Chris Kempthorne', phone: '027 606 2874', region: 'Brightwater, Nelson', lat: -41.42, lng: 173.11 },
  { name: 'Drysdale Alpaca', contact: 'Angela McNaughton', phone: '021 45 6234', region: 'Alexandra', lat: -45.25, lng: 169.38 },
  { name: 'Little Oaks Alpacas', contact: 'Allan Grant', phone: '027 227 5430', region: 'Oamaru', lat: -45.10, lng: 170.97 },
  { name: 'Geardale Alpacas', contact: 'Philip Geary', phone: '027 208 0027', region: 'Gore', lat: -46.10, lng: 168.95 },
  { name: 'Cornish Point Development Ltd (Head Office No1)', contact: 'Jason', phone: '021 484 936', region: 'Cromwell', lat: -45.04, lng: 169.20 },
  { name: 'Bruce Farm Alpacas', contact: 'Kim & Kathryn Palin', phone: '027 55 0796', region: 'Hillend', lat: -46.33, lng: 168.33 },
  { name: 'Farmers Corner', contact: 'Letitia', phone: '027 244 6872', region: 'Ashburton', lat: -43.90, lng: 171.73 },
  { name: 'Karaka Alpacas', contact: 'Greg Knox', phone: '027 758 4736', region: 'Dunedin', lat: -45.88, lng: 170.50 },
  { name: 'Chris Dahlberg', contact: 'Chris Dahlberg', phone: '021 663 334', region: 'North Canterbury', lat: -43.40, lng: 172.50 },
  { name: 'The Wool Shed & More', contact: 'Sandy', phone: '021 631 793', region: 'Waikouaiti', lat: -45.62, lng: 170.70 },
  { name: 'Otaio Bridge Alpacas', contact: 'Ineke Van Neuren', phone: '021 0243 6087', region: 'Waimate (Timaru)', lat: -44.73, lng: 171.05 },
  { name: 'Sunstone Alpacas', contact: 'Simon Newcombe', phone: '027 410 0418', region: 'Timaru', lat: -44.40, lng: 171.25 },
  { name: 'Kepler Mountain', contact: 'Jessie Haanen', phone: '027 354 5960', region: 'Manapouri', lat: -45.56, lng: 167.60 },
  { name: 'Pak Co Limited', contact: 'Peter & Anita Kingma', phone: '027 278 9806', region: 'Milton', lat: -46.12, lng: 169.97 },
  { name: 'Chainey', contact: 'Shelly Chainey', phone: '027 229 9367', region: 'Makarewa, Invercargill', lat: -46.41, lng: 168.35 },
  { name: 'Alpaca Gully', contact: 'Jenny', phone: '021 038 5320', region: 'Greta Valley', lat: -42.86, lng: 173.08 },
];

// Shearers Data
const SHEARERS = [
  { name: 'Allan Oldfield', contact: '027 529 2491', region: 'Wellington, Wairarapa, Horowhenua to Palmerston North', nails: true, injection: true },
  { name: "Sean's Shearing (Andy)", contact: '027 309 4453', region: 'North Island', nails: true, injection: true },
  { name: 'Shear Light (Cass)', contact: '021 034 9950', region: 'Nationwide', nails: true, injection: true },
  { name: 'Daniel Wark', contact: '03 485 9771', region: 'Central Otago', nails: false, injection: false },
  { name: 'Ebel Shearing Services', contact: 'alpaca-shearing.com', region: 'Nationwide', nails: true, injection: true },
  { name: 'Thief of Hearts (Eric Lister)', contact: '027 325 8101', region: 'Palmerston North', nails: true, injection: true },
  { name: 'Eweniversal Shearing', contact: '022 078 0919', region: 'Canterbury, Otago, Southland', nails: true, injection: true },
  { name: 'Gallagher (Cass & Ron)', contact: 'email only', region: '—', nails: false, injection: false },
  { name: 'Gus Patterson', contact: '027 303 0544', region: 'Canterbury, Otago', nails: true, injection: true },
  { name: 'James Dixon', contact: '0061-242-570-120', region: 'Otago, Canterbury', nails: true, injection: true },
  { name: 'JB Farm Services (Jared Bambry)', contact: '027 259 5062', region: 'Hawkes Bay to Wellington', nails: true, injection: true },
  { name: 'Jeremy Martin', contact: '022 301 9912', region: 'Northland, Auckland, Waikato', nails: true, injection: true },
  { name: 'Waiheke Alpaca (Keenan & Lisa Scott)', contact: '021 033 5589', region: 'North Island', nails: true, injection: true },
  { name: 'Laura Schwerdtfeger (Lifestyle Vets)', contact: '027 838 5433', region: 'Auckland, Rodney (Emergency)', nails: false, injection: false },
  { name: 'Leon Jovanovic', contact: '027 372 8860', region: 'Western Bay of Plenty', nails: true, injection: true },
  { name: 'Mesa Land', contact: '027-442-6847', region: 'Northland', nails: false, injection: false },
  { name: 'Matthews Shearing (Michael Matthews)', contact: '027 337 8925', region: 'South Island', nails: true, injection: true },
  { name: 'Shearpac (Mike Banks)', contact: '021-256-2839', region: 'Nationwide', nails: true, injection: true },
  { name: 'Mr Clip', contact: '027 485 3234', region: 'Auckland and North', nails: true, injection: true },
  { name: 'Nigel Wood', contact: '027 468 1903', region: 'Nationwide', nails: true, injection: true },
  { name: "Sean's Shearing (Sean)", contact: '027 484 4047', region: 'North Island', nails: true, injection: true },
  { name: 'Shun Oishu', contact: '021-029 31781', region: 'Auckland, Northland, Canterbury', nails: true, injection: true },
  { name: 'Wilton Small Mob Shearing (Mike & Nicola)', contact: '020 4011 7629', region: 'South Canterbury', nails: true, injection: true },
];

// Visit A Farm Data
const FARMS_NORTH = [
  { name: 'Cornerstone Alpaca Stud', region: 'Gordonton, Waikato', feature: '120+ alpacas, farm shop, 1hr from Auckland', featureZh: '120+羊驼，农场商店，距奥克兰1小时', lat: -37.63, lng: 175.25 },
  { name: 'Coroglen Alpacas', region: 'Coromandel Peninsula', feature: 'Farmstay accommodation, 17 acres, ocean views', featureZh: '农庄住宿，17英亩，可观海', lat: -36.79, lng: 175.62 },
  { name: 'Hill Country Alpacas', region: 'Katikati, Bay of Plenty', feature: '30 alpacas, handmade fibre textiles', featureZh: '30头驼，自产纤维纺织品', lat: -37.55, lng: 175.92 },
  { name: 'Lavender Hill', region: 'Near Auckland', feature: 'B&B accommodation, lavender farm, gift shop', featureZh: 'B&B住宿，薰衣草农庄，礼品店', lat: -36.92, lng: 174.78 },
  { name: 'Minffordd Alpaca Farm', region: 'Feilding', feature: 'Cottage accommodation, breeding since 2004', featureZh: '小屋住宿，养驼自2004年', lat: -40.22, lng: 175.57 },
  { name: 'Moonacre Alpacas', region: 'Eltham, Taranaki', feature: '60+ alpacas, group bus tours welcome', featureZh: '60+头驼，团体巴士游览欢迎', lat: -39.43, lng: 174.30 },
  { name: 'Nevalea Alpacas', region: 'Taumarunui', feature: "NZ's largest alpaca farm, 800+ head, Alpaca Trek", featureZh: '新西兰最大羊驼农场，800+头，羊驼Trek', lat: -38.88, lng: 175.26 },
  { name: 'Perfect Alpaca Farm', region: 'South of Warkworth', feature: '64 alpacas, hand-feeding experience', featureZh: '64头驼，手喂体验', lat: -36.50, lng: 174.70 },
  { name: 'Silverhill Alpacas', region: 'Northland, Kaipara Harbour', feature: 'Coloured alpaca specialist, harbour views', featureZh: '有色驼专精，可眺望Kaipara港', lat: -36.18, lng: 174.24 },
  { name: 'Te Korito Alpacas', region: 'Whanganui', feature: '20 alpacas, led walks, fibre products for sale', featureZh: '20头驼，牵驼散步，羊驼纤维产品销售', lat: -39.93, lng: 175.05 },
];

const FARMS_SOUTH = [
  { name: 'Altnaharra Alpacas', region: 'Nelson, Tasman', feature: '27 alpacas, sea & mountain views, needle felting', featureZh: '27头驼，海山风景，针刺毡艺', lat: -41.27, lng: 173.28 },
  { name: 'Establo Alpaca Farm', region: 'Dunedin', feature: '27 alpacas, historic bluestone barn, 1860s heritage', featureZh: '27头驼，历史蓝石谷仓，1860年代遗址', lat: -45.88, lng: 170.50 },
  { name: 'Gem Alpacas', region: 'South Canterbury', feature: 'Farm visits with alpacas and huarizo', featureZh: '农场参观，含羊驼和羊驼骆马', lat: -44.20, lng: 171.50 },
  { name: 'Honeyfields Alpaca Farm', region: '15min from Christchurch Airport', feature: '60+ alpacas, farmstay, honey products', featureZh: '60+头驼，农庄住宿，蜂蜜产品', lat: -43.48, lng: 172.55 },
  { name: 'Kepler Mountain View Alpacas', region: 'Lake Manapouri, Fiordland', feature: 'Adjacent to Fiordland National Park, Wild Wool Gallery', featureZh: '毗邻峡湾国家公园，Wild Wool Gallery', lat: -45.56, lng: 167.60 },
  { name: 'Otaio Bridge Alpacas', region: 'Waimate, South Timaru', feature: 'Led alpaca walks, handmade souvenirs', featureZh: '可牵驼散步，手工纪念品', lat: -44.73, lng: 171.05 },
  { name: "Sacred Coast Suri (Falcon's Rise)", region: 'Blenheim, Marlborough', feature: 'Suri alpaca specialist, farm shop', featureZh: '专精Suri驼，有农场商店', lat: -41.52, lng: 173.96 },
  { name: 'Shamarra Alpacas', region: 'Banks Peninsula, Canterbury', feature: '160+ alpacas, luxury knitwear, ocean views', featureZh: '160+头驼，奢华针织品，Banks半岛海景', lat: -43.80, lng: 173.00 },
  { name: 'Warwickz Farm', region: 'Canterbury Plains', feature: '200+ animals, 40+ breeds, 20+ species', featureZh: '200+动物，40+品种，20+物种', lat: -43.80, lng: 172.30 },
  { name: 'Windermere Alpacas & Llamas', region: 'Milton, Otago', feature: 'Includes llamas, handwoven products', featureZh: '含羊驼骆马，手工编织产品', lat: -46.12, lng: 169.97 },
];

const PROGRAMME_STATS = [
  { value: '9', labelEn: 'Seasons Running', labelZh: '运营季节' },
  { value: '39', labelEn: 'Collection Points', labelZh: '收集站点' },
  { value: '622', labelEn: 'Registered Growers', labelZh: '注册牧场主' },
];

const FAQ = [
  {
    qEn: 'What are fibre grades?',
    qZh: '什么是纤维等级？',
    aEn: 'Fibre is graded by colour (white, fawn, light fawn, grey, brown) and micron count at our Cromwell facility. Grade determines the per-kg payout rate — finer, whiter fibre achieves a higher price.',
    aZh: '纤维在我们的Cromwell工厂按颜色（白色、浅棕、浅棕驼、灰色、棕色）和微米数分级。等级决定每公斤的付款金额——越细越白的纤维价格越高。',
  },
  {
    qEn: 'How does the payment work?',
    qZh: '付款是如何运作的？',
    aEn: 'Once your fibre has been graded and processed, we calculate your payout based on the grade and weight of your consignment. Payments are made in November–December each year. We have a 100% payout record since 2010.',
    aZh: '您的纤维经过分级和加工后，我们根据您的托运物的等级和重量计算您的付款金额。付款在每年11月至12月进行。我们自2010年以来保持100%付款记录。',
  },
  {
    qEn: 'Do I need to register before dropping off fibre?',
    qZh: '在送交纤维前我需要先注册吗？',
    aEn: 'Yes. You must register online and obtain a Fibre Pool number before dropping off any fibre. Collection Points will not accept fibre from unregistered growers. Click the "Register as a Grower" button below to get started.',
    aZh: '是的。在送交任何纤维前，您必须先在线注册并获取纤维池编号。收集站点不接受未注册牧场主的纤维。点击下方"注册成为牧场主"按钮开始注册。',
  },
  {
    qEn: 'What is a Fibre Consignment Receipt (FCR)?',
    qZh: '什么是纤维委托收据 (FCR)？',
    aEn: 'An FCR is the official document that accompanies every bag of fibre you drop off. It records your details, the bag weight, the alpaca details, and the colour grade. You must complete an FCR for each bag before drop-off.',
    aZh: 'FCR是伴随您送交的每袋纤维的官方文件。它记录了您的信息、包重、羊驼详情和颜色等级。您必须在送交前为每袋填写FCR。',
  },
  {
    qEn: 'What is a Grower Credit and how do I use it?',
    qZh: '什么是牧场主信用额度，如何使用？',
    aEn: 'Grower Credit is a purchasing credit equal to your estimated minimum payout. You can use it immediately to buy Pacific Alpacas products at below-wholesale prices — before your fibre has even been processed.',
    aZh: '牧场主信用额度是等于您的预计最低付款额的购买信用额度。您可以立即用它以低于批发价购买太平洋羊驼产品——甚至在您的纤维被加工之前。',
  },
  {
    qEn: 'When are collection points open?',
    qZh: '收集站点何时开放？',
    aEn: 'Collection points are open for fibre drop-off between January and July each year. Exact dates vary by location — contact your nearest collection point directly to confirm their schedule.',
    aZh: '收集站点每年1月至7月开放接收纤维。具体日期因地点而异——请直接联系您最近的收集站点确认时间表。',
  },
  {
    qEn: 'What weight of fibre do I need to participate?',
    qZh: '参与需要多少重量的纤维？',
    aEn: 'There is no minimum weight requirement. We welcome growers of all herd sizes, from single-alpaca hobby farms to large commercial studs.',
    aZh: '没有最低重量要求。我们欢迎各种规模的牧场主，从单头羊驼的爱好农场到大型商业种畜场。',
  },
  {
    qEn: 'Can I drop off fibre from multiple alpacas in one bag?',
    qZh: '我可以将多头羊驼的纤维放在一个袋子里吗？',
    aEn: 'You can combine fibre from multiple alpacas of the same colour grade into one bag. Fibre of different grades must be kept in separate bags to ensure accurate grading and correct payment.',
    aZh: '您可以将相同颜色等级的多头羊驼的纤维合并到一个袋子中。不同等级的纤维必须分开装袋，以确保准确分级和正确付款。',
  },
  {
    qEn: 'What if I miss the collection window?',
    qZh: '如果我错过了收集窗口期怎么办？',
    aEn: 'If you miss the January–July window, your fibre can be held until the following season\'s drop-off period. Contact us at info@pacificalpacas.nz to make arrangements.',
    aZh: '如果您错过了1月至7月的窗口期，您的纤维可以保留到下一季的送交期。请通过info@pacificalpacas.nz联系我们进行安排。',
  },
  {
    qEn: 'How do I use a bale clip?',
    qZh: '如何使用打包夹？',
    aEn: 'Attach the Pacific Alpacas bale clip to your filled bag before drop-off. The clip holds your FCR and identifies your consignment throughout the processing chain. See the guide below for step-by-step instructions.',
    aZh: '在送交前将太平洋羊驼打包夹附到您装好的袋子上。打包夹保存您的FCR并在整个加工链中识别您的托运物。请参阅下方的逐步操作指南。',
  },
];

type TabKey = 'collection' | 'shearers' | 'farms';

interface FaqItemProps {
  item: typeof FAQ[number];
  locale: string;
}

function FaqItem({ item, locale }: FaqItemProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/40 transition-colors"
      >
        <span className="font-body text-sm font-medium pr-4">{locale === 'zh' ? item.qZh : item.qEn}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 font-body text-sm text-muted-foreground leading-relaxed">
              {locale === 'zh' ? item.aZh : item.aEn}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function GrowersInfoPage() {
  const { locale } = useApp();
  const [activeTab, setActiveTab] = useState<TabKey>('collection');

  const renderCollectionTable = (data: typeof COLLECTION_NORTH, islandZh: string, islandEn: string) => (
    <div className="mb-10">
      <h3 className="font-display text-xl font-semibold mb-4 text-gold">
        {locale === 'zh' ? islandZh : islandEn}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left p-3 font-semibold">{locale === 'zh' ? '名称' : 'Name'}</th>
              <th className="text-left p-3 font-semibold">{locale === 'zh' ? '联系人' : 'Contact'}</th>
              <th className="text-left p-3 font-semibold">{locale === 'zh' ? '电话' : 'Phone'}</th>
              <th className="text-left p-3 font-semibold">{locale === 'zh' ? '地区' : 'Region'}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <tr key={i} className="border-b border-border hover:bg-muted/30 transition-colors">
                <td className="p-3 font-medium">{item.name}</td>
                <td className="p-3 text-muted-foreground">{item.contact}</td>
                <td className="p-3">
                  <a href={`tel:${item.phone.replace(/\s/g, '')}`} className="text-gold hover:underline">{item.phone}</a>
                </td>
                <td className="p-3 text-muted-foreground">{item.region}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFarmsGrid = (data: typeof FARMS_NORTH, islandZh: string, islandEn: string) => (
    <div className="mb-10">
      <h3 className="font-display text-xl font-semibold mb-4 text-gold">
        {locale === 'zh' ? islandZh : islandEn}
      </h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((farm, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="bg-card rounded-lg border border-border p-5 hover:border-gold/30 transition-colors"
          >
            <h4 className="font-display text-base font-semibold mb-1">{farm.name}</h4>
            <p className="text-xs text-gold font-body mb-2">{farm.region}</p>
            <p className="text-xs text-muted-foreground font-body">{locale === 'zh' ? farm.featureZh : farm.feature}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title={locale === 'zh' ? '牧场合作信息 — 太平洋羊驼' : 'Grower Information — Pacific Alpacas'}
        description={locale === 'zh' ? '查找收集点、剪毛师和可参观的羊驼农场' : 'Find collection points, shearers and farms to visit'}
      />

      {/* Hero */}
      <section className="pt-24 pb-12 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-4xl md:text-5xl mb-4">
              {locale === 'zh' ? '成为合作牧场主' : 'Become a Grower Partner'}
            </h1>
            <p className="font-body text-primary-foreground/70 max-w-2xl mx-auto mb-8">
              {locale === 'zh'
                ? '太平洋羊驼是新西兰最大的羊驼纤维池。我们与全国900多个牧场和种畜场合作。'
                : "Pacific Alpacas is New Zealand's largest alpaca fibre pool. We partner with over 900 farms and studs across the country."}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/contact"
                className="px-6 py-3 bg-accent text-accent-foreground font-body text-sm font-semibold tracking-wider rounded-sm hover:bg-accent/90 transition">
                {locale === 'zh' ? '立即加入' : 'Join Now'}
              </Link>
              <Link to="/wholesale"
                className="px-6 py-3 bg-primary-foreground/10 border border-primary-foreground/30 font-body text-sm font-semibold tracking-wider rounded-sm hover:bg-primary-foreground/20 transition">
                {locale === 'zh' ? '收购纤维' : 'Buy Fibre'}
              </Link>
              <Link to="/login"
                className="px-6 py-3 bg-primary-foreground/10 border border-primary-foreground/30 font-body text-sm font-semibold tracking-wider rounded-sm hover:bg-primary-foreground/20 transition">
                {locale === 'zh' ? '养殖户登录' : 'Grower Login'}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="flex-1 py-16">
        <div className="container mx-auto px-6">
          {/* Why Join */}
          <div className="max-w-5xl mx-auto mb-16">
            <h2 className="font-display text-2xl md:text-3xl text-center mb-8">
              {locale === 'zh' ? '为什么加入我们' : 'Why Join Us'}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {WHY_JOIN.map((item, i) => (
                <motion.div key={item.titleEn} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="bg-card rounded-lg border border-border p-6 text-center hover:border-gold/30 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-6 h-6 text-gold" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">{locale === 'zh' ? item.titleZh : item.titleEn}</h3>
                  <p className="text-xs text-muted-foreground font-body">{locale === 'zh' ? item.descZh : item.descEn}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Programme Stats */}
          <div className="max-w-3xl mx-auto mb-16">
            <div className="grid grid-cols-3 gap-6 bg-primary text-primary-foreground rounded-lg p-8">
              {PROGRAMME_STATS.map((s) => (
                <div key={s.labelEn} className="text-center">
                  <p className="font-display text-4xl font-light text-gold">{s.value}</p>
                  <p className="font-body text-xs text-primary-foreground/60 mt-1 uppercase tracking-wider">
                    {locale === 'zh' ? s.labelZh : s.labelEn}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-center font-body text-sm text-muted-foreground mt-4">
              {locale === 'zh'
                ? '自计划启动以来，我们已收购超过 50,000 公斤纤维'
                : 'We have sold over 50,000 kg of fibre since starting this programme'}
            </p>
          </div>

          {/* How It Works — 8-step seasonal timeline */}
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-2xl md:text-3xl text-center mb-10">
              {locale === 'zh' ? '如何运作' : 'How It Works'}
            </h2>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
              {STEPS.map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                  className="flex items-start gap-5 mb-6 last:mb-0 relative">
                  <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center flex-shrink-0 font-display font-semibold text-sm z-10">
                    {i + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-body text-sm leading-relaxed">{locale === 'zh' ? step.zh : step.en}</p>
                  </div>
                  <span className="flex-shrink-0 text-[10px] font-body text-muted-foreground bg-muted px-2 py-0.5 rounded-full mt-1 whitespace-nowrap">
                    {step.phase}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Grower Credit */}
          <div className="max-w-3xl mx-auto mb-16">
            <div className="bg-gold/10 border border-gold/20 rounded-lg p-8">
              <h3 className="font-display text-xl font-semibold mb-3">
                {locale === 'zh' ? '牧场主信用额度说明' : 'Grower Credit Explained'}
              </h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">
                {locale === 'zh'
                  ? '牧场主信用额度是太平洋羊驼向贡献纤维的牧场主提供的产品购买信用额度。它等于您的纤维重量 × 我们对最低等级的估计最低每公斤付款额。'
                  : "Grower Credit is the credit Pacific Alpacas extends to contributing growers toward product purchases. It equals your fibre weight × our estimated minimum payout per kg for the lowest grade."}
              </p>
            </div>
          </div>

          {/* Interactive Map */}
          <div className="max-w-6xl mx-auto mb-16">
            <h2 className="font-display text-2xl md:text-3xl text-center mb-3">
              {locale === 'zh' ? '全国收集点与可参观农场' : 'Collection Points & Farm Visits Across NZ'}
            </h2>
            <p className="text-center text-sm text-muted-foreground font-body mb-6">
              {locale === 'zh'
                ? '点击地图上的标记查看详细信息 — 绿色为收集点，金色为可参观农场'
                : 'Click any marker for details — green = collection points, gold = farm visits'}
            </p>
            <Suspense fallback={
              <div className="h-[480px] rounded-lg border border-border bg-muted/30 flex items-center justify-center font-body text-sm text-muted-foreground">
                {locale === 'zh' ? '地图加载中…' : 'Loading map…'}
              </div>
            }>
              <FarmMap
                locale={locale}
                points={[
                  ...COLLECTION_NORTH.map(p => ({ ...p, type: 'collection' as const })),
                  ...COLLECTION_SOUTH.map(p => ({ ...p, type: 'collection' as const })),
                  ...FARMS_NORTH.map(p => ({ name: p.name, lat: p.lat, lng: p.lng, region: p.region, feature: locale === 'zh' ? p.featureZh : p.feature, type: 'farm' as const })),
                  ...FARMS_SOUTH.map(p => ({ name: p.name, lat: p.lat, lng: p.lng, region: p.region, feature: locale === 'zh' ? p.featureZh : p.feature, type: 'farm' as const })),
                ]}
              />
            </Suspense>
          </div>

          {/* Tabs: Collection Points, Shearers, Visit A Farm */}
          <div className="max-w-6xl mx-auto mb-16">
            <Tabs defaultValue="collection" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="collection" className="font-body text-sm">
                  <MapPin className="w-4 h-4 mr-2" />
                  {locale === 'zh' ? '收集点' : 'Collection Points'}
                </TabsTrigger>
                <TabsTrigger value="shearers" className="font-body text-sm">
                  <Scissors className="w-4 h-4 mr-2" />
                  {locale === 'zh' ? '剪毛师' : 'Shearers'}
                </TabsTrigger>
                <TabsTrigger value="farms" className="font-body text-sm">
                  <TreePine className="w-4 h-4 mr-2" />
                  {locale === 'zh' ? '参观农场' : 'Visit A Farm'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="collection">
                {renderCollectionTable(COLLECTION_NORTH, '北岛', 'North Island')}
                {renderCollectionTable(COLLECTION_SOUTH, '南岛', 'South Island')}

                <div className="mt-8 bg-muted/50 border border-border rounded-lg p-6">
                  <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-gold" />
                    {locale === 'zh' ? '动物福利守则合规要求' : 'Code of Welfare Compliance'}
                  </h3>
                  <p className="text-sm font-body text-muted-foreground mb-3">
                    {locale === 'zh'
                      ? '太平洋羊驼要求所有牧场主必须完全遵守新西兰农业部于2018年10月1日颁布的《羊驼与美洲驼动物福利守则》（Code of Welfare: Llamas and Alpacas）及其任何修订版本的相关规定。任何希望向太平洋羊驼纤维池供应纤维的牧场主，须填写并提交《动物福利守则合规声明》至 admin@pacificalpacas.nz。'
                      : 'Pacific Alpacas requires all its growers to be fully compliant with the Code of Welfare requirements as detailed in the Code of Welfare: Llamas and Alpacas issued by the Minister of Agriculture dated 1 October 2018, and any amendments. Any grower wanting to supply fibre to the Pacific Alpacas fibre pool will be required to complete and send to admin@pacificalpacas.nz a Code of Welfare attestation.'}
                  </p>
                  <p className="text-sm font-body text-muted-foreground">
                    {locale === 'zh'
                      ? '若太平洋羊驼酌情认定任何人未能满足《羊驼与美洲驼动物福利守则》的相关要求，我们将拒绝收购其纤维。'
                      : 'Pacific Alpacas will refuse to accept fibre from any person(s) who, in Pacific Alpacas’ sole discretion, fails to meet any of the requirements of the Code of Welfare: Llamas and Alpacas.'}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="shearers">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-body">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-3 font-semibold">{locale === 'zh' ? '名称' : 'Name'}</th>
                        <th className="text-left p-3 font-semibold">{locale === 'zh' ? '联系方式' : 'Contact'}</th>
                        <th className="text-left p-3 font-semibold">{locale === 'zh' ? '覆盖区域' : 'Coverage'}</th>
                        <th className="text-center p-3 font-semibold">{locale === 'zh' ? '趾甲' : 'Nails'}</th>
                        <th className="text-center p-3 font-semibold">{locale === 'zh' ? '注射' : 'Injection'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SHEARERS.map((s, i) => (
                        <tr key={i} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-medium">{s.name}</td>
                          <td className="p-3">
                            {s.contact.includes('.com') || s.contact === 'email only' ? (
                              <span className="text-muted-foreground">{s.contact}</span>
                            ) : (
                              <a href={`tel:${s.contact.replace(/\s/g, '')}`} className="text-gold hover:underline">{s.contact}</a>
                            )}
                          </td>
                          <td className="p-3 text-muted-foreground">{s.region}</td>
                          <td className="p-3 text-center">{s.nails ? '✓' : '—'}</td>
                          <td className="p-3 text-center">{s.injection ? '✓' : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="farms">
                {renderFarmsGrid(FARMS_NORTH, '北岛', 'North Island')}
                {renderFarmsGrid(FARMS_SOUTH, '南岛', 'South Island')}
              </TabsContent>
            </Tabs>
          </div>

          {/* How to use a bale clip */}
          <div className="max-w-3xl mx-auto mb-16">
            <div className="bg-card border border-border rounded-lg p-8">
              <h3 className="font-display text-xl font-semibold mb-2">
                {locale === 'zh' ? '如何使用打包夹' : 'How to Use a Bale Clip'}
              </h3>
              <div className="gold-line w-12 mb-5" />
              <ol className="space-y-3">
                {([
                  { en: 'Fill your bag with sorted, dry alpaca fibre of a single colour grade.', zh: '将同一颜色等级的分拣干燥羊驼纤维装入袋中。' },
                  { en: 'Complete your FCR form and weigh sheet, and place a copy inside the bag.', zh: '填写FCR表格和重量表，将副本放入袋中。' },
                  { en: 'Seal the bag and attach the Pacific Alpacas bale clip to the outside.', zh: '密封袋子并将太平洋羊驼打包夹附在袋子外侧。' },
                  { en: 'Write your Fibre Pool number on the clip label clearly.', zh: '在标签上清楚地写上您的纤维池编号。' },
                  { en: 'Drop the sealed, labelled bag at your nearest collection point.', zh: '将密封并贴好标签的袋子送到最近的收集站点。' },
                ] as const).map((item, i) => (
                  <li key={i} className="flex gap-4 font-body text-sm">
                    <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center flex-shrink-0 text-xs font-semibold">
                      {i + 1}
                    </span>
                    <span className="pt-0.5 text-muted-foreground">{locale === 'zh' ? item.zh : item.en}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-2xl md:text-3xl text-center mb-8">
              {locale === 'zh' ? '常见问题' : 'Frequently Asked Questions'}
            </h2>
            <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
              {FAQ.map((item, i) => (
                <FaqItem key={i} item={item} locale={locale} />
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link to="/contact"
              className="inline-block px-10 py-4 bg-accent text-accent-foreground font-body font-semibold rounded-sm tracking-wider hover:bg-accent/90 transition">
              {locale === 'zh' ? '注册成为牧场主' : 'Register as a Grower'}
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
