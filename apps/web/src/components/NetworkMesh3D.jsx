import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function NetworkMesh3D({ onSelectNode }) {
  const mountRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const width = currentMount.clientWidth || 800;
    const height = currentMount.clientHeight || 450;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 5, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    // 2. Nodes Data (Mesh devices)
    const nodes = [
      { id: 'dev-1', name: 'Workstation Alpha', type: 'Desktop (Host)', pos: [0, 0, 0], color: 0x38bdf8, rtt: '0.4ms', ip: '192.168.1.101' },
      { id: 'dev-2', name: 'MacBook Pro M3', type: 'Laptop', pos: [-5, 1.5, 2], color: 0x818cf8, rtt: '2.1ms', ip: '192.168.1.102' },
      { id: 'dev-3', name: 'Google Pixel 9 Pro', type: 'Mobile (Wi-Fi 6)', pos: [4.5, -1, 3], color: 0x34d399, rtt: '3.8ms', ip: '192.168.1.105' },
      { id: 'dev-4', name: 'iPad Pro 13"', type: 'Tablet', pos: [3.5, 3, -3], color: 0xc084fc, rtt: '4.2ms', ip: '192.168.1.108' },
      { id: 'dev-5', name: 'Chrome Browser Ext', type: 'Extension Node', pos: [-4, -2.5, -2], color: 0xf59e0b, rtt: '1.2ms', ip: '127.0.0.1:9100' },
    ];

    const nodeObjects = [];
    const nodeGroup = new THREE.Group();
    scene.add(nodeGroup);

    // Create 3D spheres for each device
    nodes.forEach((node) => {
      // Core sphere
      const geometry = new THREE.SphereGeometry(0.55, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: node.color,
        emissive: node.color,
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.8,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...node.pos);
      mesh.userData = node;

      // Glow halo
      const glowGeo = new THREE.SphereGeometry(0.85, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: node.color,
        transparent: true,
        opacity: 0.15,
        wireframe: true,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      mesh.add(glowMesh);

      nodeObjects.push(mesh);
      nodeGroup.add(mesh);
    });

    // 3. Connect Nodes with Dynamic Mesh Lines
    const linesGroup = new THREE.Group();
    scene.add(linesGroup);

    const linePairs = [
      [0, 1], [0, 2], [0, 3], [0, 4],
      [1, 2], [1, 4], [2, 3], [3, 4],
    ];

    linePairs.forEach(([i, j]) => {
      const p1 = new THREE.Vector3(...nodes[i].pos);
      const p2 = new THREE.Vector3(...nodes[j].pos);
      const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: i === 0 ? 0.45 : 0.2,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      linesGroup.add(line);
    });

    // 4. Moving Data Packets (Pulsing particles along mesh links)
    const packetCount = 20;
    const packetGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const packetMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const packets = [];

    for (let k = 0; k < packetCount; k++) {
      const pMesh = new THREE.Mesh(packetGeo, packetMat);
      const pair = linePairs[k % linePairs.length];
      packets.push({
        mesh: pMesh,
        start: new THREE.Vector3(...nodes[pair[0]].pos),
        end: new THREE.Vector3(...nodes[pair[1]].pos),
        progress: Math.random(),
        speed: 0.005 + Math.random() * 0.008,
      });
      scene.add(pMesh);
    }

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x38bdf8, 3, 50);
    pointLight.position.set(0, 8, 5);
    scene.add(pointLight);

    const purpleLight = new THREE.PointLight(0xa855f7, 2, 50);
    purpleLight.position.set(-6, -4, 4);
    scene.add(purpleLight);

    // 6. Raycasting for Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseMove = (event) => {
      const rect = currentMount.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeObjects);

      if (intersects.length > 0) {
        const data = intersects[0].object.userData;
        setHoveredNode(data);
        currentMount.style.cursor = 'pointer';
      } else {
        setHoveredNode(null);
        currentMount.style.cursor = 'default';
      }
    };

    const handleClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeObjects);
      if (intersects.length > 0 && onSelectNode) {
        onSelectNode(intersects[0].object.userData);
      }
    };

    currentMount.addEventListener('mousemove', handleMouseMove);
    currentMount.addEventListener('click', handleClick);

    // 7. Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Slow orbital rotation of mesh
      nodeGroup.rotation.y = elapsedTime * 0.12;
      linesGroup.rotation.y = elapsedTime * 0.12;

      // Animate packet pulses along connections
      packets.forEach((p) => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;
        p.mesh.position.lerpVectors(p.start, p.end, p.progress);
        // Apply group rotation to packet position
        p.mesh.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.001);
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!currentMount) return;
      const w = currentMount.clientWidth;
      const h = currentMount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      currentMount.removeEventListener('mousemove', handleMouseMove);
      currentMount.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [onSelectNode]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '420px', borderRadius: '16px', overflow: 'hidden' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating HUD Overlay */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '20px',
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="pulse-dot"></span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em', color: '#38bdf8', textTransform: 'uppercase' }}>
            Live Topology Mesh (mDNS + TCP Direct)
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          5 Active Peer Nodes • 0 Dropped Frames • P2P Direct LAN Priority
        </span>
      </div>

      {hoveredNode && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '12px',
          padding: '12px 18px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          pointerEvents: 'none',
          minWidth: '220px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>{hoveredNode.name}</span>
            <span className="badge-pill badge-emerald">Online</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div>Type: <span style={{ color: '#e2e8f0' }}>{hoveredNode.type}</span></div>
            <div>Socket RTT: <span style={{ color: '#38bdf8', fontWeight: 600 }}>{hoveredNode.rtt}</span></div>
            <div>IP Address: <span style={{ color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>{hoveredNode.ip}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
