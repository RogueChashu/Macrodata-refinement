// New numbers scaling in don't move and go from scale(0) to scale(minScale)

const newNumberScaling = (
  timePassed, 
  data, 
  newNumberDelay, 
  scaleInDuration, 
  div, 
  minScale
) => {
  let scale = '';
  let scaleProgress = (timePassed - newNumberDelay) / scaleInDuration;

  // If we're still in the delay phase, stick to the data.currentScale value
  // of 0:
  if (timePassed < newNumberDelay) {
    scale = data.currentScale;
    return scale;
  }

  scaleProgress = Math.max(0, Math.min(scaleProgress, minScale));
  scale = scaleProgress;
  data.currentScale = scale;
  div.textContent = data.value;

  // End of scaling:
  if (scaleProgress >= 1.0) {
    delete data.isScalingIn;
    delete data.scaleInStartTime;
    data.currentScale = minScale;
    scale = minScale;
  }
  return scale
}
export default newNumberScaling
