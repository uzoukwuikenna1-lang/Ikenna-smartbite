import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import type { Role } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';

type RoleCard = {
  role: Role;
  title: string;
  subtitle: string;
  emoji: string;
  tint: string;
};

const ROLES: RoleCard[] = [
  { role: 'customer', title: 'I want to order food', subtitle: 'Browse vendors and order', emoji: '🍽️', tint: '#DCF3E4' },
  { role: 'vendor', title: "I'm a food vendor", subtitle: 'Manage menu and orders', emoji: '🧑‍🍳', tint: '#FEF3C7' },
  { role: 'rider', title: "I'm a delivery rider", subtitle: 'Pick up and deliver orders', emoji: '🛵', tint: '#DBEAFE' },
  { role: 'admin', title: "I'm an administrator", subtitle: 'Manage the platform', emoji: '🛠️', tint: '#E9D5FF' },
];

export default function RoleSelect() {
  const theme = useTheme();

  return (
    <Screen padded>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: theme.primary }]}>
          <ThemedText style={styles.badgeEmoji}>🍔</ThemedText>
        </View>
        <ThemedText type="subtitle" style={styles.title}>
          Welcome to SmartBite
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          How do you want to use the app today?
        </ThemedText>
      </View>

      <View style={styles.cards}>
        {ROLES.map((r) => (
          <Pressable
            key={r.role}
            onPress={() => router.push({ pathname: '/(auth)/login', params: { role: r.role } })}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.border },
              pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
            ]}>
            <View style={[styles.iconTile, { backgroundColor: r.tint }]}>
              <ThemedText style={styles.cardEmoji}>{r.emoji}</ThemedText>
            </View>
            <View style={styles.cardText}>
              <ThemedText style={styles.cardTitle}>{r.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {r.subtitle}
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={22} color={theme.textMuted} />
          </Pressable>
        ))}
      </View>

      <ThemedText type="small" themeColor="textMuted" style={styles.footer}>
        A Federal University of Technology, Owerri project
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginTop: Spacing.six,
    marginBottom: Spacing.five,
    gap: Spacing.two,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  badgeEmoji: { fontSize: 34, lineHeight: 40 },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center' },
  cards: { gap: Spacing.three },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  iconTile: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: { fontSize: 30, lineHeight: 36 },
  cardText: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  footer: { textAlign: 'center', marginTop: 'auto', paddingVertical: Spacing.four },
});
