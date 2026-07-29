import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/store';
import { useTheme } from '@/hooks/use-theme';

type Item = { icon: keyof typeof Ionicons.glyphMap; label: string; route?: string };

const SECTIONS: { title: string; items: Item[] }[] = [
  {
    title: 'Account',
    items: [
      { icon: 'person-outline', label: 'Edit profile', route: '/settings/edit-profile' },
      { icon: 'location-outline', label: 'Saved addresses', route: '/settings/addresses' },
      { icon: 'card-outline', label: 'Payment methods', route: '/settings/payment-methods' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: 'notifications-outline', label: 'Notifications', route: '/settings/notifications' },
      { icon: 'heart-outline', label: 'Favourite vendors', route: '/settings/favourites' },
      { icon: 'help-circle-outline', label: 'Help & support' },
    ],
  },
];

export default function Profile() {
  const theme = useTheme();
  const { user, logout } = useAuth();

  function onLogout() {
    logout();
    router.replace('/role-select');
  }

  const initial = (user?.name ?? 'S').charAt(0).toUpperCase();

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ThemedText type="subtitle" style={styles.pageTitle}>
          Profile
        </ThemedText>

        <View style={[styles.card, styles.userCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <ThemedText style={[styles.avatarText, { color: theme.onPrimary }]}>{initial}</ThemedText>
          </View>
          <View style={styles.flex}>
            <ThemedText style={styles.name}>{user?.name ?? 'Student'}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {user?.email ?? 'student@futo.edu.ng'}
            </ThemedText>
          </View>
        </View>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
              {section.title.toUpperCase()}
            </ThemedText>
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {section.items.map((item, idx) => (
                <Pressable
                  key={item.label}
                  onPress={() => item.route && router.push(item.route as never)}
                  style={[
                    styles.rowItem,
                    idx < section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                  ]}>
                  <View style={[styles.rowIcon, { backgroundColor: theme.backgroundElement }]}>
                    <Ionicons name={item.icon} size={20} color={theme.text} />
                  </View>
                  <ThemedText style={styles.flex}>{item.label}</ThemedText>
                  <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <Button label="Log out" variant="danger" onPress={onLogout} style={styles.logout} />
        <ThemedText type="small" themeColor="textMuted" style={styles.version}>
          SmartBite FUTO • v1.0 (demo)
        </ThemedText>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: Spacing.four, gap: Spacing.four, paddingBottom: Spacing.five },
  pageTitle: { paddingTop: Spacing.two },
  card: { borderWidth: 1, borderRadius: Radius.lg, overflow: 'hidden' },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three },
  avatar: { width: 56, height: 56, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '800' },
  name: { fontSize: 17, fontWeight: '800' },
  section: { gap: Spacing.two },
  sectionTitle: { marginLeft: Spacing.one, letterSpacing: 0.5 },
  rowItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three },
  rowIcon: { width: 38, height: 38, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  logout: { marginTop: Spacing.two },
  version: { textAlign: 'center' },
});
