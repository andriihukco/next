import type { BuildingModelData } from "./building-3d-layer";

const DB_NAME = "eway-building-models";
const DB_VERSION = 1;
const STORE_NAME = "models";

let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("This browser does not support IndexedDB."));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not open the model database."));
    request.onblocked = () =>
      reject(new Error("The model database is blocked by another tab."));
  });
  return databasePromise;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("The model database request failed."));
  });
}

function isBuildingModelData(value: unknown): value is BuildingModelData {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.lng === "number" &&
    Number.isFinite(candidate.lng) &&
    typeof candidate.lat === "number" &&
    Number.isFinite(candidate.lat) &&
    typeof candidate.fileName === "string" &&
    typeof candidate.objText === "string" &&
    candidate.objText.length > 0 &&
    typeof candidate.heightMeters === "number" &&
    candidate.heightMeters > 0 &&
    typeof candidate.scale === "number" &&
    candidate.scale > 0 &&
    typeof candidate.rotation === "number" &&
    typeof candidate.elevationOffset === "number" &&
    typeof candidate.color === "string" &&
    (candidate.upAxis === "auto" ||
      candidate.upAxis === "y" ||
      candidate.upAxis === "z") &&
    typeof candidate.updatedAt === "number"
  );
}

export async function loadBuildingModels(): Promise<BuildingModelData[]> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readonly");
  const request = transaction.objectStore(STORE_NAME).getAll();
  const values = await requestToPromise(request);
  return values.filter(isBuildingModelData);
}

export async function saveBuildingModel(model: BuildingModelData): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  await requestToPromise(transaction.objectStore(STORE_NAME).put(model));
}

export async function deleteBuildingModel(id: string): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  await requestToPromise(transaction.objectStore(STORE_NAME).delete(id));
}
