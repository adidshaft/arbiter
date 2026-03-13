const DATE_TAG = Object.prototype.toString

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype
}

export function serializeValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === 'bigint') {
    return value.toString()
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue)
  }

  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {}
    for (const [key, nestedValue] of Object.entries(value)) {
      if (nestedValue !== undefined) {
        result[key] = serializeValue(nestedValue)
      }
    }
    return result
  }

  if (DATE_TAG.call(value) === '[object Date]') {
    return value instanceof Date ? value.toISOString() : value
  }

  return value
}

export function serializeApiResponse<T>(value: T): unknown {
  return serializeValue(value)
}

