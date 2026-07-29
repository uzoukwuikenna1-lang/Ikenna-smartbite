import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useAdmin, useVendors } from '@/context/store';
import { STATUS_LABELS, formatNaira, type Order } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';

type Filter = 'all' | 'active' | 'done';

export default function AdminOrders() {
  const theme = useTheme();
  const { orders } = useAdmin();
  const [filter, setFilter] = useState<Filter>('all');

  const sorted = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders],
  );

  const list = sorted.filter((o) => {
    if (filter === 'all') return true;
    if (filter === 'done') return o.status === 'delivered' || o.status === 'rejected';
    return o.status !== 'delivered' && o.status !== 'rejected';
  });

  return (
    <Screen edges={['top']}>
      <ThemedText type="subtitle" style={styles.title}>
        All orders
      </ThemedText>

      <View style={styles.segment}>
        {(['all', 'active', 'done'] as Filter[]).map((f) => {
          const active = f === filter;
          const label = f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Completed';
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.segBtn, { backgroundColor: active ? theme.primary : theme.card, borderColor: active ? theme.primary : theme.border }]}>
              <ThemedText type="smallBold" style={{ color: active ? theme.onPrimary : theme.textSecondary }}>
                {label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={list}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <OrderRow order={item} />}
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            No orders in this filter.
          </ThemedText>
        }
      />
    </Screen>
  );
}

function OrderRow({ order }: { order: Order }) {
  const theme = useTheme();
  const { getVendor } = useVendors();
  const vendor = getVendor(order.vendorId);
  const done = order.status === 'delivered';
  const rejected = order.status === 'rejected';
  const color = rejected ? theme.danger : done ? theme.textMuted : theme.primary;

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.thumb, { backgroundColor: vendor?.color ?? theme.backgroundElement }]}>
        <ThemedText style={{ fontSize: 24 }}>{vendor?.emoji ?? '🍽️'}</ThemedText>
      </View>
      <View style={styles.flex}>
        <View style={styles.rowTop}>
          <ThemedText style={styles.orderId}>#{order.id.replace('ord-', '')}</ThemedText>
          <ThemedText type="smallBold">{formatNaira(order.total)}</ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {order.vendorName} → {order.customerName}
        </ThemedText>
        <View style={[styles.statusPill, { backgroundColor: theme.backgroundElement }]}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <ThemedText type="small" style={{ color, fontWeight: '700' }}>
            {STATUS_LABELS[order.status]}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two, marginBottom: Spacing.three },
  segment: { flexDirection: 'row', gap: Spacing.two, paddingHorizontal: Spacing.four, marginBottom: Spacing.three },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two + 2, borderRadius: Radius.pill, borderWidth: 1 },
  list: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.five, gap: Spacing.three },
  card: { flexDirection: 'row', gap: Spacing.three, padding: Spacing.three, borderWidth: 1, borderRadius: Radius.lg },
  thumb: { width: 52, height: 52, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderId: { fontSize: 15, fontWeight: '800' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: Spacing.two, paddingVertical: 3, borderRadius: Radius.pill, marginTop: Spacing.one },
  dot: { width: 6, height: 6, borderRadius: 3 },
  empty: { textAlign: 'center', paddingHorizontal: Spacing.four, paddingTop: Spacing.six },
});
