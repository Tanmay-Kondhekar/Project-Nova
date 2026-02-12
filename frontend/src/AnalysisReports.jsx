import React, { useState, useEffect } from 'react';
import { Download, Clock, CheckCircle, AlertTriangle, RefreshCw, FileText, Loader2, ChevronDown, ChevronRight, Eye } from 'lucide-react';

const AnalysisReports = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedJobs, setExpandedJobs] = useState({});
  const [jobResults, setJobResults] = useState({});
  const [loadingResults, setLoadingResults] = useState({});
  const [selectedFile, setSelectedFile] = useState({});

  const fetchJobs = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('http://localhost:8000/aws-jobs');
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      setJobs(data.jobs || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const toggleJobExpansion = async (jobId, status) => {
    // Toggle expansion state
    const isExpanding = !expandedJobs[jobId];
    setExpandedJobs(prev => ({
      ...prev,
      [jobId]: isExpanding
    }));

    // If expanding and job is completed, fetch results
    if (isExpanding && status === 'COMPLETED' && !jobResults[jobId]) {
      await fetchJobResults(jobId);
    }
  };

  const fetchJobResults = async (jobId) => {
    try {
      setLoadingResults(prev => ({ ...prev, [jobId]: true }));
      const response = await fetch(`http://localhost:8000/aws-job-result/${jobId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch job results');
      }

      const data = await response.json();
      setJobResults(prev => ({
        ...prev,
        [jobId]: data.files || {}
      }));
    } catch (err) {
      console.error('Error fetching job results:', err);
      setJobResults(prev => ({
        ...prev,
        [jobId]: { error: err.message }
      }));
    } finally {
      setLoadingResults(prev => ({ ...prev, [jobId]: false }));
    }
  };

  const handleFileSelect = (jobId, fileName) => {
    setSelectedFile(prev => ({
      ...prev,
      [jobId]: fileName
    }));
  };

  const handleDownload = async (jobId) => {
    try {
      const response = await fetch(`http://localhost:8000/aws-job-download/${jobId}`);
      
      if (!response.ok) {
        throw new Error('Failed to download job');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aws_job_${jobId.slice(0, 8)}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading job:', err);
      alert('Failed to download job: ' + err.message);
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'SUBMITTED':
      case 'PENDING':
        return {
          icon: <Clock size={16} />,
          color: '#3b82f6',
          bg: 'rgba(59, 130, 246, 0.1)',
          text: 'Pending'
        };
      case 'PROCESSING':
      case 'IN_PROGRESS':
        return {
          icon: <Loader2 size={16} className="animate-spin" />,
          color: '#8b5cf6',
          bg: 'rgba(139, 92, 246, 0.1)',
          text: 'Processing'
        };
      case 'COMPLETED':
        return {
          icon: <CheckCircle size={16} />,
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.1)',
          text: 'Completed'
        };
      case 'FAILED':
        return {
          icon: <AlertTriangle size={16} />,
          color: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.1)',
          text: 'Failed'
        };
      default:
        return {
          icon: <Clock size={16} />,
          color: '#6b7280',
          bg: 'rgba(107, 114, 128, 0.1)',
          text: status || 'Unknown'
        };
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  const styles = {
    container: {
      padding: 24
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24
    },
    title: {
      fontSize: 24,
      fontWeight: 700,
      color: '#ffffff',
      margin: 0
    },
    refreshButton: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 16px',
      backgroundColor: '#374151',
      color: '#d1d5db',
      border: 'none',
      borderRadius: 8,
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 500,
      transition: 'all 0.2s'
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 60,
      color: '#9ca3af'
    },
    errorContainer: {
      padding: 20,
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid #ef4444',
      borderRadius: 8,
      color: '#fca5a5',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    },
    emptyState: {
      textAlign: 'center',
      padding: 60,
      color: '#9ca3af'
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: 16,
      opacity: 0.5
    },
    jobList: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    },
    jobCard: {
      backgroundColor: '#1f2937',
      borderRadius: 12,
      border: '1px solid #374151',
      padding: 20,
      transition: 'all 0.2s',
      cursor: 'pointer'
    },
    jobCardHover: {
      borderColor: '#4b5563'
    },
    jobHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12
    },
    jobInfo: {
      flex: 1
    },
    jobId: {
      fontSize: 14,
      fontFamily: 'monospace',
      color: '#60a5fa',
      marginBottom: 6,
      fontWeight: 600
    },
    jobUrl: {
      fontSize: 13,
      color: '#d1d5db',
      marginBottom: 8,
      wordBreak: 'break-all'
    },
    jobMeta: {
      display: 'flex',
      gap: 16,
      fontSize: 12,
      color: '#9ca3af'
    },
    statusBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 12px',
      borderRadius: 6,
      fontSize: 13,
      fontWeight: 500
    },
    downloadButton: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '8px 16px',
      backgroundColor: '#2563eb',
      color: '#ffffff',
      border: 'none',
      borderRadius: 6,
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 500,
      transition: 'all 0.2s'
    },
    downloadButtonDisabled: {
      backgroundColor: '#4b5563',
      cursor: 'not-allowed',
      opacity: 0.6
    },
    expandButton: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      background: 'none',
      border: 'none',
      color: '#9ca3af',
      cursor: 'pointer',
      fontSize: 13,
      padding: '4px 8px',
      borderRadius: 4,
      transition: 'all 0.2s'
    },
    expandedContent: {
      marginTop: 16,
      paddingTop: 16,
      borderTop: '1px solid #374151'
    },
    fileList: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      marginBottom: 16
    },
    fileItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 12px',
      backgroundColor: '#111827',
      borderRadius: 6,
      border: '1px solid #374151',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    fileItemActive: {
      backgroundColor: '#1e3a5f',
      borderColor: '#2563eb'
    },
    fileName: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 13,
      color: '#d1d5db'
    },
    filePreview: {
      backgroundColor: '#111827',
      border: '1px solid #374151',
      borderRadius: 8,
      padding: 16,
      maxHeight: 400,
      overflow: 'auto'
    },
    fileContent: {
      fontFamily: 'monospace',
      fontSize: 12,
      color: '#d1d5db',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word'
    },
    loadingBox: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      color: '#9ca3af'
    },
    viewButton: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 12px',
      backgroundColor: 'transparent',
      color: '#60a5fa',
      border: '1px solid #2563eb',
      borderRadius: 6,
      cursor: 'pointer',
      fontSize: 12,
      fontWeight: 500,
      transition: 'all 0.2s'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <Loader2 size={48} className="animate-spin" style={{ marginBottom: 16, color: '#60a5fa' }} />
          <p>Loading analysis reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <AlertTriangle size={24} />
          <div>
            <strong>Error loading reports:</strong> {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Analysis Reports</h2>
        <button
          style={styles.refreshButton}
          onClick={fetchJobs}
          disabled={refreshing}
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {jobs.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📋</div>
          <h3 style={{ color: '#d1d5db', marginBottom: 8 }}>No Reports Yet</h3>
          <p>AWS analysis reports will appear here once jobs are completed</p>
        </div>
      ) : (
        <div style={styles.jobList}>
          {jobs.map((job) => {
            const statusDisplay = getStatusDisplay(job.status);
            const canDownload = job.status === 'COMPLETED';
            const isExpanded = expandedJobs[job.job_id];
            const results = jobResults[job.job_id];
            const isLoadingResults = loadingResults[job.job_id];
            const selectedFileName = selectedFile[job.job_id];

            return (
              <div
                key={job.job_id}
                style={styles.jobCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#4b5563';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#374151';
                }}
              >
                <div 
                  style={styles.jobHeader}
                  onClick={() => toggleJobExpansion(job.job_id, job.status)}
                >
                  <div style={styles.jobInfo}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <button style={styles.expandButton}>
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#60a5fa' }}>
                        {job.repo_name || 'Unknown Repository'}
                      </div>
                    </div>
                    <div style={styles.jobId}>
                      Job ID: {job.job_id}
                    </div>
                    {job.git_url && (
                      <div style={styles.jobUrl}>
                        <FileText size={14} style={{ display: 'inline', marginRight: 6 }} />
                        {job.git_url}
                      </div>
                    )}
                    <div style={styles.jobMeta}>
                      <span>📅 {formatDate(job.display_time || job.timestamp)}</span>
                      {job.branch && <span>🌿 {job.branch}</span>}
                    </div>
                  </div>
                  <div 
                    style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: statusDisplay.bg,
                        color: statusDisplay.color
                      }}
                    >
                      {statusDisplay.icon}
                      {statusDisplay.text}
                    </div>
                    {canDownload && (
                      <button
                        style={styles.downloadButton}
                        onClick={() => handleDownload(job.job_id)}
                        title="Download ZIP file"
                      >
                        <Download size={14} />
                        Download
                      </button>
                    )}
                    {!canDownload && job.status !== 'FAILED' && (
                      <button
                        style={{ ...styles.downloadButton, ...styles.downloadButtonDisabled }}
                        disabled
                        title="Job not completed yet"
                      >
                        <Download size={14} />
                        Download
                      </button>
                    )}
                  </div>
                </div>

                {/* Error Display */}
                {job.error && (
                  <div style={{
                    marginTop: 12,
                    padding: 10,
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid #991b1b',
                    borderRadius: 6,
                    fontSize: 13,
                    color: '#fca5a5'
                  }}>
                    ❌ {job.error}
                  </div>
                )}

                {/* Expanded Content */}
                {isExpanded && (
                  <div style={styles.expandedContent}>
                    {job.status !== 'COMPLETED' && (
                      <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>
                        📦 Results will be available once the job is completed
                      </div>
                    )}

                    {job.status === 'COMPLETED' && isLoadingResults && (
                      <div style={styles.loadingBox}>
                        <Loader2 size={32} className="animate-spin" style={{ marginRight: 12 }} />
                        Loading results...
                      </div>
                    )}

                    {job.status === 'COMPLETED' && !isLoadingResults && results && !results.error && (
                      <div>
                        <h4 style={{ color: '#d1d5db', marginBottom: 12, fontSize: 14 }}>
                          📄 Analysis Files ({Object.keys(results).length})
                        </h4>
                        <div style={styles.fileList}>
                          {Object.keys(results).map((fileName) => {
                            const isActive = selectedFileName === fileName;
                            return (
                              <div
                                key={fileName}
                                style={{
                                  ...styles.fileItem,
                                  ...(isActive ? styles.fileItemActive : {})
                                }}
                                onClick={() => handleFileSelect(job.job_id, fileName)}
                              >
                                <div style={styles.fileName}>
                                  <FileText size={16} />
                                  {fileName}
                                </div>
                                <button
                                  style={styles.viewButton}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFileSelect(job.job_id, fileName);
                                  }}
                                >
                                  <Eye size={14} />
                                  {isActive ? 'Hide' : 'View'}
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* File Preview */}
                        {selectedFileName && results[selectedFileName] && (
                          <div style={styles.filePreview}>
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              marginBottom: 12,
                              paddingBottom: 12,
                              borderBottom: '1px solid #374151'
                            }}>
                              <h5 style={{ color: '#60a5fa', margin: 0, fontSize: 13 }}>
                                {selectedFileName}
                              </h5>
                              <button
                                style={{ ...styles.viewButton, fontSize: 11 }}
                                onClick={() => setSelectedFile(prev => ({ ...prev, [job.job_id]: null }))}
                              >
                                Close Preview
                              </button>
                            </div>
                            <div style={styles.fileContent}>
                              {results[selectedFileName]}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {job.status === 'COMPLETED' && results && results.error && (
                      <div style={{
                        padding: 20,
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid #991b1b',
                        borderRadius: 6,
                        textAlign: 'center',
                        color: '#fca5a5'
                      }}>
                        ❌ Failed to load results: {results.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        button:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        
        button:active:not(:disabled) {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default AnalysisReports;