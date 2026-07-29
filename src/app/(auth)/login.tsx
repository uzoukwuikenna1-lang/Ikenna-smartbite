import { Ionicons } from '@expo/vector-icons';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { ROLE_META, isRole } from '@/constants/roles';
import { useAuth } from '@/context/store';
import { useTheme } from '@/hooks/use-theme';

export default function Login() {
  const theme = useTheme();
  const { login } = useAuth();
  const params = useLocalSearchParams<{ role?: string }>();
  const role = isRole(params.role) ? params.role : 'customer';
  const meta = ROLE_META[role];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 3 && password.length >= 4;

  async function onLogin() {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      const u = await login(email.trim(), password);
      router.replace(ROLE_META[u.role].home);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
      setLoading(false);
    }
  }

  return (
    <Screen padded>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
            <Ionicons name="chevron-back" size={26} color={theme.text} />
          </Pressable>

          <View style={[styles.roleChip, { backgroundColor: theme.primaryMuted }]}>
            <ThemedText style={styles.roleEmoji}>{meta.emoji}</ThemedText>
            <ThemedText type="smallBold" themeColor="primary">
              {meta.label} login
            </ThemedText>
          </View>

          <ThemedText type="subtitle">Welcome back 👋</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.sub}>
            Sign in to continue to your SmartBite {meta.label.toLowerCase()} account.
          </ThemedText>

          <View style={styles.form}>
            <TextField
              label="Email"
              icon="mail-outline"
              placeholder="you@futo.edu.ng"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextField
              label="Password"
              icon="lock-closed-outline"
              placeholder="Your password"
              password
              value={password}
              onChangeText={setPassword}
            />
            <Link href={{ pathname: '/(auth)/forgot-password', params: { role } }} asChild>
              <Pressable style={styles.forgot} hitSlop={8}>
                <ThemedText type="smallBold" themeColor="primary">
                  Forgot password?
                </ThemedText>
              </Pressable>
            </Link>

            {error && (
              <ThemedText type="small" themeColor="danger" style={styles.error}>
                {error}
              </ThemedText>
            )}
            <Button label="Log in" onPress={onLogin} loading={loading} disabled={!canSubmit} />
          </View>

          <View style={styles.footer}>
            <ThemedText themeColor="textSecondary">Don&apos;t have an account? </ThemedText>
            <Link href={{ pathname: '/(auth)/register', params: { role } }} replace asChild>
              <Pressable hitSlop={8}>
                <ThemedText type="smallBold" themeColor="primary" style={styles.footerLink}>
                  Create one
                </ThemedText>
              </Pressable>
            </Link>
          </View>

          <View style={[styles.hint, { borderColor: theme.border }]}>
            <Ionicons name="information-circle-outline" size={16} color={theme.textMuted} />
            <ThemedText type="small" themeColor="textMuted" style={styles.flex}>
              Demo accounts (password: demo123): chidera@ (customer), mama@ (vendor), emeka@ (rider), admin@futo.edu.ng
            </ThemedText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingBottom: Spacing.five, gap: Spacing.two },
  back: { marginTop: Spacing.two, marginBottom: Spacing.two, alignSelf: 'flex-start' },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.pill,
    marginBottom: Spacing.two,
  },
  roleEmoji: { fontSize: 16 },
  sub: { marginTop: Spacing.one, marginBottom: Spacing.three },
  form: { gap: Spacing.three },
  error: { marginTop: -Spacing.one },
  forgot: { alignSelf: 'flex-end' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  footerLink: {},
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    marginTop: Spacing.four,
  },
});
