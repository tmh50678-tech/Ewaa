

import React from 'react';
import type { PurchaseRequest } from '../types';
import { useTranslation } from '../i18n';
import { STATUS_COLORS } from '../constants';

interface RequestListProps {
  requests: PurchaseRequest[];
  onSelectRequest: (id: string) => void;
  selectedRequestId: string | null;
}

const RequestList: React.FC<RequestListProps> = ({ requests, onSelectRequest, selectedRequestId }) => {
  const { t, language } = useTranslation();

  if (requests.length === 0) {
    return <div className="p-4 text-center text-slate-400">{t('noRequestsFound')}</div>;
  }

  return (
    <div className="glass-panel rounded-lg overflow-hidden animate-fade-in-up h-full flex flex-col">
      <div className="overflow-auto">
        <table className="min-w-full divide-y divide-cyan-500/20">
          <thead className="bg-slate-800/80 sticky top-0 backdrop-blur-sm">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">{t('request')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">{t('requester')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">{t('branch')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">{t('total')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {requests.map(request => (
              <tr 
                key={request.id} 
                onClick={() => onSelectRequest(request.id)}
                className={`cursor-pointer transition-colors ${selectedRequestId === request.id ? 'bg-cyan-900/50' : 'hover:bg-slate-700/50'}`}
                aria-selected={selectedRequestId === request.id}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                  <div className="font-bold">#{request.referenceNumber}</div>
                  <div className="text-xs text-slate-400">ID: {request.id.substring(0, 6)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{request.requester.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{request.branch.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-cyan-300">{t('currency')} {request.totalEstimatedCost.toLocaleString(language)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[request.status]}`}>
                    {t(request.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RequestList;