'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { ShoppingBag, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/lib/store/cart-context';
import { apiClient } from '@/lib/api';

const checkoutSchema = z.object({
  customer: z.object({
    email: z.string().email('Invalid email address'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: z.string().optional(),
  }),
  shippingAddress: z.object({
    line1: z.string().min(1, 'Address is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(2, 'Country is required'),
  }),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutPageProps {
  params: { slug: string };
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = params;
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();

  const [formData, setFormData] = useState<CheckoutFormData>({
    customer: {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
    },
    shippingAddress: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
    },
    couponCode: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const createOrderMutation = useMutation({
    mutationFn: (data: any) => apiClient.post(`/store/${slug}/checkout`, data),
    onSuccess: (response) => {
      setOrderNumber(response.orderNumber);
      setOrderComplete(true);
      clearCart();
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleInputChange = (section: 'customer' | 'shippingAddress', field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    // Clear error when user types
    setErrors((prev) => ({
      ...prev,
      [`${section}.${field}`]: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = checkoutSchema.parse(formData);
      setErrors({});

      const orderData = {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        customer: validated.customer,
        shippingAddress: validated.shippingAddress,
        couponCode: validated.couponCode || undefined,
        notes: validated.notes || undefined,
      };

      createOrderMutation.mutate(orderData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
      }
    }
  };

  if (orderComplete) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16">
          <CheckCircle2 className="h-20 w-20 mx-auto text-green-500 mb-6" />
          <h1 className="text-3xl font-bold mb-4">Order Confirmed!</h1>
          <p className="text-lg text-gray-600 mb-2">Thank you for your purchase.</p>
          <p className="text-gray-600 mb-8">
            Your order number is: <span className="font-mono font-bold">{orderNumber}</span>
          </p>
          <p className="text-sm text-gray-500 mb-8">
            We&apos;ll send a confirmation email with your order details shortly.
          </p>
          <Button asChild>
            <Link href={`/store/${slug}`}>Continue Shopping</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16">
          <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add some items to your cart before checkout.</p>
          <Button asChild>
            <Link href={`/store/${slug}/products`}>Browse Products</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.customer.email}
                    onChange={(e) => handleInputChange('customer', 'email', e.target.value)}
                    className={errors['customer.email'] ? 'border-destructive' : ''}
                  />
                  {errors['customer.email'] && (
                    <p className="text-sm text-destructive mt-1">{errors['customer.email']}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.customer.firstName}
                      onChange={(e) => handleInputChange('customer', 'firstName', e.target.value)}
                      className={errors['customer.firstName'] ? 'border-destructive' : ''}
                    />
                    {errors['customer.firstName'] && (
                      <p className="text-sm text-destructive mt-1">{errors['customer.firstName']}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.customer.lastName}
                      onChange={(e) => handleInputChange('customer', 'lastName', e.target.value)}
                      className={errors['customer.lastName'] ? 'border-destructive' : ''}
                    />
                    {errors['customer.lastName'] && (
                      <p className="text-sm text-destructive mt-1">{errors['customer.lastName']}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.customer.phone}
                    onChange={(e) => handleInputChange('customer', 'phone', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="line1">Address Line 1</Label>
                  <Input
                    id="line1"
                    value={formData.shippingAddress.line1}
                    onChange={(e) => handleInputChange('shippingAddress', 'line1', e.target.value)}
                    className={errors['shippingAddress.line1'] ? 'border-destructive' : ''}
                  />
                  {errors['shippingAddress.line1'] && (
                    <p className="text-sm text-destructive mt-1">{errors['shippingAddress.line1']}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="line2">Address Line 2 (Optional)</Label>
                  <Input
                    id="line2"
                    value={formData.shippingAddress.line2}
                    onChange={(e) => handleInputChange('shippingAddress', 'line2', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.shippingAddress.city}
                      onChange={(e) => handleInputChange('shippingAddress', 'city', e.target.value)}
                      className={errors['shippingAddress.city'] ? 'border-destructive' : ''}
                    />
                    {errors['shippingAddress.city'] && (
                      <p className="text-sm text-destructive mt-1">{errors['shippingAddress.city']}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={formData.shippingAddress.state}
                      onChange={(e) => handleInputChange('shippingAddress', 'state', e.target.value)}
                      className={errors['shippingAddress.state'] ? 'border-destructive' : ''}
                    />
                    {errors['shippingAddress.state'] && (
                      <p className="text-sm text-destructive mt-1">{errors['shippingAddress.state']}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={formData.shippingAddress.postalCode}
                      onChange={(e) => handleInputChange('shippingAddress', 'postalCode', e.target.value)}
                      className={errors['shippingAddress.postalCode'] ? 'border-destructive' : ''}
                    />
                    {errors['shippingAddress.postalCode'] && (
                      <p className="text-sm text-destructive mt-1">
                        {errors['shippingAddress.postalCode']}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.shippingAddress.country}
                      onChange={(e) => handleInputChange('shippingAddress', 'country', e.target.value)}
                      className={errors['shippingAddress.country'] ? 'border-destructive' : ''}
                    />
                    {errors['shippingAddress.country'] && (
                      <p className="text-sm text-destructive mt-1">
                        {errors['shippingAddress.country']}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="couponCode">Coupon Code (Optional)</Label>
                  <Input
                    id="couponCode"
                    value={formData.couponCode}
                    onChange={(e) => setFormData((prev) => ({ ...prev, couponCode: e.target.value }))}
                    placeholder="Enter coupon code"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Order Notes (Optional)</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Special instructions for your order"
                    className="w-full border rounded-md px-3 py-2 min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <span>
                        {item.name} x {item.quantity}
                      </span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Taxes</span>
                    <span>$0.00</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                {createOrderMutation.isError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>
                      {(createOrderMutation.error as any)?.message ||
                        'Failed to create order. Please try again.'}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full mt-6"
                  size="lg"
                  disabled={createOrderMutation.isPending}
                >
                  {createOrderMutation.isPending ? 'Processing...' : 'Place Order'}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  By placing your order, you agree to our terms of service and privacy policy.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </main>
  );
}
