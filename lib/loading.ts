export const MIN_PAGE_RENDER_DELAY_MS = 650;

export async function withMinimumPageRender<T>(
  load: () => Promise<T>,
  minimumDuration = MIN_PAGE_RENDER_DELAY_MS,
) {
  const [result] = await Promise.all([
    load(),
    new Promise((resolve) => setTimeout(resolve, minimumDuration)),
  ]);
  return result;
}
