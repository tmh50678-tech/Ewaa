

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

  const inputStyles = "w-full sm:w-48 block py-2 px-3 border-b-2 border-slate-600 bg-slate-900/50 rounded-t-md shadow-sm focus:outline-none focus:ring-0 focus:border-cyan-400 sm:text-sm transition";

  return (
    <div className="p-4 glass-panel mb-4 rounded-lg flex flex-col sm:flex-row items-center gap-4">
      <div className="relative flex-grow w-full sm:w-auto">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none rtl:left-auto rtl:right-0 rtl:pl-0 rtl:pr-3">
            <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
        </div>
        <input
          type="text"
          placeholder={t('searchRequests')}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border-b-2 border-slate-600 rounded-t-md leading-5 bg-slate-900/50 placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-cyan-400 sm:text-sm rtl:pl-3 rtl:pr-10 transition"
          aria-label={t('searchRequests')}
        />
      </div>
      
      {showBranchFilter && (
        <select
          value={filterBranchId}
          onChange={(e) => onBranchChange(e.target.value)}
          className={inputStyles}
          aria-label={t('filterByBranch')}
        >
          <option value="" className="bg-slate-900">{t('allBranches')}</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id} className="bg-slate-900">
              {branch.name}
            </option>
          ))}
        </select>
      )}

      <select
        value={filterDepartment}
        onChange={(e) => onDepartmentChange(e.target.value)}
        className={inputStyles}
        aria-label={t('filterByDepartment')}
      >
        <option value="" className="bg-slate-900">{t('allDepartments')}</option>
        {DEPARTMENTS.map((dep) => (
          <option key={dep} value={dep} className="bg-slate-900">
            {t(dep.toLowerCase().replace('&', 'and'))}
          </option>
        ))}
      </select>

      <button
        onClick={onClear}
        className="w-full sm:w-auto px-4 py-2 border border-slate-600 text-sm font-medium rounded-md text-slate-300 bg-slate-700/50 hover:bg-slate-600/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
      >
        {t('clearFilters')}
      </button>

      <div className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-lg">
        <button onClick={() => onViewChange('kanban')} aria-label={t('kanbanView')} className={`p-2 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
        </button>
        <button onClick={() => onViewChange('list')} aria-label={t('listView')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
