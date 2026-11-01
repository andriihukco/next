import { BrandLogo } from "./ui/brand-logo";
import { IconButton } from "./ui/icon-button";
import { MaterialIcon } from "./ui/material-icon";

type BrandHeaderControlsProps = {
  cityPickerOpen: boolean;
  onOpenCityPicker: () => void;
  settingsOpen: boolean;
  onOpenSettings: () => void;
};

/**
 * Logo, city picker and profile. Mobile floats these pills over the map;
 * desktop keeps them in the rail header (DESIGN.md §5).
 */
export function BrandHeaderControls({
  cityPickerOpen,
  onOpenCityPicker,
  settingsOpen,
  onOpenSettings,
}: BrandHeaderControlsProps) {
  return (
    <>
      <BrandLogo className="brand-logo" />
      <button
        type="button"
        className="city-picker"
        aria-label="Місто: Львів. Обрати місто"
        aria-haspopup="dialog"
        aria-expanded={cityPickerOpen}
        onClick={onOpenCityPicker}
      >
        <span className="city-picker-name">Львів</span>
        <span className="city-picker-beta">Beta</span>
        <MaterialIcon name="expand_more" size={16} />
      </button>
      <span className="brand-header-spacer" aria-hidden="true" />
      <IconButton
        label="Профіль і налаштування"
        tooltipSide="bottom"
        className="brand-header-action"
        aria-haspopup="dialog"
        aria-expanded={settingsOpen}
        onClick={onOpenSettings}
      >
        <MaterialIcon name="account_circle" size={22} />
      </IconButton>
    </>
  );
}
