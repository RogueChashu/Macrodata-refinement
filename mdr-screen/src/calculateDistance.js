const calculateDistance = (adjustedMousePos, pos) => {
  const distX = Math.abs(adjustedMousePos.x - pos.x);
  const distY = Math.abs(adjustedMousePos.y - pos.y);
  const dist = Math.sqrt(distX * distX + distY * distY);

  return dist
}

export default calculateDistance
