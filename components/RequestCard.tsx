
import React from 'react';
import type { PurchaseRequest } from '../types';
import { STATUS_COLORS } from '../constants';
import { useTranslation } from '../i18n';
import { useSortable } from '@dnd-kit/sortable';

interface RequestCardProps {
  request: PurchaseRequest;
  onSelectRequest: (id: string) => void;
  isSelected: boolean;
}

const RequestCard: React.FC<RequestCardProps> = ({ request, onSelectRequest, isSelected }) => {
  const { t, language } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: request.id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelectRequest(request.id)}
      className={`bg-white rounded-md shadow p-4 cursor-pointer hover:shadow-lg transition-all border-l-4 ${isSelected ? 'border-accent-500 bg-accent-50 ring-2 ring-accent-500' : 'border-primary-500'}`}
    >
      <div {...attributes} {...listeners} className="touch-none">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-gray-800 mb-2">{t('request')} #{request.id.substring(0, 6)}</h3>
          <div className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[request.status]}`}>
              {t(request.status)}
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600">{t('requester')}: {request.requester.name}</p>
          <p className="text-sm text-gray-600">{t('branch')}: {request.branch.name} ({request.branch.city})</p>
          <div className="border-t my-2"></div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
                {new Date(request.createdAt).toLocaleDateString(language, {month: 'short', day: 'numeric'})}
            </p>
            <p className="text-base font-bold text-primary-800">
              {t('currency')} {request.totalEstimatedCost.toLocaleString(language)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestCard;
