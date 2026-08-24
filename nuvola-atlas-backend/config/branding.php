<?php

declare(strict_types=1);

/*
 * The one place the index name is spelled on the backend.
 *
 * "UE" is the acronym for **Urban-Environmental**. R2 §P7.2 required the
 * expansion because the acronym had been used across the codebase without
 * ever being defined, which made the term look invented. Read via
 * ``config('branding.index_name_long')`` etc.; do not hardcode the label
 * anywhere else.
 *
 * Mirror in ``nuvola-atlas-frontend/src/lib/branding.ts``.
 */

return [
    'index_name_long' => 'Urban-Environmental Vitality Index',
    'index_name_short' => 'UE Vitality Index',
    'index_acronym' => 'UE',
    'index_acronym_expansion' => 'Urban-Environmental',
];
