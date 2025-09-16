
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


    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-2">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">{t('monthlyReports')}</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('selectBranch')}</label>
                        <select
                            value={selectedBranchId}
                            onChange={(e) => setSelectedBranchId(e.target.value)}
                            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="" disabled>{t('selectBranch')}</option>
                            {branches.map(branch => (
                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('selectMonth')}</label>
                         <select
                            value={selectedDate.toISOString()}
                            onChange={(e) => setSelectedDate(new Date(e.target.value))}
                            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        >
                            {monthOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleGenerateReport}
                        disabled={!selectedBranchId || isLoading}
                        className="w-full md:w-auto flex justify-center items-center bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors disabled:bg-primary-300"
                    >
                        {isLoading ? <Spinner /> : t('generateReport')}
                    </button>
                </div>

                {error && <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

                {isLoading && (
                    <div className="mt-6 text-center">
                        <p className="text-gray-600">{t('generatingReport')}</p>
                    </div>
                )}
                
                {report && (
                    <div className="mt-6 border-t pt-6 animate-fade-in-up">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-bold text-lg text-gray-800 mb-2">{t('aiAnalysis')}</h3>
                            <p className="text-gray-600 whitespace-pre-wrap">{report.aiAnalysis}</p>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-semibold text-blue-800">{t('totalSpend')}</h4>
                                <p className="text-2xl font-bold text-blue-900">{t('currency')} {report.totalSpend.toLocaleString(language)}</p>
                            </div>
                             <div className="p-4 bg-green-50 rounded-lg">
                                <h4 className="font-semibold text-green-800">{t('totalRequests')}</h4>
                                <p className="text-2xl font-bold text-green-900">{report.requestCount}</p>
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                             <h3 className="font-bold text-lg text-gray-800 mb-3">{t('spendingByDepartment')}</h3>
                             {report.departmentBreakdown.length > 0 ? (
                                <BarChart 
                                    data={report.departmentBreakdown.map(dep => ({
                                        label: t(dep.department.toLowerCase().replace('&', 'and')) || dep.department,
                                        value: dep.total
                                    }))}
                                />
                            ) : (
                                <p className="text-gray-500 italic">No spending data to display.</p>
                            )}
                        </div>

                        <div className="mt-6 border-t pt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('sendViaEmail')}</label>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('enterEmailPlaceholder')}
                                    className="flex-grow block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                />
                                <button
                                    onClick={handleSendEmail}
                                    className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
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
