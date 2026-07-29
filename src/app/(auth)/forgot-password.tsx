import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { isRole } from '@/constants/roles';
import { useTheme } from '@/hooks/use-theme';

export default function ForgotPassword() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ role?: string }>();
  const role = isRole(params.role) ? params.role : 'customer';

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <Screen padded>
      <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
        <Ionicons name="chevron-back" size={26} color={theme.text} />
      </Pressable>

      {sent ? (
        <View style={styles.center}>
          <View style={[styles.iconTile, { backgroundColor: theme.primaryMuted }]}>
            <Ionicons name="mail-open-outline" size={40} color={theme.primary} />
          </View>
          <ThemedText type="subtitle" style={styles.centerText}>
            Check your inbox
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.centerText}>
            If {email || 'your email'} is registered, we&apos;ve sent a reset link.
          </ThemedText>
          <Button
            label="Back to login"
            onPress={() => router.replace({ pathname: '/(auth)/login', params: { role } })}
            style={styles.cta}
          />
        </View>
      ) : (
        <View style={styles.form}>
          <ThemedText type="subtitle">Reset password</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.sub}>
            Enter your email and we&apos;ll send you a link to reset your password.
          </ThemedText>
          <TextField
            label="Email"
            icon="mail-outline"
            placeholder="you@futo.edu.ng"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Button
            label="Send reset link"
            onPress={() => setSent(true)}
            disabled={email.trim().length < 4}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { marginTop: Spacing.two, marginBottom: Spacing.four, alignSelf: 'flex-start' },
  form: { gap: Spacing.three },
  sub: { marginTop: Spacing.one, marginBottom: Spacing.two },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, marginTop: -Spacing.six },
  centerText: { textAlign: 'center' },
  iconTile: {
    width: 88,
    height: 88,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  cta: { marginTop: Spacing.three, alignSelf: 'stretch' },
});
