/**
 * @file parse-jobs.test.mjs
 * @description Logic tests for the admin «Парсинг» helpers: validation, tile planning,
 * row mapping and approval. The worker and the HTTP routes need Supabase and the engine,
 * so they are not covered here. Run with `npm run test:parse`.
 */
import { placeRowFrom, planTiles, rowToResult, slugCategory, validateJobInput } from "../server/parse-jobs.mjs";

const results = [];
const check = (label, passed) => {
  results.push(`${passed ? "PASS" : "FAIL"} ${label}`);
};

// Lviv city centre, roughly.
const centerLat = 49.8397;
const centerLng = 24.0297;
const job = { id: "job-1", center_lat: centerLat, center_lng: centerLng, radius_m: 2000 };

check("slug keeps latin words in kebab case", slugCategory(" Coffee Shop ") === "coffee-shop");
check("slug drops non-latin text", slugCategory("кафе") === null);
check("slug rejects a single letter", slugCategory("a") === null);

const valid = validateJobInput({ name: "Кав'ярні центр", categories: ["cafe", "Bakery"], centerLat, centerLng, radiusM: 3000 });
check("valid job is accepted", Boolean(valid.value));
check("valid job keeps slugs and photos on by default", valid.value?.categories.join(",") === "cafe,bakery" && valid.value?.include_photos === true);

check("radius above 30 km is refused", Boolean(validateJobInput({ name: "x", categories: ["cafe"], centerLat, centerLng, radiusM: 50000 }).error));
check("job without a latin category is refused", Boolean(validateJobInput({ name: "x", categories: ["кафе"], centerLat, centerLng, radiusM: 1000 }).error));

check("a 30 km job with many categories is refused", Boolean(validateJobInput({
  name: "wide",
  categories: Array.from({ length: 5 }, (_, index) => `cat${String.fromCharCode(97 + index)}`),
  centerLat,
  centerLng,
  radiusM: 30000,
}).error));

const tiles = planTiles({ centerLat, centerLng, radiusM: 1000 });
check("small job plans a few tiles", tiles.length >= 1 && tiles.length < 30);
check("a tile sits on the centre", tiles.some(tile => Math.abs(tile.lat - centerLat) < 1e-9 && Math.abs(tile.lng - centerLng) < 1e-9));
check("every tile has the fixed radius", tiles.every(tile => tile.radiusM === 1500));

const inside = {
  title: "Кав'ярня Ринок",
  latitude: String(centerLat + 0.001),
  longitude: String(centerLng),
  data_id: "0x1:0x2",
  review_rating: "4.6",
  review_count: "120",
  website: "http://example.com",
  phone: "+380 32 000 0000",
  thumbnail: "https://lh3.example/thumb.jpg",
  images: JSON.stringify([{ Image: "https://lh3.example/a.jpg" }, { Image: "http://insecure.example/b.jpg" }]),
};
const mapped = rowToResult(inside, { category: "cafe", job, includePhotos: true });
check("a listing inside the circle becomes a result", Boolean(mapped));
check("the external id comes from data_id", mapped?.external_id === "0x1:0x2");
check("the rating and count are kept", mapped?.rating === 4.6 && mapped?.review_count === 120);
check("http websites are kept on the draft (approval drops them)", mapped?.website === "http://example.com");
check("only https photos are kept", mapped?.photo_urls.join(",") === "https://lh3.example/thumb.jpg,https://lh3.example/a.jpg");
check("photos are dropped when the job says so", rowToResult(inside, { category: "cafe", job, includePhotos: false })?.photo_urls.length === 0);

check("a listing outside the circle is dropped", rowToResult({ ...inside, latitude: String(centerLat + 0.2) }, { category: "cafe", job, includePhotos: true }) === null);
check("a listing without a name is dropped", rowToResult({ ...inside, title: "" }, { category: "cafe", job, includePhotos: true }) === null);
check("a listing without coordinates is dropped", rowToResult({ ...inside, latitude: "" }, { category: "cafe", job, includePhotos: true }) === null);

const place = placeRowFrom({ ...mapped, details: { openHours: [{ day: "Mon", hours: "09:00-18:00" }] } }, "admin-1");
check("approval writes a draft place", place.status === "draft" && place.name_uk === mapped.name && place.created_by === "admin-1");
check("approval never copies photos into the place", !("photo_path" in place));
check("approval drops a non-https website", place.website === null);
check("approval joins opening hours", place.hours === "Mon 09:00-18:00");

const failed = results.filter(line => line.startsWith("FAIL"));
console.log(results.join("\n"));
if (failed.length) {
  console.error(`\n${failed.length} check(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${results.length} checks passed.`);
