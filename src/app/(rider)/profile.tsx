import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth, useOrders } from '@/context/store';
import { formatNaira } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';

export default function RiderProfile() {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { orders } = useOrders();
  const [online, setOnline] = useState(true);

  const completed = orders.filter((o) => o.riderAccepted && o.status === 'delivered');
  const earnings = completed.reduce((sum, o) => sum + o.deliveryFee, 0);

  function onLogout() {
    logout();
    router.replace('/role-select');
  }

  const initial = (user?.name ?? 'R').charAt(0).toUpperCase();

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ThemedText type="subtitle" style={styles.title}>
          Profile
        </ThemedText>

        <View style={[styles.card, styles.riderCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <ThemedText style={[styles.avatarText, { color: theme.onPrimary }]}>{initial}</ThemedText>
          </View>
          <ThemedText style={styles.name}>{user?.name ?? 'Rider'}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {user?.email ?? 'rider@futo.edu.ng'}
          </ThemedText>
          <View style={[styles.bikePill, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="bicycle" size={14} color={theme.primary} />
            <ThemedText type="small" themeColor="textSecondary">
              {[user?.rider?.vehicle, user?.rider?.plate].filter(Boolean).join(' · ') || 'Vehicle not set'}
            </ThemedText>
          </View>
        </View>

        {/* Mock KYC — shows the rider is a verified, identifiable person */}
        <View style={[styles.card, styles.kycCard, { backgroundColor: theme.card, borderColor: user?.rider?.verified ? theme.primary : theme.border }]}>
          <View style={[styles.kycIcon, { backgroundColor: theme.primaryMuted }]}>
            <Ionicons name="shield-checkmark" size={22} color={theme.primary} />
          </View>
          <View style={styles.flex}>
            <View style={styles.kycTitleRow}>
              <ThemedText style={styles.kycTitle}>Identity verification</ThemedText>
              {user?.rider?.verified ? (
                <View style={[styles.kycBadge, { backgroundColor: theme.primaryMuted }]}>
                  <ThemedText type="small" style={{ color: theme.primary, fontWeight: '800' }}>
                    VERIFIED
                  </ThemedText>
                </View>
              ) : (
                <View style={[styles.kycBadge, { backgroundColor: theme.backgroundElement }]}>
                  <ThemedText type="small" themeColor="textMuted" style={{ fontWeight: '800' }}>
                    PENDING
                  </ThemedText>
                </View>
              )}
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {user?.rider?.idType
                ? `${user.rider.idType} ••••${user.rider.idLast4}`
                : 'No ID on file'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              ⭐ {(user?.rider?.rating ?? 5).toFixed(1)} rating · {user?.rider?.trips ?? 0} trips
            </ThemedText>
          </View>
        </View>

        <View style={styles.statRow}>
          <View style={[styles.stat, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ThemedText style={styles.statValue}>{completed.length}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Deliveries
            </ThemedText>
          </View>
          <View style={[styles.stat, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ThemedText style={styles.statValue}>{formatNaira(earnings)}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Earnings
            </ThemedText>
          </View>
        </View>

        <View style={[styles.onlineCard, { backgroundColor: theme.card, borderColor: online ? theme.primary : theme.border }]}>
          <View style={[styles.onlineIcon, { backgroundColor: online ? theme.primaryMuted : theme.backgroundElement }]}>
            <Ionicons name="flash" size={22} color={online ? theme.primary : theme.textMuted} />
          </View>
          <View style={styles.flex}>
            <ThemedText style={styles.onlineTitle}>{online ? 'Online' : 'Offline'}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {online ? 'You can receive delivery requests' : "You won't get new requests"}
            </ThemedText>
          </View>
          <Switch
            value={online}
            onValueChange={setOnline}
            trackColor={{ false: theme.backgroundSelected, true: theme.primary }}
            thumbColor="#ffffff"
          />
        </View>

        <Button label="Log out" variant="danger" onPress={onLogout} style={styles.logout} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.five },
  title: { marginBottom: Spacing.one },
  card: { borderWidth: 1, borderRadius: Radius.lg },
  riderCard: { alignItems: 'center', padding: Spacing.four, gap: Spacing.one },
  avatar: { width: 80, height: 80, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.two },
  avatarText: { fontSize: 34, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '800' },
  bikePill: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one + 2, borderRadius: Radius.pill, marginTop: Spacing.two },
  kycCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, borderWidth: 1.5, padding: Spacing.three },
  kycIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  kycTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  kycTitle: { fontSize: 15, fontWeight: '800' },
  kycBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.pill },
  statRow: { flexDirection: 'row', gap: Spacing.three },
  stat: { flex: 1, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.four, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 22, fontWeight: '800' },
  onlineCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, borderWidth: 1.5, borderRadius: Radius.lg, padding: Spacing.three },
  onlineIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  onlineTitle: { fontSize: 15, fontWeight: '800' },
  logout: { marginTop: Spacing.two },
});
