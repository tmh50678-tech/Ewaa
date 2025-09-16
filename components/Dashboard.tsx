


import React, { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import FocusTrap from 'focus-trap-react';
import type { PurchaseRequest, User, AISearchFilters } from '../types';
import { RequestStatus } from '../types';
import { ROLES } from '../constants';
import { useTranslation } from '../i18n';
import Header from './Header';
import RequestDetails from './RequestDetails';
import PurchaseRequestForm from './PurchaseRequestForm';
import KanbanBoard from './KanbanBoard';
import FilterBar from './FilterBar';
import Modal from './Modal';
import LoadingFallback from './LoadingFallback';
import { useAppContext } from '../App';
import DashboardAnalytics from './DashboardAnalytics';

// Lazy load modals and views for better performance
const SettingsModal = lazy(() => import('./SettingsModal'));
const ReportsModal = lazy(() => import('./ReportsModal'));
const RequestList = lazy(() => import('./RequestList'));
const AIChatModal = lazy(() => import('./AIChatModal'));

const Dashboard: React.FC = () => {
    const { t, language } = useTranslation();
    const { 
        currentUser, 
        purchaseRequests: requests, 
        originalUser: isImpersonating, 
        handleRevertLogin,
        handleLoginAs,
        branches,
    } = useAppContext();
    
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
    const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
    const [isReportsOpen, setIsReportsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAIChatOpen, setIsAIChatOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [isLgScreen, setIsLgScreen] = useState(window.innerWidth >= 1024);

    useEffect(() => {
        const handleResize = () => setIsLgScreen(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    // Filtering logic
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBranchId, setFilterBranchId] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterStatuses, setFilterStatuses] = useState<RequestStatus[]>([]);
    const [filterMinTotal, setFilterMinTotal] = useState<number | null>(null);
    const [filterMaxTotal, setFilterMaxTotal] = useState<number | null>(null);
    const [filterRequesterId, setFilterRequesterId] = useState<number | null>(null);

    const selectedRequest = useMemo(() => {
        return requests.find(pr => pr.id === selectedRequestId) || null;
    }, [selectedRequestId, requests]);

    const userVisibleBranches = useMemo(() => {
        if (currentUser.role === ROLES.ADMIN || currentUser.role === ROLES.AUDITOR) {
            return branches;
        }
        return branches.filter(b => currentUser.branches.includes(b.id));
    }, [branches, currentUser]);
    
    const visibleRequests = useMemo(() => {
        if (currentUser.role === ROLES.ADMIN || currentUser.role === ROLES.AUDITOR) {
            return requests;
        }
        if (currentUser.role === ROLES.REQUESTER) {
            // Requester sees their own requests, plus any in their branch that are in later stages for tracking
            return requests.filter(r => r.requester.id === currentUser.id || currentUser.branches.includes(r.branch.id));
        }
        // For other roles, show requests in their branches that they might need to act on or see
        return requests.filter(r => currentUser.branches.includes(r.branch.id));
    }, [requests, currentUser]);

    const filteredRequests = useMemo(() => {
        return visibleRequests.filter(request => {
            const searchTermLower = searchTerm.toLowerCase();
            const matchesSearch = searchTermLower === '' ||
                request.id.toLowerCase().includes(searchTermLower) ||
                String(request.referenceNumber).includes(searchTermLower) ||
                request.requester.name.toLowerCase().includes(searchTermLower) ||
                request.items.some(item => item.name.toLowerCase().includes(searchTermLower));

            const matchesBranch = filterBranchId === '' || request.branch.id === filterBranchId;
            const matchesDepartment = filterDepartment === '' || request.department === filterDepartment;
            const matchesStatus = filterStatuses.length === 0 || filterStatuses.includes(request.status);
            const matchesMinTotal = filterMinTotal === null || request.totalEstimatedCost >= filterMinTotal;
            const matchesMaxTotal = filterMaxTotal === null || request.totalEstimatedCost <= filterMaxTotal;
            const matchesRequester = filterRequesterId === null || request.requester.id === filterRequesterId;

            return matchesSearch && matchesBranch && matchesDepartment && matchesStatus && matchesMinTotal && matchesMaxTotal && matchesRequester;
        });
    }, [visibleRequests, searchTerm, filterBranchId, filterDepartment, filterStatuses, filterMinTotal, filterMaxTotal, filterRequesterId]);
    
    const handleClearFilters = () => {
        setSearchTerm('');
        setFilterBranchId('');
        setFilterDepartment('');
        setFilterStatuses([]);
        setFilterMinTotal(null);
        setFilterMaxTotal(null);
        setFilterRequesterId(null);
    };

    const handleApplyAIFilters = (filters: AISearchFilters) => {
        setSearchTerm(filters.searchTerm || '');
        setFilterBranchId(filters.branchId || '');
        setFilterDepartment(filters.department || '');
        setFilterStatuses(filters.status || []);
        setFilterMinTotal(filters.minTotal || null);
        setFilterMaxTotal(filters.maxTotal || null);
        setFilterRequesterId(filters.requesterId || null);
        setIsAIChatOpen(false); // Close modal after applying
    };

    const analyticsData = useMemo(() => {
        const isActionable = (request: PurchaseRequest, user: User): boolean => {
            const status = request.status;
            const role = user.role;
            return (
                (status === RequestStatus.PENDING_HM_APPROVAL && role === ROLES.HOTEL_MANAGER) ||
                (status === RequestStatus.PENDING_PM_APPROVAL && role === ROLES.PURCHASING_MANAGER) ||
                (status === RequestStatus.PENDING_AM_APPROVAL && role === ROLES.ACCOUNTING_MANAGER) ||
                (status === RequestStatus.PENDING_QS_APPROVAL && role === ROLES.QUALITY_SUPERVISOR) ||
                (status === RequestStatus.PENDING_QM_APPROVAL && role === ROLES.QUALITY_MANAGER) ||
                (status === RequestStatus.PENDING_PA_APPROVAL && role === ROLES.PROJECTS_ACCOUNTANT) ||
                (status === RequestStatus.PENDING_FA_APPROVAL && role === ROLES.FINAL_APPROVER) ||
                (status === RequestStatus.PENDING_PURCHASE && role === ROLES.PURCHASING_REP) ||
                (status === RequestStatus.PENDING_INVOICE && role === ROLES.ACCOUNTANT) ||
                (status === RequestStatus.PENDING_BANK_ROUNDS && role === ROLES.BANK_ROUNDS_OFFICER)
            );
        };

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const awaitingMyAction = filteredRequests.filter(r => isActionable(r, currentUser)).length;
        
        const totalPendingSpend = filteredRequests
            .filter(r => r.status !== RequestStatus.COMPLETED && r.status !== RequestStatus.REJECTED)
            .reduce((sum, r) => sum + r.totalEstimatedCost, 0);

        const overpricedItems = filteredRequests
            .flatMap(r => r.invoice?.aiAnalysis.priceCheck.priceAnalysis ?? [])
            .filter(item => item.isOverpriced)
            .length;
            
        const findCompletionDate = (request: PurchaseRequest): Date | null => {
            if (request.status !== RequestStatus.COMPLETED) return null;
            // Find the last approval entry which marks completion
            const completionActions = ['Bank Round Completed', 'Approved'];
            for (let i = request.approvalHistory.length - 1; i >= 0; i--) {
                const entry = request.approvalHistory[i];
                if (completionActions.includes(entry.action)) {
                     // A simple check: if the final approver approved, and status is complete, this is likely it.
                    if (entry.user.role === ROLES.FINAL_APPROVER && request.department === "Projects") return new Date(entry.timestamp);
                    if (entry.action === 'Bank Round Completed') return new Date(entry.timestamp);
                }
            }
             // Fallback for simpler workflows
            const lastEntry = request.approvalHistory[request.approvalHistory.length-1];
            return lastEntry ? new Date(lastEntry.timestamp) : null;
        }

        const completedThisMonth = filteredRequests.filter(r => {
            const completionDate = findCompletionDate(r);
            return completionDate && completionDate >= startOfMonth;
        }).length;

        return { awaitingMyAction, totalPendingSpend, overpricedItems, completedThisMonth };
    }, [filteredRequests, currentUser]);


    if (!currentUser) {
        return <LoadingFallback />;
    }

    return (
        <div className="flex flex-col h-screen">
            <Header
                onNewRequest={() => setIsNewRequestOpen(true)}
                onToggleSettings={() => setIsSettingsOpen(true)}
                onToggleReports={() => setIsReportsOpen(true)}
                onToggleAIChat={() => setIsAIChatOpen(true)}
            />
             {isImpersonating && (
                <div className="bg-pink-600/80 text-center py-2 text-white font-semibold backdrop-blur-sm">
                    {t('impersonationBanner', { userName: currentUser.name })}
                    <button onClick={handleRevertLogin} className="underline ml-2 rtl:mr-2 rtl:ml-0 hover:text-cyan-300">
                        {t('returnToAdmin')}
                    </button>
                </div>
            )}
            <main className="flex-grow flex overflow-y-auto lg:overflow-hidden p-4 gap-4">
                <div className="flex-1 flex flex-col overflow-hidden">
                    <FilterBar
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        filterBranchId={filterBranchId}
                        onBranchChange={setFilterBranchId}
                        filterDepartment={filterDepartment}
                        onDepartmentChange={setFilterDepartment}
                        onClear={handleClearFilters}
                        branches={userVisibleBranches}
                        currentUser={currentUser}
                        viewMode={viewMode}
                        onViewChange={setViewMode}
                    />
                    <DashboardAnalytics data={analyticsData} />
                    <div className="flex-grow overflow-hidden mt-4">
                       <Suspense fallback={<LoadingFallback />}>
                            {viewMode === 'kanban' ? (
                                <KanbanBoard requests={filteredRequests} onSelectRequest={setSelectedRequestId} selectedRequestId={selectedRequestId} />
                            ) : (
                                <RequestList requests={filteredRequests} onSelectRequest={setSelectedRequestId} selectedRequestId={selectedRequestId} />
                            )}
                        </Suspense>
                    </div>
                </div>
                {selectedRequest && isLgScreen && (
                    <FocusTrap active={!!selectedRequest}>
                        <div className="w-full lg:w-2/5 xl:w-1/3 flex-shrink-0 glass-panel rounded-lg shadow-lg flex flex-col overflow-hidden animate-fade-in-up">
                           <RequestDetails
                                request={selectedRequest}
                                onClose={() => setSelectedRequestId(null)}
                           />
                        </div>
                    </FocusTrap>
                )}
                {!selectedRequest && isLgScreen && (
                     <div className="hidden lg:flex w-full lg:w-2/5 xl:w-1/3 flex-shrink-0 items-center justify-center glass-panel rounded-lg shadow-lg p-4">
                        <div className="text-center text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-cyan-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                            <h3 className="mt-2 text-sm font-medium">{t('noRequestSelected')}</h3>
                            <p className="mt-1 text-sm">{t('selectRequestPrompt')}</p>
                        </div>
                    </div>
                )}
            </main>

            {selectedRequest && !isLgScreen && (
                <Modal isOpen={!!selectedRequest} onClose={() => setSelectedRequestId(null)} size="5xl">
                    <RequestDetails request={selectedRequest} onClose={() => setSelectedRequestId(null)} />
                </Modal>
            )}

            <Modal isOpen={isNewRequestOpen} onClose={() => setIsNewRequestOpen(false)} size="3xl">
                <PurchaseRequestForm
                    onClose={() => setIsNewRequestOpen(false)}
                />
            </Modal>
            
            <Suspense fallback={<LoadingFallback />}>
                {isAIChatOpen && (
                    <AIChatModal
                        isOpen={isAIChatOpen}
                        onClose={() => setIsAIChatOpen(false)}
                        onApplyFilters={handleApplyAIFilters}
                    />
                )}
                {isSettingsOpen && (
                    <SettingsModal
                        isOpen={isSettingsOpen}
                        onClose={() => setIsSettingsOpen(false)}
                        onLoginAs={(user) => {
                            handleLoginAs(user);
                            setIsSettingsOpen(false);
                        }}
                    />
                )}

                {isReportsOpen && (
                    <ReportsModal 
                        isOpen={isReportsOpen}
                        onClose={() => setIsReportsOpen(false)}
                    />
                )}
            </Suspense>
        </div>
    );
};

export default Dashboard;