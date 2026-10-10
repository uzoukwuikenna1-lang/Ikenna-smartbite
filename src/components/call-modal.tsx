/**
 * A simulated phone-call screen for the demo. Mimics calling → ringing →
 * connected (with a running timer) and a red hang-up button. No real call is
 * placed — it's purely a UI simulation so the "call rider" button feels real.
 */

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type Stage = 'calling' | 'ringing' | 'connected';

export function CallModal({ visible, name, subtitle, onClose }: { visible: boolean; name: string; subtitle?: string; onClose: () => void }) {
  const [stage, setStage] = useState<Stage>('calling');
  const [seconds, setSeconds] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) return;
    setStage('calling');
    setSeconds(0);
    timers.current.push(setTimeout(() => setStage('ringing'), 1500));
    timers.current.push(
      setTimeout(() => {
        setStage('connected');
        tick.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      }, 4000),
    );
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      if (tick.current) clearInterval(tick.current);
      tick.current = null;
    };
  }, [visible]);

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const status = stage === 'calling' ? 'Calling…' : stage === 'ringing' ? 'Ringing…' : mmss;
  const initial = (name || 'R').charAt(0).toUpperCase();

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.wrap}>
        <View style={styles.top}>
          <View style={styles.avatar}>
            <ThemedText style={styles.avatarEmoji}>🧑🏾</ThemedText>
          </View>
          <ThemedText style={styles.name}>{name}</ThemedText>
          {subtitle ? <ThemedText style={styles.sub}>{subtitle}</ThemedText> : null}
          <View style={styles.statusRow}>
            {stage !== 'connected' && <View style={styles.dot} />}
            <ThemedText style={styles.status}>{status}</ThemedText>
          </View>
          <ThemedText style={styles.demo}>Demo call · not a real call</ThemedText>
        </View>

        <View style={styles.controls}>
          <View style={styles.ctrlRow}>
            <Ctrl icon="mic-off-outline" label="mute" />
            <Ctrl icon="keypad-outline" label="keypad" />
            <Ctrl icon="volume-high-outline" label="speaker" />
          </View>
          <Pressable onPress={onClose} style={styles.hangup}>
            <Ionicons name="call" size={32} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Ctrl({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.ctrl}>
      <View style={styles.ctrlBtn}>
        <Ionicons name={icon} size={24} color="#fff" />
      </View>
      <ThemedText style={styles.ctrlLabel}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0B1410', justifyContent: 'space-between', paddingTop: 90, paddingBottom: 56 },
  top: { alignItems: 'center', gap: 10 },
  avatar: { width: 108, height: 108, borderRadius: 54, backgroundColor: '#1C2A22', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarEmoji: { fontSize: 56, lineHeight: 64 },
  name: { color: '#fff', fontSize: 28, lineHeight: 34, fontWeight: '800' },
  sub: { color: '#9DB0A5', fontSize: 14 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  status: { color: '#C7D2CB', fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
  demo: { color: '#5B6B62', fontSize: 12, marginTop: 4 },
  controls: { alignItems: 'center', gap: 36 },
  ctrlRow: { flexDirection: 'row', gap: 36 },
  ctrl: { alignItems: 'center', gap: 6 },
  ctrlBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  ctrlLabel: { color: '#9DB0A5', fontSize: 12 },
  hangup: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
});
