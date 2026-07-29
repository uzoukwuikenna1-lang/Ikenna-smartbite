import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { SettingsScreen } from '@/components/settings-screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { usePayments } from '@/context/store';
import { useTheme } from '@/hooks/use-theme';

const BRAND_EMOJI: Record<string, string> = { Visa: '💳', Mastercard: '💳', Verve: '💳' };

export default function PaymentMethods() {
  const theme = useTheme();
  const { cards, addCard, removeCard } = usePayments();

  const [adding, setAdding] = useState(false);
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');

  const digits = number.replace(/\D/g, '');
  const canAdd = digits.length >= 12 && /^\d{2}\/\d{2}$/.test(expiry.trim());

  function onAdd() {
    addCard(number, expiry);
    setNumber('');
    setExpiry('');
    setAdding(false);
  }

  return (
    <SettingsScreen title="Payment methods">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.demoNote, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="shield-checkmark-outline" size={16} color={theme.textMuted} />
            <ThemedText type="small" themeColor="textMuted" style={styles.flex}>
              Demo cards only — no real card is charged or stored.
            </ThemedText>
          </View>

          {cards.map((c) => (
            <View key={c.id} style={[styles.card, { backgroundColor: theme.primaryDark }]}>
              <View style={styles.cardTop}>
                <ThemedText style={styles.cardBrand}>{c.brand}</ThemedText>
                <Pressable onPress={() => removeCard(c.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={20} color="#ffffffcc" />
                </Pressable>
              </View>
              <ThemedText style={styles.cardNumber}>•••• •••• •••• {c.last4}</ThemedText>
              <View style={styles.cardBottom}>
                <ThemedText style={styles.cardMeta}>Expires {c.expiry}</ThemedText>
                <ThemedText style={styles.cardChip}>{BRAND_EMOJI[c.brand] ?? '💳'}</ThemedText>
              </View>
            </View>
          ))}

          {cards.length === 0 && (
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              No cards yet. Add one below.
            </ThemedText>
          )}

          {adding ? (
            <View style={[styles.addForm, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <ThemedText style={styles.addTitle}>Add card</ThemedText>
              <TextField
                label="Card number"
                icon="card-outline"
                placeholder="4242 4242 4242 4242"
                keyboardType="number-pad"
                value={number}
                onChangeText={setNumber}
              />
              <TextField
                label="Expiry (MM/YY)"
                icon="calendar-outline"
                placeholder="08/27"
                value={expiry}
                onChangeText={setExpiry}
              />
              <View style={styles.addBtns}>
                <Button label="Cancel" variant="secondary" onPress={() => setAdding(false)} style={styles.flex} />
                <Button label="Add card" onPress={onAdd} disabled={!canAdd} style={styles.flex} />
              </View>
            </View>
          ) : (
            <Pressable onPress={() => setAdding(true)} style={[styles.addRow, { borderColor: theme.primary }]}>
              <Ionicons name="add-circle-outline" size={22} color={theme.primary} />
              <ThemedText type="smallBold" themeColor="primary">
                Add new card
              </ThemedText>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: Spacing.four, gap: Spacing.three },
  demoNote: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.md },
  card: { borderRadius: Radius.lg, padding: Spacing.four, gap: Spacing.four },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBrand: { color: '#fff', fontSize: 16, fontWeight: '800' },
  cardNumber: { color: '#fff', fontSize: 20, fontWeight: '700', letterSpacing: 2 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardMeta: { color: '#ffffffcc', fontSize: 13, fontWeight: '600' },
  cardChip: { fontSize: 22 },
  empty: { textAlign: 'center', paddingVertical: Spacing.four },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 54,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
  },
  addForm: { padding: Spacing.three, borderWidth: 1, borderRadius: Radius.lg, gap: Spacing.three },
  addTitle: { fontSize: 16, fontWeight: '800' },
  addBtns: { flexDirection: 'row', gap: Spacing.three },
});
