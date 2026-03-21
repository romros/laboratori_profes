/**
 * Policy local Feature 0 — alineat amb docs/features/template-inference/feasibility-definition.md §5.
 * No hardcode dispers: tot el que és “llindar de contracte” viu aquí.
 */

/** §5: màxim de limitacions permeses */
export const FEASIBILITY_MAX_LIMITATIONS = 3

/**
 * Tipus de limitació permesos (mapatge mecànic §5.2).
 * - human_review_delimited_box: revisió humana d’un requadre/ítem ja delimitat
 * - exclude_numbered_page_section: exclusió pàgina o secció numerada
 * - disable_automated_item: desactivació ítem concret al flux automàtic
 */
export const LIMITATION_TYPES = [
  'human_review_delimited_box',
  'exclude_numbered_page_section',
  'disable_automated_item',
] as const

export type LimitationType = (typeof LIMITATION_TYPES)[number]
