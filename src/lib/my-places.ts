import { useCallback, useState } from "react";

/**
 * @file my-places.ts
 * @description Lists and custom marks the user keeps for «Мої місця». Stored only on this device.
 *   Public marks (after admin review) and shareable lists need the server and are not stored here yet.
 */

export const MY_PLACES_KEY = "eway-my-places";

export type MyPlaceList = {
  id: string;
  name: string;
  /** Place ids, in the order the user added them. */
  placeIds: string[];
};

export type MyPlaceMark = {
  id: string;
  name: string;
  note: string;
  lat: number;
  lng: number;
  /** Only private marks exist for now. Public marks wait for admin review on the server. */
  visibility: "private";
};

export type MyPlacesData = {
  lists: MyPlaceList[];
  marks: MyPlaceMark[];
};

const EMPTY: MyPlacesData = { lists: [], marks: [] };

function readData(): MyPlacesData {
  try {
    const raw = localStorage.getItem(MY_PLACES_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<MyPlacesData>;
    return {
      lists: Array.isArray(parsed.lists) ? parsed.lists : [],
      marks: Array.isArray(parsed.marks) ? parsed.marks : [],
    };
  } catch (error) {
    console.error("Could not read My Places.", error);
    return EMPTY;
  }
}

/** Returns the stored lists and marks, plus an updater that saves every change at once. */
export function useMyPlaces(): [MyPlacesData, (change: (data: MyPlacesData) => MyPlacesData) => void] {
  const [data, setData] = useState<MyPlacesData>(readData);
  const update = useCallback((change: (current: MyPlacesData) => MyPlacesData) => {
    setData((current) => {
      const next = change(current);
      try {
        localStorage.setItem(MY_PLACES_KEY, JSON.stringify(next));
      } catch (error) {
        console.error("Could not save My Places.", error);
      }
      return next;
    });
  }, []);
  return [data, update];
}

export function newId(): string {
  return crypto.randomUUID();
}
