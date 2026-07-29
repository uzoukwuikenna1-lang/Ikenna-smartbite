/**
 * Demo Paystack-style checkout modal.
 * Mimics the Paystack popup look & flow (card entry → processing → success) so
 * the demo feels real, but NO money moves and no card data leaves the device.
 * Swap for the real Paystack SDK once the business is verified.
 */

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { formatNaira } from '@/data/mock';

// Paystack brand-ish palette (kept independent of the app theme).
const PS = {
  navy: '#011B33',
  blue: '#0BA4DB',
  blueDark: '#0A8FBF',
  grey: '#6B7280',
  line: '#E5E7EB',
  bg: '#F6F8FB',
  green: '#12B76A',
};

function luhnish(num: string) {
  return num.replace(/\s/g, '').length >= 15;
}

export function PaystackModal({
  visible,
  email,
  amount,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  email: string;
  amount: number;
  onClose: () => void;
  onSuccess: (reference: string) => void;
}) {
  const [card, setCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [stage, setStage] = useState<'form' | 'processing' | 'success'>('form');

  const canPay = luhnish(card) && /^\d{2}\/\d{2}$/.test(expiry) && cvv.length >= 3;

  function formatCard(v: string) {
    const digits = v.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  }
  function formatExpiry(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  }

  function pay() {
    if (!canPay) return;
    setStage('processing');
    // Simulate Paystack authorising the charge.
    setTimeout(() => {
      setStage('success');
      const reference = 'PSK_' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 1000);
      setTimeout(() => {
        onSuccess(reference);
        // reset for next time
        setStage('form');
        setCard('');
        setExpiry('');
        setCvv('');
      }, 1100);
    }, 1700);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={styles.logo}>
                <ThemedText style={styles.logoText}>pay</ThemedText>
                <View style={styles.logoDot} />
              </View>
              {stage === 'form' && (
                <Pressable onPress={onClose} hitSlop={10}>
                  <Ionicons name="close" size={22} color={PS.grey} />
                </Pressable>
              )}
            </View>
            <ThemedText style={styles.email}>{email}</ThemedText>
            <ThemedText style={styles.payAmount}>Pay {formatNaira(amount)}</ThemedText>
          </View>

          {stage === 'success' ? (
            <View style={styles.center}>
              <View style={styles.successCircle}>
                <Ionicons name="checkmark" size={40} color="#fff" />
              </View>
              <ThemedText style={styles.successTitle}>Payment complete</ThemedText>
              <ThemedText style={styles.successSub}>Redirecting…</ThemedText>
            </View>
          ) : (
            <View style={styles.body}>
              <ThemedText style={styles.sectionLabel}>PAY WITH CARD</ThemedText>

              <View style={styles.field}>
                <Ionicons name="card-outline" size={20} color={PS.grey} />
                <TextInput
                  style={styles.input}
                  placeholder="Card number"
                  placeholderTextColor={PS.grey}
                  keyboardType="number-pad"
                  value={card}
                  onChangeText={(v) => setCard(formatCard(v))}
                  editable={stage === 'form'}
                />
                <ThemedText style={styles.visa}>VISA</ThemedText>
              </View>

              <View style={styles.fieldRow}>
                <View style={[styles.field, styles.half]}>
                  <TextInput
                    style={styles.input}
                    placeholder="MM / YY"
                    placeholderTextColor={PS.grey}
                    keyboardType="number-pad"
                    value={expiry}
                    onChangeText={(v) => setExpiry(formatExpiry(v))}
                    editable={stage === 'form'}
                  />
                </View>
                <View style={[styles.field, styles.half]}>
                  <TextInput
                    style={styles.input}
                    placeholder="CVV"
                    placeholderTextColor={PS.grey}
                    keyboardType="number-pad"
                    maxLength={4}
                    value={cvv}
                    onChangeText={setCvv}
                    editable={stage === 'form'}
                  />
                  <Ionicons name="lock-closed" size={16} color={PS.grey} />
                </View>
              </View>

              <View style={styles.testHint}>
                <Ionicons name="information-circle-outline" size={14} color={PS.grey} />
                <ThemedText style={styles.testHintText}>
                  Demo mode — use any test card, e.g. 4084 0840 8408 4081, 12/30, CVV 408.
                </ThemedText>
              </View>

              <Pressable
                onPress={pay}
                disabled={!canPay || stage === 'processing'}
                style={[styles.payBtn, { backgroundColor: canPay ? PS.blue : '#B6D9EA' }]}>
                {stage === 'processing' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.payBtnText}>Pay {formatNaira(amount)}</ThemedText>
                )}
              </Pressable>

              <View style={styles.securedRow}>
                <Ionicons name="lock-closed" size={12} color={PS.grey} />
                <ThemedText style={styles.securedText}>Secured by </ThemedText>
                <ThemedText style={[styles.securedText, { color: PS.navy, fontWeight: '800' }]}>Paystack</ThemedText>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(1,27,51,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: PS.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 28,
    maxHeight: '90%',
  },
  header: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: PS.line,
    gap: 4,
  },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  logo: { flexDirection: 'row', alignItems: 'flex-end' },
  logoText: { color: PS.navy, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  logoDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: PS.blue, marginBottom: 5, marginLeft: 2 },
  email: { color: PS.grey, fontSize: 13 },
  payAmount: { color: PS.navy, fontSize: 20, fontWeight: '800' },
  body: { padding: 20, gap: 12 },
  sectionLabel: { color: PS.grey, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: PS.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 52,
  },
  fieldRow: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  input: { flex: 1, fontSize: 16, color: PS.navy, height: '100%' },
  visa: { color: PS.blue, fontWeight: '800', fontSize: 13, fontStyle: 'italic' },
  testHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  testHintText: { color: PS.grey, fontSize: 12, flex: 1 },
  payBtn: { height: 52, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  securedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  securedText: { color: PS.grey, fontSize: 12 },
  center: { padding: 40, alignItems: 'center', gap: 10 },
  successCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: PS.green, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  successTitle: { color: PS.navy, fontSize: 18, fontWeight: '800' },
  successSub: { color: PS.grey, fontSize: 13 },
});
