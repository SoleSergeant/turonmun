import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteAllApplicationsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    applicationCount: number;
}

const DeleteAllApplicationsModal: React.FC<DeleteAllApplicationsModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    applicationCount
}) => {
    const [confirmationText, setConfirmationText] = useState('');
    const requiredText = 'delete-all-applications';
    const isConfirmationValid = confirmationText === requiredText;

    const handleConfirm = () => {
        if (isConfirmationValid) {
            onConfirm();
            setConfirmationText('');
            onClose();
        }
    };

    const handleClose = () => {
        setConfirmationText('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <AlertTriangle className="text-red-500 mr-2" size={24} />
                        <h3 className="text-lg font-semibold text-gray-900">Delete All Applications</h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="mb-6">
                    <p className="text-gray-700 mb-4">
                        This action will permanently delete <strong>all {applicationCount} applications</strong> from the database.
                        This action cannot be undone.
                    </p>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <p className="text-red-800 text-sm font-medium mb-2">
                            ⚠️ Warning: This will delete:
                        </p>
                        <ul className="text-red-700 text-sm list-disc list-inside space-y-1">
                            <li>All application data</li>
                            <li>All uploaded documents</li>
                            <li>All application history</li>
                        </ul>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            To confirm, type <code className="bg-gray-100 px-2 py-1 rounded text-red-600 font-mono">
                                {requiredText}
                            </code> in the box below:
                        </label>
                        <input
                            type="text"
                            value={confirmationText}
                            onChange={(e) => setConfirmationText(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            placeholder="Type confirmation text here..."
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!isConfirmationValid}
                        className={`px-4 py-2 rounded-md transition-colors ${isConfirmationValid
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        Delete All Applications
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteAllApplicationsModal;