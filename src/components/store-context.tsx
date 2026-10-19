"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export interface ProductItem {
  id: string;
  slug?: string;
  title: string;
  price: number;
  originalPrice?: number | null;
  image: string;
  images?: string[];
  category?: string;
  tag?: string;
  badge?: string | null;
  sizes?: string[];
  colors?: { name: string; hex: string }[];
  description?: string;
  details?: string[];
  fabricCare?: string[];
  fit?: string;
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
}

export interface CartItem extends ProductItem {
  quantity: number;
  selectedSize: string;
  selectedColor?: string;
}

export interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  selectedSize: string;
  selectedColor?: string;
  image: string;
}

export interface Order {
  id: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: "Order Confirmed" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  paymentMethod: string;
  paymentStatus: "Paid" | "Pending COD" | "Refunded";
  shippingAddress: {
    fullName: string;
    email: string;
    phone: string;
    street: string;
    apartment?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  deliveryDateEstimate: string;
  trackingNumber: string;
}

interface StoreContextType {
  cart: CartItem[];
  wishlist: string[];
  orders: Order[];
  isCartOpen: boolean;
  isSearchOpen: boolean;
  quickViewProduct: ProductItem | null;
  toastMessage: string | null;
  couponCode: string | null;
  discountRate: number;
  addToCart: (product: ProductItem, size?: string, color?: string, qty?: number) => void;
  removeFromCart: (id: string, size?: string, color?: string) => void;
  updateQuantity: (id: string, size: string, delta: number, color?: string) => void;
  clearCart: () => void;
  toggleWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  setIsCartOpen: (open: boolean) => void;
  setIsSearchOpen: (open: boolean) => void;
  setQuickViewProduct: (product: ProductItem | null) => void;
  showToast: (msg: string) => void;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  placeOrder: (orderData: {
    shippingAddress: Order["shippingAddress"];
    paymentMethod: string;
    deliveryMethod: string;
    userId?: string;
  }) => Promise<Order>;
  getOrderById: (orderId: string) => Order | undefined;
  totalCartCount: number;
  cartSubtotal: number;
  discountAmount: number;
  shippingFee: number;
  cartGrandTotal: number;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

function toIsoDate(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

function normalizeOrder(raw: any): Order {
  const rawStatus = String(raw.status || "pending").toLowerCase();
  const status: Order["status"] = rawStatus === "delivered"
    ? "Delivered"
    : rawStatus === "shipped" || rawStatus === "out_for_delivery"
      ? "Shipped"
      : rawStatus === "cancelled" || rawStatus === "refunded"
        ? "Cancelled"
        : rawStatus === "processing" || rawStatus === "packed" || rawStatus === "payment_confirmed"
          ? "Processing"
          : "Order Confirmed";
  const createdAt = toIsoDate(raw.createdAt || raw.date);
  return {
    id: String(raw.id || raw.orderId || ""),
    date: createdAt.split("T")[0],
    items: Array.isArray(raw.items) ? raw.items.map((item: any) => ({
      id: String(item.productId || item.id || ""),
      title: String(item.title || "Product"),
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 0),
      selectedSize: String(item.selectedSize || ""),
      selectedColor: item.selectedColor ? String(item.selectedColor) : undefined,
      image: String(item.image || ""),
    })) : [],
    subtotal: Number(raw.subtotal || 0),
    discount: Number(raw.discount || 0),
    shipping: Number(raw.shipping || 0),
    total: Number(raw.total || 0),
    status,
    paymentMethod: String(raw.paymentMethod || "Cash on Delivery"),
    paymentStatus: raw.paymentStatus === "paid" ? "Paid" : raw.paymentStatus === "refunded" ? "Refunded" : "Pending COD",
    shippingAddress: raw.shippingAddress,
    deliveryDateEstimate: String(raw.deliveryDateEstimate || ""),
    trackingNumber: String(raw.trackingNumber || ""),
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [discountRate, setDiscountRate] = useState<number>(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<ProductItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Restore from localStorage on client mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("nxtvie_cart");
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedWishlist = localStorage.getItem("nxtvie_wishlist");
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));

    } catch {
      // Ignore storage errors in non-browser envs
    }
  }, []);

  // Save to localStorage when state updates
  useEffect(() => {
    try {
      localStorage.setItem("nxtvie_cart", JSON.stringify(cart));
    } catch {}
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem("nxtvie_wishlist", JSON.stringify(wishlist));
    } catch {}
  }, [wishlist]);

  useEffect(() => {
    let disposed = false;
    const unsubscribe = onIdTokenChanged(auth, async (user: { getIdToken: () => Promise<string> } | null) => {
      if (!user) {
        if (!disposed) setOrders([]);
        return;
      }
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/orders?page=1&pageSize=100", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error("Unable to load orders");
        if (!disposed) setOrders((result.data?.items || []).map(normalizeOrder));
      } catch {
        if (!disposed) setOrders([]);
      }
    });
    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const addToCart = (
    product: ProductItem,
    size = "M",
    color = product.colors?.[0]?.name || "Original",
    qty = 1
  ) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.id === product.id && item.selectedSize === size && item.selectedColor === color
      );
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && item.selectedSize === size && item.selectedColor === color
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prev, { ...product, quantity: qty, selectedSize: size, selectedColor: color }];
    });
    showToast(`Added "${product.title}" (${size}) to bag`);
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string, size?: string, color?: string) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.id === id &&
            (!size || item.selectedSize === size) &&
            (!color || item.selectedColor === color)
          )
      )
    );
    showToast("Item removed from bag");
  };

  const updateQuantity = (id: string, size: string, delta: number, color?: string) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (
            item.id === id &&
            item.selectedSize === size &&
            (!color || item.selectedColor === color)
          ) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCart([]);
    setCouponCode(null);
    setDiscountRate(0);
  };

  const toggleWishlist = (id: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(id);
      if (exists) {
        showToast("Removed from wishlist");
        return prev.filter((x) => x !== id);
      } else {
        showToast("Saved to your wishlist ❤️");
        return [...prev, id];
      }
    });
  };

  const isInWishlist = (id: string) => wishlist.includes(id);

  const applyCoupon = (code: string): boolean => {
    const clean = code.trim().toUpperCase();
    if (clean === "NEXT10") {
      setCouponCode("NEXT10");
      setDiscountRate(0.1);
      showToast("Coupon NEXT10 applied: 10% discount!");
      return true;
    }
    if (clean === "NXTIVE20") {
      setCouponCode("NXTIVE20");
      setDiscountRate(0.2);
      showToast("VIP Coupon NXTIVE20 applied: 20% discount!");
      return true;
    }
    showToast("Invalid promo code. Try NEXT10.");
    return false;
  };

  const removeCoupon = () => {
    setCouponCode(null);
    setDiscountRate(0);
    showToast("Coupon removed.");
  };

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountAmount = Math.round(cartSubtotal * discountRate);
  const shippingFee = cartSubtotal >= 999 || cartSubtotal === 0 ? 0 : 99;
  const cartGrandTotal = Math.max(0, cartSubtotal - discountAmount + shippingFee);

  // Idempotency key ref to prevent duplicate submissions within same session
  const idempotencyRef = useRef<string | null>(null);

  const placeOrder = async ({
    shippingAddress,
    paymentMethod,
    deliveryMethod,
    userId,
  }: {
    shippingAddress: Order["shippingAddress"];
    paymentMethod: string;
    deliveryMethod: string;
    userId?: string;
  }): Promise<Order> => {
    const currentUser = auth.currentUser;
    if (!currentUser || (userId && currentUser.uid !== userId)) {
      throw new Error("Please sign in before placing an order.");
    }

    const idempotencyKey =
      idempotencyRef.current || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    idempotencyRef.current = idempotencyKey;

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          items: cart.map((item) => ({
            productId: item.id,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
            image: item.image,
          })),
          shippingAddress,
          deliveryMethod,
          couponCode: couponCode || undefined,
          idempotencyKey,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || "Unable to create order.");
      }
      const newOrder = normalizeOrder(result.data);
      idempotencyRef.current = null;
      setOrders((prev) => [newOrder, ...prev.filter((order) => order.id !== newOrder.id)]);
      clearCart();
      return newOrder;
    } catch (error) {
      idempotencyRef.current = null;
      throw error;
    }
  };

  const getOrderById = (orderId: string): Order | undefined => {
    return orders.find((o) => o.id === orderId);
  };

  return (
    <StoreContext.Provider
      value={{
        cart,
        wishlist,
        orders,
        isCartOpen,
        isSearchOpen,
        quickViewProduct,
        toastMessage,
        couponCode,
        discountRate,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        setIsCartOpen,
        setIsSearchOpen,
        setQuickViewProduct,
        showToast,
        applyCoupon,
        removeCoupon,
        placeOrder,
        getOrderById,
        totalCartCount,
        cartSubtotal,
        discountAmount,
        shippingFee,
        cartGrandTotal,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
