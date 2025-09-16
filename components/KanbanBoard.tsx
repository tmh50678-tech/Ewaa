

import React, { useMemo, useState } from 'react';
import type { PurchaseRequest } from '../types';
import { RequestStatus } from '../types';
import { useTranslation } from '../i18n';
import KanbanColumn from './KanbanColumn';
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useAppContext } from '../App';
import { ROLES } from '../constants';

interface KanbanBoardProps {
  requests: PurchaseRequest[];
  onSelectRequest: (id: string) => void;
  selectedRequestId: string | null;
}

type ColumnId = 'draft' | 'pendingApproval' | 'inProgress' | 'completed' | 'rejected';

const KanbanBoard: React.FC<KanbanBoardProps> = ({ requests, onSelectRequest, selectedRequestId }) => {
  const { t } = useTranslation();
  const { currentUser, updateRequest } = useAppContext();

  const columns: Record<ColumnId, { title: string, statuses: RequestStatus[] }> = useMemo(() => ({
    draft: {
      title: t('kanban.draft'),
      statuses: [RequestStatus.DRAFT],
    },
    pendingApproval: {
      title: t('kanban.pendingApproval'),
      statuses: [
        RequestStatus.PENDING_HM_APPROVAL,
        RequestStatus.PENDING_QS_APPROVAL,
        RequestStatus.PENDING_QM_APPROVAL,
        RequestStatus.PENDING_PA_APPROVAL,
        RequestStatus.PENDING_FA_APPROVAL,
        RequestStatus.PENDING_PM_APPROVAL,
        RequestStatus.PENDING_AM_APPROVAL,
      ],
    },
    inProgress: {
      title: t('kanban.inProgress'),
      statuses: [
        RequestStatus.PENDING_PURCHASE,
        RequestStatus.PENDING_INVOICE,
        RequestStatus.PENDING_BANK_ROUNDS,
      ],
    },
    completed: {
      title: t('kanban.completed'),
      statuses: [RequestStatus.COMPLETED],
    },
    rejected: {
      title: t('kanban.rejected'),
      statuses: [RequestStatus.REJECTED],
    },
  }), [t]);

  const requestsById = useMemo(() => {
    return requests.reduce((acc, req) => {
      acc[req.id] = req;
      return acc;
    }, {} as Record<string, PurchaseRequest>);
  }, [requests]);

  const groupedRequests = useMemo(() => {
    const initialGroups: Record<ColumnId, PurchaseRequest[]> = {
      draft: [],
      pendingApproval: [],
      inProgress: [],
      completed: [],
      rejected: [],
    };

    return requests.reduce((acc, request) => {
      for (const colId in columns) {
        if (columns[colId as ColumnId].statuses.includes(request.status)) {
          acc[colId as ColumnId].push(request);
          return acc;
        }
      }
      return acc;
    }, initialGroups);
  }, [requests, columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require the mouse to move by 8px before activating a drag.
      // This allows for click events to be processed correctly on draggable items.
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const getColumnIdForStatus = (status: RequestStatus): ColumnId | undefined => {
      for (const colId in columns) {
          if (columns[colId as ColumnId].statuses.includes(status)) {
              return colId as ColumnId;
          }
      }
      return undefined;
  };

  const handleDragEnd = ({ active, over }: any) => {
      if (!over || active.id === over.id) return;
      
      const sourceRequest = requestsById[active.id];
      if (!sourceRequest) return;
      
      const sourceColumnId = getColumnIdForStatus(sourceRequest.status);
      const destColumnId = over.data?.current?.sortable?.containerId || over.id;

      if (!sourceColumnId || !destColumnId || sourceColumnId === destColumnId) {
        return;
      }

      // Very simplified permission check: only managers and admins can move things out of approval
      const canMove = currentUser.role === ROLES.ADMIN ||
        currentUser.role === ROLES.HOTEL_MANAGER ||
        currentUser.role === ROLES.PURCHASING_MANAGER ||
        currentUser.role === ROLES.ACCOUNTING_MANAGER ||
        currentUser.role === ROLES.QUALITY_MANAGER;

      if(sourceColumnId === 'pendingApproval' && !canMove) {
        return; // Non-authorized user trying to move an approval item
      }
      
      // Simplified status update: pick the first status of the new column
      const newStatus = columns[destColumnId as ColumnId].statuses[0];
      
      if(newStatus) {
        const updatedRequest = { ...sourceRequest, status: newStatus };
        updateRequest(updatedRequest);
      }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        {(Object.keys(columns) as ColumnId[]).map(columnId => (
          <KanbanColumn
            key={columnId}
            id={columnId}
            title={columns[columnId].title}
            requests={groupedRequests[columnId]}
            onSelectRequest={onSelectRequest}
            selectedRequestId={selectedRequestId}
          />
        ))}
      </div>
    </DndContext>
  );
};

export default KanbanBoard;