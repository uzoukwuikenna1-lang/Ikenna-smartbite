import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const name = rating >= i ? 'star' : rating >= i - 0.5 ? 'star-half' : 'star-outline';
        return <Ionicons key={i} name={name} size={size} color={theme.star} />;
      })}
    </View>
  );
}
