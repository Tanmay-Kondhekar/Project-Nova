import React, { useState } from 'react';
import ControlFlowGraph from './ControlFlowGraph';

const CFGTab = ({ projectCFG }) => {
  const [code, setCode] = useState('');
  const [cfg, setCfg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setCfg(null);
    try {
      const response = await fetch('http://localhost:8000/cfg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!response.ok) throw new Error('Failed to generate CFG');
      const data = await response.json();
      setCfg(data);
    } catch (err) {
      setError(err.message || 'Error generating CFG');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Control Flow Graph Visualizer</h3>
      {projectCFG ? (
        <>
          <div style={{ marginBottom: 16 }}>
            <b>Project Control Flow Graph:</b>
          </div>
          <ControlFlowGraph cfg={projectCFG} />
          <hr style={{ margin: '32px 0', border: 0, borderTop: '1px solid #374151' }} />
        </>
      ) : null}
      <div style={{ marginBottom: 8, marginTop: 16 }}>
        <b>Try your own code:</b>
      </div>
      <textarea
        value={code}
        onChange={e => setCode(e.target.value)}
        placeholder="Paste your Python code here..."
        style={{ width: '100%', minHeight: 120, fontFamily: 'monospace', fontSize: 14, marginBottom: 12, borderRadius: 8, padding: 12, background: '#181e29', color: '#fff', border: '1px solid #374151' }}
      />
      <button
        onClick={handleAnalyze}
        disabled={loading || !code.trim()}
        style={{ background: '#2563eb', color: '#fff', padding: '10px 24px', border: 'none', borderRadius: 8, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 20 }}
      >
        {loading ? 'Analyzing...' : 'Visualize CFG'}
      </button>
      {error && <div style={{ color: '#f87171', marginBottom: 12 }}>{error}</div>}
      {cfg && <ControlFlowGraph cfg={cfg} />}
    </div>
  );
};

export default CFGTab;
