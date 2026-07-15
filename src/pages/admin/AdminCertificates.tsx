import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { supabase } from '@/integrations/supabase/client';
import { useCertificates, useGenerateCertificates } from '@/hooks/useCertificates';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { QrCode, ShieldCheck, IdCard } from 'lucide-react';
import { buildVerifyUrl } from '@/lib/certificate';
import { generateCertificateCard } from '@/lib/certificateCard';

interface ProductOption {
  id: string;
  name_zh: string;
  name_en: string | null;
  fiber_batch_id: string | null;
}

interface BatchInfo {
  batch_code: string;
  region: string | null;
  farm_name: string | null;
}

const AdminCertificates = () => {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [batchInfo, setBatchInfo] = useState<BatchInfo | null>(null);
  const [generatingCardFor, setGeneratingCardFor] = useState<string | null>(null);

  const { data: certificates, isLoading } = useCertificates(productId || undefined);
  const generateCertificates = useGenerateCertificates();

  useEffect(() => {
    supabase
      .from('products')
      .select('id, name_zh, name_en, fiber_batch_id')
      .order('name_zh')
      .then(({ data }) => setProducts(data ?? []));
  }, []);

  const selectedProduct = products.find(p => p.id === productId);

  useEffect(() => {
    if (!selectedProduct?.fiber_batch_id) {
      setBatchInfo(null);
      return;
    }
    supabase
      .from('fiber_batches')
      .select('batch_code, region, grower:growers(farm_name)')
      .eq('id', selectedProduct.fiber_batch_id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) { setBatchInfo(null); return; }
        const grower = data.grower as { farm_name: string } | null;
        setBatchInfo({ batch_code: data.batch_code, region: data.region, farm_name: grower?.farm_name ?? null });
      });
  }, [selectedProduct?.fiber_batch_id]);

  const downloadCard = async (code: string, issuedAt: string | null) => {
    if (!selectedProduct) return;
    setGeneratingCardFor(code);
    try {
      const dataUrl = await generateCertificateCard({
        code,
        productNameZh: selectedProduct.name_zh,
        productNameEn: selectedProduct.name_en,
        batchCode: batchInfo?.batch_code ?? null,
        farmName: batchInfo?.farm_name ?? null,
        region: batchInfo?.region ?? null,
        issuedAt,
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${code}-certificate.png`;
      link.click();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '证书卡生成失败');
    } finally {
      setGeneratingCardFor(null);
    }
  };

  const handleGenerate = async () => {
    const qty = parseInt(quantity, 10);
    if (!productId || !qty || qty < 1) {
      toast.error('请选择产品并输入有效数量');
      return;
    }
    try {
      const rows = await generateCertificates.mutateAsync({
        productId,
        fiberBatchId: selectedProduct?.fiber_batch_id ?? null,
        quantity: qty,
      });
      toast.success(`已生成 ${rows.length} 个防伪码`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '生成失败');
    }
  };

  const downloadQr = async (code: string) => {
    const url = buildVerifyUrl(code, window.location.origin);
    const dataUrl = await QRCode.toDataURL(url, { width: 480, margin: 2 });
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${code}.png`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" /> 防伪证书
        </h1>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>产品</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger><SelectValue placeholder="选择产品" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name_zh}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>生成数量（一件商品一个码）</Label>
              <Input type="number" min={1} value={quantity} onChange={e => setQuantity(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={handleGenerate} disabled={generateCertificates.isPending}>
                {generateCertificates.isPending ? '生成中…' : '生成防伪码'}
              </Button>
            </div>
          </div>
          {selectedProduct && !selectedProduct.fiber_batch_id && (
            <p className="text-xs text-muted-foreground">
              该产品未关联纤维批次，生成的证书将不显示溯源信息。可先在"纤维批次"页面为该产品关联批次。
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto pt-4">
          {!productId ? (
            <p className="text-sm text-muted-foreground py-8 text-center">请选择产品以查看已生成的防伪码</p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">加载中…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>防伪码</TableHead>
                  <TableHead>颁发时间</TableHead>
                  <TableHead>验证次数</TableHead>
                  <TableHead>首次验证</TableHead>
                  <TableHead>下载</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(certificates ?? []).map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.code}</TableCell>
                    <TableCell>{c.issued_at ? new Date(c.issued_at).toLocaleDateString('zh-CN') : '—'}</TableCell>
                    <TableCell>
                      <Badge variant={c.verification_count > 3 ? 'destructive' : 'secondary'}>
                        {c.verification_count} 次
                      </Badge>
                    </TableCell>
                    <TableCell>{c.first_verified_at ? new Date(c.first_verified_at).toLocaleString('zh-CN') : '未验证'}</TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => downloadQr(c.code)}>
                        <QrCode className="w-4 h-4 mr-1" /> 二维码
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadCard(c.code, c.issued_at)}
                        disabled={generatingCardFor === c.code}
                      >
                        <IdCard className="w-4 h-4 mr-1" />
                        {generatingCardFor === c.code ? '生成中…' : '证书卡'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCertificates;
