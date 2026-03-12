"use client";

/**
 * Blocks: physics rectangles + square image masking.
 * - Matter.Bodies.rectangle for collisions/rotation (block-like).
 * - body.id -> { image } metadata; images preloaded from URLs.
 * - Render: translate(position), rotate(angle), rect(-h,-h,2h,2h), clip(), drawImage.
 * - Rotation from collisions makes the image read as a physical block.
 * - restitution/friction/frictionAir/density = buoyant, bouncy, floaty.
 * - Cursor force field ~180px repels blocks for "alive" behavior.
 */
import { useEffect, useRef } from "react";
import Matter from "matter-js";

type OrbMeta = { imageUrl: string; image: HTMLImageElement | null };

/** Work + education logos — orbs use project and school logos */
const WORK_LOGO_URLS = [
  "/work_logos/SmartBettor.png",
  "/work_logos/Oddible.png",
  "/work_logos/Sycamore.svg",
  "/work_logos/BookWallet.svg",
  "/work_logos/CharlesSchwab.png",
  "/work_logos/SparkBeyond.png",
  "/work_logos/NYRR.png",
  "/work_logos/Michigan.png",
  "/work_logos/IE.png",
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useSurpriseFooter() {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const footer = document.getElementById("surpriseFooter") as HTMLDivElement | null;
    const canvas = document.getElementById("orbCanvas") as HTMLCanvasElement | null;
    if (!footer || !canvas) return;

    const controls = document.getElementById("orbControls");
    const shakeBtn = document.getElementById("orbShakeBtn");
    const dropBtn = document.getElementById("orbDropBtn");
    const clearBtn = document.getElementById("orbClearBtn");

    let engine: Matter.Engine | null = null;
    let walls: Matter.Body[] = [];
    let raf = 0;

    const orbMap = new Map<number, OrbMeta>();
    const imageCache = new Map<string, HTMLImageElement>();
    let imagePool: string[] = [];
    let poolQueue: string[] = [];
    const baseR = typeof window !== "undefined" && window.innerWidth > 768 ? 60 : 30;

    const cursor = { x: -9999, y: -9999 };

    const rect = () => footer.getBoundingClientRect();

    function loadPool() {
      imagePool = [...WORK_LOGO_URLS];
      poolQueue = shuffle(imagePool);
    }

    function nextImage(): string {
      if (poolQueue.length === 0) {
        poolQueue = shuffle([...imagePool]);
      }
      return poolQueue.pop()!;
    }

    function spawnOrb(x?: number, y?: number) {
      if (!engine) return;
      const b = rect();
      const half = baseR * (0.9 + Math.random() * 0.2);
      const size = 2 * half;
      const px = x ?? Math.random() * (b.width - size) + half;
      const py = y ?? -size - Math.random() * 400;

      const img = nextImage();
      const body = Matter.Bodies.rectangle(px, py, size, size, {
        restitution: 0.6,
        friction: 0.05,
        frictionAir: 0.005,
        density: 0.001,
        label: "orb",
        slop: 0.01,
      }) as Matter.Body & { blockHalfSize?: number };
      body.blockHalfSize = half;

      const meta: OrbMeta = { imageUrl: img, image: imageCache.get(img) ?? null };
      if (!meta.image) {
        const el = new Image();
        el.crossOrigin = "anonymous";
        el.onload = () => {
          imageCache.set(img, el);
          const m = orbMap.get(body.id);
          if (m) m.image = el;
        };
        el.src = img;
      }

      orbMap.set(body.id, meta);
      Matter.Composite.add(engine.world, body);
    }

    function buildWalls() {
      if (!engine) return;
      const b = rect();
      const floor = Matter.Bodies.rectangle(
        b.width / 2,
        b.height + 25,
        b.width * 2,
        50,
        { isStatic: true, label: "wall" }
      );
      const left = Matter.Bodies.rectangle(
        -25,
        b.height / 2,
        50,
        b.height * 2,
        { isStatic: true, label: "wall" }
      );
      const right = Matter.Bodies.rectangle(
        b.width + 25,
        b.height / 2,
        50,
        b.height * 2,
        { isStatic: true, label: "wall" }
      );
      walls = [floor, left, right];
      Matter.Composite.add(engine.world, walls);
    }

    function getOrbs(): Matter.Body[] {
      if (!engine) return [];
      return Matter.Composite.allBodies(engine.world).filter((b) => b.label === "orb");
    }

    function draw() {
      if (!engine || !canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      const orbs = getOrbs();

      // Cursor repel zone
      if (cursor.x > 0 && cursor.y > 0) {
        for (const orb of orbs) {
          const dx = orb.position.x - cursor.x;
          const dy = orb.position.y - cursor.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180 && dist > 1) {
            const a = 0.025 * (1 - dist / 180);
            Matter.Body.applyForce(orb, orb.position, {
              x: (dx / dist) * a,
              y: (dy / dist) * a,
            });
          }
        }
      }

      // Block look: same bg as BottomBar menu items (bg-white/10, border-white/20)
      for (const orb of orbs) {
        const meta = orbMap.get(orb.id);
        const half = (orb as Matter.Body & { blockHalfSize?: number }).blockHalfSize ?? baseR;

        const radius = Math.min(12, half * 0.25);
        ctx.save();
        ctx.translate(orb.position.x, orb.position.y);
        ctx.rotate(orb.angle);
        ctx.beginPath();
        ctx.roundRect(-half, -half, 2 * half, 2 * half, radius);
        ctx.clip();

        // Same as BottomBar menu: bg-white/10
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.fill();

        if (meta?.image) {
          if (meta.imageUrl.includes("Sycamore")) {
            ctx.fillStyle = "#e8e6e4";
            ctx.fill();
          }
          // Shrink logos so the glass bg is visible around them
          const isPaddedLogo = meta.imageUrl.includes("Michigan") || meta.imageUrl.includes("/IE.") || meta.imageUrl.includes("NYRR.png");
          const size = isPaddedLogo ? half * 0.5 : half * 0.7;
          // Preserve aspect ratio so logos (e.g. Michigan) don't stretch
          const iw = meta.image.naturalWidth || 1;
          const ih = meta.image.naturalHeight || 1;
          const scale = (2 * size) / Math.max(iw, ih);
          const drawW = iw * scale;
          const drawH = ih * scale;
          if (meta.imageUrl.includes("Oddible")) {
            // Round the Oddible logo graphic itself
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(-size, -size, 2 * size, 2 * size, Math.min(14, size * 0.35));
            ctx.clip();
            ctx.drawImage(meta.image, -drawW / 2, -drawH / 2, drawW, drawH);
            ctx.restore();
          } else {
            ctx.drawImage(meta.image, -drawW / 2, -drawH / 2, drawW, drawH);
          }
        }

        // Matte overlay: soft flat layer to dull the surface
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        ctx.fill();

        ctx.restore();

        // Border: same as BottomBar menu (border-white/20)
        ctx.save();
        ctx.translate(orb.position.x, orb.position.y);
        ctx.rotate(orb.angle);
        ctx.beginPath();
        ctx.roundRect(-half, -half, 2 * half, 2 * half, radius);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
    }

    function tick() {
      if (!engine) return;
      Matter.Engine.update(engine, 1000 / 60);
      draw();
      raf = requestAnimationFrame(tick);
    }

    function shake() {
      const orbs = getOrbs();
      orbs.forEach((o) =>
        Matter.Body.setVelocity(o, {
          x: (Math.random() - 0.5) * 20,
          y: -(5 + 15 * Math.random()),
        })
      );
    }

    function dropMore() {
      for (let i = 0; i < 8; i++) setTimeout(() => spawnOrb(), i * 50);
    }

    function clearAndRefill() {
      if (!engine) return;
      const orbs = getOrbs();

      orbs.forEach((o) =>
        Matter.Body.setVelocity(o, {
          x: (Math.random() - 0.5) * 3,
          y: 2 + 4 * Math.random(),
        })
      );

      setTimeout(() => {
        if (!engine) return;
        for (const o of orbs) {
          orbMap.delete(o.id);
          Matter.Composite.remove(engine.world, o);
        }
        for (let i = 0; i < 30; i++) setTimeout(() => spawnOrb(), i * 30);
      }, 200);
    }

    const onResize = () => {
      if (!engine || !canvas) return;
      const b = rect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(b.width * dpr);
      canvas.height = Math.floor(b.height * dpr);
      Matter.Composite.remove(engine.world, walls);
      walls = [];
      buildWalls();
    };

    const onMouseMove = (e: MouseEvent) => {
      const b = rect();
      cursor.x = e.clientX - b.left;
      cursor.y = e.clientY - b.top;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "c" || e.key === "C") {
        controls?.classList.toggle("visible");
      }
    };

    const onFooterClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(".orb-controls")) return;
      dropMore();
    };

    function init() {
      loadPool();

      const dpr = window.devicePixelRatio || 1;
      const b = rect();
      if (!canvas) return;
      canvas.width = Math.floor(b.width * dpr);
      canvas.height = Math.floor(b.height * dpr);

      engine = Matter.Engine.create({
        gravity: { x: 0, y: 0.8 },
        enableSleeping: false,
      });
      (engine as Matter.Engine & { positionIterations?: number }).positionIterations = 6;
      (engine as Matter.Engine & { velocityIterations?: number }).velocityIterations = 4;

      buildWalls();

      for (let i = 0; i < 30; i++) setTimeout(() => spawnOrb(), i * 30);

      tick();
    }

    init();

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("keydown", onKeyDown);
    footer.addEventListener("click", onFooterClick);

    shakeBtn?.addEventListener("click", shake);
    dropBtn?.addEventListener("click", dropMore);
    clearBtn?.addEventListener("click", clearAndRefill);

    cleanupRef.current = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("keydown", onKeyDown);
      footer.removeEventListener("click", onFooterClick);
      shakeBtn?.removeEventListener("click", shake);
      dropBtn?.removeEventListener("click", dropMore);
      clearBtn?.removeEventListener("click", clearAndRefill);
    };

    return () => {
      cleanupRef.current?.();
    };
  }, []);
}
