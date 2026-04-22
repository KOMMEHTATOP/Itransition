import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBoards, createBoard } from '../../services/api';
import styles from './BoardList.module.css';
import { Plus, Layout, Users } from 'lucide-react';

interface BoardItem {
    id: string;
    name: string;
    createdAt: string;
    userCount: number;
    thumbnailBase64: string | null;
}

export default function BoardList() {
    const [boards, setBoards] = useState<BoardItem[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('user_token');
        if (!token) {
            navigate('/');
            return;
        }
        loadBoards();
    }, []);

    const loadBoards = async () => {
        try {
            const data = await getBoards();
            setBoards(data);
        } catch {
            console.error('Failed to load boards');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        const trimmed = newName.trim();
        if (!trimmed) return;

        try {
            const board = await createBoard(trimmed);
            setNewName('');
            setShowCreate(false);
            navigate(`/boards/${board.id}`);
        } catch {
            console.error('Failed to create board');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleCreate();
        if (e.key === 'Escape') setShowCreate(false);
    };

    const formatDate = (iso: string) => {
        return new Date(iso).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (loading) return null;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <Layout size={24} />
                    <h1>My Boards</h1>
                </div>
                <button className={styles.createBtn} onClick={() => setShowCreate(true)}>
                    <Plus size={18} />
                    New Board
                </button>
            </header>

            {showCreate && (
                <div className={styles.createOverlay} onClick={() => setShowCreate(false)}>
                    <div className={styles.createModal} onClick={(e) => e.stopPropagation()}>
                        <h2>Create New Board</h2>
                        <input
                            className={styles.createInput}
                            type="text"
                            placeholder="Board name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            maxLength={100}
                            autoFocus
                        />
                        <div className={styles.createActions}>
                            <button className={styles.cancelBtn} onClick={() => setShowCreate(false)}>
                                Cancel
                            </button>
                            <button className={styles.confirmBtn} onClick={handleCreate}>
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {boards.length === 0 ? (
                <div className={styles.empty}>
                    <p>No boards yet. Create your first one!</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {boards.map((board) => (
                        <div
                            key={board.id}
                            className={styles.card}
                            onClick={() => navigate(`/boards/${board.id}`)}
                        >
                            <div className={styles.thumbnail}>
                                {board.thumbnailBase64 ? (
                                    <img
                                        src={`data:image/png;base64,${board.thumbnailBase64}`}
                                        alt={board.name}
                                    />
                                ) : (
                                    <div className={styles.placeholderThumb}>
                                        <Layout size={32} strokeWidth={1} />
                                    </div>
                                )}
                            </div>
                            <div className={styles.cardInfo}>
                                <h3>{board.name}</h3>
                                <div className={styles.cardMeta}>
                                    <span>{formatDate(board.createdAt)}</span>
                                    <span className={styles.userCount}>
                    <Users size={14} />
                                        {board.userCount}
                  </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}