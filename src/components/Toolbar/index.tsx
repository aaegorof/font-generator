import React, { useCallback, useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { loadFontFile, injectUploadedFont } from '../../utils/fonts';
import { exportAllSettings, parseSettingsFile } from '../../utils/exportSettings';
import type { TextInput } from '../../types';
import './Toolbar.css';

export function Toolbar() {
  const {
    settings,
    updateSettings,
    textInputs,
    addTextInput,
    removeTextInput,
    updateTextInput,
    fonts,
    toggleFontActive,
    removeFont,
    addFont,
    addImage,
    toolbarOpen,
    toggleToolbar,
    favorites,
    openFavoritesView,
    generateTiles,
    randomize,
    images,
    importAllSettings,
  } = useStore();

  const fontUploadRef = useRef<HTMLInputElement>(null);
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const importSettingsRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'fonts' | 'images'>('settings');

  const handleFontUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const fontDef = await loadFontFile(file);
        injectUploadedFont(fontDef);
        addFont(fontDef);
      }
    } catch (err) {
      console.error('Font upload error:', err);
    } finally {
      setUploading(false);
      if (fontUploadRef.current) fontUploadRef.current.value = '';
    }
  }, [addFont]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      addImage(url);
    });
    if (imageUploadRef.current) imageUploadRef.current.value = '';
  }, [addImage]);

  const handleAddImageUrl = useCallback(() => {
    const trimmed = urlInput.trim();
    if (trimmed) {
      addImage(trimmed);
      setUrlInput('');
    }
  }, [urlInput, addImage]);

  const handleExportSettings = useCallback(async () => {
    setExporting(true);
    try {
      await exportAllSettings({ settings, textInputs, fonts, images, favorites, toolbarOpen });
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  }, [settings, textInputs, fonts, images, favorites, toolbarOpen]);

  const handleImportSettings = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await parseSettingsFile(file);
      importAllSettings(data);
    } catch (err) {
      console.error('Import error:', err);
      alert('Failed to import settings. Make sure the file is a valid export.');
    } finally {
      if (importSettingsRef.current) importSettingsRef.current.value = '';
    }
  }, [importAllSettings]);

  return (
    <div className={`toolbar ${toolbarOpen ? 'toolbar--open' : 'toolbar--closed'}`}>
      <div className="toolbar__header">
        <div className="toolbar__header-left">
          <span className="toolbar__brand">Font Generator</span>
          <div className="toolbar__tabs">
            {(['settings', 'fonts', 'images'] as const).map((tab) => (
              <button
                key={tab}
                className={`toolbar__tab ${activeTab === tab && toolbarOpen ? 'toolbar__tab--active' : ''}`}
                onClick={() => {
                  if (!toolbarOpen) toggleToolbar();
                  setActiveTab(tab);
                }}
              >
                {tab === 'settings' ? 'Settings' : tab === 'fonts' ? 'Fonts' : 'Images'}
              </button>
            ))}
          </div>
        </div>
        <div className="toolbar__header-right">
          {favorites.length > 0 && (
            <button className="toolbar__action-btn" onClick={() => openFavoritesView(0)}>
              <HeartIcon />
              <span>{favorites.length}</span>
            </button>
          )}
          <button className="toolbar__action-btn toolbar__action-btn--outline" onClick={randomize}>
            <ShuffleIcon />
            <span>Randomize</span>
          </button>
          <button className="toolbar__action-btn toolbar__action-btn--outline" onClick={generateTiles}>
            <RefreshIcon />
            <span>Reset</span>
          </button>
          <button className="toolbar__toggle" onClick={toggleToolbar} title={toolbarOpen ? 'Collapse' : 'Expand'}>
            <ChevronIcon open={toolbarOpen} />
          </button>
        </div>
      </div>

      <div className="toolbar__body">
        {activeTab === 'settings' && (
          <div className="toolbar__panel">
            {/* Global settings */}
            <div className="toolbar__controls-grid">
              <div className="toolbar__control">
                <label className="toolbar__label">Columns <span className="toolbar__value">{settings.columns}</span></label>
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={1}
                  value={settings.columns}
                  onChange={(e) => updateSettings({ columns: Number(e.target.value) })}
                />
              </div>
              <div className="toolbar__control">
                <label className="toolbar__label">Padding <span className="toolbar__value">{settings.padding}px</span></label>
                <input
                  type="range"
                  min={0}
                  max={80}
                  value={settings.padding}
                  onChange={(e) => updateSettings({ padding: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Text inputs */}
            <div className="toolbar__inputs-header">
              <span className="toolbar__label" style={{ marginBottom: 0 }}>Text Layers</span>
              <button className="toolbar__add-input-btn" onClick={addTextInput}>
                <PlusIcon />
                Add layer
              </button>
            </div>

            {textInputs.map((input, idx) => (
              <TextInputPanel
                key={input.id}
                input={input}
                index={idx}
                canRemove={textInputs.length > 1}
                onUpdate={(partial) => updateTextInput(input.id, partial)}
                onRemove={() => removeTextInput(input.id)}
              />
            ))}

            {/* Export / Import */}
            <div className="toolbar__section toolbar__section--transfer">
              <label className="toolbar__label">Transfer Settings</label>
              <div className="toolbar__transfer-row">
                <button
                  className="toolbar__upload-btn toolbar__upload-btn--export"
                  onClick={handleExportSettings}
                  disabled={exporting}
                >
                  <ExportIcon />
                  {exporting ? 'Exporting…' : 'Export'}
                </button>
                <input
                  ref={importSettingsRef}
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={handleImportSettings}
                />
                <button
                  className="toolbar__upload-btn toolbar__upload-btn--import"
                  onClick={() => importSettingsRef.current?.click()}
                >
                  <ImportIcon />
                  Import
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fonts' && (
          <div className="toolbar__panel">
            <div className="toolbar__font-list">
              {fonts.map((font) => (
                <div key={font.id} className={`toolbar__font-item ${font.isActive !== false ? 'toolbar__font-item--active' : ''}`}>
                  <button
                    className="toolbar__font-toggle"
                    onClick={() => toggleFontActive(font.id)}
                    title={font.isActive !== false ? 'Disable' : 'Enable'}
                  >
                    <span
                      className="toolbar__font-preview"
                      style={{ fontFamily: `'${font.family}', sans-serif`, fontWeight: font.weight }}
                    >
                      Aa
                    </span>
                    <span className="toolbar__font-name">{font.name}</span>
                    <span className="toolbar__font-source">{font.source}</span>
                  </button>
                  <button
                    className="toolbar__font-remove"
                    onClick={() => removeFont(font.id)}
                    title="Remove font"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="toolbar__font-upload">
              <p className="toolbar__hint">Drop your font files into <code>public/fonts/</code> folder to auto-activate custom fonts.</p>
              <input
                ref={fontUploadRef}
                type="file"
                accept=".woff,.woff2,.ttf,.otf"
                multiple
                style={{ display: 'none' }}
                onChange={handleFontUpload}
              />
              <button
                className="toolbar__upload-btn"
                onClick={() => fontUploadRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Loading…' : '+ Upload Font File'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'images' && (
          <div className="toolbar__panel">
            {/* Image-specific settings */}
            <div className="toolbar__controls-grid">
              <div className="toolbar__control">
                <label className="toolbar__label">Overlay <span className="toolbar__value">{Math.round(settings.overlayOpacity * 100)}%</span></label>
                <input
                  type="range"
                  min={0}
                  max={0.9}
                  step={0.05}
                  value={settings.overlayOpacity}
                  onChange={(e) => updateSettings({ overlayOpacity: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="toolbar__toggles">
              <label className="toolbar__toggle-item">
                <span>Grayscale</span>
                <button
                  className={`toolbar__switch ${settings.grayscale ? 'toolbar__switch--on' : ''}`}
                  onClick={() => updateSettings({ grayscale: !settings.grayscale })}
                />
              </label>
            </div>

            <div className="toolbar__images-grid">
              {images.map((img, idx) => (
                <div key={idx} className="toolbar__image-thumb">
                  <img src={img} alt="" loading="lazy" />
                  <button
                    className="toolbar__image-remove"
                    onClick={() => useStore.getState().removeImage(img)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="toolbar__image-add">
              <input
                ref={imageUploadRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
              <button className="toolbar__upload-btn" onClick={() => imageUploadRef.current?.click()}>
                + Upload Image
              </button>
              <div className="toolbar__url-row">
                <input
                  className="toolbar__url-input"
                  type="url"
                  placeholder="Paste image URL…"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddImageUrl()}
                />
                <button className="toolbar__upload-btn" onClick={handleAddImageUrl}>
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Per-input settings panel
interface TextInputPanelProps {
  input: TextInput;
  index: number;
  canRemove: boolean;
  onUpdate: (partial: Partial<Omit<TextInput, 'id'>>) => void;
  onRemove: () => void;
}

function TextInputPanel({ input, index, canRemove, onUpdate, onRemove }: TextInputPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="toolbar__input-panel">
      <div className="toolbar__input-header">
        <button
          className="toolbar__input-collapse"
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <ChevronSmallIcon open={!collapsed} />
          <span className="toolbar__input-title">Layer {index + 1} <span className="toolbar__input-text">{input.text}</span></span>
        </button>
        {canRemove && (
          <button className="toolbar__input-remove" onClick={onRemove} title="Remove layer">
            ×
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="toolbar__input-body">
          {/* Text area */}
          <textarea
            className="toolbar__textarea"
            value={input.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            rows={2}
            spellCheck={false}
            placeholder="Text content…"
          />

          {/* Sliders */}
          <div className="toolbar__controls-grid">
            <div className="toolbar__control">
              <label className="toolbar__label">Size <span className="toolbar__value">{input.fontSize}px</span></label>
              <input
                type="range"
                min={16}
                max={180}
                value={input.fontSize}
                onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
              />
            </div>
            <div className="toolbar__control">
              <label className="toolbar__label">Letter Spacing <span className="toolbar__value">{input.letterSpacing.toFixed(2)}em</span></label>
              <input
                type="range"
                min={-0.1}
                max={0.5}
                step={0.01}
                value={input.letterSpacing}
                onChange={(e) => onUpdate({ letterSpacing: Number(e.target.value) })}
              />
            </div>
            <div className="toolbar__control">
              <label className="toolbar__label">Line Height <span className="toolbar__value">{input.lineHeight.toFixed(1)}</span></label>
              <input
                type="range"
                min={0.7}
                max={2.0}
                step={0.05}
                value={input.lineHeight}
                onChange={(e) => onUpdate({ lineHeight: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="toolbar__toggles">
            <label className="toolbar__toggle-item">
              <span>No wrap</span>
              <button
                className={`toolbar__switch ${input.textWrap ? 'toolbar__switch--on' : ''}`}
                onClick={() => onUpdate({ textWrap: !input.textWrap })}
              />
            </label>
            <label className="toolbar__toggle-item">
              <span>Shadow</span>
              <button
                className={`toolbar__switch ${input.textShadow ? 'toolbar__switch--on' : ''}`}
                onClick={() => onUpdate({ textShadow: !input.textShadow })}
              />
            </label>
          </div>

          {/* Alignment row */}
          <div className="toolbar__alignment-row">
            {/* Horizontal alignment */}
            <div className="toolbar__align-group">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  className={`toolbar__align-btn ${input.alignment === align ? 'toolbar__align-btn--active' : ''}`}
                  onClick={() => onUpdate({ alignment: align })}
                  title={`Align ${align}`}
                >
                  {align === 'left' ? <AlignLeftIcon /> : align === 'center' ? <AlignCenterIcon /> : <AlignRightIcon />}
                </button>
              ))}
            </div>

            {/* Vertical alignment */}
            <div className="toolbar__align-group">
              {(['top', 'center', 'bottom'] as const).map((v) => (
                <button
                  key={v}
                  className={`toolbar__align-btn ${input.verticalAlignment === v ? 'toolbar__align-btn--active' : ''}`}
                  onClick={() => onUpdate({ verticalAlignment: v })}
                  title={`Vertical ${v}`}
                >
                  {v === 'top' ? <AlignTopIcon /> : v === 'center' ? <AlignVCenterIcon /> : <AlignBottomIcon />}
                </button>
              ))}
            </div>

            {/* Color picker */}
            <div className="toolbar__color-wrap">
              <span className="toolbar__label" style={{ marginBottom: 0 }}>Color</span>
              <input
                type="color"
                className="toolbar__color"
                value={input.textColor}
                onChange={(e) => onUpdate({ textColor: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Icons
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronSmallIcon({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }}>
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function ShuffleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function AlignLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="15" y2="12" />
      <line x1="3" y1="18" x2="18" y2="18" />
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="6" y1="12" x2="18" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function AlignRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="9" y1="12" x2="21" y2="12" />
      <line x1="6" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function AlignTopIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="3" x2="21" y2="3" />
      <rect x="7" y="6" width="4" height="14" rx="1" />
      <rect x="13" y="6" width="4" height="9" rx="1" />
    </svg>
  );
}

function AlignVCenterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <rect x="7" y="4" width="4" height="16" rx="1" />
      <rect x="13" y="7" width="4" height="10" rx="1" />
    </svg>
  );
}

function AlignBottomIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="21" x2="21" y2="21" />
      <rect x="7" y="4" width="4" height="14" rx="1" />
      <rect x="13" y="9" width="4" height="9" rx="1" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function ImportIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
