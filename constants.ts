import { RequestStatus } from './types';
import type { RoleDefinition } from './types';

export const STATUS_COLORS: { [key in RequestStatus]: string } = {
  [RequestStatus.DRAFT]: 'bg-gray-200 text-gray-800',
  [RequestStatus.PENDING_HM_APPROVAL]: 'bg-yellow-200 text-yellow-800',
  [RequestStatus.PENDING_QS_APPROVAL]: 'bg-yellow-200 text-yellow-800',
  [RequestStatus.PENDING_QM_APPROVAL]: 'bg-yellow-200 text-yellow-800',
  [RequestStatus.PENDING_PA_APPROVAL]: 'bg-yellow-200 text-yellow-800',
  [RequestStatus.PENDING_FA_APPROVAL]: 'bg-yellow-200 text-yellow-800',
  [RequestStatus.PENDING_PURCHASE]: 'bg-blue-200 text-blue-800',
  [RequestStatus.PENDING_PM_APPROVAL]: 'bg-yellow-200 text-yellow-800',
  [RequestStatus.PENDING_INVOICE]: 'bg-blue-200 text-blue-800',
  [RequestStatus.PENDING_AM_APPROVAL]: 'bg-yellow-200 text-yellow-800',
  [RequestStatus.PENDING_BANK_ROUNDS]: 'bg-cyan-200 text-cyan-800',
  [RequestStatus.COMPLETED]: 'bg-green-200 text-green-800',
  [RequestStatus.REJECTED]: 'bg-red-200 text-red-800',
};

// FIX: Added 'as const' to ensure ROLES values are treated as literal types, not general strings.
export const ROLES = {
  REQUESTER: 'requester',
  HOTEL_MANAGER: 'hotel_manager',
  QUALITY_SUPERVISOR: 'quality_supervisor',
  QUALITY_MANAGER: 'quality_manager',
  PROJECTS_ACCOUNTANT: 'projects_accountant',
  FINAL_APPROVER: 'final_approver',
  PURCHASING_REP: 'purchasing_rep',
  PURCHASING_MANAGER: 'purchasing_manager',
  ACCOUNTANT: 'accountant',
  ACCOUNTING_MANAGER: 'accounting_manager',
  BANK_ROUNDS_OFFICER: 'bank_rounds_officer',
  AUDITOR: 'auditor',
  ADMIN: 'admin',
} as const;

export const INITIAL_ROLE_DEFINITIONS: RoleDefinition[] = [
    { name: ROLES.REQUESTER, permissions: [RequestStatus.DRAFT, RequestStatus.PENDING_HM_APPROVAL, RequestStatus.REJECTED, RequestStatus.COMPLETED] },
    { name: ROLES.HOTEL_MANAGER, permissions: [RequestStatus.PENDING_HM_APPROVAL] },
    { name: ROLES.QUALITY_SUPERVISOR, permissions: [RequestStatus.PENDING_QS_APPROVAL] },
    { name: ROLES.QUALITY_MANAGER, permissions: [RequestStatus.PENDING_QM_APPROVAL] },
    { name: ROLES.PROJECTS_ACCOUNTANT, permissions: [RequestStatus.PENDING_PA_APPROVAL] },
    { name: ROLES.FINAL_APPROVER, permissions: [RequestStatus.PENDING_FA_APPROVAL] },
    { name: ROLES.PURCHASING_REP, permissions: [RequestStatus.PENDING_PURCHASE] },
    { name: ROLES.PURCHASING_MANAGER, permissions: [RequestStatus.PENDING_PM_APPROVAL] },
    { name: ROLES.ACCOUNTANT, permissions: [RequestStatus.PENDING_INVOICE] },
    { name: ROLES.ACCOUNTING_MANAGER, permissions: [RequestStatus.PENDING_AM_APPROVAL] },
    { name: ROLES.BANK_ROUNDS_OFFICER, permissions: [RequestStatus.PENDING_BANK_ROUNDS] },
    { name: ROLES.AUDITOR, permissions: Object.values(RequestStatus) },
    { name: ROLES.ADMIN, permissions: Object.values(RequestStatus) },
];

export const DEPARTMENTS = [
  'Projects',
  'Housekeeping',
  'Maintenance',
  'F&B',
  'Management',
] as const;

export const SAUDI_CITIES: string[] = [
  'Riyadh',
  'Jeddah',
  'Mecca',
  'Medina',
  'Dammam',
  'Al-Khobar',
  'Dhahran',
  'Tabuk',
  'Buraidah',
  'Khamis Mushait',
  'Abha',
  'Hofuf',
  'Taif',
  'Jubail',
  'Yanbu',
  'Najran',
  'Jizan',
  'Hail',
  'Sakaka',
  'Arar',
  'Al-Bahah',
  'Al-Qurayyat',
  'Unaizah',
  'Al-Rass',
];