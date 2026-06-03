import React, { useState, useEffect } from 'react';
import type { Project, ProjectFile, TreeNode, Application } from './types';
import Header from './components/Header';
import PipelineTree from './components/PipelineTree';
import WorkspaceContent from './components/WorkspaceContent';
import DetailedInspector from './components/DetailedInspector';
import { ProjectModal, FolderModal, TaskModal, ProjectSettingsModal } from './components/Modals';
import { NodeContextMenu, AssetContextMenu } from './components/ContextMenus';
import Toast from './components/Toast';

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
  const [isProjectSettingsModalOpen, setIsProjectSettingsModalOpen] = useState(false);

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
  const [assetContextMenu, setAssetContextMenu] = useState<{ x: number; y: number; file: ProjectFile } | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const handleCloseMenu = () => {
      setContextMenu(null);
      setAssetContextMenu(null);
    };
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

  const handleAssetContextMenu = (file: ProjectFile, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAssetContextMenu({
      x: e.clientX,
      y: e.clientY,
      file: file
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

  useEffect(() => {
    if (activeProject) {
      localStorage.setItem('st_last_project_path', activeProject.path);
    } else {
      localStorage.removeItem('st_last_project_path');
    }
  }, [activeProject]);

  useEffect(() => {
    if (!activeProject) return;
    
    // Background polling: silently refresh the project tree every 3 seconds to auto-refresh
    const interval = setInterval(() => {
      fetchProjectTree(activeProject.path, true);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [activeProject, selectedNode]);

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
        const lastClosedPath = localStorage.getItem('st_last_project_path');
        const lastClosedProject = lastClosedPath ? data.find((p: Project) => p.path === lastClosedPath) : null;
        if (lastClosedProject) {
          setActiveProject(lastClosedProject);
        } else {
          const firstActive = data.find((p: Project) => !p.archived);
          setActiveProject(firstActive || data[0]);
        }
      }
    } catch (err) {
      showToast('Failed to fetch projects list', 'error');
    }
  };

  const fetchProjectTree = async (path: string, silent = false) => {
    if (!silent) setLoading(true);
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
      if (!silent) showToast('Failed to load project structure', 'error');
    } finally {
      if (!silent) setLoading(false);
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

    setLaunchingApp(app.name);
    try {
      const response = await fetch('/api/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName: app.name,
          appType: app.appType,
          executable: app.executable,
          taskPath: selectedNode.path,
          startupScript: app.startupScript
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        showToast(data.message || `${app.name} launched successfully!`);
        if (activeProject) fetchProjectTree(activeProject.path, true);
      } else {
        showToast(data.detail || `Failed to launch ${app.name}`, 'error');
      }
    } catch (err) {
      showToast('Error sending launch command to server', 'error');
    } finally {
      setTimeout(() => setLaunchingApp(null), 2500);
    }
  };

  const handleOpenWorkfile = async (file: ProjectFile) => {
    if (!selectedNode || selectedNode.type !== 'task') return;
    
    // Determine appType based on file extension
    let appType = '';
    if (file.ext === 'blend') appType = 'blender';
    else if (file.ext === 'hip' || file.ext === 'hipnc' || file.ext === 'hiplc') appType = 'houdini';
    else if (file.ext === 'nk') appType = 'nuke';
    else if (file.ext === 'mra') appType = 'mari';
    else if (file.ext === 'json') appType = 'comfyui';
    
    if (!appType) {
      showToast(`Unsupported file type to open: .${file.ext}`, 'error');
      return;
    }
    
    // Find the installed application config
    const app = applications.find(a => a.appType === appType);
    if (!app) {
      showToast(`No software configured/found to open .${file.ext} files`, 'error');
      return;
    }
    
    if (!app.installed) {
      showToast(`${app.name} is not installed or configured on this machine`, 'error');
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
           taskPath: selectedNode.path,
           preload: file.absolutePath,
           startupScript: app.startupScript
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        showToast(data.message || `Opened ${file.name} in ${app.name}!`);
        if (activeProject) fetchProjectTree(activeProject.path, true);
      } else {
        showToast(data.detail || `Failed to open ${file.name}`, 'error');
      }
    } catch (err) {
      showToast('Error sending open command to server', 'error');
    } finally {
      setTimeout(() => setLaunchingApp(null), 2500);
    }
  };

  const handleRegenerateThumbnail = async (file: ProjectFile) => {
    try {
      const response = await fetch('/api/usd/thumbnail/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usdPath: file.absolutePath })
      });
      
      if (response.ok) {
        showToast(`Regenerated thumbnail for ${file.name}!`);
        if (activeProject) fetchProjectTree(activeProject.path, true);
      } else {
        const err = await response.json();
        showToast(err.detail || 'Failed to regenerate thumbnail', 'error');
      }
    } catch (err) {
      showToast('Error communicating with server', 'error');
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


  const handleToggleDisableNode = async (node: TreeNode) => {
    const nextState = !node.disabled;
    try {
      const response = await fetch(`/api/items/toggle-disabled`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: node.path, disabled: nextState })
      });
      const data = await response.json();
      if (response.ok) {
        showToast(data.message || `Item successfully ${nextState ? 'disabled' : 'enabled'}`);
        
        // If the toggled node was selected, update its local disabled status
        if (selectedNode && selectedNode.path === node.path) {
          setSelectedNode({ ...selectedNode, disabled: nextState });
        }
        
        // Refresh project tree
        if (activeProject) {
          fetchProjectTree(activeProject.path);
        }
      } else {
        showToast(data.detail || 'Failed to toggle item status', 'error');
      }
    } catch (err) {
      showToast('Error toggling item disabled status', 'error');
    }
  };

  const handleArchiveProject = async (project: Project) => {
    try {
      const response = await fetch('/api/projects/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: project.path, archived: !project.archived })
      });
      const data = await response.json();
      if (response.ok) {
        showToast(data.message || 'Project archive status updated!');
        setIsProjectSettingsModalOpen(false);
        
        // Fetch fresh projects
        const responseList = await fetch('/api/projects');
        if (responseList.ok) {
          const updatedProjects = await responseList.json();
          setProjects(updatedProjects);
          
          if (!project.archived) {
            // We just archived the active project
            if (activeProject && activeProject.path === project.path) {
              const activeOnes = updatedProjects.filter((p: Project) => !p.archived);
              if (activeOnes.length > 0) {
                setActiveProject(activeOnes[0]);
              } else {
                setActiveProject(null);
              }
            }
          } else {
            // We just restored it, make it active
            const restored = updatedProjects.find((p: Project) => p.path === project.path);
            if (restored) setActiveProject(restored);
          }
        }
      } else {
        showToast(data.detail || 'Failed to archive project', 'error');
      }
    } catch (err) {
      showToast('Error updating archive status', 'error');
    }
  };

  const handleDeleteProject = async (project: Project, deleteDiskFiles: boolean) => {
    try {
      const response = await fetch('/api/projects/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: project.path, deleteDiskFiles })
      });
      const data = await response.json();
      if (response.ok) {
        showToast(data.message || 'Project deleted successfully!');
        setIsProjectSettingsModalOpen(false);
        
        // Reset selection if active
        if (activeProject && activeProject.path === project.path) {
          setActiveProject(null);
          setProjectTree(null);
          setSelectedNode(null);
        }

        // Refresh project list and switch context
        const responseList = await fetch('/api/projects');
        if (responseList.ok) {
          const updatedProjects = await responseList.json();
          setProjects(updatedProjects);
          const activeOnes = updatedProjects.filter((p: Project) => !p.archived);
          if (activeOnes.length > 0) {
            setActiveProject(activeOnes[0]);
          } else if (updatedProjects.length > 0) {
            setActiveProject(updatedProjects[0]);
          } else {
            setActiveProject(null);
          }
        }
      } else {
        showToast(data.detail || 'Failed to delete project', 'error');
      }
    } catch (err) {
      showToast('Error deleting project', 'error');
    }
  };

  const toggleNodeExpand = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({ ...prev, [path]: !prev[path] }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      
      {/* Top Banner Header */}
      <Header
        projects={projects}
        activeProject={activeProject}
        setActiveProject={setActiveProject}
        onOpenProjectModal={() => setIsProjectModalOpen(true)}
      />

      {/* Main Workspace Layout */}
      <div className="app-container">
        
        {/* LEFT PANEL: Hierarchy tree */}
        <PipelineTree
          projectTree={projectTree}
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
          setActiveUSDPath={setActiveUSDPath}
          loading={loading}
          expandedNodes={expandedNodes}
          toggleNodeExpand={toggleNodeExpand}
          onOpenFolderModal={() => {
            setNewFolderType('folder');
            setIsFolderModalOpen(true);
          }}
          onOpenTaskModal={() => {
            setNewTaskName('');
            setNewTaskSubtype('model');
            setIsTaskModalOpen(true);
          }}
          onOpenProjectModal={() => setIsProjectModalOpen(true)}
          onNodeContextMenu={handleNodeContextMenu}
        />

        {/* CENTER PANEL: Main application or USD viewer */}
        <div className="panel">
          <WorkspaceContent
            selectedNode={selectedNode}
            activeUSDPath={activeUSDPath}
            setActiveUSDPath={setActiveUSDPath}
            applications={applications}
            launchingApp={launchingApp}
            selectedUSDVersions={selectedUSDVersions}
            setSelectedUSDVersions={setSelectedUSDVersions}
            onLaunchApp={handleLaunchApp}
            onOpenWorkfile={handleOpenWorkfile}
            onAssetContextMenu={handleAssetContextMenu}
            onLoadInDCC={handleLoadInDCC}
          />
        </div>

        {/* RIGHT PANEL: Metadata Inspector */}
        <DetailedInspector selectedNode={selectedNode} />

      </div>

      {/* TOAST SYSTEM */}
      <Toast toast={toast} />

      {/* MODAL 1: Create Project */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        newProjectName={newProjectName}
        setNewProjectName={setNewProjectName}
        newProjectPath={newProjectPath}
        setNewProjectPath={setNewProjectPath}
        onSubmit={handleCreateProject}
      />

      {/* MODAL 2: Create Folder/TaskArea */}
      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        newFolderName={newFolderName}
        setNewFolderName={setNewFolderName}
        newFolderType={newFolderType}
        setNewFolderType={setNewFolderType}
        newFolderSubtype={newFolderSubtype}
        setNewFolderSubtype={setNewFolderSubtype}
        onSubmit={handleCreateFolder}
      />

      {/* MODAL 3: Create Task */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        newTaskName={newTaskName}
        setNewTaskName={setNewTaskName}
        newTaskSubtype={newTaskSubtype}
        setNewTaskSubtype={setNewTaskSubtype}
        onSubmit={handleCreateTask}
      />

      {/* CONTEXT MENU */}
      <NodeContextMenu
        contextMenu={contextMenu}
        onClose={() => setContextMenu(null)}
        onAddSubfolder={(node) => {
          setSelectedNode(node);
          setNewFolderType('folder');
          setIsFolderModalOpen(true);
        }}
        onAddTaskArea={(node) => {
          setSelectedNode(node);
          setNewFolderType('taskarea');
          setNewFolderSubtype('shot');
          setIsFolderModalOpen(true);
        }}
        onInitializeTask={(node) => {
          setSelectedNode(node);
          setNewTaskName('');
          setNewTaskSubtype('model');
          setIsTaskModalOpen(true);
        }}
        onToggleDisableItem={(node) => {
          handleToggleDisableNode(node);
        }}
        onOpenProjectSettings={() => {
          setIsProjectSettingsModalOpen(true);
        }}
      />

      {/* MODAL 4: Project Settings */}
      <ProjectSettingsModal
        isOpen={isProjectSettingsModalOpen}
        onClose={() => setIsProjectSettingsModalOpen(false)}
        project={activeProject}
        onArchiveToggle={handleArchiveProject}
        onDeleteProject={handleDeleteProject}
        onSaveApplications={(updatedList) => {
          setApplications(updatedList);
          showToast('Project software configurations updated!');
        }}
      />



      {/* ASSET CONTEXT MENU */}
      <AssetContextMenu
        assetContextMenu={assetContextMenu}
        onClose={() => setAssetContextMenu(null)}
        onRegenerateThumbnail={handleRegenerateThumbnail}
      />

    </div>
  );
}
