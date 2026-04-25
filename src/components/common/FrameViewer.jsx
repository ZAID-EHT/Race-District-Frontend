import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const HARDCODED_IMAGE = '/FrameViewer-Image.png';

// Desktop size - 30% of viewport (change this to adjust size)
const DESKTOP_SIZE = 0.30;
// Mobile size - 85% of viewport
const MOBILE_SIZE = 0.85;

export default function FrameViewer({ imageSrc }) {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Separate effect to handle dimension calculations
  useEffect(() => {
    const updateDimensions = () => {
      const isMobile = window.innerWidth <= 768;
      const SIZE = isMobile ? MOBILE_SIZE : DESKTOP_SIZE;
      const W = Math.round(window.innerWidth * SIZE);
      const H = Math.round(W * 1.25);
      setDimensions({ width: W, height: H });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Effect for Three.js setup
  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;
    
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const CONFIG = {
      frameWidthIn: 16,
      frameHeightIn: 24,
      frameThicknessIn: 0.5,
      printThicknessIn: 0.125,
      frameColor: '#080c12',
      defaultRotY: -0.72,
      defaultRotX: 0.06,
    };

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(dimensions.width, dimensions.height);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, dimensions.width / dimensions.height, 0.1, 100);
    camera.position.set(0, 0, 7);

    scene.add(new THREE.AmbientLight(0xffffff, 1.8));
    const dl = new THREE.DirectionalLight(0xffffff, 0.6);
    dl.position.set(5, 6, 6);
    scene.add(dl);
    const dl2 = new THREE.DirectionalLight(0xffffff, 0.3);
    dl2.position.set(-4, 2, 4);
    scene.add(dl2);
    const dl3 = new THREE.DirectionalLight(0xffffff, 0.3);
    dl3.position.set(0, 0, 8);
    scene.add(dl3);

    const SCALE = 1 / 6;
    const FW = CONFIG.frameWidthIn * SCALE;
    const FH = CONFIG.frameHeightIn * SCALE;
    const FT = CONFIG.frameThicknessIn * SCALE;
    const IT = CONFIG.printThicknessIn * SCALE;
    const iw = FW - FT * 2;
    const ih = FH - FT * 2;
    const R = 0.09;

    function roundedFrameGeo(fw, fh, ft, r, hiw, hih, hr) {
      const shape = new THREE.Shape();
      const hw = fw / 2, hh = fh / 2;
      shape.moveTo(-hw + r, -hh);
      shape.lineTo(hw - r, -hh);
      shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
      shape.lineTo(hw, hh - r);
      shape.quadraticCurveTo(hw, hh, hw - r, hh);
      shape.lineTo(-hw + r, hh);
      shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
      shape.lineTo(-hw, -hh + r);
      shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
      const hole = new THREE.Path();
      hole.moveTo(-hiw + hr, -hih);
      hole.lineTo(hiw - hr, -hih);
      hole.quadraticCurveTo(hiw, -hih, hiw, -hih + hr);
      hole.lineTo(hiw, hih - hr);
      hole.quadraticCurveTo(hiw, hih, hiw - hr, hih);
      hole.lineTo(-hiw + hr, hih);
      hole.quadraticCurveTo(-hiw, hih, -hiw, hih - hr);
      hole.lineTo(-hiw, -hih + hr);
      hole.quadraticCurveTo(-hiw, -hih, -hiw + hr, -hih);
      shape.holes.push(hole);
      return new THREE.ExtrudeGeometry(shape, {
        depth: ft,
        bevelEnabled: true,
        bevelSize: 0.014,
        bevelThickness: 0.014,
        bevelSegments: 4,
      });
    }

    const frameMesh = new THREE.Mesh(
      roundedFrameGeo(FW, FH, FT, R, iw / 2, ih / 2, R * 0.6),
      new THREE.MeshStandardMaterial({ color: CONFIG.frameColor, roughness: 0.18, metalness: 0.85 })
    );
    frameMesh.position.z = -FT / 2;

    const aluMesh = new THREE.Mesh(
      new THREE.BoxGeometry(iw, ih, IT),
      new THREE.MeshStandardMaterial({ color: 0xb8ccd8, roughness: 0.1, metalness: 0.95 })
    );
    aluMesh.position.z = IT / 2 + 0.002;

    const CANVAS_W = 512;
    const CANVAS_H = 768;

    const imgCanvas = document.createElement('canvas');
    imgCanvas.width = CANVAS_W;
    imgCanvas.height = CANVAS_H;
    const ctx = imgCanvas.getContext('2d');
    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const tex = new THREE.CanvasTexture(imgCanvas);
    tex.colorSpace = THREE.SRGBColorSpace;

    const imgMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(iw, ih),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.1, metalness: 0.0, emissive: 0x000000, emissiveIntensity: 0.0 })
    );
    imgMesh.position.z = IT + 0.004;

    const activeSrc = imageSrc || HARDCODED_IMAGE;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvasRatio = CANVAS_W / CANVAS_H;
      const imgRatio = img.width / img.height;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (imgRatio > canvasRatio) {
        sw = img.height * canvasRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / canvasRatio;
        sy = (img.height - sh) / 2;
      }
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, CANVAS_W, CANVAS_H);
      tex.needsUpdate = true;
    };
    img.onerror = () => {
      ctx.fillStyle = '#1a2a3a';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#ffffff44';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Image not found', CANVAS_W / 2, CANVAS_H / 2);
      tex.needsUpdate = true;
    };
    img.src = activeSrc;

    const printGroup = new THREE.Group();
    printGroup.add(aluMesh);
    printGroup.add(imgMesh);
    const master = new THREE.Group();
    master.add(frameMesh);
    master.add(printGroup);
    scene.add(master);

    let isDrag = false, prevX = 0, prevY = 0;
    let rotX = CONFIG.defaultRotX, rotY = CONFIG.defaultRotY;
    let currentExplode = 0, targetExplode = 0;
    let zoom = 7, isInteracting = false, idleTimer = null;

    // --- SLOWER INTRO ANIMATION ---
    // Spin for 4 seconds (slow enough to see the 2x 360° rotation)
    const SPIN_DUR = 4000;
    // Settle to default position over 1.5 seconds
    const SETTLE_DUR = 1500;
    // Total intro time: 5.5 seconds

    let introStartTime = null;
    let introComplete = false;

    const easeInOutCubic = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
    const easeOutCubic = t => 1 - Math.pow(1-t, 3);

    const onInteract = () => {
      if (!introComplete) return;
      isInteracting = true;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { isInteracting = false; }, 2500);
    };

    const onMouseDown = e => { isDrag = true; prevX = e.clientX; prevY = e.clientY; onInteract(); };
    const onMouseUp = () => { isDrag = false; };
    const onMouseMove = e => {
      if (!isDrag) return;
      rotY += (e.clientX - prevX) * 0.013;
      rotX += (e.clientY - prevY) * 0.013;
      rotX = Math.max(-1.1, Math.min(1.1, rotX));
      prevX = e.clientX;
      prevY = e.clientY;
      onInteract();
    };
    const onWheel = e => {
      zoom = Math.max(3.5, Math.min(11, zoom + e.deltaY * 0.012));
      e.preventDefault();
      onInteract();
    };
    let ptx = 0, pty = 0;
    const onTouchStart = e => { ptx = e.touches[0].clientX; pty = e.touches[0].clientY; onInteract(); };
    const onTouchMove = e => {
      rotY += (e.touches[0].clientX - ptx) * 0.015;
      rotX += (e.touches[0].clientY - pty) * 0.015;
      rotX = Math.max(-1.1, Math.min(1.1, rotX));
      ptx = e.touches[0].clientX;
      pty = e.touches[0].clientY;
      e.preventDefault();
      onInteract();
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('touchstart', onTouchStart);
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });

    let animId;
    const animate = (timestamp) => {
      animId = requestAnimationFrame(animate);

      if (!introComplete) {
        if (introStartTime === null) introStartTime = timestamp;
        const elapsed = timestamp - introStartTime;

        if (elapsed < SPIN_DUR) {
          // Phase 1: Slow 2x 360° spin (right-to-left/negative) while moving up and down
          const t = elapsed / SPIN_DUR;
          const ease = easeInOutCubic(t);

          // 2 full rotations right-to-left (negative = right to left)
          master.rotation.y = -Math.PI * 4 * ease;
          master.rotation.x = 0;

          // Arc up and come back down (sine wave, one hump)
          master.position.y = Math.sin(t * Math.PI) * 1.2;

        } else {
          // Phase 2: Ease into default resting position
          const t = Math.min((elapsed - SPIN_DUR) / SETTLE_DUR, 1);
          const ease = easeOutCubic(t);

          // From face-on (0) ease to defaultRotY
          master.rotation.y = CONFIG.defaultRotY * ease;
          master.rotation.x = CONFIG.defaultRotX * ease;
          master.position.y = 0;

          if (t >= 1) {
            introComplete = true;
            master.rotation.y = CONFIG.defaultRotY;
            master.rotation.x = CONFIG.defaultRotX;
            rotY = CONFIG.defaultRotY;
            rotX = CONFIG.defaultRotX;
          }
        }

      } else {
        if (!isInteracting) {
          rotY += (CONFIG.defaultRotY - rotY) * 0.03;
          rotX += (CONFIG.defaultRotX - rotX) * 0.03;
        }
        const side = Math.abs(Math.sin(rotY)) + Math.abs(Math.sin(rotX)) * 0.3;
        targetExplode = isInteracting ? Math.min(1, side * 1.4) : 0;
        currentExplode += (targetExplode - currentExplode) * 0.055;
        const sep = currentExplode * 0.4;
        printGroup.position.z = sep;
        frameMesh.position.z = -FT / 2 - sep * 0.3;
        master.rotation.y = rotY;
        master.rotation.x = rotX;
        camera.position.set(0, 0, zoom);
      }

      renderer.render(scene, camera);
    };
    animate(0);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      renderer.dispose();
    };
  }, [dimensions, imageSrc]);

  return (
    <div
      ref={wrapperRef}
      style={{
        width: dimensions.width || '100%',
        height: dimensions.height || 'auto',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: dimensions.width || '100%',
          height: dimensions.height || 'auto',
          display: 'block',
          cursor: 'grab',
        }}
      />
    </div>
  );
}