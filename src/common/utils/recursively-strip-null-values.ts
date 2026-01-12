function recursivelyStripNullValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(recursivelyStripNullValue);
  }
  if (value !== null && typeof value == 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, value]) => [key, recursivelyStripNullValue(value)]));
  }
  if (value !== null) {
    return value;
  }
}

export default recursivelyStripNullValue;
