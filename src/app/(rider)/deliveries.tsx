import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useOrders, useVendors } from '@/context/store';
import { STATUS_LABELS, formatNaira, type Order, type OrderStatus } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';

const ACTIVE: OrderStatus[] = ['rider_assigned', 'picked_up', 'delivering'];

export default function MyDeliveries() {
  const theme = useTheme();
  const { orders, setOrderStatus } = useOrders();

  const active = useMemo(
    () => orders.filter((o) => o.riderAccepted && ACTIVE.includes(o.status)),
    [orders],
  );
  const completedToday = orders.filter((o) => o.riderAccepted && o.status === 'delivered').length;

  return (
    <Screen edges={['top']}>
      <FlatList
        data={active}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="subtitle">My deliveries</ThemedText>
            <ThemedText themeColor="textSecondary">
              {active.length} active · {completedToday} completed today
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <DeliveryCard order={item} onAdvance={(s) => setOrderStatus(item.id, s)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundElement }]}>
              <Ionicons name="bicycle-outline" size={40} color={theme.textMuted} />
            </View>
            <ThemedText style={styles.emptyTitle}>No active deliveries</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.emptyText}>
              Accept a delivery from the Available tab to get started.
            </ThemedText>
          </View>
        }
      />
    </Screen>
  );
}

function DeliveryCard({ order, onAdvance }: { order: Order; onAdvance: (s: OrderStatus) => void }) {
  const theme = useTheme();
  const { getVendor } = useVendors();
  const vendor = getVendor(order.vendorId);

  const action: { label: string; status: OrderStatus } =
    order.status === 'rider_assigned'
      ? { label: 'Confirm pickup', status: 'picked_up' }
      : order.status === 'picked_up'
        ? { label: 'Start delivery', status: 'delivering' }
        : { label: 'Mark as delivered', status: 'delivered' };

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardTop}>
        <ThemedText style={styles.orderId}>#{order.id.replace('ord-', '').slice(0, 8)}....</ThemedText>
        <View style={[styles.statusPill, { backgroundColor: theme.primaryMuted }]}>
          <View style={[styles.dot, { backgroundColor: theme.primary }]} />
          <ThemedText type="smallBold" themeColor="primary">
            {STATUS_LABELS[order.status]}
          </ThemedText>
        </View>
      </View>

      <View style={styles.route}>
        <View style={styles.routeCol}>
          <View style={[styles.node, { backgroundColor: theme.primary }]}>
            <Ionicons name="restaurant" size={13} color={theme.onPrimary} />
          </View>
          <View style={[styles.routeLine, { backgroundColor: theme.border }]} />
          <View style={[styles.node, { backgroundColor: theme.accent }]}>
            <Ionicons name="location" size={13} color={theme.onAccent} />
          </View>
        </View>
        <View style={styles.routeText}>
          <View style={styles.routePoint}>
            <ThemedText type="small" themeColor="textMuted">
              Pick up
            </ThemedText>
            <ThemedText style={styles.pointName} numberOfLines={1}>
              {vendor?.name ?? order.vendorName}
            </ThemedText>
          </View>
          <View style={styles.routePoint}>
            <ThemedText type="small" themeColor="textMuted">
              {order.customerName}
            </ThemedText>
            <ThemedText style={styles.pointName} numberOfLines={1}>
              {order.address}
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={[styles.itemsRow, { borderColor: theme.border }]}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.flex} numberOfLines={1}>
          {order.items.map((it) => `${it.qty}× ${it.name}`).join(', ')}
        </ThemedText>
        <ThemedText type="smallBold">{formatNaira(order.total)}</ThemedText>
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.callBtn, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name="call" size={20} color={theme.primary} />
        </Pressable>
        <Button label={action.label} onPress={() => onAdvance(action.status)} style={styles.flex} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.five, gap: Spacing.three },
  header: { paddingTop: Spacing.two, paddingBottom: Spacing.two, gap: 2 },
  card: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.three },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderId: { fontSize: 16, fontWeight: '800' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one + 2, borderRadius: Radius.pill },
  dot: { width: 7, height: 7, borderRadius: 4 },
  route: { flexDirection: 'row', gap: Spacing.three },
  routeCol: { alignItems: 'center', paddingTop: 2 },
  node: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  routeLine: { width: 2, flex: 1, minHeight: 24, marginVertical: 3 },
  routeText: { flex: 1, gap: Spacing.three },
  routePoint: { gap: 1 },
  pointName: { fontSize: 15, fontWeight: '700' },
  itemsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderTopWidth: 1, paddingTop: Spacing.three },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  callBtn: { width: 54, height: 54, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.six },
  emptyIcon: { width: 96, height: 96, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.two },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptyText: { textAlign: 'center', paddingHorizontal: Spacing.four },
});
