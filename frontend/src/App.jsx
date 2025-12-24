import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Navbar from './components/Navbar';
import ImageFeed from './components/ImageFeed';
import UploadModal from './components/UploadModal';
import { getPresignedUrl, uploadToS3, listImages } from './api/s3';
import './styles/App.css';

function App() {
  const [images, setImages] = useState([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, blurred: 0, blocked: 0 });
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'single'

  // Load images from S3 on mount
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { images, stats } = await listImages();
        setImages(images);
        if (stats) setStats(stats);
      } catch (error) {
        console.error("Failed to load images:", error);
        // Fallback to empty array if fetch fails
        setImages([]);
      }
    };

    fetchImages();
  }, []);

  const handleUpload = async (file) => {
    try {
      // 1. Get Presigned URL
      const { uploadUrl, fileId } = await getPresignedUrl(file.type);

      // 2. Upload to S3
      await uploadToS3(file, uploadUrl);

      // 3. Close modal immediately
      setIsUploadModalOpen(false);

      // 4. Start Polling for the new image
      // Poll every 3 seconds for 30 seconds max
      let attempts = 0;
      const maxAttempts = 10;
      const intervalId = setInterval(async () => {
        attempts++;
        console.log(`Polling for updates (attempt ${attempts})...`);

        try {
          const { images: newImages, stats: newStats } = await listImages();

          // Update state
          setImages(newImages);
          if (newStats) setStats(newStats);

          // Check if our fileId is in the list (meaning it's approved/blurred)
          // Note: fileId from getPresignedUrl matches the S3 key
          const found = newImages.some(img => img.id === fileId);

          if (found || attempts >= maxAttempts) {
            clearInterval(intervalId);
            if (found) console.log("New image found!");
            else console.log("Polling timed out.");
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 3000);

    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload image. Please try again.");
    }
  };

  return (
    <div className="app">
      <Navbar viewMode={viewMode} setViewMode={setViewMode} />

      {/* Stats Bar */}
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

      <main>
        <ImageFeed images={images} viewMode={viewMode} />
      </main>

      {/* Floating Action Button for Upload */}
      <button
        className="fab-upload"
        onClick={() => setIsUploadModalOpen(true)}
        title="Upload Image"
      >
        <Plus size={32} strokeWidth={2.5} />
      </button>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
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
