// FIX: Replaced placeholder content with concrete type definitions.

export enum RequestStatus {
    DRAFT = 'draft',
    PENDING_HM_APPROVAL = 'pending_hm_approval',
    PENDING_QS_APPROVAL = 'pending_qs_approval',
    PENDING_QM_APPROVAL = 'pending_qm_approval',
    PENDING_PA_APPROVAL = 'pending_pa_approval',
    PENDING_FA_APPROVAL = 'pending_fa_approval',
    PENDING_PURCHASE = 'pending_purchase',
    PENDING_PM_APPROVAL = 'pending_pm_approval',
    PENDING_INVOICE = 'pending_invoice',
    PENDING_AM_APPROVAL = 'pending_am_approval',
    PENDING_BANK_ROUNDS = 'pending_bank_rounds',
    COMPLETED = 'completed',
    REJECTED = 'rejected',
}

export type Role =
  | 'requester'
  | 'hotel_manager'
  | 'quality_supervisor'
  | 'quality_manager'
  | 'projects_accountant'
  | 'final_approver'
  | 'purchasing_rep'
  | 'purchasing_manager'
  | 'accountant'
  | 'accounting_manager'
  | 'bank_rounds_officer'
  | 'auditor'
  | 'admin';

export interface User {
    id: number;
    name: string;
    email: string;
    password: string;
    role: Role;
    branches: string[];
}

export interface Branch {
    id: string;
    name: string;
    city: string;
}

export interface PurchaseRequestItem {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    estimatedCost: number;
    category: string;
    justification: string;
}

export interface ApprovalHistoryEntry {
    user: User;
    action: string;
    timestamp: Date | string;
    comment?: string;
}

export interface InternalPriceCheckItem {
    itemName: string;
    invoicePrice: number;
    catalogPrice?: number;
    comparison: 'lower' | 'higher' | 'same' | 'new';
}

export interface SalesRepresentative {
    name: string;
    contact: string;
}

export interface AIAnalysisResult {
    extractedData: {
        vendorName: string;
        invoiceNumber: string;
        invoiceDate: string;
        totalAmount: number;
        items: {
            itemName: string;
            price: number;
            unit: string;
            category: string;
        }[];
        salesRepresentative?: SalesRepresentative;
    };
    duplicateCheck: {
        isDuplicate: boolean;
        reason: string;
    };
    priceCheck: {
        overallAssessment: string;
        priceAnalysis: {
            itemName: string;
            price: number;
            isOverpriced: boolean;
            marketPriceComparison: string;
        }[];
    };
}

export interface AugmentedAIAnalysisResult extends AIAnalysisResult {
    internalPriceCheck: InternalPriceCheckItem[];
}


export interface Invoice {
    id: string;
    vendorName: string;
    invoiceNumber: string;
    invoiceDate: string;
    totalAmount: number;
    fileData: string; // base64 data URL
    aiAnalysis: AugmentedAIAnalysisResult;
}

export interface Attachment {
    id: string;
    fileName: string;
    fileData: string; // base64 data URL
    mimeType: string;
    uploadedBy: User;
    uploadedAt: string; // ISO string
}

export interface PurchaseRequest {
    id: string;
    requester: User;
    status: RequestStatus;
    items: PurchaseRequestItem[];
    totalEstimatedCost: number;
    createdAt: string;
    approvalHistory: ApprovalHistoryEntry[];
    department: string;
    branch: Branch;
    invoice?: Invoice;
    attachments?: Attachment[];
}

export interface RoleDefinition {
    name: Role | string; // string for new roles
    permissions: RequestStatus[];
}

export interface Supplier {
  name: string;
  contact: string;
  category: string;
  representatives: SalesRepresentative[];
  branches: string[];
  website?: string;
  notes?: string;
}

export interface MonthlyReport {
    aiAnalysis: string;
    totalSpend: number;
    requestCount: number;
    departmentBreakdown: {
        department: string;
        total: number;
        count: number;
    }[];
}

export interface CatalogItem {
    name: string;
    category: string;
    unit: string;
    estimatedCost: number;
}

export interface SupplierSuggestion {
    supplierName: string;
    justification: string;
}