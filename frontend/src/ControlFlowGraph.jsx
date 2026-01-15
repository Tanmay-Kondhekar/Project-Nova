import React, { useState, useEffect, useRef } from 'react';
import { Network } from 'vis-network/standalone';

const ControlFlowGraph = ({ cfg }) => {
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!cfg || !cfg.nodes || cfg.nodes.length === 0) {
      setError('No graph data available');
      return;
    }

    try {
      // Prepare nodes
      const nodes = cfg.nodes.map(node => ({
        id: node.id,
        label: node.label || node.id,
        shape: 'box',
        color: {
          background: '#667eea',
          border: '#4c51bf',
          highlight: {
            background: '#764ba2',
            border: '#5a3d8a'
          }
        },
        font: {
          color: '#ffffff',
          size: 14,
          face: 'Inter, system-ui, sans-serif',
          bold: { color: '#ffffff' }
        },
        margin: 10,
        borderWidth: 2,
        borderWidthSelected: 3,
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.2)',
          size: 8,
          x: 2,
          y: 2
        }
      }));

      // Prepare edges with proper error handling
      const edges = (cfg.edges || []).map((edge, idx) => ({
        id: `edge-${idx}`,
        from: edge.from,
        to: edge.to,
        arrows: {
          to: {
            enabled: true,
            type: 'arrow',
            scaleFactor: 1
          }
        },
        color: {
          color: '#4c51bf',
          highlight: '#764ba2',
          hover: '#5a3d8a'
        },
        width: 2,
        smooth: {
          enabled: true,
          type: 'cubicBezier',
          roundness: 0.5
        },
        label: edge.label || '',
        font: {
          size: 11,
          color: '#4c51bf',
          strokeWidth: 0,
          align: 'middle'
        }
      }));

      // Filter out edges with invalid nodes
      const validNodeIds = new Set(nodes.map(n => n.id));
      const validEdges = edges.filter(e => 
        validNodeIds.has(e.from) && validNodeIds.has(e.to)
      );

      if (validEdges.length < edges.length) {
        console.warn(`Filtered out ${edges.length - validEdges.length} invalid edges`);
      }

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
            edgeMinimization: true,
            parentCentralization: true
          }
        },
        physics: {
          enabled: false
        },
        interaction: {
          hover: true,
          tooltipDelay: 200,
          zoomView: true,
          dragView: true,
          navigationButtons: true,
          keyboard: {
            enabled: true,
            speed: { x: 10, y: 10, zoom: 0.02 }
          }
        },
        nodes: {
          shape: 'box',
          widthConstraint: {
            minimum: 100,
            maximum: 250
          },
          heightConstraint: {
            minimum: 40
          }
        },
        edges: {
          smooth: {
            enabled: true,
            type: 'cubicBezier',
            forceDirection: 'vertical',
            roundness: 0.5
          }
        }
      };

      // Destroy existing network
      if (networkRef.current) {
        networkRef.current.destroy();
      }

      // Create new network
      if (containerRef.current) {
        networkRef.current = new Network(containerRef.current, data, options);
        
        // Fit to view after layout is done
        networkRef.current.once('stabilizationIterationsDone', () => {
          networkRef.current.fit({
            animation: {
              duration: 1000,
              easingFunction: 'easeInOutQuad'
            }
          });
        });

        // Update stats
        setStats({
          nodes: nodes.length,
          edges: validEdges.length,
          maxDepth: calculateMaxDepth(nodes, validEdges)
        });
        
        setError(null);
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
  }, [cfg]);

  const calculateMaxDepth = (nodes, edges) => {
    // Simple depth calculation using BFS
    if (nodes.length === 0) return 0;
    
    const graph = new Map();
    nodes.forEach(n => graph.set(n.id, []));
    edges.forEach(e => {
      if (graph.has(e.from)) {
        graph.get(e.from).push(e.to);
      }
    });

    // Find root nodes (nodes with no incoming edges)
    const hasIncoming = new Set(edges.map(e => e.to));
    const roots = nodes.filter(n => !hasIncoming.has(n.id));

    if (roots.length === 0) return nodes.length; // Cyclic graph

    let maxDepth = 0;
    const queue = roots.map(r => ({ id: r.id, depth: 1 }));
    const visited = new Set();

    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      if (visited.has(id)) continue;
      visited.add(id);
      
      maxDepth = Math.max(maxDepth, depth);
      
      const neighbors = graph.get(id) || [];
      neighbors.forEach(neighbor => {
        if (!visited.has(neighbor)) {
          queue.push({ id: neighbor, depth: depth + 1 });
        }
      });
    }

    return maxDepth;
  };

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: 500,
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
        <p style={{ marginTop: 16, fontSize: 16 }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {stats && (
        <div style={{
          display: 'flex',
          gap: 16,
          marginBottom: 16,
          padding: 16,
          backgroundColor: '#1f2937',
          borderRadius: 8,
          border: '1px solid #374151'
        }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Functions</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#60a5fa' }}>{stats.nodes}</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Calls</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#8b5cf6' }}>{stats.edges}</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Max Depth</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>{stats.maxDepth}</div>
          </div>
        </div>
      )}
      
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: 600,
          border: '2px solid #374151',
          borderRadius: 12,
          backgroundColor: '#f7fafc',
          overflow: 'hidden'
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
        <strong style={{ color: '#d1d5db' }}>Controls:</strong> Drag to pan • Scroll to zoom • Click nodes to highlight • Double-click to focus
      </div>
    </div>
  );
};

export default ControlFlowGraph;