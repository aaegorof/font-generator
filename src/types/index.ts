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

export interface TextInput {
  id: string;
  text: string;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  textColor: string;
  textShadow: boolean;
  textWrap: boolean;
  alignment: 'left' | 'center' | 'right';
  verticalAlignment: 'top' | 'center' | 'bottom';
}

export interface TileData {
  id: string;
  imageUrl: string;
  fontIds: string[];
}

export interface Settings {
  columns: number;
  padding: number;
  overlayOpacity: number;
  grayscale: boolean;
}

export interface FavoriteItem {
  id: string;
  tile: TileData;
  settings: Settings;
  textInputs: TextInput[];
  savedAt: number;
}
