export type ArrayItem<T> = T extends readonly (infer U)[] ? U : never
