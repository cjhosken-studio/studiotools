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

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";

    const scene = new THREE.Scene();

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    containerRef.current.appendChild(renderer.domElement);

    const loader = new EXRLoader();
    let mesh: THREE.Mesh | null = null;
    let camera: THREE.OrthographicCamera | null = null;

    loader.load(
      src,
      (texture) => {
        const img = texture.image;

        const width = img.width;
        const height = img.height;
        const aspect = width / height;

        renderer.setSize(width, height, false);

        camera = new THREE.OrthographicCamera(
            -aspect,
            aspect,
            1,
            -1,
            0,
            1
        )

        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        

        const material = new THREE.MeshBasicMaterial({ map: texture });
        const geometry = new THREE.PlaneGeometry(2 * aspect, 2);

        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        renderer.render(scene, camera);
      },
      undefined,
      (err) => {
        console.error("Failed to load EXR:", err);
      }
    );

    return () => {
      if (mesh) {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [src]);

  return <div ref={containerRef} />;
}
