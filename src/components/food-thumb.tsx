import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

/** A food/vendor thumbnail: shows the uploaded photo, or an emoji tile as fallback. */
export function FoodThumb({
  image,
  emoji,
  size = 60,
  radius = 12,
  bg,
  emojiSize = 28,
}: {
  image?: string;
  emoji: string;
  size?: number;
  radius?: number;
  bg?: string;
  emojiSize?: number;
}) {
  if (image) {
    return (
      <Image
        source={{ uri: image }}
        style={{ width: size, height: size, borderRadius: radius }}
        contentFit="cover"
        transition={150}
      />
    );
  }
  return (
    <View
      style={[styles.fallback, { width: size, height: size, borderRadius: radius, backgroundColor: bg }]}>
      <ThemedText style={{ fontSize: emojiSize, lineHeight: emojiSize * 1.15 }}>{emoji}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
