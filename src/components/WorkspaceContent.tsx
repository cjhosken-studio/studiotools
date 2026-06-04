import { useState, type Dispatch, type SetStateAction, type MouseEvent } from 'react';
import { Layout, File, FolderOpen, Box, Search, ArrowUpDown, Play } from 'lucide-react';
import USDInspector from './USDInspector';
import { AppIcon } from './AppIcon';
import type { TreeNode, Application, ProjectFile, VersionFileEntry } from '../types';

interface WorkspaceContentProps {
  selectedNode: TreeNode | null;
  activeUSDPath: string | null;
  setActiveUSDPath: (path: string | null) => void;
  applications: Application[];
  launchingApp: string | null;
  selectedUSDVersions: Record<string, string>;
  setSelectedUSDVersions: Dispatch<SetStateAction<Record<string, string>>>;
  onLaunchApp: (app: Application) => void;
  onOpenWorkfile: (file: ProjectFile) => void;
  onAssetContextMenu: (file: ProjectFile, e: MouseEvent) => void;
  onPublishVersion: (taskPath: string, assetName: string, versionFolder: string) => void;
  selectedDeliverable: ProjectFile | null;
  onSelectDeliverable: (file: ProjectFile | null) => void;
}

export default function WorkspaceContent({
  selectedNode,
  activeUSDPath,
  setActiveUSDPath,
  applications,
  launchingApp,
  selectedUSDVersions,
  setSelectedUSDVersions,
  onLaunchApp,
  onOpenWorkfile,
  onAssetContextMenu,
  onPublishVersion,
  selectedDeliverable,
  onSelectDeliverable,
}: WorkspaceContentProps) {

  const [activeTab, setActiveTab] = useState<'launchers' | 'workfiles' | 'deliverables'>('launchers');
  const [workfilesSearch, setWorkfilesSearch] = useState('');
  const [deliverablesSearch, setDeliverablesSearch] = useState('');
  const [workfilesSort, setWorkfilesSort] = useState<'asc' | 'desc'>('desc');

  if (activeUSDPath) {
    return (
      <USDInspector filePath={activeUSDPath} onClose={() => setActiveUSDPath(null)} />
    );
  }

  // Calculate lists and counts if we have a task node
  const workfiles = selectedNode && selectedNode.type === 'task'
    ? selectedNode.files.filter(f => f.category === 'wip')
    : [];

  const versionFolders = selectedNode && selectedNode.type === 'task'
    ? selectedNode.files.filter(f => f.category === 'versions')
    : [];

  const publishedFolders = selectedNode && selectedNode.type === 'task'
    ? selectedNode.files.filter(f => f.category === 'published')
    : [];

  // Group version folders by asset key (strip trailing _vNNN)
  const groupedAssets: Record<string, ProjectFile[]> = {};
  versionFolders.forEach(folder => {
    const match = folder.name.match(/^(.+)_v(\d+)$/);
    const assetKey = match ? match[1] : folder.name;
    if (!groupedAssets[assetKey]) groupedAssets[assetKey] = [];
    groupedAssets[assetKey].push(folder);
  });

  // Sort each asset's versions descending
  Object.keys(groupedAssets).forEach(key => {
    groupedAssets[key].sort((a, b) => {
      const aVer = (a.name.match(/_v(\d+)$/) || [])[1] ?? '0';
      const bVer = (b.name.match(/_v(\d+)$/) || [])[1] ?? '0';
      return parseInt(bVer) - parseInt(aVer);
    });
  });

  const deliverablesCount = Object.keys(groupedAssets).length;

  // Filtered and sorted workfiles
  const filteredWorkfiles = workfiles.filter(file =>
    file.name.toLowerCase().includes(workfilesSearch.toLowerCase())
  );
  
  filteredWorkfiles.sort((a, b) => {
    if (workfilesSort === 'asc') {
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    } else {
      return b.name.localeCompare(a.name, undefined, { numeric: true });
    }
  });

  // Filtered deliverable asset keys
  const filteredAssetKeys = Object.keys(groupedAssets).filter(key =>
    key.toLowerCase().includes(deliverablesSearch.toLowerCase())
  );

  return (
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
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Selected Node Details */}
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{selectedNode.name}</h1>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{selectedNode.path}</p>
            </div>

            {/* Tab Navigation (only for task nodes) */}
            {selectedNode.type === 'task' && (
              <div style={{
                display: 'flex',
                gap: '4px',
                borderBottom: '1px solid var(--border)',
                marginBottom: '10px'
              }}>
                <button
                  onClick={() => setActiveTab('launchers')}
                  style={{
                    padding: '10px 16px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'launchers' ? '2px solid var(--color-usd)' : '2px solid transparent',
                    color: activeTab === 'launchers' ? '#fff' : 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 150ms ease',
                    outline: 'none'
                  }}
                >
                  <Play size={13} style={{ color: activeTab === 'launchers' ? 'var(--color-usd)' : 'inherit' }} />
                  Software Launchers
                </button>
                <button
                  onClick={() => setActiveTab('workfiles')}
                  style={{
                    padding: '10px 16px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'workfiles' ? '2px solid var(--color-usd)' : '2px solid transparent',
                    color: activeTab === 'workfiles' ? '#fff' : 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 150ms ease',
                    outline: 'none'
                  }}
                >
                  <File size={13} style={{ color: activeTab === 'workfiles' ? 'var(--color-usd)' : 'inherit' }} />
                  Working Scenes
                  <span style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: activeTab === 'workfiles' ? 'var(--color-usd-glow)' : 'var(--bg-active)',
                    color: activeTab === 'workfiles' ? 'var(--color-usd)' : 'var(--text-muted)',
                    fontWeight: 600
                  }}>
                    {workfiles.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('deliverables')}
                  style={{
                    padding: '10px 16px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'deliverables' ? '2px solid var(--color-usd)' : '2px solid transparent',
                    color: activeTab === 'deliverables' ? '#fff' : 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 150ms ease',
                    outline: 'none'
                  }}
                >
                  <Box size={13} style={{ color: activeTab === 'deliverables' ? 'var(--color-usd)' : 'inherit' }} />
                  Deliverables
                  <span style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: activeTab === 'deliverables' ? 'var(--color-usd-glow)' : 'var(--bg-active)',
                    color: activeTab === 'deliverables' ? 'var(--color-usd)' : 'var(--text-muted)',
                    fontWeight: 600
                  }}>
                    {deliverablesCount}
                  </span>
                </button>
              </div>
            )}

            {/* Tab Contents */}
            {selectedNode.type === 'task' ? (
              <>
                {/* 1. Software Launchers Tab */}
                {activeTab === 'launchers' && (
                  <div className="panel" style={{ background: 'var(--bg-card)' }}>
                    <div className="panel-header" style={{ height: '36px', padding: '0 12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Launch DCC Software</span>
                    </div>
                    <div className="app-grid">
                      {applications.filter(app => !app.disabled).map(app => {
                        const isLaunching = launchingApp === app.name;
                        return (
                          <div 
                            key={app.name} 
                            className={`app-card app-${app.appType} ${isLaunching ? 'launching-pulse' : ''}`}
                            onClick={() => onLaunchApp(app)}
                            style={{ 
                              opacity: app.installed ? 1 : 0.5,
                              cursor: 'pointer'
                            }}
                          >
                            <AppIcon type={app.appType} size={28} />
                            <span className="app-card-title">{app.name}</span>
                            <span className="app-card-status">
                              {isLaunching ? 'Launching...' : (app.installed ? 'Launch App' : 'Not Installed')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Working Scenes Tab */}
                {activeTab === 'workfiles' && (
                  <div>
                    {/* Search & Sort Panel */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', marginBottom: '16px' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          placeholder="Search working scenes..."
                          value={workfilesSearch}
                          onChange={(e) => setWorkfilesSearch(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px 8px 34px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            color: 'var(--text-primary)',
                            fontSize: '13px',
                            outline: 'none',
                          }}
                        />
                      </div>
                      <button
                        className="btn"
                        onClick={() => setWorkfilesSort(prev => prev === 'asc' ? 'desc' : 'asc')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          height: '35px',
                          fontSize: '12px'
                        }}
                        title="Toggle Sort Order"
                      >
                        <ArrowUpDown size={13} />
                        {workfilesSort === 'asc' ? 'Oldest' : 'Newest'}
                      </button>
                    </div>

                    {filteredWorkfiles.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {filteredWorkfiles.map(file => (
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
                            
                            {/* Action button to open specific workfile in DCC */}
                            {(() => {
                              let appType = '';
                              if (file.ext === 'blend') appType = 'blender';
                              else if (file.ext === 'hip' || file.ext === 'hipnc' || file.ext === 'hiplc') appType = 'houdini';
                              else if (file.ext === 'nk') appType = 'nuke';
                              else if (file.ext === 'mra') appType = 'mari';
                              else if (file.ext === 'json') appType = 'comfyui';
                              
                              const app = applications.find(a => a.appType === appType);
                              const isInstalled = app ? app.installed : false;
                              
                              if (!app || !isInstalled) return null;
                              
                              return (
                                <button 
                                  className="btn"
                                  onClick={() => onOpenWorkfile(file)}
                                  style={{ 
                                    padding: '4px 10px', 
                                    fontSize: '11px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid var(--border-light)',
                                    color: 'var(--text-secondary)',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                  }}
                                  title={`Open ${file.name} directly in ${app.name}`}
                                >
                                  Open Scene
                                </button>
                              );
                            })()}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '16px', border: '1px dashed var(--border)', borderRadius: '6px', background: 'rgba(255,255,255,0.01)', textAlign: 'center' }}>
                        {workfilesSearch ? "No working scenes match your search query." : "No active working scenes found. Launch a DCC to create one."}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Deliverables Tab */}
                {activeTab === 'deliverables' && (
                  <div>
                    {/* Search Panel */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', marginBottom: '16px' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          placeholder="Search deliverables by asset name..."
                          value={deliverablesSearch}
                          onChange={(e) => setDeliverablesSearch(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px 8px 34px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            color: 'var(--text-primary)',
                            fontSize: '13px',
                            outline: 'none',
                          }}
                        />
                      </div>
                    </div>

                    {filteredAssetKeys.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '16px' }}>
                        {filteredAssetKeys.map(assetKey => {
                          const versionsList = groupedAssets[assetKey];
                          const publishedFolder = publishedFolders.find(f => f.name === assetKey);
                          const selectedOption = selectedUSDVersions[assetKey] || 'published';

                          let currentFolder: ProjectFile;
                          if (selectedOption === 'published') {
                            currentFolder = publishedFolder || versionsList[0];
                          } else if (selectedOption === 'latest') {
                            currentFolder = versionsList[0];
                          } else {
                            currentFolder = versionsList.find(f => f.absolutePath === selectedOption) || versionsList[0];
                          }

                          const hasThumb = !!currentFolder.thumbnailPath;
                          const thumbUrl = hasThumb
                            ? `/api/usd/thumbnail?path=${encodeURIComponent(currentFolder.thumbnailPath!)}`
                            : null;

                          const hasUSD = !!currentFolder.usdPath;
                          const versionFiles: VersionFileEntry[] = currentFolder.versionFiles || [];

                          const dccAppType = currentFolder.application?.toLowerCase() ?? '';
                          const appTitle = dccAppType
                            ? dccAppType.charAt(0).toUpperCase() + dccAppType.slice(1)
                            : '';
                          const dccLabel = appTitle + (currentFolder.appVersion ? ` ${currentFolder.appVersion}` : '');

                          const sourceSceneFile = currentFolder.sourceScene
                            ? {
                                name: currentFolder.sourceScene.split('/').pop() || '',
                                absolutePath: currentFolder.sourceScene,
                                relativePath: '',
                                category: 'wip',
                                ext: (currentFolder.sourceScene.split('.').pop() || '').toLowerCase(),
                              } as ProjectFile
                            : null;

                          const isAlreadyPublished = !!publishedFolder &&
                            currentFolder.realPath === publishedFolder.realPath;

                          const dccColors: Record<string, { bg: string; border: string; text: string }> = {
                            blender:  { bg: 'rgba(234, 137, 36, 0.15)',  border: 'rgba(234, 137, 36, 0.4)',  text: 'var(--color-blender)' },
                            houdini:  { bg: 'rgba(236, 90, 60, 0.15)',   border: 'rgba(236, 90, 60, 0.4)',   text: 'var(--color-houdini)' },
                            nuke:     { bg: 'rgba(150, 220, 80, 0.15)',   border: 'rgba(150, 220, 80, 0.4)',   text: '#a3e635' },
                            mari:     { bg: 'rgba(180, 100, 220, 0.15)', border: 'rgba(180, 100, 220, 0.4)', text: '#c084fc' },
                            comfyui:  { bg: 'rgba(100, 180, 255, 0.15)', border: 'rgba(100, 180, 255, 0.4)', text: '#7dd3fc' },
                          };
                          const dccColor = dccAppType ? (dccColors[dccAppType] || { bg: 'rgba(255,255,255,0.06)', border: 'var(--border-light)', text: 'var(--text-secondary)' }) : null;

                          const isSelected = selectedDeliverable !== null && 
                            (selectedDeliverable.realPath === currentFolder.realPath || 
                             selectedDeliverable.absolutePath === currentFolder.absolutePath);

                          return (
                            <div
                              key={assetKey}
                              className="showcase-card"
                              onContextMenu={(e) => onAssetContextMenu(currentFolder, e)}
                              onClick={() => onSelectDeliverable(currentFolder)}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                background: 'var(--bg-card)',
                                border: isSelected ? '1px solid var(--color-usd)' : '1px solid var(--border)',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                transition: 'all 200ms ease',
                                boxShadow: isSelected 
                                  ? '0 0 12px rgba(0, 240, 255, 0.25), 0 4px 12px rgba(0, 0, 0, 0.25)' 
                                  : '0 4px 12px rgba(0, 0, 0, 0.25)',
                                position: 'relative',
                                cursor: 'pointer'
                              }}
                            >
                              <div style={{ aspectRatio: '16/9', width: '100%', overflow: 'hidden', background: 'var(--bg-app)', borderBottom: '1px solid var(--border)', position: 'relative' }}>
                                {hasThumb ? (
                                  <img
                                    src={thumbUrl!}
                                    alt={currentFolder.name}
                                    style={{ height: '100%', width: '100%', objectFit: 'cover', transition: 'transform 300ms ease' }}
                                    className="showcase-image"
                                  />
                                ) : (
                                  <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: 'var(--text-muted)', gap: '8px' }}>
                                    <FolderOpen size={32} style={{ color: 'var(--text-secondary)' }} />
                                  </div>
                                )}

                                <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(10, 15, 26, 0.8)', backdropFilter: 'blur(4px)', padding: '2px 8px', borderRadius: '4px', border: hasUSD ? '1px solid rgba(0, 240, 255, 0.25)' : '1px solid rgba(255,255,255,0.12)', color: hasUSD ? 'var(--color-usd)' : 'var(--text-secondary)', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  {hasUSD ? 'USD' : (versionFiles[0]?.ext?.toUpperCase() || 'FILES')}
                                </div>

                                <div style={{ position: 'absolute', top: '8px', right: '8px' }} onClick={e => e.stopPropagation()}>
                                  <select
                                    value={selectedOption}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setSelectedUSDVersions(prev => ({ ...prev, [assetKey]: val }));
                                      
                                      let targetFolder: ProjectFile;
                                      if (val === 'published') {
                                        targetFolder = publishedFolder || versionsList[0];
                                      } else if (val === 'latest') {
                                        targetFolder = versionsList[0];
                                      } else {
                                        targetFolder = versionsList.find(f => f.absolutePath === val) || versionsList[0];
                                      }
                                      
                                      if (isSelected) {
                                        onSelectDeliverable(targetFolder);
                                      }
                                    }}
                                    style={{ background: 'rgba(10, 15, 26, 0.85)', backdropFilter: 'blur(4px)', border: '1px solid var(--border-light)', borderRadius: '4px', color: '#fff', fontSize: '10px', padding: '2px 4px', fontWeight: 500, outline: 'none', cursor: 'pointer' }}
                                  >
                                    <option value="published">published</option>
                                    <option value="latest">latest</option>
                                    {versionsList.map(verFolder => {
                                      const verMatch = verFolder.name.match(/_v(\d+)$/);
                                      const verStr = verMatch ? `v${verMatch[1]}` : verFolder.name;
                                      return (
                                        <option key={verFolder.absolutePath} value={verFolder.absolutePath}>{verStr}</option>
                                      );
                                    })}
                                  </select>
                                </div>
                              </div>

                              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={assetKey}>
                                  {assetKey}
                                </span>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'auto' }}>
                                  {hasUSD && (
                                    <button
                                      className="btn btn-primary"
                                      onClick={(e) => { e.stopPropagation(); setActiveUSDPath(currentFolder.usdPath!); }}
                                      style={{ width: '100%', padding: '6px', fontSize: '12px', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                                    >
                                      <Box size={13} /> Inspect 3D Stage
                                    </button>
                                  )}

                                  {sourceSceneFile && dccColor && dccLabel ? (
                                    <button
                                      className="btn"
                                      onClick={(e) => { e.stopPropagation(); onOpenWorkfile(sourceSceneFile); }}
                                      style={{ width: '100%', padding: '6px', fontSize: '12px', fontWeight: 500, background: dccColor.bg, border: `1px solid ${dccColor.border}`, color: dccColor.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                                      title={`Open source scene: ${sourceSceneFile.name}`}
                                    >
                                      ✏️ Open in {dccLabel}
                                    </button>
                                  ) : dccColor && dccLabel ? (
                                    <div
                                      style={{ width: '100%', padding: '6px', fontSize: '11px', fontWeight: 500, textAlign: 'center', background: dccColor.bg, border: `1px solid ${dccColor.border}`, color: dccColor.text, borderRadius: '6px', opacity: 0.6, boxSizing: 'border-box' }}
                                      title={`Made in ${dccLabel} — source scene path not recorded`}
                                    >
                                      {dccLabel}
                                    </div>
                                  ) : null}

                                  {!isAlreadyPublished && selectedNode && (
                                    <button
                                      className="btn"
                                      onClick={(e) => { e.stopPropagation(); onPublishVersion(selectedNode.path, assetKey, currentFolder.name); }}
                                      style={{ width: '100%', padding: '6px', fontSize: '12px', fontWeight: 500, background: 'rgba(0, 240, 255, 0.1)', border: '1px solid rgba(0, 240, 255, 0.4)', color: 'var(--color-usd)' }}
                                    >
                                      Set as Published
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '16px', border: '1px dashed var(--border)', borderRadius: '6px', background: 'rgba(255,255,255,0.01)', textAlign: 'center' }}>
                        {deliverablesSearch ? "No deliverables match your search query." : "No versioned deliverables found. Export from a DCC application to publish."}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: '24px', border: '1px dashed var(--border)', borderRadius: '8px', textAlign: 'center', background: 'var(--bg-card)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Navigational Folder</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
                  Please navigate down the hierarchy and select a specific **Task** (e.g. model, lookdev) to launch applications and manage assets.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '12px' }}>
            <Layout size={32} />
            <span>Select a node in the Pipeline Tree to load workspace details.</span>
          </div>
        )}
      </div>
    </>
  );
}
