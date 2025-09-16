
import React, { useState } from 'react';
import type { PurchaseRequest, AIAnalysisResult, Invoice, InternalPriceCheckItem, AugmentedAIAnalysisResult } from '../types';
import { RequestStatus } from '../types';
import { analyzeInvoice } from '../services/geminiService';
import Spinner from './Spinner';
import AIFeedback from './AIFeedback';
import Modal from './Modal';
import { useTranslation } from '../i18n';
import { useAppContext } from '../App';

interface InvoiceUploadFormProps {
    request: PurchaseRequest;
}

const fileToBase64 = (file: File): Promise<{ data: string, mimeType: string, fullDataUrl: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const fullDataUrl = reader.result as string;
            const mimeType = fullDataUrl.split(':')[1].split(';')[0];
            const data = fullDataUrl.split(',')[1];
            resolve({ data, mimeType, fullDataUrl });
        };
        reader.onerror = error => reject(error);
    });
};


const InvoiceUploadForm: React.FC<InvoiceUploadFormProps> = ({ request }) => {
    const { 
        currentUser, 
        updateRequest: onInvoiceProcessed, 
        itemCatalog, 
        handleUpdateCatalog: onUpdateCatalog, 
        handleUpsertSupplier: onUpsertSupplier 
    } = useAppContext();

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [base64Image, setBase64Image] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [augmentedAnalysis, setAugmentedAnalysis] = useState<AugmentedAIAnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { t } = useTranslation();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
            setError(null);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedFile) {
            setError(t('error.selectInvoice'));
            return;
        }

        setIsLoading(true);
        setError(null);
        setAugmentedAnalysis(null);

        try {
            const { data: base64Data, mimeType, fullDataUrl } = await fileToBase64(selectedFile);
            setBase64Image(fullDataUrl);
            const result: AIAnalysisResult = await analyzeInvoice(base64Data, mimeType, []);
            
            // Perform internal price check
            const internalPriceCheck: InternalPriceCheckItem[] = result.extractedData.items.map(invoiceItem => {
                const catalogItem = itemCatalog.find(ci => ci.name.toLowerCase() === invoiceItem.itemName.toLowerCase());
                if (catalogItem) {
                    if (invoiceItem.price < catalogItem.estimatedCost) {
                        return { itemName: invoiceItem.itemName, invoicePrice: invoiceItem.price, catalogPrice: catalogItem.estimatedCost, comparison: 'lower' };
                    } else if (invoiceItem.price > catalogItem.estimatedCost) {
                        return { itemName: invoiceItem.itemName, invoicePrice: invoiceItem.price, catalogPrice: catalogItem.estimatedCost, comparison: 'higher' };
                    } else {
                        return { itemName: invoiceItem.itemName, invoicePrice: invoiceItem.price, catalogPrice: catalogItem.estimatedCost, comparison: 'same' };
                    }
                }
                return { itemName: invoiceItem.itemName, invoicePrice: invoiceItem.price, comparison: 'new' };
            });

            setAugmentedAnalysis({ ...result, internalPriceCheck });
            setIsModalOpen(true);
        } catch (err) {
            setError(t('error.failedAnalysis'));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = () => {
        if (!augmentedAnalysis?.extractedData || !base64Image) return;

        // Update item catalog (including adding new items)
        onUpdateCatalog(augmentedAnalysis.extractedData.items);

        // Update supplier and sales rep info
        if (augmentedAnalysis.extractedData.vendorName) {
            onUpsertSupplier(
                augmentedAnalysis.extractedData.vendorName,
                augmentedAnalysis.extractedData.salesRepresentative,
                request.branch.id
            );
        }


        const newInvoice: Invoice = {
            id: `INV-${Date.now()}`,
            vendorName: augmentedAnalysis.extractedData.vendorName,
            invoiceNumber: augmentedAnalysis.extractedData.invoiceNumber,
            invoiceDate: augmentedAnalysis.extractedData.invoiceDate,
            totalAmount: augmentedAnalysis.extractedData.totalAmount,
            fileData: base64Image,
            aiAnalysis: augmentedAnalysis,
        };

        const newHistoryEntry = {
            user: currentUser,
            action: 'Processed Invoice',
            timestamp: new Date(),
            comment: `Invoice ${newInvoice.invoiceNumber} processed.`,
        };

        const updatedRequest = {
            ...request,
            status: RequestStatus.PENDING_AM_APPROVAL,
            approvalHistory: [...request.approvalHistory, newHistoryEntry],
            invoice: newInvoice,
        };

        onInvoiceProcessed(updatedRequest);
        setIsModalOpen(false);
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                <button
                    onClick={handleAnalyze}
                    disabled={isLoading || !selectedFile}
                    className="w-full sm:w-auto flex justify-center items-center bg-primary-600 text-white py-2 px-6 rounded-md hover:bg-primary-700 transition-colors disabled:bg-primary-300"
                >
                    {isLoading ? <Spinner /> : t('analyzeInvoice')}
                </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {augmentedAnalysis && (
                    <div>
                        <AIFeedback result={augmentedAnalysis} />
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleConfirm}
                                className="bg-green-500 text-white py-2 px-6 rounded-md hover:bg-green-600 transition-colors"
                            >
                                {t('confirmAndProceed')}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default InvoiceUploadForm;
