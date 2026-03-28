import { toPng } from 'html-to-image';

export async function exportTileAsPng(element: HTMLElement, filename = 'tile.png'): Promise<void> {
  try {
    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#000000',
    });

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Export failed:', err);
  }
}
