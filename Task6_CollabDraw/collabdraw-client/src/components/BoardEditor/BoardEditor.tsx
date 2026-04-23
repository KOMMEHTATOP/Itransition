import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { BoardDetail, PageItem } from '../../types';
import { useCanvas } from '../../hooks/useCanvas';
import { useDrawing } from '../../hooks/useDrawing';
import { useSignalRSync } from '../../hooks/useSignalRSync';
import Toolbar from './Toolbar';
import PagePanel from './PagePanel';
import styles from './BoardEditor.module.css';
import { getBoard, createPage, deletePage, updateThumbnail, updatePage } from '../../services/api';

export type Tool = 'select' | 'pencil' | 'line' | 'rect' | 'circle' | 'triangle' | 'text' | 'eraser';

export default function BoardEditor() {
    const { boardId } = useParams<{ boardId: string }>();
    const navigate = useNavigate();
    const canvasElRef = useRef<HTMLCanvasElement>(null);

    const [board, setBoard] = useState<BoardDetail | null>(null);
    const [pages, setPages] = useState<PageItem[]>([]);
    const [activePageId, setActivePageId] = useState<string | undefined>();
    const [activeTool, setActiveTool] = useState<Tool>('pencil');
    const [strokeColor, setStrokeColor] = useState('#ffffff');
    const [fillColor, setFillColor] = useState('transparent');
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [pageThumbnails, setPageThumbnails] = useState<Record<string, string>>({});

    // Canvas: init, resize, zoom, pan
    const { fabricRef, fabricReady, zoom } = useCanvas({ canvasRef: canvasElRef });

    // SignalR: real-time sync
    const {
        sendElementAdded, sendElementModified, sendElementDeleted,
        sendPageAdded, sendPageDeleted: sendPageDeletedSignalR,
        isSyncing,
    } = useSignalRSync({
        boardId,
        pageId: activePageId,
        canvas: fabricReady,
        onPageAdded: (pageId, title, sortOrder) => {
            setPages(prev => {
                if (prev.some(p => p.id === pageId)) return prev;
                return [...prev, { id: pageId, title, sortOrder }]
                    .sort((a, b) => a.sortOrder - b.sortOrder);
            });
        },
        onPageDeleted: (pageId) => {
            setPages(prev => {
                const updated = prev.filter(p => p.id !== pageId);
                if (pageId === activePageId && updated.length > 0) {
                    setActivePageId(updated[0].id);
                }
                return updated;
            });
            setPageThumbnails(prev => {
                const next = { ...prev };
                delete next[pageId];
                return next;
            });
        },
    });

    // Drawing: shapes, pencil, text, eraser
    useDrawing({
        fabricRef,
        activeTool,
        strokeColor,
        fillColor,
        strokeWidth,
        sendElementAdded,
        sendElementModified,
        sendElementDeleted,
        isSyncing,
    });

    // Load board data
    useEffect(() => {
        if (!boardId) return;
        const token = localStorage.getItem('user_token');
        if (!token) { navigate('/'); return; }

        getBoard(boardId).then((b) => {
            setBoard(b);
            const sortedPages = [...b.pages].sort((a, b) => a.sortOrder - b.sortOrder);
            setPages(sortedPages);
            if (sortedPages.length > 0) {
                setActivePageId(sortedPages[0].id);
            }
        }).catch(() => navigate('/boards'));
    }, [boardId]);

    // --- Snapshot helper ---

    const capturePageSnapshot = useCallback(() => {
        const canvas = fabricRef.current;
        if (!canvas || !activePageId) return;

        try {
            const dataURL = canvas.toDataURL({
                format: 'jpeg',
                quality: 0.5,
                multiplier: 150 / canvas.getWidth(),
            });
            setPageThumbnails(prev => ({ ...prev, [activePageId]: dataURL }));
        } catch {
            // ignore snapshot errors
        }
    }, [activePageId]);

    // --- Thumbnail for board list ---

    const saveBoardThumbnail = useCallback(async () => {
        const canvas = fabricRef.current;
        if (!canvas || !boardId) return;

        try {
            const dataURL = canvas.toDataURL({
                format: 'jpeg',
                quality: 0.6,
                multiplier: 300 / canvas.getWidth(),
            });
            const base64 = dataURL.split(',')[1];
            await updateThumbnail(boardId, base64);
        } catch (err) {
            console.error('Failed to save thumbnail:', err);
        }
    }, [boardId]);

    const handleBack = useCallback(async () => {
        await saveBoardThumbnail();
        navigate('/boards');
    }, [saveBoardThumbnail, navigate]);

    // --- Page actions ---

    const handleSelectPage = useCallback((pageId: string) => {
        if (pageId === activePageId) return;
        // Snapshot current page before switching
        capturePageSnapshot();
        setActivePageId(pageId);
    }, [activePageId, capturePageSnapshot]);

    const handleAddPage = useCallback(async () => {
        if (!boardId) return;
        try {
            // Snapshot current page before switching
            capturePageSnapshot();
            const newPage = await createPage(boardId);
            setPages(prev => [...prev, newPage].sort((a, b) => a.sortOrder - b.sortOrder));
            setActivePageId(newPage.id);
            sendPageAdded(newPage.id, newPage.title, newPage.sortOrder);
        } catch (err) {
            console.error('Failed to create page:', err);
        }
    }, [boardId, sendPageAdded, capturePageSnapshot]);

    const handleDeletePage = useCallback(async (pageId: string) => {
        if (!boardId || pages.length <= 1) return;

        try {
            await deletePage(boardId, pageId);
            setPages(prev => {
                const updated = prev.filter(p => p.id !== pageId);
                if (pageId === activePageId && updated.length > 0) {
                    setActivePageId(updated[0].id);
                }
                return updated;
            });
            setPageThumbnails(prev => {
                const next = { ...prev };
                delete next[pageId];
                return next;
            });
            sendPageDeletedSignalR(pageId);
        } catch (err) {
            console.error('Failed to delete page:', err);
        }
    }, [boardId, pages.length, activePageId, sendPageDeletedSignalR]);

    // --- Export ---

    const handleExport = useCallback(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        const dataURL = canvas.toDataURL({ format: 'jpeg', quality: 0.9, multiplier: 2 });
        const link = document.createElement('a');
        link.download = `${board?.name || 'board'}_${new Date().toISOString().slice(0, 10)}.jpg`;
        link.href = dataURL;
        link.click();
    }, [board?.name]);

    const handleRenamePage = useCallback(async (pageId: string, newTitle: string) => {
        if (!boardId) return;
        try {
            await updatePage(boardId, pageId, newTitle);
            setPages(prev => prev.map(p => p.id === pageId ? { ...p, title: newTitle } : p));
        } catch (err) {
            console.error('Failed to rename page:', err);
        }
    }, [boardId]);
    
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button className={styles.backBtn} onClick={handleBack}>
                    ← Back
                </button>
                <span className={styles.boardName}>{board?.name || 'Loading...'}</span>
                <button className={styles.exportBtn} onClick={handleExport}>
                    Export JPEG
                </button>
            </header>

            <div className={styles.workspace}>
                <PagePanel
                    pages={pages}
                    activePageId={activePageId}
                    onSelectPage={handleSelectPage}
                    onAddPage={handleAddPage}
                    onDeletePage={handleDeletePage}
                    onRenamePage={handleRenamePage}
                    thumbnails={pageThumbnails}
                />

                <div className={styles.canvasArea}>
                    <canvas ref={canvasElRef} />
                </div>
            </div>

            <Toolbar
                activeTool={activeTool}
                setActiveTool={setActiveTool}
                strokeColor={strokeColor}
                setStrokeColor={setStrokeColor}
                fillColor={fillColor}
                setFillColor={setFillColor}
                strokeWidth={strokeWidth}
                setStrokeWidth={setStrokeWidth}
                zoom={zoom}
            />
        </div>
    );
}