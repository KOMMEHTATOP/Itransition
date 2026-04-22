import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BoardEditor() {
    const { boardId } = useParams();
    const navigate = useNavigate();

    return (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#888', marginBottom: 16 }}>Board: {boardId}</p>
                <button
                    onClick={() => navigate('/boards')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: 'rgba(255,255,255,0.08)', color: '#aaa',
                        padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer'
                    }}
                >
                    <ArrowLeft size={16} /> Back to boards
                </button>
            </div>
        </div>
    );
}