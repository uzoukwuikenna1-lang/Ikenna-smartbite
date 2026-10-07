import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PaystackModal } from '@/components/paystack-modal';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { useAddresses, useAuth, useCart, useDeliveryLocation, useOrders, useVendors } from '@/context/store';
import { formatNaira } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';

type PayMethod = 'card' | 'transfer' | 'cash';

const METHODS: { id: PayMethod; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'card', label: 'Debit card', icon: 'card-outline' },
  { id: 'transfer', label: 'Bank transfer', icon: 'swap-horizontal-outline' },
  { id: 'cash', label: 'Cash on delivery', icon: 'cash-outline' },
];

export default function Checkout() {
  const theme = useTheme();
  const { cart, cartVendorId, cartSubtotal } = useCart();
  const { placeOrder } = useOrders();
  const { addresses, defaultAddress } = useAddresses();
  const { getVendor } = useVendors();
  const { user } = useAuth();
  const { deliveryLocation } = useDeliveryLocation();

  const vendor = cartVendorId ? getVendor(cartVendorId) : undefined;
  const deliveryFee = vendor?.deliveryFee ?? 0;
  const total = cartSubtotal + deliveryFee;

  const [address, setAddress] = useState(
    deliveryLocation ? `${deliveryLocation}, FUTO` : (defaultAddress?.details ?? ''),
  );
  const [note, setNote] = useState('');
  const [method, setMethod] = useState<PayMethod>('card');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [showPaystack, setShowPaystack] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  async function useCurrentLocation() {
    setLocError(null);
    setLocating(true);
    try {
      // Real device geolocation — prompts the user for permission the first time.
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocError(
          'Location access is off. Allow it when prompted (on iPhone: Settings → Privacy → Location → Safari), or just type your address / pick a spot on the home screen.',
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;

      // Try to turn the coordinates into a readable address (native platforms).
      let label = `Current location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
      try {
        const places = await Location.reverseGeocodeAsync({ latitude, longitude });
        const p = places?.[0];
        if (p) {
          const parts = [p.name, p.street, p.district, p.city, p.region].filter(Boolean);
          if (parts.length) label = parts.join(', ');
        }
      } catch {
        // reverse geocoding not available (e.g. web) — keep the coordinates.
      }
      setAddress(label);
    } catch {
      setLocError('Couldn’t get your location. Please type your address instead.');
    } finally {
      setLocating(false);
    }
  }

  function onPay() {
    if (cart.length === 0 || !address.trim()) return;
    setPayError(null);
    if (method === 'cash') {
      // Cash on delivery skips the card popup.
      completeOrder();
    } else {
      setShowPaystack(true);
    }
  }

  async function completeOrder() {
    setShowPaystack(false);
    setPaying(true);
    try {
      // The order is created on the server (which records the payment reference).
      const order = await placeOrder(address.trim(), { note: note.trim(), paymentMethod: method });
      if (order) {
        router.replace({ pathname: '/(shop)/order/[id]', params: { id: order.id, justPaid: '1' } });
      } else {
        setPayError('Your cart is empty.');
        setPaying(false);
      }
    } catch (e) {
      setPayError(e instanceof Error ? e.message : 'Payment failed. Please try again.');
      setPaying(false);
    }
  }

  return (
    <Screen edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.appbarTitle}>Checkout</ThemedText>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Section title="Delivery address">
          <TextField
            icon="location-outline"
            placeholder="Where should we deliver?"
            value={address}
            onChangeText={setAddress}
          />

          <Pressable
            onPress={useCurrentLocation}
            disabled={locating}
            style={[styles.locBtn, { borderColor: theme.primary, backgroundColor: theme.primaryMuted }]}>
            {locating ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Ionicons name="navigate" size={18} color={theme.primary} />
            )}
            <ThemedText type="smallBold" themeColor="primary">
              {locating ? 'Detecting your location…' : 'Use current location'}
            </ThemedText>
          </Pressable>

          {locError && (
            <ThemedText type="small" themeColor="danger">
              {locError}
            </ThemedText>
          )}

          {addresses.length > 0 && (
            <View style={styles.savedChips}>
              {addresses.map((a) => {
                const active = a.details === address;
                return (
                  <Pressable
                    key={a.id}
                    onPress={() => setAddress(a.details)}
                    style={[
                      styles.savedChip,
                      { borderColor: active ? theme.primary : theme.border, backgroundColor: theme.card },
                    ]}>
                    <Ionicons
                      name={a.label.toLowerCase().includes('hostel') ? 'bed-outline' : 'business-outline'}
                      size={14}
                      color={active ? theme.primary : theme.textMuted}
                    />
                    <ThemedText type="small" style={{ color: active ? theme.primary : theme.textSecondary, fontWeight: '700' }}>
                      {a.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          )}

          <TextField
            icon="chatbubble-ellipses-outline"
            placeholder="Note for rider (optional)"
            value={note}
            onChangeText={setNote}
          />
        </Section>

        <Section title="Payment method">
          <View style={styles.methods}>
            {METHODS.map((m) => {
              const active = m.id === method;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => setMethod(m.id)}
                  style={[
                    styles.method,
                    { borderColor: active ? theme.primary : theme.border, backgroundColor: theme.card },
                  ]}>
                  <Ionicons name={m.icon} size={22} color={active ? theme.primary : theme.textMuted} />
                  <ThemedText style={[styles.methodLabel, active && { color: theme.primary }]}>
                    {m.label}
                  </ThemedText>
                  <Ionicons
                    name={active ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={active ? theme.primary : theme.textMuted}
                  />
                </Pressable>
              );
            })}
          </View>
          <View style={[styles.demoNote, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="shield-checkmark-outline" size={16} color={theme.textMuted} />
            <ThemedText type="small" themeColor="textMuted" style={styles.flex}>
              Demo payment — no real money is charged.
            </ThemedText>
          </View>
        </Section>

        <Section title="Order summary">
          <View style={[styles.summary, { borderColor: theme.border }]}>
            {cart.map((l) => (
              <View key={l.item.id} style={styles.summaryRow}>
                <ThemedText themeColor="textSecondary" numberOfLines={1} style={styles.flex}>
                  {l.qty}× {l.item.name}
                </ThemedText>
                <ThemedText style={styles.rowValue}>{formatNaira(l.item.price * l.qty)}</ThemedText>
              </View>
            ))}
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.summaryRow}>
              <ThemedText themeColor="textSecondary">Subtotal</ThemedText>
              <ThemedText style={styles.rowValue}>{formatNaira(cartSubtotal)}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText themeColor="textSecondary">Delivery fee</ThemedText>
              <ThemedText style={styles.rowValue}>{formatNaira(deliveryFee)}</ThemedText>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.summaryRow}>
              <ThemedText style={styles.totalLabel}>Total</ThemedText>
              <ThemedText style={styles.totalLabel}>{formatNaira(total)}</ThemedText>
            </View>
          </View>
        </Section>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        {payError && (
          <ThemedText type="small" themeColor="danger" style={styles.payError}>
            {payError}
          </ThemedText>
        )}
        <Button
          label={
            paying
              ? 'Placing order…'
              : method === 'cash'
                ? `Place order • ${formatNaira(total)}`
                : `Pay ${formatNaira(total)}`
          }
          onPress={onPay}
          loading={paying}
          disabled={cart.length === 0 || address.trim().length === 0}
        />
      </View>

      <PaystackModal
        visible={showPaystack}
        email={user?.email ?? 'customer@futo.edu.ng'}
        amount={total}
        method={method === 'transfer' ? 'transfer' : 'card'}
        onClose={() => setShowPaystack(false)}
        onSuccess={() => completeOrder()}
      />
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      {children}
    </View>
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
  scroll: { padding: Spacing.four, gap: Spacing.four, paddingBottom: Spacing.five },
  section: { gap: Spacing.two },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: Spacing.one },
  locBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 44,
    borderWidth: 1.5,
    borderRadius: Radius.md,
  },
  savedChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  savedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
  },
  methods: { gap: Spacing.two },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderWidth: 1.5,
    borderRadius: Radius.md,
  },
  methodLabel: { flex: 1, fontWeight: '700', fontSize: 15 },
  demoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
    marginTop: Spacing.two,
  },
  summary: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.three, gap: Spacing.two },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  rowValue: { fontWeight: '600' },
  divider: { height: 1, marginVertical: 2 },
  totalLabel: { fontWeight: '800', fontSize: 16 },
  footer: { padding: Spacing.four, borderTopWidth: 1 },
  payError: { marginBottom: Spacing.two, textAlign: 'center' },
});
