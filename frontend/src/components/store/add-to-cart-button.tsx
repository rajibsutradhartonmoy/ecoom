'use client';

import { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/store/cart-context';

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images?: string[];
    stock?: number;
    trackInventory?: boolean;
  };
  quantity?: number;
  storeSlug: string;
  className?: string;
}

export function AddToCartButton({
  product,
  quantity = 1,
  storeSlug,
  className,
}: AddToCartButtonProps) {
  const { addItem, setStore } = useCart();
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    setStore(storeSlug);
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: Number(product.price),
      quantity,
      image: product.images?.[0],
      maxStock: product.trackInventory ? product.stock : undefined,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const isOutOfStock = product.trackInventory && (product.stock ?? 0) < quantity;

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isOutOfStock || added}
      className={className}
      variant={added ? 'secondary' : 'default'}
    >
      {added ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          Added to Cart
        </>
      ) : isOutOfStock ? (
        'Out of Stock'
      ) : (
        <>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </>
      )}
    </Button>
  );
}
