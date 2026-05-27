import { useEffect, useReducer, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Loader2, AlertTriangle } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href;

// ─── Page renderer ───────────────────────────────────────────────────────────

interface PdfPageProps {
  pdf: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  containerWidth: number;
}

function PdfPage({ pdf, pageNumber, containerWidth }: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  useEffect(() => {
    let cancelled = false;
    pdf.getPage(pageNumber).then((page) => {
      if (cancelled || !canvasRef.current) return;
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = containerWidth / baseViewport.width;
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d')!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      renderTaskRef.current?.cancel();
      renderTaskRef.current = page.render({ canvasContext: ctx, viewport, canvas });
      renderTaskRef.current.promise.catch(() => {});
    });
    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
    };
  }, [pdf, pageNumber, containerWidth]);

  return <canvas ref={canvasRef} style={{ width: '100%', display: 'block', marginBottom: 4 }} />;
}

// ─── State machine ───────────────────────────────────────────────────────────

type PdfState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; pdf: pdfjsLib.PDFDocumentProxy; pageCount: number }
  | { status: 'error'; message: string };

type PdfAction =
  | { type: 'load' }
  | { type: 'ready'; pdf: pdfjsLib.PDFDocumentProxy; pageCount: number }
  | { type: 'error'; message: string };

function reducer(_: PdfState, action: PdfAction): PdfState {
  switch (action.type) {
    case 'load':
      return { status: 'loading' };
    case 'ready':
      return { status: 'ready', pdf: action.pdf, pageCount: action.pageCount };
    case 'error':
      return { status: 'error', message: action.message };
  }
}

// ─── PdfViewer ───────────────────────────────────────────────────────────────

interface PdfViewerProps {
  url: string;
  height?: number;
}

export function PdfViewer({ url, height = 560 }: PdfViewerProps) {
  const [state, dispatch] = useReducer(reducer, { status: 'idle' });
  const [containerWidth, setContainerWidth] = useState(800);
  const containerRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  // Track container width for responsive page scaling
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setContainerWidth(w);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Load PDF document
  useEffect(() => {
    let cancelled = false;
    dispatch({ type: 'load' });

    const task = pdfjsLib.getDocument(url);
    task.promise
      .then((doc) => {
        if (cancelled) {
          doc.destroy();
          return;
        }
        docRef.current?.destroy();
        docRef.current = doc;
        dispatch({ type: 'ready', pdf: doc, pageCount: doc.numPages });
      })
      .catch((err: unknown) => {
        if (!cancelled) dispatch({ type: 'error', message: String(err) });
      });

    return () => {
      cancelled = true;
      task.destroy().catch(() => {});
    };
  }, [url]);

  // Cleanup document on unmount
  useEffect(() => {
    return () => {
      docRef.current?.destroy();
    };
  }, []);

  if (state.status === 'idle' || state.status === 'loading') {
    return (
      <div
        style={{ height }}
        className="flex flex-col items-center justify-center gap-3 text-slate-400"
      >
        <Loader2 size={22} className="animate-spin" />
        <span className="text-[12px]">Rendering PDF…</span>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div
        style={{ height }}
        className="flex flex-col items-center justify-center gap-3 px-6 text-center"
      >
        <AlertTriangle size={22} className="text-amber-400" />
        <p className="text-[12px] text-slate-500">Could not render PDF: {state.message}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ height, overflowY: 'auto' }}
      className="w-full bg-slate-100 p-2"
    >
      {Array.from({ length: state.pageCount }, (_, i) => (
        <PdfPage
          key={i + 1}
          pdf={state.pdf}
          pageNumber={i + 1}
          containerWidth={Math.max(containerWidth - 16, 200)}
        />
      ))}
    </div>
  );
}
