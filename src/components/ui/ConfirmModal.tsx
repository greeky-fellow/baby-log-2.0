import React from 'react';
import { Button } from './Button';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 transform transition-all scale-100">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{message}</p>
                <div className="flex gap-3 pt-2">
                    <Button variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
                    <Button variant="primary" className="flex-1 bg-black" onClick={onConfirm}>Confirm</Button>
                </div>
            </div>
        </div>
    );
};
