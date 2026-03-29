import React, { useCallback, useRef, useState } from 'react'
import { useStore } from '../../../store/useStore'

export function ImagesPage() {
  const { settings, updateSettings, images, addImage } = useStore()

  const imageUploadRef = useRef<HTMLInputElement>(null)
  const [urlInput, setUrlInput] = useState('')

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      files.forEach((file) => {
        const url = URL.createObjectURL(file)
        addImage(url)
      })
      if (imageUploadRef.current) imageUploadRef.current.value = ''
    },
    [addImage],
  )

  const handleAddImageUrl = useCallback(() => {
    const trimmed = urlInput.trim()
    if (trimmed) {
      addImage(trimmed)
      setUrlInput('')
    }
  }, [urlInput, addImage])

  return (
    <div className="toolbar__panel">
      <div className="toolbar__controls-grid">
        <div className="toolbar__control">
          <label className="toolbar__label">
            Overlay{' '}
            <span className="toolbar__value">{Math.round(settings.overlayOpacity * 100)}%</span>
          </label>
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
  )
}
