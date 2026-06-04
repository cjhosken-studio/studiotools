import React, { useState, useEffect } from 'react';
import type { Project, TreeNode, Application, ProjectFile } from '../types';
import { Archive, Trash2, ShieldAlert, Plus, Eye, EyeOff } from 'lucide-react';
import { AppIcon } from './AppIcon';


interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  newProjectName: string;
  setNewProjectName: (name: string) => void;
  newProjectPath: string;
  setNewProjectPath: (path: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ProjectModal({
  isOpen,
  onClose,
  newProjectName,
  setNewProjectName,
  newProjectPath,
  setNewProjectPath,
  onSubmit,
}: ProjectModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="panel-header">
          <h2>New Project</h2>
        </div>
        <form onSubmit={onSubmit} style={{ padding: '20px' }}>
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
                if (!newProjectPath || newProjectPath.startsWith('/home/cjhosken/dev/studiotools/projects/') || newProjectPath.startsWith('/server/cjhosken_life/projects/')) {
                  // Autocomplete path
                  setNewProjectPath(`/server/cjhosken_life/projects/${e.target.value.toLowerCase().replace(/\s+/g, '_')}`);
                }
              }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">FileSystem Directory Path</label>
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
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create & Contextualize</button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  newFolderName: string;
  setNewFolderName: (name: string) => void;
  newFolderType: string;
  setNewFolderType: (type: string) => void;
  newFolderSubtype: string;
  setNewFolderSubtype: (subtype: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function FolderModal({
  isOpen,
  onClose,
  newFolderName,
  setNewFolderName,
  newFolderType,
  setNewFolderType,
  newFolderSubtype,
  setNewFolderSubtype,
  onSubmit,
}: FolderModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="panel-header">
          <h2>New Folder / Area</h2>
        </div>
        <form onSubmit={onSubmit} style={{ padding: '20px' }}>
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
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Folder</button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  newTaskName: string;
  setNewTaskName: (name: string) => void;
  newTaskSubtype: string;
  setNewTaskSubtype: (subtype: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function TaskModal({
  isOpen,
  onClose,
  newTaskName,
  setNewTaskName,
  newTaskSubtype,
  setNewTaskSubtype,
  onSubmit,
}: TaskModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="panel-header">
          <h2>Initialize VFX Task</h2>
        </div>
        <form onSubmit={onSubmit} style={{ padding: '20px' }}>
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
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Initialize Task</button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onArchiveToggle: (project: Project) => void;
  onDeleteProject: (project: Project, deleteDiskFiles: boolean) => void;
  onSaveApplications: (apps: Application[]) => void;
}

export function ProjectSettingsModal({
  isOpen,
  onClose,
  project,
  onArchiveToggle,
  onDeleteProject,
  onSaveApplications,
}: ProjectSettingsModalProps) {
  const [deleteDiskFiles, setDeleteDiskFiles] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [activeTab, setActiveTab] = useState<'general' | 'software'>('general');
  const [scannedApps, setScannedApps] = useState<Application[]>([]);
  const [projectApps, setProjectApps] = useState<Application[]>([]);

  // Custom application form states
  const [customName, setCustomName] = useState('');
  const [customType, setCustomType] = useState('blender');
  const [customExe, setCustomExe] = useState('');
  const [customExts, setCustomExts] = useState('');
  const [customStartupScript, setCustomStartupScript] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setDeleteDiskFiles(false);
      setConfirmName('');
      setShowDeleteConfirm(false);
      setActiveTab('general');
      setCustomName('');
      setCustomExe('');
      setCustomExts('');
      setCustomStartupScript('');
    } else if (project) {
      // Fetch scanned apps
      fetch('/api/applications/scan')
        .then(res => res.json())
        .then(data => setScannedApps(data))
        .catch(() => {});

      // Fetch project apps
      fetch(`/api/applications?projectPath=${encodeURIComponent(project.path)}`)
        .then(res => res.json())
        .then(data => setProjectApps(data))
        .catch(() => {});
    }
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  const isDeleteEnabled = !deleteDiskFiles || confirmName.trim().toLowerCase() === project.name.trim().toLowerCase();

  const saveApplications = async (updatedList: Application[]) => {
    try {
      const response = await fetch('/api/projects/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath: project.path,
          applications: updatedList
        })
      });
      if (response.ok) {
        setProjectApps(updatedList);
        onSaveApplications(updatedList);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ width: '520px' }} onClick={e => e.stopPropagation()}>
        <div className="panel-header">
          <h2>Project Settings: {project.name}</h2>
        </div>
        <div style={{ padding: '20px' }}>

          {/* Tabs Header */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
            <button 
              type="button" 
              className="btn btn-text"
              style={{ 
                flex: 1, 
                borderRadius: 0, 
                borderBottom: activeTab === 'general' ? '2px solid var(--color-usd)' : 'none',
                color: activeTab === 'general' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: activeTab === 'general' ? 600 : 400,
                padding: '10px 0',
                background: 'transparent'
              }}
              onClick={() => setActiveTab('general')}
            >
              General & Actions
            </button>
            <button 
              type="button" 
              className="btn btn-text"
              style={{ 
                flex: 1, 
                borderRadius: 0, 
                borderBottom: activeTab === 'software' ? '2px solid var(--color-usd)' : 'none',
                color: activeTab === 'software' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: activeTab === 'software' ? 600 : 400,
                padding: '10px 0',
                background: 'transparent'
              }}
              onClick={() => setActiveTab('software')}
            >
              Software DCCs
            </button>
          </div>

          {activeTab === 'general' && (
            <div>
              {/* General Information */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Project Name</label>
                <div style={{ background: 'var(--bg-app)', padding: '10px 12px', borderRadius: '6px', fontSize: '13px', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                  {project.name}
                </div>
              </div>
              
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">FileSystem Directory Path</label>
                <div style={{ background: 'var(--bg-app)', padding: '10px 12px', borderRadius: '6px', fontSize: '12px', fontFamily: 'var(--font-mono)', border: '1px solid var(--border)', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                  {project.path}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Project Status</label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '4px' }}>
                  <span style={{ 
                    fontSize: '12.5px', 
                    fontWeight: 600, 
                    color: project.archived ? 'var(--color-warning)' : 'var(--color-success)',
                    background: project.archived ? 'rgba(240, 190, 0, 0.1)' : 'rgba(46, 204, 113, 0.1)',
                    padding: '4px 10px',
                    borderRadius: '4px'
                  }}>
                    {project.archived ? 'Archived' : 'Active'}
                  </span>
                  <button 
                    type="button" 
                    className="btn" 
                    style={{ marginLeft: 'auto', fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => onArchiveToggle(project)}
                  >
                    <Archive size={14} />
                    {project.archived ? 'Restore Project' : 'Archive Project'}
                  </button>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  {project.archived 
                    ? 'Archived projects can still be accessed, but are moved to the archived group.' 
                    : 'Archiving hides the project from primary dropdown lists to declutter your workspace.'}
                </p>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0' }} />

              {/* Danger Zone */}
              <div style={{ border: '1px solid rgba(231, 76, 60, 0.3)', borderRadius: '8px', padding: '14px', background: 'rgba(231, 76, 60, 0.03)' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                  <ShieldAlert size={15} /> Project Actions
                </h3>

                {!showDeleteConfirm ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>Unregister Project</h4>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Remove from StudioTools list; keep files on disk.</p>
                      </div>
                      <button 
                        type="button" 
                        className="btn" 
                        style={{ fontSize: '11.5px', padding: '6px 12px' }}
                        onClick={() => onDeleteProject(project, false)}
                      >
                        Unregister
                      </button>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px dashed var(--border)' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--color-danger)' }}>Delete from Disk</h4>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Permanently erase the project directory and files.</p>
                      </div>
                      <button 
                        type="button" 
                        className="btn btn-danger" 
                        style={{ fontSize: '11.5px', padding: '6px 12px' }}
                        onClick={() => {
                          setDeleteDiskFiles(true);
                          setShowDeleteConfirm(true);
                        }}
                      >
                        <Trash2 size={13} /> Delete Files...
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--color-danger)', fontWeight: 600 }}>
                      Warning: This will permanently delete '{project.path}' and all of its assets forever.
                    </p>
                    <div className="form-group" style={{ marginTop: '4px' }}>
                      <label className="form-label" style={{ color: 'var(--text-primary)' }}>
                        To confirm disk deletion, please type the project name <strong>{project.name}</strong>:
                      </label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={confirmName} 
                        onChange={e => setConfirmName(e.target.value)} 
                        placeholder="Type project name here"
                        style={{ marginTop: '4px', borderColor: confirmName && !isDeleteEnabled ? 'var(--color-danger)' : 'var(--border)' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button 
                        type="button" 
                        className="btn" 
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteDiskFiles(false);
                          setConfirmName('');
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-danger" 
                        style={{ fontSize: '12px', padding: '6px 12px', opacity: isDeleteEnabled ? 1 : 0.5, cursor: isDeleteEnabled ? 'pointer' : 'not-allowed' }}
                        disabled={!isDeleteEnabled}
                        onClick={() => onDeleteProject(project, true)}
                      >
                        <Trash2 size={13} /> Confirm Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'software' && (() => {
            // Build unified combined list
            const combinedApps: Application[] = [...projectApps];
            scannedApps.forEach(sa => {
              const exists = projectApps.some(pa => pa.name === sa.name || pa.appType === sa.appType);
              if (!exists) {
                combinedApps.push({ ...sa, disabled: false });
              }
            });

            const handleToggleDisabled = (app: Application) => {
              const exists = projectApps.some(pa => pa.name === app.name);
              let updatedList: Application[] = [];
              if (exists) {
                updatedList = projectApps.map(pa => 
                  pa.name === app.name ? { ...pa, disabled: !pa.disabled } : pa
                );
              } else {
                // If it wasn't in projectApps, add it as a project override with its disabled status flipped
                updatedList = [...projectApps, { ...app, disabled: !app.disabled }];
              }
              saveApplications(updatedList);
            };

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                
                {/* 1. Software Configuration List */}
                <div>
                  <h3 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                    Software Configurations ({combinedApps.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {combinedApps.map(app => {
                      const isCustom = !scannedApps.some(sa => sa.appType === app.appType && sa.name === app.name);
                      
                      return (
                        <div 
                          key={app.name} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            background: app.disabled ? 'rgba(255, 255, 255, 0.02)' : 'var(--bg-app)', 
                            border: '1px solid var(--border)', 
                            padding: '8px 12px', 
                            borderRadius: '6px',
                            opacity: app.disabled ? 0.6 : 1,
                            transition: 'all 200ms ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                            <AppIcon type={app.appType} size={14} disabled={app.disabled} />
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '12.5px', fontWeight: 600, color: app.disabled ? 'var(--text-muted)' : '#fff', textDecoration: app.disabled ? 'line-through' : 'none', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{app.name}</span>
                                {!app.disabled && (
                                  <span style={{ 
                                    fontSize: '8px', 
                                    padding: '1px 4px', 
                                    background: app.installed ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)', 
                                    color: app.installed ? 'var(--color-success)' : 'var(--color-danger)', 
                                    borderRadius: '3px',
                                    textTransform: 'uppercase',
                                    fontWeight: 600
                                  }}>
                                    {app.installed ? 'found' : 'missing'}
                                  </span>
                                )}
                                {app.disabled && (
                                  <span style={{ 
                                    fontSize: '8px', 
                                    padding: '1px 4px', 
                                    background: 'rgba(255, 255, 255, 0.05)', 
                                    color: 'var(--text-muted)', 
                                    borderRadius: '3px',
                                    textTransform: 'uppercase',
                                    fontWeight: 600
                                  }}>
                                    disabled
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '2px' }} title={app.executable}>
                                {app.executable}
                              </div>
                              {app.startupScript && (
                                <div style={{ fontSize: '10px', color: 'var(--color-usd)', fontFamily: 'var(--font-mono)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '2px' }} title={app.startupScript}>
                                  <span style={{ color: 'var(--text-muted)', marginRight: '4px' }}>Script:</span>{app.startupScript}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginLeft: '12px' }}>
                            {/* Enable/Disable Toggle Button */}
                            <button 
                              type="button" 
                              className={`btn ${app.disabled ? '' : 'btn-text'}`}
                              style={{ 
                                padding: '4px 10px', 
                                fontSize: '11px', 
                                height: '24px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                borderColor: app.disabled ? 'var(--border)' : 'transparent',
                                background: app.disabled ? 'transparent' : 'rgba(255, 255, 255, 0.03)',
                                color: app.disabled ? 'var(--text-secondary)' : 'var(--color-warning)'
                              }}
                              onClick={() => handleToggleDisabled(app)}
                              title={app.disabled ? "Enable application" : "Disable application"}
                            >
                              {app.disabled ? <Eye size={12} /> : <EyeOff size={12} />}
                              {app.disabled ? 'Enable' : 'Disable'}
                            </button>

                            {/* Delete button (Custom DCCs only) */}
                            {isCustom && (
                              <button 
                                type="button" 
                                className="btn btn-text"
                                style={{ padding: '4px', color: 'var(--color-danger)', background: 'transparent' }}
                                onClick={() => {
                                  const updated = projectApps.filter(a => a.name !== app.name);
                                  saveApplications(updated);
                                }}
                                title="Delete custom application"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />

                {/* 2. Add Custom Application */}
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '14px', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={14} style={{ color: 'var(--color-usd)' }} /> Add Custom Software
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">App Name</label>
                        <input 
                          type="text" 
                          className="form-input"
                          placeholder="e.g. Blender 5.0"
                          value={customName}
                          onChange={e => setCustomName(e.target.value)}
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">App Type</label>
                        <select 
                          className="form-select"
                          value={customType}
                          onChange={e => setCustomType(e.target.value)}
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                        >
                          <option value="blender">Blender</option>
                          <option value="houdini">Houdini</option>
                          <option value="nuke">Nuke</option>
                          <option value="custom">Generic Custom DCC</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Executable FilePath</label>
                      <input 
                        type="text" 
                        className="form-input"
                        placeholder="e.g. /usr/local/bin/blender"
                        value={customExe}
                        onChange={e => setCustomExe(e.target.value)}
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">File Extensions (comma separated)</label>
                      <input 
                        type="text" 
                        className="form-input"
                        placeholder="e.g. blend, blend1"
                        value={customExts}
                        onChange={e => setCustomExts(e.target.value)}
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Startup Script FilePath (optional)</label>
                      <input 
                        type="text" 
                        className="form-input"
                        placeholder="e.g. /path/to/startup_script.py"
                        value={customStartupScript}
                        onChange={e => setCustomStartupScript(e.target.value)}
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                      />
                    </div>

                    <button 
                      type="button" 
                      className="btn btn-primary"
                      style={{ fontSize: '12px', padding: '6px 12px', marginTop: '6px', alignSelf: 'flex-end' }}
                      onClick={() => {
                        if (!customName || !customExe) return;
                        const extensions = customExts.split(',').map(s => s.trim()).filter(s => s.length > 0);
                        const newApp: Application = {
                          name: customName,
                          appType: customType,
                          executable: customExe,
                          installed: true,
                          extensions,
                          icon: customType,
                          disabled: false,
                          startupScript: customStartupScript.trim() || undefined
                        };
                        const updated = [...projectApps, newApp];
                        saveApplications(updated);
                        
                        // Reset form
                        setCustomName('');
                        setCustomExe('');
                        setCustomExts('');
                        setCustomStartupScript('');
                      }}
                      disabled={!customName || !customExe}
                    >
                      Add Custom App
                    </button>
                  </div>
                </div>

              </div>
            );
          })()}

          {/* Close Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" className="btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: TreeNode | null;
  onConfirm: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  node,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!isOpen || !node) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ width: '400px' }} onClick={e => e.stopPropagation()}>
        <div className="panel-header" style={{ borderBottom: '1px solid rgba(231, 76, 60, 0.3)' }}>
          <h2 style={{ color: 'var(--color-danger)' }}>Delete Item</h2>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(231, 76, 60, 0.1)', color: 'var(--color-danger)', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldAlert size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Are you sure you want to delete "{node.name}"?
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                This will permanently delete this folder and all of its contents from disk. This action is irreversible.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button 
              type="button" 
              className="btn btn-danger" 
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              <Trash2 size={13} /> Delete Item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DeleteDeliverableModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: ProjectFile | null;
  onConfirm: (deleteScope: 'version' | 'all') => void;
}

export function DeleteDeliverableModal({
  isOpen,
  onClose,
  file,
  onConfirm,
}: DeleteDeliverableModalProps) {
  const [scope, setScope] = useState<'version' | 'all'>('version');

  useEffect(() => {
    if (isOpen) {
      setScope('version');
    }
  }, [isOpen]);

  if (!isOpen || !file) return null;

  // Determine the asset key and current version name
  const match = file.name.match(/^(.+)_v(\d+)$/);
  const assetKey = match ? match[1] : file.name;
  const realVersionName = file.realPath ? file.realPath.split('/').pop() || file.name : file.name;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ width: '450px' }} onClick={e => e.stopPropagation()}>
        <div className="panel-header" style={{ borderBottom: '1px solid rgba(231, 76, 60, 0.3)' }}>
          <h2 style={{ color: 'var(--color-danger)' }}>Delete Deliverable</h2>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(231, 76, 60, 0.1)', color: 'var(--color-danger)', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldAlert size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                Are you sure you want to delete deliverable "{assetKey}"?
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', color: 'var(--text-primary)' }}>
                  <input 
                    type="radio" 
                    name="deleteScope" 
                    checked={scope === 'version'} 
                    onChange={() => setScope('version')} 
                  />
                  <span>Delete only version: <strong style={{ color: '#fff' }}>{realVersionName}</strong></span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', color: 'var(--text-primary)' }}>
                  <input 
                    type="radio" 
                    name="deleteScope" 
                    checked={scope === 'all'} 
                    onChange={() => setScope('all')} 
                  />
                  <span>Delete <strong style={{ color: 'var(--color-danger)' }}>whole asset</strong> (all versions and publish link)</span>
                </label>
              </div>

              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px', lineHeight: '1.4' }}>
                This will delete the selected files from disk permanently. This action is irreversible.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button 
              type="button" 
              className="btn btn-danger" 
              onClick={() => {
                onConfirm(scope);
                onClose();
              }}
            >
              <Trash2 size={13} /> Confirm Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

