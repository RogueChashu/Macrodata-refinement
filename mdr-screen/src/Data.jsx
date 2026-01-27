import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { FixedSizeGrid as Macrodata } from 'react-window';
import { useSpring } from 'react-spring';
import determineItemState, { animationStates } from './determineItemState.js';

function _generateNumber () {
  return {
    value: Math.floor(Math.random() * 10),
    delay: Math.random() * 2.5,
    bad: false,
    currentScale: 1,
  }
}

function _generateData () {
  const rows = 40;
  const columns = 40;

  const data = Array.from({ length: rows }, (_, rowIndex) =>  
    Array.from({ length: columns }, (_, dataIndex) => (
      _generateNumber()
    ))
  );
  const readyData = _makeScaryNumbers(data, rows, columns);
  return readyData;
}

function _generateLotteryBag(rows, columns) {
  let lotteryBag = [];

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      lotteryBag.push([i,j]);
    }
  }
  return lotteryBag;
}

function _makeScaryNumbers (data, rows, columns) {
  const badRate = 0.005; // 0.5% bad data rate for cores. 40 x 40 = 8 clusters for 1600 numbers
  const badCoresAmount = Math.round(rows * columns * badRate); // Number of bad cores
  const badDataRadius = 6;
  const badClusterRadius = 2.4;

  // Generate a lottery bag: an array of indexes.
  let dataLotteryBag = _generateLotteryBag(rows, columns);

  // Pick the above determined amount of bad data cores from lottery bag,
  // ensuring they are properly apart so no cluster will touch or overlap
  for (let i = 0; i < badCoresAmount; i++) {
    if (dataLotteryBag.length === 0) {
      console.warn("No spots available for bad cores");
      break;
    }

    const randomAvailableIndex = Math.floor(Math.random() * dataLotteryBag.length);
    const [pickedBadRowIndex, pickedBadColIndex] = dataLotteryBag[randomAvailableIndex];

    // Create a void area around the picked core so we don't have touching cores/clusters
    for (let i = -badDataRadius; i <= badDataRadius; i++) {
      for (let j = -badDataRadius; j <= badDataRadius; j++) {
        let clusterSpaceRowIndex = pickedBadRowIndex + i;
        let clusterSpaceColIndex = pickedBadColIndex + j;

        if (clusterSpaceRowIndex >= 0 && clusterSpaceRowIndex < rows &&
          clusterSpaceColIndex >= 0 && clusterSpaceColIndex < columns) {

          const distX = Math.abs(clusterSpaceRowIndex - pickedBadRowIndex);
          const distY = Math.abs(clusterSpaceColIndex - pickedBadColIndex);
          const dist = Math.sqrt(distX * distX + distY * distY);

          // y = 1 - (x/3)⁴, aka a decay function
          // 1 == y value when x=0. So, max probability
          // 3 == x value when y=0. So, total decay aka distance to have 0 probability
          // 4 is for a flatter curve. 3 would make it decay faster.
          const probability = 1 - (dist / 3)**4;

          // Fill part of the void with bad data
          if (dist <= badClusterRadius) {
            //const badDataGeneration = probability * Math.random();
            const badDataGeneration = probability + Math.random()
            if (badDataGeneration > 1.5 || probability > 0.75) {  //> 0.33 || probability >= 0.75) {
              data[clusterSpaceRowIndex][clusterSpaceColIndex].bad = true;
            }  
          }
        }
      }  
    }  
    const minX = pickedBadColIndex - badDataRadius;
    const maxX = pickedBadColIndex + badDataRadius;
    const minY = pickedBadRowIndex - badDataRadius;
    const maxY = pickedBadRowIndex + badDataRadius; 

    dataLotteryBag = dataLotteryBag.filter(([i,j]) => {
      const isInsideKeepOutZone =  (i >= minY && i<= maxY && j >= minX && j<= maxX);
      return !isInsideKeepOutZone;
    });
  }
  return data
}

const KEYBOARD_SCROLL_CONFIG = {
  mass: 1,
  tension: 200, // slower, gentle feel
  friction: 26
};

const MOUSE_SCROLL_CONFIG = {
  mass: 1,
  tension: 800, //faster, more responsive feel. Higher the value, the snappier it is
  friction: 25 // the higher the value, the faster it brakes.
};

function Data ({ 
  refinementProgressRef, 
  openBin,
  openedBinIndexRef, 
  prepareFlyingItems,
}) {
  // react-spring manages the animated values, so no scrollPosition state
  const [spring, api] = useSpring(() => ({
    scrollTop: 0,
    scrollLeft: 0,
    config: KEYBOARD_SCROLL_CONFIG,
    onChange: ({ value }) => {
      if (gridRef.current) {
        gridRef.current.scrollTo({
          scrollTop: value.scrollTop,
          scrollLeft: value.scrollLeft,
        });
      }
    },
  }));

  //console.log('I AM RENDERING!!');
  
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 });

  const unrefinedDataRef = useRef(_generateData());
  const visibleWindowRef = useRef(null);
  const gridRef = useRef(null);
  const animationFrameId = useRef(null);
  const startTimeRef = useRef(performance.now());
  const mousePosRef = useRef({ x: -999, y: -999 });
  const edgeScrollIntervalRef = useRef(null);
  const activeEdgeRef = useRef(null); // to track which edge is active (up? down? etc.)
  const visibleItemsRef = useRef(new Map());

  useEffect(() => {
    //capture the initial focus when the component mounts, so the user can interact with the data: 
    visibleWindowRef.current?.focus()

    let totalBadData = 0;
    unrefinedDataRef.current.map((row) => {
      row.map((data) => {
        (data.bad) ? totalBadData++ : undefined;
      })
    })
    const refinementProgress = refinementProgressRef.current;
    refinementProgress.totalBadData = totalBadData;
  }, [])

  const replaceRefinedData = (rowIndex, columnIndex) => {
    const newData = _generateNumber();
    // "new" state allows for a smooth slow appearance in the animate function
    newData.state = 'new';
    newData.currentScale = 0;
    unrefinedDataRef.current[rowIndex][columnIndex] = newData;

    const id = `${rowIndex}-${columnIndex}`;
    const visibleItem = visibleItemsRef.current.get(id);

    if (visibleItem) {
      visibleItem.data = newData;
      visibleItem.div.textContent = '';
    }
  };

  const refineBadData = (targetBinIndex) => {
    const refinementProgress = refinementProgressRef.current;
    let refinedData = 0;

    unrefinedDataRef.current.map((row) => {
      row.map((item) => {
        if (item.flagged && !item.isRefining) {
          item.isRefining = true;
          openBin(targetBinIndex); // start opening the box asap
          item.bad && refinedData++;
        }
      });
    });
    refinementProgress.refined += refinedData;
  };

  const handleKeyMove = useCallback((e) => {
    const stepSize = 50;
    const currentScrollTop = spring.scrollTop.get();
    const currentScrollLeft = spring.scrollLeft.get();
    let newScrollTop = currentScrollTop;
    let newScrollLeft = currentScrollLeft;
   
    if (!gridRef.current || !unrefinedDataRef.current) return;

    e.preventDefault();

    switch (e.key){
      case 'a':
      case 'ArrowLeft':
        newScrollLeft = Math.max(0, currentScrollLeft - stepSize);
        break;
      case 'd':
      case 'ArrowRight':
        newScrollLeft = Math.min(
          currentScrollLeft + stepSize,
          unrefinedDataRef.current[0].length * 80 - gridSize.width
        );
        break;
      case 's':
      case 'ArrowDown':
        newScrollTop = Math.min(
          currentScrollTop + stepSize,
          unrefinedDataRef.current.length * 80 - gridSize.height
        );
        break;
      case 'w':
      case 'ArrowUp':
        newScrollTop = Math.max(0, currentScrollTop - stepSize);
        break;
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
        const targetBinIndex = parseInt(e.key) -1;
        refineBadData(targetBinIndex);
        break;
      default:
        return;
    }
    api.start({
      scrollTop: newScrollTop,
      scrollLeft: newScrollLeft,
    })
  }, [api, spring, gridSize, unrefinedDataRef]);

  const handleMouseMove = useCallback((e) => {
    if (!visibleWindowRef.current || !gridRef.current) return;

    const rect = visibleWindowRef.current.getBoundingClientRect();
    mousePosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    const scrollDetectionZone = 45;
    let currentEdge = null;
    
    // determine which edge the mouse is in, if any 
    if (e.clientX < rect.left + scrollDetectionZone) {
      currentEdge = 'left';
    } else if (e.clientX > rect.right - scrollDetectionZone) {
      currentEdge = 'right';
    } else if (e.clientY < rect.top + scrollDetectionZone) {
      currentEdge = 'up';
    } else if (e.clientY > rect.bottom - scrollDetectionZone) {
      currentEdge = 'down';
    }
    //If no change of active edge, return.
    if (currentEdge === activeEdgeRef.current) return;

    // if edge changes, update the active edge
    activeEdgeRef.current = currentEdge;

    if (edgeScrollIntervalRef.current) {
      clearInterval(edgeScrollIntervalRef.current);
      edgeScrollIntervalRef.current = null;
    }

    if (currentEdge) {
      const stepSize = 30;

      edgeScrollIntervalRef.current = setInterval(() => {
        const currentScrollTop = spring.scrollTop.get();
        const currentScrollLeft = spring.scrollLeft.get();
        let newScrollTop = currentScrollTop;
        let newScrollLeft = currentScrollLeft; 

        switch (currentEdge) {
          case 'left':
            newScrollLeft = Math.max(0, currentScrollLeft - stepSize);
            break;
          case 'right':
            newScrollLeft = Math.min(currentScrollLeft + stepSize,
            unrefinedDataRef.current[0].length * 80 - gridSize.width);
            break;
          case 'up':
            newScrollTop = Math.max(0, currentScrollTop - stepSize);
            break;
          case 'down':
            newScrollTop = Math.min(newScrollTop + stepSize,
            unrefinedDataRef.current.length * 80 - gridSize.height);  
            break;
          default:
            break;
        }

        api.start({
          scrollTop: newScrollTop,
          scrollLeft: newScrollLeft,
          config: MOUSE_SCROLL_CONFIG,
        });
      }, 16) // 16ms frequency, so ~60 frames per second
    }
  }, [api, spring, gridSize]);

  const handleScroll = useCallback((e) => {
    if (!visibleWindowRef.current || !gridRef.current) return;

    const currentScrollTop = spring.scrollTop.get();
    const currentScrollLeft = spring.scrollLeft.get();
    let newScrollTop = currentScrollTop;
    let newScrollLeft = currentScrollLeft;
    

    // Since laptop trackpads are more commonly 2D browsing, 
    // the hardware sends a native horizontal signal to the browser,
    // changing the deltaX. Typically, mice do 1D browsing and we
    // need to tell the browser how to change the deltaX.
    if (e.shiftKey === true) {
      // Pressing 'Shift' doesn't change the deltaX when wheel mousing, 
      // but pressed or not
      // using the wheel changes the deltaY. This is the way to know
      // the amount/ direction to apply to horizontal scrolling
      newScrollLeft = newScrollLeft + e.deltaY;
    } else {
      // Placing the regular scroll here so it doesn't also fire when we
      // horizontal scroll
      newScrollTop = newScrollTop + e.deltaY;
    }

    api.start({
      scrollTop: newScrollTop,
      scrollLeft: newScrollLeft,
    })

  }, [api, spring])

  const handleMouseLeave = useCallback(() => {
    mousePosRef.current = { x: -999, y:-999 };

    if (edgeScrollIntervalRef.current) {
      clearInterval(edgeScrollIntervalRef.current);
      edgeScrollIntervalRef.current = null;
      activeEdgeRef.current = null;
    }
  }, []);

  const handleGridClick = useCallback((e) => {
    if (!visibleWindowRef.current) return;

    const cellWidth = 80;
    const cellHeight = 80;
    const rawMousePos = mousePosRef.current;
    const currentScrollLeft = spring.scrollLeft.get();
    const currentScrollTop = spring.scrollTop.get();

    const adjustedMousePos = {
      x: rawMousePos.x + currentScrollLeft,
      y: rawMousePos.y + currentScrollTop,
    };

    const columnIndex = Math.floor(adjustedMousePos.x / cellWidth);
    const rowIndex = Math.floor(adjustedMousePos.y / cellHeight);

    if (unrefinedDataRef.current[rowIndex] && unrefinedDataRef.current[rowIndex][columnIndex]) {
      const targetData = unrefinedDataRef.current[rowIndex][columnIndex]

      if (!targetData.flagged) {
        // flagging the clicked number tells the animation:
        // set scaling to max scale and don't change it, and no swaying.
        targetData.flagged = true; 
      } else {
        delete targetData.flagged;
      }
    }        
  }, [spring])

  // To ensure the Macrodata grid follows the visibleWindow's dimensions when user resizes the window:
  useEffect(() => {
    // This function ensures user can resize window and grid's dimensions will adapt
    const updateGridSize = () => {
      if (visibleWindowRef.current) {
        const { width, height } = visibleWindowRef.current.getBoundingClientRect();
        setGridSize({ width, height });
        //console.log('RESIZER RENDER!!!')
      }
    }

    updateGridSize();
  
    const resizeObserver = new ResizeObserver(updateGridSize)
    if (visibleWindowRef.current) {
      resizeObserver.observe(visibleWindowRef.current);
    }

    return () => {
      if (visibleWindowRef.current) {
        resizeObserver.unobserve(visibleWindowRef.current);
      }
    }
  }, []);

  function Row({ columnIndex, rowIndex, style }) {
    const data = unrefinedDataRef.current[rowIndex][columnIndex];
    const divRef = useRef(null);

    useEffect(() => {
      const div = divRef.current;
      if (!div) return;

      div.style.transform= `scale(${data.currentScale})`

      const cellWidth = 80;
      const cellHeight = 80;
      const id =`${rowIndex}-${columnIndex}`;

      // Create the item object with cached data to avoid future DOM reads
      const animationItem = {
        id,
        div,
        data,
        rowIndex,
        columnIndex,
        // Cache position ONCE on mount to prevent layout thrashing
        pos: {
          x: div.offsetLeft + (cellWidth / 2),
          y: div.offsetTop + (cellHeight / 2),
        },
        // Cache dataset value ONCE on mount
        delay: parseFloat(div.dataset.delay || 0) * 1000
      };

      visibleItemsRef.current.set(id, animationItem);

      return () => {
        visibleItemsRef.current.delete(id);
      };
    }, [columnIndex,data,rowIndex]);

    return (
      <div
        ref={divRef}
        className='numbers'
        key={`${rowIndex}-${columnIndex}`}
        id={`${rowIndex}-${columnIndex}`}
        data-delay={data.delay}
        style={{
          ...style,
          //color: data.bad ? 'red' : undefined, ////////////////////////
        }}
      >
        {/* don't render the new number's value until the animation is ready for it, i.e. when the .new
          is removed in the animation logic. */}
        {data.new ? '' : data.value}</div>
    );
  }

  useEffect(() => {
    /*
    Possible states:
    - SWAYING: the default animation when the mouse isn't nearby
    - PROXIMITY_SCALING: scaling when the mouse enters the item's radius
    - SCARY_HOVER: special version of proximity scaling for "bad numbers" that adds a vertical shake
    - FLAGGED: when a number is selected by the user, holding its maximum scale
    - REFINING: when a "bad number" is being animated towards the bin
    - NEW_ITEM_SCALING: when a new number is first rendered and scales into view.
    */
    // Animation constants
    const targetFPS = 60;
    const frameTime = 1000 / targetFPS;
    const swayDuration = 5000; // 5s duration
    const swayAmplitude = 5; // 5px movement amplitude
    const swayAngularFreq = 2 * Math.PI / swayDuration;

    // Numbers scaling parameters
    const radius = 130;
    const maxScale = 2.5;
    const minScale = 1;
    const scaleInDuration = 850;
    const newNumberDelay = 1200;

    // Scary numbers animation parameters
    const scaryAnimationDuration = 300; // faster cycling than swaying numbers
    const scaryAngularFreq = 2 * Math.PI / scaryAnimationDuration;
    const scaryAmp = 1.4;

    let lastFrameTime = 0;

    const animate = (timestamp) => {
      if (!animationFrameId.current) return;
      animationFrameId.current = requestAnimationFrame(animate);

      const deltaTime = timestamp - lastFrameTime;
      if (deltaTime < frameTime) return;
      lastFrameTime = timestamp - (deltaTime % frameTime);

      // Values that change each frame
      const elapsedTime = timestamp - startTimeRef.current;
      const currentScrollLeft = spring.scrollLeft.get();
      const currentScrollTop = spring.scrollTop.get();

      const adjustedMousePos = {
        x: mousePosRef.current.x + currentScrollLeft,
        y: mousePosRef.current.y + currentScrollTop,
      };

      for (const numberInstance of visibleItemsRef.current.values()) {
        // Step 1: determine the state
        const { state, distance } = determineItemState(numberInstance, adjustedMousePos, radius);

        // Step 2: Get the animation parameters from correct state function
        let animationParams;

        switch (state) {
          case 'SWAYING':
            animationParams = animationStates.SWAYING(
              numberInstance,
              elapsedTime,
              swayAngularFreq,
              swayAmplitude,
              minScale
            );
            break;
          case 'PROXIMITY_SCALING':
            animationParams = animationStates.PROXIMITY_SCALING(
              numberInstance,
              distance,
              minScale,
              maxScale,
              radius
            );
            break;
          case 'SCARY_HOVER':
            animationParams = animationStates.SCARY_HOVER(
              numberInstance,
              elapsedTime,
              scaryAngularFreq,
              scaryAmp,
              distance,
              minScale,
              maxScale,
              radius
            );
            break;
          case 'FLAGGED':
            animationParams = animationStates.FLAGGED(
              numberInstance,
              maxScale
            );
            break;
          case 'REFINING':
            animationParams = animationStates.REFINING(
              prepareFlyingItems,
              numberInstance, 
              openedBinIndexRef,
              replaceRefinedData
           );
            break;
          case 'NEW_ITEM_SCALING':
           animationParams = animationStates.NEW_ITEM_SCALING(
            numberInstance,
            timestamp,
            newNumberDelay,
            scaleInDuration, 
            minScale
           )
            break;
          default:
            break;
        }

        // Apply the animation (if any)
        if (animationParams) {
          const { translateX, translateY, scale } = animationParams;
          numberInstance.div.style.transform = `translateX(${translateX.toFixed(2)}px)
            translateY(${translateY.toFixed(2)}px) scale(${scale.toFixed(2)})`;
        }
      }; 
    };
    animationFrameId.current = requestAnimationFrame(animate);
    
    // Cleanup function
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [openedBinIndexRef,prepareFlyingItems,spring]);

  return (
    <div 
      id='visibleWindow'
      ref={visibleWindowRef}
      onKeyDown={handleKeyMove}
      onMouseMove={handleMouseMove}
      onWheel={handleScroll} 
      onMouseLeave={handleMouseLeave}
      onClick={handleGridClick}  
      tabIndex={-1} // make it focusable, but removed from the natural tab order
    >
    {unrefinedDataRef && gridRef ? (
      <Macrodata
        ref={gridRef}
        className='macrodataContainer'
        columnCount={unrefinedDataRef.current[0].length}
        columnWidth={80}
        rowCount={unrefinedDataRef.current.length}
        rowHeight={80}
        width={gridSize.width}
        height={gridSize.height}
      >
        {Row}
      </Macrodata>
    ) : (<div>Loading...</div>
    )}
    </div>
  ) 
}

export default memo(Data)
