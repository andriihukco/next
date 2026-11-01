import { useMemo, useState, type FormEvent } from "react";
import { CITY_UPDATES_ENDPOINT } from "../lib/app-constants";
import { cityNames, ukraineCityRegions } from "../lib/ukraine-city-regions";

/** «Обрати місто»: city index with search, and the e-mail sign-up for launch news. */
export function useCityLaunch() {
  const [open, setOpen] = useState(false);
  const [interestedCities, setInterestedCities] = useState<Set<string>>(
    () => new Set([cityNames.find((city) => city === "Київ") ?? cityNames[0]]),
  );
  const [citySearch, setCitySearch] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const normalizedSearch = citySearch.trim().toLocaleLowerCase("uk-UA");
  const filteredRegions = useMemo(
    () =>
      ukraineCityRegions
        .map((region) => {
          const matchesRegion = region.name.toLocaleLowerCase("uk-UA").includes(normalizedSearch);
          const matchesCenter = region.center.toLocaleLowerCase("uk-UA").includes(normalizedSearch);
          const cities = matchesRegion
            ? region.cities
            : region.cities.filter((city) => city.toLocaleLowerCase("uk-UA").includes(normalizedSearch));
          return {
            ...region,
            matchesRegion,
            matchesCenter,
            cities,
            showCenter: !normalizedSearch || matchesRegion || matchesCenter,
          };
        })
        .filter(
          (region) =>
            !normalizedSearch || region.matchesRegion || region.matchesCenter || region.cities.length > 0,
        ),
    [normalizedSearch],
  );
  const cityIndexGroups = useMemo(() => {
    const collator = new Intl.Collator("uk-UA");
    const entries = filteredRegions
      .flatMap((region) => [
        ...(region.showCenter
          ? [{ key: `${region.name}|${region.center}`, name: region.center, isCenter: true }]
          : []),
        ...region.cities.map((city) => ({ key: `${region.name}|${city}`, name: city, isCenter: false })),
      ])
      .sort((a, b) => collator.compare(a.name, b.name));
    const groups = new Map<string, typeof entries>();
    for (const entry of entries) {
      const letter = entry.name.charAt(0).toLocaleUpperCase("uk-UA");
      groups.set(letter, [...(groups.get(letter) ?? []), entry]);
    }
    return [...groups].map(([letter, items]) => ({ letter, items }));
  }, [filteredRegions]);

  const openPicker = (): void => {
    setStatus("");
    setOpen(true);
  };
  const toggleCity = (city: string): void => {
    setInterestedCities((prev) => {
      const next = new Set(prev);
      if (next.has(city)) next.delete(city);
      else next.add(city);
      return next;
    });
    setStatus("");
  };
  const changeEmail = (value: string): void => {
    setEmail(value);
    setStatus("");
  };
  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!CITY_UPDATES_ENDPOINT) {
      setStatus("Підписка ще не підключена. Адресу не збережено — спробуйте пізніше.");
      return;
    }
    setSubmitting(true);
    try {
      const cities = Array.from(interestedCities);
      const response = await fetch(CITY_UPDATES_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), cities }),
      });
      if (!response.ok) {
        throw new Error(`Email signup failed with status ${response.status}.`);
      }
      setEmail("");
      setStatus(
        `Дякуємо! Напишемо, коли un з’явиться у ${cities.length} ${cities.length === 1 ? "місті" : "містах"}.`,
      );
    } catch (error) {
      console.error("Could not submit the city launch email signup.", error);
      setStatus("Не вдалося надіслати адресу. Перевірте з’єднання та спробуйте ще раз.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    open,
    setOpen,
    openPicker,
    citySearch,
    setCitySearch,
    cityIndexGroups,
    noMatches: filteredRegions.length === 0,
    interestedCities,
    toggleCity,
    email,
    changeEmail,
    submitting,
    status,
    submit,
  };
}
