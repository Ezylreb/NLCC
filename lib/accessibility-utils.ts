/**
 * Accessibility Utilities
 * Helper functions and guidelines for WCAG 2.1 compliance
 */

/**
 * Common ARIA labels and roles for components
 */
export const ARIA_LABELS = {
  // Navigation
  sidebar: { role: 'navigation', 'aria-label': 'Main navigation' },
  mainNav: { role: 'navigation', 'aria-label': 'Main navigation menu' },
  tabs: { role: 'tablist', 'aria-label': 'Main tabs' },
  
  // Forms
  form: { role: 'form' },
  formGroup: { role: 'group' },
  input: (label: string) => ({ 'aria-label': label }),
  
  // Buttons
  button: (label: string) => ({ 'aria-label': label, 'aria-pressed': false }),
  iconButton: (label: string) => ({ 'aria-label': label, 'aria-pressed': false }),
  
  // Dialogs & Modals
  modal: { role: 'dialog', 'aria-modal': true, 'aria-labelledby': 'modal-title' },
  closeButton: { 'aria-label': 'Close dialog' },
  
  // Loading states
  spinner: { role: 'status', 'aria-live': 'polite', 'aria-label': 'Loading' },
  progressBar: { role: 'progressbar', 'aria-valuenow': 0, 'aria-valuemin': 0, 'aria-valuemax': 100 },
  
  // Tables
  table: { role: 'table' },
  tableHeader: { role: 'rowgroup' },
  tableBody: { role: 'rowgroup' },
  row: { role: 'row' },
  cell: { role: 'cell' },
  headerCell: { role: 'columnheader' },
  
  // Lists
  list: { role: 'list' },
  listItem: { role: 'listitem' },
  
  // Alerts
  alert: { role: 'alert', 'aria-live': 'assertive' },
  alertWarning: { role: 'alert', 'aria-live': 'polite' },
  
  // Status regions
  status: { role: 'status', 'aria-live': 'polite', 'aria-atomic': true },
  log: { role: 'log', 'aria-live': 'polite' },
};

/**
 * Get keyboard event handler for buttons
 * Allows activation with Enter or Space keys
 */
export function getKeyboardEventHandler(onActivate: () => void) {
  return (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onActivate();
    }
  };
}

/**
 * Announce message to screen readers
 * @param message - Message to announce
 * @param priority - 'polite' (default) or 'assertive'
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only'; // Screen reader only class
  announcement.textContent = message;
  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Focus management utilities
 */
export const FocusUtils = {
  /**
   * Move focus to element
   */
  setFocus: (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.focus();
      // For non-focusable elements, make them focusable
      if (!['button', 'a', 'input', 'textarea', 'select'].includes(element.tagName.toLowerCase())) {
        element.setAttribute('tabindex', '0');
      }
    }
  },

  /**
   * Trap focus within a modal
   */
  trapFocus: (modalElement: HTMLElement, onEscape?: () => void) => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }

      if (e.key === 'Tab') {
        const focusableElements = modalElement.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    modalElement.addEventListener('keydown', handleKeyDown);
    return () => modalElement.removeEventListener('keydown', handleKeyDown);
  },

  /**
   * Restore focus to previously focused element
   */
  restoreFocus: (() => {
    let previouslyFocused: Element | null = null;
    return {
      save: () => {
        previouslyFocused = document.activeElement;
      },
      restore: () => {
        if (previouslyFocused && previouslyFocused instanceof HTMLElement) {
          previouslyFocused.focus();
        }
      },
    };
  })(),
};

/**
 * Color contrast checker (WCAG AA standard)
 * @param foreground - Hex color code (e.g., '#FFFFFF')
 * @param background - Hex color code (e.g., '#000000')
 * @returns Contrast ratio
 */
export function getContrastRatio(foreground: string, background: string): number {
  const getLuminance = (hex: string) => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luminance =
      (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance <= 0.03928 ? luminance / 12.92 : Math.pow((luminance + 0.055) / 1.055, 2.4);
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG standards
 * @param ratio - Contrast ratio
 * @param level - 'AA' (4.5:1) or 'AAA' (7:1)
 * @param largeText - Whether text is large (18pt+) or bold (14pt+)
 */
export function meetsContrastStandard(
  ratio: number,
  level: 'AA' | 'AAA' = 'AA',
  largeText: boolean = false
): boolean {
  if (level === 'AAA') return ratio >= 7;
  // AA level
  return largeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Skip link for keyboard navigation
 * Add to start of page to allow users to skip to main content
 */
export const SkipLink = (): JSX.Element => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:bg-brand-purple focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:z-50"
  >
    Skip to main content
  </a>
);

/**
 * Accessible icon button component
 */
export interface AccessibleIconButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  ariaPressed?: boolean;
  title?: string;
}

export const AccessibleIconButton: React.FC<AccessibleIconButtonProps> = ({
  icon,
  label,
  onClick,
  disabled = false,
  className = '',
  ariaPressed = false,
  title,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center justify-center rounded-lg p-2 transition-all focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2 ${className}`}
    aria-label={label}
    aria-pressed={ariaPressed}
    aria-disabled={disabled}
    title={title || label}
  >
    {icon}
  </button>
);

/**
 * Accessible dialog component
 */
export interface AccessibleDialogProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const AccessibleDialog: React.FC<AccessibleDialogProps> = ({
  isOpen,
  title,
  onClose,
  children,
  className = '',
}) => {
  React.useEffect(() => {
    if (isOpen) {
      FocusUtils.trapFocus(document.activeElement?.parentElement as HTMLElement, onClose);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="presentation"
    >
      <div
        className={`bg-slate-900 rounded-lg p-6 max-w-md w-full ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <h2 id="dialog-title" className="text-xl font-bold text-white mb-4">
          {title}
        </h2>
        {children}
        <div className="mt-6 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all"
            aria-label="Close dialog"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
