import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Loader2, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const StatusBox = ({ jobStatus, onClose, onExpand, onDismiss }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFile, setActiveFile] = useState(null);

  if (!jobStatus) return null;

  const { job_id, status, error, files } = jobStatus;

  // Determine status color and icon
  const getStatusDisplay = () => {
    switch (status) {
      case 'SUBMITTED':
      case 'PENDING':
        return {
          icon: <Clock size={16} className="animate-pulse" />,
          color: '#3b82f6',
          bg: 'rgba(59, 130, 246, 0.1)',
          border: '#3b82f6',
          text: 'Job Submitted'
        };
      case 'PROCESSING':
      case 'IN_PROGRESS':
        return {
          icon: <Loader2 size={16} className="animate-spin" />,
          color: '#8b5cf6',
          bg: 'rgba(139, 92, 246, 0.1)',
          border: '#8b5cf6',
          text: 'Processing...'
        };
      case 'COMPLETED':
        return {
          icon: <CheckCircle size={16} />,
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.1)',
          border: '#10b981',
          text: 'Completed'
        };
      case 'FAILED':
        return {
          icon: <AlertTriangle size={16} />,
          color: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.1)',
          border: '#ef4444',
          text: 'Failed'
        };
      default:
        return {
          icon: <Clock size={16} />,
          color: '#6b7280',
          bg: 'rgba(107, 114, 128, 0.1)',
          border: '#6b7280',
          text: status || 'Unknown'
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const canExpand = status === 'COMPLETED' && files && Object.keys(files).length > 0;

  const handleToggleExpand = () => {
    if (canExpand) {
      const newExpandedState = !isExpanded;
      setIsExpanded(newExpandedState);
      
      // Set first file as active when expanding
      if (newExpandedState && !activeFile) {
        const fileNames = Object.keys(files);
        if (fileNames.length > 0) {
          setActiveFile(fileNames[0]);
        }
      }
      
      if (onExpand) {
        onExpand(newExpandedState);
      }
    }
  };

  const styles = {
    container: {
      position: 'fixed',
      bottom: 20,
      right: 20,
      zIndex: 1000,
      minWidth: isExpanded ? 700 : 320,
      maxWidth: isExpanded ? '90vw' : 400,
      maxHeight: isExpanded ? '80vh' : 'auto',
      backgroundColor: '#1f2937',
      borderRadius: 12,
      border: `2px solid ${statusDisplay.border}`,
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
      overflow: 'hidden',
      transition: 'all 0.3s ease'
    },
    header: {
      padding: 16,
      background: statusDisplay.bg,
      borderBottom: `1px solid ${statusDisplay.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: canExpand ? 'pointer' : 'default'
    },
    headerContent: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flex: 1
    },
    statusIcon: {
      color: statusDisplay.color
    },
    statusText: {
      color: '#ffffff',
      fontWeight: 600,
      fontSize: 14
    },
    jobId: {
      color: '#9ca3af',
      fontSize: 11,
      fontFamily: 'monospace',
      marginTop: 2
    },
    controls: {
      display: 'flex',
      alignItems: 'center',
      gap: 4
    },
    iconButton: {
      padding: 6,
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: '#d1d5db',
      borderRadius: 4,
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center'
    },
    expandButton: {
      padding: 6,
      backgroundColor: 'transparent',
      border: 'none',
      cursor: canExpand ? 'pointer' : 'not-allowed',
      color: canExpand ? '#d1d5db' : '#4b5563',
      borderRadius: 4,
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center'
    },
    content: {
      padding: 16,
      maxHeight: isExpanded ? 'calc(80vh - 100px)' : 'auto',
      overflowY: 'auto'
    },
    errorMessage: {
      color: '#fca5a5',
      fontSize: 13,
      padding: 12,
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderRadius: 6,
      border: '1px solid #ef4444'
    },
    filesContainer: {
      display: 'grid',
      gridTemplateColumns: isExpanded ? '200px 1fr' : '1fr',
      gap: 16,
      height: '100%'
    },
    filesList: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    },
    fileButton: {
      padding: '10px 14px',
      backgroundColor: '#374151',
      border: 'none',
      borderRadius: 6,
      color: '#d1d5db',
      fontSize: 13,
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 0.2s',
      fontWeight: 500
    },
    fileButtonActive: {
      backgroundColor: '#2563eb',
      color: '#ffffff'
    },
    fileContent: {
      backgroundColor: '#111827',
      borderRadius: 6,
      padding: 16,
      fontSize: 13,
      fontFamily: 'monospace',
      color: '#e5e7eb',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      lineHeight: 1.6,
      maxHeight: isExpanded ? 'calc(80vh - 180px)' : 300,
      overflowY: 'auto',
      border: '1px solid #374151'
    },
    hint: {
      color: '#9ca3af',
      fontSize: 12,
      textAlign: 'center',
      marginTop: 8,
      fontStyle: 'italic'
    }
  };

  return (
    <div style={styles.container}>
      <div
        style={styles.header}
        onClick={handleToggleExpand}
      >
        <div style={styles.headerContent}>
          <div style={styles.statusIcon}>
            {statusDisplay.icon}
          </div>
          <div>
            <div style={styles.statusText}>{statusDisplay.text}</div>
            <div style={styles.jobId}>Job: {job_id.slice(0, 8)}...</div>
          </div>
        </div>
        <div style={styles.controls}>
          {canExpand && (
            <button
              style={styles.expandButton}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleExpand();
              }}
              title={isExpanded ? "Collapse" : "Expand to view results"}
            >
              {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          )}
          <button
            style={styles.iconButton}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Minimize"
          >
            <ChevronDown size={18} />
          </button>
          {(status === 'COMPLETED' || status === 'FAILED') && onDismiss && (
            <button
              style={styles.iconButton}
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Remove this job from tracking? You can still find it in Analysis Reports.')) {
                  onDismiss();
                }
              }}
              title="Dismiss (remove from tracking)"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {status === 'FAILED' && error && (
        <div style={styles.content}>
          <div style={styles.errorMessage}>
            {error}
          </div>
        </div>
      )}

      {status === 'COMPLETED' && files && Object.keys(files).length > 0 && (
        <div style={styles.content}>
          {!isExpanded ? (
            <div style={styles.hint}>
              Click header to view results
            </div>
          ) : (
            <div style={styles.filesContainer}>
              <div style={styles.filesList}>
                {Object.keys(files).map((fileName) => (
                  <button
                    key={fileName}
                    style={{
                      ...styles.fileButton,
                      ...(activeFile === fileName ? styles.fileButtonActive : {})
                    }}
                    onClick={() => setActiveFile(fileName)}
                  >
                    {fileName}
                  </button>
                ))}
              </div>
              <div>
                {activeFile && (
                  <div>
                    <div style={{
                      color: '#d1d5db',
                      fontSize: 14,
                      fontWeight: 600,
                      marginBottom: 8
                    }}>
                      {activeFile}
                    </div>
                    <div style={styles.fileContent}>
                      {files[activeFile]}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        button:hover {
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
};

export default StatusBox;