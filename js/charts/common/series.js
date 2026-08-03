import { isTargetHit } from "../../metrics.js";

export function getIndicatorBarColor(theme, indicator, value, successColor) {
  if (value === null) {
    return theme.colors.muted;
  }

  return isTargetHit(indicator, value) ? successColor : theme.colors.destructiveMixed;
}
