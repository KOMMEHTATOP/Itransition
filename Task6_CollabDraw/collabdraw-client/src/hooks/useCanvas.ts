import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas as FabricCanvas } from 'fabric';

interface UseCanvasProps {
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function useCanvas({ canvasRef }: UseCanvasProps) {
    const fabricRef = useRef<FabricCanvas | null>(null);
    const [fabricReady, setFabricReady] = useState<FabricCanvas | null>(null);
    const [zoom, setZoom] = useState(100);

    // Init Fabric canvas
    useEffect(() => {
        if (!canvasRef.current || fabricRef.current) return;

        const canvas = new FabricCanvas(canvasRef.current, {
            width: window.innerWidth - 200,
            height: window.innerHeight - 52 - 48,
            backgroundColor: '#1a1a2e',
            selection: true,
        });

        fabricRef.current = canvas;
        setFabricReady(canvas);

        const handleResize = () => {
            const panelWidth = document.querySelector('[class*="panel"]')?.clientWidth || 200;
            canvas.setDimensions({
                width: window.innerWidth - panelWidth,
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

    // Zoom with mouse wheel
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

    // Pan with middle mouse button
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

    return { fabricRef, fabricReady, zoom };
}