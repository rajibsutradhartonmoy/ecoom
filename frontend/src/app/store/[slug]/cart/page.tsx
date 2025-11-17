'use client';

import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/lib/store/cart-context';

interface CartPageProps {
  params: { slug: string };
}

export default function CartPage({ params }: CartPageProps) {
  const { slug } = params;
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (items.length === 0) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16">
          <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">
            Looks like you haven&apos;t added any items to your cart yet.
          </p>
          <Button asChild>
            <Link href={`/store/${slug}/products`}>Continue Shopping</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <Button variant="ghost" onClick={clearCart} className="text-destructive">
          Clear Cart
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        {/* Cart Items */}
        <div className="divide-y">
          {items.map((item) => (
            <div key={item.productId} className="p-6 flex gap-4">
              {/* Image */}
              <div className="h-24 w-24 bg-gray-100 rounded flex-shrink-0">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover rounded"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1">
                <Link
                  href={`/store/${slug}/products/${item.slug}`}
                  className="font-medium hover:text-primary"
                >
                  {item.name}
                </Link>
                <p className="text-sm text-muted-foreground mt-1">{formatPrice(item.price)} each</p>

                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-12 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.maxStock ? item.quantity >= item.maxStock : false}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => removeItem(item.productId)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>

              {/* Total */}
              <div className="text-right">
                <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Summary */}
        <div className="p-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Taxes</span>
              <span>Calculated at checkout</span>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          <div className="mt-6 space-y-3">
            <Button asChild className="w-full" size="lg">
              <Link href={`/store/${slug}/checkout`}>Proceed to Checkout</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href={`/store/${slug}/products`}>Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
