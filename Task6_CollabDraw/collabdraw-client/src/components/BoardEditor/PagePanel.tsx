import { useState } from 'react';
import type { PageItem } from '../../types';
import styles from './PagePanel.module.css';

interface PagePanelProps {
    pages: PageItem[];
    activePageId: string | undefined;
    onSelectPage: (pageId: string) => void;
    onAddPage: () => void;
    onDeletePage: (pageId: string) => void;
}

export default function PagePanel({
                                      pages,
                                      activePageId,
                                      onSelectPage,
                                      onAddPage,
                                      onDeletePage,
                                  }: PagePanelProps) {
    const [collapsed, setCollapsed] = useState(false);

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
                                    <span className={styles.pageNumber}>{index + 1}</span>
                                </div>
                                <span className={styles.pageTitle}>{page.title}</span>
                                {pages.length > 1 && (
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