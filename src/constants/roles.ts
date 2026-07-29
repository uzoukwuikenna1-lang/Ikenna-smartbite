import type { Role } from '@/data/mock';

type RoleMeta = {
  label: string;
  emoji: string;
  /** where to land after a successful login */
  home: '/(customer)' | '/(vendor)' | '/(rider)' | '/(admin)';
};

export const ROLE_META: Record<Role, RoleMeta> = {
  customer: { label: 'Customer', emoji: '🍽️', home: '/(customer)' },
  vendor: { label: 'Vendor', emoji: '🧑‍🍳', home: '/(vendor)' },
  rider: { label: 'Rider', emoji: '🛵', home: '/(rider)' },
  admin: { label: 'Admin', emoji: '🛠️', home: '/(admin)' },
};

export function isRole(value: unknown): value is Role {
  return value === 'customer' || value === 'vendor' || value === 'rider' || value === 'admin';
}
