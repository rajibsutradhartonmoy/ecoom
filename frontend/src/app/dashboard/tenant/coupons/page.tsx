'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CouponsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    code: '', description: '', discountType: 'PERCENTAGE' as const,
    discountValue: 10, minPurchase: 0, maxDiscount: 0, usageLimit: 0,
    startsAt: new Date().toISOString().split('T')[0],
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const { data, isLoading } = useQuery({
    queryKey: ['coupons', page],
    queryFn: () => apiClient.get('/coupons', { params: { page, limit: 10 } }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/coupons', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['coupons'] }); setShowCreate(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/coupons/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] }),
  });

  const handleCreate = () => {
    createMutation.mutate({
      ...form,
      startsAt: new Date(form.startsAt).toISOString(),
      expiresAt: new Date(form.expiresAt).toISOString(),
      minPurchase: form.minPurchase || undefined,
      maxDiscount: form.maxDiscount || undefined,
      usageLimit: form.usageLimit || undefined,
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Create Coupon</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Coupon</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="SUMMER20" /></div>
              <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select value={form.discountType} onValueChange={(v: any) => setForm({ ...form, discountType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                      <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Value</Label><Input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: parseFloat(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Min Purchase ($)</Label><Input type="number" value={form.minPurchase} onChange={(e) => setForm({ ...form, minPurchase: parseFloat(e.target.value) })} /></div>
                <div><Label>Max Discount ($)</Label><Input type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: parseFloat(e.target.value) })} /></div>
              </div>
              <div><Label>Usage Limit</Label><Input type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: parseInt(e.target.value) })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Starts At</Label><Input type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></div>
                <div><Label>Expires At</Label><Input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating...' : 'Create'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-6 py-4"><div className="animate-pulse h-4 bg-gray-200 rounded" /></td></tr>
              ))
            ) : data?.items?.length > 0 ? (
              data.items.map((coupon: any) => (
                <tr key={coupon.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4"><span className="font-mono font-medium">{coupon.code}</span></td>
                  <td className="px-6 py-4">
                    {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `$${coupon.discountValue}`}
                  </td>
                  <td className="px-6 py-4">
                    {coupon.usageCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ''}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {format(new Date(coupon.startsAt), 'MMM d')} - {format(new Date(coupon.expiresAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={coupon.isActive && new Date() <= new Date(coupon.expiresAt) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {coupon.isActive && new Date() <= new Date(coupon.expiresAt) ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMutation.mutate(coupon.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No coupons found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
