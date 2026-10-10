import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CallModal } from '@/components/call-modal';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useOrders, useVendors } from '@/context/store';
import { ORDER_FLOW, STATUS_LABELS, formatNaira } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';

export default function OrderTracking() {
  const theme = useTheme();
  const { id, justPaid } = useLocalSearchParams<{ id: string; justPaid?: string }>();
  const { getOrder, refreshOrders, rateOrder } = useOrders();
  const { getVendor } = useVendors();

  const order = getOrder(id);
  const [rating, setRating] = useState(0);
  const [showCall, setShowCall] = useState(false);

  const currentIndex = order ? ORDER_FLOW.indexOf(order.status) : -1;
  const isDelivered = order?.status === 'delivered';

  // Live status comes from the backend (the vendor accepts, the rider delivers).
  // Poll a little faster than the global loop while this screen is open.
  useEffect(() => {
    if (isDelivered) return;
    const t = setInterval(() => refreshOrders(), 3000);
    return () => clearInterval(t);
  }, [isDelivered, refreshOrders]);

  if (!order) {
    return (
      <Screen padded>
        <ThemedText>Order not found.</ThemedText>
      </Screen>
    );
  }

  const vendor = getVendor(order.vendorId);
  const eta = vendor ? vendor.deliveryMins : 20;

  // Rider identity comes from the rider who actually accepted the order.
  const riderName = order.rider?.name ?? 'Your rider';
  const riderVehicle = [order.rider?.vehicle, order.rider?.plate].filter(Boolean).join(' • ');

  // Handover PIN: the customer shows it to the rider on arrival.
  const showPin = !!order.deliveryPin && !isDelivered;

  return (
    <Screen edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.replace('/(customer)/orders')} hitSlop={10}>
          <Ionicons name="close" size={26} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.appbarTitle}>Track order</ThemedText>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {justPaid === '1' && (
          <View style={[styles.banner, { backgroundColor: theme.primaryMuted }]}>
            <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
            <View style={styles.flex}>
              <ThemedText type="smallBold" themeColor="primary">
                Payment successful
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Your order {order.id.replace('ord-', '#')} is confirmed.
              </ThemedText>
            </View>
          </View>
        )}

        {/* Map / ETA card (simulated for the PoC) */}
        <View style={[styles.mapCard, { backgroundColor: theme.backgroundElement }]}>
          <View style={styles.mapRoute}>
            <Ionicons name="restaurant" size={22} color={theme.primary} />
            <View style={[styles.routeLine, { backgroundColor: theme.primary }]} />
            <ThemedText style={{ fontSize: 24 }}>🛵</ThemedText>
            <View style={[styles.routeLine, { backgroundColor: isDelivered ? theme.primary : theme.border }]} />
            <Ionicons name="home" size={22} color={isDelivered ? theme.primary : theme.textMuted} />
          </View>
          <ThemedText style={styles.eta}>
            {isDelivered ? 'Delivered 🎉' : `Arriving in ~${eta} min`}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {STATUS_LABELS[order.status]}
          </ThemedText>
        </View>

        {/* Status timeline */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {ORDER_FLOW.map((status, i) => {
            const done = i <= currentIndex;
            const active = i === currentIndex;
            return (
              <View key={status} style={styles.step}>
                <View style={styles.stepIndicator}>
                  <View
                    style={[
                      styles.stepDot,
                      {
                        backgroundColor: done ? theme.primary : theme.backgroundElement,
                        borderColor: done ? theme.primary : theme.border,
                      },
                    ]}>
                    {done && <Ionicons name="checkmark" size={12} color={theme.onPrimary} />}
                  </View>
                  {i < ORDER_FLOW.length - 1 && (
                    <View
                      style={[styles.stepLine, { backgroundColor: i < currentIndex ? theme.primary : theme.border }]}
                    />
                  )}
                </View>
                <ThemedText
                  style={[styles.stepLabel, active && styles.stepActive, { color: done ? theme.text : theme.textMuted }]}>
                  {STATUS_LABELS[status]}
                </ThemedText>
              </View>
            );
          })}
        </View>

        {/* Rider — only shown once a rider has actually accepted the delivery */}
        {order.riderAccepted ? (
          <View style={[styles.riderCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.riderAvatar, { backgroundColor: theme.primaryMuted }]}>
              <ThemedText style={{ fontSize: 24 }}>🧑🏾</ThemedText>
            </View>
            <View style={styles.flex}>
              <View style={styles.riderNameRow}>
                <ThemedText style={styles.riderName}>{riderName}</ThemedText>
                {order.rider?.verified ? (
                  <View style={[styles.verifyBadge, { backgroundColor: theme.primaryMuted }]}>
                    <Ionicons name="shield-checkmark" size={12} color={theme.primary} />
                    <ThemedText type="small" style={{ color: theme.primary, fontWeight: '700' }}>
                      Verified
                    </ThemedText>
                  </View>
                ) : null}
              </View>
              {riderVehicle ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {riderVehicle}
                </ThemedText>
              ) : null}
              {order.rider ? (
                <View style={styles.riderMetaRow}>
                  <Ionicons name="star" size={12} color={theme.star} />
                  <ThemedText type="small" themeColor="textSecondary">
                    {order.rider.rating.toFixed(1)} · {order.rider.trips} trips
                    {order.rider.idType ? ` · ${order.rider.idType} ••••${order.rider.idLast4}` : ''}
                  </ThemedText>
                </View>
              ) : null}
            </View>
            <Pressable
              onPress={() => setShowCall(true)}
              hitSlop={8}
              style={[styles.riderBtn, { backgroundColor: theme.primaryMuted }]}>
              <Ionicons name="call" size={20} color={theme.primary} />
            </Pressable>
          </View>
        ) : order.status === 'rider_assigned' ? (
          <View style={[styles.riderCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.riderAvatar, { backgroundColor: theme.backgroundElement }]}>
              <ActivityIndicator color={theme.primary} />
            </View>
            <View style={styles.flex}>
              <ThemedText style={styles.riderName}>Finding you a rider…</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Your order is ready — assigning a nearby rider.
              </ThemedText>
            </View>
          </View>
        ) : null}

        {/* Delivery PIN — the customer reads this out to the rider on arrival */}
        {showPin ? (
          <View style={[styles.pinCard, { backgroundColor: theme.card, borderColor: theme.primary }]}>
            <View style={styles.pinHeader}>
              <Ionicons name="lock-closed" size={16} color={theme.primary} />
              <ThemedText type="smallBold" themeColor="primary">
                Delivery PIN
              </ThemedText>
            </View>
            <View style={styles.pinDigits}>
              {order.deliveryPin!.split('').map((d, i) => (
                <View key={i} style={[styles.pinBox, { backgroundColor: theme.primaryMuted }]}>
                  <ThemedText style={[styles.pinDigit, { color: theme.primary }]}>{d}</ThemedText>
                </View>
              ))}
            </View>
            <ThemedText type="small" themeColor="textSecondary" style={styles.pinHint}>
              Give this PIN to your rider only when your food is in your hands. It confirms you received your order.
            </ThemedText>
          </View>
        ) : null}

        {/* Order details */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText style={styles.detailsTitle}>{order.vendorName}</ThemedText>
          {order.items.map((it) => (
            <View key={it.itemId} style={styles.detailRow}>
              <ThemedText themeColor="textSecondary">
                {it.qty}× {it.emoji} {it.name}
              </ThemedText>
              <ThemedText type="smallBold">{formatNaira(it.price * it.qty)}</ThemedText>
            </View>
          ))}
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.detailRow}>
            <ThemedText style={styles.totalLabel}>Total paid</ThemedText>
            <ThemedText style={styles.totalLabel}>{formatNaira(order.total)}</ThemedText>
          </View>
        </View>

        {/* Rating on delivery */}
        {isDelivered && (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {order.rated || rating > 0 ? (
              <View style={styles.ratedThanks}>
                <Ionicons name="heart" size={22} color={theme.danger} />
                <ThemedText style={styles.detailsTitle}>Thanks for your feedback!</ThemedText>
              </View>
            ) : (
              <>
                <ThemedText style={styles.detailsTitle}>Rate your order</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  How was your food from {order.vendorName}?
                </ThemedText>
                <View style={styles.rateStars}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Pressable
                      key={i}
                      hitSlop={6}
                      onPress={() => {
                        setRating(i);
                        rateOrder(order.id, i).catch(() => {});
                      }}>
                      <Ionicons
                        name={i <= rating ? 'star' : 'star-outline'}
                        size={36}
                        color={theme.star}
                      />
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        <Button
          label="Back to orders"
          variant="secondary"
          onPress={() => router.replace('/(customer)/orders')}
          style={styles.backCta}
        />
      </ScrollView>

      <CallModal
        visible={showCall}
        name={riderName}
        subtitle={riderVehicle || 'Your rider'}
        onClose={() => setShowCall(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  appbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  appbarTitle: { fontSize: 18, fontWeight: '800' },
  scroll: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.five },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
  mapCard: { borderRadius: Radius.lg, padding: Spacing.four, alignItems: 'center', gap: Spacing.two },
  mapRoute: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.two },
  routeLine: { width: 48, height: 3, borderRadius: 2 },
  eta: { fontSize: 22, fontWeight: '800' },
  card: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.four },
  step: { flexDirection: 'row', gap: Spacing.three },
  stepIndicator: { alignItems: 'center' },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: { width: 2, flex: 1, minHeight: 22, marginVertical: 2 },
  stepLabel: { fontSize: 15, paddingBottom: Spacing.three, paddingTop: 2 },
  stepActive: { fontWeight: '800' },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
  },
  riderAvatar: { width: 48, height: 48, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  riderName: { fontWeight: '700', fontSize: 15 },
  riderNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  riderMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  verifyBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.pill },
  riderBtn: { width: 44, height: 44, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  pinCard: { borderWidth: 1.5, borderRadius: Radius.lg, padding: Spacing.four, gap: Spacing.two, alignItems: 'center' },
  pinHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one + 2 },
  pinDigits: { flexDirection: 'row', gap: Spacing.two },
  pinBox: { width: 48, height: 58, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  pinDigit: { fontSize: 28, fontWeight: '800' },
  pinHint: { textAlign: 'center' },
  detailsTitle: { fontSize: 16, fontWeight: '800', marginBottom: Spacing.two },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  divider: { height: 1, marginVertical: Spacing.two },
  totalLabel: { fontWeight: '800', fontSize: 15 },
  ratedThanks: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  rateStars: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.three, justifyContent: 'center' },
  backCta: { marginTop: Spacing.two },
});
