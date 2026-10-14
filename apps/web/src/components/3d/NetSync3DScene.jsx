import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function NetSync3DScene({
  onSelectDevice,
  activeDeviceId,
  isSyncing = false,
  syncSourceId,
  syncTargetId,
}) {
  const mountRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [webGLSupported, setWebGLSupported] = useState(true);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Test WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGLSupported(false);
        return;
      }
    } catch (e) {
      setWebGLSupported(false);
      return;
    }

    const width = currentMount.clientWidth || 800;
    const height = currentMount.clientHeight || 460;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 4, 13);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    currentMount.appendChild(renderer.domElement);

    // 2. Central Synchronization Core
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // Inner glowing sphere
    const coreGeo = new THREE.IcosahedronGeometry(0.8, 4);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x45f59a,
      emissive: 0x45f59a,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.9,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(coreMesh);

    // Orbiting glass ring around core
    const ringGeo = new THREE.TorusGeometry(1.4, 0.04, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x8bffd0,
      transparent: true,
      opacity: 0.6,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.5;
    coreGroup.add(ringMesh);

    // Second inclined ring
    const ring2Geo = new THREE.TorusGeometry(1.7, 0.03, 16, 100);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
    });
    const ring2Mesh = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2Mesh.rotation.y = Math.PI / 3;
    ring2Mesh.rotation.x = Math.PI / 4;
    coreGroup.add(ring2Mesh);

    // 3. Device Nodes Definition (Realistic spatial coordinates)
    const devices = [
      { id: 'dev-1', name: 'Workstation Alpha', type: 'Desktop Host', pos: [-4.2, 1.2, 0], color: 0x45f59a, ip: '192.168.1.101', rtt: '0.4ms', status: 'online' },
      { id: 'dev-2', name: 'MacBook Pro M3 Max', type: 'Laptop', pos: [3.8, 1.8, 1], color: 0x8bffd0, ip: '192.168.1.102', rtt: '2.1ms', status: 'online' },
      { id: 'dev-3', name: 'Google Pixel 9 Pro', type: 'Mobile Phone', pos: [3.5, -2.0, 1.5], color: 0x45f59a, ip: '192.168.1.105', rtt: '3.8ms', status: 'online' },
      { id: 'dev-4', name: 'iPad Pro 13"', type: 'Tablet Display', pos: [-3.6, -1.8, -1], color: 0xc5cbd3, ip: '192.168.1.108', rtt: '4.2ms', status: 'online' },
      { id: 'dev-5', name: 'Chrome Browser Node', type: 'Extension Node', pos: [0, 3.2, -1.5], color: 0x38bdf8, ip: '127.0.0.1:9100', rtt: '1.2ms', status: 'online' },
    ];

    const deviceMeshes = [];
    const devicesGroup = new THREE.Group();
    scene.add(devicesGroup);

    devices.forEach((dev) => {
      const devGroup = new THREE.Group();
      devGroup.position.set(...dev.pos);
      devGroup.userData = dev;

      // Outer liquid glass halo
      const haloGeo = new THREE.SphereGeometry(0.55, 24, 24);
      const haloMat = new THREE.MeshStandardMaterial({
        color: dev.color,
        emissive: dev.color,
        emissiveIntensity: 0.5,
        roughness: 0.2,
        metalness: 0.8,
        transparent: true,
        opacity: 0.85,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      devGroup.add(haloMesh);

      // Wireframe pulse ring
      const pulseGeo = new THREE.RingGeometry(0.65, 0.72, 32);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: dev.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4,
      });
      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      pulseMesh.rotation.x = Math.PI / 2;
      devGroup.add(pulseMesh);

      deviceMeshes.push(haloMesh);
      devicesGroup.add(devGroup);
    });

    // 4. Luminous Emerald Connection Curves
    const curvesGroup = new THREE.Group();
    scene.add(curvesGroup);

    const curves = [];
    devices.forEach((dev) => {
      const start = new THREE.Vector3(0, 0, 0); // Core
      const end = new THREE.Vector3(...dev.pos);
      const mid = new THREE.Vector3(
        (start.x + end.x) / 2,
        (start.y + end.y) / 2 + 0.6,
        (start.z + end.z) / 2
      );

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      curves.push(curve);

      const points = curve.getPoints(50);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);
      const curveMat = new THREE.LineBasicMaterial({
        color: 0x45f59a,
        transparent: true,
        opacity: 0.35,
      });
      const line = new THREE.Line(curveGeo, curveMat);
      curvesGroup.add(line);
    });

    // Cross-peer lines between selected devices
    const peerLinks = [[0, 1], [1, 2], [2, 3], [3, 0]];
    peerLinks.forEach(([i, j]) => {
      const p1 = new THREE.Vector3(...devices[i].pos);
      const p2 = new THREE.Vector3(...devices[j].pos);
      const geo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const mat = new THREE.LineBasicMaterial({
        color: 0x8bffd0,
        transparent: true,
        opacity: 0.15,
      });
      curvesGroup.add(new THREE.Line(geo, mat));
    });

    // 5. Flowing Particle Packets along Curves
    const packetCount = 24;
    const packetGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const packetMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const packets = [];

    for (let k = 0; k < packetCount; k++) {
      const pMesh = new THREE.Mesh(packetGeo, packetMat);
      scene.add(pMesh);
      packets.push({
        mesh: pMesh,
        curveIndex: k % curves.length,
        t: Math.random(),
        speed: 0.006 + Math.random() * 0.006,
      });
    }

    // 6. Lighting (Controlled Emerald & Brushed Silver Accents)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const emeraldPoint = new THREE.PointLight(0x45f59a, 3.5, 30);
    emeraldPoint.position.set(0, 2, 4);
    scene.add(emeraldPoint);

    const softFill = new THREE.PointLight(0x8bffd0, 2, 25);
    softFill.position.set(-5, -3, 3);
    scene.add(softFill);

    // 7. Raycasting & Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseMove = (event) => {
      const rect = currentMount.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(deviceMeshes);

      if (intersects.length > 0) {
        const parentDev = intersects[0].object.parent.userData;
        setHoveredNode(parentDev);
        currentMount.style.cursor = 'pointer';
      } else {
        setHoveredNode(null);
        currentMount.style.cursor = 'default';
      }
    };

    const handleClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(deviceMeshes);
      if (intersects.length > 0 && onSelectDevice) {
        onSelectDevice(intersects[0].object.parent.userData);
      }
    };

    currentMount.addEventListener('mousemove', handleMouseMove);
    currentMount.addEventListener('click', handleClick);

    // 8. Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Gentle orbital movement
      coreGroup.rotation.y = elapsedTime * 0.25;
      ringMesh.rotation.z = elapsedTime * 0.15;
      ring2Mesh.rotation.z = -elapsedTime * 0.2;

      // Slow spatial breathing
      devicesGroup.rotation.y = Math.sin(elapsedTime * 0.2) * 0.08;
      curvesGroup.rotation.y = Math.sin(elapsedTime * 0.2) * 0.08;

      // Animate particle packets along bezier curves
      packets.forEach((p) => {
        p.t += p.speed;
        if (p.t > 1) p.t = 0;
        const curve = curves[p.curveIndex];
        if (curve) {
          const pt = curve.getPoint(p.t);
          p.mesh.position.copy(pt);
        }
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
  }, [onSelectDevice]);

  if (!webGLSupported) {
    return (
      <div style={{
        width: '100%',
        height: '420px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(12, 16, 22, 0.7)',
        borderRadius: '18px',
        border: '1px solid var(--border-metallic)',
        padding: '24px',
        textAlign: 'center',
      }}>
        <div className="badge-emerald-pill" style={{ marginBottom: '12px' }}>
          Hardware Acceleration Fallback
        </div>
        <h4 style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>NetSync Mesh Active</h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '360px' }}>
          5 devices connected over LAN sockets (:9100). WebGL fallback enabled for low-power environment.
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '440px', borderRadius: '18px', overflow: 'hidden' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating Spatial HUD Header */}
      <div style={{
        position: 'absolute',
        top: '18px',
        left: '22px',
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="pulse-emerald-dot"></span>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--color-emerald)', textTransform: 'uppercase' }}>
            Spatial Mesh Core • LAN Sockets Active
          </span>
        </div>
        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          P2P Framing • Zero-Clock Monotonic Ordering • mDNS Discovery
        </span>
      </div>

      {/* Hovered Device Inspector Chip */}
      {hoveredNode && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '22px',
          background: 'rgba(7, 9, 11, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(69, 245, 154, 0.35)',
          borderRadius: '14px',
          padding: '14px 18px',
          boxShadow: 'var(--shadow-liquid-glass), var(--shadow-emerald-halo)',
          pointerEvents: 'none',
          minWidth: '220px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{hoveredNode.name}</span>
            <span className="badge-emerald-pill" style={{ fontSize: '0.65rem' }}>Online</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div>Hardware: <span style={{ color: 'var(--text-primary)' }}>{hoveredNode.type}</span></div>
            <div>Socket RTT: <span style={{ color: 'var(--color-emerald)', fontWeight: 600 }}>{hoveredNode.rtt}</span></div>
            <div>Direct IP: <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{hoveredNode.ip}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
