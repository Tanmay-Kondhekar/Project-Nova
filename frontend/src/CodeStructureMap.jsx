import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Network } from 'vis-network/standalone';

export default function CodeStructureMap({ graph }) {
  const [view, setView] = useState('graph');
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const networkRef = useRef(null);

  const grouped = useMemo(() => {
    if (!graph || !graph.nodes) return { files: [], counts: { files: 0, classes: 0, functions: 0 } };
    
    const files = graph.nodes.filter(n => n.type === 'file');
    const classes = graph.nodes.filter(n => n.type === 'class');
    const functions = graph.nodes.filter(n => n.type === 'function');

    const byFile = files.map(file => {
      const fileId = file.id;
      const fileClasses = classes.filter(c => 
        graph.edges.some(e => e.from === fileId && e.to === c.id)
      );
      const fileFunctions = functions.filter(f => 
        graph.edges.some(e => e.from === fileId && e.to === f.id)
      );
      return { file, classes: fileClasses, functions: fileFunctions };
    });

    return { 
      files: byFile, 
      counts: { 
        files: files.length, 
        classes: classes.length, 
        functions: functions.length 
      } 
    };
  }, [graph]);

  const filteredFiles = useMemo(() => {
    if (!searchTerm) return grouped.files;
    
    const term = searchTerm.toLowerCase();
    return grouped.files.filter(g => 
      g.file.label.toLowerCase().includes(term) ||
      g.classes.some(c => c.label.toLowerCase().includes(term)) ||
      g.functions.some(f => f.label.toLowerCase().includes(term))
    );
  }, [grouped.files, searchTerm]);

  useEffect(() => {
    if (view !== 'graph' || !containerRef.current || !graph || !graph.nodes) return;

    try {
      const nodeColors = {
        file: { bg: '#3b82f6', border: '#2563eb', highlight: '#1d4ed8' },
        class: { bg: '#8b5cf6', border: '#7c3aed', highlight: '#6d28d9' },
        function: { bg: '#10b981', border: '#059669', highlight: '#047857' }
      };

      const nodes = graph.nodes.map(node => {
        const colors = nodeColors[node.type] || nodeColors.function;
        const size = node.type === 'file' ? 25 : node.type === 'class' ? 20 : 15;
        
        return {
          id: node.id,
          label: node.label || node.id,
          shape: node.type === 'file' ? 'diamond' : node.type === 'class' ? 'box' : 'ellipse',
          size: size,
          color: {
            background: colors.bg,
            border: colors.border,
            highlight: {
              background: colors.highlight,
              border: colors.border
            }
          },
          font: {
            color: '#ffffff',
            size: node.type === 'file' ? 14 : 12,
            face: 'Inter, system-ui, sans-serif'
          },
          title: `${node.type}: ${node.label}`,
          borderWidth: 2,
          shadow: true
        };
      });

      const edges = (graph.edges || []).map((edge, idx) => ({
        id: `edge-${idx}`,
        from: edge.from,
        to: edge.to,
        arrows: {
          to: { enabled: true, scaleFactor: 0.8 }
        },
        color: {
          color: '#64748b',
          highlight: '#475569'
        },
        width: 1.5,
        smooth: {
          enabled: true,
          type: 'continuous'
        }
      }));

      const data = { nodes, edges };

      const options = {
        layout: {
          hierarchical: {
            enabled: true,
            direction: 'UD',
            sortMethod: 'directed',
            nodeSpacing: 120,
            levelSeparation: 120,
            treeSpacing: 150
          }
        },
        physics: {
          enabled: false
        },
        interaction: {
          hover: true,
          tooltipDelay: 200,
          navigationButtons: true,
          keyboard: true
        },
        nodes: {
          widthConstraint: {
            minimum: 80,
            maximum: 200
          }
        }
      };

      if (networkRef.current) {
        networkRef.current.destroy();
      }

      networkRef.current = new Network(containerRef.current, data, options);
      
      networkRef.current.on('click', (params) => {
        if (params.nodes.length > 0) {
          setSelectedId(params.nodes[0]);
        }
      });

      networkRef.current.once('stabilizationIterationsDone', () => {
        networkRef.current.fit({ animation: { duration: 500 } });
      });

    } catch (error) {
      console.error('Error rendering graph:', error);
    }

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [view, graph]);

  const onSelect = (id) => {
    setSelectedId(id);
    const el = document.getElementById(`nav-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    if (networkRef.current) {
      networkRef.current.selectNodes([id]);
      networkRef.current.focus(id, { animation: { duration: 500 } });
    }
  };

  if (!graph || !graph.nodes || graph.nodes.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 400,
        backgroundColor: '#1f2937',
        borderRadius: 8,
        border: '1px solid #374151',
        color: '#9ca3af'
      }}>
        No code structure data available
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
      {/* Sidebar */}
      <aside style={{
        backgroundColor: '#1f2937',
        padding: 16,
        borderRadius: 8,
        border: '1px solid #374151',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '80vh'
      }}>
        <h3 style={{ color: '#ffffff', margin: '0 0 16px', fontSize: 18, fontWeight: 600 }}>
          Code Structure
        </h3>
        
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setView('hierarchy')}
            style={{
              flex: 1,
              padding: 10,
              background: view === 'hierarchy' ? '#2563eb' : '#374151',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            Hierarchy
          </button>
          <button
            onClick={() => setView('graph')}
            style={{
              flex: 1,
              padding: 10,
              background: view === 'graph' ? '#2563eb' : '#374151',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            Graph
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search files, classes, functions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            backgroundColor: '#374151',
            border: '1px solid #4b5563',
            borderRadius: 6,
            color: '#ffffff',
            fontSize: 13,
            marginBottom: 16,
            outline: 'none'
          }}
        />

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
          marginBottom: 16,
          padding: 12,
          backgroundColor: '#111827',
          borderRadius: 6
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#3b82f6' }}>
              {grouped.counts.files}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Files</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#8b5cf6' }}>
              {grouped.counts.classes}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Classes</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>
              {grouped.counts.functions}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Functions</div>
          </div>
        </div>

        {/* Navigation */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: 4
        }}>
          {filteredFiles.length === 0 ? (
            <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', marginTop: 20 }}>
              No results found
            </div>
          ) : (
            filteredFiles.map((g) => (
              <div key={g.file.id} style={{ marginBottom: 12 }} id={`nav-${g.file.id}`}>
                <div
                  onClick={() => onSelect(g.file.id)}
                  style={{
                    cursor: 'pointer',
                    padding: '8px 10px',
                    background: selectedId === g.file.id ? '#1e40af' : '#374151',
                    color: '#ffffff',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: 16 }}>📄</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {g.file.label}
                  </span>
                </div>

                {g.classes.length > 0 && (
                  <div style={{ marginLeft: 12, marginTop: 6 }}>
                    {g.classes.map(c => (
                      <div
                        key={c.id}
                        id={`nav-${c.id}`}
                        onClick={() => onSelect(c.id)}
                        style={{
                          cursor: 'pointer',
                          padding: '6px 8px',
                          color: selectedId === c.id ? '#c4b5fd' : '#d1d5db',
                          borderRadius: 4,
                          marginTop: 4,
                          fontSize: 12,
                          background: selectedId === c.id ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <span>🔷</span>
                        <span>{c.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {g.functions.length > 0 && (
                  <div style={{ marginLeft: 24, marginTop: 6 }}>
                    {g.functions.map(f => (
                      <div
                        key={f.id}
                        id={`nav-${f.id}`}
                        onClick={() => onSelect(f.id)}
                        style={{
                          cursor: 'pointer',
                          padding: '4px 8px',
                          color: selectedId === f.id ? '#86efac' : '#d1d5db',
                          borderRadius: 4,
                          marginTop: 4,
                          fontSize: 12,
                          background: selectedId === f.id ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <span>🔹</span>
                        <span>{f.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        backgroundColor: '#1f2937',
        padding: 16,
        borderRadius: 8,
        border: '1px solid #374151'
      }}>
        {view === 'hierarchy' ? (
          <div>
            <h4 style={{ color: '#ffffff', marginTop: 0, marginBottom: 16, fontSize: 18 }}>
              Hierarchy View
            </h4>
            <div style={{ maxHeight: 'calc(80vh - 80px)', overflowY: 'auto' }}>
              {filteredFiles.map(g => (
                <div
                  key={g.file.id}
                  style={{
                    marginBottom: 12,
                    padding: 16,
                    borderRadius: 8,
                    background: '#111827',
                    border: selectedId === g.file.id ? '2px solid #3b82f6' : '1px solid #374151',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: g.classes.length > 0 || g.functions.length > 0 ? 12 : 0
                  }}>
                    <span style={{ fontSize: 20 }}>📄</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: '#ffffff', fontWeight: 500 }}>
                        {g.file.label}
                      </div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                        {g.file.language || 'Unknown'}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>
                      {g.classes.length} classes • {g.functions.length} functions
                    </div>
                  </div>

                  {g.classes.length > 0 && (
                    <div style={{ marginLeft: 32, marginBottom: 8 }}>
                      {g.classes.map(c => (
                        <div
                          key={c.id}
                          onClick={() => onSelect(c.id)}
                          style={{
                            padding: 8,
                            borderRadius: 6,
                            marginBottom: 6,
                            cursor: 'pointer',
                            background: selectedId === c.id ? 'rgba(139, 92, 246, 0.2)' : '#1f2937',
                            border: '1px solid #374151',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                          }}
                        >
                          <span>🔷</span>
                          <span style={{ color: '#c4b5fd', fontSize: 13, fontWeight: 500 }}>
                            {c.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {g.functions.length > 0 && (
                    <div style={{ marginLeft: 48 }}>
                      {g.functions.map(f => (
                        <div
                          key={f.id}
                          onClick={() => onSelect(f.id)}
                          style={{
                            padding: 6,
                            cursor: 'pointer',
                            color: selectedId === f.id ? '#86efac' : '#9ca3af',
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: 4,
                            borderRadius: 4,
                            background: selectedId === f.id ? 'rgba(16, 185, 129, 0.1)' : 'transparent'
                          }}
                        >
                          <span>🔹</span>
                          <span>{f.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h4 style={{ color: '#ffffff', marginTop: 0, marginBottom: 16, fontSize: 18 }}>
              Interactive Graph View
            </h4>
            <div
              ref={containerRef}
              style={{
                width: '100%',
                height: 'calc(80vh - 80px)',
                border: '2px solid #374151',
                borderRadius: 8,
                backgroundColor: '#111827'
              }}
            />
            <div style={{
              marginTop: 12,
              padding: 10,
              backgroundColor: '#111827',
              borderRadius: 6,
              fontSize: 11,
              color: '#9ca3af',
              display: 'flex',
              gap: 16
            }}>
              <span><strong style={{ color: '#3b82f6' }}>◆</strong> Files</span>
              <span><strong style={{ color: '#8b5cf6' }}>■</strong> Classes</span>
              <span><strong style={{ color: '#10b981' }}>●</strong> Functions</span>
              <span style={{ marginLeft: 'auto' }}>Drag to pan • Scroll to zoom • Click to select</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}