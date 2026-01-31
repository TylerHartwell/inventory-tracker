// Convert snake_case string to camelCase
type SnakeToCamel<S extends string> = S extends `${infer T}_${infer U}` ? `${T}${Capitalize<SnakeToCamel<U>>}` : S

// Recursively camelize all keys
export type Camelize<T> =
  T extends Array<infer U> ? Camelize<U>[] : T extends object ? { [K in keyof T as SnakeToCamel<string & K>]: Camelize<T[K]> } : T

export function camelize<T>(obj: T): Camelize<T> {
  if (obj == null) return obj as Camelize<T> // handle null or undefined

  if (Array.isArray(obj)) {
    return obj.map(camelize) as Camelize<T>
  }

  if (typeof obj === "object" && !(obj instanceof Date)) {
    const result: Record<string, unknown> = {}
    for (const key in obj) {
      const camelKey = key.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase())
      result[camelKey] = camelize((obj as Record<string, unknown>)[key])
    }
    return result as Camelize<T>
  } else {
    return obj as Camelize<T>
  }
}
