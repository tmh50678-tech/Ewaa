
import React from 'react';
import FocusTrap from 'focus-trap-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, size = 'lg' }) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
    };

    return (
        <FocusTrap active={isOpen}>
            <div className="fixed inset-0 bg-slate-950 bg-opacity-70 z-50 flex justify-center items-center p-4 animate-fade-in-up" role="dialog" aria-modal="true">
                <div className={`glass-panel rounded-lg shadow-2xl w-full ${sizeClasses[size]} max-h-full overflow-y-auto`}>
                    <div className="p-4 sm:p-6 relative">
                        <button onClick={onClose} className="absolute top-4 right-4 rtl:right-auto rtl:left-4 text-slate-400 hover:text-white text-3xl z-10" aria-label="Close">
                            &times;
                        </button>
                        {children}
                    </div>
                </div>
            </div>
        </FocusTrap>
    );
};

export default Modal;
