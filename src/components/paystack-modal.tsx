/**
 * Demo Paystack-style checkout modal.
 * Mimics the Paystack popup look & flow so the demo feels real, but NO money
 * moves and no card data leaves the device. Two modes:
 *   - card:     card number / expiry / CVV → "Pay"
 *   - transfer: a (fake) one-time virtual account to send to → "I have paid"
 * Swap for the real Paystack SDK once the business is verified.
 */

import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
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
  method = 'card',
  onClose,
  onSuccess,
}: {
  visible: boolean;
  email: string;
  amount: number;
  method?: 'card' | 'transfer';
  onClose: () => void;
  onSuccess: (reference: string) => void;
}) {
  const [card, setCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [copied, setCopied] = useState(false);
  const [stage, setStage] = useState<'form' | 'processing' | 'success'>('form');

  // A stable fake virtual account for the transfer flow.
  const account = useMemo(
    () => ({
      bank: 'Paystack-Titan MFB',
      number: '90' + String(Math.floor(10000000 + Math.random() * 89999999)),
      name: 'SMARTBITE FUTO',
    }),
    [],
  );

  const cardValid = luhnish(card) && /^\d{2}\/\d{2}$/.test(expiry) && cvv.length >= 3;
  const formValid = method === 'transfer' ? true : cardValid;

  function formatCard(v: string) {
    const digits = v.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  }
  function formatExpiry(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  }

  function copyAccount() {
    setCopied(true);
    try {
      // Best-effort copy on web; harmless no-op elsewhere.
      (globalThis as any)?.navigator?.clipboard?.writeText?.(account.number);
    } catch {}
    setTimeout(() => setCopied(false), 1500);
  }

  function pay() {
    if (!formValid) return;
    setStage('processing');
    // Simulate Paystack confirming the payment.
    setTimeout(() => {
      setStage('success');
      const reference = 'PSK_' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 1000);
      setTimeout(() => {
        onSuccess(reference);
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
          ) : method === 'transfer' ? (
            <View style={styles.body}>
              <ThemedText style={styles.sectionLabel}>BANK TRANSFER</ThemedText>
              <ThemedText style={styles.transferIntro}>
                Transfer {formatNaira(amount)} to the account below, then tap “I have paid”.
              </ThemedText>

              <View style={styles.acctCard}>
                <AcctRow label="Bank" value={account.bank} />
                <View style={styles.acctDivider} />
                <View style={styles.acctRow}>
                  <View style={styles.flex}>
                    <ThemedText style={styles.acctLabel}>Account Number</ThemedText>
                    <ThemedText style={styles.acctNumber}>{account.number}</ThemedText>
                  </View>
                  <Pressable onPress={copyAccount} hitSlop={8} style={styles.copyBtn}>
                    <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={PS.blue} />
                    <ThemedText style={styles.copyText}>{copied ? 'Copied' : 'Copy'}</ThemedText>
                  </Pressable>
                </View>
                <View style={styles.acctDivider} />
                <AcctRow label="Account Name" value={account.name} />
                <View style={styles.acctDivider} />
                <AcctRow label="Amount" value={formatNaira(amount)} strong />
              </View>

              <View style={styles.testHint}>
                <Ionicons name="information-circle-outline" size={14} color={PS.grey} />
                <ThemedText style={styles.testHintText}>
                  Demo mode — this is a one-time account for this order. No real transfer is needed.
                </ThemedText>
              </View>

              <Pressable
                onPress={pay}
                disabled={stage === 'processing'}
                style={[styles.payBtn, { backgroundColor: PS.blue }]}>
                {stage === 'processing' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.payBtnText}>I have paid</ThemedText>
                )}
              </Pressable>

              <View style={styles.securedRow}>
                <Ionicons name="lock-closed" size={12} color={PS.grey} />
                <ThemedText style={styles.securedText}>Secured by </ThemedText>
                <ThemedText style={[styles.securedText, { color: PS.navy, fontWeight: '800' }]}>Paystack</ThemedText>
              </View>
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
                disabled={!formValid || stage === 'processing'}
                style={[styles.payBtn, { backgroundColor: formValid ? PS.blue : '#B6D9EA' }]}>
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

function AcctRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.acctRow}>
      <ThemedText style={styles.acctLabel}>{label}</ThemedText>
      <ThemedText style={[styles.acctValue, strong && { color: PS.navy, fontWeight: '800' }]}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  transferIntro: { color: PS.grey, fontSize: 13, lineHeight: 18 },
  acctCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: PS.line, borderRadius: 12, paddingHorizontal: 14 },
  acctRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, gap: 10 },
  acctDivider: { height: 1, backgroundColor: PS.line },
  acctLabel: { color: PS.grey, fontSize: 13 },
  acctValue: { color: PS.navy, fontSize: 14, fontWeight: '600' },
  acctNumber: { color: PS.navy, fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EAF6FC', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  copyText: { color: PS.blue, fontSize: 12, fontWeight: '800' },
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
