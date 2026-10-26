// Types for `central-icons` when the licensed package is not installed (next.config.ts then aliases it to the
// local stand-ins). The installed package brings its own types.
declare module 'central-icons' {
  export * from '@/components/icons/central-fallback'
}
