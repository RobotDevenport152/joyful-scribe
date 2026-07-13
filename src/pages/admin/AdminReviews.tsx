import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Check, X, Star } from 'lucide-react';

const STATUS_TABS = ['pending', 'approved', 'rejected'] as const;
type StatusTab = typeof STATUS_TABS[number];

const STATUS_LABELS: Record<StatusTab, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
};

const AdminReviews = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [tab, setTab] = useState<StatusTab>('pending');

  useEffect(() => { loadData(); }, [tab]);

  const loadData = async () => {
    const { data } = await supabase
      .from('product_reviews')
      .select('*, product:products(name_zh)')
      .eq('status', tab)
      .order('created_at', { ascending: false });
    setReviews(data ?? []);
  };

  const setStatus = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase.from('product_reviews').update({ status }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === 'approved' ? '评价已通过' : '评价已拒绝');
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">评价审核</h1>
      </div>

      <div className="flex gap-2">
        {STATUS_TABS.map(s => (
          <Button
            key={s}
            variant={tab === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab(s)}
          >
            {STATUS_LABELS[s]}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="overflow-x-auto pt-4">
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">没有{STATUS_LABELS[tab]}的评价</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>产品</TableHead>
                  <TableHead>评价人</TableHead>
                  <TableHead>评分</TableHead>
                  <TableHead>内容</TableHead>
                  <TableHead>规格</TableHead>
                  <TableHead>时间</TableHead>
                  {tab === 'pending' && <TableHead>操作</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{r.product?.name_zh || '—'}</TableCell>
                    <TableCell>{r.author_name}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-0.5 text-gold">
                        {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-gold" />)}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="line-clamp-2 text-sm">{r.comment}</p>
                    </TableCell>
                    <TableCell>{r.variant || '—'}</TableCell>
                    <TableCell>{r.created_at ? new Date(r.created_at).toLocaleDateString('zh-CN') : '—'}</TableCell>
                    {tab === 'pending' && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setStatus(r.id, 'approved')}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setStatus(r.id, 'rejected')}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
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

export default AdminReviews;
