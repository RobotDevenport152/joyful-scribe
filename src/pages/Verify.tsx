import { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Search, MapPin, Calendar, Fingerprint } from 'lucide-react';
import { useVerifyCertificate, type CertificateVerification } from '@/hooks/useVerifyCertificate';

const GRADE_LABELS: Record<string, { zh: string; en: string }> = {
  baby: { zh: '幼驼级', en: 'Baby Alpaca' },
  royal: { zh: '皇家级', en: 'Royal Alpaca' },
  adult: { zh: '成驼级', en: 'Adult Alpaca' },
  suri: { zh: '苏利级', en: 'Suri Alpaca' },
};

export default function VerifyPage() {
  const { locale } = useApp();
  const { code: codeParam } = useParams();
  const [searchCode, setSearchCode] = useState(codeParam || '');
  const [result, setResult] = useState<CertificateVerification | null>(null);
  const verify = useVerifyCertificate();

  const runVerify = async (code: string) => {
    if (!code.trim()) return;
    const data = await verify.mutateAsync(code);
    setResult(data);
  };

  useEffect(() => {
    if (codeParam) runVerify(codeParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeParam]);

  const productName = result
    ? (locale === 'zh' ? result.productNameZh : result.productNameEn) || result.productNameZh
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-gold text-xs tracking-[0.3em] uppercase font-body">
              {locale === 'zh' ? '正品验证' : 'Authenticity Verification'}
            </span>
            <h1 className="font-display text-4xl md:text-5xl mt-4 mb-4">
              {locale === 'zh' ? '验证您的正品证书' : 'Verify Your Certificate'}
            </h1>
            <p className="text-muted-foreground font-body max-w-xl mx-auto">
              {locale === 'zh'
                ? '输入产品证书上的防伪码，或扫描证书上的二维码，即可核实产品真伪。'
                : 'Enter the code printed on your certificate, or scan its QR code, to confirm authenticity.'}
            </p>
          </div>

          <div className="max-w-md mx-auto mb-12">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={locale === 'zh' ? '输入防伪码 (如: PA-CERT-XXXX)' : 'Enter code (e.g. PA-CERT-XXXX)'}
                  value={searchCode}
                  onChange={e => setSearchCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && runVerify(searchCode)}
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-sm bg-background font-body text-sm focus:outline-none focus:border-gold transition-colors"
                />
              </div>
              <button
                onClick={() => runVerify(searchCode)}
                disabled={verify.isPending}
                className="px-6 py-3 bg-accent text-accent-foreground rounded-sm font-body text-sm hover:bg-accent/90 transition-colors disabled:opacity-60"
              >
                {verify.isPending
                  ? (locale === 'zh' ? '验证中…' : 'Verifying…')
                  : (locale === 'zh' ? '验证' : 'Verify')}
              </button>
            </div>
          </div>

          {result && result.isValid && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto mb-12">
              <div className="bg-card rounded-lg border border-green-600/30 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-green-700 font-body font-semibold text-sm">
                        {locale === 'zh' ? '✓ 正品验证通过' : '✓ Authentic Product'}
                      </p>
                      <h2 className="font-display text-2xl font-semibold">{productName}</h2>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-background rounded-sm p-3 text-center">
                    <p className="text-xs text-muted-foreground font-body">{locale === 'zh' ? '牧场' : 'Farm'}</p>
                    <p className="font-body font-semibold text-sm mt-1">{result.growerFarmName || '—'}</p>
                  </div>
                  <div className="bg-background rounded-sm p-3 text-center">
                    <p className="text-xs text-muted-foreground font-body">{locale === 'zh' ? '产地' : 'Region'}</p>
                    <p className="font-body font-semibold text-sm mt-1">{result.region || 'New Zealand'}</p>
                  </div>
                  <div className="bg-background rounded-sm p-3 text-center">
                    <p className="text-xs text-muted-foreground font-body">{locale === 'zh' ? '等级' : 'Grade'}</p>
                    <p className="font-body font-semibold text-sm mt-1 text-gold">
                      {result.grade
                        ? (locale === 'zh' ? GRADE_LABELS[result.grade]?.zh : GRADE_LABELS[result.grade]?.en) || result.grade
                        : '—'}
                    </p>
                  </div>
                  <div className="bg-background rounded-sm p-3 text-center">
                    <p className="text-xs text-muted-foreground font-body">{locale === 'zh' ? '颁发日期' : 'Issued'}</p>
                    <p className="font-body font-semibold text-sm mt-1">
                      {result.issuedAt ? new Date(result.issuedAt).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-NZ') : '—'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground font-body border-t border-border pt-4">
                  <Fingerprint className="w-4 h-4" />
                  <span>
                    {locale === 'zh'
                      ? `此证书累计已被验证 ${result.verificationCount} 次${result.firstVerifiedAt ? `，首次验证于 ${new Date(result.firstVerifiedAt).toLocaleDateString('zh-CN')}` : ''}。`
                      : `This certificate has been verified ${result.verificationCount} time(s)${result.firstVerifiedAt ? `, first on ${new Date(result.firstVerifiedAt).toLocaleDateString('en-NZ')}` : ''}.`}
                  </span>
                </div>
                {(result.verificationCount ?? 0) > 5 && (
                  <p className="text-xs text-amber-600 font-body mt-2">
                    {locale === 'zh'
                      ? '提示：该防伪码验证次数偏高。如果您是首次购买本产品，请核实包装与购买渠道，或联系客服确认。'
                      : 'Note: this code has an unusually high number of verifications. If this is your first time checking this item, please confirm your purchase channel or contact us.'}
                  </p>
                )}

                {result.batchCode && (
                  <div className="mt-4">
                    <Link
                      to={`/traceability?code=${result.batchCode}`}
                      className="text-xs text-gold hover:underline font-body"
                    >
                      {locale === 'zh' ? '查看完整纤维溯源链 →' : 'View full fiber trace →'}
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {result && !result.isValid && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto mb-12">
              <div className="bg-card rounded-lg border border-destructive/40 p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="font-display text-xl font-semibold mb-2">
                  {locale === 'zh' ? '未找到该防伪码' : 'Code Not Found'}
                </h2>
                <p className="text-sm text-muted-foreground font-body">
                  {locale === 'zh'
                    ? '请检查防伪码是否输入正确。如果确认无误但仍无法验证，产品可能存在真伪问题，请联系客服核实。'
                    : "Please check the code for typos. If it's correct but still fails, the product may not be genuine — contact us to verify."}
                </p>
                <Link to="/contact" className="inline-block mt-4 text-xs text-gold hover:underline font-body">
                  {locale === 'zh' ? '联系客服 →' : 'Contact us →'}
                </Link>
              </div>
            </motion.div>
          )}

          <div className="text-center mt-4">
            <Link to="/shop" className="inline-block px-8 py-3 bg-accent text-accent-foreground rounded-sm font-body hover:bg-accent/90 transition-colors">
              {locale === 'zh' ? '选购正品' : 'Shop Authentic Products'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
