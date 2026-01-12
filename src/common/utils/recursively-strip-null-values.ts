export function recursivelyStripNullValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(recursivelyStripNullValue);
  }

  if (value instanceof Date) {
    return value;
  }

  if (value !== null && typeof value === 'object') {
    return Object.entries(value).reduce(
      (acc, [key, val]) => {
        const strippedValue = recursivelyStripNullValue(val);

        if (strippedValue !== null && strippedValue !== undefined) {
          acc[key] = strippedValue;
        }

        return acc;
      },
      {} as Record<string, unknown>
    );
  }

  return value;
}

export default recursivelyStripNullValue;
