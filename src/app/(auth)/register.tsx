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

export default function Register() {
  const theme = useTheme();
  const { register } = useAuth();
  const params = useLocalSearchParams<{ role?: string }>();
  const role = isRole(params.role) ? params.role : 'customer';
  const meta = ROLE_META[role];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length > 1 && email.trim().length > 3 && password.length >= 4;

  async function onRegister() {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      const u = await register(role, name.trim(), email.trim(), password);
      router.replace(ROLE_META[u.role].home);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign up failed');
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
              {meta.label} sign up
            </ThemedText>
          </View>

          <ThemedText type="subtitle">Create your account</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.sub}>
            Join SmartBite FUTO in a few seconds.
          </ThemedText>

          <View style={styles.form}>
            <TextField
              label="Full name"
              icon="person-outline"
              placeholder="e.g. Chidera Okeke"
              value={name}
              onChangeText={setName}
            />
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
              placeholder="Create a password"
              password
              value={password}
              onChangeText={setPassword}
            />
            {error && (
              <ThemedText type="small" themeColor="danger">
                {error}
              </ThemedText>
            )}
            <Button label="Create account" onPress={onRegister} loading={loading} disabled={!canSubmit} />
          </View>

          <View style={styles.footer}>
            <ThemedText themeColor="textSecondary">Already have an account? </ThemedText>
            <Link href={{ pathname: '/(auth)/login', params: { role } }} replace asChild>
              <Pressable hitSlop={8}>
                <ThemedText type="smallBold" themeColor="primary">
                  Log in
                </ThemedText>
              </Pressable>
            </Link>
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.four,
  },
});
