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
    // Road asphalt is at ±(roadWidth / 2) = ±6.0m, shoulder extends to ±8.0m with guardrails at ±7.5m.
    // Give the player a generous buffer to ride onto the shoulder before crashing at the guardrail barrier (~6.8m).
    const guardrailDistance = roadWidth / 2 + 1.5;
    const halfPlayer = this.playerWidth / 2;
    const boundary = guardrailDistance - (halfPlayer * 0.7);
    
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
