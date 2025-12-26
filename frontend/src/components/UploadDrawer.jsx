import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import ProcessingTracker from './ProcessingTracker';

const UploadDrawer = ({ isOpen, onClose, onUpload, processingState }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const drawerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (drawerRef.current && !drawerRef.current.contains(event.target) && isOpen) {
                // Only close if not processing
                if (!processingState.isProcessing) {
                    onClose();
                }
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, processingState.isProcessing]);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        if (processingState.isProcessing) return;

        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            onUpload(files[0]);
        }
    };

    const handleFileSelect = (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            onUpload(files[0]);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`drawer-backdrop ${isOpen ? 'open' : ''}`}
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 40,
                    opacity: isOpen ? 1 : 0,
                    pointerEvents: isOpen ? 'auto' : 'none',
                    transition: 'opacity 0.3s ease'
                }}
            />

            {/* Drawer */}
            <div
                ref={drawerRef}
                className={`upload-drawer ${isOpen ? 'open' : ''}`}
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    borderTopLeftRadius: '1.5rem',
                    borderTopRightRadius: '1.5rem',
                    padding: '1.5rem',
                    zIndex: 50,
                    transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
                    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
                    maxHeight: '85vh',
                    overflowY: 'auto'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>
                        {processingState.isProcessing ? 'Processing Upload' : 'Upload Photo'}
                    </h2>
                    {!processingState.isProcessing && (
                        <button
                            onClick={onClose}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                        >
                            <X size={24} />
                        </button>
                    )}
                </div>

                {processingState.isProcessing ? (
                    <ProcessingTracker
                        currentStep={processingState.step}
                        uploadProgress={processingState.uploadProgress}
                        finalStatus={processingState.finalStatus}
                        reason={processingState.reason}
                    />
                ) : (
                    <div
                        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            border: `2px dashed ${isDragging ? '#3b82f6' : '#e5e7eb'}`,
                            borderRadius: '1rem',
                            padding: '3rem 1.5rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            backgroundColor: isDragging ? '#eff6ff' : '#f9fafb'
                        }}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />

                        <div style={{
                            width: '64px',
                            height: '64px',
                            backgroundColor: '#eff6ff',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1rem auto',
                            color: '#3b82f6'
                        }}>
                            <Upload size={32} />
                        </div>

                        <p style={{ fontSize: '1.125rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                            Tap to select from computer
                        </p>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                            Click here or drag and drop your photo here
                        </p>
                    </div>
                )}

                {/* Close button shown after completion */}
                {processingState.step === 5 && processingState.finalStatus && (
                    <button
                        onClick={onClose}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: '#111827',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontWeight: 600,
                            marginTop: '1.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        Done
                    </button>
                )}
            </div>
        </>
    );
};

export default UploadDrawer;
