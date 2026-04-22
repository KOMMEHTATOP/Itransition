import type { Tool } from './BoardEditor';
import styles from './Toolbar.module.css';
import {
    MousePointer2, Pencil, Minus, MoveRight,
    Square, Circle, Triangle, Type, Eraser, ZoomIn
} from 'lucide-react';

interface ToolbarProps {
    activeTool: Tool;
    setActiveTool: (tool: Tool) => void;
    strokeColor: string;
    setStrokeColor: (c: string) => void;
    fillColor: string;
    setFillColor: (c: string) => void;
    strokeWidth: number;
    setStrokeWidth: (w: number) => void;
    zoom: number;
}

const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: 'select', icon: <MousePointer2 size={18} />, label: 'Select' },
    { id: 'pencil', icon: <Pencil size={18} />, label: 'Pencil' },
    { id: 'line', icon: <Minus size={18} />, label: 'Line' },
    { id: 'rect', icon: <Square size={18} />, label: 'Rectangle' },
    { id: 'circle', icon: <Circle size={18} />, label: 'Circle' },
    { id: 'triangle', icon: <Triangle size={18} />, label: 'Triangle' },
    { id: 'text', icon: <Type size={18} />, label: 'Text' },
    { id: 'eraser', icon: <Eraser size={18} />, label: 'Eraser' },
];

const presetColors = [
    '#ffffff', '#ef4444', '#f97316', '#eab308',
    '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
];

export default function Toolbar({
                                    activeTool, setActiveTool,
                                    strokeColor, setStrokeColor,
                                    fillColor, setFillColor,
                                    strokeWidth, setStrokeWidth,
                                    zoom,
                                }: ToolbarProps) {
    return (
        <div className={styles.toolbar}>
            <div className={styles.section}>
                {tools.map((t) => (
                    <button
                        key={t.id}
                        className={`${styles.toolBtn} ${activeTool === t.id ? styles.active : ''}`}
                        onClick={() => setActiveTool(t.id)}
                        title={t.label}
                    >
                        {t.icon}
                    </button>
                ))}
            </div>

            <div className={styles.divider} />

            <div className={styles.section}>
                <label className={styles.label}>Stroke</label>
                <div className={styles.colors}>
                    {presetColors.map((c) => (
                        <button
                            key={c}
                            className={`${styles.colorBtn} ${strokeColor === c ? styles.activeColor : ''}`}
                            style={{ backgroundColor: c }}
                            onClick={() => setStrokeColor(c)}
                        />
                    ))}
                </div>
                <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className={styles.colorInput}
                    title="Custom color"
                />
            </div>

            <div className={styles.divider} />

            <div className={styles.section}>
                <label className={styles.label}>Fill</label>
                <button
                    className={`${styles.colorBtn} ${fillColor === 'transparent' ? styles.activeColor : ''}`}
                    style={{ backgroundColor: '#1a1a2e', border: '2px dashed #555' }}
                    onClick={() => setFillColor('transparent')}
                    title="No fill"
                />
                {presetColors.slice(0, 4).map((c) => (
                    <button
                        key={c}
                        className={`${styles.colorBtn} ${fillColor === c ? styles.activeColor : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setFillColor(c)}
                    />
                ))}
            </div>

            <div className={styles.divider} />

            <div className={styles.section}>
                <label className={styles.label}>Width</label>
                <input
                    type="range"
                    min={1}
                    max={20}
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    className={styles.slider}
                />
                <span className={styles.widthValue}>{strokeWidth}px</span>
            </div>

            <div className={styles.divider} />

            <div className={styles.section}>
                <ZoomIn size={16} />
                <span className={styles.zoomValue}>{zoom}%</span>
            </div>
        </div>
    );
}