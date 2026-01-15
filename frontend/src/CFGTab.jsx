import React, { useState } from 'react';
import { Network } from 'vis-network/standalone';

const ControlFlowGraphViewer = ({ cfg, title = "Control Flow Graph" }) => {
  const containerRef = React.useRef(null);
  const networkRef = React.useRef(null);
  const [stats, setStats] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!cfg || !cfg.nodes || cfg.nodes.length === 0) {
      setError(cfg?.errors?.[0] || 'No graph data available');
      return;
    }

    try {
      const nodes = cfg.nodes.map(node => ({
        id: node.id,
        label: node.label || node.id,
        title: node.title || node.label,
        shape: 'box',
        color: {
          background: '#667eea',
          border: '#4c51bf',
          highlight: { background: '#764ba2', border: '#5a3d8a' }
        },
        font: { color: '#ffffff', size: 14, face: 'monospace' },
        margin: 10,
        borderWidth: 2,
        shadow: true
      }));

      const edges = (cfg.edges || []).map((edge, idx) => ({
        id: `edge-${idx}`,
        from: edge.from,
        to: edge.to,
        arrows: { to: { enabled: true, scaleFactor: 1 } },
        color: { color: '#4c51bf', highlight: '#764ba2' },
        width: 2,
        smooth: { enabled: true, type: 'cubicBezier', roundness: 0.5 }
      }));

      const validNodeIds = new Set(nodes.map(n => n.id));
      const validEdges = edges.filter(e => validNodeIds.has(e.from) && validNodeIds.has(e.to));

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
        interaction: { hover: true, navigationButtons: true, keyboard: true },
        nodes: {
          widthConstraint: { minimum: 100, maximum: 250 },
          heightConstraint: { minimum: 40 }
        }
      };

      if (networkRef.current) networkRef.current.destroy();
      if (containerRef.current) {
        networkRef.current = new Network(containerRef.current, data, options);
        networkRef.current.once('stabilizationIterationsDone', () => {
          networkRef.current.fit({ animation: { duration: 1000 } });
        });
        
        setStats({
          nodes: nodes.length,
          edges: validEdges.length,
          ...cfg.stats
        });
        setError(null);
      }
    } catch (err) {
      setError(`Failed to render graph: ${err.message}`);
    }

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [cfg]);

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: 400,
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
      <h4 style={{ color: '#ffffff', marginBottom: 16, fontSize: 18, fontWeight: 600 }}>{title}</h4>
      
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12,
          marginBottom: 16,
          padding: 16,
          backgroundColor: '#1f2937',
          borderRadius: 8,
          border: '1px solid #374151'
        }}>
          {stats.total_functions !== undefined && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>Total Functions</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#60a5fa' }}>{stats.total_functions}</div>
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>Displayed</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#8b5cf6' }}>{stats.nodes}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>Function Calls</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>{stats.edges}</div>
          </div>
          {stats.files_processed !== undefined && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>Files</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>{stats.files_processed}</div>
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
      
      <div style={{
        marginTop: 12,
        padding: 12,
        backgroundColor: '#1f2937',
        borderRadius: 8,
        border: '1px solid #374151',
        fontSize: 12,
        color: '#9ca3af'
      }}>
        <strong style={{ color: '#d1d5db' }}>Controls:</strong> Drag to pan • Scroll to zoom • Click nodes to select • Double-click to focus
      </div>
    </div>
  );
};

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

def main():
    result = calculate_series(5)
    print(result)`;

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
        <button
          onClick={() => setActiveTab('project')}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'project' ? '2px solid #60a5fa' : '2px solid transparent',
            cursor: 'pointer',
            color: activeTab === 'project' ? '#60a5fa' : '#9ca3af',
            fontSize: 14,
            fontWeight: 500,
            transition: 'all 0.2s'
          }}
        >
          Project CFG
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'custom' ? '2px solid #60a5fa' : '2px solid transparent',
            cursor: 'pointer',
            color: activeTab === 'custom' ? '#60a5fa' : '#9ca3af',
            fontSize: 14,
            fontWeight: 500,
            transition: 'all 0.2s'
          }}
        >
          Analyze Custom Code
        </button>
      </div>

      {activeTab === 'project' ? (
        projectCFG ? (
          <ControlFlowGraphViewer cfg={projectCFG} title="Project-Wide Control Flow Graph" />
        ) : (
          <div style={{
            padding: 24,
            backgroundColor: '#1f2937',
            borderRadius: 8,
            border: '1px solid #374151',
            color: '#9ca3af',
            textAlign: 'center'
          }}>
            No project CFG data available. Upload a project first.
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
                  fontWeight: 500
                }}
              >
                Load Example
              </button>
            </div>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Paste your Python code here..."
              style={{
                width: '100%',
                minHeight: 200,
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
              fontSize: 14
            }}>
              {error}
            </div>
          )}

          {cfg && <ControlFlowGraphViewer cfg={cfg} title="Custom Code Control Flow Graph" />}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CFGTab;