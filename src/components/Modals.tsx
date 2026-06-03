import React from 'react';

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
