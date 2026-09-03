import { Logger } from '@nestjs/common';

const logger = new Logger('PrivacyAssert');

/** True when JSON contains a quoted key such as `"email"`, not a value like a name or URL. */
export function jsonHasQuotedKeys(value: unknown, keys: readonly string[]): boolean {
  const serialized = JSON.stringify(value);
  return keys.some((key) => serialized.includes(`"${key}"`));
}

/**
 * Privacy checks must not turn a successful write into HTTP 500.
 * Log the failure and let the request return the mapped payload.
 */
export function runPrivacyAssert(label: string, assert: () => void): void {
  try {
    assert();
  } catch (error) {
    logger.error(
      `${label}: ${error instanceof Error ? error.message : 'privacy assert failed'}`,
      error instanceof Error ? error.stack : undefined,
    );
  }
}
