<?php

declare(strict_types=1);

namespace App\Services\Chat;

final class SqlToken
{
    public const WORD = 'word';

    public const QUOTED_IDENT = 'quoted_ident';

    public const STRING = 'string';

    public const NUMBER = 'number';

    public const PUNCT = 'punct';

    public const PARAM = 'param';

    public const COMMENT = 'comment';

    public function __construct(
        public readonly string $type,
        public readonly string $value,
        public readonly int $depth,
        public readonly int $offset,
        public readonly int $length,
    ) {}

    public function isWord(string ...$candidates): bool
    {
        return $this->type === self::WORD
            && in_array(strtoupper($this->value), $candidates, true);
    }

    public function isPunct(string $punct): bool
    {
        return $this->type === self::PUNCT && $this->value === $punct;
    }

    /**
     * The identifier this token names, or null when it does not name one.
     * Quoted identifiers keep their case; bare words fold to lower, which is
     * what Postgres itself does.
     */
    public function identifier(): ?string
    {
        return match ($this->type) {
            self::WORD => strtolower($this->value),
            self::QUOTED_IDENT => $this->value,
            default => null,
        };
    }
}
