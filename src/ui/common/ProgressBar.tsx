interface ProgressBarProps {
    value: number;
    max: number;
    label?: string;
}

export function ProgressBar({value, max, label}: ProgressBarProps) {
    return <progress className="progress-bar" max={max} value={Math.min(Math.max(value, 0), max)} aria-label={label}/>;
}
