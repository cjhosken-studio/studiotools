import type { MouseEvent } from 'react';
import { 
  Folder, 
  FolderPlus,
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  Box, 
  Film, 
  Terminal 
} from 'lucide-react';
import type { TreeNode } from '../types';

interface PipelineTreeProps {
  projectTree: TreeNode | null;
  selectedNode: TreeNode | null;
  setSelectedNode: (node: TreeNode | null) => void;
  setActiveUSDPath: (path: string | null) => void;
  loading: boolean;
  expandedNodes: Record<string, boolean>;
  toggleNodeExpand: (path: string, e: MouseEvent) => void;
  onOpenFolderModal: () => void;
  onOpenTaskModal: () => void;
  onOpenProjectModal: () => void;
  onNodeContextMenu: (node: TreeNode, e: MouseEvent) => void;
}

export default function PipelineTree({
  projectTree,
  selectedNode,
  setSelectedNode,
  setActiveUSDPath,
  loading,
  expandedNodes,
  toggleNodeExpand,
  onOpenFolderModal,
  onOpenTaskModal,
  onOpenProjectModal,
  onNodeContextMenu,
}: PipelineTreeProps) {
  
  const getNodeIcon = (type: string, subtype: string) => {
    if (type === 'project') return <Layers size={14} style={{ color: 'var(--color-usd)' }} />;
    if (type === 'taskarea') {
      if (subtype === 'shot') return <Film size={14} style={{ color: 'hsl(190, 95%, 45%)' }} />;
      if (subtype === 'asset') return <Box size={14} style={{ color: 'hsl(280, 85%, 65%)' }} />;
      return <Folder size={14} />;
    }
    if (type === 'task') return <Terminal size={14} style={{ color: 'var(--color-blender)' }} />;
    return <Folder size={14} />;
  };

  const renderTree = (node: TreeNode) => {
    const isExpanded = !!expandedNodes[node.path];
    const isSelected = selectedNode?.path === node.path;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.path} style={{ margin: '2px 0' }}>
        <div 
          className={`tree-node ${isSelected ? 'active' : ''}`}
          onClick={() => {
            setSelectedNode(node);
            setActiveUSDPath(null); // Reset USD view on switching nodes
          }}
          onContextMenu={(e) => onNodeContextMenu(node, e)}
          style={{ paddingLeft: '8px' }}
        >
          <span 
            onClick={(e) => toggleNodeExpand(node.path, e)}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '16px', 
              cursor: 'pointer' 
            }}
          >
            {hasChildren ? (isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />) : <span style={{ width: 12 }} />}
          </span>
          {getNodeIcon(node.type, node.subtype)}
          <span style={{ fontSize: '12.5px', fontWeight: isSelected ? 500 : 400 }}>{node.name}</span>
        </div>
        {hasChildren && isExpanded && (
          <div style={{ marginLeft: '12px', borderLeft: '1px solid var(--border)', paddingLeft: '4px' }}>
            {node.children.map(child => renderTree(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Pipeline Tree</h2>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button 
            className="btn btn-text" 
            onClick={onOpenFolderModal} 
            disabled={!selectedNode || selectedNode.type === 'task'}
            title="Create Folder/TaskArea"
            style={{ padding: '4px' }}
          >
            <FolderPlus size={16} />
          </button>
          <button 
            className="btn btn-text" 
            onClick={onOpenTaskModal} 
            disabled={!selectedNode || selectedNode.type === 'task'}
            title="Create Task"
            style={{ padding: '4px' }}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {loading && !projectTree ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
            <div style={{ width: '20px', height: '20px', border: '2px solid var(--border)', borderTopColor: 'var(--color-usd)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : projectTree ? (
          renderTree(projectTree)
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '12px' }}>
            No active project selected. Register a project context first.
          </div>
        )}
      </div>
      
      {/* Create Project Button */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
        <button 
          className="btn" 
          onClick={onOpenProjectModal} 
          style={{ width: '100%', fontSize: '12px' }}
        >
          New / Import Project
        </button>
      </div>
    </div>
  );
}
