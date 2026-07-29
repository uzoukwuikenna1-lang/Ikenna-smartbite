import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { SettingsScreen } from '@/components/settings-screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/store';
import { useTheme } from '@/hooks/use-theme';

export default function EditProfile() {
  const theme = useTheme();
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saved, setSaved] = useState(false);

  const dirty = name !== (user?.name ?? '') || email !== (user?.email ?? '') || phone !== (user?.phone ?? '');
  const canSave = name.trim().length > 1 && email.trim().length > 3 && dirty;

  function onSave() {
    updateProfile({ name: name.trim(), email: email.trim(), phone: phone.trim() });
    setSaved(true);
    setTimeout(() => router.back(), 650);
  }

  const initial = (name || 'S').charAt(0).toUpperCase();

  return (
    <SettingsScreen title="Edit profile">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarWrap}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <ThemedText style={[styles.avatarText, { color: theme.onPrimary }]}>{initial}</ThemedText>
            </View>
          </View>

          <View style={styles.form}>
            <TextField label="Full name" icon="person-outline" value={name} onChangeText={setName} />
            <TextField
              label="Email"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextField
              label="Phone number"
              icon="call-outline"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="e.g. 0803 123 4567"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button label={saved ? 'Saved ✓' : 'Save changes'} onPress={onSave} disabled={!canSave} />
        </View>
      </KeyboardAvoidingView>
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: Spacing.four, gap: Spacing.four },
  avatarWrap: { alignItems: 'center', marginTop: Spacing.two },
  avatar: { width: 88, height: 88, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 38, fontWeight: '800' },
  form: { gap: Spacing.three },
  footer: { padding: Spacing.four },
});
