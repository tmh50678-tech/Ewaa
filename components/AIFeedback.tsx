import React from 'react';
import type { AugmentedAIAnalysisResult } from '../types';
import { useTranslation } from '../i18n';

interface AIFeedbackProps {
    result: AugmentedAIAnalysisResult;
}

const AIFeedback: React.FC<AIFeedbackProps> = ({ result }) => {
    const { duplicateCheck, priceCheck, internalPriceCheck } = result;
    const { t, language } = useTranslation();

    const isDuplicate = duplicateCheck.isDuplicate;
    const isOverpriced = priceCheck.priceAnalysis.some(p => p.isOverpriced);
    const hasHigherInternalPrice = internalPriceCheck.some(p => p.comparison === 'higher');

    const SuccessIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );

    const AlertIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    );
    
    interface FeedbackSectionProps {
        title: string;
        alertType: 'critical' | 'warning' | 'success';
        children: React.ReactNode;
    }

    const FeedbackSection: React.FC<FeedbackSectionProps> = ({ title, alertType, children }) => {
        const styles = {
            critical: { icon: 'text-red-500', text: 'text-red-800', bg: 'bg-red-50', border: 'border-red-400' },
            warning: { icon: 'text-yellow-500', text: 'text-yellow-800', bg: 'bg-yellow-50', border: 'border-yellow-400' },
            success: { icon: 'text-green-500', text: 'text-green-800', bg: 'bg-green-50', border: 'border-green-400' },
        };
        const selectedStyle = styles[alertType];

        return (
            <div className="mb-6">
                <h3 className={`text-lg font-semibold mb-2 flex items-center ${selectedStyle.text}`}>
                    <span className={`flex-shrink-0 h-6 w-6 ${selectedStyle.icon} ${language === 'ar' ? 'ml-2' : 'mr-2'}`}>
                        {alertType === 'success' ? <SuccessIcon /> : <AlertIcon />}
                    </span>
                    {title}
                </h3>
                <div className={`p-4 rounded-lg ${selectedStyle.bg} ${selectedStyle.border} ${language === 'ar' ? 'border-r-4' : 'border-l-4'}`}>
                    {children}
                </div>
            </div>
        );
    };


    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">{t('aiInvoiceAnalysis')}</h2>
            
            <FeedbackSection
                title={t('duplicateCheck')}
                alertType={isDuplicate ? 'critical' : 'success'}
            >
                <p className="font-bold">{isDuplicate ? t('potentialDuplicateFound') : t('noDuplicateFound')}</p>
                <p className="text-sm">{duplicateCheck.reason}</p>
            </FeedbackSection>
            
            <FeedbackSection
                title={t('priceVerification')}
                alertType={isOverpriced ? 'warning' : 'success'}
            >
                 <p className="font-bold mb-2">{priceCheck.overallAssessment}</p>
                 <ul className="space-y-2 text-sm">
                     {priceCheck.priceAnalysis.map((item, index) => (
                         <li key={index} className={`p-2 rounded ${item.isOverpriced ? 'bg-yellow-100' : 'bg-green-100'}`}>
                             <strong>{item.itemName} ({t('currency')} {item.price.toLocaleString(language)}):</strong> {item.marketPriceComparison}
                         </li>
                     ))}
                 </ul>
            </FeedbackSection>

            <FeedbackSection
                title={t('internalPriceCheckTitle')}
                alertType={hasHigherInternalPrice ? 'warning' : 'success'}
            >
                 <p className="font-bold mb-2">{hasHigherInternalPrice ? t('priceHigherWarning') : t('priceLowerOrSameInfo')}</p>
                 <ul className="space-y-2 text-sm">
                     {internalPriceCheck.map((item, index) => {
                        let styling = 'bg-gray-100';
                        let textContent = '';

                        switch(item.comparison) {
                            case 'higher':
                                styling = 'bg-yellow-100';
                                textContent = t('internalPriceCheck.higher', { 
                                    invoicePrice: item.invoicePrice.toLocaleString(language),
                                    catalogPrice: item.catalogPrice?.toLocaleString(language) || 'N/A'
                                });
                                break;
                            case 'lower':
                                styling = 'bg-green-100';
                                textContent = t('internalPriceCheck.lower', { 
                                    invoicePrice: item.invoicePrice.toLocaleString(language),
                                    catalogPrice: item.catalogPrice?.toLocaleString(language) || 'N/A'
                                });
                                break;
                            case 'new':
                                styling = 'bg-blue-100';
                                textContent = t('internalPriceCheck.new');
                                break;
                            case 'same':
                                styling = 'bg-gray-100';
                                textContent = t('internalPriceCheck.same');
                                break;
                        }

                         return (
                            <li key={index} className={`p-2 rounded ${styling}`}>
                                <strong>{item.itemName} ({t('currency')} {item.invoicePrice.toLocaleString(language)}):</strong> {textContent}
                            </li>
                         );
                     })}
                 </ul>
            </FeedbackSection>

        </div>
    );
};

export default AIFeedback;