export interface PieSlice {
    id: string;
    label: string;
    value: number;
    color: string;
}

interface PieChartProps {
    label: string;
    slices: readonly PieSlice[];
    decimals?: number;
    showValues?: boolean;
}

const RADIUS = 15.9155;
const CIRCUMFERENCE = 100;

function legendValue(value: number, total: number, decimals: number, showValues: boolean): string {
    if (total <= 0) return value.toFixed(decimals);
    const percent = `${(value / total * 100).toFixed(0)}%`;
    return showValues ? `${value.toFixed(decimals)} (${percent})` : percent;
}

export function PieChart({label, slices, decimals = 1, showValues = true}: PieChartProps) {
    const total = slices.reduce((sum, slice) => sum + slice.value, 0);
    let offset = 0;
    return <figure className="pie-chart">
        <svg viewBox="0 0 42 42" role="img" aria-label={label}>
            <circle className="pie-chart__track" cx="21" cy="21" r={RADIUS}/>
            {total > 0 && slices.map(slice => {
                const share = slice.value / total * CIRCUMFERENCE;
                const start = offset;
                offset += share;
                if (share === 0) return null;
                return <circle key={slice.id} className="pie-chart__slice" cx="21" cy="21" r={RADIUS} stroke={slice.color} strokeDasharray={`${share} ${CIRCUMFERENCE - share}`} strokeDashoffset={CIRCUMFERENCE - start}/>;
            })}
        </svg>
        <ul className="pie-chart__legend">
            {slices.map(slice => <li key={slice.id}>
                <span className="pie-chart__swatch" style={{background: slice.color}}/>
                {slice.label}: {legendValue(slice.value, total, decimals, showValues)}
            </li>)}
        </ul>
    </figure>;
}
