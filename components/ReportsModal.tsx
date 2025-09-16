
import React, { useState, useMemo } from 'react';
import type { MonthlyReport } from '../types';
import { RequestStatus } from '../types';
import Modal from './Modal';
import { useTranslation } from '../i18n';
import Spinner from './Spinner';
import { generateMonthlyReport } from '../services/geminiService';
import BarChart from './BarChart';
import { useAppContext } from '../App';

interface ReportsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ReportsModal: React.FC<ReportsModalProps> = ({ isOpen, onClose }) => {
    const { t, language } = useTranslation();
    const { branches, purchaseRequests: requests, showToast: onShowToast } = useAppContext();

    const [selectedBranchId, setSelectedBranchId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState<MonthlyReport | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState('');

    const monthOptions = useMemo(() => {
        const options = [];
        const now = new Date();
        for (let i = 0; i < 12; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            options.push({
                value: date.toISOString(),
                label: date.toLocaleString(language, { month: 'long', year: 'numeric' }),
            });
        }
        return options;
    }, [language]);
    
    const selectedBranch = branches.find(b => b.id === selectedBranchId);

    const handleGenerateReport = async () => {
        if (!selectedBranchId) return;

        setIsLoading(true);
        setError(null);
        setReport(null);

        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();

        const requestsForMonth = requests.filter(r => {
            const createdAt = new Date(r.createdAt);
            return (
                r.branch.id === selectedBranchId &&
                r.status === RequestStatus.COMPLETED &&
                createdAt.getFullYear() === year &&
                createdAt.getMonth() === month
            );
        });

        if (requestsForMonth.length === 0) {
            setError(t('error.noRequestsForPeriod'));
            setIsLoading(false);
            return;
        }

        try {
            const branchName = branches.find(b => b.id === selectedBranchId)?.name || 'Unknown Branch';
            const monthYearStr = selectedDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
            
            const aiAnalysis = await generateMonthlyReport(requestsForMonth, branchName, monthYearStr);

            const totalSpend = requestsForMonth.reduce((sum, req) => sum + req.totalEstimatedCost, 0);
            const requestCount = requestsForMonth.length;
            
            const departmentBreakdown = requestsForMonth.reduce((acc, req) => {
                const dep = acc.find(d => d.department === req.department);
                if (dep) {
                    dep.total += req.totalEstimatedCost;
                    dep.count += 1;
                } else {
                    acc.push({ department: req.department, total: req.totalEstimatedCost, count: 1 });
                }
                return acc;
            }, [] as { department: string; total: number; count: number }[]);
            
            departmentBreakdown.sort((a,b) => b.total - a.total);

            setReport({ aiAnalysis, totalSpend, requestCount, departmentBreakdown });

        } catch (err) {
            console.error(err);
            setError(t('error.reportGenerationFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendEmail = () => {
        if (!email) {
            onShowToast(t('error.enterEmail'));
            return;
        }
        if (!report || !selectedBranch) return;

        const subject = t('emailSubject', {
            branchName: selectedBranch.name,
            month: selectedDate.toLocaleString(language, { month: 'long', year: 'numeric' })
        });

        const bodyParts = [
            t('emailGreeting'),
            '',
            t('emailIntro', {
                branchName: selectedBranch.name,
                month: selectedDate.toLocaleString(language, { month: 'long', year: 'numeric' })
            }),
            '--------------------------------------',
            `${t('aiAnalysis')}:`,
            report.aiAnalysis,
            '--------------------------------------',
            `${t('keyMetrics')}:`,
            `- ${t('totalSpend')}: ${t('currency')} ${report.totalSpend.toLocaleString(language)}`,
            `- ${t('totalRequests')}: ${report.requestCount}`,
            '--------------------------------------',
            `${t('spendingByDepartment')}:`,
            '',
            ...report.departmentBreakdown.map(dep => 
                `* ${t(dep.department) || dep.department}:\n  - ${t('totalSpend')}: ${t('currency')} ${dep.total.toLocaleString(language)}\n  - ${t('totalRequests')}: ${dep.count}\n`
            ),
            '--------------------------------------',
            t('emailClosing'),
            t('shortAppTitle')
        ];

        const body = bodyParts.join('\n');
        
        const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        window.location.href = mailtoLink;

        onShowToast(t('toast.emailClientOpened'));
        setEmail('');
    };

    const inputStyles = "block w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-md placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 sm:text-sm transition text-white";

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="4xl">
            <div className="text-slate-200">
                <h2 className="text-3xl font-bold mb-6 text-white text-center" style={{ textShadow: '0 0 8px rgba(0, 245, 212, 0.7)' }}>
                    {t('monthlyReports')}
                </h2>

                <div className="p-4 glass-panel rounded-lg mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-bold text-slate-300 mb-2">{t('selectBranch')}</label>
                            <select
                                value={selectedBranchId}
                                onChange={(e) => setSelectedBranchId(e.target.value)}
                                className={inputStyles}
                            >
                                <option value="" disabled className="bg-slate-900">{t('selectBranch')}</option>
                                {branches.map(branch => (
                                    <option key={branch.id} value={branch.id} className="bg-slate-900">{branch.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm font-bold text-slate-300 mb-2">{t('selectMonth')}</label>
                            <select
                                value={selectedDate.toISOString()}
                                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                                className={inputStyles}
                            >
                                {monthOptions.map(opt => (
                                    <option key={opt.value} value={opt.value} className="bg-slate-900">{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleGenerateReport}
                            disabled={!selectedBranchId || isLoading}
                            className="w-full md:w-auto flex justify-center items-center gap-2 bg-cyan-glow text-slate-950 font-semibold py-2 px-4 rounded-md hover:bg-cyan-400 transition-all shadow-md hover:shadow-glow-cyan disabled:bg-slate-600 disabled:shadow-none disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Spinner /> : <span>{t('generateReport')}</span>}
                        </button>
                    </div>
                </div>

                {error && <div className="mt-4 p-3 bg-pink-950/50 border-l-4 border-pink-glow text-pink-200 rounded-md">{error}</div>}

                {isLoading && (
                    <div className="mt-6 text-center py-8">
                        <div className="flex justify-center items-center">
                            <Spinner />
                            <p className="ml-4 rtl:mr-4 rtl:ml-0 text-slate-300">{t('generatingReport')}</p>
                        </div>
                    </div>
                )}
                
                {report && (
                    <div className="mt-6 space-y-6 animate-fade-in-up">
                        <div className="p-4 glass-panel rounded-lg">
                            <h3 className="font-bold text-xl text-pink-400 mb-2">{t('aiAnalysis')}</h3>
                            <p className="text-slate-300 whitespace-pre-wrap">{report.aiAnalysis}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 glass-panel rounded-lg text-center">
                                <h4 className="font-semibold text-slate-300">{t('totalSpend')}</h4>
                                <p className="text-3xl font-bold text-cyan-300 mt-1">{t('currency')} {report.totalSpend.toLocaleString(language)}</p>
                            </div>
                             <div className="p-4 glass-panel rounded-lg text-center">
                                <h4 className="font-semibold text-slate-300">{t('totalRequests')}</h4>
                                <p className="text-3xl font-bold text-cyan-300 mt-1">{report.requestCount}</p>
                            </div>
                        </div>

                        <div className="p-4 glass-panel rounded-lg">
                             <h3 className="font-bold text-xl text-pink-400 mb-3">{t('spendingByDepartment')}</h3>
                             {report.departmentBreakdown.length > 0 ? (
                                <BarChart 
                                    data={report.departmentBreakdown.map(dep => ({
                                        label: t(dep.department.toLowerCase().replace('&', 'and')) || dep.department,
                                        value: dep.total
                                    }))}
                                />
                            ) : (
                                <p className="text-slate-500 italic text-center py-4">{t('noRequestsFound')}</p>
                            )}
                        </div>

                        <div className="mt-6 border-t border-cyan-500/20 pt-4">
                            <label className="block text-sm font-bold text-slate-300 mb-2">{t('sendViaEmail')}</label>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('enterEmailPlaceholder')}
                                    className={`${inputStyles} flex-grow`}
                                />
                                <button
                                    onClick={handleSendEmail}
                                    className="bg-pink-glow text-white font-bold py-2 px-4 rounded-md hover:bg-pink-600 transition-all shadow-md hover:shadow-glow-pink"
                                >
                                    {t('sendViaEmail')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ReportsModal;
