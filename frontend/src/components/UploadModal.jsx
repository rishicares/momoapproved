import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, ArrowRight } from 'lucide-react';

const UploadModal = ({ isOpen, onClose, onUpload }) => {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const inputRef = useRef(null);

    if (!isOpen) return null;

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file) => {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleSubmit = async () => {
        if (!selectedFile) return;
        setIsUploading(true);
        await onUpload(selectedFile);
        setIsUploading(false);
        handleClose();
    };

    const handleClose = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setIsUploading(false);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="upload-header">
                    <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Create new post</h2>
                    <button onClick={handleClose} className="btn-ghost" style={{ padding: '0.5rem', borderRadius: '50%' }}>
                        <X size={20} />
                    </button>
                </div>

                <div className="upload-body">
                    {!previewUrl ? (
                        <div
                            className="upload-area"
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => inputRef.current?.click()}
                            style={{ borderColor: dragActive ? 'hsl(var(--foreground))' : undefined }}
                        >
                            <input
                                ref={inputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleChange}
                                style={{ display: 'none' }}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', color: 'hsl(var(--foreground))' }}>
                                <ImageIcon size={64} strokeWidth={1} />
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.5rem' }}>Drag photos here</p>
                                    <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
                                        Select from computer
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div style={{ flex: 1, position: 'relative', borderRadius: '1rem', overflow: 'hidden', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <img src={previewUrl} alt="Preview" style={{ maxHeight: '400px', width: 'auto', maxWidth: '100%' }} />
                            </div>
                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    className="btn btn-primary"
                                    disabled={!selectedFile || isUploading}
                                    onClick={handleSubmit}
                                    style={{ width: '100%', justifyContent: 'center' }}
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} style={{ animation: 'spin 1s linear infinite' }} />
                                            <span>Sharing...</span>
                                        </>
                                    ) : (
                                        <span>Share</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
};

export default UploadModal;
