import React, { useState, useEffect } from 'react';
import { Download, Clock, CheckCircle, AlertTriangle, RefreshCw, FileText, Loader2, ChevronDown, ChevronRight, Eye, Copy, X, Shield, Bug, Code, Zap, Terminal, Activity, Search, TrendingUp, Package, GitBranch, AlertCircle, Info } from 'lucide-react';

const AnalysisReports = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedJobs, setExpandedJobs] = useState({});
  const [jobResults, setJobResults] = useState({});
  const [loadingResults, setLoadingResults] = useState({});
  const [selectedFile, setSelectedFile] = useState({});
  const [copySuccess, setCopySuccess] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [searchTerm, setSearchTerm] = useState({});
  const [highlightedText, setHighlightedText] = useState({});

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
    const isExpanding = !expandedJobs[jobId];
    setExpandedJobs(prev => ({
      ...prev,
      [jobId]: isExpanding
    }));

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
        [jobId]: {
          files: data.files || {},
          original_files: data.original_files || {}
        }
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
      [jobId]: prev[jobId] === fileName ? null : fileName
    }));
  };

  const handleCopy = async (text, identifier) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(prev => ({ ...prev, [identifier]: true }));
      setTimeout(() => {
        setCopySuccess(prev => ({ ...prev, [identifier]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = async (jobId) => {
    try {
      const response = await fetch(`http://localhost:8000/aws-job-download/${jobId}`);

      if (!response.ok) {
        throw new Error('Failed to download job');
      }

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

  const toggleSection = (jobId, sectionIndex) => {
    const key = `${jobId}-${sectionIndex}`;
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSearch = (jobId, fileName, term) => {
    const key = `${jobId}-${fileName}`;
    setSearchTerm(prev => ({ ...prev, [key]: term }));
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'SUBMITTED':
      case 'PENDING':
        return {
          icon: <Clock size={18} />,
          gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          bg: 'rgba(102, 126, 234, 0.08)',
          text: 'Pending',
          pulse: true
        };
      case 'PROCESSING':
      case 'IN_PROGRESS':
        return {
          icon: <Activity size={18} className="animate-spin" />,
          gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          bg: 'rgba(240, 147, 251, 0.08)',
          text: 'Processing',
          pulse: true
        };
      case 'COMPLETED':
        return {
          icon: <CheckCircle size={18} />,
          gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          bg: 'rgba(79, 172, 254, 0.08)',
          text: 'Completed',
          pulse: false
        };
      case 'FAILED':
        return {
          icon: <AlertTriangle size={18} />,
          gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          bg: 'rgba(250, 112, 154, 0.08)',
          text: 'Failed',
          pulse: false
        };
      default:
        return {
          icon: <Clock size={18} />,
          gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
          bg: 'rgba(168, 237, 234, 0.08)',
          text: status || 'Unknown',
          pulse: false
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

  const parseVulnerabilities = (content) => {
    const vulnBlocks = content.split(/\[\d+\]\s+VULNERABLE/).slice(1);
    return vulnBlocks.map((block, index) => {
      const lines = block.trim().split('\n');
      const title = lines[0] || `Vulnerability ${index + 1}`;
      const description = lines.slice(1).join('\n');

      let severity = 'MEDIUM';
      if (block.toLowerCase().includes('critical')) severity = 'CRITICAL';
      else if (block.toLowerCase().includes('high')) severity = 'HIGH';
      else if (block.toLowerCase().includes('low')) severity = 'LOW';

      return { title, description, severity, index: index + 1 };
    });
  };

  const parseReportSections = (content) => {
    // Parse report content into interactive sections
    const sections = [];
    const lines = content.split('\n');
    let currentSection = null;
    let currentContent = [];

    lines.forEach((line, index) => {
      // Detect section headers (lines that end with : or are in ALL CAPS or start with ##)
      const isHeader = 
        line.trim().endsWith(':') && line.trim().length < 100 ||
        (line.trim() === line.trim().toUpperCase() && line.trim().length > 3 && line.trim().length < 100) ||
        line.trim().startsWith('##') ||
        line.trim().startsWith('===');

      if (isHeader && line.trim().length > 0) {
        if (currentSection) {
          currentSection.content = currentContent.join('\n').trim();
          sections.push(currentSection);
        }
        currentSection = {
          title: line.trim().replace(/^#+\s*/, '').replace(/^===\s*/, '').replace(/:$/, ''),
          content: '',
          type: detectSectionType(line)
        };
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      } else if (line.trim()) {
        // Content before first section
        if (!currentSection) {
          currentSection = {
            title: 'Overview',
            content: '',
            type: 'info'
          };
        }
        currentContent.push(line);
      }
    });

    // Add last section
    if (currentSection) {
      currentSection.content = currentContent.join('\n').trim();
      sections.push(currentSection);
    }

    return sections.length > 0 ? sections : [{
      title: 'Report Content',
      content: content,
      type: 'info'
    }];
  };

  const detectSectionType = (header) => {
    const lower = header.toLowerCase();
    if (lower.includes('error') || lower.includes('issue') || lower.includes('problem')) return 'error';
    if (lower.includes('warning') || lower.includes('alert')) return 'warning';
    if (lower.includes('success') || lower.includes('complete')) return 'success';
    if (lower.includes('summary') || lower.includes('overview')) return 'summary';
    if (lower.includes('detail') || lower.includes('finding')) return 'detail';
    if (lower.includes('recommendation') || lower.includes('suggestion')) return 'recommendation';
    return 'info';
  };

  const getSectionIcon = (type) => {
    switch (type) {
      case 'error': return <AlertCircle size={18} />;
      case 'warning': return <AlertTriangle size={18} />;
      case 'success': return <CheckCircle size={18} />;
      case 'summary': return <TrendingUp size={18} />;
      case 'detail': return <FileText size={18} />;
      case 'recommendation': return <Info size={18} />;
      default: return <FileText size={18} />;
    }
  };

  const getSectionColor = (type) => {
    switch (type) {
      case 'error': return { border: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)', gradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' };
      case 'warning': return { border: '#eab308', bg: 'rgba(234, 179, 8, 0.1)', gradient: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)' };
      case 'success': return { border: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' };
      case 'summary': return { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' };
      case 'recommendation': return { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' };
      default: return { border: '#4facfe', bg: 'rgba(79, 172, 254, 0.1)', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' };
    }
  };

  const highlightSearchTerm = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === searchTerm.toLowerCase() 
        ? `<mark style="background: rgba(234, 179, 8, 0.3); color: #fbbf24; padding: 2px 4px; border-radius: 3px;">${part}</mark>`
        : part
    ).join('');
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return { bg: 'rgba(220, 38, 38, 0.1)', border: '#dc2626', gradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' };
      case 'HIGH':
        return { bg: 'rgba(234, 88, 12, 0.1)', border: '#ea580c', gradient: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' };
      case 'MEDIUM':
        return { bg: 'rgba(234, 179, 8, 0.1)', border: '#eab308', gradient: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)' };
      case 'LOW':
        return { bg: 'rgba(34, 197, 94, 0.1)', border: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' };
      default:
        return { bg: 'rgba(156, 163, 175, 0.1)', border: '#9ca3af', gradient: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' };
    }
  };

  const getFileIcon = (fileName) => {
    if (fileName.toLowerCase().includes('vulnerability')) return <Bug size={18} />;
    if (fileName.toLowerCase().includes('repair')) return <Code size={18} />;
    if (fileName.toLowerCase().includes('report')) return <FileText size={18} />;
    return <Terminal size={18} />;
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}>
            <Loader2 size={56} className="animate-spin" />
          </div>
          <p style={styles.loadingText}>Initializing Analysis Dashboard...</p>
          <div style={styles.loadingBar}>
            <div style={styles.loadingBarFill} className="loading-bar-animation" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>
            <AlertTriangle size={32} />
          </div>
          <div style={styles.errorContent}>
            <h3 style={styles.errorTitle}>Connection Error</h3>
            <p style={styles.errorMessage}>{error}</p>
            <button style={styles.retryButton} onClick={fetchJobs}>
              <RefreshCw size={16} />
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header Section */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerIcon}>
            <Shield size={32} />
          </div>
          <div>
            <h1 style={styles.title}>Security Analysis Dashboard</h1>
            <p style={styles.subtitle}>
              Real-time vulnerability detection and code analysis
            </p>
          </div>
        </div>
        <button
          style={styles.refreshButton}
          onClick={fetchJobs}
          disabled={refreshing}
          className="refresh-button"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Bar */}
      <div style={styles.statsBar}>
        <div style={styles.statCard}>
          <div style={styles.statIcon} className="stat-icon-pulse">
            <Activity size={20} />
          </div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>{jobs.length}</div>
            <div style={styles.statLabel}>Total Scans</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <CheckCircle size={20} />
          </div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>
              {jobs.filter(j => j.status === 'COMPLETED').length}
            </div>
            <div style={styles.statLabel}>Completed</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <Clock size={20} />
          </div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>
              {jobs.filter(j => ['PENDING', 'PROCESSING', 'IN_PROGRESS'].includes(j.status)).length}
            </div>
            <div style={styles.statLabel}>In Progress</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <AlertTriangle size={20} />
          </div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>
              {jobs.filter(j => j.status === 'FAILED').length}
            </div>
            <div style={styles.statLabel}>Failed</div>
          </div>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            <Shield size={80} />
          </div>
          <h3 style={styles.emptyTitle}>No Analysis Reports Yet</h3>
          <p style={styles.emptyText}>
            Security analysis reports will appear here once scanning jobs are initiated and completed
          </p>
          <div style={styles.emptyFeatures}>
            <div style={styles.emptyFeature}>
              <Zap size={20} />
              <span>Real-time Scanning</span>
            </div>
            <div style={styles.emptyFeature}>
              <Bug size={20} />
              <span>Vulnerability Detection</span>
            </div>
            <div style={styles.emptyFeature}>
              <Code size={20} />
              <span>Automated Repairs</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={styles.jobList}>
          {jobs.map((job, jobIndex) => {
            const statusDisplay = getStatusDisplay(job.status);
            const canDownload = job.status === 'COMPLETED';
            const isExpanded = expandedJobs[job.job_id];
            const jobData = jobResults[job.job_id];
            const results = jobData?.files || {};
            const originalFiles = jobData?.original_files || {};
            const isLoadingResults = loadingResults[job.job_id];
            const selectedFileName = selectedFile[job.job_id];

            return (
              <div
                key={job.job_id}
                style={{
                  ...styles.jobCard,
                  animationDelay: `${jobIndex * 0.1}s`
                }}
                className="job-card-animate"
              >
                {/* Job Card Header */}
                <div
                  style={styles.jobHeader}
                  onClick={() => toggleJobExpansion(job.job_id, job.status)}
                >
                  <div style={styles.jobInfo}>
                    <div style={styles.jobTitleRow}>
                      <button style={styles.expandButton}>
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </button>
                      <div style={styles.repoName}>
                        <Terminal size={20} />
                        {job.repo_name || 'Unknown Repository'}
                      </div>
                      <div
                        style={{
                          ...styles.statusBadge,
                          background: statusDisplay.gradient
                        }}
                        className={statusDisplay.pulse ? 'status-pulse' : ''}
                      >
                        {statusDisplay.icon}
                        <span>{statusDisplay.text}</span>
                      </div>
                    </div>

                    <div style={styles.jobMeta}>
                      <div style={styles.metaItem}>
                        <span style={styles.metaLabel}>Job ID:</span>
                        <code style={styles.metaValue}>{job.job_id.slice(0, 12)}...</code>
                      </div>
                      {job.git_url && (
                        <div style={styles.metaItem}>
                          <span style={styles.metaLabel}>Repository:</span>
                          <span style={styles.metaValue}>{job.git_url}</span>
                        </div>
                      )}
                      <div style={styles.metaRow}>
                        <div style={styles.metaChip}>
                          <Clock size={14} />
                          {formatDate(job.display_time || job.timestamp)}
                        </div>
                        {job.branch && (
                          <div style={styles.metaChip}>
                            <Code size={14} />
                            {job.branch}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    style={styles.jobActions}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {canDownload && (
                      <button
                        style={styles.downloadButton}
                        onClick={() => handleDownload(job.job_id)}
                        className="action-button"
                      >
                        <Download size={16} />
                        <span>Download Report</span>
                      </button>
                    )}
                    {!canDownload && job.status !== 'FAILED' && (
                      <button
                        style={styles.downloadButtonDisabled}
                        disabled
                      >
                        <Clock size={16} />
                        <span>Processing...</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Error Display */}
                {job.error && (
                  <div style={styles.jobError}>
                    <AlertTriangle size={20} />
                    <div>
                      <div style={styles.errorLabel}>Error Details</div>
                      <div style={styles.errorDetail}>{job.error}</div>
                    </div>
                  </div>
                )}

                {/* Expanded Content */}
                {isExpanded && (
                  <div style={styles.expandedContent} className="expanded-animate">
                    {job.status !== 'COMPLETED' && (
                      <div style={styles.pendingBox}>
                        <Loader2 size={32} className="animate-spin" />
                        <p style={styles.pendingText}>
                          Analysis in progress. Results will be available upon completion.
                        </p>
                      </div>
                    )}

                    {job.status === 'COMPLETED' && isLoadingResults && (
                      <div style={styles.loadingBox}>
                        <Loader2 size={40} className="animate-spin" />
                        <p style={styles.loadingBoxText}>Loading analysis results...</p>
                      </div>
                    )}

                    {job.status === 'COMPLETED' && !isLoadingResults && jobData && !jobData.error && (
                      <div style={styles.resultsContainer}>
                        <div style={styles.resultsHeader}>
                          <h4 style={styles.resultsTitle}>
                            <FileText size={18} />
                            Analysis Results
                          </h4>
                          <div style={styles.fileCount}>
                            {results ? Object.keys(results).length : 0} files
                          </div>
                        </div>

                        {/* File Tabs */}
                        <div style={styles.fileTabs}>
                          {results && Object.keys(results).map((fileName) => {
                            const isActive = selectedFileName === fileName;
                            const icon = getFileIcon(fileName);
                            return (
                              <button
                                key={fileName}
                                style={{
                                  ...styles.fileTab,
                                  ...(isActive ? styles.fileTabActive : {})
                                }}
                                onClick={() => handleFileSelect(job.job_id, fileName)}
                                className="file-tab"
                              >
                                {icon}
                                <span>{fileName}</span>
                                {isActive && <div style={styles.fileTabIndicator} />}
                              </button>
                            );
                          })}
                        </div>

                        {/* File Content Display */}
                        {selectedFileName && results[selectedFileName] && (
                          <div style={styles.fileViewer} className="file-viewer-animate">
                            {/* File Header */}
                            <div style={styles.fileViewerHeader}>
                              <div style={styles.fileViewerTitle}>
                                {getFileIcon(selectedFileName)}
                                <span>{selectedFileName}</span>
                              </div>
                              <div style={styles.fileViewerActions}>
                                {/* Search bar for report files */}
                                {selectedFileName.toLowerCase().includes('report') && (
                                  <div style={styles.searchContainer}>
                                    <Search size={14} />
                                    <input
                                      type="text"
                                      placeholder="Search in report..."
                                      style={styles.searchInput}
                                      value={searchTerm[`${job.job_id}-${selectedFileName}`] || ''}
                                      onChange={(e) => handleSearch(job.job_id, selectedFileName, e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                )}
                                <button
                                  style={styles.iconButton}
                                  onClick={() => handleCopy(results[selectedFileName], `${job.job_id}-${selectedFileName}`)}
                                  className="icon-button"
                                  title="Copy to clipboard"
                                >
                                  {copySuccess[`${job.job_id}-${selectedFileName}`] ? (
                                    <CheckCircle size={16} />
                                  ) : (
                                    <Copy size={16} />
                                  )}
                                </button>
                                <button
                                  style={styles.iconButton}
                                  onClick={() => handleFileSelect(job.job_id, null)}
                                  className="icon-button"
                                  title="Close preview"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>

                            {/* File Content */}
                            <div style={styles.fileContent}>
                              {selectedFileName.toLowerCase().includes("vulnerability") ? (
                                <div style={styles.vulnerabilityList}>
                                  {parseVulnerabilities(results[selectedFileName]).map((vuln) => {
                                    const severityStyle = getSeverityColor(vuln.severity);
                                    return (
                                      <div
                                        key={vuln.index}
                                        style={{
                                          ...styles.vulnerabilityCard,
                                          borderLeft: `4px solid ${severityStyle.border}`
                                        }}
                                        className="vulnerability-card-animate"
                                      >
                                        <div style={styles.vulnerabilityHeader}>
                                          <div style={styles.vulnerabilityNumber}>
                                            <Bug size={20} />
                                            Vulnerability #{vuln.index}
                                          </div>
                                          <div
                                            style={{
                                              ...styles.severityBadge,
                                              background: severityStyle.gradient
                                            }}
                                          >
                                            {vuln.severity}
                                          </div>
                                        </div>
                                        <div style={styles.vulnerabilityTitle}>
                                          {vuln.title}
                                        </div>
                                        <div style={styles.vulnerabilityDescription}>
                                          <pre style={styles.codeBlock}>{vuln.description}</pre>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : selectedFileName.toLowerCase().includes('report') ? (
                                /* Interactive Report Display */
                                <div style={styles.reportContainer}>
                                  {parseReportSections(results[selectedFileName]).map((section, sectionIndex) => {
                                    const sectionKey = `${job.job_id}-${sectionIndex}`;
                                    const isExpanded = expandedSections[sectionKey] !== false; // Default to expanded
                                    const sectionColor = getSectionColor(section.type);
                                    const searchKey = `${job.job_id}-${selectedFileName}`;
                                    const currentSearch = searchTerm[searchKey];
                                    
                                    return (
                                      <div
                                        key={sectionIndex}
                                        style={{
                                          ...styles.reportSection,
                                          borderLeft: `4px solid ${sectionColor.border}`
                                        }}
                                        className="report-section-animate"
                                      >
                                        <div
                                          style={styles.reportSectionHeader}
                                          onClick={() => toggleSection(job.job_id, sectionIndex)}
                                        >
                                          <div style={styles.reportSectionTitle}>
                                            <div style={{
                                              ...styles.sectionIconContainer,
                                              background: sectionColor.gradient
                                            }}>
                                              {getSectionIcon(section.type)}
                                            </div>
                                            <span>{section.title}</span>
                                          </div>
                                          <ChevronDown 
                                            size={18} 
                                            style={{
                                              transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                                              transition: 'transform 0.3s ease'
                                            }}
                                          />
                                        </div>
                                        {isExpanded && (
                                          <div 
                                            style={styles.reportSectionContent}
                                            className="section-content-animate"
                                          >
                                            <pre 
                                              style={styles.reportText}
                                              dangerouslySetInnerHTML={{
                                                __html: currentSearch 
                                                  ? highlightSearchTerm(section.content, currentSearch)
                                                  : section.content
                                              }}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                /* Default text display for other files */
                                <div style={styles.textContent}>
                                  <pre style={styles.preformatted}>{results[selectedFileName]}</pre>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {job.status === 'COMPLETED' && jobData?.error && (
                      <div style={styles.resultsError}>
                        <AlertTriangle size={24} />
                        <div>
                          <div style={styles.resultsErrorTitle}>Failed to Load Results</div>
                          <div style={styles.resultsErrorMessage}>{jobData.error}</div>
                        </div>
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
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        @keyframes loadingBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        .job-card-animate {
          animation: slideIn 0.5s ease-out forwards;
          opacity: 0;
        }
        
        .expanded-animate {
          animation: fadeIn 0.3s ease-out;
        }
        
        .file-viewer-animate {
          animation: slideIn 0.4s ease-out;
        }
        
        .vulnerability-card-animate {
          animation: slideIn 0.3s ease-out;
        }
        
        .report-section-animate {
          animation: slideIn 0.3s ease-out;
        }
        
        .section-content-animate {
          animation: fadeIn 0.2s ease-out;
        }
        
        .status-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
        
        .stat-icon-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
        
        .loading-bar-animation {
          animation: loadingBar 1.5s ease-in-out infinite;
        }
        
        .refresh-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(79, 172, 254, 0.3);
        }
        
        .action-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(79, 172, 254, 0.3);
        }
        
        .file-tab:hover {
          transform: translateY(-2px);
          background: rgba(79, 172, 254, 0.15);
        }
        
        .icon-button:hover {
          background: rgba(79, 172, 254, 0.2);
          transform: scale(1.1);
        }
        
        button:active:not(:disabled) {
          transform: scale(0.98);
        }
        
        /* Scrollbar Styling */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(17, 24, 39, 0.5);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    padding: '32px',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%)',
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
    color: '#e5e7eb'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    padding: '24px',
    background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(0, 242, 254, 0.05) 100%)',
    borderRadius: '20px',
    border: '1px solid rgba(79, 172, 254, 0.2)',
    backdropFilter: 'blur(10px)'
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  headerIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#0a0e1a',
    boxShadow: '0 8px 24px rgba(79, 172, 254, 0.4)'
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    margin: 0,
    background: 'linear-gradient(135deg, #ffffff 0%, #4facfe 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.5px'
  },
  subtitle: {
    fontSize: '14px',
    color: '#9ca3af',
    margin: '4px 0 0 0',
    fontWeight: '400'
  },
  refreshButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    color: '#0a0e1a',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(79, 172, 254, 0.3)'
  },
  statsBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '32px'
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(17, 24, 39, 0.8) 100%)',
    borderRadius: '16px',
    border: '1px solid rgba(79, 172, 254, 0.1)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease'
  },
  statIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#0a0e1a'
  },
  statContent: {
    flex: 1
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: "'JetBrains Mono', monospace"
  },
  statLabel: {
    fontSize: '13px',
    color: '#9ca3af',
    marginTop: '4px',
    fontWeight: '500'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 24px',
    textAlign: 'center'
  },
  loadingSpinner: {
    marginBottom: '24px',
    color: '#4facfe'
  },
  loadingText: {
    fontSize: '18px',
    color: '#d1d5db',
    marginBottom: '24px',
    fontWeight: '500'
  },
  loadingBar: {
    width: '300px',
    height: '4px',
    background: 'rgba(79, 172, 254, 0.1)',
    borderRadius: '2px',
    overflow: 'hidden',
    position: 'relative'
  },
  loadingBarFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '25%',
    background: 'linear-gradient(90deg, transparent, #4facfe, transparent)',
    borderRadius: '2px'
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    padding: '32px',
    background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(153, 27, 27, 0.1) 100%)',
    border: '1px solid rgba(220, 38, 38, 0.3)',
    borderRadius: '16px'
  },
  errorIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    flexShrink: 0
  },
  errorContent: {
    flex: 1
  },
  errorTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#fca5a5',
    margin: '0 0 8px 0'
  },
  errorMessage: {
    fontSize: '14px',
    color: '#9ca3af',
    margin: '0 0 16px 0'
  },
  retryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease'
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 24px',
    background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.5) 0%, rgba(17, 24, 39, 0.5) 100%)',
    borderRadius: '20px',
    border: '1px solid rgba(79, 172, 254, 0.1)'
  },
  emptyIcon: {
    display: 'inline-flex',
    padding: '24px',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 242, 254, 0.1) 100%)',
    color: '#4facfe',
    marginBottom: '24px'
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 12px 0'
  },
  emptyText: {
    fontSize: '15px',
    color: '#9ca3af',
    margin: '0 0 32px 0',
    maxWidth: '500px',
    marginLeft: 'auto',
    marginRight: 'auto',
    lineHeight: '1.6'
  },
  emptyFeatures: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    flexWrap: 'wrap'
  },
  emptyFeature: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: 'rgba(79, 172, 254, 0.1)',
    borderRadius: '12px',
    color: '#4facfe',
    fontSize: '14px',
    fontWeight: '500'
  },
  jobList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  jobCard: {
    background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(17, 24, 39, 0.8) 100%)',
    borderRadius: '20px',
    border: '1px solid rgba(79, 172, 254, 0.15)',
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(10px)'
  },
  jobHeader: {
    padding: '24px',
    cursor: 'pointer',
    transition: 'background 0.2s ease'
  },
  jobInfo: {
    flex: 1
  },
  jobTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px'
  },
  expandButton: {
    background: 'none',
    border: 'none',
    color: '#4facfe',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
  repoName: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#ffffff',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
  },
  jobMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginLeft: '44px'
  },
  metaItem: {
    fontSize: '13px',
    color: '#9ca3af',
    display: 'flex',
    gap: '8px'
  },
  metaLabel: {
    fontWeight: '500',
    color: '#6b7280'
  },
  metaValue: {
    color: '#d1d5db',
    wordBreak: 'break-all'
  },
  metaRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap'
  },
  metaChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: 'rgba(79, 172, 254, 0.1)',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#4facfe',
    fontWeight: '500'
  },
  jobActions: {
    marginTop: '16px',
    marginLeft: '44px'
  },
  downloadButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    color: '#0a0e1a',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(79, 172, 254, 0.3)'
  },
  downloadButtonDisabled: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: 'rgba(107, 114, 128, 0.2)',
    color: '#6b7280',
    border: '1px solid rgba(107, 114, 128, 0.3)',
    borderRadius: '10px',
    cursor: 'not-allowed',
    fontSize: '14px',
    fontWeight: '600',
    opacity: 0.6
  },
  jobError: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    margin: '0 24px 24px 24px',
    padding: '16px',
    background: 'rgba(220, 38, 38, 0.1)',
    border: '1px solid rgba(220, 38, 38, 0.3)',
    borderRadius: '12px',
    color: '#fca5a5'
  },
  errorLabel: {
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '4px'
  },
  errorDetail: {
    fontSize: '13px',
    color: '#9ca3af'
  },
  expandedContent: {
    borderTop: '1px solid rgba(79, 172, 254, 0.1)',
    padding: '24px'
  },
  pendingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '48px 24px',
    textAlign: 'center',
    color: '#9ca3af'
  },
  pendingText: {
    marginTop: '16px',
    fontSize: '15px'
  },
  loadingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    color: '#9ca3af'
  },
  loadingBoxText: {
    marginTop: '16px',
    fontSize: '15px'
  },
  resultsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  resultsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  resultsTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#ffffff',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  fileCount: {
    padding: '6px 12px',
    background: 'rgba(79, 172, 254, 0.1)',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#4facfe',
    fontWeight: '600'
  },
  fileTabs: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    padding: '12px',
    background: 'rgba(17, 24, 39, 0.5)',
    borderRadius: '12px'
  },
  fileTab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: 'rgba(31, 41, 55, 0.8)',
    border: '1px solid rgba(79, 172, 254, 0.1)',
    borderRadius: '10px',
    color: '#d1d5db',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden'
  },
  fileTabActive: {
    background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.2) 0%, rgba(0, 242, 254, 0.2) 100%)',
    border: '1px solid rgba(79, 172, 254, 0.4)',
    color: '#4facfe'
  },
  fileTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
    borderRadius: '3px 3px 0 0'
  },
  fileViewer: {
    background: 'rgba(17, 24, 39, 0.8)',
    borderRadius: '16px',
    border: '1px solid rgba(79, 172, 254, 0.15)',
    overflow: 'hidden'
  },
  fileViewerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    background: 'rgba(31, 41, 55, 0.6)',
    borderBottom: '1px solid rgba(79, 172, 254, 0.1)',
    gap: '12px',
    flexWrap: 'wrap'
  },
  fileViewerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#4facfe'
  },
  fileViewerActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: 'rgba(17, 24, 39, 0.8)',
    borderRadius: '8px',
    border: '1px solid rgba(79, 172, 254, 0.2)'
  },
  searchInput: {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#d1d5db',
    fontSize: '13px',
    width: '200px',
    fontFamily: "'Space Grotesk', system-ui, sans-serif"
  },
  iconButton: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(79, 172, 254, 0.1)',
    border: 'none',
    borderRadius: '8px',
    color: '#4facfe',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flexShrink: 0
  },
  fileContent: {
    padding: '24px',
    maxHeight: '600px',
    overflow: 'auto'
  },
  vulnerabilityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  vulnerabilityCard: {
    background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(31, 41, 55, 0.9) 100%)',
    borderRadius: '12px',
    padding: '20px',
    transition: 'all 0.3s ease'
  },
  vulnerabilityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  vulnerabilityNumber: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#ef4444'
  },
  severityBadge: {
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: '0.5px'
  },
  vulnerabilityTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '12px',
    lineHeight: '1.5'
  },
  vulnerabilityDescription: {
    fontSize: '13px',
    color: '#d1d5db',
    lineHeight: '1.6'
  },
  codeBlock: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '13px',
    color: '#d1d5db',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: 0,
    padding: '16px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    border: '1px solid rgba(79, 172, 254, 0.1)'
  },
  reportContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  reportSection: {
    background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(31, 41, 55, 0.9) 100%)',
    borderRadius: '12px',
    overflow: 'hidden',
    transition: 'all 0.3s ease'
  },
  reportSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
    background: 'rgba(31, 41, 55, 0.5)'
  },
  reportSectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#ffffff'
  },
  sectionIconContainer: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    flexShrink: 0
  },
  reportSectionContent: {
    padding: '20px',
    borderTop: '1px solid rgba(79, 172, 254, 0.1)'
  },
  reportText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '13px',
    color: '#d1d5db',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: 0,
    lineHeight: '1.8',
    padding: '12px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px'
  },
  textContent: {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid rgba(79, 172, 254, 0.1)'
  },
  preformatted: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '13px',
    color: '#d1d5db',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: 0,
    lineHeight: '1.6'
  },
  resultsError: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '24px',
    background: 'rgba(220, 38, 38, 0.1)',
    border: '1px solid rgba(220, 38, 38, 0.3)',
    borderRadius: '12px'
  },
  resultsErrorTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fca5a5',
    marginBottom: '4px'
  },
  resultsErrorMessage: {
    fontSize: '14px',
    color: '#9ca3af'
  }
};

export default AnalysisReports;