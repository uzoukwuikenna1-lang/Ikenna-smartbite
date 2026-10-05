/**
 * A dismissible hint shown only on iOS Safari (web) when the app is not yet
 * installed to the home screen — iOS gives no automatic install prompt, so we
 * tell the user how. No-op on native and on other platforms.
 */

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

const KEY = 'smartbite.a2hs.dismissed';

export function IosInstallHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    try {
      const nav: any = (globalThis as any).navigator;
      const ua: string = nav?.userAgent ?? '';
      const isIOS = /iPad|iPhone|iPod/.test(ua);
      const standalone =
        nav?.standalone === true ||
        (globalThis as any).matchMedia?.('(display-mode: standalone)')?.matches === true;
      const dismissed = (globalThis as any).localStorage?.getItem(KEY) === '1';
      if (isIOS && !standalone && !dismissed) setShow(true);
    } catch {}
  }, []);

  if (!show) return null;

  function dismiss() {
    try {
      (globalThis as any).localStorage?.setItem(KEY, '1');
    } catch {}
    setShow(false);
  }

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.card}>
        <View style={styles.iconTile}>
          <Ionicons name="phone-portrait-outline" size={20} color="#fff" />
        </View>
        <Text style={styles.text}>
          Install SmartBite — tap <Ionicons name="share-outline" size={14} color="#fff" /> then “Add to Home Screen”.
        </Text>
        <Pressable onPress={dismiss} hitSlop={10} style={styles.close}>
          <Ionicons name="close" size={18} color="#C7D2CB" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    padding: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: 520,
    width: '100%',
    backgroundColor: '#10231A',
    borderColor: '#2A3B30',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#15803D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, color: '#ECF5EE', fontSize: 13, lineHeight: 18 },
  close: { padding: 2 },
});
