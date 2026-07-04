import { useEffect, useRef } from 'react';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

// ─── CHARACTER MESH DATA ──────────────────────────────────────────────────────

interface MeshData {
  vertices: Record<string, Point3D>;
  edges: [string, string][];
}

const EINSTEIN_MESH: MeshData = {
  vertices: {
    hairTopCenter: { x: 0, y: -58, z: -5 },
    hairTopLeft: { x: -25, y: -55, z: -8 },
    hairTopRight: { x: 25, y: -55, z: -8 },
    hairUpperLeft: { x: -42, y: -40, z: -10 },
    hairUpperRight: { x: 42, y: -40, z: -10 },
    hairMidLeft: { x: -48, y: -18, z: -12 },
    hairMidRight: { x: 48, y: -18, z: -12 },
    hairLowerLeft: { x: -44, y: 10, z: -15 },
    hairLowerRight: { x: 44, y: 10, z: -15 },
    hairBottomLeft: { x: -32, y: 28, z: -18 },
    hairBottomRight: { x: 32, y: 28, z: -18 },
    foreheadCenter: { x: 0, y: -35, z: 15 },
    foreheadLeft: { x: -18, y: -32, z: 12 },
    foreheadRight: { x: 18, y: -32, z: 12 },
    wrinkleUpper1: { x: -15, y: -28, z: 14 },
    wrinkleUpper2: { x: 15, y: -28, z: 14 },
    wrinkleLower1: { x: -12, y: -24, z: 15 },
    wrinkleLower2: { x: 12, y: -24, z: 15 },
    eyebrowLeftOut: { x: -22, y: -18, z: 15 },
    eyebrowLeftIn: { x: -5, y: -16, z: 18 },
    eyebrowRightIn: { x: 5, y: -16, z: 18 },
    eyebrowRightOut: { x: 22, y: -18, z: 15 },
    eyeLeft: { x: -13, y: -8, z: 16 },
    eyeRight: { x: 13, y: -8, z: 16 },
    noseBridge: { x: 0, y: -14, z: 20 },
    noseCenter: { x: 0, y: 4, z: 25 },
    noseTip: { x: 0, y: 8, z: 28 },
    noseLeft: { x: -8, y: 8, z: 22 },
    noseRight: { x: 8, y: 8, z: 22 },
    cheekLeft: { x: -25, y: 4, z: 12 },
    cheekRight: { x: 25, y: 4, z: 12 },
    foldLeft: { x: -18, y: 16, z: 14 },
    foldRight: { x: 18, y: 16, z: 14 },
    mustacheCenter: { x: 0, y: 15, z: 24 },
    mustacheLeft: { x: -16, y: 19, z: 20 },
    mustacheRight: { x: 16, y: 19, z: 20 },
    mustacheTopLeft: { x: -8, y: 14, z: 22 },
    mustacheTopRight: { x: 8, y: 14, z: 22 },
    mustacheBottom: { x: 0, y: 22, z: 22 },
    mouthLeft: { x: -10, y: 22, z: 16 },
    mouthRight: { x: 10, y: 22, z: 16 },
    mouthTop: { x: 0, y: 20, z: 18 },
    mouthBottom: { x: 0, y: 25, z: 18 },
    jawLeftUpper: { x: -28, y: 14, z: 2 },
    jawRightUpper: { x: 28, y: 14, z: 2 },
    jawLeftLower: { x: -20, y: 32, z: 8 },
    jawRightLower: { x: 20, y: 32, z: 8 },
    chin: { x: 0, y: 40, z: 14 },
    throat: { x: 0, y: 46, z: 2 },
  },
  edges: [
    ['hairBottomLeft', 'hairLowerLeft'], ['hairLowerLeft', 'hairMidLeft'], ['hairMidLeft', 'hairUpperLeft'],
    ['hairUpperLeft', 'hairTopLeft'], ['hairTopLeft', 'hairTopCenter'], ['hairTopCenter', 'hairTopRight'],
    ['hairTopRight', 'hairUpperRight'], ['hairUpperRight', 'hairMidRight'], ['hairMidRight', 'hairLowerRight'],
    ['hairLowerRight', 'hairBottomRight'], ['hairTopLeft', 'foreheadLeft'], ['hairTopCenter', 'foreheadCenter'],
    ['hairTopRight', 'foreheadRight'], ['hairUpperLeft', 'foreheadLeft'], ['hairUpperRight', 'foreheadRight'],
    ['hairMidLeft', 'cheekLeft'], ['hairMidRight', 'cheekRight'], ['hairLowerLeft', 'jawLeftUpper'],
    ['hairLowerRight', 'jawRightUpper'], ['hairBottomLeft', 'jawLeftLower'], ['hairBottomRight', 'jawRightLower'],
    ['foreheadLeft', 'foreheadCenter'], ['foreheadCenter', 'foreheadRight'], ['wrinkleUpper1', 'wrinkleUpper2'],
    ['wrinkleLower1', 'wrinkleLower2'], ['foreheadLeft', 'wrinkleUpper1'], ['foreheadRight', 'wrinkleUpper2'],
    ['eyebrowLeftOut', 'eyebrowLeftIn'], ['eyebrowRightIn', 'eyebrowRightOut'], ['foreheadLeft', 'eyebrowLeftOut'],
    ['foreheadRight', 'eyebrowRightOut'], ['foreheadCenter', 'eyebrowLeftIn'], ['foreheadCenter', 'eyebrowRightIn'],
    ['noseBridge', 'noseCenter'], ['noseCenter', 'noseTip'], ['noseTip', 'noseLeft'], ['noseTip', 'noseRight'],
    ['eyebrowLeftIn', 'noseBridge'], ['eyebrowRightIn', 'noseBridge'], ['noseBridge', 'eyeLeft'], ['noseBridge', 'eyeRight'],
    ['eyebrowLeftOut', 'cheekLeft'], ['eyebrowRightOut', 'cheekRight'], ['cheekLeft', 'foldLeft'], ['cheekRight', 'foldRight'],
    ['foldLeft', 'mustacheLeft'], ['foldRight', 'mustacheRight'], ['noseLeft', 'mustacheTopLeft'], ['noseRight', 'mustacheTopRight'],
    ['mustacheTopLeft', 'mustacheCenter'], ['mustacheTopRight', 'mustacheCenter'], ['mustacheLeft', 'mustacheTopLeft'],
    ['mustacheRight', 'mustacheTopRight'], ['mustacheLeft', 'mustacheBottom'], ['mustacheRight', 'mustacheBottom'],
    ['mustacheCenter', 'mustacheBottom'], ['mouthLeft', 'mouthTop'], ['mouthTop', 'mouthRight'], ['mouthRight', 'mouthBottom'],
    ['mouthBottom', 'mouthLeft'], ['jawLeftUpper', 'jawLeftLower'], ['jawRightUpper', 'jawRightLower'],
    ['jawLeftLower', 'chin'], ['jawRightLower', 'chin'], ['mustacheBottom', 'mouthTop'], ['mouthBottom', 'chin'], ['chin', 'throat']
  ]
};

const CLEOPATRA_MESH: MeshData = {
  vertices: {
    // Egyptian Headpiece (Nemis - flat top, flared wide sides)
    headpieceTop: { x: 0, y: -45, z: 5 },
    headpieceTopLeft: { x: -26, y: -40, z: 2 },
    headpieceTopRight: { x: 26, y: -40, z: 2 },
    headpieceMidLeft: { x: -38, y: -10, z: 0 },
    headpieceMidRight: { x: 38, y: -10, z: 0 },
    headpieceBottomLeft: { x: -44, y: 25, z: -10 },
    headpieceBottomRight: { x: 44, y: 25, z: -10 },
    
    // Crown details (Uraeus cobra symbol at forehead center)
    uraeusBase: { x: 0, y: -44, z: 12 },
    uraeusTip: { x: 0, y: -54, z: 16 },

    // Face Outlines
    foreheadCenter: { x: 0, y: -30, z: 15 },
    foreheadLeft: { x: -16, y: -28, z: 12 },
    foreheadRight: { x: 16, y: -28, z: 12 },
    
    // Sleek Eyebrows & Eye Eyeliner details (Egyptian cat eye)
    eyebrowLeftOut: { x: -22, y: -14, z: 15 },
    eyebrowLeftIn: { x: -5, y: -14, z: 18 },
    eyebrowRightIn: { x: 5, y: -14, z: 18 },
    eyebrowRightOut: { x: 22, y: -14, z: 15 },
    
    eyeLeft: { x: -12, y: -6, z: 16 },
    eyeRight: { x: 12, y: -6, z: 16 },
    eyelinerLeft: { x: -24, y: -5, z: 14 },
    eyelinerRight: { x: 24, y: -5, z: 14 },

    // Nose
    noseBridge: { x: 0, y: -10, z: 20 },
    noseTip: { x: 0, y: 8, z: 27 },
    noseLeft: { x: -7, y: 8, z: 21 },
    noseRight: { x: 7, y: 8, z: 21 },

    // Cheek & Lips
    cheekLeft: { x: -24, y: 4, z: 12 },
    cheekRight: { x: 24, y: 4, z: 12 },
    mouthLeft: { x: -11, y: 19, z: 16 },
    mouthRight: { x: 11, y: 19, z: 16 },
    mouthTop: { x: 0, y: 16, z: 19 },
    mouthBottom: { x: 0, y: 22, z: 19 },

    // Jawline & Collar
    jawLeftUpper: { x: -24, y: 12, z: 4 },
    jawRightUpper: { x: 24, y: 12, z: 4 },
    jawLeftLower: { x: -18, y: 28, z: 10 },
    jawRightLower: { x: 18, y: 28, z: 10 },
    chin: { x: 0, y: 36, z: 14 },
    
    // Neck Collar / Necklace (Broad collar - lines running horizontally)
    collarCenter: { x: 0, y: 44, z: 10 },
    collarLeft: { x: -24, y: 44, z: 0 },
    collarRight: { x: 24, y: 44, z: 0 },
    collarOuterLeft: { x: -38, y: 46, z: -10 },
    collarOuterRight: { x: 38, y: 46, z: -10 },
  },
  edges: [
    // Headpiece lines
    ['headpieceTopLeft', 'headpieceTop'], ['headpieceTop', 'headpieceTopRight'],
    ['headpieceTopLeft', 'headpieceMidLeft'], ['headpieceTopRight', 'headpieceMidRight'],
    ['headpieceMidLeft', 'headpieceBottomLeft'], ['headpieceMidRight', 'headpieceBottomRight'],
    ['headpieceTopLeft', 'foreheadLeft'], ['headpieceTopRight', 'foreheadRight'],
    ['headpieceMidLeft', 'cheekLeft'], ['headpieceMidRight', 'cheekRight'],
    
    // Uraeus cobra symbol
    ['uraeusBase', 'uraeusTip'], ['foreheadCenter', 'uraeusBase'],

    // Forehead
    ['foreheadLeft', 'foreheadCenter'], ['foreheadCenter', 'foreheadRight'],
    
    // Eyebrows & Eyes
    ['eyebrowLeftOut', 'eyebrowLeftIn'], ['eyebrowRightIn', 'eyebrowRightOut'],
    ['foreheadLeft', 'eyebrowLeftOut'], ['foreheadRight', 'eyebrowRightOut'],
    ['eyeLeft', 'eyelinerLeft'], ['eyeRight', 'eyelinerRight'],
    ['eyebrowLeftIn', 'noseBridge'], ['eyebrowRightIn', 'noseBridge'],
    
    // Nose
    ['noseBridge', 'noseTip'], ['noseTip', 'noseLeft'], ['noseTip', 'noseRight'],
    ['noseLeft', 'mouthTop'], ['noseRight', 'mouthTop'],
    
    // Mouth
    ['mouthLeft', 'mouthTop'], ['mouthTop', 'mouthRight'], ['mouthRight', 'mouthBottom'], ['mouthBottom', 'mouthLeft'],
    ['cheekLeft', 'mouthLeft'], ['cheekRight', 'mouthRight'],
    
    // Jaw & Chin
    ['jawLeftUpper', 'jawLeftLower'], ['jawRightUpper', 'jawRightLower'],
    ['jawLeftLower', 'chin'], ['jawRightLower', 'chin'],
    ['mouthBottom', 'chin'], ['chin', 'collarCenter'],
    
    // Broad Collar lines
    ['collarLeft', 'collarCenter'], ['collarCenter', 'collarRight'],
    ['collarOuterLeft', 'collarLeft'], ['collarRight', 'collarOuterRight'],
    ['headpieceBottomLeft', 'collarOuterLeft'], ['headpieceBottomRight', 'collarOuterRight']
  ]
};

const CAESAR_MESH: MeshData = {
  vertices: {
    // Laurel Wreath (Crown of leaves around forehead)
    laurelTop: { x: 0, y: -45, z: 8 },
    laurelLeft2: { x: -20, y: -38, z: 12 },
    laurelRight2: { x: 20, y: -38, z: 12 },
    laurelLeft1: { x: -24, y: -26, z: 14 },
    laurelRight1: { x: 24, y: -26, z: 14 },
    laurelNode1: { x: -14, y: -34, z: 16 }, // Leaf node points
    laurelNode2: { x: 14, y: -34, z: 16 },

    // Roman Short Hair Outline
    hairTop: { x: 0, y: -48, z: -2 },
    hairLeft: { x: -28, y: -34, z: -5 },
    hairRight: { x: 28, y: -34, z: -5 },
    hairBackLeft: { x: -30, y: -10, z: -10 },
    hairBackRight: { x: 30, y: -10, z: -10 },

    // Face Structures
    foreheadCenter: { x: 0, y: -30, z: 15 },
    foreheadLeft: { x: -18, y: -28, z: 12 },
    foreheadRight: { x: 18, y: -28, z: 12 },

    // Strong Classical Eyebrows
    eyebrowLeftOut: { x: -22, y: -16, z: 14 },
    eyebrowLeftIn: { x: -6, y: -15, z: 18 },
    eyebrowRightIn: { x: 6, y: -15, z: 18 },
    eyebrowRightOut: { x: 22, y: -16, z: 14 },

    eyeLeft: { x: -13, y: -8, z: 16 },
    eyeRight: { x: 13, y: -8, z: 16 },

    // Defined Roman Aquiline Nose
    noseBridge: { x: 0, y: -12, z: 20 },
    noseBridgeMid: { x: 0, y: 0, z: 26 }, // Aquiline bump
    noseTip: { x: 0, y: 8, z: 28 },
    noseLeft: { x: -7, y: 8, z: 22 },
    noseRight: { x: 7, y: 8, z: 22 },

    // Chiseled Cheekbones & Mouth
    cheekLeft: { x: -26, y: 4, z: 12 },
    cheekRight: { x: 26, y: 4, z: 12 },
    mouthLeft: { x: -12, y: 19, z: 16 },
    mouthRight: { x: 12, y: 19, z: 16 },
    mouthTop: { x: 0, y: 15, z: 19 },
    mouthBottom: { x: 0, y: 22, z: 19 },

    // Defined Roman Jawline & Chin
    jawLeftUpper: { x: -28, y: 12, z: 2 },
    jawRightUpper: { x: 28, y: 12, z: 2 },
    jawLeftLower: { x: -22, y: 30, z: 8 },
    jawRightLower: { x: 22, y: 30, z: 8 },
    chin: { x: 0, y: 40, z: 14 },
    throat: { x: 0, y: 46, z: 2 },
  },
  edges: [
    // Hair
    ['hairTop', 'hairLeft'], ['hairTop', 'hairRight'],
    ['hairLeft', 'hairBackLeft'], ['hairRight', 'hairBackRight'],
    ['hairBackLeft', 'jawLeftUpper'], ['hairBackRight', 'jawRightUpper'],
    
    // Laurel Wreath outline
    ['laurelLeft1', 'laurelLeft2'], ['laurelLeft2', 'laurelTop'],
    ['laurelTop', 'laurelRight2'], ['laurelRight2', 'laurelRight1'],
    ['laurelNode1', 'laurelLeft2'], ['laurelNode2', 'laurelRight2'],
    ['laurelNode1', 'laurelLeft1'], ['laurelNode2', 'laurelRight1'],
    
    // Forehead
    ['foreheadLeft', 'foreheadCenter'], ['foreheadCenter', 'foreheadRight'],
    
    // Eyebrows & Eyes
    ['eyebrowLeftOut', 'eyebrowLeftIn'], ['eyebrowRightIn', 'eyebrowRightOut'],
    ['foreheadLeft', 'eyebrowLeftOut'], ['foreheadRight', 'eyebrowRightOut'],
    ['eyebrowLeftIn', 'noseBridge'], ['eyebrowRightIn', 'noseBridge'],
    
    // Roman Nose (curves outward at bridge mid)
    ['noseBridge', 'noseBridgeMid'], ['noseBridgeMid', 'noseTip'],
    ['noseTip', 'noseLeft'], ['noseTip', 'noseRight'], ['noseLeft', 'mouthTop'], ['noseRight', 'mouthTop'],
    
    // Mouth
    ['mouthLeft', 'mouthTop'], ['mouthTop', 'mouthRight'], ['mouthRight', 'mouthBottom'], ['mouthBottom', 'mouthLeft'],
    
    // Cheek
    ['cheekLeft', 'mouthLeft'], ['cheekRight', 'mouthRight'],
    ['eyebrowLeftOut', 'cheekLeft'], ['eyebrowRightOut', 'cheekRight'],
    
    // Jaw & Chin
    ['jawLeftUpper', 'jawLeftLower'], ['jawRightUpper', 'jawRightLower'],
    ['jawLeftLower', 'chin'], ['jawRightLower', 'chin'],
    ['mouthBottom', 'chin'], ['chin', 'throat']
  ]
};

const NAPOLEON_MESH: MeshData = {
  vertices: {
    // Bicorn Hat (Cocked hat - massive peaks pointing left and right)
    hatPeakLeft: { x: -44, y: -38, z: -5 },
    hatPeakRight: { x: 44, y: -38, z: -5 },
    hatTopCenter: { x: 0, y: -50, z: 4 },
    hatBottomLeft: { x: -28, y: -26, z: 10 },
    hatBottomRight: { x: 28, y: -26, z: 10 },
    hatCockade: { x: -12, y: -36, z: 12 }, // Hat round ribbon details

    // Face structures
    foreheadCenter: { x: 0, y: -25, z: 15 },
    foreheadLeft: { x: -16, y: -24, z: 11 },
    foreheadRight: { x: 16, y: -24, z: 11 },

    // Brows & Eyes
    eyebrowLeftOut: { x: -20, y: -12, z: 14 },
    eyebrowLeftIn: { x: -5, y: -12, z: 17 },
    eyebrowRightIn: { x: 5, y: -12, z: 17 },
    eyebrowRightOut: { x: 20, y: -12, z: 14 },

    eyeLeft: { x: -12, y: -5, z: 15 },
    eyeRight: { x: 12, y: -5, z: 15 },

    // Nose
    noseBridge: { x: 0, y: -8, z: 19 },
    noseTip: { x: 0, y: 8, z: 26 },
    noseLeft: { x: -7, y: 8, z: 20 },
    noseRight: { x: 7, y: 8, z: 20 },

    // Cheeks & Mouth
    cheekLeft: { x: -24, y: 4, z: 11 },
    cheekRight: { x: 24, y: 4, z: 11 },
    mouthLeft: { x: -10, y: 19, z: 15 },
    mouthRight: { x: 10, y: 19, z: 15 },
    mouthTop: { x: 0, y: 16, z: 18 },
    mouthBottom: { x: 0, y: 22, z: 18 },

    // Chiseled Jawline & Chin
    jawLeftUpper: { x: -26, y: 10, z: 2 },
    jawRightUpper: { x: 26, y: 10, z: 2 },
    jawLeftLower: { x: -18, y: 28, z: 8 },
    jawRightLower: { x: 18, y: 28, z: 8 },
    chin: { x: 0, y: 38, z: 13 },

    // High coat collar (Military uniform)
    collarLeft: { x: -22, y: 38, z: -5 },
    collarRight: { x: 22, y: 38, z: -5 },
    collarCenter: { x: 0, y: 44, z: 4 },
  },
  edges: [
    // Bicorn Hat Outlines
    ['hatPeakLeft', 'hatTopCenter'], ['hatTopCenter', 'hatPeakRight'],
    ['hatPeakLeft', 'hatBottomLeft'], ['hatPeakRight', 'hatBottomRight'],
    ['hatBottomLeft', 'hatBottomRight'], ['hatCockade', 'hatTopCenter'],
    ['hatBottomLeft', 'foreheadLeft'], ['hatBottomRight', 'foreheadRight'],
    
    // Forehead
    ['foreheadLeft', 'foreheadCenter'], ['foreheadCenter', 'foreheadRight'],

    // Eyebrows & Eyes
    ['eyebrowLeftOut', 'eyebrowLeftIn'], ['eyebrowRightIn', 'eyebrowRightOut'],
    ['foreheadLeft', 'eyebrowLeftOut'], ['foreheadRight', 'eyebrowRightOut'],
    ['eyebrowLeftIn', 'noseBridge'], ['eyebrowRightIn', 'noseBridge'],

    // Nose
    ['noseBridge', 'noseTip'], ['noseTip', 'noseLeft'], ['noseTip', 'noseRight'],
    ['noseLeft', 'mouthTop'], ['noseRight', 'mouthTop'],

    // Mouth
    ['mouthLeft', 'mouthTop'], ['mouthTop', 'mouthRight'], ['mouthRight', 'mouthBottom'], ['mouthBottom', 'mouthLeft'],
    ['cheekLeft', 'mouthLeft'], ['cheekRight', 'mouthRight'],
    ['eyebrowLeftOut', 'cheekLeft'], ['eyebrowRightOut', 'cheekRight'],

    // Jaw, Chin & High Collar
    ['jawLeftUpper', 'jawLeftLower'], ['jawRightUpper', 'jawRightLower'],
    ['jawLeftLower', 'chin'], ['jawRightLower', 'chin'],
    ['mouthBottom', 'chin'], ['chin', 'collarCenter'],
    ['collarLeft', 'collarCenter'], ['collarCenter', 'collarRight'],
    ['jawLeftUpper', 'collarLeft'], ['jawRightUpper', 'collarRight']
  ]
};

const MESHES: Record<string, MeshData> = {
  einstein: EINSTEIN_MESH,
  cleopatra: CLEOPATRA_MESH,
  caesar: CAESAR_MESH,
  napoleon: NAPOLEON_MESH,
};

interface CharacterHologramProps {
  characterId: string;
  isSpeaking: boolean;
  intensity?: number;
}

export function CharacterHologram({ characterId, isSpeaking, intensity = 1 }: CharacterHologramProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });
  const mouthOpenVal = useRef(0);

  // Default to einstein if key not found
  const selectedMesh = MESHES[characterId.toLowerCase()] || EINSTEIN_MESH;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const nx = (e.clientX / innerWidth) * 2 - 1;
      const ny = (e.clientY / innerHeight) * 2 - 1;
      
      targetRotation.current = {
        x: ny * 0.35,
        y: nx * 0.5,
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const render = () => {
      time += 0.016;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Smooth tracking
      currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * 0.08;
      currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * 0.08;

      // Subtle breath sway
      const swayX = Math.sin(time * 1.1) * 0.03;
      const swayY = Math.cos(time * 0.7) * 0.04;
      const pitch = currentRotation.current.x + swayX;
      const yaw = currentRotation.current.y + swayY;

      // Speak animation
      if (isSpeaking) {
        const speakFreq = Math.abs(Math.sin(time * 18) * 0.6 + Math.sin(time * 10) * 0.4);
        const noise = 0.75 + 0.25 * Math.random();
        const targetOpen = speakFreq * noise * intensity;
        mouthOpenVal.current += (targetOpen - mouthOpenVal.current) * 0.35;
      } else {
        mouthOpenVal.current += (0 - mouthOpenVal.current) * 0.18;
      }

      // Apply coordinates changes
      const vertices: Record<string, Point3D> = {};
      
      Object.entries(selectedMesh.vertices).forEach(([key, pt]) => {
        let yOffset = 0;
        let zOffset = 0;

        // Apply mouth opening offsets
        if (key === 'mouthTop') {
          yOffset = -mouthOpenVal.current * 4.5;
          zOffset = -mouthOpenVal.current * 1.5;
        } else if (key === 'mouthBottom') {
          yOffset = mouthOpenVal.current * 6.5;
          zOffset = -mouthOpenVal.current * 1.0;
        } else if (key === 'mustacheBottom') {
          yOffset = mouthOpenVal.current * 2.0; // Einstein mustache shifts
        } else if (key === 'chin') {
          yOffset = mouthOpenVal.current * 4.5;
        } else if (key === 'jawLeftLower' || key === 'jawRightLower') {
          yOffset = mouthOpenVal.current * 2.0;
        }

        vertices[key] = {
          x: pt.x,
          y: pt.y + yOffset,
          z: pt.z + zOffset,
        };
      });

      // Project 3D points
      const projected: Record<string, { x: number; y: number; z: number }> = {};
      const zoom = Math.min(width, height) * 0.0078;
      const cameraDistance = 200;

      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);

      Object.entries(vertices).forEach(([key, pt]) => {
        const y1 = pt.y * cosP - pt.z * sinP;
        const z1 = pt.y * sinP + pt.z * cosP;
        const x2 = pt.x * cosY + z1 * sinY;
        const z2 = -pt.x * sinY + z1 * cosY;

        const scale = cameraDistance / (cameraDistance + z2);
        
        projected[key] = {
          x: centerX + x2 * scale * zoom,
          y: centerY + y1 * scale * zoom,
          z: z2,
        };
      });

      // Draw edges
      ctx.lineWidth = 1.2;

      selectedMesh.edges.forEach(([p1, p2]) => {
        const pt1 = projected[p1];
        const pt2 = projected[p2];
        if (!pt1 || !pt2) return;

        const avgZ = (pt1.z + pt2.z) / 2;
        const depthOpacity = Math.max(0.12, 1 - (avgZ + 30) / 75);
        
        // Holographic colors
        if (isSpeaking) {
          ctx.strokeStyle = `rgba(0, 255, 180, ${depthOpacity * 0.6})`;
        } else {
          ctx.strokeStyle = `rgba(0, 240, 255, ${depthOpacity * 0.4})`; // blue-cyan cyan neobrutal look
        }

        ctx.beginPath();
        ctx.moveTo(pt1.x, pt1.y);
        ctx.lineTo(pt2.x, pt2.y);
        ctx.stroke();
      });

      // Eye circles
      const drawEye = (eyeKey: string) => {
        const eye = projected[eyeKey];
        if (!eye) return;

        const pulse = 1 + Math.sin(time * 6) * 0.12;
        const radius = 3.5 * pulse;
        
        ctx.strokeStyle = isSpeaking ? 'rgba(0, 255, 180, 0.9)' : 'rgba(0, 240, 255, 0.7)';
        ctx.fillStyle = isSpeaking ? 'rgba(0, 255, 180, 0.25)' : 'rgba(0, 240, 255, 0.15)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.arc(eye.x, eye.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(eye.x - radius - 2, eye.y);
        ctx.lineTo(eye.x + radius + 2, eye.y);
        ctx.moveTo(eye.x, eye.y - radius - 2);
        ctx.lineTo(eye.x, eye.y + radius + 2);
        ctx.stroke();
      };

      if (projected.eyeLeft) drawEye('eyeLeft');
      if (projected.eyeRight) drawEye('eyeRight');

      // Intermittent holographic horizontal sweep line (scanline)
      const sweepY = (time * 120) % (height + 100) - 50;
      if (sweepY > 0 && sweepY < height) {
        ctx.strokeStyle = isSpeaking ? 'rgba(0, 255, 180, 0.12)' : 'rgba(0, 240, 255, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(centerX - 100, sweepY);
        ctx.lineTo(centerX + 100, sweepY);
        ctx.stroke();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [characterId, isSpeaking, intensity, selectedMesh]);

  return (
    <div
      ref={containerRef}
      className="hologram-canvas-container w-full h-full flex items-center justify-center"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
