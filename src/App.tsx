import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FolderPlus,
  Plus, 
  File, 
  Terminal, 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  Layout, 
  Sparkles, 
  Box, 
  Film, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import USDInspector from './components/USDInspector';

interface Project {
  name: string;
  path: string;
}

interface TreeNode {
  name: string;
  path: string;
  type: string;
  subtype: string;
  children: TreeNode[];
  files: Array<{
    name: string;
    relativePath: string;
    absolutePath: string;
    category: string;
    ext: string;
    thumbnailPath?: string;
    appVersion?: string;
    application?: string;
  }>;
}

interface Application {
  name: string;
  appType: string;
  executable: string;
  installed: boolean;
  extensions: string[];
  icon: string;
}

export default function App() {
  // Projects states
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [projectTree, setProjectTree] = useState<TreeNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);

  // Modals & Forms
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // New item inputs
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPath, setNewProjectPath] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderType, setNewFolderType] = useState('folder');
  const [newFolderSubtype, setNewFolderSubtype] = useState('shot');
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskSubtype, setNewTaskSubtype] = useState('model');

  // UI state
  const [loading, setLoading] = useState(false);
  const [launchingApp, setLaunchingApp] = useState<string | null>(null);
  const [activeUSDPath, setActiveUSDPath] = useState<string | null>(null);
  const [selectedUSDVersions, setSelectedUSDVersions] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: TreeNode } | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const handleCloseMenu = () => setContextMenu(null);
    window.addEventListener('click', handleCloseMenu);
    return () => window.removeEventListener('click', handleCloseMenu);
  }, []);

  const handleNodeContextMenu = (node: TreeNode, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node: node
    });
  };

  useEffect(() => {
    if (activeProject) {
      fetchProjectTree(activeProject.path);
      fetchApplications(activeProject.path);
      setActiveUSDPath(null);
    } else {
      setProjectTree(null);
      setSelectedNode(null);
      setApplications([]);
    }
  }, [activeProject]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      setProjects(data);
      if (data.length > 0 && !activeProject) {
        setActiveProject(data[0]);
      }
    } catch (err) {
      showToast('Failed to fetch projects list', 'error');
    }
  };

  const fetchProjectTree = async (path: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/project-tree?path=${encodeURIComponent(path)}`);
      if (response.ok) {
        const data = await response.json();
        setProjectTree(data);
        // Expand root by default
        setExpandedNodes(prev => ({ ...prev, [data.path]: true }));
        
        // Retain selection if exists, else select root
        if (selectedNode) {
          const findNode = (node: TreeNode): TreeNode | null => {
            if (node.path === selectedNode.path) return node;
            for (const child of node.children) {
              const found = findNode(child);
              if (found) return found;
            }
            return null;
          };
          const updated = findNode(data);
          setSelectedNode(updated || data);
        } else {
          setSelectedNode(data);
        }
      }
    } catch (err) {
      showToast('Failed to load project structure', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async (path: string) => {
    try {
      const response = await fetch(`/api/applications?projectPath=${encodeURIComponent(path)}`);
      const data = await response.json();
      setApplications(data);
    } catch (err) {
      showToast('Failed to scan system software', 'error');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName || !newProjectPath) return;

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName, path: newProjectPath })
      });
      if (response.ok) {
        showToast('Project registered successfully!');
        setNewProjectName('');
        setNewProjectPath('');
        setIsProjectModalOpen(false);
        await fetchProjects();
        // Activate new project
        const fresh = { name: newProjectName, path: newProjectPath };
        setActiveProject(fresh);
      } else {
        const err = await response.json();
        showToast(err.detail || 'Failed to create project', 'error');
      }
    } catch (err) {
      showToast('Server error while registering project', 'error');
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNode || !newFolderName) return;

    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentPath: selectedNode.path,
          name: newFolderName,
          type: newFolderType,
          subtype: newFolderSubtype
        })
      });
      if (response.ok) {
        showToast('Folder created!');
        setNewFolderName('');
        setIsFolderModalOpen(false);
        if (activeProject) fetchProjectTree(activeProject.path);
      } else {
        const err = await response.json();
        showToast(err.detail || 'Failed to create folder', 'error');
      }
    } catch (err) {
      showToast('Server error while creating folder', 'error');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNode || !newTaskName) return;

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentPath: selectedNode.path,
          name: newTaskName,
          subtype: newTaskSubtype
        })
      });
      if (response.ok) {
        showToast('Task area successfully initialized!');
        setNewTaskName('');
        setIsTaskModalOpen(false);
        if (activeProject) fetchProjectTree(activeProject.path);
      } else {
        const err = await response.json();
        showToast(err.detail || 'Failed to create task', 'error');
      }
    } catch (err) {
      showToast('Server error while creating task', 'error');
    }
  };

  const handleLaunchApp = async (app: Application) => {
    if (!selectedNode || selectedNode.type !== 'task') return;

    // Direct web viewer inspect trigger
    if (app.appType === 'usd_web') {
      const usdFile = selectedNode.files.find(f => f.ext === 'usd' || f.ext === 'usda');
      if (usdFile) {
        setActiveUSDPath(usdFile.absolutePath);
        showToast(`Inspecting USD Scene: ${usdFile.name}`);
      } else {
        showToast('No USD file found in this task to inspect. Initialize one below!', 'error');
      }
      return;
    }

    setLaunchingApp(app.name);
    try {
      const response = await fetch('/api/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName: app.name,
          appType: app.appType,
          executable: app.executable,
          taskPath: selectedNode.path
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        showToast(data.message || `${app.name} launched successfully!`);
        if (activeProject) fetchProjectTree(activeProject.path);
      } else {
        showToast(data.detail || `Failed to launch ${app.name}`, 'error');
      }
    } catch (err) {
      showToast('Error sending launch command to server', 'error');
    } finally {
      setTimeout(() => setLaunchingApp(null), 2500);
    }
  };

  const handleLoadInDCC = async (appType: string, filePath: string) => {
    try {
      const parts = filePath.split('/');
      let taskPath = "";
      const idx = parts.findIndex(p => p === 'wip' || p === 'published' || p === 'versions');
      if (idx !== -1) {
        taskPath = parts.slice(0, idx).join('/');
      } else {
        taskPath = selectedNode ? selectedNode.path : filePath.substring(0, filePath.lastIndexOf('/'));
      }
      
      const response = await fetch('/api/sessions/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appType,
          taskPath,
          command: 'load_usd',
          argument: filePath
        })
      });
      
      if (response.ok) {
        showToast(`Sent load asset command to active ${appType} session!`);
      } else {
        const err = await response.json();
        showToast(err.detail || 'Failed to send load asset command', 'error');
      }
    } catch (err) {
      showToast('Error connecting to active session', 'error');
    }
  };

  const handleInitializeUSD = async () => {
    if (!selectedNode || selectedNode.type !== 'task') return;
    
    // Create new usd stage path
    const usdPath = `${selectedNode.path}/wip/scene_v001.usda`;
    try {
      const response = await fetch(`/api/usd/create?path=${encodeURIComponent(usdPath)}`, { method: 'POST' });
      if (response.ok) {
        showToast('Created base USD asset!');
        if (activeProject) fetchProjectTree(activeProject.path);
      } else {
        showToast('Failed to create base USD asset', 'error');
      }
    } catch (err) {
      showToast('Server error during USD creation', 'error');
    }
  };

  const toggleNodeExpand = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({ ...prev, [path]: !prev[path] }));
  };

  // Node styles and icons based on pipeline types
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
          onContextMenu={(e) => handleNodeContextMenu(node, e)}
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      
      {/* Top Banner Header */}
      <header className="header">
        <div className="logo-container">
          <Layers size={22} style={{ color: 'var(--color-usd)' }} />
          <span className="logo-text">STUDIO TOOLS</span>
          <span className="logo-badge">USD STAGE v2</span>
        </div>
        
        {/* Project Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Project Context:</span>
          {projects.length > 0 ? (
            <select 
              className="form-select"
              value={activeProject?.path || ''}
              onChange={(e) => {
                const found = projects.find(p => p.path === e.target.value);
                if (found) setActiveProject(found);
              }}
              style={{ background: 'var(--bg-app)', padding: '5px 10px', fontSize: '12.5px' }}
            >
              {projects.map(p => (
                <option key={p.path} value={p.path}>{p.name}</option>
              ))}
            </select>
          ) : (
            <button className="btn btn-primary" onClick={() => setIsProjectModalOpen(true)} style={{ padding: '4px 10px', fontSize: '11.5px' }}>
              Create Project
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="app-container">
        
        {/* LEFT PANEL: Hierarchy tree */}
        <div className="panel">
          <div className="panel-header">
            <h2>Pipeline Tree</h2>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                className="btn btn-text" 
                onClick={() => setIsFolderModalOpen(true)} 
                disabled={!selectedNode || selectedNode.type === 'task'}
                title="Create Folder/TaskArea"
                style={{ padding: '4px' }}
              >
                <FolderPlus size={16} />
              </button>
              <button 
                className="btn btn-text" 
                onClick={() => setIsTaskModalOpen(true)} 
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
              onClick={() => setIsProjectModalOpen(true)} 
              style={{ width: '100%', fontSize: '12px' }}
            >
              New / Import Project
            </button>
          </div>
        </div>

        {/* CENTER PANEL: Main application or USD viewer */}
        <div className="panel">
          {activeUSDPath ? (
            <USDInspector filePath={activeUSDPath} onClose={() => setActiveUSDPath(null)} />
          ) : (
            <>
              <div className="panel-header">
                <h2>Workspace Content</h2>
                {selectedNode && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Type: {selectedNode.type} {selectedNode.subtype !== 'custom' && `(${selectedNode.subtype})`}
                  </span>
                )}
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {selectedNode ? (
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Selected Node Details */}
                    <div>
                      <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{selectedNode.name}</h1>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{selectedNode.path}</p>
                    </div>

                    {/* Applications Launcher Section (For Tasks) */}
                    {selectedNode.type === 'task' ? (
                      <div className="panel" style={{ background: 'var(--bg-card)' }}>
                        <div className="panel-header" style={{ height: '36px', padding: '0 12px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Launch DCC Software</span>
                        </div>
                        <div className="app-grid">
                          {applications.map(app => {
                            const isLaunching = launchingApp === app.name;
                            return (
                              <div 
                                key={app.name} 
                                className={`app-card app-${app.appType} ${isLaunching ? 'launching-pulse' : ''}`}
                                onClick={() => handleLaunchApp(app)}
                                style={{ 
                                  opacity: app.installed ? 1 : 0.5,
                                  cursor: 'pointer'
                                }}
                              >
                                <Layers size={28} style={{ color: app.appType === 'usd_web' ? 'var(--color-usd)' : (app.appType === 'blender' ? 'var(--color-blender)' : (app.appType === 'houdini' ? 'var(--color-houdini)' : 'var(--color-nuke)')) }} />
                                <span className="app-card-title">{app.name}</span>
                                <span className="app-card-status">
                                  {isLaunching ? 'Launching...' : (app.installed ? 'Launch App' : 'Not Installed')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '24px', border: '1px dashed var(--border)', borderRadius: '8px', textAlign: 'center', background: 'var(--bg-card)' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Navigational Folder</h3>
                        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
                          Please navigate down the hierarchy and select a specific **Task** (e.g. model, lookdev) to launch applications and manage assets.
                        </p>
                      </div>
                    )}

                    {/* Files Section (For Tasks) */}
                    {selectedNode.type === 'task' && (() => {
                      const workfiles = selectedNode.files.filter(f => f.category === 'wip' || f.category === 'versions');
                      const publishedFiles = selectedNode.files.filter(f => f.category === 'published' && f.name !== 'thumbnail.png');
                      
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          {/* 1. Workfiles Section */}
                          <div>
                            <h4 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                              Working Scenes (WIP / History)
                            </h4>
                            {workfiles.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {workfiles.map(file => (
                                  <div 
                                    key={file.absolutePath}
                                    style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'space-between',
                                      padding: '10px 14px', 
                                      background: 'var(--bg-card)', 
                                      border: '1px solid var(--border)', 
                                      borderRadius: '6px' 
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <File size={16} style={{ color: 'var(--text-secondary)' }} />
                                      <div>
                                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>{file.name}</span>
                                        <span style={{ 
                                          fontSize: '9px', 
                                          marginLeft: '8px', 
                                          background: 'rgba(234, 137, 36, 0.15)', 
                                          padding: '1px 6px', 
                                          borderRadius: '3px',
                                          color: 'var(--color-blender)',
                                          textTransform: 'uppercase'
                                        }}>
                                          {file.category}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 12px', border: '1px dashed var(--border)', borderRadius: '6px', background: 'rgba(255,255,255,0.01)' }}>
                                No active working scenes found. Launch a DCC to create one.
                              </div>
                            )}
                          </div>

                          {/* 2. Published USD Deliverables */}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                              <h4 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Published USD Assets (Deliverables)
                              </h4>
                              {publishedFiles.length === 0 && (
                                <button className="btn btn-primary" onClick={handleInitializeUSD} style={{ padding: '4px 10px', fontSize: '11px' }}>
                                  Initialize Empty USD Asset
                                </button>
                              )}
                            </div>
                            {publishedFiles.length > 0 ? (() => {
                              // Group published assets by their Base Asset Name
                              const groupedAssets: Record<string, typeof publishedFiles> = {};
                              
                              publishedFiles.forEach(file => {
                                const baseName = file.name.replace(/\.[^/.]+$/, ""); // Strip extension
                                const match = baseName.match(/^(.+)_v(\d+)$/);
                                const assetKey = match ? match[1] : baseName;
                                
                                if (!groupedAssets[assetKey]) {
                                  groupedAssets[assetKey] = [];
                                }
                                groupedAssets[assetKey].push(file);
                              });
                              
                              // Sort versions for each asset in descending order (highest version first)
                              Object.keys(groupedAssets).forEach(assetKey => {
                                groupedAssets[assetKey].sort((a, b) => {
                                  const aBase = a.name.replace(/\.[^/.]+$/, "");
                                  const bBase = b.name.replace(/\.[^/.]+$/, "");
                                  const aMatch = aBase.match(/_v(\d+)$/);
                                  const bMatch = bBase.match(/_v(\d+)$/);
                                  const aVer = aMatch ? parseInt(aMatch[1]) : 0;
                                  const bVer = bMatch ? parseInt(bMatch[1]) : 0;
                                  return bVer - aVer; // Descending
                                });
                              });
                              
                              return (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                                  {Object.keys(groupedAssets).map(assetKey => {
                                    const versionsList = groupedAssets[assetKey];
                                    const latestFile = versionsList[0];
                                    
                                    // Retrieve selected version file path, or default to the latest file's absolute path
                                    const selectedPath = selectedUSDVersions[assetKey] || latestFile.absolutePath;
                                    const currentFile = versionsList.find(f => f.absolutePath === selectedPath) || latestFile;
                                    
                                    const isUSD = currentFile.ext === 'usd' || currentFile.ext === 'usda' || currentFile.ext === 'usdc';
                                    const hasThumb = !!currentFile.thumbnailPath;
                                    const thumbUrl = hasThumb 
                                      ? `/api/usd/thumbnail?path=${encodeURIComponent(currentFile.thumbnailPath!)}` 
                                      : null;
                                      
                                    // Format software attribution (Only show DCC software and version, e.g. "Blender 5.1.2")
                                    let dccAttribution = "USD Asset";
                                    if (currentFile.application) {
                                      const appTitle = currentFile.application.charAt(0).toUpperCase() + currentFile.application.slice(1).toLowerCase();
                                      const appVer = currentFile.appVersion ? ` ${currentFile.appVersion}` : '';
                                      dccAttribution = `${appTitle}${appVer}`;
                                    } else {
                                      // Fallback guess from path
                                      const isBlender = currentFile.relativePath.toLowerCase().includes("blender") || currentFile.name.toLowerCase().includes("blend");
                                      const isHoudini = currentFile.relativePath.toLowerCase().includes("houdini") || currentFile.name.toLowerCase().includes("hip");
                                      if (isBlender) dccAttribution = "Blender";
                                      else if (isHoudini) dccAttribution = "Houdini";
                                    }

                                    return (
                                      <div 
                                        key={assetKey}
                                        className="showcase-card"
                                        style={{ 
                                          display: 'flex', 
                                          flexDirection: 'column',
                                          background: 'var(--bg-card)', 
                                          border: '1px solid var(--border)', 
                                          borderRadius: '8px',
                                          overflow: 'hidden',
                                          transition: 'all 200ms ease',
                                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                                          position: 'relative'
                                        }}
                                      >
                                        {/* Visual Image Banner */}
                                        <div style={{ aspectRatio: '16/9', width: '100%', overflow: 'hidden', background: 'var(--bg-app)', borderBottom: '1px solid var(--border)', position: 'relative' }}>
                                          {hasThumb ? (
                                            <img 
                                              src={thumbUrl!} 
                                              alt={currentFile.name}
                                              style={{ 
                                                height: '100%', 
                                                width: '100%', 
                                                objectFit: 'cover',
                                                transition: 'transform 300ms ease'
                                              }}
                                              className="showcase-image"
                                            />
                                          ) : (
                                            // Geometric fallback for non-USD assets
                                            <div style={{ 
                                              height: '100%', 
                                              width: '100%', 
                                              display: 'flex', 
                                              flexDirection: 'column', 
                                              alignItems: 'center', 
                                              justifyContent: 'center',
                                              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                                              color: 'var(--text-muted)',
                                              gap: '8px'
                                            }}>
                                              <File size={32} style={{ color: 'var(--text-secondary)' }} />
                                              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{currentFile.name}</span>
                                            </div>
                                          )}
                                          
                                          {/* Published Label Tag */}
                                          <div style={{ 
                                            position: 'absolute', 
                                            top: '8px', 
                                            left: '8px',
                                            background: 'rgba(10, 15, 26, 0.8)', 
                                            backdropFilter: 'blur(4px)',
                                            padding: '2px 8px', 
                                            borderRadius: '4px',
                                            border: '1px solid rgba(0, 240, 255, 0.25)',
                                            color: 'var(--color-usd)',
                                            fontSize: '9px',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                          }}>
                                            {dccAttribution}
                                          </div>
                                          
                                          {/* Version Dropdown Selector */}
                                          {versionsList.length > 1 && (
                                            <div style={{ position: 'absolute', top: '8px', right: '8px' }} onClick={e => e.stopPropagation()}>
                                              <select 
                                                value={selectedPath}
                                                onChange={(e) => {
                                                  setSelectedUSDVersions(prev => ({
                                                    ...prev,
                                                    [assetKey]: e.target.value
                                                  }));
                                                }}
                                                style={{ 
                                                  background: 'rgba(10, 15, 26, 0.85)', 
                                                  backdropFilter: 'blur(4px)',
                                                  border: '1px solid var(--border-light)',
                                                  borderRadius: '4px',
                                                  color: '#fff',
                                                  fontSize: '10px',
                                                  padding: '2px 4px',
                                                  fontWeight: 500,
                                                  outline: 'none',
                                                  cursor: 'pointer'
                                                }}
                                              >
                                                {versionsList.map((verFile, idx) => {
                                                  const verBaseName = verFile.name.replace(/\.[^/.]+$/, "");
                                                  const verMatch = verBaseName.match(/_v(\d+)$/);
                                                  const verStr = verMatch ? `v${verMatch[1]}` : verBaseName;
                                                  const isLatest = idx === 0;
                                                  return (
                                                    <option key={verFile.absolutePath} value={verFile.absolutePath}>
                                                      {verStr}{isLatest ? " (Latest)" : ""}
                                                    </option>
                                                  );
                                                })}
                                              </select>
                                            </div>
                                          )}
                                        </div>

                                        {/* Details Panel */}
                                        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={assetKey}>
                                              {assetKey}
                                            </span>
                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }} title={currentFile.relativePath}>
                                              {currentFile.relativePath}
                                            </span>
                                          </div>

                                          {/* Action buttons list */}
                                          {isUSD && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'auto' }}>
                                              <button 
                                                className="btn btn-primary"
                                                onClick={() => setActiveUSDPath(currentFile.absolutePath)}
                                                style={{ width: '100%', padding: '6px', fontSize: '12px', fontWeight: 500 }}
                                              >
                                                Inspect 3D Stage
                                              </button>
                                              
                                              <div style={{ display: 'flex', gap: '6px' }}>
                                                <button 
                                                  className="btn"
                                                  onClick={() => handleLoadInDCC('blender', currentFile.absolutePath)}
                                                  style={{ 
                                                    flex: 1,
                                                    padding: '5px', 
                                                    fontSize: '11px',
                                                    background: 'rgba(234, 137, 36, 0.15)',
                                                    border: '1px solid rgba(234, 137, 36, 0.4)',
                                                    color: 'var(--color-blender)',
                                                    fontWeight: 500
                                                  }}
                                                  title="Load USD directly in Blender viewport"
                                                >
                                                  → Blender
                                                </button>
                                                <button 
                                                  className="btn"
                                                  onClick={() => handleLoadInDCC('houdini', currentFile.absolutePath)}
                                                  style={{ 
                                                    flex: 1,
                                                    padding: '5px', 
                                                    fontSize: '11px',
                                                    background: 'rgba(236, 90, 60, 0.15)',
                                                    border: '1px solid rgba(236, 90, 60, 0.4)',
                                                    color: 'var(--color-houdini)',
                                                    fontWeight: 500
                                                  }}
                                                  title="Load USD directly in Houdini stage network"
                                                >
                                                  → Houdini
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })() : (
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 12px', border: '1px dashed var(--border)', borderRadius: '6px', background: 'rgba(255,255,255,0.01)' }}>
                                No published assets found. Export from Blender or Houdini to publish.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '12px' }}>
                    <Layout size={32} />
                    <span>Select a node in the Pipeline Tree to load workspace details.</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* RIGHT PANEL: Metadata Inspector */}
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

      </div>

      {/* TOAST SYSTEM */}
      {toast && (
        <div style={{ 
          position: 'fixed', 
          bottom: '20px', 
          right: '20px', 
          background: toast.type === 'success' ? 'var(--bg-panel)' : 'hsl(355, 85%, 10%)',
          border: `1px solid ${toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'}`,
          padding: '12px 20px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
          zIndex: 1000,
          animation: 'slideUp 180ms ease'
        }}>
          {toast.type === 'success' ? <CheckCircle size={16} style={{ color: 'var(--color-success)' }} /> : <AlertCircle size={16} style={{ color: 'var(--color-danger)' }} />}
          <span style={{ fontSize: '12.5px', fontWeight: 500 }}>{toast.message}</span>
        </div>
      )}

      {/* MODAL 1: Create Project */}
      {isProjectModalOpen && (
        <div className="modal-overlay" onClick={() => setIsProjectModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="panel-header">
              <h2>New Project</h2>
            </div>
            <form onSubmit={handleCreateProject} style={{ padding: '20px' }}>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  placeholder="e.g. Mech Warrior" 
                  value={newProjectName}
                  onChange={e => {
                    setNewProjectName(e.target.value);
                    if (!newProjectPath) {
                      // Autocomplete path
                      setNewProjectPath(`/home/cjhosken/dev/studiotools/projects/${e.target.value.toLowerCase().replace(/\s+/g, '_')}`);
                    }
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Filsystem Directory Path</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  placeholder="/absolute/path/to/project" 
                  value={newProjectPath}
                  onChange={e => setNewProjectPath(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn" onClick={() => setIsProjectModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create & Contextualize</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Folder/TaskArea */}
      {isFolderModalOpen && (
        <div className="modal-overlay" onClick={() => setIsFolderModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="panel-header">
              <h2>New Folder / Area</h2>
            </div>
            <form onSubmit={handleCreateFolder} style={{ padding: '20px' }}>
              <div className="form-group">
                <label className="form-label">Folder Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  placeholder="e.g. shot_010 or hero_character" 
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category Node Type</label>
                <select className="form-select" value={newFolderType} onChange={e => setNewFolderType(e.target.value)}>
                  <option value="folder">Standard structural folder</option>
                  <option value="taskarea">Task Area (Asset / Shot collection)</option>
                </select>
              </div>
              {newFolderType === 'taskarea' && (
                <div className="form-group">
                  <label className="form-label">Task Area Subtype</label>
                  <select className="form-select" value={newFolderSubtype} onChange={e => setNewFolderSubtype(e.target.value)}>
                    <option value="shot">Film Shot Sequence (scenes, sequences)</option>
                    <option value="asset">3D VFX Asset (props, characters, environments)</option>
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn" onClick={() => setIsFolderModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Folder</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Create Task */}
      {isTaskModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTaskModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="panel-header">
              <h2>Initialize VFX Task</h2>
            </div>
            <form onSubmit={handleCreateTask} style={{ padding: '20px' }}>
              <div className="form-group">
                <label className="form-label">Task Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  placeholder="e.g. model, texture, fx, rig, comp" 
                  value={newTaskName}
                  onChange={e => {
                    setNewTaskName(e.target.value);
                    setNewTaskSubtype(e.target.value.toLowerCase());
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Pipeline Subtype</label>
                <select className="form-select" value={newTaskSubtype} onChange={e => setNewTaskSubtype(e.target.value)}>
                  <option value="model">Modeling (3D Mesh creation)</option>
                  <option value="lookdev">LookDev & Materials (USD Shaders)</option>
                  <option value="rig">Rigging & Skeletal Bones</option>
                  <option value="groom">Groom & Hair</option>
                  <option value="layout">Layout (USD Scene construction)</option>
                  <option value="animate">Animation</option>
                  <option value="fx">FX (Simulations, fire, water)</option>
                  <option value="light">Lighting & Rendering</option>
                  <option value="comp">Compositing (2D integration)</option>
                  <option value="tool">VFX Tools / Utilities</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn" onClick={() => setIsTaskModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Initialize Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONTEXT MENU */}
      {contextMenu && (
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
        }}>
          {contextMenu.node.type !== 'task' ? (
            <>
              <button 
                className="btn btn-text" 
                style={{ justifyContent: 'flex-start', padding: '8px 14px', fontSize: '12px', width: '100%', gap: '8px', borderRadius: 0 }}
                onClick={() => {
                  setSelectedNode(contextMenu.node);
                  setNewFolderType('folder');
                  setIsFolderModalOpen(true);
                }}
              >
                <FolderPlus size={13} /> Add Subfolder...
              </button>
              <button 
                className="btn btn-text" 
                style={{ justifyContent: 'flex-start', padding: '8px 14px', fontSize: '12px', width: '100%', gap: '8px', borderRadius: 0 }}
                onClick={() => {
                  setSelectedNode(contextMenu.node);
                  setNewFolderType('taskarea');
                  setNewFolderSubtype('shot');
                  setIsFolderModalOpen(true);
                }}
              >
                <Plus size={13} /> Add Task Area...
              </button>
              <button 
                className="btn btn-text" 
                style={{ justifyContent: 'flex-start', padding: '8px 14px', fontSize: '12px', width: '100%', gap: '8px', borderRadius: 0 }}
                onClick={() => {
                  setSelectedNode(contextMenu.node);
                  setIsTaskModalOpen(true);
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
          <button 
            className="btn btn-text" 
            style={{ justifyContent: 'flex-start', padding: '8px 14px', fontSize: '12px', width: '100%', gap: '8px', borderTop: '1px solid var(--border)', borderRadius: 0 }}
            onClick={() => {
              setSelectedNode(contextMenu.node);
              setActiveUSDPath(null);
            }}
          >
            Select Item
          </button>
        </div>
      )}

    </div>
  );
}
