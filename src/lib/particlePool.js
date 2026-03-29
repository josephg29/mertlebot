export class ParticlePool {
  constructor(initialSize = 30) {
    this.available = [];
    this.active = [];
    this.initialSize = initialSize;

    for (let i = 0; i < initialSize; i++) {
      this.available.push(this.createParticle());
    }
  }

  createParticle() {
    return {
      id: Math.random(),
      type: 'hammer',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      rotation: 0,
      rotationSpeed: 0,
      scale: 1,
      alpha: 1,
      age: 0,
      maxAge: 180,
    };
  }

  acquire(type = 'hammer', x = 0, y = 0) {
    let particle;

    if (this.available.length > 0) {
      particle = this.available.pop();
    } else {
      particle = this.createParticle();
    }

    particle.type = type;
    particle.x = x;
    particle.y = y;
    particle.vx = (Math.random() - 0.5) * 1;
    particle.vy = 0;
    particle.rotation = Math.random() * Math.PI * 2;
    particle.rotationSpeed = (Math.random() - 0.5) * 0.15;
    particle.scale = 0.8 + Math.random() * 0.4;
    particle.alpha = 1;
    particle.age = 0;
    particle.maxAge = 150 + Math.random() * 80;

    this.active.push(particle);
    return particle;
  }

  release(particle) {
    const idx = this.active.indexOf(particle);
    if (idx !== -1) {
      this.active.splice(idx, 1);
      this.available.push(particle);
    }
  }

  update() {
    const viewportHeight = window.innerHeight;
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];

      p.vy += 0.15;
      p.y += p.vy;
      p.x += p.vx;
      p.rotation += p.rotationSpeed;
      p.age++;

      p.alpha = Math.max(0, 1 - (p.age / p.maxAge) * 1.5);

      if (p.y > viewportHeight || p.alpha <= 0) {
        this.release(p);
      }
    }
  }

  getActive() {
    return this.active;
  }

  clear() {
    this.available.push(...this.active);
    this.active = [];
  }
}
