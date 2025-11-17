'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image?: string;
  maxStock?: number;
}

interface CartState {
  items: CartItem[];
  storeSlug: string | null;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_STORE'; payload: string }
  | { type: 'LOAD_CART'; payload: CartState };

const initialState: CartState = {
  items: [],
  storeSlug: null,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(
        (item) => item.productId === action.payload.productId
      );

      if (existingIndex >= 0) {
        const updatedItems = [...state.items];
        const newQuantity = updatedItems[existingIndex].quantity + action.payload.quantity;
        const maxStock = updatedItems[existingIndex].maxStock;

        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: maxStock ? Math.min(newQuantity, maxStock) : newQuantity,
        };

        return { ...state, items: updatedItems };
      }

      return { ...state, items: [...state.items, action.payload] };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((item) => item.productId !== action.payload),
      };

    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((item) => item.productId !== action.payload.productId),
        };
      }

      return {
        ...state,
        items: state.items.map((item) =>
          item.productId === action.payload.productId
            ? {
                ...item,
                quantity: item.maxStock
                  ? Math.min(action.payload.quantity, item.maxStock)
                  : action.payload.quantity,
              }
            : item
        ),
      };
    }

    case 'CLEAR_CART':
      return { ...state, items: [] };

    case 'SET_STORE':
      // If switching stores, clear cart
      if (state.storeSlug && state.storeSlug !== action.payload) {
        return { items: [], storeSlug: action.payload };
      }
      return { ...state, storeSlug: action.payload };

    case 'LOAD_CART':
      return action.payload;

    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  storeSlug: string | null;
  itemCount: number;
  subtotal: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setStore: (slug: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const CART_STORAGE_KEY = 'ecoom_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        dispatch({ type: 'LOAD_CART', payload: parsed });
      } catch (error) {
        console.error('Failed to load cart from storage:', error);
      }
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addItem = (item: CartItem) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeItem = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const setStore = (slug: string) => {
    dispatch({ type: 'SET_STORE', payload: slug });
  };

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        storeSlug: state.storeSlug,
        itemCount,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        setStore,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
