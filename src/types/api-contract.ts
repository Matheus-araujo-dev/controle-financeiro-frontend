/** UI boundary: API fields are present after service normalization. Keep explicit null/optional fields. */
export type ApiContract<T, Nullable extends keyof T = never, Optional extends keyof T = never> = {
  [K in Exclude<keyof T, Optional>]-?: NonNullable<T[K]> | (K extends Nullable ? null : never);
} & {
  [K in Optional]?: NonNullable<T[K]> | (K extends Nullable ? null : never);
};
