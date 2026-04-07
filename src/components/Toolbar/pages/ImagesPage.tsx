import React, { useCallback, useRef, useState } from 'react'
import { useStore } from '../../../store/useStore'

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7 3C4.2 3 1.8 4.8 1 7c.8 2.2 3.2 4 6 4s5.2-1.8 6-4c-.8-2.2-3.2-4-6-4z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="7" r="1.8" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 2l10 10M5.5 5.6A1.8 1.8 0 009.4 8.5M3.2 3.7C2 4.6 1.3 5.8 1 7c.8 2.2 3.2 4 6 4 1.1 0 2.1-.3 3-.7M5 3.2C5.6 3.1 6.3 3 7 3c2.8 0 5.2 1.8 6 4-.3.9-.9 1.7-1.6 2.3"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ImagesPage() {
  const { settings, updateSettings, images, disabledImages, toggleImageDisabled, addImage } =
    useStore()

  const imageUploadRef = useRef<HTMLInputElement>(null)
  const [urlInput, setUrlInput] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length === 0) return

      setUploadError(null)

      const results = await Promise.allSettled(
        files.map(async (file) => {
          const formData = new FormData()
          formData.append('file', file)
          const res = await fetch('/upload-image', { method: 'POST', body: formData })
          const data = (await res.json().catch(() => ({}))) as { error?: string; url?: string }
          if (res.status === 409) {
            throw new Error(data.error ?? 'File already exists')
          }
          if (!res.ok) {
            throw new Error(data.error ?? 'Upload failed')
          }
          if (!data.url) throw new Error('Upload failed')
          return data.url
        }),
      )

      const errors: string[] = []
      for (let i = 0; i < results.length; i++) {
        const r = results[i]
        const file = files[i]
        if (r.status === 'fulfilled') {
          addImage(r.value)
        } else {
          const msg = r.reason instanceof Error ? r.reason.message : 'Upload failed'
          errors.push(`${file.name}: ${msg}`)
        }
      }

      setUploadError(errors.length > 0 ? errors.join('; ') : null)
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
        {images.map((img, idx) => {
          const isDisabled = disabledImages.includes(img)
          return (
            <div
              key={idx}
              className={`toolbar__image-thumb${isDisabled ? ' toolbar__image-thumb--disabled' : ''}`}
            >
              <img src={img} alt="" loading="lazy" />
              <div className="toolbar__image-actions">
                <button
                  className="toolbar__image-toggle"
                  onClick={() => toggleImageDisabled(img)}
                  title={isDisabled ? 'Enable' : 'Disable'}
                >
                  {isDisabled ? <EyeOffIcon /> : <EyeIcon />}
                </button>
                <button
                  className="toolbar__image-remove"
                  onClick={() => useStore.getState().removeImage(img)}
                  title="Delete"
                >
                  ×
                </button>
              </div>
            </div>
          )
        })}
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
        {uploadError ? (
          <p className="toolbar__upload-error" role="alert">
            {uploadError}
          </p>
        ) : null}
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
