import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useOrders, useVendors } from '@/context/store';
import { STATUS_LABELS, formatNaira, type Order } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';

function timeAgo(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) +
    ', ' + d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

export default function Orders() {
  const theme = useTheme();
  const { orders, refreshOrders } = useOrders();
  const myOrders = orders.filter((o) => o.mine);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  return (
    <Screen edges={['top']}>
      <FlatList
        data={myOrders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <ThemedText type="subtitle" style={styles.pageTitle}>
            Your orders
          </ThemedText>
        }
        renderItem={({ item }) => <OrderRow order={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundElement }]}>
              <Ionicons name="receipt-outline" size={44} color={theme.textMuted} />
            </View>
            <ThemedText style={styles.emptyTitle}>No orders yet</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.emptyText}>
              When you place an order, you&apos;ll be able to track it here.
            </ThemedText>
            <Button
              label="Order now"
              fullWidth={false}
              onPress={() => router.push('/(customer)')}
              style={styles.emptyCta}
            />
          </View>
        }
      />
    </Screen>
  );
}

function OrderRow({ order }: { order: Order }) {
  const theme = useTheme();
  const { getVendor } = useVendors();
  const vendor = getVendor(order.vendorId);
  const delivered = order.status === 'delivered';

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(shop)/order/[id]', params: { id: order.id } })}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.card, borderColor: theme.border },
        pressed && { opacity: 0.9 },
      ]}>
      <View style={[styles.thumb, { backgroundColor: vendor?.color ?? theme.backgroundElement }]}>
        <ThemedText style={{ fontSize: 28 }}>{vendor?.emoji ?? '🍽️'}</ThemedText>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <ThemedText style={styles.name} numberOfLines={1}>
            {order.vendorName}
          </ThemedText>
          <ThemedText type="smallBold">{formatNaira(order.total)}</ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {order.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}
        </ThemedText>
        <View style={styles.footer}>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: delivered ? theme.backgroundElement : theme.primaryMuted },
            ]}>
            <View
              style={[styles.dot, { backgroundColor: delivered ? theme.textMuted : theme.primary }]}
            />
            <ThemedText type="small" style={{ color: delivered ? theme.textMuted : theme.primary, fontWeight: '700' }}>
              {STATUS_LABELS[order.status]}
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="textMuted">
            {timeAgo(order.createdAt)}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.five, gap: Spacing.three },
  pageTitle: { paddingTop: Spacing.two, marginBottom: Spacing.two },
  row: { flexDirection: 'row', gap: Spacing.three, padding: Spacing.three, borderRadius: Radius.lg, borderWidth: 1 },
  thumb: { width: 60, height: 60, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 3, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  name: { flex: 1, fontSize: 15, fontWeight: '700' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing.two, paddingVertical: 3, borderRadius: Radius.pill },
  dot: { width: 6, height: 6, borderRadius: 3 },
  empty: { alignItems: 'center', justifyContent: 'center', gap: Spacing.two, paddingHorizontal: Spacing.four, paddingTop: Spacing.six },
  emptyIcon: { width: 96, height: 96, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.two },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptyText: { textAlign: 'center' },
  emptyCta: { marginTop: Spacing.three, paddingHorizontal: Spacing.five },
});
