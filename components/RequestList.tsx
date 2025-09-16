
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
    return <div className="p-4 text-center text-gray-500">{t('noRequestsFound')}</div>;
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden animate-fade-in-up">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('request')} ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('requester')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('branch')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('total')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map(request => (
              <tr 
                key={request.id} 
                onClick={() => onSelectRequest(request.id)}
                className={`cursor-pointer transition-colors ${selectedRequestId === request.id ? 'bg-accent-50' : 'hover:bg-gray-50'}`}
                aria-selected={selectedRequestId === request.id}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{request.id.substring(0, 6)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.requester.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.branch.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-800">{t('currency')} {request.totalEstimatedCost.toLocaleString(language)}</td>
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
