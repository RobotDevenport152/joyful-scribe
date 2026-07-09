import { useApp } from '@/contexts/AppContext';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';

// Each dot is a real Pacific Alpacas collection point (from pacificalpacas.com/growers),
// placed at an approximate position within its labeled region on the schematic map and
// linked out to that specific town on Google Maps.
const GROWER_DOTS = [
  // Northland
  { x: 118, y: 20, name: 'Matakana Alpacas', place: 'Maungatapere, Northland' },
  { x: 109, y: 40, name: 'Silverhill', place: 'Matakohe, Northland' },
  { x: 113, y: 58, name: 'Gumtree Gully', place: 'Warkworth, Northland' },
  { x: 106, y: 68, name: 'Pacific Alpacas Head Office No 2', place: 'Albany, Auckland' },
  // Waikato / Bay of Plenty
  { x: 111, y: 76, name: 'Jan White', place: 'Te Kauwhata, Waikato' },
  { x: 103, y: 98, name: 'Kisimul Farm Alpacas', place: 'Te Ranga, Bay of Plenty' },
  { x: 113, y: 110, name: 'Q Taz Alpacas', place: 'Paeroa, Waikato' },
  { x: 132, y: 104, name: 'Nevalea Alpacas', place: 'Taumarunui, Waikato' },
  { x: 124, y: 118, name: 'Hill Country Alpacas', place: 'Katikati, Bay of Plenty' },
  { x: 129, y: 122, name: 'Cynthia Ogilvy', place: 'Katikati, Bay of Plenty' },
  { x: 138, y: 114, name: 'Lisa, Reeves', place: 'Ohauiti, Tauranga' },
  { x: 140, y: 108, name: 'Bruden Alpacas', place: 'Ngongotaha, Rotorua' },
  { x: 143, y: 111, name: 'Brenor Alpacas', place: 'Ngongotaha, Rotorua' },
  // Hawke's Bay / Manawatu / Taranaki
  { x: 151, y: 126, name: 'Bonnack Grove Alpacas', place: 'Feilding, Manawatu' },
  { x: 96, y: 132, name: 'West Peak Alpacas', place: 'New Plymouth, Taranaki' },
  { x: 142, y: 148, name: 'Raydene', place: 'Waipawa, Hawke’s Bay' },
  { x: 100, y: 140, name: 'Silverleigh Alpacas', place: 'Waitara, Taranaki' },
  { x: 105, y: 155, name: 'Te Korito Alpacas', place: 'Wanganui' },
  // Wellington / Wairarapa
  { x: 115, y: 162, name: 'Legacy Alpacas', place: 'Carterton, Wairarapa' },
  { x: 117, y: 194, name: 'Nohoroa Farming Partnership', place: 'Masterton, Wairarapa' },
  { x: 131, y: 184, name: 'Koroki Alpacas', place: 'Carterton, Wairarapa' },
  // Nelson / North Canterbury
  { x: 99, y: 242, name: 'Chris Kempthorne', place: 'Brightwater, Nelson' },
  { x: 116, y: 250, name: 'Alpaca Gully', place: 'Greta Valley, North Canterbury' },
  { x: 108, y: 258, name: 'Chris Dahlberg', place: 'North Canterbury' },
  // Canterbury
  { x: 75, y: 294, name: 'Farmers Corner', place: 'Ashburton, Canterbury' },
  { x: 71, y: 314, name: 'Otaio Bridge Alpacas', place: 'Waimate, Canterbury' },
  { x: 105, y: 286, name: 'Sunstone Alpacas', place: 'Timaru, Canterbury' },
  { x: 97, y: 306, name: 'The Wool Shed & More', place: 'Waikouaiti, Otago' },
  { x: 110, y: 298, name: 'Cornish Point Development Ltd (Head Office No 1)', place: 'Cromwell, Central Otago' },
  { x: 91, y: 322, name: 'Karaka Alpacas', place: 'Dunedin' },
  // Central Otago / Southland
  { x: 100, y: 332, name: 'Drysdale Alpaca', place: 'Alexandra, Central Otago' },
  { x: 88, y: 346, name: 'Little Oaks Alpacas', place: 'Oamaru' },
  { x: 104, y: 356, name: 'Bruce Farm Alpacas', place: 'Hillend, Southland' },
  { x: 56, y: 376, name: 'Kepler Mountain', place: 'Manapouri, Southland' },
  { x: 80, y: 390, name: 'Geardale Alpacas', place: 'Gore, Southland' },
  { x: 68, y: 400, name: 'Pak Co Limited', place: 'Milton, Otago' },
  { x: 74, y: 416, name: 'Chainey', place: 'Makarewa, Invercargill' },
];

function googleMapsUrl(place: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place}, New Zealand`)}`;
}

export default function GrowerNetworkSection() {
  const { locale } = useApp();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-24 bg-primary text-primary-foreground overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-gold text-xs tracking-[0.3em] uppercase font-body">
            {locale === 'zh' ? '全球供应网络' : 'Global Supply Network'}
          </span>
          <h2 className="font-display text-3xl md:text-5xl mt-4">
            {locale === 'zh' ? '来自新西兰 800 家牧场的承诺' : 'A Promise from 800 NZ Farms'}
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* NZ Map SVG */}
          <div className="flex justify-center">
            <svg viewBox="0 0 200 450" className="w-48 md:w-64 h-auto">
              {/* North Island */}
              <path
                d="M100,10 Q130,20 135,50 Q140,80 130,100 Q145,110 150,130 Q145,160 130,170 Q120,190 110,200 Q100,195 95,180 Q85,160 90,140 Q80,120 85,100 Q80,80 85,60 Q90,40 100,10Z"
                fill="none" stroke="hsl(var(--gold))" strokeWidth="1" opacity="0.4"
              />
              {/* South Island */}
              <path
                d="M95,230 Q115,225 120,240 Q125,260 115,280 Q120,300 110,320 Q115,340 105,360 Q100,380 85,400 Q70,420 65,410 Q55,390 60,370 Q50,350 60,330 Q55,310 65,290 Q60,270 70,255 Q80,240 95,230Z"
                fill="none" stroke="hsl(var(--gold))" strokeWidth="1" opacity="0.4"
              />
              {/* Stewart Island */}
              <path d="M70,425 Q80,420 85,430 Q80,440 70,435Z" fill="none" stroke="hsl(var(--gold))" strokeWidth="0.5" opacity="0.3" />

              {/* Region labels */}
              {[
                { x: 118, y: 14, label: 'Northland' },
                { x: 120, y: 94, label: 'Waikato' },
                { x: 148, y: 153, label: "Hawke's Bay" },
                { x: 118, y: 202, label: 'Wellington' },
                { x: 108, y: 301, label: 'Canterbury' },
                { x: 90, y: 350, label: 'Central Otago' },
                { x: 76, y: 424, label: 'Southland' },
              ].map(({ x, y, label }) => (
                <text key={label} x={x + 10} y={y} fill="hsl(var(--gold))" fontSize="5" opacity="0.5" fontFamily="Inter">{label}</text>
              ))}

              {/* Farm dots — link out to the collection point's real location on Google Maps */}
              {GROWER_DOTS.map((dot, idx) => (
                <a
                  key={idx}
                  href={googleMapsUrl(dot.place)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${dot.name} — ${dot.place} on Google Maps`}
                >
                  <title>{`${dot.name} — ${dot.place}`}</title>
                  <motion.circle
                    cx={dot.x}
                    cy={dot.y}
                    r="2.5"
                    fill="hsl(var(--gold))"
                    className="cursor-pointer"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={inView ? { opacity: 0.7, scale: 1 } : {}}
                    whileHover={{ scale: 1.8, opacity: 1 }}
                    transition={{ delay: idx * 0.03, duration: 0.3 }}
                  />
                </a>
              ))}
            </svg>
          </div>

          {/* Stats & CTA */}
          <div>
            <div className="grid grid-cols-2 gap-6 mb-8">
              {[
                { value: '800+', labelZh: '合作养殖户', labelEn: 'Partner Farms' },
                { value: '25', labelZh: '年深耕历史', labelEn: 'Years of Heritage' },
                { value: '100+', labelZh: '吨原料掌控', labelEn: 'Tonnes Controlled' },
                { value: '70%', labelZh: '新西兰市占率', labelEn: 'NZ Market Share' },
              ].map((stat, idx) => (
                <motion.div
                  key={stat.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="text-center"
                >
                  <p className="font-display text-3xl font-semibold text-gold">{stat.value}</p>
                  <p className="text-primary-foreground/60 font-body text-sm mt-1">
                    {locale === 'zh' ? stat.labelZh : stat.labelEn}
                  </p>
                </motion.div>
              ))}
            </div>
            <p className="text-primary-foreground/60 font-body text-sm leading-relaxed mb-6">
              {locale === 'zh'
                ? '每一批纤维均可追溯到具体农场。从北地到南地，遍布全新西兰的800+牧场网络是我们最坚实的护城河。'
                : 'Every fiber batch is traceable to its specific farm. Our network of 800+ farms across all of New Zealand is our deepest competitive moat.'}
            </p>
            <Link to="/traceability" className="inline-block px-6 py-3 border border-gold/40 text-gold hover:bg-gold/10 rounded-sm font-body text-sm tracking-wider transition-colors">
              {locale === 'zh' ? '查询溯源' : 'Trace Your Fiber'}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
