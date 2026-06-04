import { Copy, Folder, File, Box, Image, FileText } from 'lucide-react';
import type { TreeNode, ProjectFile, VersionFileEntry } from '../types';

interface DetailedInspectorProps {
  selectedNode: TreeNode | null;
  selectedDeliverable: ProjectFile | null;
  onCopyText: (text: string, label: string) => void;
}

export default function DetailedInspector({
  selectedNode,
  selectedDeliverable,
  onCopyText,
}: DetailedInspectorProps) {

  const getFileIcon = (ext: string) => {
    const lower = ext.toLowerCase();
    if (lower === 'usd' || lower === 'usda' || lower === 'usdc' || lower === 'usdz') {
      return <Box size={14} style={{ color: 'var(--color-usd)' }} />;
    }
    if (lower === 'blend') {
      return <FileText size={14} style={{ color: 'var(--color-blender)' }} />;
    }
    if (['png', 'jpg', 'jpeg', 'exr', 'tiff', 'tif', 'tga', 'hdr'].includes(lower)) {
      return <Image size={14} style={{ color: '#c084fc' }} />;
    }
    return <File size={14} style={{ color: 'var(--text-muted)' }} />;
  };

  const getDCCLabel = (file: ProjectFile) => {
    const app = file.application?.toLowerCase() ?? '';
    const appTitle = app ? app.charAt(0).toUpperCase() + app.slice(1) : '';
    return appTitle + (file.appVersion ? ` ${file.appVersion}` : '');
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Detailed Inspector</h2>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {selectedDeliverable ? (
          <>
            {/* Deliverable Metadata Card */}
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                Deliverable Metadata
              </h3>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Asset Name:</span>
                  <strong style={{ color: '#fff' }}>{selectedDeliverable.name.split('_v')[0]}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Version:</span>
                  <strong style={{ color: '#fff' }}>
                    {selectedDeliverable.name.includes('_v') ? `v${selectedDeliverable.name.split('_v')[1]}` : 'published'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>DCC Application:</span>
                  <strong style={{ color: '#fff' }}>{getDCCLabel(selectedDeliverable) || 'Unknown'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Category:</span>
                  <span style={{ 
                    fontSize: '9px', 
                    background: selectedDeliverable.category === 'published' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255,255,255,0.06)', 
                    padding: '1px 6px', 
                    borderRadius: '3px',
                    color: selectedDeliverable.category === 'published' ? 'var(--color-usd)' : 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    fontWeight: 600
                  }}>
                    {selectedDeliverable.category}
                  </span>
                </div>
                {selectedDeliverable.sourceScene && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Source Workfile:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }} title={selectedDeliverable.sourceScene}>
                        {selectedDeliverable.sourceScene.split('/').pop()}
                      </span>
                      <button 
                        onClick={() => onCopyText(selectedDeliverable.sourceScene!, 'source workfile path')}
                        className="btn btn-text"
                        style={{ padding: '4px', height: 'auto' }}
                        title="Copy absolute path"
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Folder Contents Card */}
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                Folder Contents
              </h3>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', wordBreak: 'break-all', background: 'var(--bg-app)', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                  <Folder size={12} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedDeliverable.absolutePath}</span>
                  <button 
                    onClick={() => onCopyText(selectedDeliverable.absolutePath, 'folder path')}
                    className="btn btn-text"
                    style={{ padding: '2px', height: 'auto' }}
                    title="Copy absolute path"
                  >
                    <Copy size={11} />
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  {selectedDeliverable.versionFiles && selectedDeliverable.versionFiles.length > 0 ? (
                    selectedDeliverable.versionFiles.map((vf: VersionFileEntry) => (
                      <div 
                        key={vf.absolutePath}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          padding: '6px 8px', 
                          background: 'rgba(255, 255, 255, 0.02)', 
                          borderRadius: '4px', 
                          border: '1px solid rgba(255, 255, 255, 0.04)' 
                        }}
                      >
                        {getFileIcon(vf.ext)}
                        <span 
                          style={{ 
                            fontSize: '11.5px', 
                            color: 'var(--text-primary)', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap',
                            flex: 1 
                          }}
                          title={vf.name}
                        >
                          {vf.name}
                        </span>
                        <button 
                          onClick={() => onCopyText(vf.absolutePath, 'file path')}
                          className="btn btn-text"
                          style={{ padding: '4px', height: 'auto' }}
                          title="Copy file absolute path"
                        >
                          <Copy size={11} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
                      No files found in folder.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : selectedNode ? (
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', wordBreak: 'break-all', background: 'var(--bg-app)', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                  <Folder size={12} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedNode.path}</span>
                  <button 
                    onClick={() => onCopyText(selectedNode.path, 'directory path')}
                    className="btn btn-text"
                    style={{ padding: '2px', height: 'auto' }}
                    title="Copy absolute path"
                  >
                    <Copy size={11} />
                  </button>
                </div>
              </div>
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
