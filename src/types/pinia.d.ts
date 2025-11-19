import 'pinia'

// introduce custom pinia plugin options flag to typescript
declare module 'pinia' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface DefineStoreOptionsBase<S, Store> {
    persist?: boolean;
  }
}
