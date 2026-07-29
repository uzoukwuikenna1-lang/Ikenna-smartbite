/**
 * App-wide state, backed by the SmartBite backend API.
 * Auth token is persisted; order lists are polled so every role sees live
 * updates (customer orders → vendor accepts → customer sees the status change).
 * Cart stays local until checkout. Hook shapes match the pre-backend version so
 * screens barely change.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { api, setAuthToken } from '@/api/client';
import { registerForPush } from '@/api/push';
import type { AppUser, MenuItem, Order, Role, Vendor, VendorStatus } from '@/data/mock';

const TOKEN_KEY = 'smartbite.token';

export type Address = { id: string; label: string; details: string; isDefault: boolean };
export type PaymentCard = { id: string; brand: string; last4: string; expiry: string };
export type NotifPrefs = { orderUpdates: boolean; deliveryUpdates: boolean; promos: boolean; newVendors: boolean };

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  status?: string;
  vendorId?: string | null;
  addresses: Address[];
  cards: PaymentCard[];
  favourites: string[];
  notifPrefs: NotifPrefs;
};

type CartLine = { item: MenuItem; qty: number };

type AdminStats = {
  totalOrders: number;
  revenue: number;
  vendors: number;
  pendingVendors: number;
  users: number;
  activeUsers: number;
  ordersByStatus: Record<string, number>;
};

type StoreValue = {
  // auth
  user: User | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (role: Role, name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (patch: { name?: string; email?: string; phone?: string }) => Promise<void>;
  // vendors + menu
  vendors: Vendor[];
  getVendor: (id: string) => Vendor | undefined;
  refreshVendors: () => Promise<void>;
  menuForVendor: (vendorId: string) => MenuItem[];
  fetchMenu: (vendorId: string) => Promise<MenuItem[]>;
  addMenuItem: (item: Partial<MenuItem>) => Promise<void>;
  updateMenuItem: (id: string, patch: Partial<MenuItem>) => Promise<void>;
  removeMenuItem: (id: string) => Promise<void>;
  toggleAvailability: (id: string) => Promise<void>;
  // cart
  cart: CartLine[];
  cartVendorId: string | null;
  cartCount: number;
  cartSubtotal: number;
  addToCart: (item: MenuItem) => void;
  decrement: (itemId: string) => void;
  removeFromCart: (itemId: string) => void;
  qtyOf: (itemId: string) => number;
  clearCart: () => void;
  // orders
  orders: Order[];
  refreshOrders: () => Promise<void>;
  getOrder: (id: string) => Order | undefined;
  placeOrder: (address: string, opts?: { note?: string; paymentMethod?: string }) => Promise<Order | null>;
  rateOrder: (id: string, rating: number, text?: string) => Promise<void>;
  acceptOrder: (id: string) => Promise<void>;
  rejectOrder: (id: string) => Promise<void>;
  setOrderStatus: (id: string, status: string) => Promise<void>;
  acceptDelivery: (id: string) => Promise<void>;
  // addresses / cards / prefs / favourites (mutate via API → refresh user)
  defaultAddress: Address | undefined;
  addAddress: (label: string, details: string) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  addCard: (cardNumber: string, expiry: string) => Promise<void>;
  removeCard: (id: string) => Promise<void>;
  setNotifPref: (key: keyof NotifPrefs, value: boolean) => Promise<void>;
  isFavourite: (vendorId: string) => boolean;
  toggleFavourite: (vendorId: string) => Promise<void>;
  // admin
  adminStats: AdminStats | null;
  adminVendors: Vendor[];
  adminUsers: AppUser[];
  refreshAdmin: () => Promise<void>;
  setVendorStatus: (vendorId: string, status: VendorStatus) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [menus, setMenus] = useState<Record<string, MenuItem[]>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [adminVendors, setAdminVendors] = useState<Vendor[]>([]);
  const [adminUsers, setAdminUsers] = useState<AppUser[]>([]);

  // Keep the latest user role available to the polling loop without re-subscribing.
  const roleRef = useRef<Role | null>(null);
  roleRef.current = user?.role ?? null;

  // ---------- data fetching ----------
  const refreshVendors = useCallback(async () => {
    const { vendors } = await api.get<{ vendors: Vendor[] }>('/api/vendors');
    setVendors(vendors);
  }, []);

  const refreshOrders = useCallback(async () => {
    const role = roleRef.current;
    if (!role) return;
    try {
      if (role === 'customer') {
        const { orders } = await api.get<{ orders: Order[] }>('/api/orders');
        setOrders(orders);
      } else if (role === 'vendor') {
        const { orders } = await api.get<{ orders: Order[] }>('/api/vendor/orders');
        setOrders(orders);
      } else if (role === 'rider') {
        const [a, m] = await Promise.all([
          api.get<{ orders: Order[] }>('/api/rider/available'),
          api.get<{ orders: Order[] }>('/api/rider/deliveries'),
        ]);
        const byId = new Map<string, Order>();
        [...a.orders, ...m.orders].forEach((o) => byId.set(o.id, o));
        setOrders([...byId.values()]);
      } else if (role === 'admin') {
        const { orders } = await api.get<{ orders: Order[] }>('/api/admin/orders');
        setOrders(orders);
      }
    } catch {
      // transient network error during polling — keep the last good data
    }
  }, []);

  const refreshAdmin = useCallback(async () => {
    if (roleRef.current !== 'admin') return;
    try {
      const [s, v, u] = await Promise.all([
        api.get<{ stats: AdminStats }>('/api/admin/stats'),
        api.get<{ vendors: Vendor[] }>('/api/admin/vendors'),
        api.get<{ users: AppUser[] }>('/api/admin/users'),
      ]);
      setAdminStats(s.stats);
      setAdminVendors(v.vendors);
      setAdminUsers(u.users);
    } catch {
      /* ignore transient */
    }
  }, []);

  const bootstrap = useCallback(
    async (u: User) => {
      roleRef.current = u.role;
      void registerForPush(); // register this device for order notifications
      await Promise.all([refreshVendors(), refreshOrders(), u.role === 'admin' ? refreshAdmin() : Promise.resolve()]);
    },
    [refreshVendors, refreshOrders, refreshAdmin],
  );

  // ---------- auth ----------
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          setAuthToken(token);
          const { user } = await api.get<{ user: User }>('/api/auth/me');
          setUser(user);
          await bootstrap(user);
        }
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY);
        setAuthToken(null);
      } finally {
        setAuthLoading(false);
      }
    })();
  }, [bootstrap]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { token, user } = await api.post<{ token: string; user: User }>('/api/auth/login', { email, password });
      await AsyncStorage.setItem(TOKEN_KEY, token);
      setAuthToken(token);
      setUser(user);
      await bootstrap(user);
      return user;
    },
    [bootstrap],
  );

  const register = useCallback(
    async (role: Role, name: string, email: string, password: string) => {
      const { token, user } = await api.post<{ token: string; user: User }>('/api/auth/register', { role, name, email, password });
      await AsyncStorage.setItem(TOKEN_KEY, token);
      setAuthToken(token);
      setUser(user);
      await bootstrap(user);
      return user;
    },
    [bootstrap],
  );

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    setUser(null);
    setOrders([]);
    setCart([]);
    setMenus({});
    setAdminStats(null);
    setAdminVendors([]);
    setAdminUsers([]);
  }, []);

  const updateProfile = useCallback(async (patch: { name?: string; email?: string; phone?: string }) => {
    const { user } = await api.patch<{ user: User }>('/api/me', patch);
    setUser(user);
  }, []);

  // ---------- polling for live cross-role updates ----------
  useEffect(() => {
    if (!user) return;
    const t = setInterval(() => {
      refreshOrders();
      if (user.role === 'admin') refreshAdmin();
    }, 4000);
    return () => clearInterval(t);
  }, [user, refreshOrders, refreshAdmin]);

  // ---------- vendors + menu ----------
  const getVendor = useCallback((id: string) => vendors.find((v) => v.id === id), [vendors]);

  const fetchMenu = useCallback(async (vendorId: string) => {
    const { menu } = await api.get<{ menu: MenuItem[] }>(`/api/vendors/${vendorId}/menu`);
    setMenus((prev) => ({ ...prev, [vendorId]: menu }));
    return menu;
  }, []);

  const menuForVendor = useCallback((vendorId: string) => menus[vendorId] ?? [], [menus]);

  const addMenuItem = useCallback(
    async (item: Partial<MenuItem>) => {
      await api.post('/api/vendor/menu', item);
      if (user?.vendorId) await fetchMenu(user.vendorId);
    },
    [user, fetchMenu],
  );

  const updateMenuItem = useCallback(
    async (id: string, patch: Partial<MenuItem>) => {
      await api.patch(`/api/vendor/menu/${id}`, patch);
      if (user?.vendorId) await fetchMenu(user.vendorId);
    },
    [user, fetchMenu],
  );

  const removeMenuItem = useCallback(
    async (id: string) => {
      await api.del(`/api/vendor/menu/${id}`);
      if (user?.vendorId) await fetchMenu(user.vendorId);
    },
    [user, fetchMenu],
  );

  const toggleAvailability = useCallback(
    async (id: string) => {
      const current = user?.vendorId ? menus[user.vendorId]?.find((m) => m.id === id) : undefined;
      const next = current?.available === false ? true : false;
      await api.patch(`/api/vendor/menu/${id}`, { available: next });
      if (user?.vendorId) await fetchMenu(user.vendorId);
    },
    [user, menus, fetchMenu],
  );

  // ---------- cart (local) ----------
  const addToCart = useCallback((item: MenuItem) => {
    setCart((prev) => {
      const differentVendor = prev.length > 0 && prev[0].item.vendorId !== item.vendorId;
      const base = differentVendor ? [] : prev;
      const existing = base.find((l) => l.item.id === item.id);
      if (existing) return base.map((l) => (l.item.id === item.id ? { ...l, qty: l.qty + 1 } : l));
      return [...base, { item, qty: 1 }];
    });
  }, []);

  const decrement = useCallback((itemId: string) => {
    setCart((prev) => prev.map((l) => (l.item.id === itemId ? { ...l, qty: l.qty - 1 } : l)).filter((l) => l.qty > 0));
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((l) => l.item.id !== itemId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);
  const cartVendorId = cart.length > 0 ? cart[0].item.vendorId : null;
  const cartCount = useMemo(() => cart.reduce((n, l) => n + l.qty, 0), [cart]);
  const cartSubtotal = useMemo(() => cart.reduce((s, l) => s + l.item.price * l.qty, 0), [cart]);
  const qtyOf = useCallback((itemId: string) => cart.find((l) => l.item.id === itemId)?.qty ?? 0, [cart]);

  // ---------- orders ----------
  const getOrder = useCallback((id: string) => orders.find((o) => o.id === id), [orders]);

  const placeOrder = useCallback(
    async (address: string, opts?: { note?: string; paymentMethod?: string }): Promise<Order | null> => {
      if (!cartVendorId || cart.length === 0) return null;
      const total = cart.reduce((s, l) => s + l.item.price * l.qty, 0);
      // Mock payment first (no real money moves).
      const { reference } = await api.post<{ reference: string }>('/api/payments/mock-charge', { amount: total });
      const items = cart.map((l) => ({ itemId: l.item.id, qty: l.qty }));
      const { order } = await api.post<{ order: Order }>('/api/orders', {
        vendorId: cartVendorId,
        items,
        address,
        note: opts?.note ?? '',
        paymentMethod: opts?.paymentMethod ?? 'card',
        paymentRef: reference,
      });
      setCart([]);
      await refreshOrders();
      return order;
    },
    [cart, cartVendorId, refreshOrders],
  );

  const rateOrder = useCallback(
    async (id: string, rating: number, text?: string) => {
      await api.patch(`/api/orders/${id}/rate`, { rating, text });
      await refreshOrders();
    },
    [refreshOrders],
  );

  const acceptOrder = useCallback(
    async (id: string) => {
      await api.patch(`/api/vendor/orders/${id}/accept`);
      await refreshOrders();
    },
    [refreshOrders],
  );

  const rejectOrder = useCallback(
    async (id: string) => {
      await api.patch(`/api/vendor/orders/${id}/reject`);
      await refreshOrders();
    },
    [refreshOrders],
  );

  const setOrderStatus = useCallback(
    async (id: string, status: string) => {
      const base = roleRef.current === 'rider' ? '/api/rider' : '/api/vendor';
      await api.patch(`${base}/orders/${id}/status`, { status });
      await refreshOrders();
    },
    [refreshOrders],
  );

  const acceptDelivery = useCallback(
    async (id: string) => {
      await api.patch(`/api/rider/orders/${id}/accept`);
      await refreshOrders();
    },
    [refreshOrders],
  );

  // ---------- profile sub-resources ----------
  const defaultAddress = useMemo(
    () => user?.addresses.find((a) => a.isDefault) ?? user?.addresses[0],
    [user],
  );

  const addAddress = useCallback(async (label: string, details: string) => {
    const { user } = await api.post<{ user: User }>('/api/me/addresses', { label, details });
    setUser(user);
  }, []);
  const removeAddress = useCallback(async (id: string) => {
    const { user } = await api.del<{ user: User }>(`/api/me/addresses/${id}`);
    setUser(user);
  }, []);
  const setDefaultAddress = useCallback(async (id: string) => {
    const { user } = await api.patch<{ user: User }>(`/api/me/addresses/${id}/default`);
    setUser(user);
  }, []);
  const addCard = useCallback(async (cardNumber: string, expiry: string) => {
    const { user } = await api.post<{ user: User }>('/api/me/cards', { number: cardNumber, expiry });
    setUser(user);
  }, []);
  const removeCard = useCallback(async (id: string) => {
    const { user } = await api.del<{ user: User }>(`/api/me/cards/${id}`);
    setUser(user);
  }, []);
  const setNotifPref = useCallback(async (key: keyof NotifPrefs, value: boolean) => {
    const { user } = await api.patch<{ user: User }>('/api/me/notifications', { [key]: value });
    setUser(user);
  }, []);
  const isFavourite = useCallback((vendorId: string) => !!user?.favourites.includes(vendorId), [user]);
  const toggleFavourite = useCallback(async (vendorId: string) => {
    const { user } = await api.patch<{ user: User }>(`/api/me/favourites/${vendorId}`);
    setUser(user);
  }, []);

  // ---------- admin ----------
  const setVendorStatus = useCallback(
    async (vendorId: string, status: VendorStatus) => {
      await api.patch(`/api/admin/vendors/${vendorId}/verification`, { status });
      await refreshAdmin();
    },
    [refreshAdmin],
  );
  const toggleUserStatus = useCallback(
    async (userId: string) => {
      await api.patch(`/api/admin/users/${userId}/status`);
      await refreshAdmin();
    },
    [refreshAdmin],
  );

  const value: StoreValue = {
    user,
    authLoading,
    login,
    register,
    logout,
    updateProfile,
    vendors,
    getVendor,
    refreshVendors,
    menuForVendor,
    fetchMenu,
    addMenuItem,
    updateMenuItem,
    removeMenuItem,
    toggleAvailability,
    cart,
    cartVendorId,
    cartCount,
    cartSubtotal,
    addToCart,
    decrement,
    removeFromCart,
    qtyOf,
    clearCart,
    orders,
    refreshOrders,
    getOrder,
    placeOrder,
    rateOrder,
    acceptOrder,
    rejectOrder,
    setOrderStatus,
    acceptDelivery,
    defaultAddress,
    addAddress,
    removeAddress,
    setDefaultAddress,
    addCard,
    removeCard,
    setNotifPref,
    isFavourite,
    toggleFavourite,
    adminStats,
    adminVendors,
    adminUsers,
    refreshAdmin,
    setVendorStatus,
    toggleUserStatus,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export function useAuth() {
  const s = useStore();
  return { user: s.user, authLoading: s.authLoading, login: s.login, register: s.register, logout: s.logout, updateProfile: s.updateProfile };
}

export function useVendors() {
  const s = useStore();
  return { vendors: s.vendors, getVendor: s.getVendor, refreshVendors: s.refreshVendors };
}

export function useCart() {
  const s = useStore();
  return {
    cart: s.cart,
    cartVendorId: s.cartVendorId,
    cartCount: s.cartCount,
    cartSubtotal: s.cartSubtotal,
    addToCart: s.addToCart,
    decrement: s.decrement,
    removeFromCart: s.removeFromCart,
    qtyOf: s.qtyOf,
    clearCart: s.clearCart,
  };
}

export function useOrders() {
  const s = useStore();
  return {
    orders: s.orders,
    refreshOrders: s.refreshOrders,
    getOrder: s.getOrder,
    placeOrder: s.placeOrder,
    rateOrder: s.rateOrder,
    acceptOrder: s.acceptOrder,
    rejectOrder: s.rejectOrder,
    setOrderStatus: s.setOrderStatus,
    acceptDelivery: s.acceptDelivery,
  };
}

export function useMenu() {
  const s = useStore();
  return {
    menuForVendor: s.menuForVendor,
    fetchMenu: s.fetchMenu,
    addMenuItem: s.addMenuItem,
    updateMenuItem: s.updateMenuItem,
    removeMenuItem: s.removeMenuItem,
    toggleAvailability: s.toggleAvailability,
  };
}

export function useAddresses() {
  const s = useStore();
  return {
    addresses: s.user?.addresses ?? [],
    defaultAddress: s.defaultAddress,
    addAddress: s.addAddress,
    removeAddress: s.removeAddress,
    setDefaultAddress: s.setDefaultAddress,
  };
}

export function usePayments() {
  const s = useStore();
  return { cards: s.user?.cards ?? [], addCard: s.addCard, removeCard: s.removeCard };
}

export function useNotifPrefs() {
  const s = useStore();
  return {
    notifPrefs: s.user?.notifPrefs ?? { orderUpdates: true, deliveryUpdates: true, promos: false, newVendors: true },
    setNotifPref: s.setNotifPref,
  };
}

export function useFavourites() {
  const s = useStore();
  return { favourites: s.user?.favourites ?? [], isFavourite: s.isFavourite, toggleFavourite: s.toggleFavourite };
}

export function useAdmin() {
  const s = useStore();
  return {
    stats: s.adminStats,
    vendors: s.adminVendors,
    users: s.adminUsers,
    orders: s.orders,
    refreshAdmin: s.refreshAdmin,
    setVendorStatus: s.setVendorStatus,
    toggleUserStatus: s.toggleUserStatus,
  };
}
