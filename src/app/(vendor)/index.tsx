import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth, useOrders, useVendors } from '@/context/store';
import { STATUS_LABELS, formatNaira, type Order, type OrderStatus } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';

type Tab = 'new' | 'active' | 'done';

const ACTIVE_STATUSES: OrderStatus[] = ['accepted', 'preparing', 'rider_assigned', 'picked_up', 'delivering'];

function minsAgo(iso: string) {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  return `${Math.round(m / 60)}h ago`;
}

export default function VendorOrders() {
  const theme = useTheme();
  const { orders, acceptOrder, rejectOrder, setOrderStatus } = useOrders();
  const { user } = useAuth();
  const { getVendor } = useVendors();
  const [tab, setTab] = useState<Tab>('new');

  const vendor = user?.vendorId ? getVendor(user.vendorId) : undefined;
  // Orders are already scoped to this vendor by the API.
  const mine = useMemo(() => orders, [orders]);

  const counts = {
    new: mine.filter((o) => o.status === 'placed').length,
    active: mine.filter((o) => ACTIVE_STATUSES.includes(o.status)).length,
    done: mine.filter((o) => o.status === 'delivered' || o.status === 'rejected').length,
  };

  const list = mine.filter((o) => {
    if (tab === 'new') return o.status === 'placed';
    if (tab === 'active') return ACTIVE_STATUSES.includes(o.status);
    return o.status === 'delivered' || o.status === 'rejected';
  });

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: vendor?.color ?? theme.primaryMuted }]}>
          <ThemedText style={{ fontSize: 26 }}>{vendor?.emoji ?? '🧑‍🍳'}</ThemedText>
        </View>
        <View style={styles.flex}>
          <ThemedText style={styles.vendorName}>{vendor?.name ?? 'My Kitchen'}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {counts.new} new · {counts.active} in progress
          </ThemedText>
        </View>
      </View>

      <View style={styles.segment}>
        {(['new', 'active', 'done'] as Tab[]).map((t) => {
          const active = t === tab;
          const label = t === 'new' ? 'New' : t === 'active' ? 'Active' : 'Completed';
          return (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[styles.segBtn, { backgroundColor: active ? theme.primary : theme.card, borderColor: active ? theme.primary : theme.border }]}>
              <ThemedText type="smallBold" style={{ color: active ? theme.onPrimary : theme.textSecondary }}>
                {label} ({counts[t]})
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
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onAccept={() => acceptOrder(item.id)}
            onReject={() => rejectOrder(item.id)}
            onAdvance={(s) => setOrderStatus(item.id, s)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={40} color={theme.textMuted} />
            <ThemedText themeColor="textSecondary" style={styles.emptyText}>
              No {tab === 'new' ? 'new' : tab === 'active' ? 'active' : 'completed'} orders.
            </ThemedText>
          </View>
        }
      />
    </Screen>
  );
}

function OrderCard({
  order,
  onAccept,
  onReject,
  onAdvance,
}: {
  order: Order;
  onAccept: () => void;
  onReject: () => void;
  onAdvance: (s: OrderStatus) => void;
}) {
  const theme = useTheme();
  const isNew = order.status === 'placed';
  const rejected = order.status === 'rejected';

  // The vendor's next manual step (null once it's in the rider's hands / finished).
  const nextStep: { label: string; status: OrderStatus } | null =
    order.status === 'accepted'
      ? { label: 'Start preparing', status: 'preparing' }
      : order.status === 'preparing'
        ? { label: 'Mark ready for pickup', status: 'rider_assigned' }
        : null;

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardTop}>
        <View style={styles.flex}>
          <ThemedText style={styles.orderId}>#{order.id.replace('ord-', '')}</ThemedText>
          <ThemedText type="small" themeColor="textMuted">
            {order.customerName} · {minsAgo(order.createdAt)}
          </ThemedText>
        </View>
        <ThemedText style={styles.total}>{formatNaira(order.total)}</ThemedText>
      </View>

      <View style={styles.items}>
        {order.items.map((it) => (
          <ThemedText key={it.itemId} type="small" themeColor="textSecondary">
            {it.qty}× {it.emoji} {it.name}
          </ThemedText>
        ))}
      </View>

      <View style={styles.addrRow}>
        <Ionicons name="location-outline" size={14} color={theme.textMuted} />
        <ThemedText type="small" themeColor="textMuted" style={styles.flex} numberOfLines={1}>
          {order.address}
        </ThemedText>
      </View>

      {order.note ? (
        <View style={[styles.noteRow, { backgroundColor: theme.primaryMuted }]}>
          <Ionicons name="chatbubble-ellipses" size={15} color={theme.primary} />
          <ThemedText type="small" style={[styles.flex, { color: theme.primary, fontWeight: '600' }]}>
            {order.note}
          </ThemedText>
        </View>
      ) : null}

      {isNew ? (
        <View style={styles.actions}>
          <Button label="Reject" variant="secondary" onPress={onReject} style={styles.flex} />
          <Button label="Accept" onPress={onAccept} style={styles.flex} />
        </View>
      ) : nextStep ? (
        <Button label={nextStep.label} onPress={() => onAdvance(nextStep.status)} />
      ) : (
        <View
          style={[
            styles.statusPill,
            { backgroundColor: rejected ? theme.backgroundElement : theme.primaryMuted },
          ]}>
          <View style={[styles.dot, { backgroundColor: rejected ? theme.danger : theme.primary }]} />
          <ThemedText type="smallBold" style={{ color: rejected ? theme.danger : theme.primary }}>
            {STATUS_LABELS[order.status]}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  avatar: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  vendorName: { fontSize: 18, fontWeight: '800' },
  segment: { flexDirection: 'row', gap: Spacing.two, paddingHorizontal: Spacing.four, marginBottom: Spacing.three },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two + 2, borderRadius: Radius.pill, borderWidth: 1 },
  list: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.five, gap: Spacing.three },
  card: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.two },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  orderId: { fontSize: 16, fontWeight: '800' },
  total: { fontSize: 16, fontWeight: '800' },
  items: { gap: 2, paddingVertical: Spacing.one },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.two + 2,
    borderRadius: Radius.md,
  },
  actions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    marginTop: Spacing.one,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  empty: { alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.six },
  emptyText: { textAlign: 'center' },
});
