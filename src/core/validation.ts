import { ValidationError, type Schema } from 'yup'

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: string[] }

/**
 * yup's validateSync throws; every boundary needs a non-throwing result instead,
 * so the try/catch lives here once (the equivalent of Zod's safeParse).
 */
export const safeValidate = <T>(schema: Schema<T>, input: unknown): ValidationResult<T> => {
  try {
    return { ok: true, value: schema.validateSync(input, { abortEarly: false }) }
  } catch (error) {
    if (error instanceof ValidationError) return { ok: false, errors: error.errors }
    throw error
  }
}
