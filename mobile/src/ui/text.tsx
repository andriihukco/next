import { Text, type TextProps } from "react-native";
import { colors, fonts } from "../lib/theme";
import { typeStyle, useUiPlatform, type TypeRole } from "./platform";

export type TextTone = "default" | "muted" | "primary" | "accent" | "danger" | "onPrimary";

const toneColor = (tone: TextTone): string =>
  ({
    default: colors.foreground,
    muted: colors.mutedForeground,
    primary: colors.primary,
    accent: colors.accentForeground,
    danger: colors.destructive,
    onPrimary: colors.onPrimary,
  })[tone];

const WEIGHT = { regular: fonts.regular, semibold: fonts.semibold, bold: fonts.bold } as const;

type Props = TextProps & { variant?: TypeRole; tone?: TextTone; weight?: keyof typeof WEIGHT };

/** Text in one of the semantic roles (design/foundations.md#type). Sizes differ per platform. */
export function Txt({ variant = "body", tone = "default", weight, style, ...props }: Props) {
  const platform = useUiPlatform();
  return (
    <Text
      {...props}
      style={[typeStyle(platform, variant), { color: toneColor(tone) }, weight ? { fontFamily: WEIGHT[weight] } : null, style]}
    />
  );
}
