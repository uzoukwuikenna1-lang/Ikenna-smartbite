import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { uploadImage } from '@/api/client';
import { SettingsScreen } from '@/components/settings-screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth, useMenu } from '@/context/store';
import { useTheme } from '@/hooks/use-theme';

const EMOJI_CHOICES = ['🍛', '🍚', '🍗', '🍲', '🍔', '🌯', '🍟', '🍢', '🍖', '🥗', '🧋', '🥤', '🍡', '🥟', '🫓'];

export default function EditMenuItem() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { menuForVendor, addMenuItem, updateMenuItem } = useMenu();

  const isNew = id === 'new';
  const existing = isNew ? undefined : menuForVendor(user?.vendorId ?? '').find((m) => m.id === id);

  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [price, setPrice] = useState(existing ? String(existing.price) : '');
  const [category, setCategory] = useState(existing?.category ?? '');
  const [emoji, setEmoji] = useState(existing?.emoji ?? '🍽️');
  const [image, setImage] = useState(existing?.image ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceNum = Number(price.replace(/[^\d]/g, ''));
  const canSave = name.trim().length > 1 && priceNum > 0 && category.trim().length > 0;

  async function pickPhoto() {
    setError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Photo permission is needed to add a picture.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });
    if (res.canceled || !res.assets?.[0]?.base64) return;
    const asset = res.assets[0];
    const dataUrl = `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`;
    setUploading(true);
    try {
      const url = await uploadImage(dataUrl);
      setImage(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function onSave() {
    if (!canSave) return;
    setError(null);
    setSaving(true);
    const payload = {
      name: name.trim(),
      description: description.trim(),
      price: priceNum,
      category: category.trim(),
      emoji,
      image,
    };
    try {
      if (isNew) await addMenuItem(payload);
      else if (existing) await updateMenuItem(existing.id, payload);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save item');
      setSaving(false);
    }
  }

  return (
    <SettingsScreen title={isNew ? 'Add menu item' : 'Edit item'}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Photo */}
          <ThemedText type="smallBold" themeColor="textSecondary">
            PHOTO
          </ThemedText>
          <Pressable
            onPress={pickPhoto}
            style={[styles.photo, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            {image ? (
              <Image source={{ uri: image }} style={styles.photoImg} contentFit="cover" />
            ) : (
              <View style={styles.photoPlaceholder}>
                <ThemedText style={styles.photoEmoji}>{emoji}</ThemedText>
              </View>
            )}
            <View style={[styles.photoBadge, { backgroundColor: theme.primary }]}>
              {uploading ? (
                <ActivityIndicator size="small" color={theme.onPrimary} />
              ) : (
                <Ionicons name="camera" size={18} color={theme.onPrimary} />
              )}
            </View>
          </Pressable>
          <ThemedText type="small" themeColor="textMuted" style={styles.photoHint}>
            {image ? 'Tap to change the photo' : 'Tap to add a food photo (optional — an emoji is used otherwise)'}
          </ThemedText>

          {/* Emoji fallback */}
          <ThemedText type="smallBold" themeColor="textSecondary">
            EMOJI (fallback)
          </ThemedText>
          <View style={styles.emojiRow}>
            {EMOJI_CHOICES.map((e) => {
              const active = e === emoji;
              return (
                <ThemedText
                  key={e}
                  onPress={() => setEmoji(e)}
                  style={[
                    styles.emoji,
                    {
                      backgroundColor: active ? theme.primaryMuted : theme.backgroundElement,
                      borderColor: active ? theme.primary : 'transparent',
                    },
                  ]}>
                  {e}
                </ThemedText>
              );
            })}
          </View>

          <TextField label="Name" placeholder="e.g. Jollof Rice & Chicken" value={name} onChangeText={setName} />
          <TextField label="Description" placeholder="Short description" value={description} onChangeText={setDescription} />
          <TextField label="Price (₦)" placeholder="1800" keyboardType="number-pad" value={price} onChangeText={setPrice} />
          <TextField label="Category" placeholder="e.g. Rice, Soup, Drinks" value={category} onChangeText={setCategory} />

          {error && (
            <ThemedText type="small" themeColor="danger">
              {error}
            </ThemedText>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label={isNew ? 'Add to menu' : 'Save changes'}
            onPress={onSave}
            loading={saving}
            disabled={!canSave || uploading}
          />
        </View>
      </KeyboardAvoidingView>
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: Spacing.four, gap: Spacing.three },
  photo: {
    height: 170,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoImg: { width: '100%', height: '100%' },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  photoEmoji: { fontSize: 64, lineHeight: 72 },
  photoBadge: {
    position: 'absolute',
    right: Spacing.three,
    bottom: Spacing.three,
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHint: { marginTop: -Spacing.two },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  emoji: {
    fontSize: 26,
    width: 48,
    height: 48,
    lineHeight: 46,
    textAlign: 'center',
    borderRadius: Radius.md,
    borderWidth: 2,
    overflow: 'hidden',
  },
  footer: { padding: Spacing.four },
});
