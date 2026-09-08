export type FieldErrors = Record<string, string[] | undefined>;

export type ActionResult<TData = undefined> =
  | ({ ok: true } & (TData extends undefined ? { data?: undefined } : { data: TData }))
  | { ok: false; error: string; fieldErrors?: FieldErrors };

export function failure(error: string, fieldErrors?: FieldErrors): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}
