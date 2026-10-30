import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { School, ScoreColor } from '../types';
import { 
  Waves, 
  Eye, 
  Send, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Maximize2, 
  Sliders, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2,
  Navigation
} from 'lucide-react';

interface ThreeFloodBasinViewProps {
  schools: School[];
  selectedSchool: School | null;
  onSelectSchool: (school: School) => void;
  onOpenSmsModal: (schoolCode?: string) => void;
}

// Pre-allocated scratch math helpers outside animation loop to avoid GC
const _vec3 = new THREE.Vector3();
const _targetCamPos = new THREE.Vector3();
const _targetControlsTarget = new THREE.Vector3();

export const ThreeFloodBasinView: React.FC<ThreeFloodBasinViewProps> = ({
  schools,
  selectedSchool,
  onSelectSchool,
  onOpenSmsModal,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Simulation controls state
  const [waterLevelMeters, setWaterLevelMeters] = useState<number>(0.78); // +0.78m above danger mark
  const [isControlsCollapsed, setIsControlsCollapsed] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<'OVERVIEW' | 'CHAR' | 'BREACH' | 'BUND'>('OVERVIEW');
  const [focusedSchoolIn3D, setFocusedSchoolIn3D] = useState<School | null>(selectedSchool || schools[1] || null);

  // References to 3D objects for dynamic interaction
  const waterMeshRef = useRef<THREE.Mesh | null>(null);
  const schoolMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const isTransitioningCameraRef = useRef<boolean>(false);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Detect software WebGL guard
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Scene & Renderer Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdce7f0); // soft atmospheric river haze
    scene.fog = new THREE.FogExp2(0xdce7f0, 0.007);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Camera & OrbitControls
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 500);
    camera.position.set(0, 45, 65);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // prevent going below ground
    controls.minDistance = 10;
    controls.maxDistance = 180;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Stop automated scripted transition on user manual pan/zoom
    controls.addEventListener('start', () => {
      isTransitioningCameraRef.current = false;
    });

    // 3. Studio PBR Environment Map via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Lighting Rig
    // Warm key light
    const dirLight = new THREE.DirectionalLight(0xfff3e0, 2.2);
    dirLight.position.set(40, 60, 30);
    dirLight.castShadow = !isSoftwareGl;
    if (dirLight.shadow) {
      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      dirLight.shadow.camera.near = 10;
      dirLight.shadow.camera.far = 160;
      const d = 50;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      dirLight.shadow.bias = -0.0004;
      dirLight.shadow.normalBias = 0.02;
    }
    scene.add(dirLight);

    // Cool Hemisphere Fill Light
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x334155, 1.1);
    scene.add(hemiLight);

    // 5. Procedural Ground & River Terrain Generation
    const terrainSize = 130;
    const terrainGeom = new THREE.PlaneGeometry(terrainSize, terrainSize, 64, 64);
    terrainGeom.rotateX(-Math.PI / 2);

    // Sculpt river channel and islands mathematically
    const posAttr = terrainGeom.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);

      // S-curve river channel through z axis
      const riverCenter = Math.sin(z * 0.06) * 16 - 4;
      const distToRiver = Math.abs(x - riverCenter);

      let y = 0;
      if (distToRiver < 10) {
        // Deep river bed
        y = -2.5 + Math.sin(distToRiver * 0.3) * 0.6;
      } else if (distToRiver < 18) {
        // Muddy river bank slope
        y = -1.2 + (distToRiver - 10) * 0.35;
      } else {
        // Highland plain with gentle agricultural rolls
        y = 1.0 + Math.sin(x * 0.08) * Math.cos(z * 0.08) * 0.9;
        // Raise Mayong highland area (East)
        if (x < -20 && z > 10) y += 2.5;
        // Raise embankment bund
        if (Math.abs(x - 22) < 4) y += 2.2;
      }
      posAttr.setY(i, y);
    }
    terrainGeom.computeVertexNormals();

    // Procedural terrain grass/mud canvas texture
    const terrainCanvas = document.createElement('canvas');
    terrainCanvas.width = 512;
    terrainCanvas.height = 512;
    const ctx = terrainCanvas.getContext('2d')!;
    ctx.fillStyle = '#65a30d'; // vibrant lush Assam green
    ctx.fillRect(0, 0, 512, 512);
    // Add soil variations
    ctx.fillStyle = '#4d7c0f';
    for (let i = 0; i < 400; i++) {
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 12, 12);
    }
    ctx.fillStyle = '#a16207'; // muddy bank strip
    ctx.fillRect(180, 0, 150, 512);

    const terrainTexture = new THREE.CanvasTexture(terrainCanvas);
    terrainTexture.colorSpace = THREE.SRGBColorSpace;
    terrainTexture.wrapS = THREE.RepeatWrapping;
    terrainTexture.wrapT = THREE.RepeatWrapping;
    terrainTexture.repeat.set(4, 4);

    const terrainMat = new THREE.MeshStandardMaterial({
      map: terrainTexture,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true,
    });
    const terrainMesh = new THREE.Mesh(terrainGeom, terrainMat);
    terrainMesh.receiveShadow = !isSoftwareGl;
    scene.add(terrainMesh);

    // 6. Realistic Procedural River Water Plane with animated ripples
    const waterGeom = new THREE.PlaneGeometry(terrainSize, terrainSize, 48, 48);
    waterGeom.rotateX(-Math.PI / 2);

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // deep Brahmaputra silt-blue
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.82,
    });
    const waterMesh = new THREE.Mesh(waterGeom, waterMat);
    waterMesh.position.y = 0.0; // initial water level
    scene.add(waterMesh);
    waterMeshRef.current = waterMesh;

    // 7. Composite 3–12 Part Procedural Models for Each School
    // Placed across coordinates corresponding to Assam Morigaon flood geography
    const schoolCoordsMap: Record<string, [number, number]> = {
      SCH101: [-28, 22],  // Mayong Model (Highland Protected)
      SCH102: [-6, 12],   // Brahmaputra Char LP (Sandbar island, vulnerable)
      SCH103: [2, -18],   // Laharighat Riverview (Eroding riverbank)
      SCH104: [14, -8],   // Kusumtola Adarsha (Partial waterlogging)
      SCH105: [26, -26],  // Bhuragaon Girls High (On protective bund)
      SCH106: [-3, -32],  // Balidunga River Isle (Island char, cut off)
      SCH107: [22, 5],    // Dhing Relief Camp (Highland embankment)
      SCH108: [-35, 8],   // Pabho Kati High (Safe highland)
      SCH109: [6, -38],   // Bhuragaon Tapu (Sand island, low)
      SCH110: [25, 20],   // Dhing Embankment Tribal (Bund safe)
    };

    const schoolGroupMap = new Map<string, THREE.Group>();

    schools.forEach((school) => {
      const coords = schoolCoordsMap[school.code] || [0, 0];
      const schoolGroup = new THREE.Group();
      schoolGroup.position.set(coords[0], 0, coords[1]);

      // Calculate terrain height under building
      const isRed = school.latestScoreColor === 'RED';
      const isYellow = school.latestScoreColor === 'YELLOW';
      const isHighland = school.floodRiskZone === 'MODERATE_RISK';
      const baseElevation = isHighland ? 1.6 : school.floodRiskZone === 'CRITICAL_BASIN' ? -0.2 : 0.8;
      schoolGroup.position.y = baseElevation;

      // Part 1: Reinforced Stilt / Plinth Base
      const plinthGeom = new THREE.BoxGeometry(4.2, 0.6, 3.2);
      const plinthMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.9,
        metalness: 0.1,
      });
      const plinthMesh = new THREE.Mesh(plinthGeom, plinthMat);
      plinthMesh.position.y = 0.3;
      plinthMesh.castShadow = !isSoftwareGl;
      plinthMesh.receiveShadow = !isSoftwareGl;
      schoolGroup.add(plinthMesh);

      // Part 2: Main Classroom Brick Wall Structure
      const wallGeom = new THREE.BoxGeometry(3.6, 1.8, 2.6);
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0xf1f5f9, // lime-washed cream
        roughness: 0.7,
        metalness: 0.05,
      });
      const wallMesh = new THREE.Mesh(wallGeom, wallMat);
      wallMesh.position.y = 1.5;
      wallMesh.castShadow = !isSoftwareGl;
      wallMesh.receiveShadow = !isSoftwareGl;
      schoolGroup.add(wallMesh);

      // Part 3: Corrugated Galvanized Metal Pitched Roof
      const roofGeom = new THREE.ConeGeometry(2.8, 1.1, 4);
      roofGeom.rotateY(Math.PI / 4);
      const roofMat = new THREE.MeshStandardMaterial({
        color: isRed ? 0xbe123c : 0x0284c7, // Red rusted tin or blue fresh tin
        roughness: 0.45,
        metalness: 0.65,
      });
      const roofMesh = new THREE.Mesh(roofGeom, roofMat);
      roofMesh.position.y = 2.95;
      roofMesh.scale.set(1.1, 1, 0.85);
      roofMesh.castShadow = !isSoftwareGl;
      schoolGroup.add(roofMesh);

      // Part 4: Covered Porch / Verandah Overhang
      const porchGeom = new THREE.BoxGeometry(3.8, 0.1, 1.2);
      const porchMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        roughness: 0.5,
      });
      const porchMesh = new THREE.Mesh(porchGeom, porchMat);
      porchMesh.position.set(0, 2.2, 1.4);
      schoolGroup.add(porchMesh);

      // Part 5 & 6: Verandah Pillars
      const pillarGeom = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 6);
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.8 });
      const p1 = new THREE.Mesh(pillarGeom, pillarMat);
      p1.position.set(-1.6, 1.2, 1.8);
      const p2 = new THREE.Mesh(pillarGeom, pillarMat);
      p2.position.set(1.6, 1.2, 1.8);
      schoolGroup.add(p1, p2);

      // Part 7: Flagpole with Tiranga Indian Tricolor
      const poleGeom = new THREE.CylinderGeometry(0.04, 0.04, 3.8, 6);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.2 });
      const poleMesh = new THREE.Mesh(poleGeom, poleMat);
      poleMesh.position.set(-2.2, 1.9, 1.2);
      schoolGroup.add(poleMesh);

      // Part 8: Flood Water Gauge Calibration Pole
      const gaugeGeom = new THREE.BoxGeometry(0.12, 3.5, 0.12);
      const gaugeMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15, // Yellow warning gauge
        roughness: 0.3,
      });
      const gaugeMesh = new THREE.Mesh(gaugeGeom, gaugeMat);
      gaugeMesh.position.set(2.2, 1.0, 1.2);
      schoolGroup.add(gaugeMesh);

      // Part 9: Floating 3D Continuity Score Beacon (Pulsing Diamond)
      const beaconColor = isRed ? 0xe11d48 : isYellow ? 0xd97706 : 0x16a34a;
      const beaconGeom = new THREE.OctahedronGeometry(0.65, 0);
      const beaconMat = new THREE.MeshStandardMaterial({
        color: beaconColor,
        emissive: beaconColor,
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.8,
      });
      const beaconMesh = new THREE.Mesh(beaconGeom, beaconMat);
      beaconMesh.position.y = 5.0;
      beaconMesh.userData = { isBeacon: true, schoolCode: school.code };
      schoolGroup.add(beaconMesh);

      // Part 10: Beacon Halo Ring
      const ringGeom = new THREE.TorusGeometry(1.0, 0.04, 6, 24);
      ringGeom.rotateX(Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: beaconColor,
        transparent: true,
        opacity: 0.5,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.position.y = 5.0;
      schoolGroup.add(ringMesh);

      // Part 11: Soft Radial Contact Shadow Plane
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 64;
      shadowCanvas.height = 64;
      const sCtx = shadowCanvas.getContext('2d')!;
      const grad = sCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
      grad.addColorStop(0, 'rgba(0,0,0,0.5)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 64, 64);
      const shadowTex = new THREE.CanvasTexture(shadowCanvas);
      const shadowGeom = new THREE.PlaneGeometry(6, 5);
      shadowGeom.rotateX(-Math.PI / 2);
      const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      });
      const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
      shadowMesh.position.y = 0.02;
      schoolGroup.add(shadowMesh);

      // Attach metadata for raycasting click
      schoolGroup.userData = { school, schoolCode: school.code };
      scene.add(schoolGroup);
      schoolGroupMap.set(school.code, schoolGroup);
    });

    schoolMeshesRef.current = schoolGroupMap;

    // 8. Composite 5-Part Emergency Relief Boat Model (Navigating river)
    const boatGroup = new THREE.Group();
    boatGroup.position.set(-2, 0.2, 5);
    // Part 1: Boat Hull
    const hullGeom = new THREE.BoxGeometry(4.5, 0.8, 1.8);
    const hullMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });
    const hullMesh = new THREE.Mesh(hullGeom, hullMat);
    boatGroup.add(hullMesh);
    // Part 2: Rescue Orange Canopy
    const canopyGeom = new THREE.BoxGeometry(3.0, 0.1, 1.6);
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 });
    const canopyMesh = new THREE.Mesh(canopyGeom, canopyMat);
    canopyMesh.position.y = 1.6;
    boatGroup.add(canopyMesh);
    // Part 3: Canopy Struts
    const strutGeom = new THREE.CylinderGeometry(0.04, 0.04, 1.4);
    const strutMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    const s1 = new THREE.Mesh(strutGeom, strutMat);
    s1.position.set(-1.2, 0.9, 0.7);
    const s2 = new THREE.Mesh(strutGeom, strutMat);
    s2.position.set(1.2, 0.9, 0.7);
    boatGroup.add(s1, s2);
    // Part 4: Emergency Learning Kits Cargo Crates
    const crateGeom = new THREE.BoxGeometry(1.2, 0.7, 1.1);
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4 });
    const crateMesh = new THREE.Mesh(crateGeom, crateMat);
    crateMesh.position.set(0, 0.6, 0);
    boatGroup.add(crateMesh);

    scene.add(boatGroup);

    // 9. Interactive Raycasting on Click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        // Find ancestor with school data
        let cur: THREE.Object3D | null = intersects[0].object;
        while (cur && !cur.userData?.school) {
          cur = cur.parent;
        }
        if (cur && cur.userData?.school) {
          const clickedSchool: School = cur.userData.school;
          setFocusedSchoolIn3D(clickedSchool);
          onSelectSchool(clickedSchool);

          // Smoothly glide camera focus toward clicked school
          _targetCamPos.set(cur.position.x + 14, cur.position.y + 12, cur.position.z + 18);
          _targetControlsTarget.set(cur.position.x, cur.position.y + 1.5, cur.position.z);
          isTransitioningCameraRef.current = true;
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // 10. Animation & Render Loop
    let animationFrameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Animate floating beacons (rotation & gentle bobbing)
      schoolGroupMap.forEach((grp) => {
        const beacon = grp.children.find((c) => c.userData?.isBeacon);
        if (beacon) {
          beacon.rotation.y += delta * 1.5;
          beacon.position.y = 5.0 + Math.sin(elapsedTime * 2.5 + grp.position.x) * 0.25;
        }
      });

      // Animate relief rescue boat swaying gently on river waves
      boatGroup.position.z = 5 + Math.sin(elapsedTime * 0.8) * 8;
      boatGroup.rotation.z = Math.sin(elapsedTime * 2) * 0.04;
      boatGroup.rotation.x = Math.cos(elapsedTime * 1.5) * 0.03;

      // Smooth camera interpolation if transitioning
      if (isTransitioningCameraRef.current) {
        camera.position.lerp(_targetCamPos, 0.06);
        controls.target.lerp(_targetControlsTarget, 0.06);
        if (camera.position.distanceTo(_targetCamPos) < 0.2) {
          isTransitioningCameraRef.current = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 11. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [schools]);

  // Dynamically update water level plane position
  useEffect(() => {
    if (!waterMeshRef.current) return;
    // Map waterLevelMeters (-0.4m to +1.5m) to 3D Y coordinate
    waterMeshRef.current.position.y = waterLevelMeters * 1.2;
  }, [waterLevelMeters]);

  // Camera preset handler
  const handleApplyPreset = (preset: 'OVERVIEW' | 'CHAR' | 'BREACH' | 'BUND') => {
    if (!cameraRef.current || !controlsRef.current) return;
    setActivePreset(preset);

    if (preset === 'OVERVIEW') {
      _targetCamPos.set(0, 48, 68);
      _targetControlsTarget.set(0, 0, 0);
    } else if (preset === 'CHAR') {
      // Focus on submerged island char (SCH102 / SCH106)
      _targetCamPos.set(-6, 12, 28);
      _targetControlsTarget.set(-6, 0.5, 12);
      const sch = schools.find((s) => s.code === 'SCH102') || schools[1];
      if (sch) setFocusedSchoolIn3D(sch);
    } else if (preset === 'BREACH') {
      // Focus on riverbank erosion zone (Laharighat SCH103)
      _targetCamPos.set(16, 14, -6);
      _targetControlsTarget.set(2, 0, -18);
      const sch = schools.find((s) => s.code === 'SCH103') || schools[2];
      if (sch) setFocusedSchoolIn3D(sch);
    } else if (preset === 'BUND') {
      // Focus on safe highland embankment & relief camp (Dhing SCH107 / SCH105)
      _targetCamPos.set(36, 18, 18);
      _targetControlsTarget.set(24, 2, 5);
      const sch = schools.find((s) => s.code === 'SCH107') || schools[4];
      if (sch) setFocusedSchoolIn3D(sch);
    }
    isTransitioningCameraRef.current = true;
  };

  return (
    <div className="relative w-full h-[calc(100vh-175px)] min-h-[600px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 shadow-md">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Floating Spec Overlay */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/90 text-white rounded-xl p-3 border border-slate-700 shadow-lg text-xs max-w-sm pointer-events-auto">
        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4 text-sky-400" />
          <span className="font-bold tracking-tight">Morigaon 3D Flood Basin Digital Twin</span>
        </div>
        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
          Interactive simulation of Brahmaputra River inundation. Click any 3D school building or beacon to inspect live learning continuity metrics.
        </p>
        <div className="mt-2.5 flex items-center gap-3 text-[10px] font-mono border-t border-slate-800 pt-1.5">
          <span className="text-emerald-400">Green Beacon: &ge;65</span>
          <span className="text-amber-400">Yellow: 35–64</span>
          <span className="text-rose-400">Red: &lt;35 (Crisis)</span>
        </div>
      </div>

      {/* Top Right Quick Presets Pill Bar */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-slate-900/90 text-white p-1 rounded-xl border border-slate-700 shadow-lg text-xs pointer-events-auto">
        <button
          onClick={() => handleApplyPreset('OVERVIEW')}
          className={`px-2.5 py-1.5 rounded-lg transition-colors font-medium ${
            activePreset === 'OVERVIEW' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'
          }`}
        >
          Basin View
        </button>
        <button
          onClick={() => handleApplyPreset('CHAR')}
          className={`px-2.5 py-1.5 rounded-lg transition-colors font-medium ${
            activePreset === 'CHAR' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'
          }`}
        >
          Island Chars
        </button>
        <button
          onClick={() => handleApplyPreset('BREACH')}
          className={`px-2.5 py-1.5 rounded-lg transition-colors font-medium ${
            activePreset === 'BREACH' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'
          }`}
        >
          River Breach
        </button>
        <button
          onClick={() => handleApplyPreset('BUND')}
          className={`px-2.5 py-1.5 rounded-lg transition-colors font-medium ${
            activePreset === 'BUND' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'
          }`}
        >
          Highland Bund
        </button>
      </div>

      {/* Unified Ergonomic Collapsible Bottom Dock (<= 15% Viewport Footprint) */}
      <div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-4xl pointer-events-auto transition-transform duration-300"
        style={{ transform: `translate(-50%, ${isControlsCollapsed ? 'calc(100% - 32px)' : '0'})` }}
      >
        {/* Toggle Button Attached to Top Edge of Dock */}
        <div className="flex justify-center -mb-px">
          <button
            onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
            className="flex items-center gap-1 px-3 py-1 bg-slate-900 border border-slate-700 border-b-0 rounded-t-lg text-[11px] font-semibold text-slate-300 hover:text-white shadow-md cursor-pointer"
          >
            {isControlsCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-sky-400" />
                <span>Show 3D Basin Controls</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                <span>Hide Controls (Zen 3D Mode)</span>
              </>
            )}
          </button>
        </div>

        {/* Dock Surface Body */}
        <div className="bg-slate-900 text-white border border-slate-700 rounded-2xl p-4 shadow-2xl text-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Water Inundation Slider Control (5 cols) */}
            <div className="md:col-span-5 border-r border-slate-800 pr-0 md:pr-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Waves className="w-4 h-4 text-sky-400" />
                  <span>Simulate Flood River Level:</span>
                </span>
                <span className="font-mono font-bold text-sky-300">
                  {waterLevelMeters > 0 ? `+${waterLevelMeters.toFixed(2)}m` : `${waterLevelMeters.toFixed(2)}m`}
                </span>
              </div>
              <input
                type="range"
                min={-0.4}
                max={1.5}
                step={0.05}
                value={waterLevelMeters}
                onChange={(e) => setWaterLevelMeters(parseFloat(e.target.value))}
                className="w-full mt-2 accent-sky-500 cursor-pointer"
              />
              <div className="mt-1 flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Normal (-0.4m)</span>
                <span className="text-amber-400">Danger Mark (0.0m)</span>
                <span className="text-rose-400">Peak Breach (+1.5m)</span>
              </div>
            </div>

            {/* Selected School Telemetry Box (7 cols) */}
            <div className="md:col-span-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              {focusedSchoolIn3D ? (
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-sm text-sky-400">
                      {focusedSchoolIn3D.code}
                    </span>
                    <span className="font-bold text-slate-100 text-sm truncate max-w-[200px]">
                      {focusedSchoolIn3D.name}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-xs ${
                      focusedSchoolIn3D.latestScoreColor === 'RED'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : focusedSchoolIn3D.latestScoreColor === 'YELLOW'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      Score {focusedSchoolIn3D.latestScoreValue} ({focusedSchoolIn3D.latestScoreColor})
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">
                    Status: <strong className="text-slate-200">{focusedSchoolIn3D.latestStatus}</strong> ({focusedSchoolIn3D.daysClosed}d closed) · 
                    Active Kids: <strong className="text-slate-200">{focusedSchoolIn3D.studentsEngaged}</strong> ({focusedSchoolIn3D.engagementPercent}%)
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 italic text-[11px]">
                  Click any 3D school building or beacon pin to inspect details.
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {focusedSchoolIn3D && (
                  <button
                    onClick={() => onOpenSmsModal(focusedSchoolIn3D.code)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors text-xs whitespace-nowrap cursor-pointer shadow-xs"
                  >
                    <Send className="w-3 h-3" />
                    <span>Check-in SMS</span>
                  </button>
                )}
                <button
                  onClick={() => handleApplyPreset('OVERVIEW')}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Reset Camera to Overview"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
