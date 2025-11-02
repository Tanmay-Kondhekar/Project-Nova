import React, { useState } from 'react';
import { Upload, Github, Play, Loader2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, FileCode, Package, FolderTree, Settings } from 'lucide-react';

export default function TestingPlatformUI() {
  const [uploadType, setUploadType] = useState('zip');
  const [file, setFile] = useState(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    projectInfo: true,
    dependencies: true,
    tests: true,
    warnings: true,
    structure: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.zip')) {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a .zip file');
      setFile(null);
    }
  };

  const handlePreprocess = async () => {
    setError(null);
    setResults(null);
    
    if (uploadType === 'zip' && !file) {
      setError('Please select a .zip file');
      return;
    }
    
    if (uploadType === 'github' && !repoUrl) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      
      if (uploadType === 'zip') {
        formData.append('file', file);
      } else {
        formData.append('github_url', repoUrl);
      }

      const response = await fetch('http://localhost:8000/preprocess', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Preprocessing failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message || 'An error occurred during preprocessing');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#111827',
      color: '#f3f4f6',
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    maxWidth: {
      maxWidth: '1280px',
      margin: '0 auto'
    },
    header: {
      marginBottom: '32px'
    },
    title: {
      fontSize: '36px',
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: '8px'
    },
    subtitle: {
      color: '#9ca3af'
    },
    card: {
      backgroundColor: '#1f2937',
      borderRadius: '8px',
      padding: '24px',
      marginBottom: '24px',
      border: '1px solid #374151'
    },
    cardTitle: {
      fontSize: '20px',
      fontWeight: '600',
      marginBottom: '16px',
      color: '#ffffff'
    },
    buttonGroup: {
      display: 'flex',
      gap: '16px',
      marginBottom: '24px'
    },
    button: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s'
    },
    buttonActive: {
      backgroundColor: '#2563eb',
      color: '#ffffff'
    },
    buttonInactive: {
      backgroundColor: '#374151',
      color: '#d1d5db'
    },
    input: {
      width: '100%',
      padding: '10px 16px',
      backgroundColor: '#374151',
      border: '1px solid #4b5563',
      borderRadius: '8px',
      color: '#ffffff',
      fontSize: '14px',
      boxSizing: 'border-box'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontSize: '14px',
      color: '#d1d5db'
    },
    fileInput: {
      width: '100%',
      padding: '10px',
      backgroundColor: '#374151',
      border: '1px solid #4b5563',
      borderRadius: '8px',
      color: '#ffffff',
      cursor: 'pointer',
      fontSize: '14px'
    },
    primaryButton: {
      width: '100%',
      backgroundColor: '#2563eb',
      color: '#ffffff',
      fontWeight: '600',
      padding: '12px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontSize: '16px',
      transition: 'background-color 0.2s'
    },
    primaryButtonDisabled: {
      backgroundColor: '#4b5563',
      cursor: 'not-allowed'
    },
    errorBox: {
      marginBottom: '16px',
      padding: '12px',
      backgroundColor: 'rgba(127, 29, 29, 0.3)',
      border: '1px solid #991b1b',
      borderRadius: '8px',
      color: '#fca5a5',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    successBox: {
      marginTop: '8px',
      fontSize: '14px',
      color: '#4ade80',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    sectionCard: {
      backgroundColor: '#1f2937',
      borderRadius: '8px',
      border: '1px solid #374151',
      overflow: 'hidden',
      marginBottom: '16px'
    },
    sectionHeader: {
      width: '100%',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    sectionHeaderHover: {
      backgroundColor: '#374151'
    },
    sectionTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    sectionTitleText: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#ffffff'
    },
    badge: {
      padding: '4px 8px',
      backgroundColor: '#2563eb',
      color: '#ffffff',
      fontSize: '12px',
      borderRadius: '9999px'
    },
    sectionContent: {
      padding: '16px 24px',
      borderTop: '1px solid #374151'
    },
    tag: {
      display: 'inline-block',
      padding: '6px 12px',
      backgroundColor: '#7c3aed',
      color: '#ffffff',
      fontSize: '14px',
      borderRadius: '9999px',
      margin: '4px'
    },
    depList: {
      maxHeight: '320px',
      overflowY: 'auto'
    },
    depItem: {
      padding: '10px 12px',
      backgroundColor: '#374151',
      borderRadius: '4px',
      fontSize: '14px',
      fontFamily: 'monospace',
      marginBottom: '8px'
    },
    warning: {
      padding: '10px 12px',
      backgroundColor: 'rgba(133, 77, 14, 0.2)',
      border: '1px solid #92400e',
      borderRadius: '4px',
      fontSize: '14px',
      color: '#fbbf24',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '8px'
    },
    pre: {
      backgroundColor: '#030712',
      padding: '16px',
      borderRadius: '4px',
      fontSize: '12px',
      overflowX: 'auto',
      fontFamily: 'monospace',
      color: '#d1d5db'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px',
      marginTop: '16px'
    },
    infoItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px'
    }
  };

  const SectionCard = ({ title, icon: Icon, children, sectionKey, count }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
      <div style={styles.sectionCard}>
        <button
          onClick={() => toggleSection(sectionKey)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            ...styles.sectionHeader,
            ...(isHovered ? styles.sectionHeaderHover : {})
          }}
        >
          <div style={styles.sectionTitle}>
            <Icon size={20} color="#60a5fa" />
            <h3 style={styles.sectionTitleText}>{title}</h3>
            {count !== undefined && (
              <span style={styles.badge}>{count}</span>
            )}
          </div>
          {expandedSections[sectionKey] ? (
            <ChevronUp size={20} color="#9ca3af" />
          ) : (
            <ChevronDown size={20} color="#9ca3af" />
          )}
        </button>
        {expandedSections[sectionKey] && (
          <div style={styles.sectionContent}>
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.maxWidth}>
        <div style={styles.header}>
          <h1 style={styles.title}>AI Testing & Security Platform</h1>
          <p style={styles.subtitle}>Stage 1: Project Preprocessing & Analysis</p>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Upload Project</h2>
          
          <div style={styles.buttonGroup}>
            <button
              onClick={() => setUploadType('zip')}
              style={{
                ...styles.button,
                ...(uploadType === 'zip' ? styles.buttonActive : styles.buttonInactive)
              }}
            >
              <Upload size={16} />
              Upload .zip
            </button>
            <button
              onClick={() => setUploadType('github')}
              style={{
                ...styles.button,
                ...(uploadType === 'github' ? styles.buttonActive : styles.buttonInactive)
              }}
            >
              <Github size={16} />
              GitHub URL
            </button>
          </div>

          {uploadType === 'zip' ? (
            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>
                Select .zip file containing your project
              </label>
              <input
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                style={styles.fileInput}
              />
              {file && (
                <div style={styles.successBox}>
                  <CheckCircle size={16} />
                  {file.name} selected
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>
                Enter GitHub repository URL
              </label>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repository"
                style={styles.input}
              />
            </div>
          )}

          {error && (
            <div style={styles.errorBox}>
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <button
            onClick={handlePreprocess}
            disabled={loading}
            style={{
              ...styles.primaryButton,
              ...(loading ? styles.primaryButtonDisabled : {})
            }}
            onMouseOver={(e) => {
              if (!loading) e.target.style.backgroundColor = '#1d4ed8';
            }}
            onMouseOut={(e) => {
              if (!loading) e.target.style.backgroundColor = '#2563eb';
            }}
          >
            {loading ? (
              <>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                Processing...
              </>
            ) : (
              <>
                <Play size={20} />
                Run Preprocessing
              </>
            )}
          </button>
        </div>

        {results && (
          <div>
            <SectionCard
              title="Project Information"
              icon={FileCode}
              sectionKey="projectInfo"
            >
              <div>
                <span style={{ ...styles.label, marginBottom: '8px' }}>Languages:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                  {results.languages.map((lang, idx) => (
                    <span key={idx} style={styles.tag}>{lang}</span>
                  ))}
                </div>
              </div>
              {results.framework && (
                <div style={{ marginTop: '16px' }}>
                  <span style={styles.label}>Framework:</span>
                  <p style={{ color: '#ffffff', marginTop: '4px' }}>{results.framework}</p>
                </div>
              )}
              <div style={styles.grid}>
                <div style={styles.infoItem}>
                  <Settings size={16} color="#9ca3af" />
                  <span>
                    CI/CD: {results.ci_cd_configs ? (
                      <span style={{ color: '#4ade80' }}>Found</span>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>Not found</span>
                    )}
                  </span>
                </div>
                <div style={styles.infoItem}>
                  <FileCode size={16} color="#9ca3af" />
                  <span>
                    Dockerfile: {results.dockerfile_found ? (
                      <span style={{ color: '#4ade80' }}>Found</span>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>Not found</span>
                    )}
                  </span>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Dependencies"
              icon={Package}
              sectionKey="dependencies"
              count={results.dependencies.length}
            >
              {results.dependencies.length > 0 ? (
                <div style={styles.depList}>
                  {results.dependencies.map((dep, idx) => (
                    <div key={idx} style={styles.depItem}>{dep}</div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#9ca3af' }}>No dependencies detected</p>
              )}
            </SectionCard>

            <SectionCard
              title="Test Files Detected"
              icon={CheckCircle}
              sectionKey="tests"
              count={results.test_files_found.length}
            >
              {results.test_files_found.length > 0 ? (
                <div>
                  {results.test_files_found.map((test, idx) => (
                    <div key={idx} style={{...styles.depItem, display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <FileCode size={16} color="#4ade80" />
                      {test}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#9ca3af' }}>No test files detected</p>
              )}
            </SectionCard>

            {results.security_warnings.length > 0 && (
              <SectionCard
                title="Security Warnings"
                icon={AlertTriangle}
                sectionKey="warnings"
                count={results.security_warnings.length}
              >
                {results.security_warnings.map((warning, idx) => (
                  <div key={idx} style={styles.warning}>
                    <AlertTriangle size={16} />
                    {warning}
                  </div>
                ))}
              </SectionCard>
            )}

            <SectionCard
              title="Project Structure"
              icon={FolderTree}
              sectionKey="structure"
            >
              <pre style={styles.pre}>{results.project_structure_tree}</pre>
            </SectionCard>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input:focus {
          outline: none;
          border-color: #3b82f6;
        }
        button:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}