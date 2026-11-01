import { useEffect, useState } from "react";
import type { BuildingModelData } from "../lib/building-3d-layer";
import { deleteBuildingModel, loadBuildingModels, saveBuildingModel } from "../lib/building-model-store";
import type { LoadStatus } from "./use-transit-feed";

/**
 * 3D building models saved in this browser (IndexedDB) and the unsaved preview.
 * The preview is dropped whenever another place is selected.
 */
export function useBuildingModels(selectedPlaceId: string | undefined) {
  const [models, setModels] = useState<BuildingModelData[]>([]);
  const [preview, setPreview] = useState<BuildingModelData | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    loadBuildingModels()
      .then((loaded) => {
        if (!active) return;
        setModels(loaded);
        setStatus("ready");
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        console.error("Could not load the local building models.", loadError);
        setStatus("error");
        setError("Не вдалося відкрити локальне сховище 3D-моделей. Перевірте налаштування браузера.");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setPreview(null);
  }, [selectedPlaceId]);

  const save = async (model: BuildingModelData): Promise<void> => {
    await saveBuildingModel(model);
    setModels((current) => [...current.filter((item) => item.id !== model.id), model]);
    setPreview(null);
  };
  const remove = async (id: string): Promise<void> => {
    await deleteBuildingModel(id);
    setModels((current) => current.filter((item) => item.id !== id));
    setPreview(null);
  };

  return { models, preview, setPreview, status, error, save, remove };
}
