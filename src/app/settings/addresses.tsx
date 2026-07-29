import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { SettingsScreen } from '@/components/settings-screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { useAddresses } from '@/context/store';
import { useTheme } from '@/hooks/use-theme';

export default function Addresses() {
  const theme = useTheme();
  const { addresses, addAddress, removeAddress, setDefaultAddress } = useAddresses();

  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [details, setDetails] = useState('');

  const canAdd = details.trim().length > 3;

  function onAdd() {
    addAddress(label, details);
    setLabel('');
    setDetails('');
    setAdding(false);
  }

  return (
    <SettingsScreen title="Saved addresses">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {addresses.map((a) => (
            <View key={a.id} style={[styles.card, { backgroundColor: theme.card, borderColor: a.isDefault ? theme.primary : theme.border }]}>
              <View style={[styles.iconTile, { backgroundColor: theme.backgroundElement }]}>
                <Ionicons
                  name={a.label.toLowerCase().includes('hostel') ? 'bed-outline' : 'business-outline'}
                  size={20}
                  color={theme.primary}
                />
              </View>
              <View style={styles.flex}>
                <View style={styles.labelRow}>
                  <ThemedText style={styles.label}>{a.label}</ThemedText>
                  {a.isDefault && (
                    <View style={[styles.defaultBadge, { backgroundColor: theme.primaryMuted }]}>
                      <ThemedText type="small" style={{ color: theme.primary, fontWeight: '800' }}>
                        Default
                      </ThemedText>
                    </View>
                  )}
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  {a.details}
                </ThemedText>
                <View style={styles.actions}>
                  {!a.isDefault && (
                    <Pressable onPress={() => setDefaultAddress(a.id)} hitSlop={6}>
                      <ThemedText type="smallBold" themeColor="primary">
                        Set as default
                      </ThemedText>
                    </Pressable>
                  )}
                  <Pressable onPress={() => removeAddress(a.id)} hitSlop={6}>
                    <ThemedText type="smallBold" themeColor="danger">
                      Delete
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}

          {adding ? (
            <View style={[styles.addForm, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <ThemedText style={styles.addTitle}>New address</ThemedText>
              <TextField label="Label" placeholder="e.g. Hostel, Class, Office" value={label} onChangeText={setLabel} />
              <TextField
                label="Address details"
                placeholder="e.g. Hostel C, Room 10, FUTO"
                value={details}
                onChangeText={setDetails}
              />
              <View style={styles.addBtns}>
                <Button label="Cancel" variant="secondary" onPress={() => setAdding(false)} style={styles.flex} />
                <Button label="Add" onPress={onAdd} disabled={!canAdd} style={styles.flex} />
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => setAdding(true)}
              style={[styles.addRow, { borderColor: theme.primary }]}>
              <Ionicons name="add-circle-outline" size={22} color={theme.primary} />
              <ThemedText type="smallBold" themeColor="primary">
                Add new address
              </ThemedText>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: Spacing.four, gap: Spacing.three },
  card: { flexDirection: 'row', gap: Spacing.three, padding: Spacing.three, borderWidth: 1.5, borderRadius: Radius.lg },
  iconTile: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  label: { fontSize: 15, fontWeight: '800' },
  defaultBadge: { paddingHorizontal: Spacing.two, paddingVertical: 2, borderRadius: Radius.pill },
  actions: { flexDirection: 'row', gap: Spacing.four, marginTop: Spacing.two },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 54,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
  },
  addForm: { padding: Spacing.three, borderWidth: 1, borderRadius: Radius.lg, gap: Spacing.three },
  addTitle: { fontSize: 16, fontWeight: '800' },
  addBtns: { flexDirection: 'row', gap: Spacing.three },
});
