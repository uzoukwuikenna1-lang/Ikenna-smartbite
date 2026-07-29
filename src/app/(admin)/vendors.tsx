import { Ionicons } from '@expo/vector-icons';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useAdmin } from '@/context/store';
import { type Vendor, type VendorStatus } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';

const STATUS_META: Record<VendorStatus, { label: string; color: (t: ReturnType<typeof useTheme>) => string }> = {
  verified: { label: 'Verified', color: (t) => t.success },
  pending: { label: 'Pending', color: (t) => t.warning },
  suspended: { label: 'Suspended', color: (t) => t.danger },
};

export default function AdminVendors() {
  const theme = useTheme();
  const { vendors, setVendorStatus } = useAdmin();

  return (
    <Screen edges={['top']}>
      <FlatList
        data={vendors}
        keyExtractor={(v) => v.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <ThemedText type="subtitle" style={styles.title}>
            Vendors
          </ThemedText>
        }
        renderItem={({ item }) => (
          <VendorRow
            vendor={item}
            status={item.verification ?? 'pending'}
            onSet={(s) => setVendorStatus(item.id, s)}
          />
        )}
      />
    </Screen>
  );
}

function VendorRow({
  vendor,
  status,
  onSet,
}: {
  vendor: Vendor;
  status: VendorStatus;
  onSet: (s: VendorStatus) => void;
}) {
  const theme = useTheme();
  const meta = STATUS_META[status];
  const statusColor = meta.color(theme);

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.top}>
        <View style={[styles.thumb, { backgroundColor: vendor.color }]}>
          <ThemedText style={{ fontSize: 26 }}>{vendor.emoji}</ThemedText>
        </View>
        <View style={styles.flex}>
          <ThemedText style={styles.name} numberOfLines={1}>
            {vendor.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {vendor.tagline}
          </ThemedText>
          <View style={[styles.statusPill, { backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.dot, { backgroundColor: statusColor }]} />
            <ThemedText type="small" style={{ color: statusColor, fontWeight: '700' }}>
              {meta.label}
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        {status !== 'verified' && (
          <Pressable onPress={() => onSet('verified')} style={[styles.actionBtn, { backgroundColor: theme.primary }]}>
            <Ionicons name="checkmark-circle" size={16} color={theme.onPrimary} />
            <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
              Verify
            </ThemedText>
          </Pressable>
        )}
        {status !== 'suspended' ? (
          <Pressable onPress={() => onSet('suspended')} style={[styles.actionBtn, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="ban" size={16} color={theme.danger} />
            <ThemedText type="smallBold" themeColor="danger">
              Suspend
            </ThemedText>
          </Pressable>
        ) : (
          <Pressable onPress={() => onSet('pending')} style={[styles.actionBtn, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="refresh" size={16} color={theme.textSecondary} />
            <ThemedText type="smallBold" themeColor="textSecondary">
              Reinstate
            </ThemedText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.five, gap: Spacing.three },
  title: { paddingTop: Spacing.two, marginBottom: Spacing.two },
  card: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.three },
  top: { flexDirection: 'row', gap: Spacing.three },
  thumb: { width: 56, height: 56, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '700' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: Spacing.two, paddingVertical: 3, borderRadius: Radius.pill, marginTop: Spacing.one },
  dot: { width: 7, height: 7, borderRadius: 4 },
  actions: { flexDirection: 'row', gap: Spacing.two },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.one, height: 42, borderRadius: Radius.md },
});
