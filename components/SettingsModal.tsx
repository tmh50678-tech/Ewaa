
import React, { useState, useEffect } from 'react';
import type { User, RoleDefinition, Branch, Role, Supplier, SalesRepresentative } from '../types';
import { RequestStatus } from '../types';
import { ROLES, SAUDI_CITIES } from '../constants';
import Modal from './Modal';
import { useTranslation } from '../i18n';
import { useAppContext } from '../App';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginAs: (user: User) => void;
}

type SettingsTab = 'users' | 'roles' | 'branches' | 'suppliers';

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    onLoginAs,
}) => {
    const { t } = useTranslation();
    const {
        currentUser,
        users,
        setUsers: onUsersUpdate,
        roles,
        setRoles: onRolesUpdate,
        branches,
        setBranches: onBranchesUpdate,
        showToast: onShowToast,
        suppliers,
        setSuppliers: onSuppliersUpdate,
    } = useAppContext();

    const [activeTab, setActiveTab] = useState<SettingsTab>('users');
    const is_admin = currentUser.role === ROLES.ADMIN;
    const canManageSuppliers = currentUser.role === ROLES.ADMIN || currentUser.role === ROLES.PURCHASING_MANAGER;

    // Local state for forms
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState<Role | string>(ROLES.REQUESTER);
    const [newUserBranches, setNewUserBranches] = useState<string[]>([]);
    
    const [newRoleName, setNewRoleName] = useState('');
    const [newRolePermissions, setNewRolePermissions] = useState<RequestStatus[]>([]);

    const [newBranchName, setNewBranchName] = useState('');
    const [newBranchCity, setNewBranchCity] = useState('');
    
    const [newRepName, setNewRepName] = useState('');
    const [newRepContact, setNewRepContact] = useState('');
    const [addingRepToSupplier, setAddingRepToSupplier] = useState<string | null>(null);
    
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [editedUserData, setEditedUserData] = useState<User | null>(null);

    const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
    const [editedBranchData, setEditedBranchData] = useState<Branch | null>(null);

    const [editingSupplierName, setEditingSupplierName] = useState<string | null>(null);
    const [editedSupplierData, setEditedSupplierData] = useState<Supplier | null>(null);


    useEffect(() => {
        if (isOpen) {
            // Reset forms on open
            setNewUserName('');
            setNewUserEmail('');
            setNewUserPassword('');
            setNewUserRole(ROLES.REQUESTER);
            setNewUserBranches([]);
            setNewRoleName('');
            setNewRolePermissions([]);
            setNewBranchName('');
            setNewBranchCity('');
            setNewRepName('');
            setNewRepContact('');
            setAddingRepToSupplier(null);
            setEditingUserId(null);
            setEditedUserData(null);
            setEditingBranchId(null);
            setEditedBranchData(null);
            setEditingSupplierName(null);
            setEditedSupplierData(null);
        }
    }, [isOpen]);

    const handleStartEdit = (user: User) => {
        setEditingUserId(user.id);
        setEditedUserData({ ...user });
    };

    const handleCancelEdit = () => {
        setEditingUserId(null);
        setEditedUserData(null);
    };
    
    const handleSaveEdit = () => {
        if (!editedUserData) return;
        const updatedUsers = users.map(u => (u.id === editedUserData.id ? editedUserData : u));
        onUsersUpdate(updatedUsers);
        onShowToast(t('toast.settingsUpdated'));
        handleCancelEdit();
    };
    
    const handleEditUserChange = (field: keyof User, value: any) => {
        if(editedUserData) {
            setEditedUserData({ ...editedUserData, [field]: value });
        }
    };

    const handleEditUserBranchesChange = (branchId: string, isChecked: boolean) => {
        if (editedUserData) {
            const currentBranches = editedUserData.branches || [];
            const newBranches = isChecked
                ? [...currentBranches, branchId]
                : currentBranches.filter(id => id !== branchId);
            handleEditUserChange('branches', newBranches);
        }
    };


    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        const newUser: User = {
            id: Date.now(),
            name: newUserName,
            email: newUserEmail,
            password: newUserPassword,
            role: newUserRole as Role,
            branches: newUserBranches,
        };
        onUsersUpdate([...users, newUser]);
        onShowToast(t('toast.settingsUpdated'));
        // Reset form
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserRole(ROLES.REQUESTER);
        setNewUserBranches([]);
    };

    const handleDeleteUser = (userId: number) => {
        if (userId === currentUser.id) {
            onShowToast(t('error.cannotDeleteSelf'));
            return;
        }
        if (window.confirm('Are you sure you want to delete this user?')) {
            onUsersUpdate(users.filter(u => u.id !== userId));
            onShowToast(t('toast.settingsUpdated'));
        }
    };
    
    const handleAddRole = (e: React.FormEvent) => {
        e.preventDefault();
        const newRole: RoleDefinition = {
            name: newRoleName,
            permissions: newRolePermissions,
        };
        onRolesUpdate([...roles, newRole]);
        onShowToast(t('toast.settingsUpdated'));
        setNewRoleName('');
        setNewRolePermissions([]);
    };
    
    const handleDeleteRole = (roleName: Role | string) => {
        if (roleName === ROLES.ADMIN) {
            onShowToast(t('error.cannotDeleteAdminRole'));
            return;
        }
        if (users.some(u => u.role === roleName)) {
            onShowToast(t('error.roleInUse'));
            return;
        }
        if (window.confirm('Are you sure you want to delete this role?')) {
            onRolesUpdate(roles.filter(r => r.name !== roleName));
            onShowToast(t('toast.settingsUpdated'));
        }
    };

    const handleAddBranch = (e: React.FormEvent) => {
        e.preventDefault();
        const newBranch: Branch = {
            id: `branch-${Date.now()}`,
            name: newBranchName,
            city: newBranchCity,
        };
        onBranchesUpdate([...branches, newBranch]);
        onShowToast(t('toast.settingsUpdated'));
        setNewBranchName('');
        setNewBranchCity('');
    };

    const handleDeleteBranch = (branchId: string) => {
        // A more robust check would also look at requests
        if (users.some(u => u.branches.includes(branchId))) {
             onShowToast(t('error.branchInUse'));
            return;
        }
        if (window.confirm('Are you sure you want to delete this branch?')) {
            onBranchesUpdate(branches.filter(b => b.id !== branchId));
            onShowToast(t('toast.settingsUpdated'));
        }
    };

    const handleStartEditBranch = (branch: Branch) => {
        setEditingBranchId(branch.id);
        setEditedBranchData({ ...branch });
    };

    const handleCancelEditBranch = () => {
        setEditingBranchId(null);
        setEditedBranchData(null);
    };
    
    const handleSaveEditBranch = () => {
        if (!editedBranchData) return;
        const updatedBranches = branches.map(b => (b.id === editedBranchData.id ? editedBranchData : b));
        onBranchesUpdate(updatedBranches);
        onShowToast(t('toast.settingsUpdated'));
        handleCancelEditBranch();
    };
    
    const handleEditBranchChange = (field: keyof Branch, value: string) => {
        if(editedBranchData) {
            setEditedBranchData({ ...editedBranchData, [field]: value });
        }
    };

    const handleStartEditSupplier = (supplier: Supplier) => {
        setEditingSupplierName(supplier.name);
        setEditedSupplierData({ ...supplier });
    };

    const handleCancelEditSupplier = () => {
        setEditingSupplierName(null);
        setEditedSupplierData(null);
    };
    
    const handleSaveEditSupplier = () => {
        if (!editedSupplierData) return;
        const updatedSuppliers = suppliers.map(s => (s.name === editingSupplierName ? editedSupplierData : s));
        onSuppliersUpdate(updatedSuppliers);
        onShowToast(t('toast.settingsUpdated'));
        handleCancelEditSupplier();
    };
    
    const handleEditSupplierChange = (field: keyof Supplier, value: string) => {
        if(editedSupplierData) {
            setEditedSupplierData({ ...editedSupplierData, [field]: value });
        }
    };

    const handleAddRepresentative = (e: React.FormEvent, supplierName: string) => {
        e.preventDefault();
        if (!newRepName || !newRepContact) return;

        const newRep: SalesRepresentative = { name: newRepName, contact: newRepContact };
        const updatedSuppliers = suppliers.map(s => {
            if (s.name === supplierName) {
                // simple check for duplicates
                const repExists = s.representatives.some(r => r.name.toLowerCase() === newRep.name.toLowerCase() || r.contact === newRep.contact);
                if (!repExists) {
                    return { ...s, representatives: [...s.representatives, newRep] };
                }
            }
            return s;
        });

        onSuppliersUpdate(updatedSuppliers);
        onShowToast(t('toast.settingsUpdated'));
        // Reset form
        setNewRepName('');
        setNewRepContact('');
        setAddingRepToSupplier(null);
    };

    const renderUserManagement = () => (
        <div>
            <h3 className="text-xl font-semibold mb-4 text-black">{t('userManagement')}</h3>
            <div className="max-h-64 overflow-y-auto border rounded-lg mb-4">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('userName')}</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('email')}</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('password')}</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('role')}</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('branches')}</th>
                            <th className="px-4 py-2"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(user => (
                            <tr key={user.id}>
                            {editingUserId === user.id ? (
                                <>
                                    <td><input type="text" value={editedUserData?.name || ''} onChange={e => handleEditUserChange('name', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                                    <td><input type="email" value={editedUserData?.email || ''} onChange={e => handleEditUserChange('email', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                                    <td><input type="text" value={editedUserData?.password || ''} onChange={e => handleEditUserChange('password', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                                    <td>
                                        <select value={editedUserData?.role} onChange={e => handleEditUserChange('role', e.target.value)} className="w-full px-2 py-1 border rounded">
                                            {roles.map(r => <option key={r.name} value={r.name}>{t(r.name)}</option>)}
                                        </select>
                                    </td>
                                    <td>
                                        <div className="flex flex-wrap gap-2">
                                            {branches.map(branch => (
                                                <label key={branch.id} className="flex items-center text-xs">
                                                    <input
                                                        type="checkbox"
                                                        checked={editedUserData?.branches.includes(branch.id)}
                                                        onChange={e => handleEditUserBranchesChange(branch.id, e.target.checked)}
                                                    />
                                                    {branch.name}
                                                </label>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-900 mr-2">{t('save')}</button>
                                        <button onClick={handleCancelEdit} className="text-gray-600 hover:text-gray-900">{t('cancel')}</button>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{user.password}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{t(user.role)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{user.branches.map(bId => branches.find(b => b.id === bId)?.name).join(', ')}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                        {is_admin && user.id !== currentUser.id && (
                                            <button onClick={() => onLoginAs(user)} className="text-blue-600 hover:text-blue-900 mr-2">{t('loginAs')}</button>
                                        )}
                                        <button onClick={() => handleStartEdit(user)} className="text-primary-600 hover:text-primary-900 mr-2">{t('edit')}</button>
                                        <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-900">{t('remove')}</button>
                                    </td>
                                </>
                            )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <form onSubmit={handleAddUser} className="space-y-4 border-t pt-4">
                <h4 className="font-semibold">{t('addUser')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder={t('userName')} value={newUserName} onChange={e => setNewUserName(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />
                    <input type="email" placeholder={t('email')} value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />
                    <input type="password" placeholder={t('password')} value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />
                    <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} required className="w-full px-3 py-2 border rounded-md">
                        {roles.map(r => <option key={r.name} value={r.name}>{t(r.name)}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1">{t('branches')}</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {branches.map(branch => (
                            <label key={branch.id} className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={newUserBranches.includes(branch.id)}
                                    onChange={e => {
                                        if (e.target.checked) {
                                            setNewUserBranches([...newUserBranches, branch.id]);
                                        } else {
                                            setNewUserBranches(newUserBranches.filter(id => id !== branch.id));
                                        }
                                    }}
                                />
                                <span className="text-gray-800">{branch.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <button type="submit" className="bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700">{t('addUser')}</button>
            </form>
        </div>
    );
    
    const renderRoleManagement = () => (
        <div>
            <h3 className="text-xl font-semibold mb-4 text-black">{t('roleManagement')}</h3>
             <div className="max-h-64 overflow-y-auto border rounded-lg mb-4">
                 <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('role')}</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('permissions')}</th>
                            <th className="px-4 py-2"></th>
                        </tr>
                     </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {roles.map(role => (
                            <tr key={role.name}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{t(role.name)}</td>
                                <td className="px-4 py-2 text-sm text-gray-500">
                                    {role.permissions.length === Object.values(RequestStatus).length ? 'All' : role.permissions.map(p => t(p)).join(', ')}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleDeleteRole(role.name)} className="text-red-600 hover:text-red-900">{t('remove')}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
             </div>
              <form onSubmit={handleAddRole} className="space-y-4 border-t pt-4">
                <h4 className="font-semibold">{t('addRole')}</h4>
                <input type="text" placeholder={t('role')} value={newRoleName} onChange={e => setNewRoleName(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />
                 <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1">{t('permissions')}</label>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                        {Object.values(RequestStatus).map(status => (
                            <label key={status} className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={newRolePermissions.includes(status)}
                                    onChange={e => {
                                        if (e.target.checked) {
                                            setNewRolePermissions([...newRolePermissions, status]);
                                        } else {
                                            setNewRolePermissions(newRolePermissions.filter(p => p !== status));
                                        }
                                    }}
                                />
                                <span className="text-xs text-black">{t(status)}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <button type="submit" className="bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700">{t('addRole')}</button>
            </form>
        </div>
    );
    
    const renderBranchManagement = () => (
        <div>
            <h3 className="text-xl font-semibold mb-4 text-black">{t('branchManagement')}</h3>
            <datalist id="saudi-cities">
                {SAUDI_CITIES.map(city => <option key={city} value={city} />)}
            </datalist>
             <div className="max-h-64 overflow-y-auto border rounded-lg mb-4">
                 <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('branch')}</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('city')}</th>
                            <th className="px-4 py-2"></th>
                        </tr>
                     </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {branches.map(branch => (
                            <tr key={branch.id}>
                                {editingBranchId === branch.id ? (
                                    <>
                                        <td><input type="text" value={editedBranchData?.name || ''} onChange={e => handleEditBranchChange('name', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                                        <td><input type="text" value={editedBranchData?.city || ''} onChange={e => handleEditBranchChange('city', e.target.value)} className="w-full px-2 py-1 border rounded" list="saudi-cities" /></td>
                                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={handleSaveEditBranch} className="text-green-600 hover:text-green-900 mr-2">{t('save')}</button>
                                            <button onClick={handleCancelEditBranch} className="text-gray-600 hover:text-gray-900">{t('cancel')}</button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{branch.name}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{branch.city}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleStartEditBranch(branch)} className="text-primary-600 hover:text-primary-900 mr-2">{t('edit')}</button>
                                            <button onClick={() => handleDeleteBranch(branch.id)} className="text-red-600 hover:text-red-900">{t('remove')}</button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                 </table>
             </div>
             <form onSubmit={handleAddBranch} className="space-y-4 border-t pt-4">
                <h4 className="font-semibold">{t('addBranch')}</h4>
                <div className="flex gap-2">
                    <input type="text" placeholder={t('branch')} value={newBranchName} onChange={e => setNewBranchName(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />
                    <input type="text" placeholder={t('city')} value={newBranchCity} onChange={e => setNewBranchCity(e.target.value)} required className="w-full px-3 py-2 border rounded-md" list="saudi-cities" />
                    <button type="submit" className="bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700">{t('addBranch')}</button>
                </div>
            </form>
        </div>
    );

     const renderSupplierManagement = () => (
        <div>
            <h3 className="text-xl font-semibold mb-4">{t('supplierManagement')}</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
                {suppliers.map(supplier => (
                    <div key={supplier.name} className="p-4 border rounded-lg bg-gray-50">
                        {editingSupplierName === supplier.name && editedSupplierData ? (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-600">{t('supplierName')}</label>
                                    <input type="text" value={editedSupplierData.name} onChange={e => handleEditSupplierChange('name', e.target.value)} className="w-full text-sm px-2 py-1 border rounded" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-600">{t('category')}</label>
                                    <input type="text" value={editedSupplierData.category} onChange={e => handleEditSupplierChange('category', e.target.value)} className="w-full text-sm px-2 py-1 border rounded" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-600">{t('contact')}</label>
                                    <input type="text" value={editedSupplierData.contact} onChange={e => handleEditSupplierChange('contact', e.target.value)} className="w-full text-sm px-2 py-1 border rounded" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-600">{t('website')}</label>
                                    <input type="text" placeholder="e.g., example.com" value={editedSupplierData.website || ''} onChange={e => handleEditSupplierChange('website', e.target.value)} className="w-full text-sm px-2 py-1 border rounded" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-600">{t('notes')}</label>
                                    <textarea value={editedSupplierData.notes || ''} onChange={e => handleEditSupplierChange('notes', e.target.value)} className="w-full text-sm px-2 py-1 border rounded" rows={2}></textarea>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleSaveEditSupplier} className="text-sm bg-green-500 text-white py-1 px-3 rounded hover:bg-green-600">{t('save')}</button>
                                    <button onClick={handleCancelEditSupplier} className="text-sm bg-gray-200 py-1 px-3 rounded hover:bg-gray-300">{t('cancel')}</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-lg text-gray-800">{supplier.name}</h4>
                                        <p className="text-sm text-gray-600">{supplier.category} - {supplier.contact}</p>
                                        {supplier.website && <a href={supplier.website.startsWith('http') ? supplier.website : `//${supplier.website}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline">{supplier.website}</a>}
                                    </div>
                                    <button onClick={() => handleStartEditSupplier(supplier)} className="text-sm text-primary-600 hover:text-primary-800 font-semibold">{t('edit')}</button>
                                </div>
                                
                                {supplier.notes && <p className="text-xs text-gray-500 italic mt-1 p-2 bg-white rounded">"{supplier.notes}"</p>}

                                <div className="mt-3">
                                    <h5 className="font-semibold text-sm mb-2">{t('salesRepresentatives')}</h5>
                                    {supplier.representatives.length > 0 ? (
                                        <ul className="space-y-1 text-sm list-disc list-inside">
                                            {supplier.representatives.map(rep => (
                                                <li key={rep.name}>
                                                    <span className="font-medium">{rep.name}</span> - <span className="text-gray-600">{rep.contact}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-xs text-gray-500 italic">No representatives added yet.</p>
                                    )}
                                </div>

                                {addingRepToSupplier !== supplier.name && (
                                    <button onClick={() => setAddingRepToSupplier(supplier.name)} className="text-sm mt-3 bg-primary-100 text-primary-700 py-1 px-3 rounded hover:bg-primary-200">
                                        {t('addRepresentative')}
                                    </button>
                                )}
                            
                                {addingRepToSupplier === supplier.name && (
                                    <form onSubmit={(e) => handleAddRepresentative(e, supplier.name)} className="mt-3 p-3 bg-white border rounded-md space-y-2">
                                        <input type="text" placeholder={t('repName')} value={newRepName} onChange={e => setNewRepName(e.target.value)} required className="w-full text-sm px-2 py-1 border rounded" />
                                        <input type="text" placeholder={t('repContact')} value={newRepContact} onChange={e => setNewRepContact(e.target.value)} required className="w-full text-sm px-2 py-1 border rounded" />
                                        <div className="flex gap-2">
                                            <button type="submit" className="text-sm bg-green-500 text-white py-1 px-3 rounded hover:bg-green-600">{t('add')}</button>
                                            <button type="button" onClick={() => setAddingRepToSupplier(null)} className="text-sm bg-gray-200 py-1 px-3 rounded hover:bg-gray-300">{t('cancel')}</button>
                                        </div>
                                    </form>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="5xl">
            <div className="p-2">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">{t('settings')}</h2>
                
                <div className="border-b mb-4">
                    <nav className="flex space-x-4">
                        {is_admin && <button onClick={() => setActiveTab('users')} className={`py-2 px-4 font-medium ${activeTab === 'users' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>{t('userManagement')}</button>}
                        {is_admin && <button onClick={() => setActiveTab('roles')} className={`py-2 px-4 font-medium ${activeTab === 'roles' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>{t('roleManagement')}</button>}
                        {is_admin && <button onClick={() => setActiveTab('branches')} className={`py-2 px-4 font-medium ${activeTab === 'branches' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>{t('branchManagement')}</button>}
                        {canManageSuppliers && <button onClick={() => setActiveTab('suppliers')} className={`py-2 px-4 font-medium ${activeTab === 'suppliers' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>{t('supplierManagement')}</button>}
                    </nav>
                </div>
                <div>
                    {activeTab === 'users' && is_admin && renderUserManagement()}
                    {activeTab === 'roles' && is_admin && renderRoleManagement()}
                    {activeTab === 'branches' && is_admin && renderBranchManagement()}
                    {activeTab === 'suppliers' && canManageSuppliers && renderSupplierManagement()}
                </div>
            </div>
        </Modal>
    );
};

export default SettingsModal;
