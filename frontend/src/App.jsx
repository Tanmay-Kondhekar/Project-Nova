import React, { useState } from 'react';
import CodeStructureMap from './CodeStructureMap';
import CFGTab from './CFGTab';
import { Upload, Github, Play, Loader2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, FileCode, Package, FolderTree, Settings, Code2, GitBranch, Braces, Sparkles } from 'lucide-react';
import ASSETS from './config/assets';

export default function TestingPlatformUI() {
  const [uploadType, setUploadType] = useState('zip');
  const [file, setFile] = useState(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    projectInfo: true,
    dependencies: true,
    tests: true,
    warnings: true,
    structure: false
  });
  const [selectedFile, setSelectedFile] = useState(null);

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
    setActiveTab('overview');
    
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
      background: `linear-gradient(135deg, ${ASSETS.colors.background} 0%, #1e1b4b 100%)`,
      color: ASSETS.colors.text,
      padding: '40px 24px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      position: 'relative',
      overflow: 'hidden'
    },
    maxWidth: {
      maxWidth: '1400px',
      margin: '0 auto'
    },
    header: {
      marginBottom: '32px'
    },
    title: {
      fontSize: '48px',
      fontWeight: '800',
      background: 'linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      marginBottom: '12px',
      letterSpacing: '-0.02em'
    },
    subtitle: {
      color: '#9ca3af'
    },
    card: {
      background: ASSETS.colors.cardBackground,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: '16px',
      padding: '28px',
      marginBottom: '24px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
    },
    cardTitle: {
      fontSize: '22px',
      fontWeight: '700',
      marginBottom: '20px',
      color: '#ffffff',
      background: 'linear-gradient(135deg, #ffffff 0%, #a78bfa 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
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
      padding: '10px 20px',
      borderRadius: '10px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
    },
    buttonActive: {
      background: ASSETS.colors.gradient,
      color: '#ffffff'
    },
    buttonInactive: {
      backgroundColor: 'rgba(55, 65, 81, 0.6)',
      color: '#d1d5db'
    },
    input: {
      width: '100%',
      padding: '12px 18px',
      backgroundColor: 'rgba(30, 41, 59, 0.5)',
      border: '1px solid rgba(167, 139, 250, 0.3)',
      borderRadius: '10px',
      color: '#ffffff',
      fontSize: '15px',
      boxSizing: 'border-box',
      transition: 'all 0.3s ease',
      outline: 'none'
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
      background: ASSETS.colors.gradient,
      color: '#ffffff',
      fontWeight: '600',
      padding: '14px 24px',
      borderRadius: '12px',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      fontSize: '16px',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)'
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
    tabContainer: {
      display: 'flex',
      gap: '12px',
      marginBottom: '28px',
      borderBottom: '2px solid rgba(167, 139, 250, 0.2)',
      overflowX: 'auto'
    },
    tab: {
      padding: '14px 28px',
      backgroundColor: 'transparent',
      border: 'none',
      borderBottom: '3px solid transparent',
      cursor: 'pointer',
      color: '#9ca3af',
      fontSize: '15px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      whiteSpace: 'nowrap',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    tabActive: {
      color: ASSETS.colors.primary,
      borderBottomColor: ASSETS.colors.primary
    },
    sectionCard: {
      background: 'rgba(30, 41, 59, 0.4)',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      border: '1px solid rgba(167, 139, 250, 0.2)',
      overflow: 'hidden',
      marginBottom: '18px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
    },
    sectionHeader: {
      width: '100%',
      padding: '18px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
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
      color: '#d1d5db',
      maxHeight: '400px',
      overflowY: 'auto'
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
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    },
    statCard: {
      backgroundColor: '#1f2937',
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid #374151'
    },
    statLabel: {
      color: '#9ca3af',
      fontSize: '14px',
      marginBottom: '8px'
    },
    statValue: {
      color: '#ffffff',
      fontSize: '28px',
      fontWeight: '700'
    },
    fileList: {
      maxHeight: '600px',
      overflowY: 'auto'
    },
    fileItem: {
      padding: '12px',
      backgroundColor: '#1f2937',
      borderRadius: '4px',
      marginBottom: '8px',
      cursor: 'pointer',
      border: '1px solid #374151',
      transition: 'all 0.2s'
    },
    fileItemHover: {
      backgroundColor: '#374151',
      borderColor: '#60a5fa'
    },
    fileItemActive: {
      backgroundColor: '#374151',
      borderColor: '#60a5fa'
    },
    splitView: {
      display: 'grid',
      gridTemplateColumns: '300px 1fr',
      gap: '16px'
    },
    graphContainer: {
      backgroundColor: '#1f2937',
      padding: '24px',
      borderRadius: '8px',
      border: '1px solid #374151',
      minHeight: '400px'
    },
    node: {
      padding: '8px 12px',
      backgroundColor: '#374151',
      borderRadius: '4px',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px'
    },
    nodeFile: {
      borderLeft: '3px solid #3b82f6'
    },
    nodeClass: {
      borderLeft: '3px solid #8b5cf6',
      marginLeft: '20px'
    },
    nodeFunction: {
      borderLeft: '3px solid #10b981',
      marginLeft: '40px'
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

  const renderOverviewTab = () => (
    <div>
      <SectionCard title="Project Information" icon={FileCode} sectionKey="projectInfo">
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

      <SectionCard title="Dependencies" icon={Package} sectionKey="dependencies" count={results.dependencies.length}>
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

      <SectionCard title="Test Files Detected" icon={CheckCircle} sectionKey="tests" count={results.test_files_found.length}>
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
        <SectionCard title="Security Warnings" icon={AlertTriangle} sectionKey="warnings" count={results.security_warnings.length}>
          {results.security_warnings.map((warning, idx) => (
            <div key={idx} style={styles.warning}>
              <AlertTriangle size={16} />
              {warning}
            </div>
          ))}
        </SectionCard>
      )}

      <SectionCard title="Project Structure" icon={FolderTree} sectionKey="structure">
        <pre style={styles.pre}>{results.project_structure_tree}</pre>
      </SectionCard>
    </div>
  );

  const renderCodeAnalysisTab = () => {
    if (!results.ast_analysis) {
      return <p style={{ color: '#9ca3af' }}>No code analysis available</p>;
    }

    const ast = results.ast_analysis;

    return (
      <div>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Files Analyzed</div>
            <div style={styles.statValue}>{ast.total_files_analyzed}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Tokens</div>
            <div style={styles.statValue}>{ast.aggregate_stats.total_tokens.toLocaleString()}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Lines</div>
            <div style={styles.statValue}>{ast.aggregate_stats.total_lines.toLocaleString()}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Functions</div>
            <div style={styles.statValue}>{ast.aggregate_stats.total_functions}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Classes</div>
            <div style={styles.statValue}>{ast.aggregate_stats.total_classes}</div>
          </div>
        </div>

        <div style={styles.splitView}>
          <div>
            <h3 style={{ ...styles.cardTitle, marginBottom: '16px' }}>Files</h3>
            <div style={styles.fileList}>
              {ast.files.map((file, idx) => (
                <div
                  key={idx}
                  style={{
                    ...styles.fileItem,
                    ...(selectedFile === idx ? styles.fileItemActive : {})
                  }}
                  onClick={() => setSelectedFile(idx)}
                  onMouseEnter={(e) => {
                    if (selectedFile !== idx) {
                      e.currentTarget.style.backgroundColor = '#374151';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedFile !== idx) {
                      e.currentTarget.style.backgroundColor = '#1f2937';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <FileCode size={16} color="#60a5fa" />
                    <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#ffffff' }}>
                      {file.relative_path}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '24px' }}>
                    {file.language} • {file.line_count} lines • {file.token_count} tokens
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            {selectedFile !== null && ast.files[selectedFile] && (
              <div>
                <h3 style={styles.cardTitle}>{ast.files[selectedFile].relative_path}</h3>
                
                <div style={{ marginBottom: '16px' }}>
                  <div style={styles.statsGrid}>
                    <div style={styles.statCard}>
                      <div style={styles.statLabel}>Lines</div>
                      <div style={{ ...styles.statValue, fontSize: '20px' }}>{ast.files[selectedFile].line_count}</div>
                    </div>
                    <div style={styles.statCard}>
                      <div style={styles.statLabel}>Tokens</div>
                      <div style={{ ...styles.statValue, fontSize: '20px' }}>{ast.files[selectedFile].token_count}</div>
                    </div>
                    <div style={styles.statCard}>
                      <div style={styles.statLabel}>Complexity</div>
                      <div style={{ ...styles.statValue, fontSize: '20px' }}>{ast.files[selectedFile].complexity || 0}</div>
                    </div>
                  </div>
                </div>

                {ast.files[selectedFile].imports && ast.files[selectedFile].imports.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ ...styles.cardTitle, fontSize: '16px' }}>Imports</h4>
                    <div style={styles.depList}>
                      {ast.files[selectedFile].imports.map((imp, idx) => (
                        <div key={idx} style={styles.depItem}>
                          {imp.type === 'from_import' ? `from ${imp.module}` : imp.module}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ast.files[selectedFile].classes && ast.files[selectedFile].classes.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ ...styles.cardTitle, fontSize: '16px' }}>Classes</h4>
                    {ast.files[selectedFile].classes.map((cls, idx) => (
                      <div key={idx} style={{ ...styles.depItem, marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <Braces size={16} color="#8b5cf6" />
                          <span style={{ fontWeight: '600' }}>{cls.name}</span>
                          <span style={{ fontSize: '12px', color: '#9ca3af' }}>Line {cls.line}</span>
                        </div>
                        {cls.methods && cls.methods.length > 0 && (
                          <div style={{ marginLeft: '24px', fontSize: '13px', color: '#9ca3af' }}>
                            Methods: {cls.methods.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {ast.files[selectedFile].functions && ast.files[selectedFile].functions.length > 0 && (
                  <div>
                    <h4 style={{ ...styles.cardTitle, fontSize: '16px' }}>Functions</h4>
                    {ast.files[selectedFile].functions.map((func, idx) => (
                      <div key={idx} style={{ ...styles.depItem, marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Code2 size={16} color="#10b981" />
                          <span style={{ fontWeight: '600' }}>{func.name}</span>
                          <span style={{ fontSize: '12px', color: '#9ca3af' }}>Line {func.line}</span>
                        </div>
                        {func.args && func.args.length > 0 && (
                          <div style={{ marginLeft: '24px', fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>
                            Args: ({func.args.join(', ')})
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {ast.files[selectedFile].tokens && ast.files[selectedFile].tokens.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <h4 style={{ ...styles.cardTitle, fontSize: '16px' }}>Tokens (first 50)</h4>
                    <pre style={styles.pre}>
                      {ast.files[selectedFile].tokens.slice(0, 50).map((token, idx) => (
                        `${token.type.padEnd(15)} ${token.string}\n`
                      )).join('')}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSemanticGraphTab = () => {
    if (!results.ast_analysis || !results.ast_analysis.semantic_graph) {
      return <p style={{ color: '#9ca3af' }}>No semantic graph available</p>;
    }

    const graph = results.ast_analysis.semantic_graph;

    return (
      <div>
        <h3 style={styles.cardTitle}>Semantic Graph</h3>
        <p style={{ color: '#9ca3af', marginBottom: '16px' }}>
          Visualization of project structure: files, classes, and functions
        </p>

        <div style={styles.graphContainer}>
          {graph.nodes.filter(n => n.type === 'file').map((fileNode) => (
            <div key={fileNode.id}>
              <div style={{ ...styles.node, ...styles.nodeFile }}>
                <FileCode size={16} color="#3b82f6" />
                <span>{fileNode.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#9ca3af' }}>
                  {fileNode.language}
                </span>
              </div>

              {graph.nodes.filter(n => 
                graph.edges.some(e => e.from === fileNode.id && e.to === n.id && n.type === 'class')
              ).map((classNode) => (
                <div key={classNode.id} style={{ ...styles.node, ...styles.nodeClass }}>
                  <Braces size={14} color="#8b5cf6" />
                  <span>{classNode.label}</span>
                </div>
              ))}

              {graph.nodes.filter(n => 
                graph.edges.some(e => e.from === fileNode.id && e.to === n.id && n.type === 'function')
              ).map((funcNode) => (
                <div key={funcNode.id} style={{ ...styles.node, ...styles.nodeFunction }}>
                  <Code2 size={14} color="#10b981" />
                  <span>{funcNode.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ marginTop: '24px', ...styles.statsGrid }}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Nodes</div>
            <div style={styles.statValue}>{graph.nodes.length}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Edges</div>
            <div style={styles.statValue}>{graph.edges.length}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Files</div>
            <div style={styles.statValue}>{graph.nodes.filter(n => n.type === 'file').length}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Classes</div>
            <div style={styles.statValue}>{graph.nodes.filter(n => n.type === 'class').length}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Functions</div>
            <div style={styles.statValue}>{graph.nodes.filter(n => n.type === 'function').length}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Floating Background Decoration */}
      {ASSETS.backgroundDecoration.type === 'gif' || ASSETS.backgroundDecoration.type === 'image' ? (
        <img 
          src={ASSETS.backgroundDecoration.url} 
          alt="background decoration" 
          style={ASSETS.backgroundDecoration.styles}
        />
      ) : (
        <div 
          style={ASSETS.backgroundDecoration.styles}
          dangerouslySetInnerHTML={{ __html: ASSETS.backgroundDecoration.svg }}
        />
      )}
      
      <div style={styles.maxWidth}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '12px' }}>
            <Sparkles size={ASSETS.branding.icon.size} color={ASSETS.branding.icon.color} />
            <h1 style={styles.title}>{ASSETS.branding.appName}</h1>
          </div>
          <p style={styles.subtitle}>{ASSETS.branding.tagline}</p>
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
            <div style={styles.tabContainer}>
              <button
                style={{
                  ...styles.tab,
                  ...(activeTab === 'overview' ? styles.tabActive : {})
                }}
                onClick={() => setActiveTab('overview')}
              >
                <FolderTree size={16} />
                Overview
              </button>
              <button
                style={{
                  ...styles.tab,
                  ...(activeTab === 'code-analysis' ? styles.tabActive : {})
                }}
                onClick={() => setActiveTab('code-analysis')}
              >
                <Code2 size={16} />
                Code Analysis
              </button>
              <button
                style={{
                  ...styles.tab,
                  ...(activeTab === 'semantic-graph' ? styles.tabActive : {})
                }}
                onClick={() => setActiveTab('semantic-graph')}
              >
                <GitBranch size={16} />
                Semantic Graph
              </button>
              <button
                style={{
                  ...styles.tab,
                  ...(activeTab === 'code-structure' ? styles.tabActive : {})
                }}
                onClick={() => setActiveTab('code-structure')}
              >
                <Braces size={16} />
                Code Structure Map
              </button>
              <button
                style={{
                  ...styles.tab,
                  ...(activeTab === 'cfg' ? styles.tabActive : {})
                }}
                onClick={() => setActiveTab('cfg')}
              >
                <GitBranch size={16} />
                Control Flow Graph
              </button>
            </div>

              {activeTab === 'overview' && renderOverviewTab()}
              {activeTab === 'code-analysis' && renderCodeAnalysisTab()}
              {activeTab === 'semantic-graph' && renderSemanticGraphTab()}
              {activeTab === 'code-structure' && (
                results.ast_analysis && results.ast_analysis.semantic_graph ? (
                  <CodeStructureMap graph={results.ast_analysis.semantic_graph} />
                ) : (
                  <p style={{ color: '#9ca3af' }}>No semantic graph available for structure map</p>
                )
              )}
              {activeTab === 'cfg' && (
                <CFGTab projectCFG={results.control_flow_graph} />
              )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-30px) rotate(5deg);
          }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        input:focus {
          outline: none;
          border-color: ${ASSETS.colors.primary} !important;
          box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.2);
        }
        
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(102, 126, 234, 0.3);
        }
        
        button:active:not(:disabled) {
          transform: translateY(0px);
        }
        
        button:focus {
          outline: 2px solid ${ASSETS.colors.primary};
          outline-offset: 2px;
        }
        
        * {
          box-sizing: border-box;
        }
        
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 5px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, ${ASSETS.colors.primary} 0%, ${ASSETS.colors.secondary} 100%);
          border-radius: 5px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, ${ASSETS.colors.secondary} 0%, ${ASSETS.colors.primary} 100%);
        }
      `}</style>
    </div>
  );
}