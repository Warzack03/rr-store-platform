"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  clampQuantity,
  emptyCart,
  lineSignature,
  normalizeCouponCode,
  type CartLine,
  type StoredCart,
} from "./domain";
import { cartStorageKey, readStoredCart } from "./storage";

type CartContextValue = {
  cart: StoredCart;
  hydrated: boolean;
  itemCount: number;
  addLine: (line: CartLine) => { replacedDrop: boolean };
  updateLine: (line: CartLine) => void;
  changeQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
  setCouponCode: (code: string | null) => void;
  replaceCart: (cart: StoredCart) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<StoredCart>(emptyCart);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      setCart(readStoredCart(localStorage.getItem(cartStorageKey)));
      setHydrated(true);
    }, 0);
    const sync = (event: StorageEvent) => {
      if (event.key === cartStorageKey) setCart(readStoredCart(event.newValue));
    };
    window.addEventListener("storage", sync);
    return () => {
      window.clearTimeout(hydrationTimer);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  }, [cart, hydrated]);

  const value = useMemo<CartContextValue>(() => ({
    cart,
    hydrated,
    itemCount: cart.lines.reduce((total, line) => total + line.quantity, 0),
    addLine(line) {
      const replacedDrop = cart.lines.some((item) => item.dropId !== line.dropId);
      setCart((current) => {
        const differentDrop = current.lines.some((item) => item.dropId !== line.dropId);
        const base = differentDrop ? emptyCart() : current;
        const signature = lineSignature(line);
        const matching = base.lines.find((item) => lineSignature(item) === signature);
        if (matching) {
          return {
            ...base,
            lines: base.lines.map((item) =>
              item.id === matching.id
                ? { ...item, quantity: clampQuantity(item.quantity + line.quantity) }
                : item,
            ),
          };
        }
        return { ...base, lines: [...base.lines, { ...line, quantity: clampQuantity(line.quantity) }] };
      });
      return { replacedDrop };
    },
    updateLine(line) {
      setCart((current) => {
        const withoutCurrent = current.lines.filter((item) => item.id !== line.id);
        const matching = withoutCurrent.find((item) => lineSignature(item) === lineSignature(line));
        return {
          ...current,
          lines: matching
            ? withoutCurrent.map((item) => item.id === matching.id ? { ...item, quantity: clampQuantity(item.quantity + line.quantity) } : item)
            : current.lines.map((item) => item.id === line.id ? { ...line, quantity: clampQuantity(line.quantity) } : item),
        };
      });
    },
    changeQuantity(lineId, quantity) {
      setCart((current) => ({ ...current, lines: current.lines.map((line) => line.id === lineId ? { ...line, quantity: clampQuantity(quantity) } : line) }));
    },
    removeLine(lineId) {
      setCart((current) => ({ ...current, lines: current.lines.filter((line) => line.id !== lineId) }));
    },
    setCouponCode(code) {
      setCart((current) => ({ ...current, couponCode: code ? normalizeCouponCode(code) : null }));
    },
    replaceCart(nextCart) { setCart(nextCart); },
  }), [cart, hydrated]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart debe usarse dentro de CartProvider.");
  return value;
}
