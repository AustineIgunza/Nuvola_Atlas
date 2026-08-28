/**
 * The one place the index name is spelled.
 *
 * "UE" is the acronym for **Urban-Environmental**. R2 §P7.2 required the
 * expansion because the acronym had been used across the codebase without
 * ever being defined, which made the term look invented. Read from the
 * exports below; do not hardcode the label anywhere else.
 *
 * Both forms are exported because the long form is what a first-time
 * visitor needs (header, methodology page, export cover pages) while the
 * short form is what a repeat user wants in dense UI (leaderboard, badges).
 *
 * Mirror in ``nuvola-atlas-backend/config/branding.php``.
 */

export const INDEX_NAME_LONG = "Urban-Environmental Vitality Index";
export const INDEX_NAME_SHORT = "UE Vitality Index";
export const INDEX_ACRONYM = "UE";
export const INDEX_ACRONYM_EXPANSION = "Urban-Environmental";
