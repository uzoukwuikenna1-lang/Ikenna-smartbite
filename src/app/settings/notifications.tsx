import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import { SettingsScreen } from '@/components/settings-screen';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useNotifPrefs, type NotifPrefs } from '@/context/store';
import { useTheme } from '@/hooks/use-theme';

type Row = { key: keyof NotifPrefs; icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string };

const ROWS: Row[] = [
  { key: 'orderUpdates', icon: 'receipt-outline', title: 'Order updates', subtitle: 'When your order is accepted or ready' },
  { key: 'deliveryUpdates', icon: 'bicycle-outline', title: 'Delivery updates', subtitle: 'Rider assigned, picked up and on the way' },
  { key: 'promos', icon: 'pricetag-outline', title: 'Promotions & offers', subtitle: 'Discounts and deals from vendors' },
  { key: 'newVendors', icon: 'storefront-outline', title: 'New vendors', subtitle: 'When new vendors join SmartBite' },
];

export default function Notifications() {
  const theme = useTheme();
  const { notifPrefs, setNotifPref } = useNotifPrefs();

  return (
    <SettingsScreen title="Notifications">
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {ROWS.map((row, i) => (
            <View
              key={row.key}
              style={[styles.row, i < ROWS.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
              <View style={[styles.iconTile, { backgroundColor: theme.backgroundElement }]}>
                <Ionicons name={row.icon} size={20} color={theme.primary} />
              </View>
              <View style={styles.flex}>
                <ThemedText style={styles.title}>{row.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {row.subtitle}
                </ThemedText>
              </View>
              <Switch
                value={notifPrefs[row.key]}
                onValueChange={(v) => setNotifPref(row.key, v)}
                trackColor={{ false: theme.backgroundSelected, true: theme.primary }}
                thumbColor="#ffffff"
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: Spacing.four },
  card: { borderWidth: 1, borderRadius: Radius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three },
  iconTile: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700' },
});
