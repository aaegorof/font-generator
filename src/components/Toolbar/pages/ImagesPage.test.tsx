import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ImagesPage } from './ImagesPage'

const addImage = vi.hoisted(() => vi.fn())

vi.mock('../../../store/useStore', () => ({
  useStore: Object.assign(
    vi.fn(() => ({
      settings: { overlayOpacity: 0.25, grayscale: false },
      updateSettings: vi.fn(),
      images: [],
      disabledImages: [],
      toggleImageDisabled: vi.fn(),
      addImage: addImage,
    })),
    { getState: () => ({ removeImage: vi.fn() }) },
  ),
}))

describe('ImagesPage upload', () => {
  beforeEach(() => {
    addImage.mockClear()
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ url: '/uploaded-images/test.png' }),
        } as Response),
      ),
    )
  })

  it('POSTs each file and passes returned url to addImage', async () => {
    const user = userEvent.setup()
    render(<ImagesPage />)
    const png = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ])
    const file = new File([png], 'a.png', { type: 'image/png' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)
    await waitFor(() => {
      expect(addImage).toHaveBeenCalledWith('/uploaded-images/test.png')
    })
    expect(fetch).toHaveBeenCalledWith(
      '/upload-image',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('shows inline error on 409 and does not addImage', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 409,
          json: () => Promise.resolve({ error: 'File already exists' }),
        } as Response),
      ),
    )
    const user = userEvent.setup()
    render(<ImagesPage />)
    const file = new File([new Uint8Array([1])], 'dup.png', { type: 'image/png' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/File already exists/)
    })
    expect(addImage).not.toHaveBeenCalled()
  })

  it('adds successes and concatenates errors with Promise.allSettled', async () => {
    let call = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        call += 1
        if (call === 1) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ url: '/uploaded-images/ok.png' }),
          } as Response)
        }
        return Promise.resolve({
          ok: false,
          status: 409,
          json: () => Promise.resolve({ error: 'File already exists' }),
        } as Response)
      }),
    )
    const user = userEvent.setup()
    render(<ImagesPage />)
    const f1 = new File([new Uint8Array([1])], 'ok.png', { type: 'image/png' })
    const f2 = new File([new Uint8Array([2])], 'bad.png', { type: 'image/png' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, [f1, f2])
    await waitFor(() => {
      expect(addImage).toHaveBeenCalledTimes(1)
      expect(addImage).toHaveBeenCalledWith('/uploaded-images/ok.png')
    })
    expect(screen.getByRole('alert')).toHaveTextContent(/bad\.png/)
  })
})
