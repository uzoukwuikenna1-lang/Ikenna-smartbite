import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { QuantityStepper } from '@/components/quantity-stepper';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useCart, useVendors } from '@/context/store';
import { formatNaira } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';

export default function Cart() {
  const theme = useTheme();
  const { cart, cartVendorId, cartSubtotal, addToCart, decrement, removeFromCart } = useCart();
  const { getVendor } = useVendors();
  const vendor = cartVendorId ? getVendor(cartVendorId) : undefined;
  const deliveryFee = vendor?.deliveryFee ?? 0;

  if (cart.length === 0) {
    return (
      <Screen padded edges={['top']}>
        <ThemedText type="subtitle" style={styles.pageTitle}>
          Your cart
        </ThemedText>
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="cart-outline" size={44} color={theme.textMuted} />
          </View>
          <ThemedText style={styles.emptyTitle}>Your cart is empty</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.emptyText}>
            Browse vendors and add some delicious food to get started.
          </ThemedText>
          <Button
            label="Browse vendors"
            fullWidth={false}
            onPress={() => router.push('/(customer)')}
            style={styles.emptyCta}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ThemedText type="subtitle" style={styles.pageTitle}>
          Your cart
        </ThemedText>

        {vendor && (
          <View style={[styles.vendorRow, { backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.vendorThumb, { backgroundColor: vendor.color }]}>
              <ThemedText style={{ fontSize: 22 }}>{vendor.emoji}</ThemedText>
            </View>
            <View style={styles.flex}>
              <ThemedText style={styles.vendorName}>{vendor.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {vendor.deliveryMins} min • {formatNaira(vendor.deliveryFee)} delivery
              </ThemedText>
            </View>
          </View>
        )}

        <View style={styles.lines}>
          {cart.map((line) => (
            <View key={line.item.id} style={[styles.line, { borderColor: theme.border }]}>
              <View style={[styles.lineThumb, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText style={{ fontSize: 26 }}>{line.item.emoji}</ThemedText>
              </View>
              <View style={styles.flex}>
                <ThemedText style={styles.lineName} numberOfLines={1}>
                  {line.item.name}
                </ThemedText>
                <ThemedText type="smallBold" themeColor="primary">
                  {formatNaira(line.item.price)}
                </ThemedText>
                <View style={styles.lineControls}>
                  <QuantityStepper
                    qty={line.qty}
                    size="sm"
                    onAdd={() => addToCart(line.item)}
                    onRemove={() => decrement(line.item.id)}
                  />
                  <ThemedText type="smallBold">{formatNaira(line.item.price * line.qty)}</ThemedText>
                </View>
              </View>
              <Ionicons
                name="trash-outline"
                size={20}
                color={theme.textMuted}
                onPress={() => removeFromCart(line.item.id)}
              />
            </View>
          ))}
        </View>

        <View style={[styles.summary, { borderColor: theme.border }]}>
          <Row label="Subtotal" value={formatNaira(cartSubtotal)} />
          <Row label="Delivery fee" value={formatNaira(deliveryFee)} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Row label="Total" value={formatNaira(cartSubtotal + deliveryFee)} bold />
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <Button
          label={`Checkout • ${formatNaira(cartSubtotal + deliveryFee)}`}
          onPress={() => router.push('/(shop)/checkout')}
        />
      </View>
    </Screen>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <ThemedText style={bold ? styles.totalLabel : undefined} themeColor={bold ? 'text' : 'textSecondary'}>
        {label}
      </ThemedText>
      <ThemedText style={bold ? styles.totalValue : styles.rowValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pageTitle: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two, marginBottom: Spacing.three },
  scroll: { paddingBottom: Spacing.four, gap: Spacing.three },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginHorizontal: Spacing.four,
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
  vendorThumb: { width: 44, height: 44, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  vendorName: { fontWeight: '700', fontSize: 15 },
  lines: { paddingHorizontal: Spacing.four, gap: Spacing.three },
  line: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingBottom: Spacing.three, borderBottomWidth: 1 },
  lineThumb: { width: 60, height: 60, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  lineName: { fontWeight: '700', fontSize: 15 },
  lineControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.two },
  summary: {
    marginHorizontal: Spacing.four,
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
    gap: Spacing.two,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowValue: { fontWeight: '600' },
  divider: { height: 1, marginVertical: 2 },
  totalLabel: { fontWeight: '800', fontSize: 16 },
  totalValue: { fontWeight: '800', fontSize: 16 },
  footer: { padding: Spacing.four, borderTopWidth: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, paddingHorizontal: Spacing.four, marginTop: -Spacing.six },
  emptyIcon: { width: 96, height: 96, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.two },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptyText: { textAlign: 'center' },
  emptyCta: { marginTop: Spacing.three, paddingHorizontal: Spacing.five },
});
