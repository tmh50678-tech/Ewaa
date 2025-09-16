



import React, { useState, useRef, useEffect } from 'react';
import type { PurchaseRequest, PurchaseRequestItem, SupplierSuggestion } from '../types';
import { RequestStatus } from '../types';
import { useTranslation } from '../i18n';
import { ROLES, DEPARTMENTS } from '../constants';
import { getSupplierSuggestions } from '../services/geminiService';
import Spinner from './Spinner';
import { useAppContext } from '../App';

interface PurchaseRequestFormProps {
    onClose: () => void;
    requestToEdit?: PurchaseRequest | null;
}

const DRAFT_STORAGE_KEY = 'purchaseRequestDraft';

// Fuzzy match function for more resilient searching
const fuzzyMatch = (pattern: string, text: string): boolean => {
    pattern = pattern.toLowerCase();
    text = text.toLowerCase();
    let patternIndex = 0;
    
    for (let i = 0; i < text.length && patternIndex < pattern.length; i++) {
        if (text[i] === pattern[patternIndex]) {
            patternIndex++;
        }
    }
    
    return patternIndex === pattern.length;
};


const PurchaseRequestForm: React.FC<PurchaseRequestFormProps> = ({ onClose, requestToEdit }) => {
    const { t } = useTranslation();
    const { 
        currentUser, 
        addRequest, 
        updateRequest,
        branches, 
        showToast, 
        itemCatalog, 
        suppliers,
        purchaseRequests,
    } = useAppContext();

    const isEditing = !!requestToEdit;

    // FIX: Corrected the type of the 'items' state to be an array of items (Omit<PurchaseRequestItem, 'id'>[]),
    // which resolves numerous type errors throughout the component where array methods like .map, .filter, and .reduce were used.
    const [items, setItems] = useState<Omit<PurchaseRequestItem, 'id'>[]>([
        { name: '', quantity: 1, unit: '', estimatedCost: 0, category: '', justification: '' }
    ]);
    const userBranches = currentUser.role === ROLES.ADMIN 
        ? branches 
        : branches.filter(b => currentUser.branches.includes(b.id));
    const [branchId, setBranchId] = useState<string>(userBranches[0]?.id || '');
    const [department, setDepartment] = useState('Housekeeping');
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<SupplierSuggestion[]>([]);
    const [suggestionError, setSuggestionError] = useState<string | null>(null);

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (isEditing) {
            setItems(requestToEdit.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                estimatedCost: item.estimatedCost,
                category: item.category,
                justification: item.justification,
            })));
            setBranchId(requestToEdit.branch.id);
            setDepartment(requestToEdit.department);
        } else {
            try {
                const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
                if (savedDraft) {
                    const draftData = JSON.parse(savedDraft);
                    if (draftData.items && draftData.branchId && draftData.department) {
                        setItems(draftData.items);
                        setBranchId(draftData.branchId);
                        setDepartment(draftData.department);
                    }
                }
            } catch (error) {
                console.error("Failed to load draft:", error);
                localStorage.removeItem(DRAFT_STORAGE_KEY);
            }
        }
    }, [requestToEdit, isEditing]);

    const handleItemChange = (index: number, field: keyof Omit<PurchaseRequestItem, 'id'>, value: string | number) => {
        const newItems = [...items];
        const item = { ...newItems[index] };
        // @ts-ignore
        item[field] = value;
        newItems[index] = item;
        setItems(newItems);
    };

    const handleSelectItem = (index: number, catalogItem: { name: string, unit: string, category: string, estimatedCost: number }) => {
        const newItems = [...items];
        newItems[index] = {
            ...newItems[index], // keep justification & quantity
            name: catalogItem.name,
            unit: catalogItem.unit,
            category: catalogItem.category,
            estimatedCost: catalogItem.estimatedCost,
        };
        setItems(newItems);
        setActiveDropdown(null);
    };

    const handleAddItem = () => {
        setItems([...items, { name: '', quantity: 1, unit: '', estimatedCost: 0, category: '', justification: '' }]);
    };

    const handleRemoveItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };
    
    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        const selectedBranch = branches.find(b => b.id === branchId);
        if (!selectedBranch) {
            console.error("Selected branch not found");
            return;
        }

        const totalEstimatedCost = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.estimatedCost), 0);
        
        const finalItems: PurchaseRequestItem[] = items.map((item, index) => ({
            ...item,
            id: `item-${Date.now()}-${index}`,
        }));

        if (isEditing) {
             const updatedRequest: PurchaseRequest = {
                ...requestToEdit,
                requester: currentUser, // In case admin edits, it becomes theirs
                status: department === 'Projects' ? RequestStatus.PENDING_QS_APPROVAL : RequestStatus.PENDING_HM_APPROVAL,
                items: finalItems,
                totalEstimatedCost,
                department,
                branch: selectedBranch,
                approvalHistory: [...requestToEdit.approvalHistory, { user: currentUser, action: 'Resubmitted', timestamp: new Date() }],
             };
             updateRequest(updatedRequest);
        } else {
            const maxRefNum = purchaseRequests.reduce((max, req) => req.referenceNumber > max ? req.referenceNumber : max, 1000);
            const newReferenceNumber = maxRefNum + 1;

            const newRequest: PurchaseRequest = {
                id: `pr-${Date.now()}`,
                referenceNumber: newReferenceNumber,
                requester: currentUser,
                status: department === 'Projects' ? RequestStatus.PENDING_QS_APPROVAL : RequestStatus.PENDING_HM_APPROVAL,
                items: finalItems,
                totalEstimatedCost,
                createdAt: new Date().toISOString(),
                approvalHistory: [{ user: currentUser, action: 'Submitted', timestamp: new Date() }],
                department,
                branch: selectedBranch,
            };
            addRequest(newRequest);
            localStorage.removeItem(DRAFT_STORAGE_KEY);
        }

        onClose();
    };

    const handleSaveDraft = () => {
        if(isEditing) {
            // "Save Draft" in edit mode should just save changes without submitting.
            const updatedRequest = { ...requestToEdit, items: items.map((item, index) => ({...item, id: requestToEdit.items[index]?.id || `item-${Date.now()}-${index}`})), branch: branches.find(b => b.id === branchId)!, department };
            updateRequest(updatedRequest);
            showToast(t('toast.draftSaved'));
        } else {
            const draftData = { items, branchId, department };
            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
            showToast(t('toast.draftSaved'));
        }
        onClose();
    };

    const handleCancel = () => {
        if (!isEditing) {
            localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
        onClose();
    };

    const handleGetSuggestions = async () => {
        setIsLoadingSuggestions(true);
        setSuggestionError(null);
        setSuggestions([]);

        try {
            const relevantSuppliers = suppliers.filter(s => s.branches.includes(branchId));
            const suggestionResult = await getSupplierSuggestions(items, relevantSuppliers);
            setSuggestions(suggestionResult);
        } catch (error) {
            console.error("Failed to get supplier suggestions:", error);
            setSuggestionError(t('error.suggestionFailed'));
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    const inputStyles = "block w-full px-4 py-3 bg-slate-900/50 border-b-2 border-slate-500 rounded-t-md placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-cyan-400 sm:text-sm transition";
    const readOnlyInputStyles = "block w-full px-4 py-3 bg-slate-800/50 border-b-2 border-slate-600 rounded-t-md text-slate-400 cursor-not-allowed text-lg";

    return (
        <div className="h-full">
            <div className="flex justify-between items-center mb-6 sticky top-0 py-2 border-b border-cyan-500/20">
                <h2 className="text-2xl font-bold text-white flex-grow text-center md:text-left">
                    {isEditing ? t('editRequest') : t('createNewRequest')}
                </h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="branch" className="block text-base font-bold mb-2 text-slate-200">{t('branch')}</label>
                         <select
                            id="branch"
                            value={branchId}
                            onChange={(e) => setBranchId(e.target.value)}
                            required
                            disabled={userBranches.length <= 1}
                            className={`${inputStyles} disabled:bg-slate-800/50 disabled:cursor-not-allowed`}
                        >
                            {userBranches.map(branch => (
                                <option key={branch.id} value={branch.id} className="bg-slate-900">{branch.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="department" className="block text-base font-bold mb-2 text-slate-200">{t('department')}</label>
                        <select
                            id="department"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            required
                            className={inputStyles}
                        >
                            {DEPARTMENTS.map(dep => (
                                <option key={dep} value={dep} className="bg-slate-900">{t(dep.toLowerCase().replace('&', 'and'))}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <h3 className="text-xl font-semibold text-white border-b border-cyan-500/20 pb-2">{t('items')}</h3>
                
                <div className="space-y-4" ref={dropdownRef}>
                    {items.map((item, index) => {
                         const filteredCatalog = item.name
                            ? itemCatalog.filter(ci => fuzzyMatch(item.name, ci.name))
                            : itemCatalog;

                        return (
                        <div key={index} className="p-6 border border-slate-700 rounded-xl relative space-y-4 bg-slate-800/50 shadow-lg">
                             {items.length > 1 && (
                                <button type="button" onClick={() => handleRemoveItem(index)} className="absolute top-3 right-3 rtl:right-auto rtl:left-3 text-pink-500 hover:text-pink-400 font-bold text-2xl">&times;</button>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <label className="block text-base font-bold mb-2 text-slate-200">{t('itemName')}</label>
                                    <input 
                                        type="text" 
                                        value={item.name} 
                                        onChange={e => handleItemChange(index, 'name', e.target.value)}
                                        onFocus={() => setActiveDropdown(index)}
                                        placeholder={t('searchItemPlaceholder')}
                                        required 
                                        autoComplete="off"
                                        className={inputStyles} />
                                    {activeDropdown === index && (
                                        <ul className="absolute z-10 w-full bg-slate-800 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto mt-1">
                                            {filteredCatalog.map(catalogItem => (
                                                <li
                                                    key={catalogItem.name}
                                                    onClick={() => handleSelectItem(index, catalogItem)}
                                                    className="px-3 py-2 cursor-pointer hover:bg-cyan-900/50 text-white"
                                                >
                                                    {catalogItem.name}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-base font-bold mb-2 text-slate-200">{t('category')}</label>
                                    <input type="text" value={item.category} readOnly className={readOnlyInputStyles} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-base font-bold mb-2 text-slate-200">{t('quantity')}</label>
                                    <input type="number" value={item.quantity} min="1" onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} required className={inputStyles} />
                                </div>
                                <div>
                                    <label className="block text-base font-bold mb-2 text-slate-200">{t('unit')}</label>
                                    <input type="text" value={item.unit} readOnly className={readOnlyInputStyles} />
                                </div>
                                <div>
                                    <label className="block text-base font-bold mb-2 text-slate-200">{t('estimatedCost')}</label>
                                    <input type="number" value={item.estimatedCost} readOnly className={readOnlyInputStyles} />
                                </div>
                            </div>
                             <div>
                                <label className="block text-base font-bold mb-2 text-slate-200">{t('justification')}</label>
                                <textarea 
                                    value={item.justification} 
                                    onChange={e => handleItemChange(index, 'justification', e.target.value)} 
                                    required
                                    rows={2}
                                    className={inputStyles}
                                />
                            </div>
                        </div>
                        )
                    })}
                </div>
                
                <div className="border-t border-cyan-500/20 pt-4">
                    <button type="button" onClick={handleAddItem} className="text-cyan-400 hover:text-cyan-300 font-semibold">
                        {t('addItem')}
                    </button>
                </div>

                <div className="border-t border-cyan-500/20 pt-4">
                    <h3 className="text-xl font-semibold text-white mb-2">{t('aiSupplierSuggestions')}</h3>
                    <button 
                        type="button" 
                        onClick={handleGetSuggestions}
                        disabled={isLoadingSuggestions || items.some(item => !item.name)}
                        className="flex items-center gap-2 bg-pink-glow text-white py-2 px-4 rounded-md hover:bg-pink-600 disabled:bg-slate-600 transition-all shadow-md hover:shadow-glow-pink"
                    >
                        {isLoadingSuggestions ? <Spinner /> : null}
                        {isLoadingSuggestions ? t('generatingSuggestions') : t('getSupplierSuggestions')}
                    </button>
                    {suggestionError && <p className="text-red-400 text-sm mt-2">{suggestionError}</p>}

                    {suggestions.length > 0 && (
                        <div className="mt-4 space-y-3 animate-fade-in-up">
                            {suggestions.map((suggestion, index) => (
                                <div key={index} className="p-4 bg-cyan-950/40 border-l-4 border-cyan-400 rounded-r-lg">
                                    <h4 className="font-bold text-cyan-200">{suggestion.supplierName}</h4>
                                    <p className="text-sm text-cyan-300 mt-1">{suggestion.justification}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-4 border-t border-cyan-500/20 pt-6">
                    <button type="button" onClick={handleCancel} className="bg-slate-700 text-slate-200 py-2 px-6 rounded-md hover:bg-slate-600 transition">
                        {t('cancel')}
                    </button>
                    <button type="button" onClick={handleSaveDraft} className="bg-yellow-600 text-white py-2 px-6 rounded-md hover:bg-yellow-500 transition">
                        {t('saveDraft')}
                    </button>
                    <button type="submit" className="bg-cyan-glow text-slate-950 font-semibold py-2 px-6 rounded-md hover:bg-cyan-400 transition-all shadow-md hover:shadow-glow-cyan">
                        {isEditing ? t('resubmitRequest') : t('submitRequest')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PurchaseRequestForm;
