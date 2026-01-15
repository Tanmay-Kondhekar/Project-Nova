import React, { useState, useEffect, useRef } from 'react';
import { Network } from 'vis-network/standalone';

const ImprovedCFGViewer = ({ cfg, title = "Control Flow Graph", showLegend = true }) => {
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'connected', 'public'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  useEffect(() => {
    if (!cfg || !cfg.nodes || cfg.nodes.length === 0) {
      setError(cfg?.errors?.[0] || 'No graph data available');
      return;
    }

    try {
      // Helper function to get all connected nodes (UPWARD only - ancestors/callers)
      const getConnectedNodes = (nodeId, edges) => {
        const connected = new Set([nodeId]);
        const queue = [nodeId];
        const visited = new Set();
        
        while (queue.length > 0) {
          const current = queue.shift();
          if (visited.has(current)) continue;
          visited.add(current);
          
          // Only traverse UPWARD - find nodes that point TO this node
          edges.forEach(edge => {
            // If edge points TO current node, add the FROM node
            if (edge.to === current && !connected.has(edge.from)) {
              connected.add(edge.from);
              queue.push(edge.from);
            }
          });
        }
        
        return connected;
      };

      // Filter nodes based on filter mode
      let filteredNodes = cfg.nodes;
      
      if (filterMode === 'connected') {
        filteredNodes = cfg.nodes.filter(n => n.connected);
      } else if (filterMode === 'public') {
        filteredNodes = cfg.nodes.filter(n => !n.is_private);
      }
      
      // Apply search filter - include connected nodes
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchingNodes = cfg.nodes.filter(n => 
          n.label?.toLowerCase().includes(term) || 
          n.file?.toLowerCase().includes(term)
        );
        
        // For each matching node, include all its connected nodes
        const connectedNodeIds = new Set();
        matchingNodes.forEach(node => {
          const connected = getConnectedNodes(node.id, cfg.edges || []);
          connected.forEach(id => connectedNodeIds.add(id));
        });
        
        filteredNodes = filteredNodes.filter(n => connectedNodeIds.has(n.id));
      }

      // Prepare nodes with enhanced styling
      const connectedToSelected = selectedNodeId ? 
        getConnectedNodes(selectedNodeId, cfg.edges || []) : new Set();
      
      const nodes = filteredNodes.map(node => {
        // Determine if this node should be dimmed
        const isDimmed = selectedNodeId && !connectedToSelected.has(node.id);
        const isHighlighted = selectedNodeId && connectedToSelected.has(node.id);
        
        // Determine color based on node properties
        let color = { background: '#667eea', border: '#4c51bf' };
        
        if (node.external) {
          // External references - gray
          color = { background: '#6b7280', border: '#4b5563' };
        } else if (!node.connected) {
          // Isolated functions - orange
          color = { background: '#f59e0b', border: '#d97706' };
        } else if (node.is_method) {
          // Class methods - purple
          color = { background: '#8b5cf6', border: '#7c3aed' };
        } else if (node.is_async) {
          // Async functions - teal
          color = { background: '#14b8a6', border: '#0d9488' };
        } else if (node.is_private) {
          // Private functions - yellow
          color = { background: '#eab308', border: '#ca8a04' };
        }

        // Create tooltip with all available info
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

        // Determine shape based on type
        let shape = 'box';
        if (node.external) shape = 'ellipse';
        else if (node.is_method) shape = 'diamond';
        else if (!node.connected) shape = 'box';

        return {
          id: node.id,
          label: node.label || node.id,
          title: tooltip,
          shape: shape,
          color: {
            background: color.background,
            border: color.border,
            highlight: { 
              background: '#764ba2', 
              border: '#5a3d8a' 
            }
          },
          font: { 
            color: '#ffffff', 
            size: 13, 
            face: 'Monaco, Consolas, monospace' 
          },
          margin: 10,
          borderWidth: isHighlighted ? 4 : 2,
          borderWidthSelected: 3,
          shadow: !isDimmed,
          opacity: isDimmed ? 0.2 : 1,
          // Store original color for dimming
          ...(isDimmed && {
            color: {
              background: '#4b5563',
              border: '#374151',
              highlight: { 
                background: '#764ba2', 
                border: '#5a3d8a' 
              }
            },
            font: {
              color: '#6b7280',
              size: 13,
              face: 'Monaco, Consolas, monospace'
            }
          })
        };
      });

      // Filter edges to only include nodes we're displaying
      const nodeIds = new Set(nodes.map(n => n.id));
      const validEdges = (cfg.edges || []).filter(e => 
        nodeIds.has(e.from) && nodeIds.has(e.to)
      ).map((edge, idx) => ({
        id: `edge-${idx}`,
        from: edge.from,
        to: edge.to,
        arrows: { 
          to: { enabled: true, scaleFactor: 1, type: 'arrow' } 
        },
        color: { 
          color: '#4b5563', 
          highlight: '#764ba2',
          opacity: 0.7
        },
        width: 1.5,
        smooth: { 
          enabled: true, 
          type: 'cubicBezier', 
          roundness: 0.5 
        }
      }));

      const data = { nodes, edges: validEdges };
      
      // Enhanced layout options
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
        physics: { 
          enabled: false 
        },
        interaction: { 
          hover: true,
          hoverConnectedEdges: true,
          selectConnectedEdges: true,
          tooltipDelay: 100,
          navigationButtons: true, 
          keyboard: true,
          zoomView: true,
          dragView: true
        },
        nodes: {
          widthConstraint: { minimum: 100, maximum: 250 },
          heightConstraint: { minimum: 35 }
        }
      };

      if (networkRef.current) networkRef.current.destroy();
      
      if (containerRef.current && nodes.length > 0) {
        networkRef.current = new Network(containerRef.current, data, options);
        
        // Add click event handler
        networkRef.current.on('click', (params) => {
          if (params.nodes.length > 0) {
            const clickedNodeId = params.nodes[0];
            // Toggle selection: if same node clicked, deselect
            setSelectedNodeId(prev => prev === clickedNodeId ? null : clickedNodeId);
          } else {
            // Clicked on empty space - clear selection
            setSelectedNodeId(null);
          }
          // Don't zoom or fit - let user maintain their current view
        });
        
        // Only fit to view on initial load, not on every interaction
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
  }, [cfg, filterMode, searchTerm, selectedNodeId]);

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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 16 
      }}>
        <h4 style={{ 
          color: '#ffffff', 
          margin: 0, 
          fontSize: 18, 
          fontWeight: 600 
        }}>
          {title}
        </h4>
        
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setFilterMode('all')}
            style={{
              padding: '6px 12px',
              fontSize: 13,
              backgroundColor: filterMode === 'all' ? '#2563eb' : '#374151',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            All Functions
          </button>
          <button
            onClick={() => setFilterMode('connected')}
            style={{
              padding: '6px 12px',
              fontSize: 13,
              backgroundColor: filterMode === 'connected' ? '#2563eb' : '#374151',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Connected Only
          </button>
          <button
            onClick={() => setFilterMode('public')}
            style={{
              padding: '6px 12px',
              fontSize: 13,
              backgroundColor: filterMode === 'public' ? '#2563eb' : '#374151',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Public Only
          </button>
        </div>
      </div>

      {/* Search box */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search functions or files (shows connected nodes)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 16px',
              backgroundColor: '#374151',
              border: '1px solid #4b5563',
              borderRadius: 8,
              color: '#ffffff',
              fontSize: 14
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                padding: '10px 16px',
                backgroundColor: '#991b1b',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500
              }}
            >
              Clear
            </button>
          )}
        </div>
        {selectedNodeId && (
          <div style={{
            marginTop: 8,
            padding: '8px 12px',
            backgroundColor: 'rgba(96, 165, 250, 0.2)',
            border: '1px solid #60a5fa',
            borderRadius: 6,
            color: '#60a5fa',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>
              ⬆️ Showing lineage (callers) for: <strong>{cfg.nodes.find(n => n.id === selectedNodeId)?.label || selectedNodeId}</strong>
            </span>
            <button
              onClick={() => setSelectedNodeId(null)}
              style={{
                padding: '4px 10px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600
              }}
            >
              Clear Selection
            </button>
          </div>
        )}
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
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
              Displaying
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#60a5fa' }}>
              {stats.displayedNodes} / {stats.totalNodes}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
              Function Calls
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#8b5cf6' }}>
              {stats.displayedEdges}
            </div>
          </div>
          {stats.connected_functions !== undefined && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
                Connected
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>
                {stats.connected_functions}
              </div>
            </div>
          )}
          {stats.isolated_functions !== undefined && stats.isolated_functions > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
                Isolated
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>
                {stats.isolated_functions}
              </div>
            </div>
          )}
          {stats.files_processed !== undefined && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
                Files
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#ec4899' }}>
                {stats.files_processed}
              </div>
            </div>
          )}
          {stats.class_methods !== undefined && stats.class_methods > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
                Methods
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#8b5cf6' }}>
                {stats.class_methods}
              </div>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ 
                width: 16, 
                height: 16, 
                backgroundColor: '#667eea',
                border: '2px solid #4c51bf',
                borderRadius: 3
              }} />
              <span style={{ fontSize: 13, color: '#d1d5db' }}>Regular Function</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ 
                width: 16, 
                height: 16, 
                backgroundColor: '#8b5cf6',
                border: '2px solid #7c3aed',
                borderRadius: 3
              }} />
              <span style={{ fontSize: 13, color: '#d1d5db' }}>Class Method</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ 
                width: 16, 
                height: 16, 
                backgroundColor: '#14b8a6',
                border: '2px solid #0d9488',
                borderRadius: 3
              }} />
              <span style={{ fontSize: 13, color: '#d1d5db' }}>Async Function</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ 
                width: 16, 
                height: 16, 
                backgroundColor: '#f59e0b',
                border: '2px solid #d97706',
                borderRadius: 3
              }} />
              <span style={{ fontSize: 13, color: '#d1d5db' }}>Isolated Function</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ 
                width: 16, 
                height: 16, 
                backgroundColor: '#eab308',
                border: '2px solid #ca8a04',
                borderRadius: 3
              }} />
              <span style={{ fontSize: 13, color: '#d1d5db' }}>Private Function</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ 
                width: 16, 
                height: 16, 
                backgroundColor: '#6b7280',
                border: '2px solid #4b5563',
                borderRadius: '50%'
              }} />
              <span style={{ fontSize: 13, color: '#d1d5db' }}>External Reference</span>
            </div>
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

export default ImprovedCFGViewer;