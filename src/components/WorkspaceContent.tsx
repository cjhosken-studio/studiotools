import type { Dispatch, SetStateAction, MouseEvent } from 'react';
import { Layout, File } from 'lucide-react';
import USDInspector from './USDInspector';
import { AppIcon } from './AppIcon';
import type { TreeNode, Application, ProjectFile } from '../types';

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
  onLoadInDCC: (appType: string, filePath: string) => void;
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
  onLoadInDCC,
}: WorkspaceContentProps) {

  if (activeUSDPath) {
    return (
      <USDInspector filePath={activeUSDPath} onClose={() => setActiveUSDPath(null)} />
    );
  }

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
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Selected Node Details */}
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{selectedNode.name}</h1>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{selectedNode.path}</p>
            </div>

            {/* Applications Launcher Section (For Tasks) */}
            {selectedNode.type === 'task' ? (
              selectedNode.disabled ? (
                <div style={{ 
                  padding: '16px 20px', 
                  border: '1px solid rgba(240, 190, 0, 0.3)', 
                  borderRadius: '8px', 
                  background: 'rgba(240, 190, 0, 0.03)', 
                  color: 'var(--color-warning)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '4px' 
                }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 600 }}>Task is Disabled</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    This task is disabled. Re-enable it in the tree menu to launch DCC sessions.
                  </p>
                </div>
              ) : (
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
              )
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
                            
                            {/* Action button to open specific workfile in DCC */}
                            {(() => {
                              let appType = '';
                              if (file.ext === 'blend') appType = 'blender';
                              else if (file.ext === 'hip' || file.ext === 'hipnc' || file.ext === 'hiplc') appType = 'houdini';
                              else if (file.ext === 'nk') appType = 'nuke';
                              
                              const app = applications.find(a => a.appType === appType);
                              const isInstalled = app ? app.installed : false;
                              
                              if (!app || !isInstalled) return null;
                              
                              return (
                                <button 
                                  className="btn"
                                  onClick={() => onOpenWorkfile(file)}
                                  disabled={selectedNode.disabled}
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
                                    opacity: selectedNode.disabled ? 0.4 : 1,
                                    cursor: selectedNode.disabled ? 'not-allowed' : 'pointer'
                                  }}
                                  title={selectedNode.disabled ? "This task is disabled" : `Open ${file.name} directly in ${app.name}`}
                                >
                                  Open Scene
                                </button>
                              );
                            })()}
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
                                onContextMenu={(e) => onAssetContextMenu(currentFile, e)}
                                style={{ 
                                  display: 'flex', 
                                  flexDirection: 'column',
                                  background: 'var(--bg-card)', 
                                  border: '1px solid var(--border)', 
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  transition: 'all 200ms ease',
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                                  position: 'relative',
                                  cursor: 'context-menu'
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
                                          const val = e.target.value;
                                          setSelectedUSDVersions(prev => ({
                                            ...prev,
                                            [assetKey]: val
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
                                        {currentFile.application === 'blender' && (
                                          <button 
                                            className="btn"
                                            onClick={() => onLoadInDCC('blender', currentFile.absolutePath)}
                                            disabled={selectedNode.disabled}
                                            style={{ 
                                              flex: 1,
                                              padding: '5px', 
                                              fontSize: '11px',
                                              background: 'rgba(234, 137, 36, 0.15)',
                                              border: '1px solid rgba(234, 137, 36, 0.4)',
                                              color: 'var(--color-blender)',
                                              fontWeight: 500,
                                              opacity: selectedNode.disabled ? 0.4 : 1,
                                              cursor: selectedNode.disabled ? 'not-allowed' : 'pointer'
                                            }}
                                            title={selectedNode.disabled ? "This task is disabled" : "Load USD directly in Blender viewport"}
                                          >
                                            → Blender
                                          </button>
                                        )}
                                        {currentFile.application === 'houdini' && (
                                          <button 
                                            className="btn"
                                            onClick={() => onLoadInDCC('houdini', currentFile.absolutePath)}
                                            disabled={selectedNode.disabled}
                                            style={{ 
                                              flex: 1,
                                              padding: '5px', 
                                              fontSize: '11px',
                                              background: 'rgba(236, 90, 60, 0.15)',
                                              border: '1px solid rgba(236, 90, 60, 0.4)',
                                              color: 'var(--color-houdini)',
                                              fontWeight: 500,
                                              opacity: selectedNode.disabled ? 0.4 : 1,
                                              cursor: selectedNode.disabled ? 'not-allowed' : 'pointer'
                                            }}
                                            title={selectedNode.disabled ? "This task is disabled" : "Load USD directly in Houdini stage network"}
                                          >
                                            → Houdini
                                          </button>
                                        )}
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
  );
}
