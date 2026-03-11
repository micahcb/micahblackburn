import * as THREE from "three";

export type FluidExactOptions = {
  resolution: number;
  cursor_size: number;
  mouse_force: number;
  iterations_poisson: number;
  dt: number;
  fluidDecay: number;
  BFECC: boolean;
  blur_scale: number;
  enableBlur: boolean;
  colorScale: number;
};

const DEFAULT_OPTIONS: FluidExactOptions = {
  resolution: 0.25,
  cursor_size: 100,
  mouse_force: 3,
  iterations_poisson: 16,
  dt: 1 / 60,
  fluidDecay: 0.99,
  BFECC: true,
  blur_scale: 1.0,
  enableBlur: true,
  colorScale: 2.0,
};

class MouseTracker {
  coords = new THREE.Vector2(0, 0);
  coordsOld = new THREE.Vector2(0, 0);
  diff = new THREE.Vector2(0, 0);
  moved = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private getBounds: () => DOMRect) {}

  private setCoords(x: number, y: number) {
    if (this.timer) clearTimeout(this.timer);
    this.coords.set(x, y);
    this.moved = true;
    this.timer = setTimeout(() => (this.moved = false), 100);
  }

  onMove = (clientX: number, clientY: number) => {
    const b = this.getBounds();
    const nx = ((clientX - b.left) / b.width) * 2 - 1;
    const ny = -((clientY - b.top) / b.height) * 2 + 1;
    this.setCoords(nx, ny);
  };

  update() {
    this.diff.subVectors(this.coords, this.coordsOld);
    this.coordsOld.copy(this.coords);
    if (this.coordsOld.x === 0 && this.coordsOld.y === 0) {
      this.diff.set(0, 0);
    }
  }

  destroy() {
    if (this.timer) clearTimeout(this.timer);
  }
}

type RTBundle = {
  vel0: THREE.WebGLRenderTarget;
  vel1: THREE.WebGLRenderTarget;
  div: THREE.WebGLRenderTarget;
  pressure0: THREE.WebGLRenderTarget;
  pressure1: THREE.WebGLRenderTarget;
};

function makeRT(w: number, h: number) {
  return new THREE.WebGLRenderTarget(w, h, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.HalfFloatType,
    depthBuffer: false,
    stencilBuffer: false,
  });
}

export class FormlessFluidExact {
  private opts: FluidExactOptions;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  private lastTime = 0;
  private raf = 0;
  private disposed = false;

  private fbos!: RTBundle;
  private fboW = 16;
  private fboH = 16;
  private px = new THREE.Vector2(1 / 16, 1 / 16);

  private mouse: MouseTracker;

  // materials
  private matAdvect!: THREE.ShaderMaterial;
  private matSplat!: THREE.ShaderMaterial;
  private matDivergence!: THREE.ShaderMaterial;
  private matPoisson!: THREE.ShaderMaterial;
  private matPressureGrad!: THREE.ShaderMaterial;
  private matDecay!: THREE.ShaderMaterial;
  private matDisplay!: THREE.ShaderMaterial;
  private matBlur!: THREE.ShaderMaterial;

  private tmpRT!: THREE.WebGLRenderTarget;

  private onMouseMove!: (e: MouseEvent) => void;
  private onTouch!: (e: TouchEvent) => void;
  private onResize!: () => void;

  constructor(
    private wrapper: HTMLElement,
    private allowCursor = true,
    options: Partial<FluidExactOptions> = {}
  ) {
    const rect = this.wrapper.getBoundingClientRect();
    console.log("[FormlessFluidExact] constructor", {
      tagName: this.wrapper.tagName,
      id: this.wrapper.id || "(no id)",
      width: rect.width,
      height: rect.height,
      allowCursor: this.allowCursor,
    });
    this.opts = { ...DEFAULT_OPTIONS, ...options };

    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0xffffff, 0);
    this.wrapper.appendChild(this.renderer.domElement);
    console.log("[FormlessFluidExact] canvas appended, size will be set in resize()");

    this.mouse = new MouseTracker(() => this.wrapper.getBoundingClientRect());

    this.initFBOs();
    this.initShaders();
    this.bindEvents();
    this.resize();
    this.loop();
  }

  private initFBOs() {
    const b = this.wrapper.getBoundingClientRect();
    this.fboW = Math.max(16, Math.floor(b.width * this.opts.resolution));
    this.fboH = Math.max(16, Math.floor(b.height * this.opts.resolution));
    this.px.set(1 / this.fboW, 1 / this.fboH);

    this.fbos = {
      vel0: makeRT(this.fboW, this.fboH),
      vel1: makeRT(this.fboW, this.fboH),
      div: makeRT(this.fboW, this.fboH),
      pressure0: makeRT(this.fboW, this.fboH),
      pressure1: makeRT(this.fboW, this.fboH),
    };
    this.tmpRT = makeRT(this.fboW, this.fboH);
  }

  private disposeFBOs() {
    this.fbos?.vel0?.dispose();
    this.fbos?.vel1?.dispose();
    this.fbos?.div?.dispose();
    this.fbos?.pressure0?.dispose();
    this.fbos?.pressure1?.dispose();
    this.tmpRT?.dispose();
  }

  private initShaders() {
    const vs = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    this.matAdvect = new THREE.ShaderMaterial({
      uniforms: {
        uVel: { value: null },
        uDt: { value: this.opts.dt },
        uPx: { value: this.px },
        uDecay: { value: this.opts.fluidDecay },
        uBFECC: { value: this.opts.BFECC ? 1.0 : 0.0 },
      },
      vertexShader: vs,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D uVel;
        uniform float uDt;
        uniform vec2 uPx;
        uniform float uDecay;
        uniform float uBFECC;

        vec2 sampleVel(vec2 uv){ return texture2D(uVel, uv).xy; }

        void main(){
          vec2 ratio = vec2(max(1.0, 1.0));
          vec2 vel = sampleVel(vUv);
          vec2 uv1 = vUv - vel * uDt * ratio;
          vec2 v1 = sampleVel(uv1);
          vec2 outV = v1;
          if (uBFECC > 0.5) {
            vec2 uv2 = uv1 + v1 * uDt * ratio;
            vec2 err = uv2 - vUv;
            vec2 uv3 = vUv - err * 0.5;
            vec2 v2 = sampleVel(uv3);
            vec2 uv4 = uv3 - v2 * uDt * ratio;
            outV = sampleVel(uv4);
          }
          outV *= uDecay;
          gl_FragColor = vec4(outV, 0.0, 1.0);
        }
      `,
    });

    this.matSplat = new THREE.ShaderMaterial({
      uniforms: {
        uVel: { value: null },
        uCenter: { value: new THREE.Vector2(0, 0) },
        uForce: { value: new THREE.Vector2(0, 0) },
        uRadius: { value: this.opts.cursor_size },
        uPx: { value: this.px },
      },
      vertexShader: vs,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D uVel;
        uniform vec2 uCenter;
        uniform vec2 uForce;
        uniform float uRadius;
        uniform vec2 uPx;

        void main(){
          vec4 v = texture2D(uVel, vUv);
          vec2 p = vUv * 2.0 - 1.0;
          float d = distance(p, uCenter);
          float r = max(uRadius * max(uPx.x, uPx.y), 0.0001);
          float falloff = exp(-pow(d / r, 2.0) * 6.0);
          v.xy += uForce * falloff;
          gl_FragColor = v;
        }
      `,
      blending: THREE.NoBlending,
    });

    this.matDivergence = new THREE.ShaderMaterial({
      uniforms: {
        uVel: { value: null },
        uPx: { value: this.px },
        uDt: { value: this.opts.dt },
      },
      vertexShader: vs,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D uVel;
        uniform vec2 uPx;
        uniform float uDt;
        void main(){
          float x0 = texture2D(uVel, vUv - vec2(uPx.x, 0.0)).x;
          float x1 = texture2D(uVel, vUv + vec2(uPx.x, 0.0)).x;
          float y0 = texture2D(uVel, vUv - vec2(0.0, uPx.y)).y;
          float y1 = texture2D(uVel, vUv + vec2(0.0, uPx.y)).y;
          float div = (x1 - x0 + y1 - y0) * 0.5;
          gl_FragColor = vec4(div / max(uDt, 0.00001), 0.0, 0.0, 1.0);
        }
      `,
    });

    this.matPoisson = new THREE.ShaderMaterial({
      uniforms: {
        uPressure: { value: null },
        uDivergence: { value: null },
        uPx: { value: this.px },
      },
      vertexShader: vs,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D uPressure;
        uniform sampler2D uDivergence;
        uniform vec2 uPx;

        void main(){
          float pL = texture2D(uPressure, vUv - vec2(uPx.x, 0.0)).x;
          float pR = texture2D(uPressure, vUv + vec2(uPx.x, 0.0)).x;
          float pB = texture2D(uPressure, vUv - vec2(0.0, uPx.y)).x;
          float pT = texture2D(uPressure, vUv + vec2(0.0, uPx.y)).x;
          float div = texture2D(uDivergence, vUv).x;
          float p = (pL + pR + pB + pT - div) * 0.25;
          gl_FragColor = vec4(p, 0.0, 0.0, 1.0);
        }
      `,
    });

    this.matPressureGrad = new THREE.ShaderMaterial({
      uniforms: {
        uVel: { value: null },
        uPressure: { value: null },
        uPx: { value: this.px },
        uDt: { value: this.opts.dt },
      },
      vertexShader: vs,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D uVel;
        uniform sampler2D uPressure;
        uniform vec2 uPx;
        uniform float uDt;

        void main(){
          vec2 v = texture2D(uVel, vUv).xy;
          float pL = texture2D(uPressure, vUv - vec2(uPx.x, 0.0)).x;
          float pR = texture2D(uPressure, vUv + vec2(uPx.x, 0.0)).x;
          float pB = texture2D(uPressure, vUv - vec2(0.0, uPx.y)).x;
          float pT = texture2D(uPressure, vUv + vec2(0.0, uPx.y)).x;
          vec2 grad = vec2(pR - pL, pT - pB) * 0.5;
          v -= grad * uDt;
          gl_FragColor = vec4(v, 0.0, 1.0);
        }
      `,
    });

    this.matDecay = new THREE.ShaderMaterial({
      uniforms: {
        uVel: { value: null },
        uDecay: { value: this.opts.fluidDecay },
      },
      vertexShader: vs,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D uVel;
        uniform float uDecay;
        void main(){
          vec4 v = texture2D(uVel, vUv);
          v.xy *= uDecay;
          gl_FragColor = v;
        }
      `,
    });

    this.matDisplay = new THREE.ShaderMaterial({
      uniforms: {
        uVel: { value: null },
        uColorScale: { value: this.opts.colorScale },
      },
      transparent: true,
      vertexShader: vs,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D uVel;
        uniform float uColorScale;

        void main(){
          vec2 vel = texture2D(uVel, vUv).xy;
          float len = length(vel);
          vel = vel * 0.5 + 0.5;
          float r = 0.35 * (1.0 - vel.x);
          float g = vel.y * 0.85;
          float b = vel.x * 1.0;
          vec3 color = vec3(r, g, b);
          vec3 ambient = vec3(0.97, 0.97, 1.0);
          color = mix(ambient, color * uColorScale, min(len * 2.0, 1.0));
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });

    this.matBlur = new THREE.ShaderMaterial({
      uniforms: {
        uTex: { value: null },
        uResolution: { value: new THREE.Vector2(this.fboW, this.fboH) },
        uScale: { value: this.opts.blur_scale },
      },
      vertexShader: vs,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D uTex;
        uniform vec2 uResolution;
        uniform float uScale;

        void main(){
          vec2 px = 1.0 / uResolution;
          float s = max(uScale, 0.0001);

          vec3 col = vec3(0.0);
          col += texture2D(uTex, vUv + px * vec2(-1.0, 0.0) * s).rgb * 0.2;
          col += texture2D(uTex, vUv + px * vec2( 0.0, 0.0) * s).rgb * 0.6;
          col += texture2D(uTex, vUv + px * vec2( 1.0, 0.0) * s).rgb * 0.2;

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
  }

  private bindEvents() {
    this.onMouseMove = (e) => this.mouse.onMove(e.clientX, e.clientY);
    this.onTouch = (e) => {
      const t = e.touches[0];
      if (!t) return;
      this.mouse.onMove(t.clientX, t.clientY);
    };
    this.onResize = () => this.resize();

    document.body.addEventListener("mousemove", this.onMouseMove, false);
    document.body.addEventListener("touchstart", this.onTouch, false);
    document.body.addEventListener("touchmove", this.onTouch, false);
    window.addEventListener("resize", this.onResize);
  }

  private unbindEvents() {
    document.body.removeEventListener("mousemove", this.onMouseMove);
    document.body.removeEventListener("touchstart", this.onTouch);
    document.body.removeEventListener("touchmove", this.onTouch);
    window.removeEventListener("resize", this.onResize);
  }

  private renderPass(
    mat: THREE.ShaderMaterial,
    target: THREE.WebGLRenderTarget | null
  ) {
    this.quad.material = mat;
    this.scene.add(this.quad);
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.scene, this.camera);
    this.scene.remove(this.quad);
  }

  private swapVel() {
    const t = this.fbos.vel0;
    this.fbos.vel0 = this.fbos.vel1;
    this.fbos.vel1 = t;
  }

  private swapPressure() {
    const t = this.fbos.pressure0;
    this.fbos.pressure0 = this.fbos.pressure1;
    this.fbos.pressure1 = t;
  }

  private stepSimulation(dt: number) {
    // 1) advection
    this.matAdvect.uniforms.uVel.value = this.fbos.vel0.texture;
    this.matAdvect.uniforms.uDt.value = dt || this.opts.dt;
    this.matAdvect.uniforms.uDecay.value = this.opts.fluidDecay;
    this.matAdvect.uniforms.uBFECC.value = this.opts.BFECC ? 1 : 0;
    this.renderPass(this.matAdvect, this.fbos.vel1);
    this.swapVel();

    // 2) external cursor force
    if (this.allowCursor) {
      const fx = (this.mouse.diff.x / 2) * this.opts.mouse_force;
      const fy = (this.mouse.diff.y / 2) * this.opts.mouse_force;

      this.matSplat.uniforms.uVel.value = this.fbos.vel0.texture;
      this.matSplat.uniforms.uCenter.value.copy(this.mouse.coords);
      this.matSplat.uniforms.uForce.value.set(fx, fy);
      this.matSplat.uniforms.uRadius.value = this.opts.cursor_size;
      this.renderPass(this.matSplat, this.fbos.vel1);
      this.swapVel();
    }

    // 3) divergence
    this.matDivergence.uniforms.uVel.value = this.fbos.vel0.texture;
    this.matDivergence.uniforms.uDt.value = dt || this.opts.dt;
    this.renderPass(this.matDivergence, this.fbos.div);

    // reset pressure buffers
    this.renderer.setRenderTarget(this.fbos.pressure0);
    this.renderer.clear();
    this.renderer.setRenderTarget(this.fbos.pressure1);
    this.renderer.clear();

    // 4) poisson pressure solve
    for (let i = 0; i < this.opts.iterations_poisson; i++) {
      this.matPoisson.uniforms.uPressure.value = this.fbos.pressure0.texture;
      this.matPoisson.uniforms.uDivergence.value = this.fbos.div.texture;
      this.renderPass(this.matPoisson, this.fbos.pressure1);
      this.swapPressure();
    }

    // 5) subtract pressure gradient
    this.matPressureGrad.uniforms.uVel.value = this.fbos.vel0.texture;
    this.matPressureGrad.uniforms.uPressure.value = this.fbos.pressure0.texture;
    this.matPressureGrad.uniforms.uDt.value = dt || this.opts.dt;
    this.renderPass(this.matPressureGrad, this.fbos.vel1);
    this.swapVel();

    // 6) extra decay pass
    this.matDecay.uniforms.uVel.value = this.fbos.vel0.texture;
    this.matDecay.uniforms.uDecay.value = this.opts.fluidDecay;
    this.renderPass(this.matDecay, this.fbos.vel1);
    this.swapVel();
  }

  private renderDisplay() {
    if (this.opts.enableBlur) {
      this.matDisplay.uniforms.uVel.value = this.fbos.vel0.texture;
      this.renderPass(this.matDisplay, this.tmpRT);

      this.matBlur.uniforms.uTex.value = this.tmpRT.texture;
      this.matBlur.uniforms.uResolution.value.set(this.fboW, this.fboH);
      this.matBlur.uniforms.uScale.value = this.opts.blur_scale;
      this.renderPass(this.matBlur, null);
      return;
    }

    this.matDisplay.uniforms.uVel.value = this.fbos.vel0.texture;
    this.renderPass(this.matDisplay, null);
  }

  private loopCount = 0;
  private loop = () => {
    if (this.disposed) return;
    this.loopCount++;
    if (this.loopCount === 1) {
      const b = this.wrapper.getBoundingClientRect();
      console.log("[FormlessFluidExact] first frame", { width: b.width, height: b.height });
    }
    const now = performance.now() / 1000;
    const dt = this.lastTime ? Math.min(now - this.lastTime, 0.033) : 1 / 60;
    this.lastTime = now;

    this.mouse.update();
    this.stepSimulation(dt);
    this.renderDisplay();

    this.raf = requestAnimationFrame(this.loop);
  };

  resize() {
    const b = this.wrapper.getBoundingClientRect();
    if (b.width === 0 || b.height === 0) {
      console.warn("[FormlessFluidExact] resize: wrapper has zero size", { width: b.width, height: b.height });
    }
    this.renderer.setSize(b.width, b.height, false);

    const nextW = Math.max(16, Math.floor(b.width * this.opts.resolution));
    const nextH = Math.max(16, Math.floor(b.height * this.opts.resolution));
    if (nextW !== this.fboW || nextH !== this.fboH) {
      this.disposeFBOs();
      this.fboW = nextW;
      this.fboH = nextH;
      this.px.set(1 / this.fboW, 1 / this.fboH);

      this.fbos = {
        vel0: makeRT(this.fboW, this.fboH),
        vel1: makeRT(this.fboW, this.fboH),
        div: makeRT(this.fboW, this.fboH),
        pressure0: makeRT(this.fboW, this.fboH),
        pressure1: makeRT(this.fboW, this.fboH),
      };
      this.tmpRT = makeRT(this.fboW, this.fboH);

      this.matAdvect.uniforms.uPx.value = this.px;
      this.matSplat.uniforms.uPx.value = this.px;
      this.matDivergence.uniforms.uPx.value = this.px;
      this.matPoisson.uniforms.uPx.value = this.px;
      this.matPressureGrad.uniforms.uPx.value = this.px;
    }
  }

  destroy() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.unbindEvents();
    this.mouse.destroy();

    this.disposeFBOs();

    this.matAdvect.dispose();
    this.matSplat.dispose();
    this.matDivergence.dispose();
    this.matPoisson.dispose();
    this.matPressureGrad.dispose();
    this.matDecay.dispose();
    this.matDisplay.dispose();
    this.matBlur.dispose();

    this.quad.geometry.dispose();
    this.renderer.dispose();

    if (this.renderer.domElement.parentElement === this.wrapper) {
      this.wrapper.removeChild(this.renderer.domElement);
    }
  }
}
