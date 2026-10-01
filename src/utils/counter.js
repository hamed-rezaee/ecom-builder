// Splits a stat value such as "$1,200+" or "4.9" into the animated number and its fixed text.
export function parseCounter(value) {
  const m = /^(\D*?)(\d[\d,]*(?:\.\d+)?)(\D*)$/.exec(
    String(value ?? '').trim(),
  );
  if (!m) return null;
  const digits = m[2];
  const group = digits.includes(',');
  if (group && !/^\d{1,3}(,\d{3})*(\.\d+)?$/.test(digits)) return null;
  const to = Number(digits.replace(/,/g, ''));
  if (!Number.isFinite(to)) return null;
  const decimals = digits.includes('.') ? digits.split('.')[1].length : 0;
  return { to, decimals, group, prefix: m[1], suffix: m[3] };
}
