

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


const PurchaseRequestForm: React.FC<PurchaseRequestFormProps> = ({ onClose }) => {
    const { t } = useTranslation();
    const { 
        currentUser, 
        addRequest: onAddRequest, 
        branches, 
        showToast: onShowToast, 
        itemCatalog, 
        suppliers 
    } = useAppContext();

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
    }, []);

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

        const newRequest: PurchaseRequest = {
            id: `pr-${Date.now()}`,
            requester: currentUser,
            status: department === 'Projects' ? RequestStatus.PENDING_QS_APPROVAL : RequestStatus.PENDING_HM_APPROVAL,
            items: finalItems,
            totalEstimatedCost,
            createdAt: new Date().toISOString(),
            approvalHistory: [{ user: currentUser, action: 'Submitted', timestamp: new Date() }],
            department,
            branch: selectedBranch,
        };
        onAddRequest(newRequest);
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        onClose();
    };

    const handleSaveDraft = () => {
        const draftData = { items, branchId, department };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
        onShowToast(t('toast.draftSaved'));
        onClose();
    };

    const handleCancel = () => {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
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

    return (
        <div className="bg-white rounded-lg h-full">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white py-2 border-b">
                <h2 className="text-2xl font-bold text-gray-800 flex-grow text-center md:text-left">{t('createNewRequest')}</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="branch" className="block text-base font-bold mb-2 text-gray-900">{t('branch')}</label>
                         <select
                            id="branch"
                            value={branchId}
                            onChange={(e) => setBranchId(e.target.value)}
                            required
                            disabled={userBranches.length <= 1}
                            className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            {userBranches.map(branch => (
                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="department" className="block text-base font-bold mb-2 text-gray-900">{t('department')}</label>
                        <select
                            id="department"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            required
                            className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg text-gray-900"
                        >
                            {DEPARTMENTS.map(dep => (
                                <option key={dep} value={dep}>{t(dep.toLowerCase().replace('&', 'and'))}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">{t('items')}</h3>
                
                <div className="space-y-4" ref={dropdownRef}>
                    {items.map((item, index) => {
                         const filteredCatalog = item.name
                            ? itemCatalog.filter(ci => fuzzyMatch(item.name, ci.name))
                            : itemCatalog;

                        return (
                        <div key={index} className="p-6 border border-gray-200 rounded-xl relative space-y-4 bg-slate-50 shadow">
                             {items.length > 1 && (
                                <button type="button" onClick={() => handleRemoveItem(index)} className="absolute top-3 right-3 rtl:right-auto rtl:left-3 text-red-500 hover:text-red-700 font-bold text-xl">&times;</button>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <label className="block text-base font-bold mb-2 text-gray-900">{t('itemName')}</label>
                                    <input 
                                        type="text" 
                                        value={item.name} 
                                        onChange={e => handleItemChange(index, 'name', e.target.value)}
                                        onFocus={() => setActiveDropdown(index)}
                                        placeholder={t('searchItemPlaceholder')}
                                        required 
                                        autoComplete="off"
                                        className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg text-gray-900" />
                                    {activeDropdown === index && (
                                        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto mt-1">
                                            {filteredCatalog.map(catalogItem => (
                                                <li
                                                    key={catalogItem.name}
                                                    onClick={() => handleSelectItem(index, catalogItem)}
                                                    className="px-3 py-2 cursor-pointer hover:bg-primary-100 text-gray-900"
                                                >
                                                    {catalogItem.name}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-base font-bold mb-2 text-gray-900">{t('category')}</label>
                                    <input type="text" value={item.category} readOnly className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-100 text-gray-500 cursor-not-allowed text-lg" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-base font-bold mb-2 text-gray-900">{t('quantity')}</label>
                                    <input type="number" value={item.quantity} min="1" onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} required className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg text-gray-900" />
                                </div>
                                <div>
                                    <label className="block text-base font-bold mb-2 text-gray-900">{t('unit')}</label>
                                    <input type="text" value={item.unit} readOnly className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-100 text-gray-500 cursor-not-allowed text-lg" />
                                </div>
                                <div>
                                    <label className="block text-base font-bold mb-2 text-gray-900">{t('estimatedCost')}</label>
                                    <input type="number" value={item.estimatedCost} readOnly className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-100 text-gray-500 cursor-not-allowed text-lg" />
                                </div>
                            </div>
                             <div>
                                <label className="block text-base font-bold mb-2 text-gray-900">{t('justification')}</label>
                                <textarea 
                                    value={item.justification} 
                                    onChange={e => handleItemChange(index, 'justification', e.target.value)} 
                                    required
                                    rows={2}
                                    className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg text-gray-900"
                                />
                            </div>
                        </div>
                        )
                    })}
                </div>
                
                <div className="border-t pt-4">
                    <button type="button" onClick={handleAddItem} className="text-primary-600 hover:text-primary-800 font-semibold">
                        {t('addItem')}
                    </button>
                </div>

                <div className="border-t pt-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('aiSupplierSuggestions')}</h3>
                    <button 
                        type="button" 
                        onClick={handleGetSuggestions}
                        disabled={isLoadingSuggestions || items.some(item => !item.name)}
                        className="flex items-center gap-2 bg-accent-500 text-white py-2 px-4 rounded-md hover:bg-accent-600 disabled:bg-gray-400"
                    >
                        {isLoadingSuggestions ? <Spinner /> : null}
                        {isLoadingSuggestions ? t('generatingSuggestions') : t('getSupplierSuggestions')}
                    </button>
                    {suggestionError && <p className="text-red-500 text-sm mt-2">{suggestionError}</p>}

                    {suggestions.length > 0 && (
                        <div className="mt-4 space-y-3 animate-fade-in-up">
                            {suggestions.map((suggestion, index) => (
                                <div key={index} className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                                    <h4 className="font-bold text-blue-800">{suggestion.supplierName}</h4>
                                    <p className="text-sm text-blue-700 mt-1">{suggestion.justification}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-4 border-t pt-6">
                    <button type="button" onClick={handleCancel} className="bg-gray-200 text-gray-800 py-2 px-6 rounded-md hover:bg-gray-300">
                        {t('cancel')}
                    </button>
                    <button type="button" onClick={handleSaveDraft} className="bg-yellow-500 text-white py-2 px-6 rounded-md hover:bg-yellow-600">
                        {t('saveDraft')}
                    </button>
                    <button type="submit" className="bg-primary-600 text-white py-2 px-6 rounded-md hover:bg-primary-700">
                        {t('submitRequest')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PurchaseRequestForm;