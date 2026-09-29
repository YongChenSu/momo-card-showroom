import { ValidationError, type Schema } from 'yup'

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: string[] }

/**
 * yup's validateSync throws; every boundary needs a non-throwing result instead,
 * so the try/catch lives here once (the equivalent of Zod's safeParse).
 * `stripUnknown` drops keys the schema doesn't know, so garbage from storage/attributes never reaches state.
 */
export const safeValidate = <T>(schema: Schema<T>, input: unknown): ValidationResult<T> => {
  try {
    return { ok: true, value: schema.validateSync(input, { abortEarly: false, stripUnknown: true }) }
  } catch (error) {
    if (error instanceof ValidationError) return { ok: false, errors: error.errors }
    throw error
  }
}
