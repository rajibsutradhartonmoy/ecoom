'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Package, User, MapPin, CreditCard, FileText } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'CONFIRMED', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  { value: 'PROCESSING', label: 'Processing', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'SHIPPED', label: 'Shipped', color: 'bg-purple-100 text-purple-800' },
  { value: 'DELIVERED', label: 'Delivered', color: 'bg-green-100 text-green-800' },
  { value: 'CANCELED', label: 'Canceled', color: 'bg-red-100 text-red-800' },
  { value: 'REFUNDED', label: 'Refunded', color: 'bg-gray-100 text-gray-800' },
];

const PAYMENT_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'PAID', label: 'Paid', color: 'bg-green-100 text-green-800' },
  { value: 'FAILED', label: 'Failed', color: 'bg-red-100 text-red-800' },
  { value: 'REFUNDED', label: 'Refunded', color: 'bg-gray-100 text-gray-800' },
];

interface OrderDetailPageProps {
  params: { id: string };
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = params;
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => apiClient.get(`/orders/${id}`),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => apiClient.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = ORDER_STATUSES.find((s) => s.value === status);
    return (
      <Badge className={statusInfo?.color || 'bg-gray-100 text-gray-800'}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    const statusInfo = PAYMENT_STATUSES.find((s) => s.value === status);
    return (
      <Badge className={statusInfo?.color || 'bg-gray-100 text-gray-800'}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="h-48 bg-gray-200 rounded" />
        <div className="h-48 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
        <Button asChild>
          <Link href="/dashboard/tenant/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/tenant/orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
          <p className="text-muted-foreground">
            Placed on {format(new Date(order.createdAt), 'MMMM d, yyyy at h:mm a')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Status</p>
                  {getStatusBadge(order.status)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Update Status</p>
                  <Select
                    value={order.status}
                    onValueChange={(value) => updateStatusMutation.mutate(value)}
                    disabled={updateStatusMutation.isPending}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Payment Status</p>
                  {getPaymentBadge(order.paymentStatus)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="py-4 flex gap-4">
                    <div className="h-16 w-16 bg-gray-100 rounded flex-shrink-0">
                      {item.product?.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.productName}
                          className="h-full w-full object-cover rounded"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      {item.productSku && (
                        <p className="text-sm text-muted-foreground">SKU: {item.productSku}</p>
                      )}
                      <p className="text-sm">
                        {formatPrice(Number(item.unitPrice))} x {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(Number(item.total))}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(Number(order.subtotal))}</span>
                </div>
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                    <span>-{formatPrice(Number(order.discount))}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{formatPrice(Number(order.shippingCost))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatPrice(Number(order.taxAmount))}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(Number(order.total))}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Order Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {order.customer?.firstName} {order.customer?.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{order.customer?.email}</p>
              {order.customer?.phone && (
                <p className="text-sm text-muted-foreground">{order.customer?.phone}</p>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{order.shippingAddressLine1}</p>
              {order.shippingAddressLine2 && <p>{order.shippingAddressLine2}</p>}
              <p>
                {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}
              </p>
              <p>{order.shippingCountry}</p>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getPaymentBadge(order.paymentStatus)}
                </div>
                {order.paymentMethod && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Method</span>
                    <span className="text-sm">{order.paymentMethod}</span>
                  </div>
                )}
                {order.paymentId && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Transaction ID</span>
                    <span className="text-sm font-mono">{order.paymentId}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
