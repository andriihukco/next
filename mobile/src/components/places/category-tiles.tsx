import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { materialIconFor } from "../../lib/category-icons";
import { colors, fonts, HIT_SLOP } from "../../lib/theme";

export type CategoryTile = { id: string; label: string; icon: string; color: string };

/** Round category tiles in a horizontal row, shared by Місця and Освіта. */
export function CategoryTiles({ items, value, onChange }: { items: CategoryTile[]; value: string; onChange: (id: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tiles}>
      {items.map((tile) => {
        const active = tile.id === value;
        return (
          <Pressable
            key={tile.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            hitSlop={HIT_SLOP}
            onPress={() => onChange(tile.id)}
            style={styles.tile}
          >
            <View style={[styles.orb, { backgroundColor: tile.color }, active && styles.orbActive]}>
              <MaterialIcons name={materialIconFor(tile.icon)} size={26} color="#ffffff" />
            </View>
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={2}>
              {tile.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tiles: { gap: 12, paddingVertical: 8 },
  tile: { width: 80, alignItems: "center", gap: 6 },
  orb: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  orbActive: { borderWidth: 3, borderColor: colors.card, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 6 },
  label: { fontFamily: fonts.semibold, fontSize: 12, color: colors.foreground, textAlign: "center" },
  labelActive: { fontFamily: fonts.extrabold, color: colors.primary },
});
