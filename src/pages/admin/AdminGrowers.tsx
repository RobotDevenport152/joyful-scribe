import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Search, Plus, Eye, Check, X } from 'lucide-react';

const AdminGrowers = () => {
  const { user } = useAuth();
  const [growers, setGrowers] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [creditForm, setCreditForm] = useState({ amount: '', description: '' });
  const [showCredit, setShowCredit] = useState(false);

  useEffect(() => { loadGrowers(); loadApplications(); }, []);

  const loadGrowers = async () => {
    const { data } = await supabase.from('growers').select('*').order('farm_name');
    setGrowers(data ?? []);
  };

  const loadApplications = async () => {
    const { data } = await supabase
      .from('grower_applications')
      .select('*')
      .eq('status', 'pending')
      .order('created_at');
    setApplications(data ?? []);
  };

  const approveApplication = async (app: any) => {
    if (!user) return;
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({ user_id: app.user_id, role: 'grower' });
    if (roleError) { toast.error(roleError.message); return; }

    const { error: growerError } = await supabase.from('growers').insert({
      user_id: app.user_id,
      farm_name: app.farm_name,
      owner_name: app.owner_name,
      region: app.region,
      description: app.message,
    });
    if (growerError) { toast.error(growerError.message); return; }

    const { error: statusError } = await supabase
      .from('grower_applications')
      .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: user.id })
      .eq('id', app.id);
    if (statusError) { toast.error(statusError.message); return; }

    toast.success(`${app.farm_name} 已通过审核`);
    loadApplications();
    loadGrowers();
  };

  const rejectApplication = async (app: any) => {
    if (!user) return;
    const { error } = await supabase
      .from('grower_applications')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: user.id })
      .eq('id', app.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`已拒绝 ${app.farm_name} 的申请`);
    loadApplications();
  };

  const viewGrower = async (g: any) => {
    setSelected(g);
    const { data } = await supabase.from('fiber_batches').select('*').eq('grower_id', g.id).order('harvest_date', { ascending: false });
    setBatches(data ?? []);
  };

  const addCredit = async () => {
    if (!selected || !creditForm.amount) return;
    const { error } = await supabase.from('grower_transactions').insert({
      grower_id: selected.id,
      amount_nzd: parseFloat(creditForm.amount),
      type: 'credit',
      description: creditForm.description || '管理员手动添加',
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Credit 已添加');
    setCreditForm({ amount: '', description: '' });
    setShowCredit(false);
    loadGrowers();
  };

  const filtered = growers.filter(g =>
    g.farm_name?.includes(search) || g.owner_name?.includes(search) || g.region?.includes(search)
  );

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl">养殖户管理</h1>

      {applications.length > 0 && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <h2 className="font-medium text-sm text-muted-foreground">待审核申请 ({applications.length})</h2>
            {applications.map(app => (
              <div key={app.id} className="flex items-center justify-between border-b border-border py-3 last:border-0">
                <div className="text-sm">
                  <div className="font-medium">{app.farm_name} · {app.owner_name}</div>
                  <div className="text-muted-foreground">{app.region}{app.phone ? ` · ${app.phone}` : ''}</div>
                  {app.message && <div className="text-xs text-muted-foreground mt-1">{app.message}</div>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => approveApplication(app)}>
                    <Check className="w-4 h-4 text-green-600" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => rejectApplication(app)}>
                    <X className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="搜索养殖户..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="overflow-x-auto pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>农场名称</TableHead>
                <TableHead>地区</TableHead>
                <TableHead>Credit 余额</TableHead>
                <TableHead>羊驼数</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(g => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.farm_name}</TableCell>
                  <TableCell>{g.region}</TableCell>
                  <TableCell>NZ${Number(g.credit_balance || 0).toFixed(2)}</TableCell>
                  <TableCell>{g.alpaca_count || 0}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => viewGrower(g)}><Eye className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => { setSelected(g); setShowCredit(true); }}><Plus className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Grower detail */}
      <Dialog open={!!selected && !showCredit} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selected?.farm_name}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">业主：</span>{selected.owner_name}</div>
                <div><span className="text-muted-foreground">地区：</span>{selected.region}</div>
                <div><span className="text-muted-foreground">Credit：</span>NZ${Number(selected.credit_balance || 0).toFixed(2)}</div>
                <div><span className="text-muted-foreground">羊驼数：</span>{selected.alpaca_count || 0}</div>
              </div>
              <h4 className="font-medium text-sm">纤维批次 ({batches.length})</h4>
              {batches.map(b => (
                <div key={b.id} className="text-xs border-b py-2 flex justify-between">
                  <span>{b.batch_code}</span>
                  <span>{b.weight_kg}kg · {b.processing_status}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Credit */}
      <Dialog open={showCredit} onOpenChange={setShowCredit}>
        <DialogContent>
          <DialogHeader><DialogTitle>添加 Credit — {selected?.farm_name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>金额 (NZD)</Label><Input type="number" value={creditForm.amount} onChange={e => setCreditForm(p => ({ ...p, amount: e.target.value }))} /></div>
            <div><Label>描述</Label><Input value={creditForm.description} onChange={e => setCreditForm(p => ({ ...p, description: e.target.value }))} placeholder="如：2024年6月羊毛款" /></div>
            <Button onClick={addCredit} className="w-full">确认添加</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminGrowers;
