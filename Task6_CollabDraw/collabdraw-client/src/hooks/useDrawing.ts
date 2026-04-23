import { useEffect, useRef } from 'react';
import { Canvas as FabricCanvas, PencilBrush, Rect, Circle, Triangle, Line, IText, FabricObject } from 'fabric';
import type { Tool } from '../components/BoardEditor/BoardEditor';

interface UseDrawingProps {
    fabricRef: React.RefObject<FabricCanvas | null>;
    activeTool: Tool;
    strokeColor: string;
    fillColor: string;
    strokeWidth: number;
    sendElementAdded: (obj: any) => void;
    sendElementModified: (obj: any) => void;
    sendElementDeleted: (obj: any) => void;
    isSyncing: React.RefObject<boolean>;
}

export function useDrawing({
                               fabricRef,
                               activeTool,
                               strokeColor,
                               fillColor,
                               strokeWidth,
                               sendElementAdded,
                               sendElementModified,
                               sendElementDeleted,
                               isSyncing,
                           }: UseDrawingProps) {
    const isDrawingShape = useRef(false);
    const shapeStart = useRef({ x: 0, y: 0 });
    const activeShape = useRef<FabricObject | null>(null);

    // Canvas events for sync: path created, object modified
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

    // Text tool (double-click)
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
}