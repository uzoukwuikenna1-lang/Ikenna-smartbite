import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useAdmin, useAuth } from '@/context/store';
import { useTheme } from '@/hooks/use-theme';

export default function AdminProfile() {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { stats } = useAdmin();

  async function onLogout() {
    await logout();
    router.replace('/role-select');
  }

  const initial = (user?.name ?? 'A').charAt(0).toUpperCase();

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ThemedText type="subtitle" style={styles.title}>
          Profile
        </ThemedText>

        <View style={[styles.card, styles.userCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <ThemedText style={[styles.avatarText, { color: theme.onPrimary }]}>{initial}</ThemedText>
          </View>
          <ThemedText style={styles.name}>{user?.name ?? 'Administrator'}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {user?.email ?? 'admin@futo.edu.ng'}
          </ThemedText>
          <View style={[styles.roleBadge, { backgroundColor: theme.primaryMuted }]}>
            <Ionicons name="shield-checkmark" size={14} color={theme.primary} />
            <ThemedText type="small" themeColor="primary" style={styles.roleText}>
              Platform Administrator
            </ThemedText>
          </View>
        </View>

        <View style={[styles.card, styles.metaCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Meta label="Vendors" value={String(stats?.vendors ?? 0)} />
          <Meta label="Users" value={String(stats?.users ?? 0)} />
          <Meta label="Orders" value={String(stats?.totalOrders ?? 0)} />
        </View>

        <Button label="Log out" variant="danger" onPress={onLogout} style={styles.logout} />
        <ThemedText type="small" themeColor="textMuted" style={styles.version}>
          SmartBite FUTO · Admin console v1.0 (demo)
        </ThemedText>
      </ScrollView>
    </Screen>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.meta}>
      <ThemedText style={styles.metaValue}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.five },
  title: { marginBottom: Spacing.one },
  card: { borderWidth: 1, borderRadius: Radius.lg },
  userCard: { alignItems: 'center', padding: Spacing.four, gap: Spacing.one },
  avatar: { width: 80, height: 80, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.two },
  avatarText: { fontSize: 34, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '800' },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one + 2, borderRadius: Radius.pill, marginTop: Spacing.two },
  roleText: { fontWeight: '800' },
  metaCard: { flexDirection: 'row', padding: Spacing.four, justifyContent: 'space-around' },
  meta: { alignItems: 'center', gap: 2 },
  metaValue: { fontSize: 20, fontWeight: '800' },
  logout: { marginTop: Spacing.two },
  version: { textAlign: 'center' },
});
