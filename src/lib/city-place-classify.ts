import type { CityPlaceCategory } from "./city-place-categories";

/** Maps an OpenMapTiles POI (class and subclass) to an app category. */

export const asText = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

export function classify(properties: Record<string, unknown>): CityPlaceCategory {
  const category = asText(properties.class).toLocaleLowerCase("en");
  const subtype = asText(properties.subclass).toLocaleLowerCase("en");
  const value = `${category} ${subtype}`;

  // New specific categories - check these first for better classification
  if (/marketplace|flea_market|market.*stall|baraholka/.test(value)) {
    return "market";
  }
  if (/parking|parking_space|parking_entrance/.test(value)) {
    return "parking";
  }
  if (/fuel|gas_station|petrol_station|filling_station/.test(value)) {
    return "fuel";
  }
  if (/charging_station|ev_charging|electric_vehicle_charging/.test(value)) {
    return "charging-station";
  }
  if (/recycling|recycling_container|waste_disposal/.test(value)) {
    return "recycling";
  }
  if (/pharmacy|chemist|drugstore/.test(value)) {
    return "pharmacy";
  }
  if (/atm|cash_dispenser|cash_machine/.test(value)) {
    return "atm";
  }
  if (/post_office|post_office_branch/.test(value)) {
    return "post-office";
  }
  if (/library/.test(value)) {
    return "library";
  }
  if (/car_wash|automatic_car_wash|pressure_wash/.test(value)) {
    return "car-wash";
  }
  if (/car_repair|vehicle_repair|mechanic|garage/.test(value)) {
    return "car-repair";
  }
  if (/tire_repair|tyre_repair|tire_shop|tyre_shop/.test(value)) {
    return "tire-service";
  }
  if (/construction|construction_site|builder/.test(value)) {
    return "construction";
  }
  if (/doityourself|hardware|diy|hardware_store|building_materials/.test(value)) {
    return "hardware";
  }
  if (/florist|flower|flower_shop/.test(value)) {
    return "flowers";
  }
  if (/veterinary|veterinarian|vet/.test(value)) {
    return "veterinary";
  }
  if (/pet_shop|pet_store|animal_feed/.test(value)) {
    return "pet-shop";
  }
  if (/laundry|laundrette|self_service_laundry/.test(value)) {
    return "laundry";
  }
  if (/dry_cleaning|dry_cleaners/.test(value)) {
    return "dry-cleaning";
  }
  if (/optician|opticians|glasses/.test(value)) {
    return "optician";
  }
  if (/dentist|dental|dental_clinic|dental_hygienist/.test(value)) {
    return "dentist";
  }
  if (/fitness|fitness_centre|gym|personal_training/.test(value)) {
    return "fitness";
  }
  if (/yoga|yoga_studio|pilates/.test(value)) {
    return "yoga";
  }
  if (/dance|dance_school|dancing/.test(value)) {
    return "dance";
  }
  if (/music_school|music_teacher|music_lesson/.test(value)) {
    return "music-school";
  }
  if (/art_studio|art_school|painting/.test(value)) {
    return "art-studio";
  }
  if (/playground|play_area/.test(value)) {
    return "playground";
  }
  if (/bicycle_rental|bike_rental|rental.*bicycle/.test(value)) {
    return "bicycle-rental";
  }
  if (/scooter_rental|kick_scooter_rental|rental.*scooter/.test(value)) {
    return "scooter-rental";
  }
  if (/car_rental|rental.*car|vehicle_rental/.test(value)) {
    return "car-rental";
  }
  if (/internet_cafe|cyber_cafe|internet_cafe/.test(value)) {
    return "internet-cafe";
  }
  if (/copy_center|copy_shop|photocopy/.test(value)) {
    return "copy-center";
  }
  if (/print_shop|printing|printers/.test(value)) {
    return "print-shop";
  }
  if (/photo_studio|photography|photographer/.test(value)) {
    return "photo-studio";
  }
  if (/shoe_repair|cobbler|shoe_maker/.test(value)) {
    return "shoe-repair";
  }
  if (/key_cutting|key_cutter|locksmith|key_shop/.test(value)) {
    return "key-cutting";
  }
  if (/locksmith|locksmithing/.test(value)) {
    return "locksmith";
  }
  if (/waste_basket|waste_disposal|trash_can/.test(value)) {
    return "waste-disposal";
  }
  if (/drinking_water|water_fountain|fountain/.test(value)) {
    return "water-fountain";
  }
  if (/toilets|public_toilet|restroom/.test(value)) {
    return "public-toilet";
  }
  if (/bicycle_parking|bike_parking|bicycle_parking/.test(value)) {
    return "bicycle-parking";
  }
  if (/motorcycle_parking|motorbike_parking/.test(value)) {
    return "motorcycle-parking";
  }
  if (/bus_stop|bus_station|bus_platform/.test(value)) {
    return "bus-stop";
  }
  if (/tram_stop|tram_station|tram_platform/.test(value)) {
    return "tram-stop";
  }
  if (/taxi|taxi_stand|taxi_rank/.test(value)) {
    return "taxi-stand";
  }
  if (/car_sharing|carshare|car2go|zipcar/.test(value)) {
    return "car-sharing";
  }

  // Original classification logic
  if (
    /grocery|supermarket|convenience|greengrocer|bakery|butcher|deli|market/.test(
      value,
    )
  ) {
    return "groceries";
  }
  if (/(?:^|\s)pet(?:$|[_\s-])|animal_shelter|animal_boarding/.test(value)) {
    return "pets";
  }
  if (/(?:^|\s)(?:cafe|restaurant|fast_food|food|bar|pub|biergarten)(?:$|[_\s-])/.test(value)) {
    return "food";
  }
  if (/hospital|clinic|doctor|health/.test(value)) {
    return "health";
  }
  if (
    /school|kindergarten|college|university|adult_education|training/.test(
      value,
    )
  ) {
    return "education";
  }
  if (/(?:^|\s)parks?(?:$|[_\s-])|garden|recreation_ground/.test(value)) {
    return "parks";
  }
  if (/sports|sport|pitch|stadium|swimming_pool/.test(value)) {
    return "sports";
  }
  if (/nightclub|casino|gambling|adult|stripclub/.test(value)) {
    return "nightlife";
  }
  if (/tourism|viewpoint|tourist|attraction|zoo|theme_park|aquarium/.test(value)) {
    return "tourism";
  }
  if (/place_of_worship|church|mosque|synagogue|temple|religious/.test(value)) {
    return "religion";
  }
  if (/(?:^|\s)(?:bank|bureau_de_change|money_transfer|insurance|financial|credit_union|payment_terminal)(?:$|[_\s-])/.test(value)) {
    return "finance";
  }
  if (/government|townhall|courthouse|police|fire_station|embassy/.test(value)) {
    return "public";
  }
  if (/clothes|shoes|electronics|department_store|mall|jewelry|gift|books/.test(value)) {
    return "shopping";
  }
  if (/museum|gallery|theatre|cinema|arts|culture|historic/.test(value)) {
    return "culture";
  }
  if (/(?:^|\s)(?:bus|rail|station|transport)(?:$|[_\s-])/.test(value)) {
    return "transport";
  }
  if (/estate_agent|real_estate|real estate|property/.test(value)) {
    return "real-estate";
  }
  if (/employment|recruitment|career|job|coworking|staffing/.test(value)) {
    return "jobs";
  }
  if (/beauty|hairdresser|nail|massage|spa|cosmetic/.test(value)) {
    return "beauty";
  }
  if (/hotel|hostel|guest_house|accommodation|lodging/.test(value)) {
    return "stay";
  }
  if (/shop|office|service|post/.test(value)) return "services";
  return "other";
}
