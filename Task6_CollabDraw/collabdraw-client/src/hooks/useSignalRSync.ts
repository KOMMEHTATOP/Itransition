import { useEffect, useRef, useCallback } from 'react';
import { getConnection, startConnection } from '../services/signalr';
import { getElements } from '../services/api';
import { Canvas as FabricCanvas, util } from 'fabric';
import type { HubConnection } from '@microsoft/signalr';

interface UseSignalRSyncProps {
    boardId: string | undefined;
    pageId: string | undefined;
    canvas: FabricCanvas | null;
    onPageAdded?: (pageId: string, title: string, sortOrder: number) => void;
    onPageDeleted?: (pageId: string) => void;
}

export function useSignalRSync({ boardId, pageId, canvas, onPageAdded, onPageDeleted }: UseSignalRSyncProps) {
    const connectionRef = useRef<HubConnection | null>(null);
    const isSyncing = useRef(false);

    // Connect to hub and join board
    useEffect(() => {
        if (!boardId) return;

        const connect = async () => {
            try {
                await startConnection();
                const conn = getConnection();
                connectionRef.current = conn;
                await conn.invoke('JoinBoard', boardId);
                console.log('Joined board:', boardId);
            } catch (err) {
                console.error('SignalR connection failed:', err);
            }
        };

        connect();

        return () => {
            if (connectionRef.current && boardId) {
                connectionRef.current.invoke('LeaveBoard', boardId).catch(() => {});
            }
        };
    }, [boardId]);

    // Load existing elements when page changes
    useEffect(() => {
        if (!boardId || !pageId || !canvas) return;

        const loadElements = async () => {
            try {
                const elements = await getElements(boardId, pageId);
                canvas.clear();
                canvas.backgroundColor = '#1a1a2e';

                for (const el of elements) {
                    const props = JSON.parse(el.properties);
                    const objects = await util.enlivenObjects([props]);
                    for (const obj of objects) {
                        (obj as any)._syncId = el.id;
                        (obj as any)._version = el.version;
                        canvas.add(obj as any);
                    }
                }
                canvas.renderAll();
            } catch (err) {
                console.error('Failed to load elements:', err);
            }
        };

        loadElements();
    }, [boardId, pageId, canvas]);

    // Listen for remote events (elements + pages)
    useEffect(() => {
        const conn = connectionRef.current;
        if (!conn || !canvas) return;

        const onElementAdded = async (
            remotePageId: string, elementId: string, _type: string,
            properties: string, _zIndex: number, _userId: string
        ) => {
            if (remotePageId !== pageId) return;

            const props = JSON.parse(properties);
            const objects = await util.enlivenObjects([props]);
            for (const obj of objects) {
                (obj as any)._syncId = elementId;
                (obj as any)._version = 1;
                isSyncing.current = true;
                canvas.add(obj as any);
                isSyncing.current = false;
            }
            canvas.renderAll();
        };

        const onElementModified = async (
            remotePageId: string, elementId: string,
            properties: string, version: number
        ) => {
            if (remotePageId !== pageId) return;

            const existing = canvas.getObjects().find((o: any) => o._syncId === elementId);
            if (!existing) return;
            if ((existing as any)._version >= version) return;

            const props = JSON.parse(properties);
            const objects = await util.enlivenObjects([props]);
            if (objects.length > 0) {
                const newObj = objects[0];
                (newObj as any)._syncId = elementId;
                (newObj as any)._version = version;

                isSyncing.current = true;
                canvas.remove(existing);
                canvas.add(newObj as any);
                isSyncing.current = false;
                canvas.renderAll();
            }
        };

        const onElementDeleted = (remotePageId: string, elementId: string) => {
            if (remotePageId !== pageId) return;

            const existing = canvas.getObjects().find((o: any) => o._syncId === elementId);
            if (existing) {
                isSyncing.current = true;
                canvas.remove(existing);
                isSyncing.current = false;
                canvas.renderAll();
            }
        };

        const onPageAddedRemote = (remotePageId: string, title: string, sortOrder: number) => {
            onPageAdded?.(remotePageId, title, sortOrder);
        };

        const onPageDeletedRemote = (remotePageId: string) => {
            onPageDeleted?.(remotePageId);
        };

        conn.on('ElementAdded', onElementAdded);
        conn.on('ElementModified', onElementModified);
        conn.on('ElementDeleted', onElementDeleted);
        conn.on('PageAdded', onPageAddedRemote);
        conn.on('PageDeleted', onPageDeletedRemote);

        return () => {
            conn.off('ElementAdded', onElementAdded);
            conn.off('ElementModified', onElementModified);
            conn.off('ElementDeleted', onElementDeleted);
            conn.off('PageAdded', onPageAddedRemote);
            conn.off('PageDeleted', onPageDeletedRemote);
        };
    }, [canvas, pageId, onPageAdded, onPageDeleted]);

    // Send local element changes
    const sendElementAdded = useCallback((obj: any) => {
        const conn = connectionRef.current;
        if (!conn || !boardId || !pageId || isSyncing.current) return;

        const id = typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                const r = Math.random() * 16 | 0;
                return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });

        const properties = JSON.stringify(obj.toObject());
        const type = obj.type || 'unknown';
        const zIndex = canvas?.getObjects().indexOf(obj) ?? 0;

        conn.invoke('SendElementAdded', boardId, pageId, id, type, properties, zIndex)
            .catch((err: any) => console.error('SendElementAdded failed:', err));
    }, [boardId, pageId, canvas]);

    const sendElementModified = useCallback((obj: any) => {
        const conn = connectionRef.current;
        if (!conn || !boardId || !pageId || isSyncing.current) return;
        if (!obj._syncId) return;

        obj._version = (obj._version || 1) + 1;
        const properties = JSON.stringify(obj.toObject());

        conn.invoke('SendElementModified', boardId, pageId, obj._syncId, properties, obj._version)
            .catch((err: any) => console.error('SendElementModified failed:', err));
    }, [boardId, pageId]);

    const sendElementDeleted = useCallback((obj: any) => {
        const conn = connectionRef.current;
        if (!conn || !boardId || !pageId || isSyncing.current) return;
        if (!obj._syncId) return;

        conn.invoke('SendElementDeleted', boardId, pageId, obj._syncId)
            .catch((err: any) => console.error('SendElementDeleted failed:', err));
    }, [boardId, pageId]);

    // Send page notifications to other users
    const sendPageAdded = useCallback((newPageId: string, title: string, sortOrder: number) => {
        const conn = connectionRef.current;
        if (!conn || !boardId) return;

        conn.invoke('SendPageAdded', boardId, newPageId, title, sortOrder)
            .catch((err: any) => console.error('SendPageAdded failed:', err));
    }, [boardId]);

    const sendPageDeleted = useCallback((deletedPageId: string) => {
        const conn = connectionRef.current;
        if (!conn || !boardId) return;

        conn.invoke('SendPageDeleted', boardId, deletedPageId)
            .catch((err: any) => console.error('SendPageDeleted failed:', err));
    }, [boardId]);

    return {
        sendElementAdded,
        sendElementModified,
        sendElementDeleted,
        sendPageAdded,
        sendPageDeleted,
        isSyncing,
    };
}