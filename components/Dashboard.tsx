
import React, { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import FocusTrap from 'focus-trap-react';
import type { PurchaseRequest } from '../types';
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

// Lazy load modals and views for better performance
const SettingsModal = lazy(() => import('./SettingsModal'));
const ReportsModal = lazy(() => import('./ReportsModal'));
const RequestList = lazy(() => import('./RequestList'));

const Dashboard: React.FC = () => {
    const { t } = useTranslation();
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
                request.requester.name.toLowerCase().includes(searchTermLower) ||
                request.items.some(item => item.name.toLowerCase().includes(searchTermLower));

            const matchesBranch = filterBranchId === '' || request.branch.id === filterBranchId;
            const matchesDepartment = filterDepartment === '' || request.department === filterDepartment;

            return matchesSearch && matchesBranch && matchesDepartment;
        });
    }, [visibleRequests, searchTerm, filterBranchId, filterDepartment]);
    
    const handleClearFilters = () => {
        setSearchTerm('');
        setFilterBranchId('');
        setFilterDepartment('');
    };

    if (!currentUser) {
        return <LoadingFallback />;
    }

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <Header
                onNewRequest={() => setIsNewRequestOpen(true)}
                onToggleSettings={() => setIsSettingsOpen(true)}
                onToggleReports={() => setIsReportsOpen(true)}
            />
             {isImpersonating && (
                <div className="bg-yellow-400 text-center py-2 text-black font-semibold">
                    {t('impersonationBanner', { userName: currentUser.name })}
                    <button onClick={handleRevertLogin} className="underline ml-2 rtl:mr-2 rtl:ml-0">
                        {t('returnToAdmin')}
                    </button>
                </div>
            )}
            <main className="flex-grow flex overflow-hidden p-4 gap-4">
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
                    <div className="flex-grow overflow-hidden">
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
                        <div className="w-full lg:w-2/5 xl:w-1/3 flex-shrink-0 bg-white rounded-lg shadow-lg flex flex-col overflow-hidden animate-slide-in-left">
                           <RequestDetails
                                request={selectedRequest}
                                onClose={() => setSelectedRequestId(null)}
                           />
                        </div>
                    </FocusTrap>
                )}
                {!selectedRequest && isLgScreen && (
                     <div className="hidden lg:flex w-full lg:w-2/5 xl:w-1/3 flex-shrink-0 items-center justify-center bg-white rounded-lg shadow-lg p-4">
                        <div className="text-center text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
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
