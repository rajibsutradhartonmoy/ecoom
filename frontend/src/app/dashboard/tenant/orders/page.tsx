'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Search, Eye, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['orders', search, statusFilter, paymentFilter, page],
    queryFn: () =>
      apiClient.get('/orders', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          paymentStatus: paymentFilter || undefined,
          page,
          limit: 10,
        },
      }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => {
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
      <Badge variant="outline" className={statusInfo?.color || 'bg-gray-100 text-gray-800'}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value === 'all' ? '' : value);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Order Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {ORDER_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={paymentFilter}
            onValueChange={(value) => {
              setPaymentFilter(value === 'all' ? '' : value);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Payment Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              {PAYMENT_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-6 py-4">
                        <div className="animate-pulse h-4 bg-gray-200 rounded" />
                      </td>
                    </tr>
                  ))
              ) : data?.items?.length > 0 ? (
                data.items.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono text-sm font-medium">{order.orderNumber}</div>
                      <div className="text-xs text-muted-foreground">{order._count?.items} items</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {order.customer?.firstName} {order.customer?.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">{order.customer?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative inline-block">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            updateStatusMutation.mutate({ id: order.id, status: e.target.value })
                          }
                          disabled={updateStatusMutation.isPending}
                          className="appearance-none bg-transparent pr-6 focus:outline-none cursor-pointer"
                        >
                          {ORDER_STATUSES.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPaymentBadge(order.paymentStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {formatPrice(Number(order.total))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {format(new Date(order.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/tenant/orders/${order.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.meta && data.meta.totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, data.meta.total)} of{' '}
              {data.meta.total} orders
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
                Previous
              </Button>
              <span className="text-sm">
                Page {page} of {data.meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= data.meta.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
