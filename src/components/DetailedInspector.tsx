import { Sparkles } from 'lucide-react';
import type { TreeNode } from '../types';

interface DetailedInspectorProps {
  selectedNode: TreeNode | null;
}

export default function DetailedInspector({ selectedNode }: DetailedInspectorProps) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Detailed Inspector</h2>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {selectedNode ? (
          <>
            {/* General Info Card */}
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Node Metadata</h3>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Name:</span>
                  <strong style={{ color: '#fff' }}>{selectedNode.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Pipeline Type:</span>
                  <strong style={{ color: '#fff', textTransform: 'capitalize' }}>{selectedNode.type}</strong>
                </div>
                {selectedNode.subtype !== 'custom' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Subtype:</span>
                    <strong style={{ color: '#fff', textTransform: 'capitalize' }}>{selectedNode.subtype}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Directory Explorer Card */}
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>FileSystem Directory</h3>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', wordBreak: 'break-all', background: 'var(--bg-app)', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                  {selectedNode.path}
                </div>
              </div>
            </div>

            {/* VFX Pipeline Overview Help */}
            <div style={{ marginTop: 'auto', padding: '14px', background: 'hsla(200, 95%, 45%, 0.05)', border: '1px solid hsla(200, 95%, 45%, 0.15)', borderRadius: '6px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-usd)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Sparkles size={14} /> USD Composition Tip
              </h4>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                This pipeline organizes data dynamically! Tasks generate local assets in `wip` folders, and final validated outputs are reference-linked under `published` to assemble the global USD Stage scene graph.
              </p>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px', marginTop: '40px' }}>
            No active selection.
          </div>
        )}
      </div>
    </div>
  );
}
