import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { FoodThumb } from '@/components/food-thumb';
import { Stars } from '@/components/stars';
import { ThemedText } from '@/components/themed-text';
import { QuantityStepper } from '@/components/quantity-stepper';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useCart, useFavourites, useMenu, useVendors } from '@/context/store';
import { formatNaira, type MenuItem } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';

export default function VendorScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getVendor } = useVendors();
  const vendor = getVendor(id);
  const { addToCart, decrement, qtyOf, cartCount, cartSubtotal } = useCart();
  const { isFavourite, toggleFavourite } = useFavourites();
  const { menuForVendor, fetchMenu } = useMenu();

  useEffect(() => {
    if (id) fetchMenu(id);
  }, [id, fetchMenu]);

  const sections = useMemo(() => {
    if (!vendor) return [];
    const items = menuForVendor(vendor.id);
    const byCat = new Map<string, MenuItem[]>();
    for (const it of items) {
      if (!byCat.has(it.category)) byCat.set(it.category, []);
      byCat.get(it.category)!.push(it);
    }
    return Array.from(byCat, ([title, data]) => ({ title, data }));
  }, [vendor, menuForVendor]);

  if (!vendor) {
    return (
      <Screen padded>
        <ThemedText>Vendor not found.</ThemedText>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: vendor.color }]}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={[styles.heroBtn, styles.backBtn]}>
            <Ionicons name="chevron-back" size={24} color="#10231A" />
          </Pressable>
          <Pressable
            onPress={() => toggleFavourite(vendor.id)}
            hitSlop={10}
            style={[styles.heroBtn, styles.favBtn]}>
            <Ionicons
              name={isFavourite(vendor.id) ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavourite(vendor.id) ? theme.danger : '#10231A'}
            />
          </Pressable>
          <ThemedText style={styles.heroEmoji}>{vendor.emoji}</ThemedText>
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <ThemedText type="subtitle" style={styles.flex}>
              {vendor.name}
            </ThemedText>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: vendor.isOpen ? theme.primaryMuted : theme.backgroundElement },
              ]}>
              <View
                style={[styles.dot, { backgroundColor: vendor.isOpen ? theme.success : theme.textMuted }]}
              />
              <ThemedText type="smallBold" style={{ color: vendor.isOpen ? theme.primary : theme.textMuted }}>
                {vendor.isOpen ? 'Open' : 'Closed'}
              </ThemedText>
            </View>
          </View>

          <ThemedText themeColor="textSecondary">{vendor.tagline}</ThemedText>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Stars rating={vendor.rating} />
              <ThemedText type="smallBold">
                {vendor.rating.toFixed(1)} ({vendor.reviewCount})
              </ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Ionicons name="time-outline" size={16} color={theme.textMuted} />
              <ThemedText type="small" themeColor="textSecondary">
                {vendor.deliveryMins} min
              </ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Ionicons name="bicycle-outline" size={16} color={theme.textMuted} />
              <ThemedText type="small" themeColor="textSecondary">
                {formatNaira(vendor.deliveryFee)}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Menu */}
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
            {section.data.map((item) => {
              const qty = qtyOf(item.id);
              const soldOut = item.available === false;
              const canOrder = vendor.isOpen && !soldOut;
              return (
                <View
                  key={item.id}
                  style={[styles.item, { borderColor: theme.border }, soldOut && styles.itemDimmed]}>
                  <FoodThumb
                    image={item.image}
                    emoji={item.emoji}
                    size={68}
                    radius={Radius.md}
                    bg={theme.backgroundElement}
                    emojiSize={34}
                  />
                  <View style={styles.itemBody}>
                    <View style={styles.itemTitleRow}>
                      <ThemedText style={styles.itemName} numberOfLines={1}>
                        {item.name}
                      </ThemedText>
                      {soldOut ? (
                        <View style={[styles.popular, { backgroundColor: theme.backgroundSelected }]}>
                          <ThemedText style={[styles.popularText, { color: theme.textMuted }]}>
                            Sold out
                          </ThemedText>
                        </View>
                      ) : (
                        item.popular && (
                          <View style={[styles.popular, { backgroundColor: theme.accent }]}>
                            <ThemedText style={[styles.popularText, { color: theme.onAccent }]}>
                              Popular
                            </ThemedText>
                          </View>
                        )
                      )}
                    </View>
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                      {item.description}
                    </ThemedText>
                    <View style={styles.itemFooter}>
                      <ThemedText style={styles.price}>{formatNaira(item.price)}</ThemedText>
                      {qty > 0 && canOrder ? (
                        <QuantityStepper
                          qty={qty}
                          size="sm"
                          onAdd={() => addToCart(item)}
                          onRemove={() => decrement(item.id)}
                        />
                      ) : (
                        <Pressable
                          onPress={() => addToCart(item)}
                          disabled={!canOrder}
                          style={[
                            styles.addBtn,
                            { backgroundColor: canOrder ? theme.primary : theme.backgroundElement },
                          ]}>
                          <Ionicons
                            name="add"
                            size={20}
                            color={canOrder ? theme.onPrimary : theme.textMuted}
                          />
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Floating cart bar */}
      {cartCount > 0 && (
        <Pressable
          onPress={() => router.push('/(customer)/cart')}
          style={[styles.cartBar, { backgroundColor: theme.primary }]}>
          <View style={[styles.cartCount, { backgroundColor: theme.onPrimary }]}>
            <ThemedText style={[styles.cartCountText, { color: theme.primary }]}>
              {cartCount}
            </ThemedText>
          </View>
          <ThemedText style={[styles.cartBarText, { color: theme.onPrimary }]}>
            View cart
          </ThemedText>
          <ThemedText style={[styles.cartBarText, { color: theme.onPrimary }]}>
            {formatNaira(cartSubtotal)}
          </ThemedText>
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingBottom: 120 },
  hero: { height: 160, alignItems: 'center', justifyContent: 'center' },
  heroBtn: {
    position: 'absolute',
    top: Spacing.two,
    backgroundColor: 'rgba(255,255,255,0.85)',
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: { left: Spacing.three },
  favBtn: { right: Spacing.three },
  heroEmoji: { fontSize: 76, lineHeight: 88 },
  info: { padding: Spacing.four, gap: Spacing.two },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginTop: Spacing.one },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 16, backgroundColor: 'rgba(128,128,128,0.3)' },
  section: { paddingHorizontal: Spacing.four, marginTop: Spacing.two, gap: Spacing.three },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  item: { flexDirection: 'row', gap: Spacing.three, paddingBottom: Spacing.three, borderBottomWidth: 1 },
  itemDimmed: { opacity: 0.55 },
  itemThumb: {
    width: 68,
    height: 68,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemEmoji: { fontSize: 34, lineHeight: 40 },
  itemBody: { flex: 1, gap: 2 },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  itemName: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
  popular: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm },
  popularText: { fontSize: 10, fontWeight: '800' },
  itemFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  price: { fontSize: 15, fontWeight: '800' },
  addBtn: { width: 34, height: 34, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  cartBar: {
    position: 'absolute',
    left: Spacing.four,
    right: Spacing.four,
    bottom: Spacing.four,
    height: 56,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  cartCount: {
    minWidth: 26,
    height: 26,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  cartCountText: { fontWeight: '800', fontSize: 13 },
  cartBarText: { fontWeight: '800', fontSize: 15 },
});
