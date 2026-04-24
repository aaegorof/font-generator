interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
}

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-xl font-bold mb-2 text-gray-900">{title}</h2>
        <p className="text-gray-600 mb-4">{message}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
