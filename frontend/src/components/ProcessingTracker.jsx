import React, { useEffect, useState } from 'react';
import { CheckCircle, Circle, Loader2, AlertCircle } from 'lucide-react';
import { getReasonMessage } from '../constants/moderation';

const steps = [
  { id: 1, label: 'Uploading image to S3 bucket' },
  { id: 2, label: 'Lambda Event Triggered' },
  { id: 3, label: 'Checking image by Rekognition' },
  { id: 4, label: 'Tagging Image' },
  { id: 5, label: 'Final Status' }
];

const ProcessingTracker = ({ currentStep, uploadProgress, finalStatus, reason }) => {
  return (
    <div className="processing-tracker">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.id || (currentStep === step.id && step.id === 5 && finalStatus);
        const isCurrent = currentStep === step.id;
        const isPending = currentStep < step.id;

        let icon;
        if (isCompleted) {
          icon = <CheckCircle className="step-icon completed" size={20} />;
        } else if (isCurrent) {
          if (step.id === 1 && uploadProgress < 100) {
            // Circular progress for upload could be here, but simple loader is fine
            icon = <Loader2 className="step-icon spinning" size={20} />;
          } else {
            icon = <Loader2 className="step-icon spinning" size={20} />;
          }
        } else {
          icon = <Circle className="step-icon pending" size={20} />;
        }

        // Special handling for final step to show status
        let label = step.label;
        let subLabel = null;

        if (step.id === 5) {
          if (finalStatus) {
            if (finalStatus === 'APPROVED') {
              label = 'Approved';
              icon = <CheckCircle className="step-icon approved" size={20} />;
            } else if (finalStatus === 'BLURRED') {
              label = 'Blurred';
              icon = <AlertCircle className="step-icon blurred" size={20} />;
              subLabel = getReasonMessage(reason);
            } else if (finalStatus === 'BLOCKED') {
              label = 'Blocked';
              icon = <AlertCircle className="step-icon blocked" size={20} />;
              subLabel = getReasonMessage(reason);
            }
          } else if (isCurrent) {
            label = 'Finalizing...';
          }
        }

        return (
          <div key={step.id} className={`tracker-step ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}>
            <div className="step-icon-wrapper">
              {icon}
              {index < steps.length - 1 && <div className={`step-line ${isCompleted ? 'completed' : ''}`} />}
            </div>
            <div className="step-content">
              <span className="step-label">{label}</span>
              {subLabel && <span className="step-sublabel">{subLabel}</span>}
              {step.id === 1 && isCurrent && uploadProgress > 0 && uploadProgress < 100 && (
                <span className="upload-progress">{Math.round(uploadProgress)}%</span>
              )}
            </div>
          </div>
        );
      })}

      <style>{`
        .processing-tracker {
          display: flex;
          flex-direction: column;
          gap: 0;
          padding: 1rem;
        }
        .tracker-step {
          display: flex;
          gap: 1rem;
          position: relative;
          padding-bottom: 1.5rem;
        }
        .tracker-step:last-child {
          padding-bottom: 0;
        }
        .step-icon-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 24px;
        }
        .step-icon {
          color: #e5e7eb; /* gray-200 */
          background: white;
          z-index: 1;
        }
        .step-icon.completed {
          color: #22c55e; /* green-500 */
        }
        .step-icon.spinning {
          color: #3b82f6; /* blue-500 */
          animation: spin 1s linear infinite;
        }
        .step-icon.approved { color: #22c55e; }
        .step-icon.blurred { color: #eab308; }
        .step-icon.blocked { color: #ef4444; }
        
        .step-line {
          width: 2px;
          background-color: #e5e7eb;
          flex-grow: 1;
          margin-top: 4px;
          margin-bottom: -24px; /* Extend to next icon */
        }
        .step-line.completed {
          background-color: #22c55e;
        }
        
        .step-content {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding-top: 2px;
        }
        .step-label {
          font-weight: 500;
          color: #374151;
        }
        .tracker-step.current .step-label {
          color: #111827;
          font-weight: 600;
        }
        .tracker-step.completed .step-label {
          color: #374151;
        }
        .step-sublabel {
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }
        .upload-progress {
            font-size: 0.75rem;
            color: #6b7280;
            margin-left: 0.5rem;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ProcessingTracker;
