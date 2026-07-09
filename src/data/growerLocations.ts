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
  lat: number;
  lng: number;
}

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

// Real Pacific Alpacas visitable farms (source: pacificalpacas.com/visit-a-farm)
export const FARMS_NORTH: VisitableFarm[] = [
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

export const FARMS_SOUTH: VisitableFarm[] = [
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

// Combines every collection point and visitable farm into map markers, localizing
// the visitable-farm blurb (collection points have no bilingual copy to switch).
export function buildMapPoints(locale: string): MapPoint[] {
  return [
    ...COLLECTION_NORTH.map(p => ({ ...p, type: 'collection' as const })),
    ...COLLECTION_SOUTH.map(p => ({ ...p, type: 'collection' as const })),
    ...FARMS_NORTH.map(p => ({ name: p.name, lat: p.lat, lng: p.lng, region: p.region, feature: locale === 'zh' ? p.featureZh : p.feature, type: 'farm' as const })),
    ...FARMS_SOUTH.map(p => ({ name: p.name, lat: p.lat, lng: p.lng, region: p.region, feature: locale === 'zh' ? p.featureZh : p.feature, type: 'farm' as const })),
  ];
}
