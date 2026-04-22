import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser, getMe } from '../../services/api';
import styles from './Landing.module.css';
import { Pencil } from 'lucide-react';

export default function Landing() {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('user_token');
        if (token) {
            getMe()
                .then((user) => {
                    setName(user.displayName);
                    setLoading(false);
                })
                .catch(() => {
                    localStorage.removeItem('user_token');
                    localStorage.removeItem('user_id');
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    const handleSubmit = async () => {
        const trimmed = name.trim();
        if (!trimmed || trimmed.length > 30) {
            setError('Name must be 1-30 characters');
            return;
        }

        try {
            const token = localStorage.getItem('user_token');
            if (token) {
                navigate('/boards');
                return;
            }

            const user = await createUser(trimmed);
            localStorage.setItem('user_token', user.token);
            localStorage.setItem('user_id', user.id);
            navigate('/boards');
        } catch (err) {
            setError('Something went wrong. Try again.');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSubmit();
    };

    if (loading) return null;

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.logo}>
                    <Pencil size={40} strokeWidth={1.5} />
                    <h1>CollabDraw</h1>
                </div>
                <p className={styles.subtitle}>Real-time collaborative whiteboard</p>

                <div className={styles.form}>
                    <input
                        className={styles.input}
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setError(''); }}
                        onKeyDown={handleKeyDown}
                        maxLength={30}
                        autoFocus
                    />
                    <button className={styles.button} onClick={handleSubmit}>
                        Start Drawing
                    </button>
                    {error && <p className={styles.error}>{error}</p>}
                </div>
            </div>
        </div>
    );
}