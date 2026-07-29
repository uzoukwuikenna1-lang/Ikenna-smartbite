import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { api } from '@/api/client';
import { Stars } from '@/components/stars';
import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth, useOrders, useVendors } from '@/context/store';
import { formatNaira } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';

type Review = { id: string; customerName: string; rating: number; text: string };

export default function VendorSales() {
  const theme = useTheme();
  const { orders } = useOrders();
  const { user } = useAuth();
  const { getVendor } = useVendors();
  const vendorId = user?.vendorId ?? '';
  const vendor = vendorId ? getVendor(vendorId) : undefined;

  const [reviews, setReviews] = useState<Review[]>([]);
  useEffect(() => {
    if (!vendorId) return;
    api.get<{ reviews: Review[] }>(`/api/vendors/${vendorId}/reviews`).then((r) => setReviews(r.reviews)).catch(() => {});
  }, [vendorId]);

  // Orders here are already scoped to this vendor by the API.
  const delivered = useMemo(() => orders.filter((o) => o.status === 'delivered'), [orders]);

  const revenue = delivered.reduce((sum, o) => sum + o.subtotal, 0);
  const count = delivered.length;
  const avg = count ? Math.round(revenue / count) : 0;

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ThemedText type="subtitle" style={styles.title}>
          Sales
        </ThemedText>

        <View style={styles.statRow}>
          <Stat icon="cash-outline" label="Revenue" value={formatNaira(revenue)} tint={theme.primaryMuted} color={theme.primary} />
          <Stat icon="cube-outline" label="Orders" value={String(count)} tint="#FEF3C7" color={theme.warning} />
        </View>
        <View style={styles.statRow}>
          <Stat icon="trending-up-outline" label="Avg order" value={formatNaira(avg)} tint="#DBEAFE" color="#2563EB" />
          <Stat
            icon="star-outline"
            label="Rating"
            value={`${vendor?.rating.toFixed(1) ?? '—'}`}
            tint="#FCE7F3"
            color="#DB2777"
          />
        </View>

        <ThemedText style={styles.sectionTitle}>Recent sales</ThemedText>
        {delivered.length === 0 ? (
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            No completed sales yet.
          </ThemedText>
        ) : (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {delivered.map((o, i) => (
              <View
                key={o.id}
                style={[styles.saleRow, i < delivered.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
                <View style={styles.flex}>
                  <ThemedText style={styles.saleName}>#{o.id.replace('ord-', '')} · {o.customerName}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                    {o.items.map((it) => `${it.qty}× ${it.name}`).join(', ')}
                  </ThemedText>
                </View>
                <ThemedText type="smallBold">{formatNaira(o.subtotal)}</ThemedText>
              </View>
            ))}
          </View>
        )}

        <ThemedText style={styles.sectionTitle}>Customer reviews</ThemedText>
        {reviews.length === 0 ? (
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            No reviews yet.
          </ThemedText>
        ) : (
          <View style={styles.reviews}>
            {reviews.map((r) => (
              <View key={r.id} style={[styles.reviewCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.reviewTop}>
                  <View style={[styles.reviewAvatar, { backgroundColor: theme.primaryMuted }]}>
                    <ThemedText style={{ color: theme.primary, fontWeight: '800' }}>
                      {r.customerName.charAt(0)}
                    </ThemedText>
                  </View>
                  <View style={styles.flex}>
                    <ThemedText type="smallBold">{r.customerName}</ThemedText>
                    <Stars rating={r.rating} size={12} />
                  </View>
                </View>
                {!!r.text && (
                  <ThemedText type="small" themeColor="textSecondary">
                    {r.text}
                  </ThemedText>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function Stat({
  icon,
  label,
  value,
  tint,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tint: string;
  color: string;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.statIcon, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.five },
  title: { marginBottom: Spacing.one },
  statRow: { flexDirection: 'row', gap: Spacing.three },
  stat: { flex: 1, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.one },
  statIcon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.one },
  statValue: { fontSize: 20, fontWeight: '800' },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginTop: Spacing.three },
  card: { borderWidth: 1, borderRadius: Radius.lg, overflow: 'hidden' },
  saleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three },
  saleName: { fontSize: 14, fontWeight: '700' },
  empty: { paddingVertical: Spacing.three },
  reviews: { gap: Spacing.three },
  reviewCard: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.two },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  reviewAvatar: { width: 36, height: 36, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
});
