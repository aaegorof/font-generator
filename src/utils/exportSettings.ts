import type { FontDef, Settings, FavoriteItem, TextInput } from '../types';

export interface SettingsExport {
  version: 1;
  exportedAt: number;
  settings: Settings;
  textInputs: TextInput[];
  fonts: FontDef[];
  images: string[];
  favorites: FavoriteItem[];
  toolbarOpen: boolean;
}

async function toDataUrl(url: string): Promise<string> {
  if (!url.startsWith('blob:')) return url;
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

export async function exportAllSettings(data: Omit<SettingsExport, 'version' | 'exportedAt'>): Promise<void> {
  const images = await Promise.all(data.images.map(toDataUrl));

  const fonts = await Promise.all(
    data.fonts.map(async (f) => ({
      ...f,
      uploadUrl: f.uploadUrl ? await toDataUrl(f.uploadUrl) : f.uploadUrl,
    }))
  );

  const favorites = await Promise.all(
    data.favorites.map(async (fav) => ({
      ...fav,
      tile: {
        ...fav.tile,
        imageUrl: await toDataUrl(fav.tile.imageUrl),
      },
    }))
  );

  const payload: SettingsExport = {
    version: 1,
    exportedAt: Date.now(),
    settings: data.settings,
    textInputs: data.textInputs,
    fonts,
    images,
    favorites,
    toolbarOpen: data.toolbarOpen,
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `font-generator-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function parseSettingsFile(file: File): Promise<SettingsExport> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as SettingsExport;
        if (!data.version || !data.settings) {
          reject(new Error('Invalid settings file'));
          return;
        }
        resolve(data);
      } catch {
        reject(new Error('Could not parse file'));
      }
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsText(file);
  });
}
