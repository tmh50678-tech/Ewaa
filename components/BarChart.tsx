import React, { useState } from 'react';
import { useTranslation } from '../i18n';

interface ChartData {
    label: string;
    value: number;
}

interface BarChartProps {
    data: ChartData[];
}

interface TooltipData {
    x: number;
    y: number;
    label: string;
    value: number;
}

const BarChart: React.FC<BarChartProps> = ({ data }) => {
    const { t, language } = useTranslation();
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);

    const chartHeight = 250;
    const chartWidth = 500; // will be scaled by viewBox
    const barPadding = 10;
    const barWidth = data.length > 0 ? (chartWidth - barPadding * (data.length + 1)) / data.length : 0;
    const maxValue = Math.max(...data.map(d => d.value), 0);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const handleMouseOver = (e: React.MouseEvent<SVGRectElement>, item: ChartData) => {
        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const svgRect = (e.target as SVGRectElement).getBoundingClientRect();
        
        setTooltip({
            x: svgRect.left - containerRect.left + svgRect.width / 2,
            y: svgRect.top - containerRect.top - 10,
            label: item.label,
            value: item.value,
        });
    };
    
    const handleMouseLeave = () => {
        setTooltip(null);
    };

    return (
        <div className="relative" ref={containerRef}>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="auto" aria-label="Bar chart of spending by department">
                <g>
                    {data.map((item, index) => {
                        const barHeight = maxValue > 0 ? (item.value / maxValue) * (chartHeight - 40) : 0;
                        const x = barPadding + index * (barWidth + barPadding);
                        const y = chartHeight - barHeight - 20;

                        return (
                            <g key={item.label}>
                                <rect
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={barHeight}
                                    rx="4"
                                    ry="4"
                                    className="fill-current text-cyan-500 hover:text-cyan-400 transition-colors cursor-pointer"
                                    onMouseOver={(e) => handleMouseOver(e, item)}
                                    onMouseLeave={handleMouseLeave}
                                />
                                <text
                                    x={x + barWidth / 2}
                                    y={chartHeight - 5}
                                    textAnchor="middle"
                                    className="text-xs fill-current text-slate-400 font-medium"
                                >
                                    {item.label}
                                </text>
                            </g>
                        );
                    })}
                </g>
                 <line x1="0" y1={chartHeight - 20} x2={chartWidth} y2={chartHeight - 20} className="stroke-current text-slate-700" strokeWidth="2" />
            </svg>
            {tooltip && (
                <div 
                    className="absolute bg-slate-900 text-white text-sm rounded-md p-2 pointer-events-none transform -translate-x-1/2 -translate-y-full shadow-lg z-10 border border-slate-700"
                    style={{ left: tooltip.x, top: tooltip.y }}
                >
                    <div className="font-bold">{tooltip.label}</div>
                    <div>{t('currency')} {tooltip.value.toLocaleString(language)}</div>
                </div>
            )}
        </div>
    );
};

export default BarChart;
