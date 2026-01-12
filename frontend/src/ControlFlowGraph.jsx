
import React from 'react';
import ReactFlow, { MiniMap, Controls, Background } from 'reactflow';
import 'reactflow/dist/style.css';


// Arrange nodes in a grid for better visibility
function toReactFlowFormat(cfg) {
  const nodeWidth = 180;
  const nodeHeight = 70;
  const padding = 40;
  const nodesPerRow = 5;
  const nodes = (cfg.nodes || []).map((node, idx) => {
    const row = Math.floor(idx / nodesPerRow);
    const col = idx % nodesPerRow;
    return {
      id: node.id,
      data: { label: node.label },
      position: {
        x: col * (nodeWidth + padding),
        y: row * (nodeHeight + padding),
      },
      style: {
        width: nodeWidth,
        minHeight: nodeHeight,
        borderRadius: 10,
        background: '#232946',
        color: '#fff',
        border: '2px solid #3b82f6',
        fontWeight: 600,
        fontSize: 15,
        boxShadow: '0 2px 8px #0002',
      },
    };
  });
  const edges = (cfg.edges || []).map(edge => ({
    id: `${edge.from}->${edge.to}`,
    source: edge.from,
    target: edge.to,
    animated: true,
    style: { stroke: '#3b82f6', strokeWidth: 3 },
    type: 'smoothstep',
    markerEnd: {
      type: 'arrowclosed',
      color: '#3b82f6',
      width: 20,
      height: 20,
    },
  }));
  return { nodes, edges };
}

const ControlFlowGraph = ({ cfg }) => {
  if (!cfg) return <div>No graph to display.</div>;
  const { nodes, edges } = toReactFlowFormat(cfg);
  return (
    <div style={{ width: '100%', height: 500, border: '1px solid #ccc', borderRadius: 8 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        defaultEdgeOptions={{
          markerEnd: { type: 'arrowclosed', color: '#3b82f6' },
          type: 'smoothstep'
        }}
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};

export default ControlFlowGraph;
