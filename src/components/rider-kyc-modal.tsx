/**
 * Mock rider KYC / identity verification flow (demo only — no real identity
 * check happens). Mirrors the feel of a real onboarding KYC:
 *   intro → ID details (NIN / Student ID / Licence) → face scan → verified.
 * On completion it calls `onSubmit`, which persists the verification to the
 * backend (PATCH /api/me/kyc) so it is saved in the database.
 */

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Stage = 'intro' | 'id' | 'face' | 'submitting' | 'done';

const ID_TYPES = ['NIN', 'Student ID', "Driver's Licence"] as const;

export function RiderKycModal({
  visible,
  onSubmit,
  onDone,
}: {
  visible: boolean;
  onSubmit: (p: { idType: string; idNumber: string; vehicle?: string; plate?: string }) => Promise<void>;
  onDone: () => void;
}) {
  const theme = useTheme();
  const [stage, setStage] = useState<Stage>('intro');
  const [idType, setIdType] = useState<string>('NIN');
  const [idNumber, setIdNumber] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [plate, setPlate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const idValid = idNumber.replace(/\D/g, '').length >= 4;

  const idTooShort = !idValid;

  async function finish() {
    setStage('submitting');
    setError(null);
    try {
      await onSubmit({ idType, idNumber: idNumber.trim(), vehicle: vehicle.trim(), plate: plate.trim() });
      setStage('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed. Please try again.');
      setStage('id');
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={() => {}}>
      <View style={[styles.backdrop, { backgroundColor: theme.background }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Progress header */}
            <View style={styles.steps}>
              {(['id', 'face', 'done'] as const).map((s, i) => {
                const order: Stage[] = ['id', 'face', 'done'];
                const activeIdx = stage === 'intro' ? -1 : stage === 'submitting' ? 1 : order.indexOf(stage as Stage);
                const on = i <= activeIdx;
                return (
                  <View
                    key={s}
                    style={[styles.stepBar, { backgroundColor: on ? theme.primary : theme.border }]}
                  />
                );
              })}
            </View>

            {stage === 'intro' && (
              <View style={styles.center}>
                <View style={[styles.hero, { backgroundColor: theme.primaryMuted }]}>
                  <Ionicons name="shield-checkmark" size={44} color={theme.primary} />
                </View>
                <ThemedText style={styles.title}>Verify your identity</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.sub}>
                  Before you can accept deliveries, we confirm you're a real, identifiable
                  person. This keeps customers safe.
                </ThemedText>
                <View style={styles.bullets}>
                  <Bullet icon="card-outline" text="A government or student ID" />
                  <Bullet icon="scan-outline" text="A quick face scan" />
                  <Bullet icon="time-outline" text="Takes about a minute" />
                </View>
                <View style={[styles.demoTag, { backgroundColor: theme.backgroundElement }]}>
                  <Ionicons name="information-circle-outline" size={14} color={theme.textMuted} />
                  <ThemedText type="small" themeColor="textMuted" style={styles.flex}>
                    Demo verification — no real ID is checked or stored.
                  </ThemedText>
                </View>
                <Button label="Start verification" onPress={() => setStage('id')} style={styles.cta} />
              </View>
            )}

            {stage === 'id' && (
              <View style={styles.form}>
                <ThemedText style={styles.title}>Your ID</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.sub}>
                  Choose an ID type and enter its number.
                </ThemedText>

                <View style={styles.chips}>
                  {ID_TYPES.map((t) => {
                    const on = t === idType;
                    return (
                      <Pressable
                        key={t}
                        onPress={() => setIdType(t)}
                        style={[
                          styles.chip,
                          { borderColor: on ? theme.primary : theme.border, backgroundColor: on ? theme.primaryMuted : theme.card },
                        ]}>
                        <ThemedText type="smallBold" style={{ color: on ? theme.primary : theme.textSecondary }}>
                          {t}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>

                <Field
                  label={`${idType} number`}
                  icon="card-outline"
                  value={idNumber}
                  onChangeText={(v) => setIdNumber(v.replace(/[^0-9A-Za-z]/g, '').slice(0, 14))}
                  placeholder="e.g. 12345678901"
                  keyboardType="default"
                />

                <View style={styles.row}>
                  <View style={styles.flex}>
                    <Field label="Vehicle" icon="bicycle-outline" value={vehicle} onChangeText={setVehicle} placeholder="Honda" />
                  </View>
                  <View style={styles.flex}>
                    <Field label="Plate no." icon="pricetag-outline" value={plate} onChangeText={(v) => setPlate(v.toUpperCase())} placeholder="ABC-123 XY" />
                  </View>
                </View>

                {error ? (
                  <ThemedText type="small" themeColor="danger">
                    {error}
                  </ThemedText>
                ) : null}

                <Button label="Continue" onPress={() => setStage('face')} disabled={idTooShort} style={styles.cta} />
              </View>
            )}

            {(stage === 'face' || stage === 'submitting') && (
              <FaceScan
                submitting={stage === 'submitting'}
                onScanned={finish}
              />
            )}

            {stage === 'done' && (
              <View style={styles.center}>
                <View style={[styles.hero, { backgroundColor: theme.primary }]}>
                  <Ionicons name="checkmark" size={48} color={theme.onPrimary} />
                </View>
                <ThemedText style={styles.title}>You're verified</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.sub}>
                  Your identity is confirmed. You can now accept deliveries.
                </ThemedText>
                <Button label="Start delivering" onPress={onDone} style={styles.cta} />
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

/** Simulated face scan — animates a scan line, then auto-advances. */
function FaceScan({ submitting, onScanned }: { submitting: boolean; onScanned: () => void }) {
  const theme = useTheme();
  const scan = useRef(new Animated.Value(0)).current;
  const [caption, setCaption] = useState('Position your face in the frame');
  const firedRef = useRef(false);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scan, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scan, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();

    const t1 = setTimeout(() => setCaption('Scanning your face…'), 900);
    const t2 = setTimeout(() => setCaption('Matching to your ID…'), 2200);
    const t3 = setTimeout(() => {
      setCaption('Face captured');
      if (!firedRef.current) {
        firedRef.current = true;
        onScanned();
      }
    }, 3400);

    return () => {
      loop.stop();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const translateY = scan.interpolate({ inputRange: [0, 1], outputRange: [-96, 96] });

  return (
    <View style={styles.center}>
      <ThemedText style={styles.title}>Face verification</ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.sub}>
        {submitting ? 'Verifying…' : caption}
      </ThemedText>

      <View style={[styles.faceFrame, { borderColor: theme.primary, backgroundColor: theme.backgroundElement }]}>
        <ThemedText style={styles.faceEmoji}>🧑🏾</ThemedText>
        <Animated.View
          style={[styles.scanLine, { backgroundColor: theme.primary, transform: [{ translateY }] }]}
        />
        <View style={[styles.corner, styles.tl, { borderColor: theme.primary }]} />
        <View style={[styles.corner, styles.tr, { borderColor: theme.primary }]} />
        <View style={[styles.corner, styles.bl, { borderColor: theme.primary }]} />
        <View style={[styles.corner, styles.br, { borderColor: theme.primary }]} />
      </View>

      <View style={[styles.demoTag, { backgroundColor: theme.backgroundElement }]}>
        <Ionicons name="information-circle-outline" size={14} color={theme.textMuted} />
        <ThemedText type="small" themeColor="textMuted" style={styles.flex}>
          Demo scan — your camera is not actually used.
        </ThemedText>
      </View>
    </View>
  );
}

function Bullet({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.bullet}>
      <Ionicons name={icon} size={18} color={theme.primary} />
      <ThemedText themeColor="textSecondary">{text}</ThemedText>
    </View>
  );
}

function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad';
}) {
  const theme = useTheme();
  return (
    <View style={styles.fieldWrap}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
        {label}
      </ThemedText>
      <View style={[styles.field, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <Ionicons name={icon} size={18} color={theme.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize="characters"
          style={[styles.input, { color: theme.text }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1 },
  scroll: { padding: Spacing.four, paddingTop: Spacing.six, gap: Spacing.three, flexGrow: 1, justifyContent: 'center' },
  steps: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.two },
  stepBar: { flex: 1, height: 5, borderRadius: 3 },
  center: { alignItems: 'center', gap: Spacing.two },
  hero: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.two },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  sub: { textAlign: 'center', paddingHorizontal: Spacing.three },
  bullets: { gap: Spacing.two, marginVertical: Spacing.three, alignSelf: 'stretch', paddingHorizontal: Spacing.three },
  bullet: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  demoTag: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.md, marginTop: Spacing.two, alignSelf: 'stretch' },
  cta: { alignSelf: 'stretch', marginTop: Spacing.three },
  form: { gap: Spacing.three },
  chips: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: Radius.pill, borderWidth: 1.5 },
  row: { flexDirection: 'row', gap: Spacing.three },
  fieldWrap: { gap: Spacing.one },
  fieldLabel: { fontWeight: '700' },
  field: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderWidth: 1.5, borderRadius: Radius.md, paddingHorizontal: Spacing.three, height: 52 },
  input: { flex: 1, fontSize: 16, height: '100%' },
  faceFrame: { width: 200, height: 200, borderRadius: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginVertical: Spacing.three },
  faceEmoji: { fontSize: 96, lineHeight: 110 },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 3, opacity: 0.9 },
  corner: { position: 'absolute', width: 26, height: 26, borderWidth: 3 },
  tl: { top: 8, left: 8, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 10 },
  tr: { top: 8, right: 8, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 10 },
  bl: { bottom: 8, left: 8, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 10 },
  br: { bottom: 8, right: 8, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 10 },
});
