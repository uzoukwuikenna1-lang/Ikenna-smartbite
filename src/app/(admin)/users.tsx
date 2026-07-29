import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useAdmin } from '@/context/store';
import type { AppUser } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';

type RoleFilter = 'all' | 'customer' | 'rider' | 'vendor';

const ROLE_EMOJI: Record<AppUser['role'], string> = { customer: '🍽️', rider: '🛵', vendor: '🧑‍🍳' };

export default function AdminUsers() {
  const theme = useTheme();
  const { users, toggleUserStatus } = useAdmin();
  const [filter, setFilter] = useState<RoleFilter>('all');

  const list = useMemo(
    () => (filter === 'all' ? users : users.filter((u) => u.role === filter)),
    [users, filter],
  );

  return (
    <Screen edges={['top']}>
      <ThemedText type="subtitle" style={styles.title}>
        Users
      </ThemedText>

      <View style={styles.segment}>
        {(['all', 'customer', 'rider', 'vendor'] as RoleFilter[]).map((f) => {
          const active = f === filter;
          const label = f === 'all' ? 'All' : f === 'customer' ? 'Customers' : f === 'rider' ? 'Riders' : 'Vendors';
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.segBtn, { backgroundColor: active ? theme.primary : theme.card, borderColor: active ? theme.primary : theme.border }]}>
              <ThemedText type="small" style={{ color: active ? theme.onPrimary : theme.textSecondary, fontWeight: '700' }}>
                {label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={list}
        keyExtractor={(u) => u.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <UserRow user={item} onToggle={() => toggleUserStatus(item.id)} />}
      />
    </Screen>
  );
}

function UserRow({ user, onToggle }: { user: AppUser; onToggle: () => void }) {
  const theme = useTheme();
  const suspended = user.status === 'suspended';

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, suspended && styles.dimmed]}>
      <View style={[styles.avatar, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText style={{ fontSize: 22 }}>{ROLE_EMOJI[user.role]}</ThemedText>
      </View>
      <View style={styles.flex}>
        <View style={styles.nameRow}>
          <ThemedText style={styles.name} numberOfLines={1}>
            {user.name}
          </ThemedText>
          {suspended && (
            <View style={[styles.badge, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="small" themeColor="danger" style={styles.badgeText}>
                Suspended
              </ThemedText>
            </View>
          )}
        </View>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {user.email}
        </ThemedText>
        <ThemedText type="small" themeColor="textMuted">
          {user.role} · joined {user.joinedAt}
        </ThemedText>
      </View>
      <Pressable
        onPress={onToggle}
        style={[styles.action, { backgroundColor: suspended ? theme.primaryMuted : theme.backgroundElement }]}>
        <Ionicons
          name={suspended ? 'checkmark-circle-outline' : 'ban-outline'}
          size={20}
          color={suspended ? theme.primary : theme.danger}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two, marginBottom: Spacing.three },
  segment: { flexDirection: 'row', gap: Spacing.two, paddingHorizontal: Spacing.four, marginBottom: Spacing.three },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two, borderRadius: Radius.pill, borderWidth: 1 },
  list: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.five, gap: Spacing.three },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three, borderWidth: 1, borderRadius: Radius.lg },
  dimmed: { opacity: 0.6 },
  avatar: { width: 48, height: 48, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  name: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
  badge: { paddingHorizontal: Spacing.two, paddingVertical: 1, borderRadius: Radius.sm },
  badgeText: { fontWeight: '800' },
  action: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
});
