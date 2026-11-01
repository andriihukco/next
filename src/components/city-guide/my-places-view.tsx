import { useState, type CSSProperties } from "react";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";
import { Input } from "../ui/input";
import { MaterialIcon } from "../ui/material-icon";
import { cityPlaceIcons, CITY_PLACE_CATEGORY_COLORS, type CityPlace } from "../../lib/city-places";
import { CITY_CENTER } from "./constants";
import { distanceToPlace, formatPlaceDistance } from "./helpers";
import { newId, useMyPlaces } from "../../lib/my-places";

type MyPlacesViewProps = {
  places: CityPlace[];
  saved: ReadonlySet<string>;
  userLocation: [number, number] | null;
  onOpenPlace: (id: string) => void;
};

/**
 * «Мої місця»: saved places, lists the user makes (like a map's saved lists), and private marks.
 * Everything is kept on this device. Public marks and shared lists wait for the server.
 */
export function MyPlacesView({ places, saved, userLocation, onOpenPlace }: MyPlacesViewProps) {
  const [data, update] = useMyPlaces();
  const origin = userLocation ?? CITY_CENTER;
  const savedPlaces = places.filter((place) => saved.has(place.id));
  const [listName, setListName] = useState("");
  const [openListId, setOpenListId] = useState<string | null>(null);
  const [markName, setMarkName] = useState("");
  const [markNote, setMarkNote] = useState("");

  const createList = (): void => {
    const name = listName.trim();
    if (!name) return;
    const id = newId();
    update((current) => ({ ...current, lists: [...current.lists, { id, name, placeIds: [] }] }));
    setListName("");
    setOpenListId(id);
  };

  const addMark = (): void => {
    const name = markName.trim();
    if (!name) return;
    update((current) => ({
      ...current,
      marks: [...current.marks, { id: newId(), name, note: markNote.trim(), lat: origin[1], lng: origin[0], visibility: "private" }],
    }));
    setMarkName("");
    setMarkNote("");
  };

  const placeRow = (place: CityPlace, action?: { label: string; icon: string; onClick: () => void }) => (
    <li key={place.id} className="my-places-row">
      <button type="button" className="my-places-place" onClick={() => onOpenPlace(place.id)}>
        <span className="my-places-icon" style={{ "--category-color": CITY_PLACE_CATEGORY_COLORS[place.category] } as CSSProperties}>
          <MaterialIcon name={cityPlaceIcons[place.category]} size={20} />
        </span>
        <span className="my-places-copy">
          <strong>{place.name}</strong>
          <span>{[place.categoryLabel, formatPlaceDistance(distanceToPlace(place, origin))].filter(Boolean).join(" · ")}</span>
        </span>
      </button>
      {action && (
        <IconButton label={action.label} tooltipSide="left" onClick={action.onClick}>
          <MaterialIcon name={action.icon} size={20} />
        </IconButton>
      )}
    </li>
  );

  const openList = data.lists.find((list) => list.id === openListId) ?? null;
  const openListPlaces = openList ? openList.placeIds.map((id) => places.find((place) => place.id === id)).filter((place): place is CityPlace => Boolean(place)) : [];
  const addablePlaces = openList ? savedPlaces.filter((place) => !openList.placeIds.includes(place.id)) : [];

  return (
    <div className="my-places">
      <section className="my-places-section" aria-labelledby="my-places-saved">
        <h3 id="my-places-saved">Збережені</h3>
        {savedPlaces.length === 0 ? (
          <p className="my-places-empty">Збережені місця з’являться тут. Натисніть закладку на картці місця.</p>
        ) : (
          <ul className="my-places-list">{savedPlaces.map((place) => placeRow(place))}</ul>
        )}
      </section>

      <section className="my-places-section" aria-labelledby="my-places-lists">
        <h3 id="my-places-lists">Списки</h3>
        <form
          className="my-places-form"
          onSubmit={(event) => {
            event.preventDefault();
            createList();
          }}
        >
          <Input value={listName} onChange={(event) => setListName(event.target.value)} placeholder="Назва списку, наприклад «Кава»" aria-label="Назва списку" maxLength={60} />
          <Button type="submit" disabled={!listName.trim()}>
            <MaterialIcon name="add" size={18} />
            Створити
          </Button>
        </form>

        {data.lists.length === 0 && <p className="my-places-empty">Списки місць, як у картах: створіть і додавайте до них збережені місця.</p>}
        <ul className="my-places-lists">
          {data.lists.map((list) => {
            const open = list.id === openListId;
            return (
              <li key={list.id} className="my-places-list-card">
                <button type="button" className="my-places-list-head" aria-expanded={open} onClick={() => setOpenListId(open ? null : list.id)}>
                  <MaterialIcon name="bookmarks" size={20} />
                  <span className="my-places-copy">
                    <strong>{list.name}</strong>
                    <span>{list.placeIds.length} місць</span>
                  </span>
                  <MaterialIcon name={open ? "expand_less" : "expand_more"} size={20} />
                </button>
                {open && openList && (
                  <div className="my-places-list-body">
                    {openListPlaces.length > 0 && (
                      <ul className="my-places-list">
                        {openListPlaces.map((place) =>
                          placeRow(place, {
                            label: `Прибрати «${place.name}» зі списку`,
                            icon: "remove_circle",
                            onClick: () =>
                              update((current) => ({
                                ...current,
                                lists: current.lists.map((item) =>
                                  item.id === list.id ? { ...item, placeIds: item.placeIds.filter((id) => id !== place.id) } : item,
                                ),
                              })),
                          }),
                        )}
                      </ul>
                    )}
                    {addablePlaces.length > 0 && (
                      <ul className="my-places-list">
                        {addablePlaces.map((place) =>
                          placeRow(place, {
                            label: `Додати «${place.name}» до списку`,
                            icon: "add_circle",
                            onClick: () =>
                              update((current) => ({
                                ...current,
                                lists: current.lists.map((item) =>
                                  item.id === list.id ? { ...item, placeIds: [...item.placeIds, place.id] } : item,
                                ),
                              })),
                          }),
                        )}
                      </ul>
                    )}
                    {savedPlaces.length === 0 && <p className="my-places-empty">Спершу збережіть місця, щоб додати їх до списку.</p>}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        update((current) => ({ ...current, lists: current.lists.filter((item) => item.id !== list.id) }));
                        setOpenListId(null);
                      }}
                    >
                      <MaterialIcon name="delete" size={18} />
                      Видалити список
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="my-places-section" aria-labelledby="my-places-marks">
        <h3 id="my-places-marks">Мої позначки</h3>
        <p className="my-places-hint">
          Позначка ставиться в {userLocation ? "вашій поточній точці" : "центрі Львова, поки немає геолокації"}. Приватні позначки безкоштовні і видно лише вам.
        </p>
        <form
          className="my-places-form is-stacked"
          onSubmit={(event) => {
            event.preventDefault();
            addMark();
          }}
        >
          <Input value={markName} onChange={(event) => setMarkName(event.target.value)} placeholder="Назва позначки" aria-label="Назва позначки" maxLength={80} />
          <Input value={markNote} onChange={(event) => setMarkNote(event.target.value)} placeholder="Нотатка (необов’язково)" aria-label="Нотатка" maxLength={200} />
          <fieldset className="my-places-visibility">
            <legend>Видимість</legend>
            <label>
              <input type="radio" name="mark-visibility" value="private" defaultChecked />
              Приватна, безкоштовно
            </label>
            <label className="is-disabled">
              <input type="radio" name="mark-visibility" value="public" disabled />
              Публічна, після перевірки адміністратором (скоро)
            </label>
          </fieldset>
          <Button type="submit" disabled={!markName.trim()}>
            <MaterialIcon name="add_location_alt" size={18} />
            Додати позначку
          </Button>
        </form>
        {data.marks.length > 0 && (
          <ul className="my-places-list">
            {data.marks.map((mark) => (
              <li key={mark.id} className="my-places-row">
                <span className="my-places-place is-static">
                  <span className="my-places-icon">
                    <MaterialIcon name="pin_drop" size={20} />
                  </span>
                  <span className="my-places-copy">
                    <strong>{mark.name}</strong>
                    <span>{mark.note || "Приватна позначка"}</span>
                  </span>
                </span>
                <IconButton
                  label={`Видалити позначку «${mark.name}»`}
                  tooltipSide="left"
                  onClick={() => update((current) => ({ ...current, marks: current.marks.filter((item) => item.id !== mark.id) }))}
                >
                  <MaterialIcon name="delete" size={20} />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
