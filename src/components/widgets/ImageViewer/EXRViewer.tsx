import { useEffect, useRef } from "react";
import * as THREE from "three";
import {EXRLoader} from "three/addons/loaders/EXRLoader.js";



type ExrViewerProps = {
  src: string;
};

export default function ExrViewer({
  src
}: ExrViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!rendererRef.current) {
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const renderer = new THREE.WebGLRenderer({antialias: false});
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      renderer.setPixelRatio(1);

      rendererRef.current = renderer;
      containerRef.current.appendChild(renderer.domElement)

      const geometry = new THREE.PlaneGeometry(2, 2);
      const material = new THREE.MeshBasicMaterial();
      const mesh = new THREE.Mesh(geometry, material);

      meshRef.current = mesh;
      scene.add(mesh);
    }
    

    const renderer = rendererRef.current!;
    const scene = sceneRef.current!;
    const mesh = meshRef.current!

    const loader = new EXRLoader();
    loader.setDataType(THREE.HalfFloatType);

    loader.load(
      src,
      (texture) => {
        const img = texture.image;

        const width = img.width;
        const height = img.height;
        const aspect = width / height;

        renderer.setSize(width, height, false);

        const camera = new THREE.OrthographicCamera(
            -aspect,
            aspect,
            1,
            -1,
            0,
            1
        )
        cameraRef.current = camera;

        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        

        const material = mesh.material as THREE.MeshBasicMaterial;
        material.map = texture;
        material.needsUpdate = true;
        mesh.scale.set(aspect, 1, 1);

        renderer.render(scene, camera);
      },
      undefined,
      (err) => {
        console.error("Failed to load EXR:", err);
      }
    );

    return () => {
      const material = mesh.material as THREE.MeshBasicMaterial;
      if (material.map) {
        material.map.dispose();
        material.map = null;
      }
    };
  }, [src]);

  useEffect(() => {
    return () => {
      if (meshRef.current) {
        meshRef.current.geometry.dispose();
        (meshRef.current.material as THREE.Material).dispose();
      }
      rendererRef.current?.dispose();
      if (rendererRef.current?.domElement && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    }
  }, []);

  return <div ref={containerRef} />;
}
