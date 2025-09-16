import React from 'react';
import { useTranslation } from '../i18n';

interface AnalyticsData {
    awaitingMyAction: number;
    totalPendingSpend: number;
    overpricedItems: number;
    completedThisMonth: number;
}

interface DashboardAnalyticsProps {
    data: AnalyticsData;
}

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    colorClass: string;
    shadowClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, colorClass, shadowClass }) => (
    <div className={`glass-panel p-4 rounded-xl flex items-center gap-4 border-t-2 ${colorClass} shadow-lg ${shadowClass}`}>
        <div className="flex-grow">
            <p className="text-sm text-slate-300 font-medium">{label}</p>
            <p className="text-2xl lg:text-3xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`flex-shrink-0 text-3xl opacity-30`}>
            {icon}
        </div>
    </div>
);


const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({ data }) => {
    const { t, language } = useTranslation();

    const formatCurrency = (amount: number) => {
        return `${t('currency')} ${amount.toLocaleString(language, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const analyticsCards: StatCardProps[] = [
        {
            label: t('analytics.awaitingMyAction'),
            value: data.awaitingMyAction,
            colorClass: 'border-pink-glow',
            shadowClass: 'shadow-pink-glow/10',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        },
        {
            label: t('analytics.totalPendingSpend'),
            value: formatCurrency(data.totalPendingSpend),
            colorClass: 'border-cyan-glow',
            shadowClass: 'shadow-cyan-glow/10',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1m0-1V4m0 2.01M12 14v4m0 2v-2m0-2v-2" /></svg>
        },
        {
            label: t('analytics.overpricedItems'),
            value: data.overpricedItems,
            colorClass: 'border-yellow-500',
            shadowClass: 'shadow-yellow-500/10',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        },
        {
            label: t('analytics.completedThisMonth'),
            value: data.completedThisMonth,
            colorClass: 'border-green-500',
            shadowClass: 'shadow-green-500/10',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
            {analyticsCards.map(card => <StatCard key={card.label} {...card} />)}
        </div>
    );
};

export default DashboardAnalytics;