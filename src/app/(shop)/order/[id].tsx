import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

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
            <View style={[styles.routeLine, { backgroundColor: theme.border }]} />
            <Ionicons name="home" size={22} color={theme.textMuted} />
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

        {/* Rider */}
        {currentIndex >= ORDER_FLOW.indexOf('rider_assigned') && (
          <View style={[styles.riderCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.riderAvatar, { backgroundColor: theme.primaryMuted }]}>
              <ThemedText style={{ fontSize: 24 }}>🧑🏾</ThemedText>
            </View>
            <View style={styles.flex}>
              <ThemedText style={styles.riderName}>Emeka (Rider)</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Honda • ABC-123 XY
              </ThemedText>
            </View>
            <View style={[styles.riderBtn, { backgroundColor: theme.primaryMuted }]}>
              <Ionicons name="call" size={20} color={theme.primary} />
            </View>
          </View>
        )}

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
  riderBtn: { width: 44, height: 44, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  detailsTitle: { fontSize: 16, fontWeight: '800', marginBottom: Spacing.two },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  divider: { height: 1, marginVertical: Spacing.two },
  totalLabel: { fontWeight: '800', fontSize: 15 },
  ratedThanks: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  rateStars: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.three, justifyContent: 'center' },
  backCta: { marginTop: Spacing.two },
});
