// Every page reads the database or the session at request time, so the root
// Suspense boundary streams pages in behind an empty shell.
export default function Loading() {
  return null;
}
