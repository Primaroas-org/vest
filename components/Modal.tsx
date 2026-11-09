import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  onCancel?: () => void; // Optional custom cancel handler
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'confirm' | 'alert';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'confirm'
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white dark:bg-charcoal rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md p-8 z-10">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-primary/10 dark:bg-primary/20 p-3 rounded-xl">
            <span className="material-icons-round text-primary text-3xl">
              {type === 'confirm' ? 'help_outline' : 'info'}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-extrabold text-charcoal dark:text-white font-display text-center mb-4">
          {title}
        </h3>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-300 text-center mb-8 leading-relaxed">
          {message}
        </p>

        {/* Buttons */}
        <div className="flex gap-4">
          {type === 'confirm' && (
            <button
              onClick={() => {
                // Use custom onCancel handler if provided
                if (onCancel) {
                  onCancel();
                } else if (cancelText?.includes('Card') || cancelText?.includes('card')) {
                  // Fallback: navigate to dashboard (but prefer onCancel prop)
                  window.location.href = '/dashboard';
                } else {
                  // For other cases (like "Logout Now"), just call onClose
                  onClose();
                }
              }}
              className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-charcoal dark:text-white py-3 rounded-xl font-bold transition-all active:scale-95">
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`flex-1 bg-primary hover:bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/25 transition-all active:scale-95 ${
              type === 'confirm' ? '' : 'w-full'
            }`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
