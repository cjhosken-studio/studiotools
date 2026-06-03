import { useState } from 'react';
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
  Terminal,
  Eye,
  EyeOff,
  Shapes,
  Palette,
  Workflow,
  Scissors,
  Layout,
  Play,
  Flame,
  Sun,
  Wrench
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
  const [showDisabled, setShowDisabled] = useState(false);
  
  const getNodeIcon = (type: string, subtype: string, isDisabled?: boolean) => {
    const color = isDisabled ? 'var(--text-muted)' : undefined;
    if (type === 'project') return <Layers size={14} style={{ color: color || 'var(--color-usd)' }} />;
    if (type === 'taskarea') {
      if (subtype === 'shot') return <Film size={14} style={{ color: color || 'hsl(190, 95%, 45%)' }} />;
      if (subtype === 'asset') return <Box size={14} style={{ color: color || 'hsl(280, 85%, 65%)' }} />;
      return <Folder size={14} style={{ color }} />;
    }
    if (type === 'task') {
      const sub = subtype.toLowerCase();
      if (sub === 'model') return <Shapes size={14} style={{ color: color || 'hsl(200, 85%, 60%)' }} />;
      if (sub === 'lookdev') return <Palette size={14} style={{ color: color || 'hsl(285, 80%, 65%)' }} />;
      if (sub === 'rig') return <Workflow size={14} style={{ color: color || 'hsl(145, 75%, 50%)' }} />;
      if (sub === 'groom') return <Scissors size={14} style={{ color: color || 'hsl(32, 95%, 55%)' }} />;
      if (sub === 'layout') return <Layout size={14} style={{ color: color || 'hsl(45, 95%, 50%)' }} />;
      if (sub === 'animate') return <Play size={14} style={{ color: color || 'hsl(180, 90%, 50%)' }} />;
      if (sub === 'fx') return <Flame size={14} style={{ color: color || 'hsl(15, 95%, 50%)' }} />;
      if (sub === 'light') return <Sun size={14} style={{ color: color || 'hsl(60, 95%, 60%)' }} />;
      if (sub === 'comp') return <Layers size={14} style={{ color: color || 'hsl(340, 90%, 55%)' }} />;
      if (sub === 'tool') return <Wrench size={14} style={{ color: color || 'hsl(215, 15%, 60%)' }} />;
      return <Terminal size={14} style={{ color: color || 'var(--text-secondary)' }} />;
    }
    return <Folder size={14} style={{ color }} />;
  };

  const renderTree = (node: TreeNode): React.ReactNode => {
    if (node.disabled && !showDisabled) {
      return null;
    }

    const isExpanded = !!expandedNodes[node.path];
    const isSelected = selectedNode?.path === node.path;
    const visibleChildren = node.children ? node.children.filter(child => !child.disabled || showDisabled) : [];
    const hasVisibleChildren = visibleChildren.length > 0;

    return (
      <div key={node.path} style={{ margin: '2px 0' }}>
        <div 
          className={`tree-node ${isSelected ? 'active' : ''}`}
          onClick={() => {
            setSelectedNode(node);
            setActiveUSDPath(null); // Reset USD view on switching nodes
          }}
          onContextMenu={(e) => onNodeContextMenu(node, e)}
          style={{ 
            paddingLeft: '8px',
            opacity: node.disabled ? 0.5 : 1,
            color: node.disabled ? 'var(--text-muted)' : 'inherit',
            fontStyle: node.disabled ? 'italic' : 'normal',
            textDecoration: node.disabled ? 'line-through' : 'none'
          }}
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
            {hasVisibleChildren ? (isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />) : <span style={{ width: 12 }} />}
          </span>
          {getNodeIcon(node.type, node.subtype, node.disabled)}
          <span style={{ fontSize: '12.5px', fontWeight: isSelected ? 500 : 400 }}>{node.name}</span>
        </div>
        {hasVisibleChildren && isExpanded && (
          <div style={{ marginLeft: '12px', borderLeft: '1px solid var(--border)', paddingLeft: '4px' }}>
            {visibleChildren.map(child => renderTree(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Pipeline Tree</h2>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button 
            type="button"
            className="btn btn-text" 
            onClick={() => setShowDisabled(!showDisabled)}
            title={showDisabled ? "Hide Disabled Items" : "Show Disabled Items"}
            style={{ 
              padding: '4px',
              color: showDisabled ? 'var(--color-usd)' : 'var(--text-secondary)',
              background: showDisabled ? 'rgba(0, 240, 255, 0.05)' : 'transparent',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {showDisabled ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          
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
