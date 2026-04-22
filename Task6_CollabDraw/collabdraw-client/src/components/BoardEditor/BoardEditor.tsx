import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBoard } from '../../services/api';
import { Canvas as FabricCanvas, PencilBrush, Rect, Circle, Triangle, Line, IText, FabricObject } from 'fabric';
import type { BoardDetail } from '../../types';
import { useSignalRSync } from '../../hooks/useSignalRSync';
import Toolbar from './Toolbar';
import styles from './BoardEditor.module.css';

export type Tool = 'select' | 'pencil' | 'line' | 'rect' | 'circle' | 'triangle' | 'text' | 'eraser';

export default function BoardEditor() {
    const { boardId } = useParams<{ boardId: string }>();
    const navigate = useNavigate();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<FabricCanvas | null>(null);
    const [fabricReady, setFabricReady] = useState<FabricCanvas | null>(null);
    const [board, setBoard] = useState<BoardDetail | null>(null);
    const [activePageId, setActivePageId] = useState<string | undefined>();
    const [activeTool, setActiveTool] = useState<Tool>('pencil');
    const [strokeColor, setStrokeColor] = useState('#ffffff');
    const [fillColor, setFillColor] = useState('transparent');
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [zoom, setZoom] = useState(100);
    const isDrawingShape = useRef(false);
    const shapeStart = useRef({ x: 0, y: 0 });
    const activeShape = useRef<FabricObject | null>(null);

    const { sendElementAdded, sendElementModified, sendElementDeleted, isSyncing } =
        useSignalRSync({ boardId, pageId: activePageId, canvas: fabricReady });

    // Load board data
    useEffect(() => {
        if (!boardId) return;
        const token = localStorage.getItem('user_token');
        if (!token) { navigate('/'); return; }

        getBoard(boardId).then((b) => {
            setBoard(b);
            if (b.pages.length > 0) {
                setActivePageId(b.pages[0].id);
            }
        }).catch(() => navigate('/boards'));
    }, [boardId]);

    // Init Fabric canvas
    useEffect(() => {
        if (!canvasRef.current || fabricRef.current) return;

        const canvas = new FabricCanvas(canvasRef.current, {
            width: window.innerWidth,
            height: window.innerHeight - 52 - 48,
            backgroundColor: '#1a1a2e',
            selection: true,
        });

        fabricRef.current = canvas;
        setFabricReady(canvas);

        const handleResize = () => {
            canvas.setDimensions({
                width: window.innerWidth,
                height: window.innerHeight - 52 - 48,
            });
            canvas.renderAll();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            canvas.dispose();
            fabricRef.current = null;
            setFabricReady(null);
        };
    }, []);

    // Canvas events for sync: object added, modified, removed
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        const onPathCreated = (opt: any) => {
            const path = opt.path;
            if (path && !isSyncing.current) {
                sendElementAdded(path);
            }
        };

        const onObjectModified = (opt: any) => {
            const target = opt.target;
            if (target && !isSyncing.current) {
                sendElementModified(target);
            }
        };

        canvas.on('path:created', onPathCreated);
        canvas.on('object:modified', onObjectModified);

        return () => {
            canvas.off('path:created', onPathCreated);
            canvas.off('object:modified', onObjectModified);
        };
    }, [sendElementAdded, sendElementModified]);

    // Apply tool changes
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        canvas.isDrawingMode = activeTool === 'pencil';
        canvas.selection = activeTool === 'select';

        if (activeTool === 'pencil') {
            const brush = new PencilBrush(canvas);
            brush.color = strokeColor;
            brush.width = strokeWidth;
            canvas.freeDrawingBrush = brush;
        }

        if (activeTool === 'select') {
            canvas.defaultCursor = 'default';
        } else {
            canvas.defaultCursor = 'crosshair';
        }

        canvas.forEachObject((obj) => {
            obj.selectable = activeTool === 'select';
            obj.evented = activeTool === 'select' || activeTool === 'eraser';
        });

        canvas.renderAll();
    }, [activeTool, strokeColor, strokeWidth]);

    // Shape drawing handlers
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        const onMouseDown = (opt: any) => {
            if (['select', 'pencil', 'text'].includes(activeTool)) return;

            if (activeTool === 'eraser') {
                const target = opt.target;
                if (target) {
                    sendElementDeleted(target);
                    canvas.remove(target);
                    canvas.renderAll();
                }
                return;
            }

            const pointer = canvas.getScenePoint(opt.e);
            isDrawingShape.current = true;
            shapeStart.current = { x: pointer.x, y: pointer.y };

            let shape: FabricObject | null = null;
            const commonProps = {
                left: pointer.x,
                top: pointer.y,
                stroke: strokeColor,
                strokeWidth: strokeWidth,
                fill: fillColor === 'transparent' ? 'transparent' : fillColor,
                selectable: false,
                evented: false,
            };

            switch (activeTool) {
                case 'rect':
                    shape = new Rect({ ...commonProps, width: 0, height: 0 });
                    break;
                case 'circle':
                    shape = new Circle({ ...commonProps, radius: 0 });
                    break;
                case 'triangle':
                    shape = new Triangle({ ...commonProps, width: 0, height: 0 });
                    break;
                case 'line':
                    shape = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
                        stroke: strokeColor,
                        strokeWidth: strokeWidth,
                        selectable: false,
                        evented: false,
                    });
                    break;
            }

            if (shape) {
                canvas.add(shape);
                activeShape.current = shape;
            }
        };

        const onMouseMove = (opt: any) => {
            if (!isDrawingShape.current || !activeShape.current) return;

            const pointer = canvas.getScenePoint(opt.e);
            const startX = shapeStart.current.x;
            const startY = shapeStart.current.y;
            const shape = activeShape.current;

            if (shape instanceof Rect || shape instanceof Triangle) {
                const width = Math.abs(pointer.x - startX);
                const height = Math.abs(pointer.y - startY);
                shape.set({
                    left: Math.min(startX, pointer.x),
                    top: Math.min(startY, pointer.y),
                    width,
                    height,
                });
            } else if (shape instanceof Circle) {
                const radius = Math.sqrt(
                    Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2)
                ) / 2;
                shape.set({
                    left: (startX + pointer.x) / 2 - radius,
                    top: (startY + pointer.y) / 2 - radius,
                    radius,
                });
            } else if (shape instanceof Line) {
                shape.set({ x2: pointer.x, y2: pointer.y });
            }

            canvas.renderAll();
        };

        const onMouseUp = () => {
            if (!isDrawingShape.current || !activeShape.current) return;
            isDrawingShape.current = false;
            const shape = activeShape.current;
            shape.setCoords();

            // Send to server
            sendElementAdded(shape);

            activeShape.current = null;
        };

        canvas.on('mouse:down', onMouseDown);
        canvas.on('mouse:move', onMouseMove);
        canvas.on('mouse:up', onMouseUp);

        return () => {
            canvas.off('mouse:down', onMouseDown);
            canvas.off('mouse:move', onMouseMove);
            canvas.off('mouse:up', onMouseUp);
        };
    }, [activeTool, strokeColor, fillColor, strokeWidth, sendElementAdded, sendElementDeleted]);

    // Text tool
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        const onDoubleClick = (opt: any) => {
            if (activeTool !== 'text') return;
            const pointer = canvas.getScenePoint(opt.e);
            const text = new IText('Type here', {
                left: pointer.x,
                top: pointer.y,
                fontSize: 20,
                fill: strokeColor,
                fontFamily: 'sans-serif',
                selectable: true,
                evented: true,
            });
            canvas.add(text);
            canvas.setActiveObject(text);
            text.enterEditing();

            // Send after user finishes editing
            text.on('editing:exited', () => {
                if (!(text as any)._syncId) {
                    sendElementAdded(text);
                } else {
                    sendElementModified(text);
                }
            });

            canvas.renderAll();
        };

        canvas.on('mouse:dblclick', onDoubleClick);
        return () => { canvas.off('mouse:dblclick', onDoubleClick); };
    }, [activeTool, strokeColor, sendElementAdded, sendElementModified]);

    // Zoom
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        const onWheel = (opt: any) => {
            const e = opt.e as WheelEvent;
            e.preventDefault();
            let newZoom = canvas.getZoom() * (e.deltaY > 0 ? 0.95 : 1.05);
            newZoom = Math.max(0.1, Math.min(5, newZoom));
            canvas.zoomToPoint(canvas.getScenePoint(e), newZoom);
            setZoom(Math.round(newZoom * 100));
            canvas.renderAll();
        };

        canvas.on('mouse:wheel', onWheel);
        return () => { canvas.off('mouse:wheel', onWheel); };
    }, []);

    // Pan with middle mouse
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        let isPanning = false;
        let lastX = 0;
        let lastY = 0;

        const onMouseDown = (opt: any) => {
            const e = opt.e as MouseEvent;
            if (e.button === 1) {
                isPanning = true;
                lastX = e.clientX;
                lastY = e.clientY;
                canvas.defaultCursor = 'grabbing';
                e.preventDefault();
            }
        };

        const onMouseMove = (opt: any) => {
            if (!isPanning) return;
            const e = opt.e as MouseEvent;
            const vpt = canvas.viewportTransform!;
            vpt[4] += e.clientX - lastX;
            vpt[5] += e.clientY - lastY;
            lastX = e.clientX;
            lastY = e.clientY;
            canvas.requestRenderAll();
        };

        const onMouseUp = () => {
            isPanning = false;
        };

        canvas.on('mouse:down', onMouseDown);
        canvas.on('mouse:move', onMouseMove);
        canvas.on('mouse:up', onMouseUp);

        return () => {
            canvas.off('mouse:down', onMouseDown);
            canvas.off('mouse:move', onMouseMove);
            canvas.off('mouse:up', onMouseUp);
        };
    }, []);

    const handleExport = () => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        const dataURL = canvas.toDataURL({ format: 'jpeg', quality: 0.9, multiplier: 2 });
        const link = document.createElement('a');
        link.download = `${board?.name || 'board'}_${new Date().toISOString().slice(0, 10)}.jpg`;
        link.href = dataURL;
        link.click();
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate('/boards')}>
                    ← Back
                </button>
                <span className={styles.boardName}>{board?.name || 'Loading...'}</span>
                <button className={styles.exportBtn} onClick={handleExport}>
                    Export JPEG
                </button>
            </header>

            <div className={styles.canvasArea}>
                <canvas ref={canvasRef} />
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