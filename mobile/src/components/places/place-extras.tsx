import { useState } from "react";
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { usePlaceImages, type PlaceReview } from "../../hooks/use-place-images";
import type { CityPlace } from "../../lib/places-api";
import { colors, fonts, MIN_TOUCH, radius } from "../../lib/theme";

const REVIEW_CUT = 180;
const MAX_REVIEWS = 5;

const formatRating = (value: number) => value.toFixed(1).replace(".", ",");

function Stars({ value }: { value: number }) {
  return (
    <View style={styles.stars} accessibilityLabel={`Оцінка ${value} з 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <MaterialIcons key={star} name={star <= Math.round(value) ? "star" : "star-border"} size={16} color={colors.primary} />
      ))}
    </View>
  );
}

function ReviewCard({ review }: { review: PlaceReview }) {
  const [expanded, setExpanded] = useState(false);
  const long = review.text.length > REVIEW_CUT;
  return (
    <View style={styles.review}>
      <View style={styles.reviewHead}>
        <Text style={styles.author} numberOfLines={1}>{review.author || "Гість"}</Text>
        {review.when ? <Text style={styles.caption}>{review.when}</Text> : null}
      </View>
      {review.rating ? <Stars value={review.rating} /> : null}
      <Text style={styles.reviewText}>
        {long && !expanded ? `${review.text.slice(0, REVIEW_CUT).trimEnd()}…` : review.text}
      </Text>
      {long ? (
        <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded((value) => !value)} style={styles.more}>
          <Text style={styles.moreText}>{expanded ? "Згорнути" : "Читати повністю"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Photos, rating, hours, reviews and menu link from the scraper lookup. Shows only what the source has. */
export function PlaceExtras({ place }: { place: CityPlace }) {
  const result = usePlaceImages(place);

  if (!result) return <Text style={styles.caption}>Шукаємо фото й відгуки…</Text>;
  if (result.status !== "ok") {
    return (
      <Text style={styles.caption}>
        {result.status === "none" ? "Для цього місця немає фото й відгуків у джерелі." : "Фото й відгуки зараз недоступні."}
      </Text>
    );
  }

  const details = result.details;
  const images = result.images.slice(0, 12);
  const reviews = details?.reviews.slice(0, MAX_REVIEWS) ?? [];
  const phone = !place.details["Телефон"] && !place.details["Мобільний"] ? details?.phone : undefined;

  return (
    <View style={styles.wrap}>
      {images.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photos}>
          {images.map((uri) => (
            <Image key={uri} source={{ uri }} accessibilityLabel={`Фото: ${place.name}`} style={styles.photo} />
          ))}
        </ScrollView>
      ) : null}

      {details?.rating ? (
        <View style={styles.ratingRow}>
          <MaterialIcons name="star" size={20} color={colors.primary} />
          <Text style={styles.ratingValue}>{formatRating(details.rating)}</Text>
          {details.reviewCount ? <Text style={styles.caption}>{details.reviewCount} відгуків</Text> : null}
        </View>
      ) : null}

      {phone ? (
        <Pressable accessibilityRole="link" onPress={() => Linking.openURL(`tel:${phone}`)} style={styles.row}>
          <MaterialIcons name="call" size={20} color={colors.primary} />
          <Text style={styles.rowValue}>{phone}</Text>
        </Pressable>
      ) : null}

      {details?.openHours.length ? (
        <View style={styles.section}>
          <Text style={styles.heading}>Графік роботи</Text>
          {details.openHours.map((entry) => (
            <View key={entry.day} style={styles.hourRow}>
              <Text style={styles.hourDay}>{entry.day}</Text>
              <Text style={styles.hourValue}>{entry.hours}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {details?.menuLink ? (
        <Pressable accessibilityRole="link" onPress={() => Linking.openURL(details.menuLink ?? "")} style={styles.row}>
          <MaterialIcons name="restaurant-menu" size={20} color={colors.primary} />
          <Text style={styles.rowValue}>Меню</Text>
          <MaterialIcons name="open-in-new" size={18} color={colors.mutedForeground} />
        </Pressable>
      ) : null}

      {reviews.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.heading}>Відгуки</Text>
          {reviews.map((review, index) => (
            <ReviewCard key={`${review.author}-${index}`} review={review} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.mutedForeground },
  photos: { gap: 8 },
  photo: { width: 200, height: 140, borderRadius: radius.lg, backgroundColor: colors.surfaceMuted },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingValue: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.foreground },
  row: { minHeight: MIN_TOUCH, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowValue: { flex: 1, fontFamily: fonts.semibold, fontSize: 16, color: colors.foreground },
  section: { gap: 8 },
  heading: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.foreground },
  hourRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  hourDay: { fontFamily: fonts.semibold, fontSize: 15, color: colors.foreground },
  hourValue: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.mutedForeground, textAlign: "right" },
  review: { gap: 6, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  reviewHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  author: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 15, color: colors.foreground },
  stars: { flexDirection: "row", gap: 1 },
  reviewText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.foreground },
  more: { alignSelf: "flex-start", minHeight: MIN_TOUCH - 8, justifyContent: "center" },
  moreText: { fontFamily: fonts.bold, fontSize: 14, color: colors.primary },
});
