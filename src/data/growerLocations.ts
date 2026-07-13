import type { MapPoint } from '@/components/growers/FarmMap';

export interface CollectionPoint {
  name: string;
  contact: string;
  phone: string;
  region: string;
  lat: number;
  lng: number;
}

export interface VisitableFarm {
  name: string;
  region: string;
  feature: string;
  featureZh: string;
  description: string;
  descriptionZh: string;
  website: string;
  lat: number;
  lng: number;
}

// "Pacifica Alpacas Growers Club" member roster (source: internal 2025 brand handbook, p.4).
// No region/contact/coordinates were published alongside these names, so they are NOT
// plotted on the map (fabricating coordinates would misrepresent real farm locations) —
// shown instead as a plain member list. A handful overlap with COLLECTION_*/FARMS_* above
// under slightly different names (e.g. "Raydene", "Nevalea" / "Nevalea Alpacas"); left as-is
// since the handbook gives no way to confirm they're the same legal entity.
export const GROWERS_CLUB_ROSTER: string[] = [
  'Allandale', 'Alkmaar', 'Acapella', 'Buttsbury', 'Bellarose', 'Betron Stud', 'Brianne',
  'Brumbal', 'Bruce Farm', 'Chimboya', 'Cavelands', 'Double M', 'Tui Ridge', 'Draco',
  'Eden Farm', 'Smithfield', 'Finchdene', 'Eldercroft', 'Tanglewood', 'Midnight Farming',
  'Young, Madeleine', 'May, J & D', 'Kennards', 'Nadalea', 'Olde Oaks', 'Pruden', 'Sandstorm',
  'Spellbound', 'Underhill', 'Yadeno', 'Goldrush', 'Zetland', 'Gilead', 'Lochanside',
  'Raydene', 'Paca Ridge', 'Honeyfields', 'Kerdon', 'Wedderburn', 'Wilderness', 'Riverdale',
  'Valle de Tuki', 'Honeyfields', 'Kooinda', 'Thistledown', 'Hazelfield',
  'Goldmore', 'Nevalea', 'Cornerstone',
];

// Real Pacific Alpacas collection points (source: pacificalpacas.com/growers)
export const COLLECTION_NORTH: CollectionPoint[] = [
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

export const COLLECTION_SOUTH: CollectionPoint[] = [
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

// Real Pacific Alpacas visitable farms (source: pacificalpacas.com/visit-a-farm).
// description/descriptionZh/website are the real per-farm copy from that page —
// feature/featureZh remain as short map-popup blurbs.
export const FARMS_NORTH: VisitableFarm[] = [
  { name: 'Cornerstone Alpaca Stud', region: 'Gordonton, Waikato', feature: '120+ alpacas, farm shop, 1hr from Auckland', featureZh: '120+羊驼，农场商店，距奥克兰1小时',
    description: 'Farming alpacas since 2005, with a herd of more than 120. Farm tours, a shop, and alpacas for sale — a short scenic drive from Auckland, Hamilton or Rotorua.',
    descriptionZh: '自2005年开始养殖羊驼，现有120余头。提供农场参观、商店及羊驼出售，距奥克兰、汉密尔顿或罗托鲁瓦车程不远。',
    website: 'https://cornerstonestud.co.nz', lat: -37.63, lng: 175.25 },
  { name: 'Coroglen Alpacas', region: 'Coromandel Peninsula', feature: 'Farmstay accommodation, 17 acres, ocean views', featureZh: '农庄住宿，17英亩，可观海',
    description: 'A 17-acre rural lifestyle farm at the base of Karina Rock, home to tuis, bellbirds and kiwis, between Whitianga and Hot Water Beach.',
    descriptionZh: '位于Karina Rock山脚下的17英亩乡村农场，可见吸蜜鸟、钟雀与几维鸟出没，地处Whitianga与Hot Water Beach之间。',
    website: 'https://coroglenlodge.co.nz', lat: -36.79, lng: 175.62 },
  { name: 'Hill Country Alpacas', region: 'Katikati, Bay of Plenty', feature: '30 alpacas, handmade fibre textiles', featureZh: '30头驼，自产纤维纺织品',
    description: 'About 30 white Huacaya alpacas alongside Corriedale sheep and Angora goats, with cottage-industry fibre processing — picker, carder and two looms.',
    descriptionZh: '约30头白色Huacaya羊驼，另饲养Corriedale绵羊与安哥拉山羊，配有小型纤维加工作坊（梳理机、弹毛机与两台织机）。',
    website: 'https://hillcountryalpacas.weebly.com', lat: -37.55, lng: 175.92 },
  { name: 'Lavender Hill', region: 'Near Auckland', feature: 'B&B accommodation, lavender farm, gift shop', featureZh: 'B&B住宿，薰衣草农庄，礼品店',
    description: 'An exclusive B&B on three hectares of organic lavender, olive and lemon groves alongside the alpacas — ideal for a day trip or an extended stay.',
    descriptionZh: '三公顷有机薰衣草、橄榄与柠檬园中的精品民宿，羊驼相伴左右，适合一日游或长住。',
    website: 'https://lavenderhill.co.nz', lat: -36.92, lng: 174.78 },
  { name: 'Minffordd Alpaca Farm', region: 'Feilding', feature: 'Cottage accommodation, breeding since 2004', featureZh: '小屋住宿，养驼自2004年',
    description: "Breeding alpacas since 2004, with self-contained cottage accommodation (sleeps 4) overlooking the herd, in Feilding — voted NZ's most beautiful town 14 times.",
    descriptionZh: '自2004年开始养殖羊驼，配有可俯瞰羊驼群的独立小屋住宿（可住4人），位于14次当选新西兰最美小镇的Feilding。',
    website: 'https://minffordd.co.nz', lat: -40.22, lng: 175.57 },
  { name: 'Moonacre Alpacas', region: 'Eltham, Taranaki', feature: '60+ alpacas, group bus tours welcome', featureZh: '60+头驼，团体巴士游览欢迎',
    description: '60+ Huacaya alpacas alongside a 500-cow dairy farm, sheep, goats and a miniature horse — group and bus tours welcome, with alpaca walking and feeding.',
    descriptionZh: '60余头Huacaya羊驼，与500头奶牛的牧场、绵羊、山羊及迷你马为邻，欢迎团体及巴士旅游团，提供牵驼散步与喂食体验。',
    website: 'https://moonacrealpacas.co.nz', lat: -39.43, lng: 174.30 },
  { name: 'Nevalea Alpacas', region: 'Taumarunui', feature: "NZ's largest alpaca farm, 800+ head, Alpaca Trek", featureZh: '新西兰最大羊驼农场，800+头，羊驼Trek',
    description: "New Zealand's largest alpaca farm, home to over 800 alpacas. Alpaca treks through summer, year-round shorter walks, and baby alpaca cuddles.",
    descriptionZh: '新西兰最大羊驼农场，饲养800余头羊驼。夏季提供羊驼徒步之旅，全年提供短程漫步与幼驼拥抱体验。',
    website: 'https://nevaleaalpacas.co.nz', lat: -38.88, lng: 175.26 },
  { name: 'Perfect Alpaca Farm', region: 'South of Warkworth', feature: '64 alpacas, hand-feeding experience', featureZh: '64头驼，手喂体验',
    description: 'Run by Dave, Maggie and Jemma — 64 alpacas visitors can watch play or hand-feed, welcoming breeders and pet-lovers alike.',
    descriptionZh: '由Dave、Maggie与Jemma经营，饲养64头羊驼，游客可观赏嬉戏或亲手喂食，欢迎养殖者与宠物爱好者。',
    website: 'https://perfectalpacafarm.com', lat: -36.50, lng: 174.70 },
  { name: 'Revelation NZ Alpaca Stud', region: 'Manuka Cottage Farm', feature: 'Pedigree stud, farm shop, tours by appointment', featureZh: '优良种畜场，农场商店，需预约参观',
    description: 'A pedigree alpaca stud breeding and selling alpacas and fibre products. Tours by appointment include alpacas, sheep, dogs and free-range hens, plus a small shop selling crafts and NZ watercolour art.',
    descriptionZh: '优良羊驼种畜场，繁育并出售羊驼与纤维产品。需预约参观，可近距离接触羊驼、绵羊、犬只与放养母鸡，农场小店出售手工艺品与新西兰水彩画作。',
    website: 'https://revelationalpacas.nz', lat: -39.10, lng: 174.10 },
  { name: 'Silverhill Alpacas', region: 'Northland, Kaipara Harbour', feature: 'Coloured alpaca specialist, harbour views', featureZh: '有色驼专精，可眺望Kaipara港',
    description: "Dedicated to breeding fine but densely fleeced coloured alpacas, with harbour views. The store stocks 100% alpaca products from the farm's own herd.",
    descriptionZh: '专注培育细密毛量色彩羊驼，可眺望Kaipara港美景。农场商店出售100%自家羊驼纤维制品。',
    website: 'https://silverhill.co.nz', lat: -36.18, lng: 174.24 },
  { name: 'Te Korito Alpacas', region: 'Whanganui', feature: '20 alpacas, led walks, fibre products for sale', featureZh: '20头驼，牵驼散步，羊驼纤维产品销售',
    description: 'About 20 breeding alpacas — meet, feed and walk them, then view raw, cleaned and processed fleece. Hand-knitted products for sale.',
    descriptionZh: '约20头繁殖羊驼，可近距离接触、喂食并牵驼散步，参观从原毛到成品加工的全过程，现场出售手工编织产品。',
    website: 'https://tekorito-alpacas.co.nz', lat: -39.93, lng: 175.05 },
];

export const FARMS_SOUTH: VisitableFarm[] = [
  { name: 'Altnaharra Alpacas', region: 'Nelson, Tasman', feature: '27 alpacas, sea & mountain views, needle felting', featureZh: '27头驼，海山风景，针刺毡艺',
    description: 'A 26-acre farm home to 27 prize-winning alpacas bred and shown since 2002, producing needle-felted items — in a region popular with Abel Tasman visitors.',
    descriptionZh: '26英亩农场，饲养27头自2002年培育并获奖的羊驼，出产针刺毡艺制品，地处Abel Tasman国家公园游客热门区域。',
    website: 'https://altnaharraalpacas.com/the-farm.html', lat: -41.27, lng: 173.28 },
  { name: 'Establo Alpaca Farm', region: 'Dunedin', feature: '27 alpacas, historic bluestone barn, 1860s heritage', featureZh: '27头驼，历史蓝石谷仓，1860年代遗址',
    description: 'A 10-acre farm of 27 alpacas with city and ocean views since 2004. The farm shop occupies a historic 1860s Blue Stone Barn.',
    descriptionZh: '10英亩农场饲养27头羊驼，自2004年起可俯瞰城市与海景，农场商店坐落于1860年代历史蓝石谷仓内。',
    website: 'https://stonebarn.co.nz', lat: -45.88, lng: 170.50 },
  { name: 'Gem Alpacas', region: 'South Canterbury', feature: 'Farm visits with alpacas and huarizo', featureZh: '农场参观，含羊驼和羊驼骆马',
    description: 'Farm visits to meet alpacas, llamas and sheep — walk among the herd, learn the differences between species, and meet baby cria in season.',
    descriptionZh: '农场参观项目，可近距离接触羊驼、骆马与绵羊，漫步驼群之中，了解不同物种差异，季节合适时可见幼驼。',
    website: 'https://gemalpacas.nz', lat: -44.20, lng: 171.50 },
  { name: 'Honeyfields Alpaca Farm', region: '15min from Christchurch Airport', feature: '60+ alpacas, farmstay, honey products', featureZh: '60+头驼，农庄住宿，蜂蜜产品',
    description: 'A one-stop alpaca shop with farmstay cottage accommodation, a breeding herd of ~60 alpacas, and alpaca & honey products for sale.',
    descriptionZh: '距基督城机场15分钟车程，集农庄住宿、约60头繁殖羊驼群与羊驼蜂蜜产品于一体的一站式体验农场。',
    website: 'https://honeyfields.co.nz', lat: -43.48, lng: 172.55 },
  { name: 'Kepler Mountain View Alpacas', region: 'Lake Manapouri, Fiordland', feature: 'Adjacent to Fiordland National Park, Wild Wool Gallery', featureZh: '毗邻峡湾国家公园，Wild Wool Gallery',
    description: 'A self-contained cottage with Kepler, Hunter and Takitimu mountain views. One-hour farm tours include feeding, cria and the Wild Wool Gallery.',
    descriptionZh: '独立小屋住宿，可远眺Kepler、Hunter与Takitimu山脉。一小时农场之旅包含喂食、幼驼互动与Wild Wool Gallery参观。',
    website: 'https://kmv.co.nz', lat: -45.56, lng: 167.60 },
  { name: 'Otaio Bridge Alpacas', region: 'Waimate, South Timaru', feature: 'Led alpaca walks, handmade souvenirs', featureZh: '可牵驼散步，手工纪念品',
    description: 'Hosted by Ineke and Jacob — walk among the alpacas, hand-feed them, and browse handmade souvenirs from their own fleece.',
    descriptionZh: '由Ineke与Jacob经营，游客可漫步驼群之间、亲手喂食，并选购以自家羊驼毛制作的手工纪念品。',
    website: 'https://otaiobridgealpacas.co.nz', lat: -44.73, lng: 171.05 },
  { name: "Sacred Coast Suri (Falcon's Rise)", region: 'Blenheim, Marlborough', feature: 'Suri alpaca specialist, farm shop', featureZh: '专精Suri驼，有农场商店',
    description: 'A specialist Suri alpaca breeder since 2004, overlooking vineyards and mountains — the farm shop stocks NZ-made duvets, scarves and soft toys.',
    descriptionZh: '自2004年专精苏利羊驼(Suri)培育，可俯瞰葡萄园与群山，农场商店出售新西兰制被子、围巾与毛绒玩具。',
    website: 'https://sacredcoastsuri.co.nz/web/', lat: -41.52, lng: 173.96 },
  { name: 'Shamarra Alpacas', region: 'Banks Peninsula, Canterbury', feature: '160+ alpacas, luxury knitwear, ocean views', featureZh: '160+头驼，奢华针织品，Banks半岛海景',
    description: 'An award-winning farm with 160+ alpacas and spectacular sea views, exclusively stocking luxury Shamarra alpaca knitwear.',
    descriptionZh: '屡获殊荣的农场，饲养160余头羊驼，坐拥壮丽海景，农场商店专售Shamarra奢华羊驼针织品。',
    website: 'https://shamarra-alpacas.co.nz', lat: -43.80, lng: 173.00 },
  { name: 'Warwickz Farm', region: 'Canterbury Plains', feature: '200+ animals, 40+ breeds, 20+ species', featureZh: '200+动物，40+品种，20+物种',
    description: 'A 20-acre family farm with 200+ animals across 40+ breeds — alpacas alongside miniature horses, rare Enderby Island rabbits and more.',
    descriptionZh: '20英亩家庭农场，饲养超200头动物、40多个品种，羊驼与迷你马、稀有Enderby Island兔等共同生活。',
    website: 'https://warwickzfarm.com', lat: -43.80, lng: 172.30 },
  { name: 'Windermere Alpacas & Llamas', region: 'Milton, Otago', feature: 'Includes llamas, handwoven products', featureZh: '含羊驼骆马，手工编织产品',
    description: 'A relaxed farm with alpacas and llamas — hand-feed the herd, enjoy the views, and browse hand-knitted products in the farm shop.',
    descriptionZh: '轻松惬意的农场，饲养羊驼与骆马，游客可亲手喂食、欣赏田园风光，并在农场商店选购手工编织产品。',
    website: 'https://alpacafarmtours.co.nz', lat: -46.12, lng: 169.97 },
];

// Combines every collection point and visitable farm into map markers, localizing
// the visitable-farm blurb (collection points have no bilingual copy to switch).
export function buildMapPoints(locale: string): MapPoint[] {
  return [
    ...COLLECTION_NORTH.map(p => ({ ...p, type: 'collection' as const })),
    ...COLLECTION_SOUTH.map(p => ({ ...p, type: 'collection' as const })),
    ...FARMS_NORTH.map(p => ({ name: p.name, lat: p.lat, lng: p.lng, region: p.region, feature: locale === 'zh' ? p.featureZh : p.feature, description: locale === 'zh' ? p.descriptionZh : p.description, website: p.website, type: 'farm' as const })),
    ...FARMS_SOUTH.map(p => ({ name: p.name, lat: p.lat, lng: p.lng, region: p.region, feature: locale === 'zh' ? p.featureZh : p.feature, description: locale === 'zh' ? p.descriptionZh : p.description, website: p.website, type: 'farm' as const })),
  ];
}
