import React, { useState, useMemo } from 'react';

// CodeStructureMap
// - Props: graph { nodes: [], edges: [] }
// - Two views: "Hierarchy" and "Graph"
// - Sidebar quick-navigation to jump to nodes
// - Pure React + SVG; no external libraries required

export default function CodeStructureMap({ graph }) {
  const [view, setView] = useState('hierarchy'); // 'hierarchy' | 'graph'
  const [selectedId, setSelectedId] = useState(null);

  const grouped = useMemo(() => {
    const files = graph.nodes.filter(n => n.type === 'file');
    const classes = graph.nodes.filter(n => n.type === 'class');
    const functions = graph.nodes.filter(n => n.type === 'function');

    const byFile = files.map(file => {
      const fileId = file.id;
      const fileClasses = classes.filter(c => graph.edges.some(e => e.from === fileId && e.to === c.id));
      const fileFunctions = functions.filter(f => graph.edges.some(e => e.from === fileId && e.to === f.id));
      return { file, classes: fileClasses, functions: fileFunctions };
    });

    return { files: byFile, counts: { files: files.length, classes: classes.length, functions: functions.length } };
  }, [graph]);

  // Simple layout for graph view: column positions per node type
  const layout = useMemo(() => {
    const fileNodes = graph.nodes.filter(n => n.type === 'file');
    const classNodes = graph.nodes.filter(n => n.type === 'class');
    const funcNodes = graph.nodes.filter(n => n.type === 'function');

    const width = 900;
    const height = Math.max(400, graph.nodes.length * 30);

    const fileX = 100;
    const classX = 420;
    const funcX = 740;

    const pos = {};

    fileNodes.forEach((n, i) => {
      pos[n.id] = { x: fileX, y: 60 + i * 60, node: n };
    });
    classNodes.forEach((n, i) => {
      pos[n.id] = { x: classX, y: 40 + i * 50, node: n };
    });
    funcNodes.forEach((n, i) => {
      pos[n.id] = { x: funcX, y: 40 + i * 40, node: n };
    });

    return { pos, width, height };
  }, [graph]);

  const onSelect = (id) => {
    setSelectedId(id);
    // Try to focus element with anchor if present
    const el = document.getElementById(`node-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '16px' }}>
      <aside style={{ background: '#0f1724', padding: '12px', borderRadius: 8, border: '1px solid #263244' }}>
        <h3 style={{ color: '#e6eef8', margin: '6px 0 12px' }}>Code Structure Map</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button onClick={() => setView('hierarchy')} style={{ flex: 1, padding: '8px', background: view === 'hierarchy' ? '#2563eb' : '#152033', color: '#fff', border: 'none', borderRadius: 6 }}>Hierarchy</button>
          <button onClick={() => setView('graph')} style={{ flex: 1, padding: '8px', background: view === 'graph' ? '#2563eb' : '#152033', color: '#fff', border: 'none', borderRadius: 6 }}>Graph</button>
        </div>

        <div style={{ color: '#9fb0c9', fontSize: 13, marginBottom: 8 }}>Quick Navigation</div>
        <div style={{ maxHeight: 420, overflow: 'auto', paddingRight: 6 }}>
          {grouped.files.map((g) => (
            <div key={g.file.id} style={{ marginBottom: 10 }} id={`node-${g.file.id}`}>
              <div
                onClick={() => onSelect(g.file.id)}
                style={{ cursor: 'pointer', padding: '6px 8px', background: selectedId === g.file.id ? '#1f3d6d' : '#071423', color: '#bfe0ff', borderRadius: 6, border: '1px solid #163045' }}
              >
                📁 {g.file.label}
              </div>

              {g.classes.length > 0 && (
                <div style={{ marginLeft: 10, marginTop: 6 }}>
                  {g.classes.map(c => (
                    <div key={c.id} id={`node-${c.id}`} onClick={() => onSelect(c.id)} style={{ cursor: 'pointer', padding: '4px 8px', color: '#cbdff6', borderRadius: 6, marginTop: 6, background: selectedId === c.id ? '#18304f' : 'transparent' }}>🔷 {c.label}</div>
                  ))}
                </div>
              )}

              {g.functions.length > 0 && (
                <div style={{ marginLeft: 18, marginTop: 6 }}>
                  {g.functions.map(f => (
                    <div key={f.id} id={`node-${f.id}`} onClick={() => onSelect(f.id)} style={{ cursor: 'pointer', padding: '3px 8px', color: '#bfe0c9', borderRadius: 6, marginTop: 6, fontSize: 13, background: selectedId === f.id ? '#143726' : 'transparent' }}>🔹 {f.label}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12, color: '#9fb0c9', fontSize: 13 }}>
          <div>Files: {grouped.counts.files}</div>
          <div>Classes: {grouped.counts.classes}</div>
          <div>Functions: {grouped.counts.functions}</div>
        </div>
      </aside>

      <main style={{ background: '#071328', padding: 12, borderRadius: 8, border: '1px solid #263244' }}>
        {view === 'hierarchy' ? (
          <div>
            <h4 style={{ color: '#e6eef8', marginTop: 4 }}>Hierarchy view</h4>
            <div style={{ marginTop: 12 }}>
              {grouped.files.map(g => (
                <div key={g.file.id} style={{ marginBottom: 10, padding: 8, borderRadius: 6, background: '#071a2b', border: selectedId === g.file.id ? '1px solid #3b82f6' : '1px solid #0e2434' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 14, color: '#bfe0ff' }}>📁 {g.file.label}</div>
                    <div style={{ marginLeft: 'auto', color: '#9fb0c9' }}>{g.file.language}</div>
                  </div>

                  {g.classes.length > 0 && (
                    <div style={{ marginLeft: 18, marginTop: 8 }}>
                      {g.classes.map(c => (
                        <div key={c.id} onClick={() => onSelect(c.id)} style={{ padding: 6, borderRadius: 6, marginBottom: 6, cursor: 'pointer', background: selectedId === c.id ? '#15325b' : 'transparent', color: '#cbdff6' }}>🔷 {c.label}</div>
                      ))}
                    </div>
                  )}

                  {g.functions.length > 0 && (
                    <div style={{ marginLeft: 36, marginTop: 6 }}>
                      {g.functions.map(f => (
                        <div key={f.id} onClick={() => onSelect(f.id)} style={{ padding: 4, cursor: 'pointer', color: '#bfe0c9' }}>🔹 {f.label}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h4 style={{ color: '#e6eef8', marginTop: 4 }}>Graph view (static layout)</h4>
            <div style={{ overflow: 'auto', borderRadius: 8, background: '#021323', padding: 8, marginTop: 12 }}>
              <svg width={layout.width} height={layout.height} style={{ display: 'block', margin: '0 auto', background: '#03141a', borderRadius: 6 }}>
                <defs>
                  <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
                    <path d="M0,0 L10,5 L0,10 z" fill="#8b9fb3" />
                  </marker>
                </defs>

                {graph.edges.map((e, idx) => {
                  const a = layout.pos[e.from];
                  const b = layout.pos[e.to];
                  if (!a || !b) return null;
                  return (
                    <line key={idx} x1={a.x + 80} y1={a.y + 8} x2={b.x - 8} y2={b.y + 8} stroke="#1f6aab" strokeWidth={1.2} markerEnd="url(#arrow)" opacity={0.9} />
                  );
                })}

                {Object.entries(layout.pos).map(([id, p]) => {
                  const isSelected = selectedId === id;
                  const fill = p.node.type === 'file' ? '#2b6fb3' : p.node.type === 'class' ? '#6b49c9' : '#1fa37a';
                  const r = p.node.type === 'file' ? 34 : p.node.type === 'class' ? 28 : 20;
                  return (
                    <g key={id} transform={`translate(${p.x}, ${p.y})`} style={{ cursor: 'pointer' }} onClick={() => onSelect(id)} id={`node-${id}`}>
                      <rect x={-10} y={-10} rx={8} ry={8} width={r*2} height={30} fill={isSelected ? '#244b72' : '#071a2b'} stroke={fill} strokeWidth={2} />
                      <text x={r-6} y={10} fill="#e6eef8" fontSize={12} textAnchor="middle" style={{ pointerEvents: 'none' }}>{p.node.label}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
