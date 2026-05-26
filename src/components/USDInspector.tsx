import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  Layers, 
  Search, 
  Info, 
  ArrowRight,
  Sun,
  Camera,
  FileCode,
  AlertCircle
} from 'lucide-react';

interface PrimNode {
  name: string;
  path: string;
  type: string;
  specifier: string;
  active: boolean;
  variantSets: Record<string, { selected: string; options: string[] }>;
  references: Array<{ assetPath: string; primPath: string; type: string }>;
  attributes: Array<{ name: string; type: string; value: any; variability: string }>;
  children: PrimNode[];
}

declare const THREE: any;

interface USD3DViewerProps {
  hierarchy: PrimNode;
  selectedPath: string;
}

function USD3DViewer({ hierarchy, selectedPath }: USD3DViewerProps) {
  const mountRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current || typeof THREE === 'undefined') return;

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x08090d);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(5, 5, 8);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Helpers
    const gridHelper = new THREE.GridHelper(10, 10, 0x00f0ff, 0x1f2937);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(2);
    scene.add(axesHelper);

    // Lights - Premium Studio Clay MatCap Lighting Preset
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const dirLightFill = new THREE.DirectionalLight(0xe0f2fe, 0.35); // Soft blue fill light for beautiful DCC-style rim and contour definition
    dirLightFill.position.set(-5, -5, -5);
    scene.add(dirLightFill);

    // Meshes container
    const meshesGroup = new THREE.Group();
    scene.add(meshesGroup);

    // Recursively add meshes to the group
    const addGeometryNode = (node: any) => {
      if (node.geomData && node.geomData.shape) {
        const geomData = node.geomData;
        let geometry;
        const isSelected = node.path === selectedPath;

        // Shape generation
        if (geomData.shape === 'sphere') {
          geometry = new THREE.SphereGeometry(geomData.radius, 32, 16);
        } else if (geomData.shape === 'cube') {
          const s = geomData.size;
          geometry = new THREE.BoxGeometry(s, s, s);
        } else if (geomData.shape === 'cylinder') {
          geometry = new THREE.CylinderGeometry(geomData.radius, geomData.radius, geomData.height, 32);
        } else if (geomData.shape === 'cone') {
          geometry = new THREE.ConeGeometry(geomData.radius, geomData.height, 32);
        } else if (geomData.shape === 'mesh' && geomData.points) {
          geometry = new THREE.BufferGeometry();
          const vertices = new Float32Array(geomData.points.flat());
          geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
          if (geomData.indices) {
            // USD face orientation is rightHanded (CCW) by default, matching Three.js's winding order.
            // We only swap index 1 and index 2 of every triangle to invert the winding order if orientation is leftHanded (CW).
            // This corrects the normal computation and guarantees faces shade properly in WebGL.
            const finalIndices = [];
            const needSwap = geomData.orientation === 'leftHanded';
            for (let i = 0; i < geomData.indices.length; i += 3) {
              if (i + 2 < geomData.indices.length) {
                if (needSwap) {
                  finalIndices.push(geomData.indices[i]);
                  finalIndices.push(geomData.indices[i + 2]);
                  finalIndices.push(geomData.indices[i + 1]);
                } else {
                  finalIndices.push(geomData.indices[i]);
                  finalIndices.push(geomData.indices[i + 1]);
                  finalIndices.push(geomData.indices[i + 2]);
                }
              }
            }
            geometry.setIndex(finalIndices);
          }
          geometry.computeVertexNormals();
        }

        if (geometry) {
          // Shaded Material - Solid Clay White (Artist MatCap Style)
          const material = new THREE.MeshStandardMaterial({ 
            color: isSelected ? 0x00f0ff : 0xf3f4f6, // Solid neon cyan if selected, sleek premium clay white if unselected
            roughness: 0.35, 
            metalness: 0.05,
            transparent: false,
            side: THREE.DoubleSide // Ensure high-fidelity double-sided rendering for shell planes
          });

          const mesh = new THREE.Mesh(geometry, material);

          // Wireframe Overlay
          const wireGeo = new THREE.WireframeGeometry(geometry);
          const wireMat = new THREE.MeshBasicMaterial({ 
            color: isSelected ? 0xffffff : 0x0f172a, 
            transparent: true, 
            opacity: isSelected ? 0.6 : 0.25 
          });
          const wireframe = new THREE.LineSegments(wireGeo, wireMat);
          mesh.add(wireframe);

          // Apply World Transform matrix
          if (geomData.transform) {
            const matrix = new THREE.Matrix4();
            matrix.fromArray(geomData.transform);
            mesh.applyMatrix4(matrix);
          }

          meshesGroup.add(mesh);
        }
      }

      if (node.children) {
        node.children.forEach((child: any) => addGeometryNode(child));
      }
    };

    addGeometryNode(hierarchy);

    // Render loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();

      // Dispose materials and geometries
      meshesGroup.traverse((object: any) => {
        if (object.isMesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((m: any) => m.dispose());
          } else {
            object.material.dispose();
          }
        }
      });

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [hierarchy, selectedPath]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}

interface USDInspectorProps {
  filePath: string;
  onClose: () => void;
}

export default function USDInspector({ filePath, onClose }: USDInspectorProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usdData, setUsdData] = useState<{
    metadata: {
      filePath: string;
      upAxis: string;
      startTimeCode: number;
      endTimeCode: number;
      framesPerSecond: number;
      hasUSD: boolean;
      mock?: boolean;
    };
    hierarchy: PrimNode;
  } | null>(null);

  const [selectedPrim, setSelectedPrim] = useState<PrimNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ '/': true });

  useEffect(() => {
    fetchUsdData();
  }, [filePath]);

  const fetchUsdData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/usd/inspect?path=${encodeURIComponent(filePath)}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to inspect USD file');
      }
      const data = await response.json();
      setUsdData(data);
      // Select the first root child by default if available
      if (data.hierarchy && data.hierarchy.children && data.hierarchy.children.length > 0) {
        setSelectedPrim(data.hierarchy.children[0]);
      } else {
        setSelectedPrim(data.hierarchy);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while reading the USD file.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadInDCC = async (appType: string) => {
    try {
      const parts = filePath.split('/');
      let taskPath = "";
      const idx = parts.findIndex(p => p === 'wip' || p === 'published' || p === 'versions');
      if (idx !== -1) {
        taskPath = parts.slice(0, idx).join('/');
      } else {
        taskPath = filePath.substring(0, filePath.lastIndexOf('/'));
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
        alert(`Successfully queued load asset for active ${appType} session!`);
      } else {
        const err = await response.json();
        alert(`Failed to load: ${err.detail || 'Connection failed'}`);
      }
    } catch (err: any) {
      alert(`Connection failed: ${err.message}`);
    }
  };

  const getPrimIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('light')) return <Sun size={14} className="text-yellow-400" style={{ color: 'hsl(45, 95%, 55%)' }} />;
    if (t.includes('camera')) return <Camera size={14} className="text-blue-400" style={{ color: 'hsl(200, 90%, 55%)' }} />;
    if (t === 'mesh' || t === 'sphere' || t === 'cube' || t === 'cylinder' || t === 'cone') {
      return <span style={{ color: 'var(--color-usd)' }}><FileCode size={14} /></span>;
    }
    if (t === 'material' || t === 'shader') return <Layers size={14} style={{ color: 'hsl(280, 80%, 65%)' }} />;
    return <Folder size={14} style={{ color: 'var(--text-muted)' }} />;
  };

  const toggleExpand = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Filters the tree based on search query
  const matchesSearch = (node: PrimNode): boolean => {
    if (node.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        node.type.toLowerCase().includes(searchQuery.toLowerCase())) {
      return true;
    }
    return node.children.some(child => matchesSearch(child));
  };

  const renderPrimTree = (node: PrimNode, depth = 0) => {
    const isExpanded = !!expandedNodes[node.path];
    const isSelected = selectedPrim?.path === node.path;
    const hasChildren = node.children && node.children.length > 0;
    
    if (searchQuery && !matchesSearch(node)) {
      return null;
    }

    return (
      <div key={node.path} style={{ marginLeft: depth > 0 ? '12px' : '0' }}>
        <div 
          className={`usd-tree-node ${isSelected ? 'selected' : ''}`}
          onClick={() => setSelectedPrim(node)}
          style={{ 
            opacity: node.active ? 1 : 0.4,
            paddingLeft: depth === 0 ? '8px' : '4px'
          }}
        >
          {hasChildren && (
            <span 
              onClick={(e) => toggleExpand(node.path, e)} 
              style={{ 
                cursor: 'pointer', 
                fontSize: '10px', 
                width: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          {!hasChildren && <span style={{ width: '12px' }} />}
          {getPrimIcon(node.type)}
          <span style={{ fontWeight: isSelected ? '600' : '400' }}>{node.name}</span>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {node.type}
          </span>
        </div>
        
        {hasChildren && (isExpanded || searchQuery) && (
          <div style={{ borderLeft: '1px solid var(--border)', marginLeft: '8px' }}>
            {node.children.map(child => renderPrimTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      {/* Top Header */}
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Layers size={18} style={{ color: 'var(--color-usd)' }} />
          <h2 style={{ textTransform: 'none', letterSpacing: 'normal', fontSize: '14px', fontWeight: 600 }}>
            USD Stage: {filePath.split('/').pop()}
          </h2>
          {usdData?.metadata.mock && (
            <span style={{ 
              fontSize: '10px', 
              background: 'hsla(30, 95%, 55%, 0.15)', 
              color: 'var(--color-blender)',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid hsla(30, 95%, 55%, 0.3)'
            }}>
              Sandbox Simulation Mode
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="btn"
            onClick={() => handleLoadInDCC('blender')}
            style={{ 
              padding: '4px 10px', 
              fontSize: '11.5px',
              background: 'rgba(234, 137, 36, 0.15)',
              border: '1px solid rgba(234, 137, 36, 0.4)',
              color: 'var(--color-blender)'
            }}
            title="Load USD directly in Blender viewport"
          >
            → Load in Blender
          </button>
          <button 
            className="btn"
            onClick={() => handleLoadInDCC('houdini')}
            style={{ 
              padding: '4px 10px', 
              fontSize: '11.5px',
              background: 'rgba(236, 90, 60, 0.15)',
              border: '1px solid rgba(236, 90, 60, 0.4)',
              color: 'var(--color-houdini)'
            }}
            title="Load USD directly in Houdini stage network"
          >
            → Load in Houdini
          </button>
          <button className="btn btn-text" onClick={onClose}>Close</button>
        </div>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <div style={{ width: '28px', height: '28px', border: '3px solid var(--border)', borderTopColor: 'var(--color-usd)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Parsing USD Stage Scene Graph...</span>
        </div>
      ) : error ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center', gap: '16px' }}>
          <AlertCircle size={40} style={{ color: 'var(--color-danger)' }} />
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>Failed to Open USD Stage</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '400px', margin: '0 auto' }}>{error}</p>
          </div>
          <button className="btn" onClick={fetchUsdData}>Retry</button>
        </div>
      ) : usdData ? (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '320px 1fr', overflow: 'hidden' }}>
          
          {/* Left Prim Hierarchy Panel */}
          <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'hsla(220, 16%, 6%, 0.2)' }}>
            <div style={{ padding: '12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 8px', flex: 1 }}>
                <Search size={14} style={{ color: 'var(--text-muted)', marginRight: '6px' }} />
                <input 
                  type="text" 
                  placeholder="Filter prims..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '12px', outline: 'none', width: '100%' }}
                />
              </div>
            </div>

            {/* Stage Info */}
            <div style={{ padding: '8px 12px', fontSize: '11px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', display: 'flex', gap: '12px' }}>
              <span>Up Axis: <strong style={{ color: '#fff' }}>{usdData.metadata.upAxis}</strong></span>
              <span>Frames: <strong style={{ color: '#fff' }}>{usdData.metadata.startTimeCode} - {usdData.metadata.endTimeCode}</strong></span>
              <span>FPS: <strong style={{ color: '#fff' }}>{usdData.metadata.framesPerSecond}</strong></span>
            </div>

            {/* Hierarchy Tree */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {renderPrimTree(usdData.hierarchy)}
            </div>
          </div>

          {/* Right Selected Prim Inspector Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '20px', gap: '20px' }}>
            {selectedPrim ? (
              <>
                {/* 3D Scene Viewport */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>3D Scene Viewport</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Drag to orbit | Right-drag to pan | Scroll to zoom</span>
                  </div>
                  <div style={{ height: '280px', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', background: '#0a0b10', position: 'relative' }}>
                    <USD3DViewer hierarchy={usdData.hierarchy} selectedPath={selectedPrim?.path || ''} />
                  </div>
                </div>

                {/* Prim Title */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>{selectedPrim.path}</span>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                      {selectedPrim.name}
                      <span style={{ 
                        fontSize: '11px', 
                        background: 'var(--bg-active)', 
                        border: '1px solid var(--border-light)', 
                        padding: '2px 8px', 
                        borderRadius: '4px',
                        color: 'var(--color-usd)',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {selectedPrim.specifier} {selectedPrim.type}
                      </span>
                    </h3>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      background: selectedPrim.active ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                      color: selectedPrim.active ? 'var(--color-success)' : 'var(--color-danger)', 
                      padding: '4px 10px', 
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      {selectedPrim.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Composition Arcs */}
                {selectedPrim.references.length > 0 && (
                  <div className="panel" style={{ background: 'var(--bg-card)' }}>
                    <div className="panel-header" style={{ height: '36px', padding: '0 12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Composition Layers (References & Payloads)</span>
                    </div>
                    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedPrim.references.map((ref, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)', background: 'var(--bg-panel)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                          <span style={{ 
                            fontSize: '9px', 
                            background: ref.type === 'reference' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(167, 139, 250, 0.15)', 
                            color: ref.type === 'reference' ? 'var(--color-usd)' : 'hsl(260, 95%, 70%)',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            textTransform: 'uppercase'
                          }}>
                            {ref.type}
                          </span>
                          <span style={{ color: 'var(--text-primary)' }}>{ref.assetPath}</span>
                          {ref.primPath && (
                            <>
                              <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
                              <span style={{ color: 'var(--text-secondary)' }}>{ref.primPath}</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Variant Sets */}
                {Object.keys(selectedPrim.variantSets).length > 0 && (
                  <div className="panel" style={{ background: 'var(--bg-card)' }}>
                    <div className="panel-header" style={{ height: '36px', padding: '0 12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>USD Variant Sets</span>
                    </div>
                    <div style={{ padding: '12px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                      {Object.entries(selectedPrim.variantSets).map(([vsetName, details]) => (
                        <div key={vsetName} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{vsetName}:</span>
                          <select 
                            className="form-select" 
                            value={details.selected || ''} 
                            disabled
                            style={{ padding: '4px 8px', fontSize: '12px', background: 'var(--bg-panel)' }}
                          >
                            {details.options.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attributes Table */}
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>USD Properties & Attributes</h4>
                  {selectedPrim.attributes.length > 0 ? (
                    <div style={{ border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', background: 'var(--bg-card)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'var(--font-sans)', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '8px 12px', fontWeight: 500 }}>Name</th>
                            <th style={{ padding: '8px 12px', fontWeight: 500 }}>Type</th>
                            <th style={{ padding: '8px 12px', fontWeight: 500 }}>Value</th>
                            <th style={{ padding: '8px 12px', fontWeight: 500 }}>Variability</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedPrim.attributes.map((attr, idx) => (
                            <tr key={idx} style={{ borderBottom: idx < selectedPrim.attributes.length - 1 ? '1px solid var(--border)' : 'none' }}>
                              <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: '#fff' }}>{attr.name}</td>
                              <td style={{ padding: '8px 12px', color: 'var(--color-usd)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{attr.type}</td>
                              <td style={{ padding: '8px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                                {Array.isArray(attr.value) ? (
                                  <span style={{ color: 'var(--color-blender)' }}>
                                    [{attr.value.map(v => typeof v === 'number' ? v.toFixed(3) : String(v)).join(', ')}]
                                  </span>
                                ) : typeof attr.value === 'boolean' ? (
                                  <span style={{ color: attr.value ? 'var(--color-success)' : 'var(--color-danger)' }}>{String(attr.value)}</span>
                                ) : attr.value === null || attr.value === undefined ? (
                                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>None</span>
                                ) : (
                                  String(attr.value)
                                )}
                              </td>
                              <td style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: '11px' }}>{attr.variability}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: '16px', border: '1px dashed var(--border)', borderRadius: '6px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                      No attributes defined on this prim.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '8px' }}>
                <Info size={24} />
                <span>Select a USD Prim node in the hierarchy to inspect details.</span>
              </div>
            )}
          </div>

        </div>
      ) : null}
    </div>
  );
}
