import { ref, watch } from 'vue'
import type { RateUnit } from '../utils/rateUnit'

const STORAGE_KEY = 'jtl_display_settings'

interface DisplaySettings {
  zoomEnabled: boolean
  bucketMs: number
  lineWidth: number
  pointSize: number
  fillOpacity: number
  errorThreshold: number
  rateUnit: RateUnit
}

const DEFAULTS: DisplaySettings = {
  zoomEnabled: true,
  bucketMs: -1,
  lineWidth: 1,
  pointSize: 1,
  fillOpacity: 10,
  errorThreshold: 5,
  rateUnit: 'rps',
}

function pick(loaded: Partial<DisplaySettings>): DisplaySettings {
  return {
    zoomEnabled: typeof loaded.zoomEnabled === 'boolean' ? loaded.zoomEnabled : DEFAULTS.zoomEnabled,
    bucketMs: typeof loaded.bucketMs === 'number' ? loaded.bucketMs : DEFAULTS.bucketMs,
    lineWidth: typeof loaded.lineWidth === 'number' ? loaded.lineWidth : DEFAULTS.lineWidth,
    pointSize: typeof loaded.pointSize === 'number' ? loaded.pointSize : DEFAULTS.pointSize,
    fillOpacity: typeof loaded.fillOpacity === 'number' ? loaded.fillOpacity : DEFAULTS.fillOpacity,
    errorThreshold: typeof loaded.errorThreshold === 'number' ? loaded.errorThreshold : DEFAULTS.errorThreshold,
    rateUnit:
      loaded.rateUnit === 'rps' || loaded.rateUnit === 'rpm' || loaded.rateUnit === 'rph'
        ? loaded.rateUnit
        : DEFAULTS.rateUnit,
  }
}

function readInitial(): DisplaySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<DisplaySettings>
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return DEFAULTS
    return pick(parsed)
  } catch {
    return DEFAULTS
  }
}

const initial = readInitial()

export const zoomEnabled = ref(initial.zoomEnabled)
export const bucketMs = ref(initial.bucketMs)
export const lineWidth = ref(initial.lineWidth)
export const pointSize = ref(initial.pointSize)
export const fillOpacity = ref(initial.fillOpacity)
export const errorThreshold = ref(initial.errorThreshold)
export const rateUnit = ref<RateUnit>(initial.rateUnit)

function persist() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        zoomEnabled: zoomEnabled.value,
        bucketMs: bucketMs.value,
        lineWidth: lineWidth.value,
        pointSize: pointSize.value,
        fillOpacity: fillOpacity.value,
        errorThreshold: errorThreshold.value,
        rateUnit: rateUnit.value,
      }),
    )
  } catch {
    // storage unavailable - ignore, settings just won't persist
  }
}

watch([zoomEnabled, bucketMs, lineWidth, pointSize, fillOpacity, errorThreshold, rateUnit], persist)

export function useDisplaySettings() {
  return { zoomEnabled, bucketMs, lineWidth, pointSize, fillOpacity, errorThreshold, rateUnit }
}