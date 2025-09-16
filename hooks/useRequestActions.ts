import { useMemo } from 'react';
import { useAppContext } from '../App';
import type { PurchaseRequest, ApprovalHistoryEntry } from '../types';
import { RequestStatus } from '../types';
import { ROLES } from '../constants';
import { useTranslation } from '../i18n';

const fileToBase64 = (file: File): Promise<{ data: string, mimeType: string, fullDataUrl: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const fullDataUrl = reader.result as string;
            const mimeType = fullDataUrl.split(':')[1].split(';')[0];
            const data = fullDataUrl.split(',')[1];
            resolve({ data, mimeType, fullDataUrl });
        };
        reader.onerror = error => reject(error);
    });
};

export const useRequestActions = (request: PurchaseRequest) => {
    const { currentUser, updateRequest, suppliers } = useAppContext();
    const { t } = useTranslation();

    const handleAction = (action: string, getNextStatus: () => RequestStatus | null, getComment?: () => string | undefined) => {
        const nextStatus = getNextStatus();
        if (nextStatus) {
            const comment = getComment ? getComment() : undefined;
            const newHistoryEntry: ApprovalHistoryEntry = { user: currentUser, action, timestamp: new Date(), comment };
            const updatedRequest: PurchaseRequest = {
                ...request,
                status: nextStatus,
                approvalHistory: [...request.approvalHistory, newHistoryEntry]
            };
            updateRequest(updatedRequest);
        }
    };
    
    const approve = () => handleAction('Approved', () => {
        const isAdmin = currentUser.role === ROLES.ADMIN;
        if (request.department === 'Projects') {
            if (request.status === RequestStatus.PENDING_QS_APPROVAL && (currentUser.role === ROLES.QUALITY_SUPERVISOR || isAdmin)) return RequestStatus.PENDING_QM_APPROVAL;
            if (request.status === RequestStatus.PENDING_QM_APPROVAL && (currentUser.role === ROLES.QUALITY_MANAGER || isAdmin)) return RequestStatus.PENDING_PA_APPROVAL;
            if (request.status === RequestStatus.PENDING_PA_APPROVAL && (currentUser.role === ROLES.PROJECTS_ACCOUNTANT || isAdmin)) return RequestStatus.PENDING_FA_APPROVAL;
            if (request.status === RequestStatus.PENDING_FA_APPROVAL && (currentUser.role === ROLES.FINAL_APPROVER || isAdmin)) return RequestStatus.PENDING_PURCHASE;
        } else {
            if (request.status === RequestStatus.PENDING_HM_APPROVAL && (currentUser.role === ROLES.HOTEL_MANAGER || isAdmin)) return RequestStatus.PENDING_PURCHASE;
            if (request.status === RequestStatus.PENDING_PM_APPROVAL && (currentUser.role === ROLES.PURCHASING_MANAGER || isAdmin)) return RequestStatus.PENDING_INVOICE;
            if (request.status === RequestStatus.PENDING_AM_APPROVAL && (currentUser.role === ROLES.ACCOUNTING_MANAGER || isAdmin)) return RequestStatus.PENDING_BANK_ROUNDS;
        }
        return null;
    });

    const reject = () => {
        const reason = prompt(t('rejectionReasonPrompt'));
        if (!reason) return; // User cancelled
        handleAction('Rejected', () => RequestStatus.REJECTED, () => reason);
    };

    const returnForModification = () => {
        const reason = prompt(t('modificationReasonPrompt'));
        if (!reason) return; // User cancelled
        handleAction('Returned for Modification', () => RequestStatus.DRAFT, () => reason);
    };

    const markAsPurchased = () => handleAction('Marked as Purchased', () => {
        const isAdmin = currentUser.role === ROLES.ADMIN;
        if (request.status === RequestStatus.PENDING_PURCHASE && (currentUser.role === ROLES.PURCHASING_REP || isAdmin)) {
            return request.totalEstimatedCost > 5000 ? RequestStatus.PENDING_PM_APPROVAL : RequestStatus.PENDING_INVOICE;
        }
        return null;
    });

    const completeBankRound = () => handleAction('Bank Round Completed', () => {
        const isAdmin = currentUser.role === ROLES.ADMIN;
        if (request.status === RequestStatus.PENDING_BANK_ROUNDS && (currentUser.role === ROLES.BANK_ROUNDS_OFFICER || isAdmin)) {
            return RequestStatus.COMPLETED;
        }
        return null;
    });
    
    const addAttachment = async (file: File) => {
        try {
            const { fullDataUrl, mimeType } = await fileToBase64(file);
            const newAttachment = {
                id: `att-${Date.now()}`,
                fileName: file.name,
                fileData: fullDataUrl,
                mimeType,
                uploadedBy: currentUser,
                uploadedAt: new Date().toISOString(),
            };
            const updatedRequest = {
                ...request,
                attachments: [...(request.attachments || []), newAttachment],
            };
            updateRequest(updatedRequest);
        } catch (error) {
            console.error("Error converting file to base64", error);
        }
    };
    
    const deleteAttachment = (attachmentId: string) => {
        if (window.confirm(t('confirmDeleteAttachment'))) {
            const updatedRequest = {
                ...request,
                attachments: request.attachments?.filter(att => att.id !== attachmentId),
            };
            updateRequest(updatedRequest);
        }
    };

    const canApproveOrReject = useMemo(() => {
        if (currentUser.role === ROLES.ADMIN) {
            const approvableStatuses = [
                RequestStatus.PENDING_HM_APPROVAL,
                RequestStatus.PENDING_PM_APPROVAL,
                RequestStatus.PENDING_AM_APPROVAL,
                RequestStatus.PENDING_QS_APPROVAL,
                RequestStatus.PENDING_QM_APPROVAL,
                RequestStatus.PENDING_PA_APPROVAL,
                RequestStatus.PENDING_FA_APPROVAL,
            ];
            return approvableStatuses.includes(request.status);
        }
        return (
            (request.status === RequestStatus.PENDING_HM_APPROVAL && currentUser.role === ROLES.HOTEL_MANAGER) ||
            (request.status === RequestStatus.PENDING_PM_APPROVAL && currentUser.role === ROLES.PURCHASING_MANAGER) ||
            (request.status === RequestStatus.PENDING_AM_APPROVAL && currentUser.role === ROLES.ACCOUNTING_MANAGER) ||
            (request.status === RequestStatus.PENDING_QS_APPROVAL && currentUser.role === ROLES.QUALITY_SUPERVISOR) ||
            (request.status === RequestStatus.PENDING_QM_APPROVAL && currentUser.role === ROLES.QUALITY_MANAGER) ||
            (request.status === RequestStatus.PENDING_PA_APPROVAL && currentUser.role === ROLES.PROJECTS_ACCOUNTANT) ||
            (request.status === RequestStatus.PENDING_FA_APPROVAL && currentUser.role === ROLES.FINAL_APPROVER)
        );
    }, [request.status, currentUser.role]);

    const canMarkAsPurchased = useMemo(() => {
        if (request.status !== RequestStatus.PENDING_PURCHASE) return false;
        return currentUser.role === ROLES.PURCHASING_REP || currentUser.role === ROLES.ADMIN;
    }, [request.status, currentUser.role]);

    const canProcessInvoice = useMemo(() => {
        if (request.status !== RequestStatus.PENDING_INVOICE) return false;
        return currentUser.role === ROLES.ACCOUNTANT || currentUser.role === ROLES.ADMIN;
    }, [request.status, currentUser.role]);
    
    const canCompleteBankRound = useMemo(() => {
        if (request.status !== RequestStatus.PENDING_BANK_ROUNDS) return false;
        return currentUser.role === ROLES.BANK_ROUNDS_OFFICER || currentUser.role === ROLES.ADMIN;
    }, [request.status, currentUser.role]);

    const canManageAttachments = useMemo(() => currentUser.role === ROLES.ADMIN ||
        ((currentUser.role === ROLES.PURCHASING_REP || currentUser.role === ROLES.PURCHASING_MANAGER) &&
        (request.status === RequestStatus.PENDING_PURCHASE || request.status === RequestStatus.PENDING_PM_APPROVAL)),
    [currentUser.role, request.status]);
    
    const relevantSuppliers = useMemo(() => {
        return suppliers.filter(s => s.branches.includes(request.branch.id));
    }, [suppliers, request.branch.id]);

    return {
        approve,
        reject,
        returnForModification,
        markAsPurchased,
        completeBankRound,
        addAttachment,
        deleteAttachment,
        canApproveOrReject,
        canMarkAsPurchased,
        canProcessInvoice,
        canCompleteBankRound,
        canManageAttachments,
        relevantSuppliers,
    };
};