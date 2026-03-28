export interface FontDef {
  id: string;
  name: string;
  family: string;
  weight: number | string;
  style?: string;
  source: 'google' | 'local' | 'upload';
  localFile?: string;
  uploadUrl?: string;
  isActive?: boolean;
}

export interface TileData {
  id: string;
  imageUrl: string;
  fontIds: string[];
}

export interface Settings {
  fontSize: number;
  columns: number;
  letterSpacing: number;
  padding: number;
  textWrap: boolean;
  alignment: 'left' | 'center' | 'right';
  overlayOpacity: number;
  lineHeight: number;
  textColor: string;
  textShadow: boolean;
  grayscale: boolean;
}

export interface FavoriteItem {
  id: string;
  tile: TileData;
  settings: Settings;
  textContent: string;
  savedAt: number;
}
