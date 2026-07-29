import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useFavourites } from '@/context/store';
import { formatNaira, type Vendor } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';

export function VendorCard({ vendor }: { vendor: Vendor }) {
  const theme = useTheme();
  const { isFavourite, toggleFavourite } = useFavourites();
  const fav = isFavourite(vendor.id);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(shop)/vendor/[id]', params: { id: vendor.id } })}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
        pressed && { opacity: 0.9 },
      ]}>
      <View style={[styles.thumb, { backgroundColor: vendor.color }]}>
        {vendor.image ? (
          <Image source={{ uri: vendor.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        ) : (
          <ThemedText style={styles.thumbEmoji}>{vendor.emoji}</ThemedText>
        )}
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            toggleFavourite(vendor.id);
          }}
          hitSlop={8}
          style={styles.heart}>
          <Ionicons
            name={fav ? 'heart' : 'heart-outline'}
            size={16}
            color={fav ? theme.danger : '#10231A'}
          />
        </Pressable>
        {!vendor.isOpen && (
          <View style={styles.closedOverlay}>
            <ThemedText style={styles.closedText}>Closed</ThemedText>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <ThemedText style={styles.name} numberOfLines={1}>
            {vendor.name}
          </ThemedText>
          <View style={[styles.ratingPill, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="star" size={12} color={theme.star} />
            <ThemedText type="smallBold">{vendor.rating.toFixed(1)}</ThemedText>
          </View>
        </View>

        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {vendor.tagline}
        </ThemedText>

        <View style={styles.metaRow}>
          <View style={styles.meta}>
            <Ionicons name="time-outline" size={14} color={theme.textMuted} />
            <ThemedText type="small" themeColor="textMuted">
              {vendor.deliveryMins} min
            </ThemedText>
          </View>
          <View style={styles.meta}>
            <Ionicons name="bicycle-outline" size={14} color={theme.textMuted} />
            <ThemedText type="small" themeColor="textMuted">
              {formatNaira(vendor.deliveryFee)}
            </ThemedText>
          </View>
          <View style={styles.meta}>
            <Ionicons name="star" size={13} color={theme.star} />
            <ThemedText type="small" themeColor="textMuted">
              {vendor.reviewCount}+
            </ThemedText>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.two + 2,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbEmoji: { fontSize: 44, lineHeight: 52 },
  heart: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  body: { flex: 1, justifyContent: 'center', gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  name: { flex: 1, fontSize: 16, fontWeight: '700' },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.two, marginTop: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});
