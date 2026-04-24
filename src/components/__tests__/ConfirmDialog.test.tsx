import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ConfirmDialog } from '../ConfirmDialog'

describe('ConfirmDialog', () => {
  afterEach(() => {
    cleanup()
  })
  it('should not render when open is false', () => {
    const { container } = render(
      <ConfirmDialog
        open={false}
        title="Test Title"
        message="Test message"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(container.firstChild).toBeNull()
  })

  it('should render when open is true', () => {
    render(
      <ConfirmDialog
        open={true}
        title="Test Title"
        message="Test message"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('should call onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog
        open={true}
        title="Delete Font"
        message="Are you sure?"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    )

    const buttons = screen.getAllByRole('button')
    const confirmButton = buttons.find((btn) => btn.textContent === 'Delete')
    expect(confirmButton).toBeDefined()
    fireEvent.click(confirmButton!)

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('should call onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn()
    render(
      <ConfirmDialog
        open={true}
        title="Delete Font"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    )

    const buttons = screen.getAllByRole('button')
    const cancelButton = buttons.find((btn) => btn.textContent === 'Cancel')
    expect(cancelButton).toBeDefined()
    fireEvent.click(cancelButton!)

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('should use custom button labels', () => {
    render(
      <ConfirmDialog
        open={true}
        title="Test"
        message="Test"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        confirmLabel="Yes"
        cancelLabel="No"
      />,
    )

    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
  })

  it('should render with default button labels', () => {
    render(
      <ConfirmDialog
        open={true}
        title="Test"
        message="Test"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    const buttons = screen.getAllByRole('button')
    expect(buttons[0]).toHaveTextContent('Cancel')
    expect(buttons[1]).toHaveTextContent('Delete')
  })
})
