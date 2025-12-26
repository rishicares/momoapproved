import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Navbar from './components/Navbar';
import ImageFeed from './components/ImageFeed';
import UploadDrawer from './components/UploadDrawer';
import { getPresignedUrl, uploadToS3, listImages, getImageStatus } from './api/s3';
import './styles/App.css';

function App() {
  const [images, setImages] = useState([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, blurred: 0, blocked: 0 });
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'single'

  const [processingState, setProcessingState] = useState({
    isProcessing: false,
    step: 1,
    uploadProgress: 0,
    finalStatus: null,
    reason: null
  });

  const [error, setError] = useState(null);

  // Load images from S3 on mount
  useEffect(() => {
    const fetchImages = async () => {
      try {
        setError(null);
        const { images, stats } = await listImages();
        setImages(images);
        if (stats) setStats(stats);
      } catch (error) {
        console.error("Failed to load images:", error);
        setError(error.message);
        // Fallback to empty array if fetch fails
        setImages([]);
      }
    };

    fetchImages();
  }, []);

  // Auto-poll for new images every second
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        // Get timestamp of newest image
        const latestTimestamp = images.length > 0 ? images[0].timestamp : null;
        const { images: newImages, stats: newStats } = await listImages(latestTimestamp);

        if (newImages && newImages.length > 0) {
          console.log(`Found ${newImages.length} new image(s)`);
          setImages(prev => [...newImages, ...prev]);
        }

        if (newStats) setStats(newStats);
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 1000); // Poll every second

    return () => clearInterval(pollInterval);
  }, [images]);

  const handleUpload = async (file) => {
    try {
      setProcessingState(prev => ({ ...prev, isProcessing: true, step: 1, uploadProgress: 0 }));

      // 1. Get Presigned URL
      const { uploadUrl, fileId } = await getPresignedUrl(file.type);

      // 2. Upload to S3
      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setProcessingState(prev => {
          if (prev.uploadProgress >= 90) return prev;
          return { ...prev, uploadProgress: prev.uploadProgress + 10 };
        });
      }, 100);

      await uploadToS3(file, uploadUrl);

      clearInterval(uploadInterval);
      setProcessingState(prev => ({ ...prev, uploadProgress: 100, step: 2 }));

      // Simulate steps 2, 3, 4 with timeouts
      // Simulate steps 2, 3, 4 with timeouts
      // Step 2 (Lambda): 1.5s
      // Step 3 (Rekognition): 4.5s (Increased duration as requested)
      setTimeout(() => {
        setProcessingState(prev => {
          if (prev.finalStatus) return prev; // Don't update if already finished
          return { ...prev, step: 3 };
        });
      }, 1500);

      setTimeout(() => {
        setProcessingState(prev => {
          if (prev.finalStatus) return prev; // Don't update if already finished
          return { ...prev, step: 4 };
        });
      }, 6000);

      // 4. Start Polling for the new image
      // Poll every 1 second for 60 seconds max
      let attempts = 0;
      const maxAttempts = 60;
      const intervalId = setInterval(async () => {
        attempts++;
        console.log(`Polling for updates (attempt ${attempts})...`);

        try {
          // Check status of the specific file directly
          const imageStatus = await getImageStatus(fileId);

          if (imageStatus && imageStatus.status && ['APPROVED', 'BLURRED', 'BLOCKED'].includes(imageStatus.status)) {
            clearInterval(intervalId);
            console.log("New image found!", imageStatus);

            // Add to feed ONLY if not blocked (blocked images should never be shown)
            if (imageStatus.status !== 'BLOCKED') {
              setImages(prev => [imageStatus, ...prev]);
            }

            // Update stats (optimistic update or fetch new stats)
            // For now, let's just fetch new stats to be accurate
            listImages().then(({ stats }) => {
              if (stats) setStats(stats);
            });

            setProcessingState(prev => ({
              ...prev,
              step: 5,
              finalStatus: imageStatus.status,
              reason: imageStatus.reason
            }));
          } else if (attempts >= maxAttempts) {
            clearInterval(intervalId);
            console.log("Polling timed out.");
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 1000);

    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload image. Please try again.");
      setProcessingState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  return (
    <div className="app">
      <Navbar viewMode={viewMode} setViewMode={setViewMode} />

      {/* Stats Bar */}
      <div className="container">
        <div className="stats-bar">
          <StatItem label="Total" value={stats.total} color="white" />
          <div className="stats-divider" />
          <StatItem label="Approved" value={stats.approved} color="#4ade80" />
          <div className="stats-divider" />
          <StatItem label="Blurred" value={stats.blurred} color="#facc15" />
          <div className="stats-divider" />
          <StatItem label="Blocked" value={stats.blocked} color="#f87171" />
        </div>
      </div>

      {error && (
        <div className="container" style={{ marginTop: '1rem', color: 'red', textAlign: 'center' }}>
          Error loading images: {error}
        </div>
      )}

      <main>
        <ImageFeed images={images} viewMode={viewMode} />
      </main>

      {/* Floating Action Button for Upload */}
      {!isUploadModalOpen && (
        <button
          className="fab-upload"
          onClick={() => setIsUploadModalOpen(true)}
          title="Upload Image"
        >
          <Plus size={32} strokeWidth={2.5} />
        </button>
      )}

      <UploadDrawer
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          // Reset state after close
          setTimeout(() => {
            setProcessingState({
              isProcessing: false,
              step: 1,
              uploadProgress: 0,
              finalStatus: null,
              reason: null
            });
          }, 300);
        }}
        onUpload={handleUpload}
        processingState={processingState}
      />
    </div>
  );
}

const StatItem = ({ label, value, color }) => (
  <div className="stat-item">
    <span className="stat-label">
      {label}
    </span>
    <span className="stat-value" style={{ color }}>
      {value}
    </span>
  </div>
);

export default App;
