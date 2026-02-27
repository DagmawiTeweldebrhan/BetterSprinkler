# BetterSprinkler

**Projectile-Based Optimization of Sprinkler Systems for Shaggar Institute of Technology (SIT)**

Web-based simulation applying physics (gravity + air resistance) to improve sprinkler irrigation efficiency. Developed for **Shaggar Institute of Technology (SIT)** — Ethiopia's new center of excellence in science, engineering, and innovation (est. 2025).

Simulates water droplet trajectories to optimize nozzle angle, velocity, and release height for better coverage, uniformity, and water savings in Ethiopian agriculture.

## Features

- Realistic trajectory simulation with drag force (numerical integration)
- Interactive controls: angle, velocity, height, drag coefficient
- Plots: paths, range, height, irrigated area
- Compares ideal vs. real conditions; shows benefits of elevated sprinklers (10–30% range gain)

## Why for SIT?

Addresses sustainable agriculture challenges aligned with SIT's mission in engineering, innovation, and solving Ethiopia's real-world issues (water scarcity, climate resilience). Educational prototype for SIT students/research in mechanical engineering or applied physics.

## Tech Stack

- TypeScript + Vite
- HTML/Canvas for visuals
- Numerical methods for motion equations

## Quick Start

```bash
git clone https://github.com/DagmawiTeweldebrhan/BetterSprinkler.git
cd BetterSprinkler
npm install
npm run dev
Open http://localhost:5173
