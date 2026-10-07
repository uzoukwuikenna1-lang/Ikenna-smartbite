/**
 * Shared types and pure helpers for SmartBite FUTO.
 * All real data now comes from the backend API (see src/api + src/context/store).
 * This file no longer holds mock records — only types and formatting helpers.
 */

export type Role = 'customer' | 'vendor' | 'rider' | 'admin';

export type VendorStatus = 'verified' | 'pending' | 'suspended';

export type Vendor = {
  id: string;
  name: string;
  tagline: string;
  emoji: string;
  image?: string;
  color: string;
  rating: number;
  reviewCount: number;
  deliveryMins: number;
  deliveryFee: number;
  minOrder: number;
  categories: string[];
  isOpen: boolean;
  verification?: VendorStatus;
};

export type MenuItem = {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  price: number;
  emoji: string;
  image?: string;
  category: string;
  popular?: boolean;
  available?: boolean;
};

export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'preparing'
  | 'rider_assigned'
  | 'picked_up'
  | 'delivering'
  | 'delivered'
  | 'rejected';

export const ORDER_FLOW: OrderStatus[] = [
  'placed',
  'accepted',
  'preparing',
  'rider_assigned',
  'picked_up',
  'delivering',
  'delivered',
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: 'Order placed',
  accepted: 'Vendor accepted',
  preparing: 'Preparing your food',
  rider_assigned: 'Ready for pickup',
  picked_up: 'Food picked up',
  delivering: 'On the way',
  delivered: 'Delivered',
  rejected: 'Rejected',
};

export type OrderItem = {
  itemId: string;
  name: string;
  emoji: string;
  image?: string;
  price: number;
  qty: number;
};

export type Order = {
  id: string;
  vendorId: string;
  vendorName: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  address: string;
  note?: string;
  paymentMethod?: string;
  rated?: boolean;
  mine?: boolean;
  riderAccepted?: boolean;
  rider?: { name: string; phone: string; vehicle: string; plate: string } | null;
};

export type UserStatus = 'active' | 'suspended';

// A platform user as seen by the admin console.
export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'rider' | 'vendor';
  joinedAt: string;
  status: UserStatus;
};

export function formatNaira(amount: number) {
  // Manual thousands grouping — Hermes ships without full Intl support.
  return '₦' + Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
