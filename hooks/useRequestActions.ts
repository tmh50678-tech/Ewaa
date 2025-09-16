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
        if (request.department === 'Projects') {
            if (request.status === RequestStatus.PENDING_QS_APPROVAL && currentUser.role === ROLES.QUALITY_SUPERVISOR) return RequestStatus.PENDING_QM_APPROVAL;
            if (request.status === RequestStatus.PENDING_QM_APPROVAL && currentUser.role === ROLES.QUALITY_MANAGER) return RequestStatus.PENDING_PA_APPROVAL;
            if (request.status === RequestStatus.PENDING_PA_APPROVAL && currentUser.role === ROLES.PROJECTS_ACCOUNTANT) return RequestStatus.PENDING_FA_APPROVAL;
            if (request.status === RequestStatus.PENDING_FA_APPROVAL && currentUser.role === ROLES.FINAL_APPROVER) return RequestStatus.PENDING_PURCHASE;
        } else {
            if (request.status === RequestStatus.PENDING_HM_APPROVAL && currentUser.role === ROLES.HOTEL_MANAGER) return RequestStatus.PENDING_PURCHASE;
            if (request.status === RequestStatus.PENDING_PM_APPROVAL && currentUser.role === ROLES.PURCHASING_MANAGER) return RequestStatus.PENDING_INVOICE;
            if (request.status === RequestStatus.PENDING_AM_APPROVAL && currentUser.role === ROLES.ACCOUNTING_MANAGER) return RequestStatus.PENDING_BANK_ROUNDS;
        }
        return null;
    });

    const reject = () => {
        const reason = prompt(t('rejectionReasonPrompt'));
        if (!reason) return; // User cancelled
        handleAction('Rejected', () => RequestStatus.REJECTED, () => reason);
    };

    const markAsPurchased = () => handleAction('Marked as Purchased', () => {
        if (request.status === RequestStatus.PENDING_PURCHASE && currentUser.role === ROLES.PURCHASING_REP) {
            return request.totalEstimatedCost > 5000 ? RequestStatus.PENDING_PM_APPROVAL : RequestStatus.PENDING_INVOICE;
        }
        return null;
    });

    const completeBankRound = () => handleAction('Bank Round Completed', () => {
        if (request.status === RequestStatus.PENDING_BANK_ROUNDS && currentUser.role === ROLES.BANK_ROUNDS_OFFICER) {
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

    const canApproveOrReject = useMemo(() => 
        (request.status === RequestStatus.PENDING_HM_APPROVAL && currentUser.role === ROLES.HOTEL_MANAGER) ||
        (request.status === RequestStatus.PENDING_PM_APPROVAL && currentUser.role === ROLES.PURCHASING_MANAGER) ||
        (request.status === RequestStatus.PENDING_AM_APPROVAL && currentUser.role === ROLES.ACCOUNTING_MANAGER) ||
        (request.status === RequestStatus.PENDING_QS_APPROVAL && currentUser.role === ROLES.QUALITY_SUPERVISOR) ||
        (request.status === RequestStatus.PENDING_QM_APPROVAL && currentUser.role === ROLES.QUALITY_MANAGER) ||
        (request.status === RequestStatus.PENDING_PA_APPROVAL && currentUser.role === ROLES.PROJECTS_ACCOUNTANT) ||
        (request.status === RequestStatus.PENDING_FA_APPROVAL && currentUser.role === ROLES.FINAL_APPROVER),
    [request.status, currentUser.role]);

    const canMarkAsPurchased = useMemo(() => request.status === RequestStatus.PENDING_PURCHASE && currentUser.role === ROLES.PURCHASING_REP, [request.status, currentUser.role]);
    const canProcessInvoice = useMemo(() => request.status === RequestStatus.PENDING_INVOICE && currentUser.role === ROLES.ACCOUNTANT, [request.status, currentUser.role]);
    const canCompleteBankRound = useMemo(() => request.status === RequestStatus.PENDING_BANK_ROUNDS && currentUser.role === ROLES.BANK_ROUNDS_OFFICER, [request.status, currentUser.role]);
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
