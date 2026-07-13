import { useTranslation } from 'react-i18next';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const ProcessSection = () => {
  const { t } = useTranslation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  const steps = [
    { num: '01', key: 'shear', image: '/images/process-shear.jpg' },
    { num: '02', key: 'wash', image: '/images/process-wash.jpg' },
    { num: '03', key: 'comb', image: '/images/process-comb.jpg' },
    { num: '04', key: 'felt', image: '/images/process-felt.jpg' },
    { num: '05', key: 'sterilize', image: '/images/process-sterilize.jpg' },
    { num: '06', key: 'finish', image: '/images/process-finish.jpg' },
  ] as const;

  return (
    <section ref={ref} className="py-20 md:py-32 bg-espresso">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl mb-4" style={{ color: 'hsl(40 33% 96%)' }}>
            {t('process.title')}
          </h2>
          <div className="gold-line w-16 mx-auto mb-4" />
          <p className="text-sm font-body" style={{ color: 'hsl(30 15% 65%)' }}>
            {t('process.subtitle')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              className="text-center rounded-sm border overflow-hidden"
              style={{
                borderColor: 'hsl(43 85% 38% / 0.2)',
                backgroundColor: 'hsl(30 30% 12%)',
              }}
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={step.image}
                  alt={t(`process.steps.${step.key}.title`)}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <span className="text-3xl font-display font-bold text-gold">{step.num}</span>
                <h3 className="font-display text-lg mt-3 mb-2" style={{ color: 'hsl(40 33% 96%)' }}>
                  {t(`process.steps.${step.key}.title`)}
                </h3>
                <p className="text-xs font-body leading-relaxed" style={{ color: 'hsl(30 15% 65%)' }}>
                  {t(`process.steps.${step.key}.desc`)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
