import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth, useOrders, useVendors } from '@/context/store';
import { formatNaira, type Order } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';

export default function AvailableDeliveries() {
  const theme = useTheme();
  const { user } = useAuth();
  const { orders, acceptDelivery } = useOrders();

  const available = useMemo(
    () => orders.filter((o) => o.status === 'rider_assigned' && !o.riderAccepted),
    [orders],
  );

  return (
    <Screen edges={['top']}>
      <FlatList
        data={available}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="subtitle">Hey {user?.name?.split(' ')[0] ?? 'rider'} 🛵</ThemedText>
            <ThemedText themeColor="textSecondary">
              {available.length} {available.length === 1 ? 'delivery' : 'deliveries'} available near you
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => <AvailableCard order={item} onAccept={() => acceptDelivery(item.id)} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundElement }]}>
              <Ionicons name="flash-outline" size={40} color={theme.textMuted} />
            </View>
            <ThemedText style={styles.emptyTitle}>No deliveries right now</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.emptyText}>
              New pickups will appear here as vendors mark orders ready.
            </ThemedText>
          </View>
        }
      />
    </Screen>
  );
}

function AvailableCard({ order, onAccept }: { order: Order; onAccept: () => void }) {
  const theme = useTheme();
  const { getVendor } = useVendors();
  const vendor = getVendor(order.vendorId);
  const itemCount = order.items.reduce((n, i) => n + i.qty, 0);
  // Mock distance for the PoC.
  const distance = (1 + (parseInt(order.id.slice(-2), 36) % 40) / 10).toFixed(1);

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardTop}>
        <View style={[styles.earnPill, { backgroundColor: theme.primaryMuted }]}>
          <ThemedText type="smallBold" themeColor="primary">
            +{formatNaira(order.deliveryFee)}
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textMuted">
          {distance} km · {itemCount} item{itemCount === 1 ? '' : 's'}
        </ThemedText>
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
              Deliver to
            </ThemedText>
            <ThemedText style={styles.pointName} numberOfLines={1}>
              {order.address}
            </ThemedText>
          </View>
        </View>
      </View>

      <Button label="Accept delivery" onPress={onAccept} />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.five, gap: Spacing.three },
  header: { paddingTop: Spacing.two, paddingBottom: Spacing.two, gap: 2 },
  card: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.three },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  earnPill: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.one + 2, borderRadius: Radius.pill },
  route: { flexDirection: 'row', gap: Spacing.three },
  routeCol: { alignItems: 'center', paddingTop: 2 },
  node: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  routeLine: { width: 2, flex: 1, minHeight: 24, marginVertical: 3 },
  routeText: { flex: 1, gap: Spacing.three },
  routePoint: { gap: 1 },
  pointName: { fontSize: 15, fontWeight: '700' },
  empty: { alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.six },
  emptyIcon: { width: 96, height: 96, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.two },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptyText: { textAlign: 'center', paddingHorizontal: Spacing.four },
});
