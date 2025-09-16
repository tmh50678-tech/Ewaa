
import React from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import RequestCard from './RequestCard';
import type { PurchaseRequest } from '../types';
import { useTranslation } from '../i18n';
import { useDroppable } from '@dnd-kit/core';

interface KanbanColumnProps {
  id: string;
  title: string;
  requests: PurchaseRequest[];
  onSelectRequest: (id: string) => void;
  selectedRequestId: string | null;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, requests, onSelectRequest, selectedRequestId }) => {
  const { t } = useTranslation();
  const requestIds = requests.map(r => r.id);
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex-shrink-0 w-80 bg-gray-200 rounded-lg shadow-sm">
      <div className="p-3 bg-gray-300 rounded-t-lg">
        <h2 className="font-bold text-gray-800 text-lg">
          {title}
          <span className="ml-2 rtl:mr-2 rtl:ml-0 text-sm font-normal text-gray-600 bg-gray-200 rounded-full px-2 py-0.5">
            {requests.length}
          </span>
        </h2>
      </div>
      <SortableContext id={id} items={requestIds} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="p-2 space-y-3 overflow-y-auto h-[calc(100%-4rem)]">
          {requests.length > 0 ? (
            requests.map(request => (
              <RequestCard 
                key={request.id} 
                request={request} 
                onSelectRequest={onSelectRequest} 
                isSelected={selectedRequestId === request.id}
              />
            ))
          ) : (
            <div className="p-4 flex items-center justify-center h-full text-center text-sm text-gray-500">{t('noRequestsFound')}</div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

export default KanbanColumn;
