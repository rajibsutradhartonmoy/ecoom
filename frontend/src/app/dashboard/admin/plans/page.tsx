'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Check, X } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function PlansPage() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    priceMonthly: 0,
    priceYearly: 0,
    maxProducts: 10,
    maxOrders: 100,
    maxStorage: 1000,
    maxStaff: 1,
    features: '',
    trialDays: 14,
  });

  const { data: plans, isLoading } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: () => apiClient.get('/billing/admin/plans'),
  });

  const createPlanMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/billing/admin/plans', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      setShowCreateDialog(false);
      resetForm();
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.put(`/billing/admin/plans/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      priceMonthly: 0,
      priceYearly: 0,
      maxProducts: 10,
      maxOrders: 100,
      maxStorage: 1000,
      maxStaff: 1,
      features: '',
      trialDays: 14,
    });
  };

  const handleCreatePlan = () => {
    createPlanMutation.mutate({
      ...formData,
      features: formData.features.split(',').map((f) => f.trim()).filter(Boolean),
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Subscription Plans</h1>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Subscription Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Plan Name (slug)</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="starter"
                  />
                </div>
                <div>
                  <Label>Display Name</Label>
                  <Input
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="Starter Plan"
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Perfect for small businesses"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Monthly Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.priceMonthly}
                    onChange={(e) =>
                      setFormData({ ...formData, priceMonthly: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label>Yearly Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.priceYearly}
                    onChange={(e) =>
                      setFormData({ ...formData, priceYearly: parseFloat(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max Products</Label>
                  <Input
                    type="number"
                    value={formData.maxProducts}
                    onChange={(e) =>
                      setFormData({ ...formData, maxProducts: parseInt(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label>Max Orders/Month</Label>
                  <Input
                    type="number"
                    value={formData.maxOrders}
                    onChange={(e) =>
                      setFormData({ ...formData, maxOrders: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max Storage (MB)</Label>
                  <Input
                    type="number"
                    value={formData.maxStorage}
                    onChange={(e) =>
                      setFormData({ ...formData, maxStorage: parseInt(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label>Max Staff Members</Label>
                  <Input
                    type="number"
                    value={formData.maxStaff}
                    onChange={(e) =>
                      setFormData({ ...formData, maxStaff: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Features (comma-separated)</Label>
                <Input
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="custom_domain, analytics, priority_support"
                />
              </div>
              <div>
                <Label>Trial Days</Label>
                <Input
                  type="number"
                  value={formData.trialDays}
                  onChange={(e) =>
                    setFormData({ ...formData, trialDays: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePlan} disabled={createPlanMutation.isPending}>
                {createPlanMutation.isPending ? 'Creating...' : 'Create Plan'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans?.map((plan: any) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{plan.displayName}</CardTitle>
                    <p className="text-sm text-muted-foreground">{plan.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {plan.isActive ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    {plan.isPublic && <Badge variant="outline">Public</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold">
                      {formatPrice(Number(plan.priceMonthly))}
                      <span className="text-sm font-normal text-muted-foreground">/mo</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or {formatPrice(Number(plan.priceYearly))}/year
                    </p>
                  </div>

                  {plan.description && (
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Max Products</span>
                      <span className="font-medium">{plan.maxProducts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Orders/Month</span>
                      <span className="font-medium">{plan.maxOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Storage</span>
                      <span className="font-medium">{plan.maxStorage} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Staff</span>
                      <span className="font-medium">{plan.maxStaff}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trial Days</span>
                      <span className="font-medium">{plan.trialDays}</span>
                    </div>
                  </div>

                  {Array.isArray(plan.features) && plan.features.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Features:</p>
                      <div className="flex flex-wrap gap-1">
                        {plan.features.map((feature: string) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        updatePlanMutation.mutate({
                          id: plan.id,
                          data: { isActive: !plan.isActive },
                        })
                      }
                    >
                      {plan.isActive ? (
                        <>
                          <X className="h-3 w-3 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        updatePlanMutation.mutate({
                          id: plan.id,
                          data: { isPublic: !plan.isPublic },
                        })
                      }
                    >
                      {plan.isPublic ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
