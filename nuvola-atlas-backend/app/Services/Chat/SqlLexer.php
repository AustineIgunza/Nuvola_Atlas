<?php

declare(strict_types=1);

namespace App\Services\Chat;

use InvalidArgumentException;

/**
 * A Postgres-shaped tokenizer for SqlGuard.
 *
 * The guard used to scan the raw query text with regexes, which cannot tell
 * a keyword from the same letters inside a string literal. That cut both
 * ways: `WHERE title ILIKE '%update%'` was rejected as a write, and
 * `WHERE name = 'a; SELECT ...'` looked like statement smuggling. Deciding
 * anything about SQL means lexing it first.
 *
 * This is deliberately not a parser. It knows how to find the boundaries of
 * strings, dollar-quoted bodies, quoted identifiers, comments and parens —
 * enough for the guard to walk structure — and nothing about grammar.
 */
final class SqlLexer
{
    /**
     * @return list<SqlToken>
     */
    public function tokenize(string $sql): array
    {
        $tokens = [];
        $length = strlen($sql);
        $i = 0;
        $depth = 0;

        while ($i < $length) {
            $char = $sql[$i];
            $next = $sql[$i + 1] ?? '';

            if (ctype_space($char)) {
                $i++;

                continue;
            }

            if ($char === '-' && $next === '-') {
                $end = strcspn($sql, "\r\n", $i) + $i;
                $tokens[] = $this->token(SqlToken::COMMENT, substr($sql, $i, $end - $i), $depth, $i);
                $i = $end;

                continue;
            }

            if ($char === '/' && $next === '*') {
                $end = $this->consumeBlockComment($sql, $i);
                $tokens[] = $this->token(SqlToken::COMMENT, substr($sql, $i, $end - $i), $depth, $i);
                $i = $end;

                continue;
            }

            // E'...' and U&'...' both prefix an ordinary quote; let the
            // prefix lex as a word and the body lex as the string below.
            if ($char === "'") {
                $escaped = $this->previousWordWas($tokens, 'E');
                $end = $this->consumeQuoted($sql, $i, "'", $escaped);
                $tokens[] = $this->token(SqlToken::STRING, substr($sql, $i, $end - $i), $depth, $i);
                $i = $end;

                continue;
            }

            if ($char === '"') {
                $end = $this->consumeQuoted($sql, $i, '"', false);
                $tokens[] = $this->token(
                    SqlToken::QUOTED_IDENT,
                    str_replace('""', '"', substr($sql, $i + 1, $end - $i - 2)),
                    $depth,
                    $i
                );
                $i = $end;

                continue;
            }

            if ($char === '$') {
                if (ctype_digit($next)) {
                    $end = $i + 1 + strspn($sql, '0123456789', $i + 1);
                    $tokens[] = $this->token(SqlToken::PARAM, substr($sql, $i, $end - $i), $depth, $i);
                    $i = $end;

                    continue;
                }

                $end = $this->consumeDollarQuoted($sql, $i);

                if ($end !== null) {
                    $tokens[] = $this->token(SqlToken::STRING, substr($sql, $i, $end - $i), $depth, $i);
                    $i = $end;

                    continue;
                }
            }

            if ($char === '(' || $char === ')') {
                // The paren itself belongs to the outer depth, so its
                // contents read as depth + 1 and a top-level clause stays
                // at depth 0.
                if ($char === ')') {
                    $depth = max(0, $depth - 1);
                }

                $tokens[] = $this->token(SqlToken::PUNCT, $char, $depth, $i);

                if ($char === '(') {
                    $depth++;
                }

                $i++;

                continue;
            }

            if (ctype_digit($char) || ($char === '.' && ctype_digit($next))) {
                $end = $i + strspn($sql, '0123456789.eE+-', $i);
                $tokens[] = $this->token(SqlToken::NUMBER, substr($sql, $i, $end - $i), $depth, $i);
                $i = $end;

                continue;
            }

            if ($this->isWordStart($char)) {
                $end = $i + 1;
                while ($end < $length && $this->isWordPart($sql[$end])) {
                    $end++;
                }
                $tokens[] = $this->token(SqlToken::WORD, substr($sql, $i, $end - $i), $depth, $i);
                $i = $end;

                continue;
            }

            $tokens[] = $this->token(SqlToken::PUNCT, $char, $depth, $i);
            $i++;
        }

        return $tokens;
    }

    private function token(string $type, string $value, int $depth, int $offset): SqlToken
    {
        return new SqlToken($type, $value, $depth, $offset, strlen($value));
    }

    // Postgres block comments nest. Searching for the first close marker
    // would end the comment early and leave its tail lexing as live SQL.
    private function consumeBlockComment(string $sql, int $start): int
    {
        $length = strlen($sql);
        $i = $start + 2;
        $open = 1;

        while ($i < $length && $open > 0) {
            if ($sql[$i] === '/' && ($sql[$i + 1] ?? '') === '*') {
                $open++;
                $i += 2;

                continue;
            }

            if ($sql[$i] === '*' && ($sql[$i + 1] ?? '') === '/') {
                $open--;
                $i += 2;

                continue;
            }

            $i++;
        }

        if ($open > 0) {
            throw new InvalidArgumentException('Unterminated block comment.');
        }

        return $i;
    }

    /**
     * @return int the offset one past the closing quote
     */
    private function consumeQuoted(string $sql, int $start, string $quote, bool $backslashEscapes): int
    {
        $length = strlen($sql);
        $i = $start + 1;

        while ($i < $length) {
            $char = $sql[$i];

            if ($backslashEscapes && $char === '\\') {
                $i += 2;

                continue;
            }

            if ($char === $quote) {
                // A doubled quote is a literal quote, not the terminator.
                if (($sql[$i + 1] ?? '') === $quote) {
                    $i += 2;

                    continue;
                }

                return $i + 1;
            }

            $i++;
        }

        throw new InvalidArgumentException('Unterminated string literal.');
    }

    /**
     * @return int|null the offset one past the closing tag, or null when
     *                  this `$` does not open a dollar-quoted body
     */
    private function consumeDollarQuoted(string $sql, int $start): ?int
    {
        if (! preg_match('/\G\$([A-Za-z_][A-Za-z0-9_]*)?\$/', $sql, $m, 0, $start)) {
            return null;
        }

        $tag = $m[0];
        $close = strpos($sql, $tag, $start + strlen($tag));

        if ($close === false) {
            throw new InvalidArgumentException('Unterminated dollar-quoted string.');
        }

        return $close + strlen($tag);
    }

    /**
     * @param  list<SqlToken>  $tokens
     */
    private function previousWordWas(array $tokens, string $word): bool
    {
        $previous = end($tokens);

        return $previous instanceof SqlToken && $previous->isWord($word);
    }

    private function isWordStart(string $char): bool
    {
        return ctype_alpha($char) || $char === '_' || ord($char) >= 0x80;
    }

    private function isWordPart(string $char): bool
    {
        return ctype_alnum($char) || $char === '_' || $char === '$' || ord($char) >= 0x80;
    }
}
