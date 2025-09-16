import React from 'react';
import type { AIInsight } from '../types';
import { useTranslation } from '../i18n';

interface AIInsightsProps {
    insights: AIInsight[];
    isLoading: boolean;
    error: string | null;
}

const InsightIcon: React.FC<{ type: AIInsight['type'] }> = ({ type }) => {
    switch (type) {
        case 'cost':
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1m0-1V4m0 2.01M12 14v4m0 2v-2m0-2v-2" /></svg>;
        case 'efficiency':
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
        case 'trend':
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
        default:
            return null;
    }
};

const InsightCard: React.FC<{ insight: AIInsight }> = ({ insight }) => {
    const { t } = useTranslation();
    const typeStyles = {
        cost: { bg: 'bg-green-950/40', border: 'border-green-500', iconText: 'text-green-400' },
        efficiency: { bg: 'bg-blue-950/40', border: 'border-blue-500', iconText: 'text-blue-400' },
        trend: { bg: 'bg-purple-950/40', border: 'border-purple-500', iconText: 'text-purple-400' },
    };
    const style = typeStyles[insight.type] || typeStyles.efficiency;

    return (
        <div className={`p-4 rounded-lg border-l-4 ${style.border} ${style.bg} flex gap-4 animate-fade-in-up`}>
            <div className={`flex-shrink-0 ${style.iconText}`}>
                <InsightIcon type={insight.type} />
            </div>
            <div>
                <h4 className="font-bold text-white">{insight.title}</h4>
                <p className="text-sm text-slate-300 mt-1">{insight.description}</p>
            </div>
        </div>
    );
};

const SkeletonCard: React.FC = () => (
    <div className="p-4 rounded-lg bg-slate-800/50 animate-pulse">
        <div className="flex gap-4">
            <div className="w-8 h-8 bg-slate-700 rounded"></div>
            <div className="flex-grow space-y-2">
                <div className="h-5 bg-slate-700 rounded w-1/3"></div>
                <div className="h-4 bg-slate-700 rounded w-full"></div>
                <div className="h-4 bg-slate-700 rounded w-2/3"></div>
            </div>
        </div>
    </div>
);


const AIInsights: React.FC<AIInsightsProps> = ({ insights, isLoading, error }) => {
    const { t } = useTranslation();

    if (isLoading) {
        return (
             <div>
                <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    {t('aiInsightsTitle')}
                </h3>
                <p className="text-slate-400 text-sm mb-4">{t('generatingInsights')}</p>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
             <div className="p-4 bg-yellow-950/50 border-l-4 border-yellow-500 rounded-r-lg">
                <h4 className="font-bold text-yellow-200">{t('aiInsightsTitle')}</h4>
                <p className="text-yellow-300 text-sm">{error}</p>
             </div>
        );
    }

    if (insights.length === 0) {
        return null; // Don't render anything if there are no insights
    }
    
    return (
        <div className="animate-fade-in-up">
            <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                {t('aiInsightsTitle')}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {insights.map((insight, index) => (
                    <InsightCard key={index} insight={insight} />
                ))}
            </div>
        </div>
    );
};

export default AIInsights;