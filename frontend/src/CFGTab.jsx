import React, { useState } from 'react';
import { Network } from 'vis-network/standalone';

// Improved CFG Viewer Component (inline for convenience)
const ImprovedCFGViewer = ({ cfg, title = "Control Flow Graph", showLegend = true }) => {
  const containerRef = React.useRef(null);
  const networkRef = React.useRef(null);
  const [stats, setStats] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [filterMode, setFilterMode] = React.useState('all');
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    if (!cfg || !cfg.nodes || cfg.nodes.length === 0) {
      setError(cfg?.errors?.[0] || 'No graph data available');
      return;
    }

    try {
      let filteredNodes = cfg.nodes;
      
      if (filterMode === 'connected') {
        filteredNodes = cfg.nodes.filter(n => n.connected);
      } else if (filterMode === 'public') {
        filteredNodes = cfg.nodes.filter(n => !n.is_private);
      }
      
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredNodes = filteredNodes.filter(n => 
          n.label?.toLowerCase().includes(term) || 
          n.file?.toLowerCase().includes(term)
        );
      }

      const nodes = filteredNodes.map(node => {
        let color = { background: '#667eea', border: '#4c51bf' };
        
        if (node.external) {
          color = { background: '#6b7280', border: '#4b5563' };
        } else if (!node.connected) {
          color = { background: '#f59e0b', border: '#d97706' };
        } else if (node.is_method) {
          color = { background: '#8b5cf6', border: '#7c3aed' };
        } else if (node.is_async) {
          color = { background: '#14b8a6', border: '#0d9488' };
        } else if (node.is_private) {
          color = { background: '#eab308', border: '#ca8a04' };
        }

        let tooltip = node.title || node.label;
        if (!node.title) {
          tooltip = node.label;
          if (node.file) tooltip += `\nFile: ${node.file}`;
          if (node.line) tooltip += `\nLine: ${node.line}`;
          if (node.external) tooltip += '\n[External Reference]';
          if (node.is_private) tooltip += '\n[Private Function]';
          if (node.is_method) tooltip += '\n[Class Method]';
          if (node.is_async) tooltip += '\n[Async Function]';
          if (node.defined_in_files > 1) tooltip += `\n[Defined in ${node.defined_in_files} files]`;
        }

        let shape = 'box';
        if (node.external) shape = 'ellipse';
        else if (node.is_method) shape = 'diamond';

        return {
          id: node.id,
          label: node.label || node.id,
          title: tooltip,
          shape: shape,
          color: {
            background: color.background,
            border: color.border,
            highlight: { background: '#764ba2', border: '#5a3d8a' }
          },
          font: { color: '#ffffff', size: 13, face: 'Monaco, Consolas, monospace' },
          margin: 10,
          borderWidth: 2,
          shadow: true
        };
      });

      const nodeIds = new Set(nodes.map(n => n.id));
      const validEdges = (cfg.edges || []).filter(e => 
        nodeIds.has(e.from) && nodeIds.has(e.to)
      ).map((edge, idx) => ({
        id: `edge-${idx}`,
        from: edge.from,
        to: edge.to,
        arrows: { to: { enabled: true, scaleFactor: 1 } },
        color: { color: '#4b5563', highlight: '#764ba2', opacity: 0.7 },
        width: 1.5,
        smooth: { enabled: true, type: 'cubicBezier', roundness: 0.5 }
      }));

      const data = { nodes, edges: validEdges };
      
      const options = {
        layout: {
          hierarchical: {
            enabled: true,
            direction: 'UD',
            sortMethod: 'directed',
            nodeSpacing: 150,
            levelSeparation: 150,
            treeSpacing: 200,
            blockShifting: true,
            edgeMinimization: true
          }
        },
        physics: { enabled: false },
        interaction: { 
          hover: true,
          hoverConnectedEdges: true,
          tooltipDelay: 100,
          navigationButtons: true, 
          keyboard: true
        },
        nodes: {
          widthConstraint: { minimum: 100, maximum: 250 },
          heightConstraint: { minimum: 35 }
        }
      };

      if (networkRef.current) networkRef.current.destroy();
      
      if (containerRef.current && nodes.length > 0) {
        networkRef.current = new Network(containerRef.current, data, options);
        networkRef.current.once('stabilizationIterationsDone', () => {
          networkRef.current.fit({ animation: { duration: 800 } });
        });
        
        setStats({
          displayedNodes: nodes.length,
          displayedEdges: validEdges.length,
          totalNodes: cfg.nodes.length,
          totalEdges: cfg.edges.length,
          ...cfg.stats
        });
        
        setError(null);
      } else if (nodes.length === 0) {
        setError('No functions match the current filters');
      }
    } catch (err) {
      console.error('Error rendering graph:', err);
      setError(`Failed to render graph: ${err.message}`);
    }

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [cfg, filterMode, searchTerm]);

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
        backgroundColor: '#1f2937',
        borderRadius: 12,
        border: '2px solid #374151',
        color: '#f87171',
        padding: 24
      }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p style={{ marginTop: 16, fontSize: 16, textAlign: 'center' }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ color: '#ffffff', margin: 0, fontSize: 18, fontWeight: 600 }}>
          {title}
        </h4>
        
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'connected', 'public'].map(mode => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              style={{
                padding: '6px 12px',
                fontSize: 13,
                backgroundColor: filterMode === mode ? '#2563eb' : '#374151',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              {mode === 'all' ? 'All Functions' : mode === 'connected' ? 'Connected Only' : 'Public Only'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search functions or files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 16px',
            backgroundColor: '#374151',
            border: '1px solid #4b5563',
            borderRadius: 8,
            color: '#ffffff',
            fontSize: 14
          }}
        />
      </div>

      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          marginBottom: 16,
          padding: 16,
          backgroundColor: '#1f2937',
          borderRadius: 8,
          border: '1px solid #374151'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>Displaying</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#60a5fa' }}>
              {stats.displayedNodes} / {stats.totalNodes}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>Function Calls</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#8b5cf6' }}>{stats.displayedEdges}</div>
          </div>
          {stats.connected_functions !== undefined && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>Connected</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>{stats.connected_functions}</div>
            </div>
          )}
          {stats.isolated_functions !== undefined && stats.isolated_functions > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>Isolated</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>{stats.isolated_functions}</div>
            </div>
          )}
          {stats.files_processed !== undefined && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>Files</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#ec4899' }}>{stats.files_processed}</div>
            </div>
          )}
        </div>
      )}

      {cfg?.warning && (
        <div style={{
          padding: 12,
          marginBottom: 16,
          backgroundColor: 'rgba(251, 191, 36, 0.1)',
          border: '1px solid #f59e0b',
          borderRadius: 8,
          color: '#fbbf24',
          fontSize: 13
        }}>
          ⚠️ {cfg.warning}
        </div>
      )}
      
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: 600,
          border: '2px solid #374151',
          borderRadius: 12,
          backgroundColor: '#f7fafc'
        }}
      />

      {showLegend && (
        <div style={{
          marginTop: 12,
          padding: 16,
          backgroundColor: '#1f2937',
          borderRadius: 8,
          border: '1px solid #374151'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            marginBottom: 12
          }}>
            {[
              { color: '#667eea', border: '#4c51bf', label: 'Regular Function', shape: 'square' },
              { color: '#8b5cf6', border: '#7c3aed', label: 'Class Method', shape: 'square' },
              { color: '#14b8a6', border: '#0d9488', label: 'Async Function', shape: 'square' },
              { color: '#f59e0b', border: '#d97706', label: 'Isolated Function', shape: 'square' },
              { color: '#eab308', border: '#ca8a04', label: 'Private Function', shape: 'square' },
              { color: '#6b7280', border: '#4b5563', label: 'External Reference', shape: 'circle' }
            ].map(({ color, border, label, shape }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ 
                  width: 16, 
                  height: 16, 
                  backgroundColor: color,
                  border: `2px solid ${border}`,
                  borderRadius: shape === 'circle' ? '50%' : 3
                }} />
                <span style={{ fontSize: 13, color: '#d1d5db' }}>{label}</span>
              </div>
            ))}
          </div>
          <div style={{ 
            paddingTop: 12,
            borderTop: '1px solid #374151',
            fontSize: 12,
            color: '#9ca3af'
          }}>
            <strong style={{ color: '#d1d5db' }}>Controls:</strong> Drag to pan • Scroll to zoom • Click nodes to select • Hover for details
          </div>
        </div>
      )}
    </div>
  );
};

// Main CFGTab Component
const CFGTab = ({ projectCFG }) => {
  const [code, setCode] = useState('');
  const [cfg, setCfg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('project');

  const handleAnalyze = async () => {
    if (!code.trim()) {
      setError('Please enter some Python code');
      return;
    }

    setLoading(true);
    setError(null);
    setCfg(null);
    
    try {
      const response = await fetch('http://localhost:8000/cfg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to generate CFG');
      }
      
      const data = await response.json();
      
      if (!data.nodes || data.nodes.length === 0) {
        setError(data.errors?.[0] || 'No functions found in the code');
      } else {
        setCfg(data);
      }
    } catch (err) {
      setError(err.message || 'Error generating CFG');
    } finally {
      setLoading(false);
    }
  };

  const exampleCode = `def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

def calculate_series(n):
    fact = factorial(n)
    fib = fibonacci(n)
    return fact + fib

def isolated_function():
    # This function doesn't call anything
    return 42

class Calculator:
    def add(self, a, b):
        return self.validate(a) + self.validate(b)
    
    def validate(self, num):
        return num if num > 0 else 0
    
    def calculate(self):
        result = self.add(5, 10)
        return calculate_series(result)

async def async_process(data):
    result = await process_data(data)
    return result

def _private_helper():
    return "helper"

def uses_private():
    return _private_helper()`;

  return (
    <div>
      <h3 style={{ 
        fontSize: 20, 
        fontWeight: 600, 
        marginBottom: 16, 
        color: '#ffffff' 
      }}>
        Control Flow Graph Visualizer
      </h3>

      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        borderBottom: '2px solid #374151'
      }}>
        {[
          { id: 'project', label: 'Project CFG' },
          { id: 'custom', label: 'Analyze Custom Code' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #60a5fa' : '2px solid transparent',
              cursor: 'pointer',
              color: activeTab === tab.id ? '#60a5fa' : '#9ca3af',
              fontSize: 14,
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'project' ? (
        projectCFG && projectCFG.nodes && projectCFG.nodes.length > 0 ? (
          <ImprovedCFGViewer cfg={projectCFG} title="Project-Wide Control Flow Graph" />
        ) : (
          <div style={{
            padding: 32,
            backgroundColor: '#1f2937',
            borderRadius: 12,
            border: '2px dashed #374151',
            color: '#9ca3af',
            textAlign: 'center'
          }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto 16px' }}>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            <h4 style={{ color: '#d1d5db', marginBottom: 8 }}>No Project CFG Available</h4>
            <p style={{ fontSize: 14 }}>Upload a project first to see the project-wide control flow graph</p>
          </div>
        )
      ) : (
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8
            }}>
              <label style={{ color: '#d1d5db', fontSize: 14, fontWeight: 500 }}>
                Python Code
              </label>
              <button
                onClick={() => setCode(exampleCode)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#374151',
                  color: '#d1d5db',
                  border: '1px solid #4b5563',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                  <polyline points="13 2 13 9 20 9"/>
                </svg>
                Load Example
              </button>
            </div>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Paste your Python code here..."
              style={{
                width: '100%',
                minHeight: 250,
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: 13,
                padding: 16,
                borderRadius: 8,
                background: '#111827',
                color: '#e5e7eb',
                border: '1px solid #374151',
                resize: 'vertical',
                lineHeight: 1.6
              }}
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !code.trim()}
            style={{
              background: loading || !code.trim() ? '#4b5563' : '#2563eb',
              color: '#fff',
              padding: '12px 24px',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: loading || !code.trim() ? 'not-allowed' : 'pointer',
              marginBottom: 20,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: 16,
                  height: 16,
                  border: '2px solid #fff',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Analyzing...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Generate CFG
              </>
            )}
          </button>

          {error && (
            <div style={{
              color: '#f87171',
              marginBottom: 16,
              padding: 12,
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #dc2626',
              borderRadius: 8,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {cfg && <ImprovedCFGViewer cfg={cfg} title="Custom Code Control Flow Graph" />}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        textarea:focus {
          outline: none;
          border-color: #3b82f6;
        }
      `}</style>
    </div>
  );
};

export default CFGTab;