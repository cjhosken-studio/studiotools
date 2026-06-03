import { Layers } from 'lucide-react';
import type { Project } from '../types';

interface HeaderProps {
  projects: Project[];
  activeProject: Project | null;
  setActiveProject: (p: Project) => void;
  onOpenProjectModal: () => void;
}

export default function Header({
  projects,
  activeProject,
  setActiveProject,
  onOpenProjectModal,
}: HeaderProps) {
  return (
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
            {projects.filter(p => !p.archived).length > 0 && (
              <optgroup label="Active Projects">
                {projects.filter(p => !p.archived).map(p => (
                  <option key={p.path} value={p.path}>{p.name}</option>
                ))}
              </optgroup>
            )}
            {projects.filter(p => p.archived).length > 0 && (
              <optgroup label="Archived Projects">
                {projects.filter(p => p.archived).map(p => (
                  <option key={p.path} value={p.path}>{p.name} (Archived)</option>
                ))}
              </optgroup>
            )}
          </select>
        ) : (
          <button 
            className="btn btn-primary" 
            onClick={onOpenProjectModal} 
            style={{ padding: '4px 10px', fontSize: '11.5px' }}
          >
            Create Project
          </button>
        )}
      </div>
    </header>
  );
}
