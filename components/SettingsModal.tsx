

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

const inputStyles = "block w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-md placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 sm:text-sm transition text-white";
const smallInputStyles = "w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white focus:ring-cyan-500 focus:border-cyan-500 text-sm";
const checkboxStyles = "form-checkbox h-4 w-4 rounded bg-slate-700 border-slate-500 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-800";


const PasswordToggle: React.FC<{show: boolean, onToggle: () => void}> = ({show, onToggle}) => (
    <button
        type="button"
        onClick={onToggle}
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-cyan-400"
        aria-label={show ? "Hide password" : "Show password"}
    >
        {show ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m-2.201-4.209A3.004 3.004 0 0012 15a3 3 0 100-6 3 3 0 00-1.354.362" /></svg>
        ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" /></svg>
        )}
    </button>
);


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
    const [showNewUserPassword, setShowNewUserPassword] = useState(false);
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
    const [showEditUserPassword, setShowEditUserPassword] = useState(false);

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
            setShowNewUserPassword(false);
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
            setShowEditUserPassword(false);
            setEditingBranchId(null);
            setEditedBranchData(null);
            setEditingSupplierName(null);
            setEditedSupplierData(null);
        }
    }, [isOpen]);

    const handleStartEdit = (user: User) => {
        setEditingUserId(user.id);
        setEditedUserData({ ...user });
        setShowEditUserPassword(false);
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
    
    const handleEditSupplierChange = (field: keyof Supplier, value: any) => {
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
            <h3 className="text-xl font-semibold mb-4 text-slate-100">{t('userManagement')}</h3>
            <div className="max-h-64 overflow-y-auto bg-slate-900/50 rounded-lg border border-slate-700 mb-6">
                <table className="min-w-full divide-y divide-slate-700">
                    <thead className="bg-slate-800/50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">{t('userName')}</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">{t('email')}</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">{t('password')}</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">{t('role')}</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">{t('branches')}</th>
                            <th className="px-4 py-2"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-slate-800/40">
                            {editingUserId === user.id ? (
                                <>
                                    <td><input type="text" value={editedUserData?.name || ''} onChange={e => handleEditUserChange('name', e.target.value)} className={smallInputStyles} /></td>
                                    <td><input type="email" value={editedUserData?.email || ''} onChange={e => handleEditUserChange('email', e.target.value)} className={smallInputStyles} /></td>
                                    <td className="relative">
                                        <input type={showEditUserPassword ? 'text' : 'password'} value={editedUserData?.password || ''} onChange={e => handleEditUserChange('password', e.target.value)} className={smallInputStyles} />
                                        <PasswordToggle show={showEditUserPassword} onToggle={() => setShowEditUserPassword(!showEditUserPassword)} />
                                    </td>
                                    <td>
                                        <select value={editedUserData?.role} onChange={e => handleEditUserChange('role', e.target.value)} className={smallInputStyles}>
                                            {roles.map(r => <option key={r.name} value={r.name} className="bg-slate-900">{t(r.name)}</option>)}
                                        </select>
                                    </td>
                                    <td>
                                        <div className="flex flex-wrap gap-2 p-1">
                                            {branches.map(branch => (
                                                <label key={branch.id} className="flex items-center space-x-1 text-xs">
                                                    <input
                                                        type="checkbox"
                                                        checked={editedUserData?.branches.includes(branch.id)}
                                                        onChange={e => handleEditUserBranchesChange(branch.id, e.target.checked)}
                                                        className={checkboxStyles}
                                                    />
                                                    <span className="text-slate-300">{branch.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={handleSaveEdit} className="text-green-400 hover:text-green-300 mr-2">{t('save')}</button>
                                        <button onClick={handleCancelEdit} className="text-slate-400 hover:text-slate-300">{t('cancel')}</button>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-white">{user.name}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-300">{user.email}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-400">**********</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-300">{t(user.role)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-300">{user.branches.map(bId => branches.find(b => b.id === bId)?.name).join(', ')}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                        {is_admin && user.id !== currentUser.id && (
                                            <button onClick={() => onLoginAs(user)} className="text-cyan-400 hover:text-cyan-300">{t('loginAs')}</button>
                                        )}
                                        <button onClick={() => handleStartEdit(user)} className="text-yellow-400 hover:text-yellow-300">{t('edit')}</button>
                                        <button onClick={() => handleDeleteUser(user.id)} className="text-pink-500 hover:text-pink-400">{t('remove')}</button>
                                    </td>
                                </>
                            )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <form onSubmit={handleAddUser} className="space-y-4 border-t border-slate-700 pt-4">
                <h4 className="font-semibold text-lg text-slate-200">{t('addUser')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder={t('userName')} value={newUserName} onChange={e => setNewUserName(e.target.value)} required className={inputStyles} />
                    <input type="email" placeholder={t('email')} value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} required className={inputStyles} />
                    <div className="relative">
                        <input type={showNewUserPassword ? 'text' : 'password'} placeholder={t('password')} value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} required className={inputStyles} />
                        <PasswordToggle show={showNewUserPassword} onToggle={() => setShowNewUserPassword(!showNewUserPassword)} />
                    </div>
                    <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} required className={inputStyles}>
                        {roles.map(r => <option key={r.name} value={r.name} className="bg-slate-900">{t(r.name)}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">{t('branches')}</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-900/50 rounded-md border border-slate-700">
                        {branches.map(branch => (
                            <label key={branch.id} className="flex items-center space-x-2 rtl:space-x-reverse">
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
                                    className={checkboxStyles}
                                />
                                <span className="text-slate-300">{branch.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <button type="submit" className="bg-cyan-glow text-slate-950 font-bold py-2 px-4 rounded-md hover:bg-cyan-400 transition shadow-md hover:shadow-glow-cyan">{t('addUser')}</button>
            </form>
        </div>
    );
    
    const renderRoleManagement = () => (
        <div>
            <h3 className="text-xl font-semibold mb-4 text-slate-100">{t('roleManagement')}</h3>
             <div className="max-h-64 overflow-y-auto bg-slate-900/50 rounded-lg border border-slate-700 mb-6">
                 <table className="min-w-full divide-y divide-slate-700">
                     <thead className="bg-slate-800/50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">{t('role')}</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">{t('permissions')}</th>
                            <th className="px-4 py-2"></th>
                        </tr>
                     </thead>
                    <tbody className="divide-y divide-slate-700">
                        {roles.map(role => (
                            <tr key={role.name} className="hover:bg-slate-800/40">
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-white">{t(role.name)}</td>
                                <td className="px-4 py-2 text-sm text-slate-300">
                                    {role.permissions.length === Object.values(RequestStatus).length ? 'All' : role.permissions.map(p => t(p)).join(', ')}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleDeleteRole(role.name)} className="text-pink-500 hover:text-pink-400">{t('remove')}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
             </div>
              <form onSubmit={handleAddRole} className="space-y-4 border-t border-slate-700 pt-4">
                <h4 className="font-semibold text-lg text-slate-200">{t('addRole')}</h4>
                <input type="text" placeholder={t('role')} value={newRoleName} onChange={e => setNewRoleName(e.target.value)} required className={inputStyles} />
                 <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">{t('permissions')}</label>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-40 overflow-y-auto p-3 bg-slate-900/50 rounded-md border border-slate-700">
                        {Object.values(RequestStatus).map(status => (
                            <label key={status} className="flex items-center space-x-2 rtl:space-x-reverse">
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
                                    className={checkboxStyles}
                                />
                                <span className="text-xs text-slate-300">{t(status)}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <button type="submit" className="bg-cyan-glow text-slate-950 font-bold py-2 px-4 rounded-md hover:bg-cyan-400 transition shadow-md hover:shadow-glow-cyan">{t('addRole')}</button>
            </form>
        </div>
    );
    
    const renderBranchManagement = () => (
        <div>
            <h3 className="text-xl font-semibold mb-4 text-slate-100">{t('branchManagement')}</h3>
            <datalist id="saudi-cities">
                {SAUDI_CITIES.map(city => <option key={city} value={city} />)}
            </datalist>
             <div className="max-h-64 overflow-y-auto bg-slate-900/50 rounded-lg border border-slate-700 mb-6">
                 <table className="min-w-full divide-y divide-slate-700">
                     <thead className="bg-slate-800/50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">{t('branch')}</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">{t('city')}</th>
                            <th className="px-4 py-2"></th>
                        </tr>
                     </thead>
                    <tbody className="divide-y divide-slate-700">
                        {branches.map(branch => (
                            <tr key={branch.id} className="hover:bg-slate-800/40">
                                {editingBranchId === branch.id ? (
                                    <>
                                        <td><input type="text" value={editedBranchData?.name || ''} onChange={e => handleEditBranchChange('name', e.target.value)} className={smallInputStyles} /></td>
                                        <td><input type="text" value={editedBranchData?.city || ''} onChange={e => handleEditBranchChange('city', e.target.value)} className={smallInputStyles} list="saudi-cities" /></td>
                                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={handleSaveEditBranch} className="text-green-400 hover:text-green-300 mr-2">{t('save')}</button>
                                            <button onClick={handleCancelEditBranch} className="text-slate-400 hover:text-slate-300">{t('cancel')}</button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-white">{branch.name}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-300">{branch.city}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                            <button onClick={() => handleStartEditBranch(branch)} className="text-yellow-400 hover:text-yellow-300">{t('edit')}</button>
                                            <button onClick={() => handleDeleteBranch(branch.id)} className="text-pink-500 hover:text-pink-400">{t('remove')}</button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                 </table>
             </div>
             <form onSubmit={handleAddBranch} className="space-y-4 border-t border-slate-700 pt-4">
                <h4 className="font-semibold text-lg text-slate-200">{t('addBranch')}</h4>
                <div className="flex gap-4">
                    <input type="text" placeholder={t('branch')} value={newBranchName} onChange={e => setNewBranchName(e.target.value)} required className={inputStyles} />
                    <input type="text" placeholder={t('city')} value={newBranchCity} onChange={e => setNewBranchCity(e.target.value)} required className={inputStyles} list="saudi-cities" />
                    <button type="submit" className="bg-cyan-glow text-slate-950 font-bold py-2 px-4 rounded-md hover:bg-cyan-400 transition shadow-md hover:shadow-glow-cyan whitespace-nowrap">{t('addBranch')}</button>
                </div>
            </form>
        </div>
    );

     const renderSupplierManagement = () => (
        <div>
            <h3 className="text-xl font-semibold mb-4 text-slate-100">{t('supplierManagement')}</h3>
            <div className="space-y-4 max-h-[32rem] overflow-y-auto pr-2">
                {suppliers.map(supplier => (
                    <div key={supplier.name} className="p-4 glass-panel rounded-lg">
                        {editingSupplierName === supplier.name && editedSupplierData ? (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-300">{t('supplierName')}</label>
                                    <input type="text" value={editedSupplierData.name} onChange={e => handleEditSupplierChange('name', e.target.value)} className={inputStyles} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-300">{t('category')}</label>
                                    <input type="text" value={editedSupplierData.category} onChange={e => handleEditSupplierChange('category', e.target.value)} className={inputStyles} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-300">{t('contact')}</label>
                                    <input type="text" value={editedSupplierData.contact} onChange={e => handleEditSupplierChange('contact', e.target.value)} className={inputStyles} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-300">{t('website')}</label>
                                    <input type="text" placeholder="e.g., example.com" value={editedSupplierData.website || ''} onChange={e => handleEditSupplierChange('website', e.target.value)} className={inputStyles} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-300">{t('notes')}</label>
                                    <textarea value={editedSupplierData.notes || ''} onChange={e => handleEditSupplierChange('notes', e.target.value)} className={inputStyles} rows={2}></textarea>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleSaveEditSupplier} className="text-sm bg-green-600 text-white py-1 px-3 rounded hover:bg-green-500">{t('save')}</button>
                                    <button onClick={handleCancelEditSupplier} className="text-sm bg-slate-600 py-1 px-3 rounded hover:bg-slate-500">{t('cancel')}</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-lg text-white">{supplier.name}</h4>
                                        <p className="text-sm text-slate-300">{supplier.category} - {supplier.contact}</p>
                                        {supplier.website && <a href={supplier.website.startsWith('http') ? supplier.website : `//${supplier.website}`} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline">{supplier.website}</a>}
                                    </div>
                                    <button onClick={() => handleStartEditSupplier(supplier)} className="text-sm text-yellow-400 hover:text-yellow-300 font-semibold">{t('edit')}</button>
                                </div>
                                
                                {supplier.notes && <p className="text-xs text-slate-400 italic mt-2 p-2 bg-slate-900/50 rounded">"{supplier.notes}"</p>}

                                <div className="mt-3">
                                    <h5 className="font-semibold text-sm mb-2 text-slate-200">{t('salesRepresentatives')}</h5>
                                    {supplier.representatives.length > 0 ? (
                                        <ul className="space-y-1 text-sm list-disc list-inside text-slate-300">
                                            {supplier.representatives.map(rep => (
                                                <li key={rep.name}>
                                                    <span className="font-medium text-white">{rep.name}</span> - <span className="text-slate-400">{rep.contact}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-xs text-slate-500 italic">{t('noRequestsFound')}</p>
                                    )}
                                </div>

                                {addingRepToSupplier !== supplier.name && (
                                    <button onClick={() => setAddingRepToSupplier(supplier.name)} className="text-sm mt-3 bg-cyan-900/50 text-cyan-300 py-1 px-3 rounded-md hover:bg-cyan-800/50 border border-cyan-800 transition-colors">
                                        {t('addRepresentative')}
                                    </button>
                                )}
                            
                                {addingRepToSupplier === supplier.name && (
                                    <form onSubmit={(e) => handleAddRepresentative(e, supplier.name)} className="mt-3 p-3 bg-slate-900/50 border border-slate-700 rounded-md space-y-2">
                                        <input type="text" placeholder={t('repName')} value={newRepName} onChange={e => setNewRepName(e.target.value)} required className={inputStyles} />
                                        <input type="text" placeholder={t('repContact')} value={newRepContact} onChange={e => setNewRepContact(e.target.value)} required className={inputStyles} />
                                        <div className="flex gap-2">
                                            <button type="submit" className="text-sm bg-green-600 text-white py-1 px-3 rounded hover:bg-green-500">{t('add')}</button>
                                            <button type="button" onClick={() => setAddingRepToSupplier(null)} className="text-sm bg-slate-600 py-1 px-3 rounded hover:bg-slate-500">{t('cancel')}</button>
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
            <div className="text-slate-200">
                <h2 className="text-3xl font-bold mb-6 text-white" style={{ textShadow: '0 0 8px rgba(0, 245, 212, 0.7)' }}>{t('settings')}</h2>
                
                <div className="border-b border-cyan-500/20">
                    <nav className="-mb-px flex space-x-6 rtl:space-x-reverse" aria-label="Tabs">
                        {is_admin && <button onClick={() => setActiveTab('users')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-base transition-colors ${activeTab === 'users' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'}`}>{t('userManagement')}</button>}
                        {is_admin && <button onClick={() => setActiveTab('roles')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-base transition-colors ${activeTab === 'roles' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'}`}>{t('roleManagement')}</button>}
                        {is_admin && <button onClick={() => setActiveTab('branches')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-base transition-colors ${activeTab === 'branches' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'}`}>{t('branchManagement')}</button>}
                        {canManageSuppliers && <button onClick={() => setActiveTab('suppliers')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-base transition-colors ${activeTab === 'suppliers' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'}`}>{t('supplierManagement')}</button>}
                    </nav>
                </div>
                <div className="mt-6">
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
