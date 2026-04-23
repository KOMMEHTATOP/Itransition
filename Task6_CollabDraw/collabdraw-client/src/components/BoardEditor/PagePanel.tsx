import { useState, useRef, useEffect } from 'react';
import type { PageItem } from '../../types';
import styles from './PagePanel.module.css';

interface PagePanelProps {
    pages: PageItem[];
    activePageId: string | undefined;
    onSelectPage: (pageId: string) => void;
    onAddPage: () => void;
    onDeletePage: (pageId: string) => void;
    onRenamePage: (pageId: string, newTitle: string) => void;
    thumbnails: Record<string, string>;
}

export default function PagePanel({
                                      pages,
                                      activePageId,
                                      onSelectPage,
                                      onAddPage,
                                      onDeletePage,
                                      onRenamePage,
                                      thumbnails,
                                  }: PagePanelProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingId && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingId]);

    const startEditing = (page: PageItem) => {
        setEditingId(page.id);
        setEditValue(page.title);
    };

    const commitEdit = () => {
        if (!editingId) return;
        const trimmed = editValue.trim();
        if (trimmed && trimmed !== pages.find(p => p.id === editingId)?.title) {
            onRenamePage(editingId, trimmed);
        }
        setEditingId(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') commitEdit();
        if (e.key === 'Escape') setEditingId(null);
    };

    return (
        <div className={`${styles.panel} ${collapsed ? styles.collapsed : ''}`}>
            <div className={styles.header}>
                {!collapsed && <span className={styles.title}>Pages</span>}
                <button
                    className={styles.collapseBtn}
                    onClick={() => setCollapsed(!collapsed)}
                    title={collapsed ? 'Expand pages' : 'Collapse pages'}
                >
                    {collapsed ? '»' : '«'}
                </button>
            </div>

            {!collapsed && (
                <>
                    <div className={styles.list}>
                        {pages.map((page, index) => (
                            <div
                                key={page.id}
                                className={`${styles.pageItem} ${page.id === activePageId ? styles.active : ''}`}
                                onClick={() => onSelectPage(page.id)}
                            >
                                <div className={styles.pageThumb}>
                                    {thumbnails[page.id] ? (
                                        <img
                                            src={thumbnails[page.id]}
                                            alt={page.title}
                                            className={styles.thumbImg}
                                        />
                                    ) : (
                                        <span className={styles.pageNumber}>{index + 1}</span>
                                    )}
                                </div>

                                {editingId === page.id ? (
                                    <input
                                        ref={inputRef}
                                        className={styles.editInput}
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onBlur={commitEdit}
                                        onKeyDown={handleKeyDown}
                                        onClick={(e) => e.stopPropagation()}
                                        maxLength={50}
                                    />
                                ) : (
                                    <span
                                        className={styles.pageTitle}
                                        onDoubleClick={(e) => {
                                            e.stopPropagation();
                                            startEditing(page);
                                        }}
                                        title="Double-click to rename"
                                    >
                                        {page.title}
                                    </span>
                                )}

                                {pages.length > 1 && editingId !== page.id && (
                                    <button
                                        className={styles.deleteBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeletePage(page.id);
                                        }}
                                        title="Delete page"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <button className={styles.addBtn} onClick={onAddPage}>
                        + Add Page
                    </button>
                </>
            )}
        </div>
    );
}