/**
 * Converts full-width digits (０–９) and common full-width punctuation used
 * in Japanese phone numbers (－、ー、（、）) to their half-width equivalents.
 * Other characters are left unchanged.
 */
export function toHalfWidthPhone(value: string): string {
  return value
    .replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[－ー―]/g, '-')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
}

/**
 * Strips characters outside printable ASCII (U+0020–U+007E).
 * Used for English-mode text inputs to prevent CJK / non-Latin input.
 *
 * Encoding note: JavaScript strings are UTF-16. The filter target range
 * (printable Basic Latin block) sits entirely within the first 128 Unicode
 * code points, so a simple code-unit comparison is both correct and fast.
 */
export function toAscii(value: string): string {
  return value.replace(/[^\x20-\x7E]/g, '')
}

/**
 * Wraps a React change handler so that, in English mode, non-ASCII
 * characters are stripped from the input value before the handler fires.
 *
 * Usage with react-hook-form:
 *   const { onChange, ...rest } = register('name')
 *   <input {...rest} onChange={asciiOnChange(locale, onChange)} />
 */
export function asciiOnChange(
  locale: string,
  handler: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void,
) {
  return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (locale === 'en') {
      e.target.value = toAscii(e.target.value)
    }
    handler(e)
  }
}
