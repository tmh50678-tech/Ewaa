
import React, { useRef } from 'react';
import type { PurchaseRequest } from '../types';
import { RequestStatus } from '../types';
import { STATUS_COLORS, ROLES } from '../constants';
import { useTranslation } from '../i18n';
import InvoiceUploadForm from './InvoiceUploadForm';
import AIFeedback from './AIFeedback';
import { useAppContext } from '../App';
import { useRequestActions } from '../hooks/useRequestActions';

interface RequestDetailsProps {
  request: PurchaseRequest;
  onClose: () => void;
}

const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mt-6 border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
        {children}
    </div>
);

const RequestDetails: React.FC<RequestDetailsProps> = ({ request, onClose }) => {
    const { t, language } = useTranslation();
    const { currentUser } = useAppContext();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
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
    } = useRequestActions(request);


    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            await addAttachment(event.target.files[0]);
        }
    };

    const actionTranslationMap: { [key: string]: string } = {
        'Submitted': t('submitted'),
        'Approved': t('approved'),
        'Rejected': t('rejected'),
        'Marked as Purchased': t('markedAsPurchased'),
        'Processed Invoice': t('processedInvoice'),
        'Bank Round Completed': t('bankRoundCompleted'),
    };
    
    const showSupplierInfo = request.status === RequestStatus.PENDING_PURCHASE && currentUser.role === ROLES.PURCHASING_REP;
    const showActionFooter = canApproveOrReject || canMarkAsPurchased || canCompleteBankRound;
    
    return (
        <div className="bg-white rounded-lg h-full flex flex-col">
            <div className="flex-grow overflow-y-auto p-4">
                <div className="flex justify-between items-start mb-4">
                    <div className="text-center md:text-left flex-grow">
                        <h2 className="text-2xl font-bold text-gray-800">{t('requestDetails')} #{request.id.substring(0, 6)}</h2>
                        <div className={`mt-2 inline-block px-3 py-1 text-sm font-semibold rounded-full ${STATUS_COLORS[request.status]}`}>
                            {t(request.status)}
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl" aria-label="Close details">
                        &times;
                    </button>
                </div>
            
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mt-6">
                    <div><strong>{t('requester')}:</strong> {request.requester.name}</div>
                    <div><strong>{t('branch')}:</strong> {request.branch.name} ({request.branch.city})</div>
                    <div><strong>{t('department')}:</strong> {request.department}</div>
                    <div><strong>{t('total')}:</strong> {t('currency')} {request.totalEstimatedCost.toLocaleString(language)}</div>
                </div>

                <DetailSection title={t('items')}>
                    <ul className="space-y-3">
                        {request.items.map(item => (
                            <li key={item.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-gray-800 flex-grow pr-4">{item.name}</h4>
                                    <span className="text-lg font-bold text-primary-700 flex-shrink-0">
                                        {t('currency')} {(item.quantity * item.estimatedCost).toLocaleString(language)}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 bg-gray-200 inline-block px-2 py-0.5 rounded-full mt-1">{item.category}</p>
                                <div className="mt-2 text-sm text-gray-600">
                                    <span className="font-medium">{item.quantity} {item.unit}</span>
                                    <span className="mx-2 text-gray-300">|</span>
                                    <span>{t('currency')} {item.estimatedCost.toLocaleString(language)} {t('perUnit')}</span>
                                </div>
                                {item.justification && (
                                    <blockquote className="mt-2 p-2 bg-white border-l-4 border-gray-200 text-gray-600 text-sm italic">
                                        {item.justification}
                                    </blockquote>
                                )}
                            </li>
                        ))}
                    </ul>
                </DetailSection>

                <DetailSection title={t('attachments')}>
                    <div className="space-y-3">
                        {request.attachments?.map(att => {
                            const canDelete = currentUser.id === att.uploadedBy.id || currentUser.role === ROLES.ADMIN;
                            const uploadDate = new Date(att.uploadedAt).toLocaleDateString(language, { year: 'numeric', month: 'short', day: 'numeric' });
                            return (
                                <div key={att.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                    <a href={att.fileData} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-primary-600 hover:underline">
                                        {att.mimeType.startsWith('image/') ? (
                                            <img src={att.fileData} alt={att.fileName} className="w-10 h-10 object-cover rounded" />
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        )}
                                        <div>
                                            <p className="font-semibold">{att.fileName}</p>
                                            <p className="text-xs text-gray-500">
                                                {t('uploadedBy', { name: att.uploadedBy.name, date: uploadDate })}
                                            </p>
                                        </div>
                                    </a>
                                    {canDelete && (
                                        <button onClick={() => deleteAttachment(att.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    {canManageAttachments && (
                        <div className="mt-4">
                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-primary-100 text-primary-700 font-semibold py-2 px-4 rounded-md hover:bg-primary-200 transition-colors"
                            >
                                {t('attachFile')}
                            </button>
                        </div>
                    )}
                </DetailSection>

                {showSupplierInfo && (
                    <DetailSection title={t('supplierInformation')}>
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                            <h4 className="font-bold text-blue-800">{t('relevantSuppliers')}</h4>
                            <ul className="mt-2 space-y-3 text-sm">
                                {relevantSuppliers.map(supplier => {
                                    const website = supplier.website || '';
                                    let websiteUrl: string | null = null;
                                    if (website.startsWith('http')) {
                                        websiteUrl = website;
                                    } else if (website.includes('.com') || website.includes('.sa') || website.includes('.net') || website.includes('.me')) {
                                        websiteUrl = `http://${website}`;
                                    }

                                    return (
                                    <li key={supplier.name} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h5 className="font-bold text-gray-800">{supplier.name}</h5>
                                                <p className="text-xs text-gray-500 bg-gray-100 inline-block px-2 py-0.5 rounded-full mt-1">{supplier.category}</p>
                                            </div>
                                            {websiteUrl ? (
                                                <a 
                                                    href={websiteUrl}
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="text-primary-600 hover:underline text-xs flex items-center gap-1"
                                                >
                                                    <span>Visit Website</span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                </a>
                                            ) : website ? <span className="text-xs text-gray-400">{website}</span> : null}
                                        </div>
                                        <p className="font-mono text-gray-700 mt-2">{t('contact')}: {supplier.contact}</p>
                                        {supplier.notes && <p className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded italic">"{supplier.notes}"</p>}
                                    </li>
                                )})}
                                {relevantSuppliers.length === 0 && <p className="text-gray-500 italic">No specific suppliers found for this branch.</p>}
                            </ul>
                        </div>
                    </DetailSection>
                )}

                <DetailSection title={t('approvalHistory')}>
                    <ul className="space-y-3">
                        {request.approvalHistory.map((entry, index) => (
                            <li key={index} className="flex gap-4">
                                <div className="text-xs text-gray-500 w-24 flex-shrink-0">
                                    {new Date(entry.timestamp).toLocaleDateString(language, { year: 'numeric', month: 'short', day: 'numeric' })}<br/>
                                    {new Date(entry.timestamp).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="flex-grow text-black">
                                    <span className="font-semibold">{entry.user.name}</span> {actionTranslationMap[entry.action] || entry.action}
                                    {entry.comment && <p className="text-sm text-gray-800 pl-2 border-l-2 ml-1 mt-1 italic">"{entry.comment}"</p>}
                                </div>
                            </li>
                        ))}
                    </ul>
                </DetailSection>
                
                {request.invoice && (
                    <DetailSection title={t('invoiceDetails')}>
                        <div className="flex gap-4 items-start">
                            <a href={request.invoice.fileData} target="_blank" rel="noopener noreferrer">
                                <img src={request.invoice.fileData} alt="Invoice" className="w-32 h-32 object-cover rounded-md border" />
                            </a>
                            <div className="text-sm">
                                <p><strong>{t('vendor')}:</strong> {request.invoice.vendorName}</p>
                                <p><strong>{t('invoiceNumber')}:</strong> {request.invoice.invoiceNumber}</p>
                                <p><strong>{t('invoiceDate')}:</strong> {new Date(request.invoice.invoiceDate).toLocaleDateString(language)}</p>
                                <p><strong>{t('totalAmount')}:</strong> {t('currency')} {request.invoice.totalAmount.toLocaleString(language)}</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <AIFeedback result={request.invoice.aiAnalysis} />
                        </div>
                    </DetailSection>
                )}

                {canProcessInvoice && (
                    <DetailSection title={t('processInvoice')}>
                        <InvoiceUploadForm 
                            request={request} 
                        />
                    </DetailSection>
                )}
            </div>
            
            {showActionFooter && (
                <div className="flex-shrink-0 p-4 border-t bg-white sticky bottom-0">
                    <div className="flex gap-4">
                        {canApproveOrReject && (
                            <>
                                <button
                                    onClick={approve}
                                    className="flex-1 rounded-lg bg-green-600 px-6 py-3 text-center text-base font-semibold text-white shadow-sm transition-colors hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                                >
                                    {t('approve')}
                                </button>
                                <button
                                    onClick={reject}
                                    className="flex-1 rounded-lg bg-red-600 px-6 py-3 text-center text-base font-semibold text-white shadow-sm transition-colors hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                                >
                                    {t('reject')}
                                </button>
                            </>
                        )}
                        {canMarkAsPurchased && (
                            <button
                                onClick={markAsPurchased}
                                className="w-full rounded-lg bg-blue-600 px-6 py-3 text-center text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            >
                                {t('markAsPurchased')}
                            </button>
                        )}
                        {canCompleteBankRound && (
                            <button
                                onClick={completeBankRound}
                                className="w-full rounded-lg bg-teal-600 px-6 py-3 text-center text-base font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                            >
                                {t('completeBankRound')}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RequestDetails;
