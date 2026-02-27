
/**
 * SIT Sprinkler Efficiency Visualization
 * Adheres to Group 48 Physics Project Data
 * Particles now splash at their respective emission heights (h0)
 */

let currentV0 = 2.5;
const BETA = 1.5;
const G = 9.81;

// Image calibration (normalized coordinates 0-1)
const GROUND_LINE_NORM = 0.942; // Visual ground level
const NOZZLE_TOP_NORM = 0.150;  // Top of blue pole (1.0m)

// Scaling factors for animation
const PARTICLE_LIFETIME = 3000; 
const EMISSION_RATE = 8; 
const TRAIL_LENGTH = 15;

interface Particle {
  startTime: number;
  h0: number; 
  scenario: number;
  angle: number;
  velocity: number;
  startXNorm: number;
  startYNorm: number;
  isDead: boolean;
  size: number;
  history: {x: number, y: number}[];
}

interface Splash {
  x: number;
  y: number;
  vx: number;
  vy: number;
  startTime: number;
  size: number;
  alpha: number;
  isMist?: boolean;
  colorOffset?: number;
}

interface PhysicsResult {
  range: number;
  height: number;
  time: number;
  vFinal: number;
}

class Simulation {
  particles: Particle[] = [];
  splashes: Splash[] = [];
  bgImage: any = null;
  activeScenario: number = 3;
  activeAngle: number = 30;
  isLaunching: boolean = false;
  imageLoaded: boolean = false;

  configs = [
    { id: 1, x: 0.17, h0: 0.45, dir: 1, label: "S1" },
    { id: 2, x: 0.51, h0: 0.45, dir: 1, label: "S2" },
    { id: 3, x: 0.901, h0: 1.0, dir: -1, label: "S3" }
  ];

  getCurrent() {
    return this.configs.find(c => c.id === this.activeScenario)!;
  }

  addParticles(p: any) {
    const now = p.millis();
    const cfg = this.getCurrent();
    const angleRad = (this.activeAngle * Math.PI) / 180;
    
    // Calculate visual Y start based on 0.25m to 1.0m scale
    const hScale = (GROUND_LINE_NORM - NOZZLE_TOP_NORM) / (1.0 - 0.25);
    const startYNorm = GROUND_LINE_NORM - (cfg.h0 - 0.25) * hScale;

    for (let i = 0; i < EMISSION_RATE; i++) {
      this.particles.push({
        startTime: now - p.random(0, 16),
        h0: cfg.h0,
        scenario: this.activeScenario,
        angle: angleRad + p.random(-0.02, 0.02),
        velocity: currentV0 + p.random(-0.05, 0.05),
        startXNorm: cfg.x,
        startYNorm: startYNorm,
        isDead: false,
        size: p.random(1.2, 3),
        history: []
      });
    }
  }

  calculatePhysics(particle: Particle, now: number) {
    const dt = (now - particle.startTime) / 1000;
    if (dt < 0) return null;

    let dx = 0, dy = 0, vx = 0, vy = 0;
    const cfg = this.configs.find(c => c.id === particle.scenario)!;
    const direction = cfg.dir;

    if (particle.scenario === 1) {
      dx = particle.velocity * Math.cos(particle.angle) * dt;
      dy = particle.velocity * Math.sin(particle.angle) * dt - 0.5 * G * Math.pow(dt, 2);
      vx = particle.velocity * Math.cos(particle.angle);
      vy = particle.velocity * Math.sin(particle.angle) - G * dt;
    } else {
      dx = (particle.velocity * Math.cos(particle.angle) / BETA) * (1 - Math.exp(-BETA * dt));
      dy = (1/BETA) * (particle.velocity * Math.sin(particle.angle) + G/BETA) * (1 - Math.exp(-BETA * dt)) - (G * dt / BETA);
      vx = particle.velocity * Math.cos(particle.angle) * Math.exp(-BETA * dt);
      vy = (particle.velocity * Math.sin(particle.angle) + G/BETA) * Math.exp(-BETA * dt) - (G / BETA);
    }

    const physY = particle.h0 + dy;
    
    // Logic: Splash when height returns to the initial emission height (dy <= 0)
    // and the particle is on its way down (vy < 0)
    if (physY <= 0.45 && vy < 0) {
      particle.isDead = true;
      const vImpact = Math.sqrt(vx * vx + vy * vy);
      
      // Calculate the visual pixel Y for the 0.45m ground line
      const groundYPixel = GROUND_LINE_NORM - (0.45 - 0.25) * ((GROUND_LINE_NORM - NOZZLE_TOP_NORM) / (1.0 - 0.25));

      return { 
        x: particle.startXNorm + (dx * 0.22 * direction), 
        y: groundYPixel, 
        physX: Math.abs(dx), 
        physY: 0.45, 
        impact: true,
        vImpact: vImpact
      };
    }

    const hScale = (GROUND_LINE_NORM - NOZZLE_TOP_NORM) / (1.0 - 0.25);
    const screenYNorm = GROUND_LINE_NORM - (physY - 0.25) * hScale;

    return { 
      x: particle.startXNorm + (dx * 0.22 * direction), 
      y: screenYNorm, 
      physX: Math.abs(dx), 
      physY: physY, 
      impact: false,
      vImpact: Math.sqrt(vx * vx + vy * vy)
    };
  }

solveScenario(scenarioId, angleDeg, v0) {
    const g = 9.81;
    const beta = 1.5; 
    const angleRad = (angleDeg * Math.PI) / 180;
    
    const vx0 = v0 * Math.cos(angleRad);
    const vy0 = v0 * Math.sin(angleRad);

    
    if (scenarioId === 1) {
        
        const tFlight = (2 * vy0) / g;
        return {
            range: vx0 * tFlight,
            height: (vy0 * vy0) / (2 * g),
            time: tFlight,
            vFinal: v0
        };
    }

    
    const h0 = (scenarioId === 3) ? 1.0 : 0.0;


    let t = (scenarioId === 3) ? 0.65 : 0.36; 
    for (let i = 0; i < 15; i++) {
        let exp = Math.exp(-beta * t);
        let y = h0 + (1/beta) * (vy0 + g/beta) * (1 - exp) - (g * t / beta);
        let vy_t = (vy0 + g/beta) * exp - (g / beta);
        t = t - y / vy_t; 
    }

    
    const range = (vx0 / beta) * (1 - Math.exp(-beta * t));

   
    const tApex = -(1 / beta) * Math.log(g / (g + beta * vy0));
    let maxHeight = h0;
    if (tApex > 0) {
        maxHeight = h0 + (1/beta) * (vy0 + g/beta) * (1 - Math.exp(-beta * tApex)) - (g * tApex / beta);
    }

    return {
        range: range,      
        height: maxHeight,
        time: t,
        vFinal: Math.sqrt(Math.pow(vx0 * Math.exp(-beta * t), 2) + Math.pow((vy0 + g/beta) * Math.exp(-beta * t) - g/beta, 2))
    };
}
}

const sim = new Simulation();
const p = (window as any);

p.preload = () => {
  sim.bgImage = p.loadImage('https://raw.githubusercontent.com/DagmawiTeweldebrhan/Battery-Study-SIT/main/Design1.PNG', 
    () => { sim.imageLoaded = true; });
};

p.setup = () => {
  const container = document.getElementById('canvas-container');
  const canvas = p.createCanvas(container?.clientWidth || 1200, container?.clientHeight || 800);
  canvas.parent('canvas-container');

  document.getElementById('launch-btn')?.addEventListener('click', () => {
    sim.isLaunching = true;
    sim.particles = [];
    sim.splashes = [];
  });

  document.getElementById('scenario-select')?.addEventListener('change', (e: any) => {
    sim.activeScenario = parseInt(e.target.value);
    sim.isLaunching = false;
    sim.particles = [];
    sim.splashes = [];
    updateGraphs();
    updateTelemetry(0, 0, 0);
  });

  document.getElementById('angle-select')?.addEventListener('change', (e: any) => {
    sim.activeAngle = parseInt(e.target.value);
    sim.isLaunching = false;
    sim.particles = [];
    updateGraphs();
    updateTelemetry(0, 0, 0);
  });

  const velSlider = document.getElementById('velocity-slider') as HTMLInputElement;
  const velDisplay = document.getElementById('velocity-display');
  const v0MathDisplay = document.getElementById('v0-math');

  velSlider?.addEventListener('input', (e: any) => {
    currentV0 = parseFloat(e.target.value);
    if (velDisplay) velDisplay.innerText = `${currentV0.toFixed(1)} m/s`;
    if (v0MathDisplay) v0MathDisplay.innerText = currentV0.toFixed(1);
    sim.isLaunching = false;
    sim.particles = [];
    updateGraphs();
    updateTelemetry(0, 0, 0);
  });

  updateGraphs();
  updateTelemetry(0, 0, 0);
};

function updateGraphs() {
  const angle = sim.activeAngle;
  document.querySelectorAll('.bar').forEach(b => b.classList.remove('active'));
  
  for (let i = 1; i <= 3; i++) {
    const data = sim.solveScenario(i, angle, currentV0);
    if (i === sim.activeScenario) {
        document.getElementById(`bar-range-${i}`)?.classList.add('active');
        document.getElementById(`bar-height-${i}`)?.classList.add('active');
        document.getElementById(`bar-vel-${i}`)?.classList.add('active');
    }
    const barR = document.getElementById(`bar-range-${i}`);
    const valR = document.getElementById(`val-range-${i}`);
    if (barR && valR) {
      const h = (data.range / 5) * 100;
      barR.style.height = `${Math.min(100, Math.max(4, h))}%`;
      valR.innerText = data.range.toFixed(2);
    }
    const barH = document.getElementById(`bar-height-${i}`);
    const valH = document.getElementById(`val-height-${i}`);
    if (barH && valH) {
      const h = (data.height / 2) * 100;
      barH.style.height = `${Math.min(100, Math.max(4, h))}%`;
      valH.innerText = data.height.toFixed(2);
    }
    const barV = document.getElementById(`bar-vel-${i}`);
    const valV = document.getElementById(`val-vel-${i}`);
    if (barV && valV) {
      const h = (data.vFinal / 6) * 100;
      barV.style.height = `${Math.min(100, Math.max(4, h))}%`;
      valV.innerText = data.vFinal.toFixed(2);
    }
  }
}

function updateTelemetry(currentR: number, currentH: number, currentT: number) {
  const target = sim.solveScenario(sim.activeScenario, sim.activeAngle, currentV0);
  const rVal = document.getElementById('range-val');
  const hVal = document.getElementById('height-val');
  const tVal = document.getElementById('time-val');
  const eVal = document.getElementById('energy-val');

  if (rVal) rVal.innerText = target.range.toFixed(2);
  if (hVal) hVal.innerText = target.height.toFixed(2);
  if (tVal) tVal.innerText = target.time.toFixed(2);
  const eff = (target.vFinal / currentV0) * 100;
  if (eVal) eVal.innerText = Math.round(eff).toString();
}

p.draw = () => {
  p.background(255);
  let offsetX = 0, drawW = 0, drawH = 0;
  
  if (sim.imageLoaded && sim.bgImage) {
    const ratio = sim.bgImage.width / sim.bgImage.height;
    drawH = p.height;
    drawW = drawH * ratio;
    offsetX = (p.width - drawW) / 2;
    p.image(sim.bgImage, offsetX, 0, drawW, drawH);
  }

  const now = p.millis();
  if (sim.isLaunching) sim.addParticles(p);

  // Splash loop with variety: mist vs droplets
  for (let i = sim.splashes.length - 1; i >= 0; i--) {
    const s = sim.splashes[i];
    const age = now - s.startTime;
    const maxAge = s.isMist ? 600 : 400; 
    if (age > maxAge) { sim.splashes.splice(i, 1); continue; }
    
    s.x += s.vx; 
    s.y += s.vy; 
    s.vy += s.isMist ? 0.005 : 0.025; // Droplets fall faster, mist floats
    s.alpha = p.map(age, 0, maxAge, s.isMist ? 100 : 180, 0);
    
    p.noStroke();
    // Subtle color variation: whites and pale blues
    const colorVal = 225 + (s.colorOffset || 0);
    p.fill(colorVal, colorVal + 20, 255, s.alpha);
    
    if (s.isMist) {
      const currentSize = s.size + age/15;
      p.ellipse(s.x, s.y, currentSize, currentSize * 0.7);
    } else {
      p.ellipse(s.x, s.y, s.size, s.size);
    }
  }

  for (let i = sim.particles.length - 1; i >= 0; i--) {
    const particle = sim.particles[i];
    const state = sim.calculatePhysics(particle, now);

    if (state) {
      const sx = offsetX + (state.x * drawW);
      const sy = state.y * drawH;
      particle.history.push({x: sx, y: sy});
      if (particle.history.length > TRAIL_LENGTH) particle.history.shift();

      if (particle.history.length > 1) {
        p.noFill();
        p.beginShape();
        for (let j = 0; j < particle.history.length; j++) {
          const pt = particle.history[j];
          const alpha = p.map(j, 0, particle.history.length, 0, 150);
          p.stroke(225, 245, 255, alpha);
          p.strokeWeight(p.map(j, 0, particle.history.length, 0.4, 2.0));
          p.vertex(pt.x, pt.y);
        }
        p.endShape();
      }

      p.noStroke();
      p.fill(240, 252, 255, 200);
      p.ellipse(sx, sy, particle.size, particle.size);

      if (state.impact) {
        particle.history = []; 
        const splashCount = p.random(4, 7);
        for(let j=0; j < splashCount; j++) {
          const isMist = p.random() > 0.4;
          sim.splashes.push({ 
            x: sx, 
            y: sy - 0.5, 
            vx: p.random(-0.4, 0.4), 
            vy: isMist ? p.random(-0.1, -0.4) : p.random(-0.5, -1.5), 
            startTime: now, 
            size: isMist ? p.random(2, 4) : p.random(0.5, 1.8), 
            alpha: isMist ? 60 : 130,
            isMist,
            colorOffset: p.random(-20, 20)
          });
        }
      }
      
    }
    if (particle.isDead || (now - particle.startTime > PARTICLE_LIFETIME)) {
      sim.particles.splice(i, 1);
    }
  }
};

p.windowResized = () => {
  const container = document.getElementById('canvas-container');
  if (container) p.resizeCanvas(container.clientWidth, container.clientHeight);
};
