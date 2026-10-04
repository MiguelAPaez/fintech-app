import { useEffect, useRef, type ReactNode } from 'react';
import Icon from './Icon';

interface Props { title: string; onClose: () => void; variant?: 'dialog' | 'sheet'; children: ReactNode }

/** Native <dialog>: gives us focus trapping, Esc-to-close and a ::backdrop for free. */
export default function Modal({ title, onClose, variant = 'dialog', children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${variant === 'sheet' ? 'sheet' : ''}`}
      aria-label={title}
      onCancel={e => { e.preventDefault(); onClose(); }}
      onClick={e => { if (e.target === ref.current) onClose(); }}
    >
      <div className="modal-body">
        <header className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
