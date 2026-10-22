import {useEffect, useId, useRef, type ReactNode} from 'react';
import {X, ArrowLeft, ChevronLeft, ChevronRight} from 'lucide-react';

export function Dialog({open, title, children, onClose}: {open: boolean; title: string; children: ReactNode; onClose: () => void}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const prior = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    window.dispatchEvent(new CustomEvent('capm:dialog', {detail: true}));
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      window.dispatchEvent(new CustomEvent('capm:dialog', {detail: false}));
      prior?.focus({preventScroll: true});
    };
  }, [open]);
  return <dialog ref={ref} className="app-dialog" aria-labelledby={titleId} onCancel={e => {e.preventDefault(); close.current();}} data-lenis-prevent>
    <article><header><h2 id={titleId}>{title}</h2><button className="icon-button" aria-label="Cerrar diálogo" onClick={onClose}><X size={20}/></button></header>{children}</article>
  </dialog>;
}

export function PageHeading({eyebrow, title, text, action}: {eyebrow?: string; title: string; text: string; action?: ReactNode}) {
  return <div className="page-title"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1><p>{text}</p></div>{action}</div>;
}

export function Pagination({page, total, size = 12, onChange}: {page: number; total: number; size?: number; onChange: (page: number) => void}) {
  const pages = Math.max(1, Math.ceil(total / size));
  return <div className="pagination"><span>{total ? (page - 1) * size + 1 : 0}–{Math.min(page * size, total)} de {total}</span><div>
    <button className="button secondary small" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Página anterior"><ChevronLeft size={18}/></button>
    <span aria-live="polite">{page} / {pages}</span><button className="button secondary small" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Página siguiente"><ChevronRight size={18}/></button>
  </div></div>;
}

export function BackButton({children = 'Volver', onClick}: {children?: ReactNode; onClick: () => void}) {
  return <button className="button secondary small" onClick={onClick}><ArrowLeft size={17}/>{children}</button>;
}
