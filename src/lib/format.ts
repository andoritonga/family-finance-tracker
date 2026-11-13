const idrFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatRupiah(n: number): string {
  return idrFormatter.format(Number.isFinite(n) ? n : 0);
}

const MAX_SAFE_RUPIAH = 1_000_000_000_000; // Rp 1 Triliun upper bound

export function parseRupiah(value: string | number | null | undefined): number {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 0;
    const rounded = Math.round(value);
    return Math.max(-MAX_SAFE_RUPIAH, Math.min(MAX_SAFE_RUPIAH, rounded));
  }
  if (!value) return 0;
  const trimmed = String(value).trim();
  if (!trimmed) return 0;
  const isNegative = trimmed.startsWith('-') || (trimmed.startsWith('(') && trimmed.endsWith(')'));
  const digits = trimmed.replace(/[^0-9]/g, '').slice(0, 15);
  if (!digits) return 0;
  const parsed = parseInt(digits, 10);
  if (isNaN(parsed)) return 0;
  const bounded = Math.min(MAX_SAFE_RUPIAH, parsed);
  return isNegative ? -bounded : bounded;
}

/**
 * Safely evaluates a simple arithmetic expression (+, -, *, /, parentheses, numbers)
 * without using eval() or new Function().
 */
export function evaluateArithmeticExpression(expr: string): number | null {
  if (!expr || typeof expr !== 'string') return null;
  const cleaned = expr.replace(/^=/, '').trim();
  if (!cleaned || !/^[0-9+\-*/().\s]+$/.test(cleaned)) return null;

  const tokens = cleaned.match(/\d+(?:\.\d+)?|[+\-*/()]/g);
  if (!tokens || tokens.join('') !== cleaned.replace(/\s+/g, '')) return null;

  let pos = 0;

  function parseExpression(): number {
    let value = parseTerm();
    while (pos < tokens!.length && (tokens![pos] === '+' || tokens![pos] === '-')) {
      const op = tokens![pos++];
      const right = parseTerm();
      value = op === '+' ? value + right : value - right;
    }
    return value;
  }

  function parseTerm(): number {
    let value = parseFactor();
    while (pos < tokens!.length && (tokens![pos] === '*' || tokens![pos] === '/')) {
      const op = tokens![pos++];
      const right = parseFactor();
      if (op === '/') {
        if (right === 0) return NaN;
        value /= right;
      } else {
        value *= right;
      }
    }
    return value;
  }

  function parseFactor(): number {
    if (pos >= tokens!.length) return NaN;
    const token = tokens![pos];
    if (token === '+') {
      pos++;
      return parseFactor();
    }
    if (token === '-') {
      pos++;
      return -parseFactor();
    }
    if (token === '(') {
      pos++;
      const val = parseExpression();
      if (tokens![pos] !== ')') return NaN;
      pos++;
      return val;
    }
    pos++;
    return Number(token);
  }

  const result = parseExpression();
  if (pos !== tokens.length || !Number.isFinite(result)) return null;
  return Math.round(result);
}

/**
 * Prevents Google Sheets formula injection on USER_ENTERED text fields
 * and enforces safe character length & control-character stripping.
 */
export function sanitizeSheetText(input: unknown, maxLength: number = 200): string {
  const normalized = String(input ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .slice(0, maxLength);
  if (/^[=+\-@|]/.test(normalized)) {
    return `'${normalized}`;
  }
  return normalized;
}

/**
 * Safely escapes double quotes inside Google Sheets string literals (e.g. SUMIF criteria).
 */
export function escapeSheetFormulaString(input: string): string {
  return String(input || '')
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .slice(0, 100)
    .replace(/"/g, '""');
}

