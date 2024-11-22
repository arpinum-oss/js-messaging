export function assertOptionalString(
  value: unknown,
  name: string,
): asserts value is string | undefined {
  if (value !== undefined) {
    assertString(value, name);
  }
}

export function assertString(
  value: unknown,
  name: string,
): asserts value is string | undefined {
  if (typeof value !== "string") {
    throw new Error(`${name} must be a string`);
  }
}

export function assertOptionalFunction(
  value: unknown,
  name: string,
): asserts value is ((...args: unknown[]) => unknown) | undefined {
  if (value !== undefined) {
    assertFunction(value, name);
  }
}

export function assertFunction(
  value: unknown,
  name: string,
): asserts value is (...args: unknown[]) => unknown {
  if (typeof value !== "function") {
    throw new Error(`${name} must be a function`);
  }
}

export function assertOptionalNumber(
  value: unknown,
  name: string,
): asserts value is number | undefined {
  if (
    value !== undefined &&
    (typeof value !== "number" || Number.isNaN(value))
  ) {
    throw new Error(`${name} must be a number`);
  }
}

export function assertOptionalBoolean(
  value: unknown,
  name: string,
): asserts value is boolean | undefined {
  if (value !== undefined && typeof value !== "boolean") {
    throw new Error(`${name} must be a boolean`);
  }
}

export function assertOptionalArray(
  value: unknown,
  name: string,
): asserts value is unknown[] | undefined {
  if (value !== undefined && !Array.isArray(value)) {
    throw new Error(`${name} must be an array`);
  }
}

export function assertPresent(
  value: unknown,
  name: string,
): asserts value is NonNullable<unknown> {
  if (value === null || value === undefined) {
    throw new Error(`${name} must be present`);
  }
}
