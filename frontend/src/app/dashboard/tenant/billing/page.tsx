'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Package,
  ShoppingCart,
  Users,
  HardDrive,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function BillingPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  const { data: subscription, isLoading: loadingSubscription } = useQuery({
    queryKey: ['tenant-subscription'],
    queryFn: () => apiClient.get('/billing/subscription'),
  });

  const { data: usage, isLoading: loadingUsage } = useQuery({
    queryKey: ['tenant-usage'],
    queryFn: () => apiClient.get('/billing/usage'),
  });

  const { data: plans } = useQuery({
    queryKey: ['public-plans'],
    queryFn: () => apiClient.get('/billing/plans'),
  });

  const { data: invoices } = useQuery({
    queryKey: ['tenant-invoices'],
    queryFn: () => apiClient.get('/billing/invoices'),
  });

  const checkoutMutation = useMutation({
    mutationFn: (planId: string) =>
      apiClient.post('/billing/checkout', { planId, billingCycle: 'MONTHLY' }),
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  const portalMutation = useMutation({
    mutationFn: () => apiClient.post('/billing/portal'),
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => apiClient.post('/billing/cancel'),
  });

  const resumeMutation = useMutation({
    mutationFn: () => apiClient.post('/billing/resume'),
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'TRIALING':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'PAST_DUE':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'CANCELED':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      TRIALING: 'bg-blue-100 text-blue-800',
      PAST_DUE: 'bg-yellow-100 text-yellow-800',
      CANCELED: 'bg-red-100 text-red-800',
      UNPAID: 'bg-red-100 text-red-800',
    };

    return <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  if (loadingSubscription || loadingUsage) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="h-48 bg-gray-200 rounded" />
        <div className="h-48 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Billing & Subscription</h1>

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700">
            Your subscription has been activated successfully!
          </AlertDescription>
        </Alert>
      )}

      {canceled && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Checkout was canceled. You can try again when ready.</AlertDescription>
        </Alert>
      )}

      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <CardTitle>Current Subscription</CardTitle>
            </div>
            {subscription && getStatusBadge(subscription.status)}
          </div>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{subscription.plan?.displayName}</p>
                  <p className="text-muted-foreground">
                    {formatPrice(Number(subscription.plan?.priceMonthly))}/month
                  </p>
                </div>
                <div className="text-right">
                  {subscription.status === 'TRIALING' && subscription.trialEndsAt && (
                    <p className="text-sm text-muted-foreground">
                      Trial ends on {format(new Date(subscription.trialEndsAt), 'MMM d, yyyy')}
                    </p>
                  )}
                  {subscription.currentPeriodEnd && (
                    <p className="text-sm text-muted-foreground">
                      Next billing: {format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              </div>

              {subscription.canceledAt && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Your subscription is set to cancel at the end of the current billing period.
                    <Button
                      variant="link"
                      className="p-0 h-auto ml-2"
                      onClick={() => resumeMutation.mutate()}
                      disabled={resumeMutation.isPending}
                    >
                      Resume Subscription
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => portalMutation.mutate()}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage Billing
                </Button>
                {!subscription.canceledAt && (
                  <Button
                    variant="destructive"
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                  >
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                You don&apos;t have an active subscription yet.
              </p>
              <p className="text-sm text-muted-foreground">
                Choose a plan below to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage */}
      {usage && (
        <Card>
          <CardHeader>
            <CardTitle>Current Usage</CardTitle>
            <CardDescription>Your usage for the current billing period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  Products
                </div>
                <p className="text-2xl font-bold">
                  {usage.currentUsage?.products || 0}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{usage.limits?.maxProducts}
                  </span>
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        ((usage.currentUsage?.products || 0) / usage.limits?.maxProducts) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShoppingCart className="h-4 w-4" />
                  Orders/Month
                </div>
                <p className="text-2xl font-bold">
                  {usage.currentUsage?.orders || 0}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{usage.limits?.maxOrders}
                  </span>
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        ((usage.currentUsage?.orders || 0) / usage.limits?.maxOrders) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Staff Members
                </div>
                <p className="text-2xl font-bold">
                  -<span className="text-sm font-normal text-muted-foreground">
                    /{usage.limits?.maxStaff}
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <HardDrive className="h-4 w-4" />
                  Storage
                </div>
                <p className="text-2xl font-bold">
                  -<span className="text-sm font-normal text-muted-foreground">
                    /{usage.limits?.maxStorage} MB
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      {plans && plans.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan: any) => (
              <Card
                key={plan.id}
                className={
                  subscription?.planId === plan.id ? 'border-primary border-2' : ''
                }
              >
                <CardHeader>
                  <CardTitle>{plan.displayName}</CardTitle>
                  {plan.description && (
                    <CardDescription>{plan.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-3xl font-bold">
                        {formatPrice(Number(plan.priceMonthly))}
                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        or {formatPrice(Number(plan.priceYearly))}/year
                      </p>
                    </div>

                    <Separator />

                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Up to {plan.maxProducts} products
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Up to {plan.maxOrders} orders/month
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        {plan.maxStorage} MB storage
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        {plan.maxStaff} staff members
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        {plan.trialDays}-day free trial
                      </li>
                    </ul>

                    {subscription?.planId === plan.id ? (
                      <Button className="w-full" disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => checkoutMutation.mutate(plan.id)}
                        disabled={checkoutMutation.isPending}
                      >
                        {checkoutMutation.isPending ? 'Redirecting...' : 'Upgrade to This Plan'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Invoices */}
      {invoices && invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {invoices.map((invoice: any) => (
                <div key={invoice.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{invoice.number}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(invoice.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(Number(invoice.total))}</p>
                    <Badge
                      className={
                        invoice.status === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {invoice.status}
                    </Badge>
                  </div>
                  {invoice.invoiceUrl && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={invoice.invoiceUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
