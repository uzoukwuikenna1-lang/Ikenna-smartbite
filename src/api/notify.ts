/**
 * Local (on-device) notifications. Unlike remote push these need no Firebase/FCM
 * setup — they work in a plain APK. We fire them from the app's order polling so
 * a customer sees "Order accepted", a vendor sees "New order", etc. while the app
 * is open. (Background push when the app is fully closed still needs FCM.)
 */

import { Platform } from 'react-native';

import type { Order, Role } from '@/data/mock';
import { Notifications } from './notifications';

export async function notifyLocal(title: string, body: string) {
  if (Platform.OS === 'web' || !Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: null, // deliver immediately
    });
  } catch {
    // permission not granted / not supported — ignore
  }
}

const CUSTOMER_STATUS: Record<string, { title: string; body: string }> = {
  accepted: { title: '✅ Order accepted', body: 'The vendor accepted your order and will start soon.' },
  preparing: { title: '👨‍🍳 Preparing your food', body: 'Your order is being prepared.' },
  rider_assigned: { title: '📦 Ready for pickup', body: 'Your order is ready and waiting for a rider.' },
  picked_up: { title: '🛵 Picked up', body: 'A rider has picked up your order.' },
  delivering: { title: '🛵 On the way', body: 'Your food is on the way to you.' },
  delivered: { title: '🎉 Delivered', body: 'Your order has arrived. Enjoy your meal!' },
  rejected: { title: '❌ Order rejected', body: 'Sorry, the vendor could not take your order.' },
};

/**
 * Compares the previous order snapshot with the latest and fires local
 * notifications for the relevant changes. Mutates and returns the new snapshot
 * (orderId → status). On the first call for a session `seeded` is false, so we
 * only record the baseline without notifying (avoids a burst on login).
 */
export function emitOrderNotifications(
  role: Role,
  orders: Order[],
  prev: Record<string, string>,
  seeded: boolean,
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const o of orders) next[o.id] = o.status;

  if (seeded) {
    for (const o of orders) {
      const before = prev[o.id];
      const isNew = before === undefined;

      if (role === 'customer') {
        // Notify when the status of one of my orders changes (not on first sight).
        if (!isNew && before !== o.status && CUSTOMER_STATUS[o.status]) {
          const m = CUSTOMER_STATUS[o.status];
          void notifyLocal(m.title, `${m.body} (${o.vendorName})`);
        }
      } else if (role === 'vendor') {
        // Notify on a brand-new incoming order.
        if (isNew && o.status === 'placed') {
          void notifyLocal('🛎️ New order', `${o.customerName} placed an order · ₦${o.total.toLocaleString()}`);
        }
      } else if (role === 'rider') {
        // Notify when a new delivery becomes available to claim.
        if (isNew && o.status === 'rider_assigned' && !o.riderAccepted) {
          void notifyLocal('🛵 New delivery available', `Pickup from ${o.vendorName}`);
        }
      }
    }
  }

  return next;
}
