'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Chess, Square } from 'chess.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

function coordsToSquare(col: number, row: number): Square {
  return `${files[col]}${8 - row}` as Square;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.08,
    size / 2,
    size / 2,
    size * 0.48
  );
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.72)');
  grad.addColorStop(0.55, 'rgba(15, 23, 42, 0.34)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createLathePiece(
  points: Array<[number, number]>,
  material: THREE.Material,
  segments = 24
): THREE.Group {
  const group = new THREE.Group();
  const vecs = points.map(([x, y]) => new THREE.Vector2(x, y));
  const geo = new THREE.LatheGeometry(vecs, segments);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return group;
}

function addPart(
  parent: THREE.Group,
  geo: THREE.BufferGeometry,
  material: THREE.Material,
  pos: [number, number, number],
  rot: [number, number, number] = [0, 0, 0]
) {
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(...pos);
  mesh.rotation.set(...rot);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
}

function buildSculptedPiece(pieceType: string, material: THREE.Material): THREE.Group {
  switch (pieceType) {
    case 'p': {
      const pawn = createLathePiece(
        [
          [0.0, 0.0],
          [0.32, 0.0],
          [0.32, 0.07],
          [0.25, 0.13],
          [0.14, 0.28],
          [0.12, 0.42],
          [0.18, 0.46],
          [0.12, 0.5],
          [0.0, 0.52],
        ],
        material
      );
      addPart(pawn, new THREE.SphereGeometry(0.16, 18, 14), material, [0, 0.62, 0]);
      return pawn;
    }
    case 'r': {
      const rook = createLathePiece(
        [
          [0.0, 0.0],
          [0.34, 0.0],
          [0.34, 0.08],
          [0.27, 0.15],
          [0.22, 0.62],
          [0.28, 0.68],
          [0.28, 0.76],
          [0.0, 0.76],
        ],
        material,
        20
      );
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        addPart(
          rook,
          new THREE.BoxGeometry(0.13, 0.12, 0.11),
          material,
          [Math.cos(angle) * 0.2, 0.82, Math.sin(angle) * 0.2],
          [0, -angle, 0]
        );
      }
      return rook;
    }
    case 'n': {
      const knight = createLathePiece(
        [
          [0.0, 0.0],
          [0.34, 0.0],
          [0.34, 0.08],
          [0.26, 0.16],
          [0.21, 0.24],
          [0.0, 0.24],
        ],
        material
      );
      addPart(knight, new THREE.BoxGeometry(0.2, 0.42, 0.26), material, [0, 0.4, 0.02], [0.28, 0, 0]);
      addPart(knight, new THREE.BoxGeometry(0.19, 0.22, 0.34), material, [0, 0.66, 0.11], [0.45, 0, 0]);
      addPart(knight, new THREE.BoxGeometry(0.16, 0.14, 0.2), material, [0, 0.58, 0.24], [0.2, 0, 0]);
      [-0.06, 0.06].forEach((xOff) => {
        addPart(
          knight,
          new THREE.ConeGeometry(0.045, 0.13, 10),
          material,
          [xOff, 0.82, 0.04],
          [0.15, 0, 0]
        );
      });
      return knight;
    }
    case 'b': {
      const bishop = createLathePiece(
        [
          [0.0, 0.0],
          [0.33, 0.0],
          [0.33, 0.08],
          [0.25, 0.16],
          [0.14, 0.58],
          [0.21, 0.63],
          [0.15, 0.68],
          [0.22, 0.82],
          [0.11, 0.96],
          [0.0, 1.0],
        ],
        material
      );
      addPart(bishop, new THREE.SphereGeometry(0.065, 14, 12), material, [0, 1.05, 0]);
      return bishop;
    }
    case 'q': {
      const queen = createLathePiece(
        [
          [0.0, 0.0],
          [0.36, 0.0],
          [0.36, 0.08],
          [0.27, 0.17],
          [0.15, 0.72],
          [0.22, 0.78],
          [0.16, 0.84],
          [0.27, 1.02],
          [0.2, 1.08],
          [0.0, 1.08],
        ],
        material
      );
      addPart(queen, new THREE.SphereGeometry(0.085, 14, 12), material, [0, 1.15, 0]);
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI * 2) / 8;
        addPart(
          queen,
          new THREE.ConeGeometry(0.035, 0.11, 8),
          material,
          [Math.cos(a) * 0.21, 1.11, Math.sin(a) * 0.21]
        );
      }
      return queen;
    }
    case 'k':
    default: {
      const king = createLathePiece(
        [
          [0.0, 0.0],
          [0.37, 0.0],
          [0.37, 0.09],
          [0.28, 0.18],
          [0.16, 0.78],
          [0.24, 0.84],
          [0.17, 0.9],
          [0.25, 1.04],
          [0.18, 1.12],
          [0.0, 1.12],
        ],
        material
      );
      addPart(king, new THREE.BoxGeometry(0.06, 0.24, 0.06), material, [0, 1.24, 0]);
      addPart(king, new THREE.BoxGeometry(0.18, 0.06, 0.06), material, [0, 1.27, 0]);
      return king;
    }
  }
}

export default function ChessBoard3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const chessRef = useRef(new Chess());
  const selectedSquareRef = useRef<Square | null>(null);
  const legalMovesRef = useRef<Array<{ from: Square; to: Square; promotion?: 'q' }>>([]);
  const syncPiecesRef = useRef<() => void>(() => {});
  const updateHighlightsRef = useRef<() => void>(() => {});

  const [turn, setTurn] = useState<'w' | 'b'>('w');
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const syncHud = () => {
    const chess = chessRef.current;
    setTurn(chess.turn());
    setHistory(chess.history());

    if (chess.isCheckmate()) {
      const winner = chess.turn() === 'w' ? 'Pretas' : 'Brancas';
      setStatusBanner(`Xeque-mate! Vitória das ${winner}`);
    } else if (chess.isDraw()) {
      setStatusBanner('Empate!');
    } else if (chess.isCheck()) {
      const side = chess.turn() === 'w' ? 'Brancas' : 'Pretas';
      setStatusBanner(`Xeque sobre as ${side}!`);
    } else {
      setStatusBanner(null);
    }
  };

  const handleReset = () => {
    chessRef.current.reset();
    selectedSquareRef.current = null;
    legalMovesRef.current = [];
    updateHighlightsRef.current();
    syncPiecesRef.current();
    syncHud();
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x12151a);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 11.2, 11.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0, 0);
    controls.maxPolarAngle = Math.PI / 2 - 0.06;
    controls.minDistance = 6;
    controls.maxDistance = 24;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = 0.45;

    scene.add(new THREE.AmbientLight(0xdbeafe, 0.25));

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.2);
    keyLight.position.set(7.5, 11.5, 6.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 35;
    const d = 6.5;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.55);
    rimLight.position.set(-7, 6, -6);
    scene.add(rimLight);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.5, metalness: 0.2 });
    const frameMesh = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.22, 8.6), frameMat);
    frameMesh.position.y = -0.14;
    frameMesh.receiveShadow = true;
    scene.add(frameMesh);

    const boardGroup = new THREE.Group();
    const whiteSquareMat = new THREE.MeshStandardMaterial({ color: 0xe6e4c8, roughness: 0.65 });
    const blackSquareMat = new THREE.MeshStandardMaterial({ color: 0x6b8e4e, roughness: 0.65 });
    const selectedSquareMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 });
    const legalSquareMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.35 });
    const squares: THREE.Mesh[] = [];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isWhite = (row + col) % 2 === 0;
        const baseMat = isWhite ? whiteSquareMat : blackSquareMat;
        const sqName = coordsToSquare(col, row);
        const square = new THREE.Mesh(new THREE.BoxGeometry(1, 0.14, 1), baseMat);
        square.position.set(col - 3.5, -0.07, row - 3.5);
        square.receiveShadow = true;
        square.userData = { square: sqName, baseMat };
        boardGroup.add(square);
        squares.push(square);
      }
    }
    scene.add(boardGroup);

    const piecesGroup = new THREE.Group();
    scene.add(piecesGroup);

    const contactShadowTex = createContactShadowTexture();
    const contactShadowMat = new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.9,
    });
    const shadowGeo = new THREE.PlaneGeometry(0.92, 0.92);

    const matWhitePiece = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.32,
      metalness: 0.05,
    });
    const matBlackPiece = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.32,
      metalness: 0.15,
    });

    const templates = new Map<string, THREE.Object3D>();
    (['p', 'r', 'n', 'b', 'q', 'k'] as const).forEach((code) => {
      templates.set('w' + code, buildSculptedPiece(code, matWhitePiece));
      templates.set('b' + code, buildSculptedPiece(code, matBlackPiece));
    });

    const updateHighlights = () => {
      const selSq = selectedSquareRef.current;
      const destSet = new Set(legalMovesRef.current.map((m) => m.to));

      squares.forEach((sq) => {
        const { square: sqName, baseMat } = sq.userData as {
          square: Square;
          baseMat: THREE.Material;
        };
        if (sqName === selSq) {
          sq.material = selectedSquareMat;
        } else if (destSet.has(sqName)) {
          sq.material = legalSquareMat;
        } else {
          sq.material = baseMat;
        }
      });
    };
    updateHighlightsRef.current = updateHighlights;

    let requestRender = () => {};
    const pieceMeshesBySquare = new Map<string, THREE.Group>();

    const syncPiecesFromBoard = () => {
      const board = chessRef.current.board();
      const selSq = selectedSquareRef.current;
      const activeKeys = new Set<string>();

      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = board[row][col];
          if (!piece) continue;

          const sqName = coordsToSquare(col, row);
          const key = sqName + ":" + piece.color + piece.type;
          activeKeys.add(key);
          const isSelected = sqName === selSq;

          let p: THREE.Group | undefined = pieceMeshesBySquare.get(key);
          if (!p) {
            const tpl = templates.get(piece.color + piece.type);
            if (!tpl) continue;

            p = tpl.clone() as THREE.Group;
            p.rotation.y = piece.color === 'b' ? 0 : Math.PI;

            const shadowPlane = new THREE.Mesh(shadowGeo, contactShadowMat);
            shadowPlane.rotation.x = -Math.PI / 2;
            shadowPlane.position.y = 0.004;
            p.add(shadowPlane);

            p.traverse((obj) => {
              obj.userData.square = sqName;
            });

            pieceMeshesBySquare.set(key, p);
            piecesGroup.add(p);
          }

          if (!p) continue;
          if (!p) continue;
          p.position.set(col - 3.5, isSelected ? 0.25 : 0, row - 3.5);
          p.scale.setScalar(isSelected ? 1.08 : 1);
        }
      }

      for (const [key, mesh] of pieceMeshesBySquare.entries()) {
        if (!activeKeys.has(key)) {
          piecesGroup.remove(mesh);
          pieceMeshesBySquare.delete(key);
        }
      }

      requestRender();
    };
    syncPiecesRef.current = syncPiecesFromBoard;
    syncPiecesFromBoard();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const getClickedSquare = (clientX: number, clientY: number): Square | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const squareHits = raycaster.intersectObjects(squares, false);
      if (squareHits.length > 0) {
        return squareHits[0].object.userData.square as Square;
      }

      const pieceHits = raycaster.intersectObjects(piecesGroup.children, true);
      if (pieceHits.length > 0) {
        let obj: THREE.Object3D | null = pieceHits[0].object;
        while (obj) {
          if (obj.userData?.square) {
            return obj.userData.square as Square;
          }
          obj = obj.parent;
        }
      }

      return null;
    };

    const handleBoardClickAt = (clientX: number, clientY: number) => {
      const clickedSq = getClickedSquare(clientX, clientY);
      if (!clickedSq) return;

      const chess = chessRef.current;
      const selSq = selectedSquareRef.current;

      // 1. Se já há uma peça selecionada, executa o lance se clickedSq for destino legal
      if (selSq && selSq !== clickedSq) {
        const matchingMove = legalMovesRef.current.find((m) => m.to === clickedSq);
        if (matchingMove) {
          try {
            const moved = chess.move({
              from: matchingMove.from,
              to: matchingMove.to,
              promotion: matchingMove.promotion ?? 'q',
            });
            if (moved) {
              selectedSquareRef.current = null;
              legalMovesRef.current = [];
              updateHighlights();
              syncPiecesFromBoard();
              syncHud();
              return;
            }
          } catch {
            // Ignora lance inválido
          }
        }
      }

      // 2. Seleciona ou alterna uma peça da vez
      const piece = chess.get(clickedSq);
      if (piece && piece.color === chess.turn()) {
        if (selSq === clickedSq) {
          selectedSquareRef.current = null;
          legalMovesRef.current = [];
          updateHighlights();
          syncPiecesFromBoard();
          return;
        }

        const verbose = chess.moves({ square: clickedSq, verbose: true });
        selectedSquareRef.current = clickedSq;
        legalMovesRef.current = verbose.map((m) => ({
          from: m.from as Square,
          to: m.to as Square,
          promotion: m.promotion === 'q' || m.piece === 'p' ? 'q' : undefined,
        }));
        updateHighlights();
        syncPiecesFromBoard();
        return;
      }

      // 3. Limpa seleção ao clicar em casa neutra
      if (selSq) {
        selectedSquareRef.current = null;
        legalMovesRef.current = [];
        updateHighlights();
        syncPiecesFromBoard();
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist <= 12) {
        handleBoardClickAt(e.clientX, e.clientY);
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let needsRender = true;
    let animId = 0;
    requestRender = () => {
      needsRender = true;
    };

    const onControlsChange = () => {
      needsRender = true;
    };
    controls.addEventListener('change', onControlsChange);

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dampingActive = controls.update();
      if (needsRender || dampingActive) {
        renderer.render(scene, camera);
        needsRender = false;
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      shadowGeo.dispose();
      contactShadowTex.dispose();
      contactShadowMat.dispose();
      envTarget.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const movePairs: Array<{ num: number; white?: string; black?: string }> = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      num: i / 2 + 1,
      white: history[i],
      black: history[i + 1],
    });
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-zinc-950 text-zinc-100">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-wrap items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/90 px-4 py-2.5 shadow-lg backdrop-blur">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full border ${
              turn === 'w' ? 'bg-white border-zinc-400' : 'bg-zinc-900 border-zinc-500'
            }`}
          />
          <span className="text-sm font-semibold">
            {turn === 'w' ? 'Vez das Brancas' : 'Vez das Pretas'}
          </span>
        </div>

        {statusBanner && (
          <span className="rounded-md bg-amber-500/20 border border-amber-400/50 px-2.5 py-0.5 text-xs font-bold text-amber-300">
            {statusBanner}
          </span>
        )}

        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-500 cursor-pointer"
        >
          Reiniciar
        </button>
      </div>

      <aside className="hidden sm:flex flex-col absolute top-20 right-4 z-10 w-52 max-h-[65vh] rounded-xl border border-zinc-800 bg-zinc-900/85 p-3 shadow-lg backdrop-blur">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
          Histórico de lances
        </h2>
        <div className="overflow-y-auto space-y-1 text-xs font-mono pr-1">
          {movePairs.length === 0 ? (
            <p className="text-zinc-500 font-sans">Nenhum lance ainda.</p>
          ) : (
            movePairs.map((pair) => (
              <div
                key={pair.num}
                className="grid grid-cols-[2rem_1fr_1fr] items-center rounded px-1.5 py-0.5 odd:bg-zinc-800/40"
              >
                <span className="text-zinc-500">{pair.num}.</span>
                <span className="text-zinc-100">{pair.white ?? ''}</span>
                <span className="text-zinc-300">{pair.black ?? ''}</span>
              </div>
            ))
          )}
        </div>
      </aside>

      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
}