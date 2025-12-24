import React, { useState } from 'react';
import { CheckCircle, Loader2, X, EyeOff } from 'lucide-react';

const ImageFeed = ({ images, viewMode = 'grid' }) => {
    const [lightboxImage, setLightboxImage] = useState(null);
    const [unblurredImages, setUnblurredImages] = useState(new Set());

    const handleImageClick = (image) => {
        // Don't open lightbox for blurred images
        if (image.status === 'BLURRED' && !unblurredImages.has(image.id)) {
            return; // Do nothing
        }
        // Open lightbox for normal or unblurred images
        setLightboxImage(image);
    };

    return (
        <>
            <div className={`container ${viewMode === 'single' ? 'feed-view' : ''}`}>
                <div className={viewMode === 'grid' ? 'image-grid' : 'image-feed-list'}>
                    {images.map((image) => {
                        const isBlurred = image.status === 'BLURRED' && !unblurredImages.has(image.id);

                        return (
                            <div
                                key={image.id}
                                className={`image-card ${viewMode === 'single' ? 'feed-card' : ''}`}
                                onClick={() => handleImageClick(image)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div style={{ position: 'relative' }}>
                                    <img
                                        src={image.url}
                                        alt="User upload"
                                        style={{
                                            opacity: image.status === 'processing' ? 0.5 : 1,
                                            filter: isBlurred ? 'blur(20px)' : 'none',
                                            userSelect: 'none'
                                        }}
                                        draggable={false}
                                    />

                                    {/* Sensitive content overlay for blurred images */}
                                    {isBlurred && (
                                        <div style={{
                                            position: 'absolute',
                                            inset: 0,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                            color: 'white',
                                            cursor: 'pointer',
                                            userSelect: 'none',
                                            gap: '0.75rem'
                                        }}>
                                            <EyeOff size={48} strokeWidth={1.5} />
                                            <div style={{
                                                fontSize: '1rem',
                                                fontWeight: 600,
                                                textAlign: 'center'
                                            }}>
                                                Sensitive Content
                                            </div>
                                            <div style={{
                                                fontSize: '0.875rem',
                                                opacity: 0.9,
                                                textAlign: 'center',
                                                maxWidth: '200px'
                                            }}>
                                                This photo may contain sensitive content
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    // Open lightbox with blurred image
                                                    setLightboxImage(image);

                                                    // Open lightbox with blurred image
                                                    setLightboxImage(image);
                                                }}
                                                style={{
                                                    marginTop: '0.5rem',
                                                    padding: '0.5rem 1.5rem',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                                    borderRadius: '0.5rem',
                                                    color: 'white',
                                                    fontWeight: 600,
                                                    fontSize: '0.875rem',
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                                                onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                                            >
                                                See Photo
                                            </button>
                                        </div>
                                    )}

                                    {/* Status Badge - only show if status exists */}
                                    {image.status && (
                                        <div className={`status-badge status-${image.status}`} style={{
                                            backgroundColor: image.status === 'APPROVED' ? 'rgba(0,0,0,0.6)' :
                                                image.status === 'PROCESSING' ? 'rgba(251, 191, 36, 0.9)' :
                                                    image.status === 'BLURRED' ? 'rgba(251, 191, 36, 0.9)' :
                                                        'rgba(248, 113, 113, 0.9)',
                                            color: (image.status === 'PROCESSING' || image.status === 'BLURRED') ? 'black' : 'white'
                                        }}>
                                            {image.status === 'PROCESSING' && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                    <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                                                    <span>Processing</span>
                                                </div>
                                            )}
                                            {image.status === 'APPROVED' && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                    <CheckCircle size={12} />
                                                    <span>Approved</span>
                                                </div>
                                            )}
                                            {image.status === 'BLURRED' && !unblurredImages.has(image.id) && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                    <EyeOff size={12} />
                                                    <span>Sensitive</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                {images.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '6rem 0', color: 'hsl(var(--muted-foreground))' }}>
                        <p style={{ fontSize: '1.25rem' }}>No moments shared yet.</p>
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightboxImage && (
                <div className="lightbox-overlay" onClick={() => setLightboxImage(null)}>
                    <button className="lightbox-close" onClick={() => setLightboxImage(null)}>
                        <X size={32} />
                    </button>
                    <div className="lightbox-content" onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
                        <img
                            src={lightboxImage.url}
                            alt="Full view"
                            style={{
                                filter: (lightboxImage.status === 'BLURRED' && !unblurredImages.has(lightboxImage.id)) ? 'blur(30px)' : 'none',
                                transition: 'filter 0.3s ease'
                            }}
                        />

                        {/* In-Lightbox Sensitive Overlay */}
                        {lightboxImage.status === 'BLURRED' && !unblurredImages.has(lightboxImage.id) && (
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                color: 'white',
                                gap: '1rem',
                                zIndex: 10
                            }}>
                                <EyeOff size={64} strokeWidth={1.5} />
                                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>Sensitive Content</div>
                                <p style={{ maxWidth: '300px', textAlign: 'center', opacity: 0.9 }}>
                                    This photo contains sensitive content.
                                </p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setUnblurredImages(prev => new Set([...prev, lightboxImage.id]));
                                    }}
                                    style={{
                                        marginTop: '0.5rem',
                                        padding: '0.75rem 2rem',
                                        backgroundColor: 'white',
                                        color: 'black',
                                        border: 'none',
                                        borderRadius: '2rem',
                                        fontWeight: 600,
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    Reveal Photo
                                </button>
                            </div>
                        )}

                        {/* Re-blur Button (only for revealed sensitive images) */}
                        {lightboxImage.status === 'BLURRED' && unblurredImages.has(lightboxImage.id) && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setUnblurredImages(prev => {
                                        const next = new Set(prev);
                                        next.delete(lightboxImage.id);
                                        return next;
                                    });
                                }}
                                style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    padding: '0.5rem 1rem',
                                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    borderRadius: '0.5rem',
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    zIndex: 20
                                }}
                            >
                                <EyeOff size={16} />
                                Hide Photo
                            </button>
                        )}
                    </div>
                </div>
            )}

            <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </>
    );
};

export default ImageFeed;
