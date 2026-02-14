import calculateDistance from "./calculateDistance";
import handlingRefining from './handlingRefining';
import handleNewNumber from './handleNewNumber';
import newNumberScaling from './newNumberScaling';

function calculateProximityScale(dist, minScale, maxScale, radius) {
  const scale = minScale + (1 - (dist / radius)) * (maxScale - minScale);
  
  return scale;
}

const animationStates = {
  SWAYING: (numberInstance, elapsedTime, swayAngularFreq, swayAmplitude, minScale) => {
    const { div, data, delay } = numberInstance;
    const translateX = (Math.sin((elapsedTime + delay) * swayAngularFreq) * swayAmplitude);

    if (data.currentScale > minScale) {
      div.style.transition = `transform 0.35s ease-out`;
    }
    data.currentScale = minScale; // Reset scale for items that were previously scaled
    data.lastDist = undefined;
    return { translateX, translateY: 0, scale: minScale };
  }, 
  PROXIMITY_SCALING: (numberInstance, dist, minScale, maxScale, radius) => {
    const { data, div  } = numberInstance;
    const scale = calculateProximityScale(dist, minScale, maxScale, radius);

    if (data.lastDist === undefined || dist < data.lastDist) {
      div.style.transition = `transform 0.05s ease-in-out`;
    } else {  // moving away
      div.style.transition = `transform 0.45s ease-in-out`;
    }
    data.currentScale = scale; // update new scale in Data
    data.lastDist = dist;
    return { translateX: 0, translateY: 0, scale };
  },
  SCARY_HOVER: (numberInstance, elapsedTime, scaryAngularFreq, scaryAmp, dist, minScale, maxScale, radius) => {
    const { data } = numberInstance;
    const scale = calculateProximityScale(dist, minScale, maxScale, radius);
    const translateY = (Math.sin((elapsedTime) * scaryAngularFreq) * scaryAmp);
    numberInstance.div.style.transition = 'transform 0.02s ease-in-out';
    data.currentScale = scale; // update new scale in Data
    return { translateX: 0, translateY, scale };
  },
  FLAGGED: (numberInstance, maxScale) => {
    numberInstance.data.currentScale = maxScale; // update new scale in Data
    return { translateX: 0, translateY: 0, scale: maxScale };
  },
  
  REFINING: (prepareFlyingItems, numberInstance, openedBinIndexRef, replaceRefinedData) => {
    // Fire off the side-effects
    prepareFlyingItems({ 
      ...numberInstance.data, 
      rowIndex: numberInstance.rowIndex, 
      columnIndex: numberInstance.columnIndex 
    }, 
      numberInstance.div, 
      openedBinIndexRef 
      );
    replaceRefinedData(numberInstance.rowIndex, numberInstance.columnIndex);
    handlingRefining(numberInstance.data);
    // This state has no transform, as it's a fire-and-forget animation
    return null;
  },
  NEW_ITEM_SCALING: ( numberInstance, timestamp, newNumberDelay, scaleInDuration, minScale) => {
    const { div, data } = numberInstance
    if (!data.scaleInStartTime) {
      handleNewNumber(data, timestamp, div); // initialize the animation start time
    }
    const timePassed = timestamp - data.scaleInStartTime;
    const scale = newNumberScaling(timePassed, data, newNumberDelay, scaleInDuration, div, minScale);
    return { translateX: 0, translateY: 0, scale };
  }
}

export default function determineItemState (numberInstance, adjustedMousePos, radius) {
  const { data, pos } = numberInstance;

  if (data.isRefining) return {state: 'REFINING', distance: null};
  if (data.state === 'new' || data.isScalingIn) return { state: 'NEW_ITEM_SCALING', distance: null };
  if (data.flagged) {
    return {state: 'FLAGGED', distance: null};
  }
  const distance = calculateDistance(adjustedMousePos, pos);
  data.dist = distance;

  if (distance > radius) {
    return { state: 'SWAYING', distance: distance };
  } else {
    if (data.bad) {
      return { state: 'SCARY_HOVER', distance: distance };
    }
    return { state: 'PROXIMITY_SCALING', distance: distance };
  }
}

export { animationStates };
