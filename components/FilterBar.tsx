
import React from 'react';
import { useTranslation } from '../i18n';
import { DEPARTMENTS } from '../constants';
import type { Branch, User } from '../types';
import { ROLES } from '../constants';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterBranchId: string;
  onBranchChange: (branchId: string) => void;
  filterDepartment: string;
  onDepartmentChange: (department: string) => void;
  onClear: () => void;
  branches: Branch[];
  currentUser: User;
  viewMode: 'kanban' | 'list';
  onViewChange: (mode: 'kanban' | 'list') => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  filterBranchId,
  onBranchChange,
  filterDepartment,
  onDepartmentChange,
  onClear,
  branches,
  currentUser,
  viewMode,
  onViewChange,
}) => {
  const { t } = useTranslation();
  const showBranchFilter = currentUser.role === ROLES.ADMIN || currentUser.role === ROLES.AUDITOR || currentUser.branches.length > 1;

  return (
    <div className="p-4 bg-white shadow-md mb-4 rounded-lg flex flex-col sm:flex-row items-center gap-4">
      <div className="relative flex-grow w-full sm:w-auto">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none rtl:left-auto rtl:right-0 rtl:pl-0 rtl:pr-3">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
        </div>
        <input
          type="text"
          placeholder={t('searchRequests')}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm rtl:pl-3 rtl:pr-10"
          aria-label={t('searchRequests')}
        />
      </div>
      
      {showBranchFilter && (
        <select
          value={filterBranchId}
          onChange={(e) => onBranchChange(e.target.value)}
          className="w-full sm:w-48 block py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          aria-label={t('filterByBranch')}
        >
          <option value="">{t('allBranches')}</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      )}

      <select
        value={filterDepartment}
        onChange={(e) => onDepartmentChange(e.target.value)}
        className="w-full sm:w-48 block py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        aria-label={t('filterByDepartment')}
      >
        <option value="">{t('allDepartments')}</option>
        {DEPARTMENTS.map((dep) => (
          <option key={dep} value={dep}>
            {t(dep.toLowerCase().replace('&', 'and'))}
          </option>
        ))}
      </select>

      <button
        onClick={onClear}
        className="w-full sm:w-auto px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        {t('clearFilters')}
      </button>

      <div className="flex items-center gap-2">
        <button onClick={() => onViewChange('kanban')} aria-label={t('kanbanView')} className={`p-2 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
        </button>
        <button onClick={() => onViewChange('list')} aria-label={t('listView')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
