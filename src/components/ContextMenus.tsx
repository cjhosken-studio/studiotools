import { FolderPlus, Plus, Sparkles, Settings, Trash2, Copy, FolderOpen } from 'lucide-react';

import type { TreeNode, ProjectFile } from '../types';

interface NodeContextMenuProps {
  contextMenu: { x: number; y: number; node: TreeNode } | null;
  onClose: () => void;
  onAddSubfolder: (node: TreeNode) => void;
  onAddTaskArea: (node: TreeNode) => void;
  onInitializeTask: (node: TreeNode) => void;
  onDeleteItem: (node: TreeNode) => void;
  onOpenProjectSettings: (node: TreeNode) => void;
}

export function NodeContextMenu({
  contextMenu,
  onClose,
  onAddSubfolder,
  onAddTaskArea,
  onInitializeTask,
  onDeleteItem,
  onOpenProjectSettings,
}: NodeContextMenuProps) {
  if (!contextMenu) return null;

  return (
    <div style={{
      position: 'fixed',
      top: contextMenu.y,
      left: contextMenu.x,
      zIndex: 1000,
      background: 'var(--bg-panel)',
      border: '1px solid var(--border-light)',
      borderRadius: '6px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      padding: '4px 0',
      display: 'flex',
      flexDirection: 'column',
      minWidth: '170px',
      animation: 'fadeIn 100ms ease'
    }} onClick={e => e.stopPropagation()}>
      {contextMenu.node.type !== 'task' ? (
        <>
          <button 
            className="btn btn-text" 
            style={{ justifyContent: 'flex-start', padding: '8px 14px', fontSize: '12px', width: '100%', gap: '8px', borderRadius: 0 }}
            onClick={() => {
              onAddSubfolder(contextMenu.node);
              onClose();
            }}
          >
            <FolderPlus size={13} /> Add Subfolder...
          </button>
          <button 
            className="btn btn-text" 
            style={{ justifyContent: 'flex-start', padding: '8px 14px', fontSize: '12px', width: '100%', gap: '8px', borderRadius: 0 }}
            onClick={() => {
              onAddTaskArea(contextMenu.node);
              onClose();
            }}
          >
            <Plus size={13} /> Add Task Area...
          </button>
          <button 
            className="btn btn-text" 
            style={{ justifyContent: 'flex-start', padding: '8px 14px', fontSize: '12px', width: '100%', gap: '8px', borderRadius: 0 }}
            onClick={() => {
              onInitializeTask(contextMenu.node);
              onClose();
            }}
          >
            <Plus size={13} /> Initialize Task...
          </button>
        </>
      ) : (
        <div style={{ padding: '6px 12px', fontSize: '11px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontStyle: 'italic' }}>
          Task area (leaf node)
        </div>
      )}
      {contextMenu.node.type === 'project' ? (
        <button 
          className="btn btn-text" 
          style={{ justifyContent: 'flex-start', padding: '8px 14px', fontSize: '12px', width: '100%', gap: '8px', borderTop: '1px solid var(--border)', borderRadius: 0 }}
          onClick={() => {
            onOpenProjectSettings(contextMenu.node);
            onClose();
          }}
        >
          <Settings size={13} /> Open Project Settings
        </button>
      ) : (
        <button 
          className="btn btn-text" 
          style={{ 
            justifyContent: 'flex-start', 
            padding: '8px 14px', 
            fontSize: '12px', 
            width: '100%', 
            gap: '8px', 
            borderTop: '1px solid var(--border)', 
            borderRadius: 0, 
            color: 'var(--color-danger)'
          }}
          onClick={() => {
            onDeleteItem(contextMenu.node);
            onClose();
          }}
        >
          <Trash2 size={13} /> Delete Item
        </button>
      )}
    </div>
  );
}

interface AssetContextMenuProps {
  assetContextMenu: { x: number; y: number; file: ProjectFile } | null;
  onClose: () => void;
  onRegenerateThumbnail: (file: ProjectFile) => void;
  onCopyPath: (file: ProjectFile) => void;
  onDeleteDeliverable: (file: ProjectFile) => void;
}


export function AssetContextMenu({
  assetContextMenu,
  onClose,
  onRegenerateThumbnail,
  onCopyPath,
  onDeleteDeliverable,
}: AssetContextMenuProps) {

  if (!assetContextMenu) return null;

  return (
    <div style={{
      position: 'fixed',
      top: assetContextMenu.y,
      left: assetContextMenu.x,
      zIndex: 1000,
      background: 'var(--bg-panel)',
      border: '1px solid var(--border-light)',
      borderRadius: '6px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      padding: '4px 0',
      display: 'flex',
      flexDirection: 'column',
      minWidth: '200px',
      animation: 'fadeIn 100ms ease'
    }} onClick={e => e.stopPropagation()}>
      {/* Header: show folder name */}
      <div style={{ padding: '6px 12px', fontSize: '11px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontStyle: 'italic', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
        <FolderOpen size={11} style={{ flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{assetContextMenu.file.name}</span>
      </div>

      {/* Copy folder path (URL) */}
      <button
        className="btn btn-text"
        style={{ justifyContent: 'flex-start', padding: '8px 14px', fontSize: '12px', width: '100%', gap: '8px', borderRadius: 0 }}
        onClick={() => {
          onCopyPath(assetContextMenu.file);
          onClose();
        }}
      >
        <Copy size={13} /> Copy URL
      </button>

      {/* Regenerate thumbnail — only meaningful for USD deliverables */}
      <button
        className="btn btn-text"
        style={{ justifyContent: 'flex-start', padding: '8px 14px', fontSize: '12px', width: '100%', gap: '8px', borderRadius: 0 }}
        onClick={() => {
          onRegenerateThumbnail(assetContextMenu.file);
          onClose();
        }}
      >
        <Sparkles size={13} style={{ color: 'var(--color-usd)' }} /> Force Regenerate Preview
      </button>

      {/* Delete deliverable */}
      <button
        className="btn btn-text"
        style={{ 
          justifyContent: 'flex-start', 
          padding: '8px 14px', 
          fontSize: '12px', 
          width: '100%', 
          gap: '8px', 
          borderTop: '1px solid var(--border)', 
          borderRadius: 0, 
          color: 'var(--color-danger)'
        }}
        onClick={() => {
          onDeleteDeliverable(assetContextMenu.file);
          onClose();
        }}
      >
        <Trash2 size={13} /> Delete Deliverable...
      </button>
    </div>
  );
}
