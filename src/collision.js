export class Collision {
  constructor() {
    this.playerWidth = 2;
    this.playerLength = 4;
    this.carWidth = 2;
    this.carLength = 4;
    this.collisionBuffer = 0.3;
  }
  
  check(playerX, cars, roadWidth) {
    if (this.checkRoadBoundary(playerX, roadWidth)) {
      return { type: 'boundary' };
    }
    
    const carCollision = this.checkCarCollision(playerX, cars);
    if (carCollision) {
      return { type: 'car', car: carCollision };
    }
    
    return null;
  }
  
  checkRoadBoundary(playerX, roadWidth) {
    // Road asphalt is at ±(roadWidth / 2) = ±6.0m.
    // Guardrail center is at ±(roadWidth / 2 + 1.5) = ±7.5m (inner face at ~7.42m).
    // Player width is 2.0m (half-width 1.0m).
    // When |playerX| > 6.42m, the car's outer side physically hits the guardrail barrier.
    const guardrailInnerFace = roadWidth / 2 + 1.5 - 0.08;
    const halfPlayer = this.playerWidth / 2;
    const boundary = guardrailInnerFace - halfPlayer;
    
    return Math.abs(playerX) > boundary;
  }
  
  checkCarCollision(playerX, cars) {
    const playerMinX = playerX - this.playerWidth / 2;
    const playerMaxX = playerX + this.playerWidth / 2;
    const playerMinZ = -this.playerLength / 2;
    const playerMaxZ = this.playerLength / 2;
    
    for (const car of cars) {
      if (!car.userData.active) continue;
      
      const carX = car.position.x;
      const carZ = car.position.z;

      // Ignore cars that have already passed behind the player's view
      if (carZ > 0) continue;
      
      const carMinX = carX - this.carWidth / 2 - this.collisionBuffer;
      const carMaxX = carX + this.carWidth / 2 + this.collisionBuffer;
      const carMinZ = carZ - this.carLength / 2 - this.collisionBuffer;
      const carMaxZ = carZ + this.carLength / 2 + this.collisionBuffer;
      
      const overlapX = playerMinX < carMaxX && playerMaxX > carMinX;
      const overlapZ = playerMinZ < carMaxZ && playerMaxZ > carMinZ;
      
      if (overlapX && overlapZ) {
        return car;
      }
    }
    
    return null;
  }
}
