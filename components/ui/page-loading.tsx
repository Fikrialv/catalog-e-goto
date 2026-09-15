import { MorphingSquare } from "@/components/ui/morphing-square";

export function PageLoading({
  message = "Memuat halaman…",
}: {
  message?: string;
}) {
  return (
    <main
      className="catalog-surface grid min-h-screen place-items-center px-6 py-24"
      aria-busy="true"
      aria-live="polite"
      aria-label={message}
    >
      <MorphingSquare message={message} className="bg-primary-dark" />
    </main>
  );
}
