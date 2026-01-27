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

  function Row({ columnIndex, rowIndex, style }) {
    const data = unrefinedDataRef.current[rowIndex][columnIndex];
    return (
      <div
        className='numbers'
        key={`${rowIndex}-${columnIndex}`}
        id={`${rowIndex}-${columnIndex}`}
        data-delay={data.delay}
        style={{
          ...style,
        }}
      >{data.value}</div>
    );
  }

  // To ensure the Macrodata grid follows the visibleWindow's dimensions when user resizes the window:
  useEffect(() => {
    // This function ensures user can resize window and grid's dimensions will adapt
    const updateGridSize = () => {
      if (visibleWindowRef.current) {
        const { width, height } = visibleWindowRef.current.getBoundingClientRect();
        setGridSize({ width, height });
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

  useEffect(() => {
    const container = visibleWindowRef.current;
    if (!container) return;

    const targetFPS = 60;
    const frameTime = 1000 / targetFPS;
    let lastFrameTime = 0;
    
    const animate = (timestamp) => {
      animationFrameId.current = requestAnimationFrame(animate);

      const deltaTime = timestamp - lastFrameTime;

      if (deltaTime < frameTime) return;

      lastFrameTime = timestamp - (deltaTime % frameTime);

      const elapsedTime = timestamp - startTimeRef.current;
      const allNumberDivs = container.querySelectorAll('.numbers');

      // Numbers swaying animation parameters
      const animationDuration = 4000; //4.5s duration
      const amplitude = 4; //4px movement amplitude
      const angularFreq = 2 * Math.PI / animationDuration;

      // Numbers scaling parameters
      const radius = 130;
      const maxScale = 3;
      const minScale = 1;
      const cellWidth = 85;
      const cellHeight = 85;
      const rawMousePos = mousePosRef.current;

      const currentScrollLeft = spring.scrollLeft.get();
      const currentScrollTop = spring.scrollTop.get();

      const adjustedMousePos = {
        x: rawMousePos.x + currentScrollLeft,
        y: rawMousePos.y + currentScrollTop,
      };
      
      allNumberDivs.forEach(div => {
        const delay = parseFloat(div.dataset.delay || 0) * 1000;
        const divPos = {
          x: div.offsetLeft + (cellWidth / 2),
          y: div.offsetTop + (cellHeight / 2),
        };
        const distX = Math.abs(adjustedMousePos.x - divPos.x);
        const distY = Math.abs(adjustedMousePos.y - divPos.y);
        const dist = Math.sqrt(distX * distX + distY * distY);

        //let currentScale = minScale;
        //let newScale = minScale;
        const [rowIndex, columnIndex] = div.id.split('-').map(Number);
        const targetData = unrefinedDataRef.current[rowIndex][columnIndex]

        // If not in range of mouse, animate. Otherwise, scale numbers!
        if (dist > radius) {
          // This formula replaces the @keyframes, does the swing movement using a sine:
          const xPos = (Math.sin((elapsedTime + delay) * angularFreq) * amplitude).toFixed(2);
          div.style.transform = `translateX(${xPos}px)`;
        } else {
          let newScale = ((((minScale - maxScale) / radius) * dist) + maxScale).toFixed(2);

          if (targetData.currentScale < newScale) { // IF WE ARE APPROACHING THE NUMBER
            //div.style.color = 'red';
            div.style.transition = `transform 0.1s ease-in-out`;
          } else {
            div.style.transition = `transform 0.4s ease-in-out`;
          }
          div.style.transform = `scale(${newScale})`;
          targetData.currentScale = newScale; // store new scale in Data
        } 
      });
    };
    animationFrameId.current = requestAnimationFrame(animate);
    
    // Cleanup function
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [spring]);

  /*
        allNumberDivs.forEach(div => {
        const delay = parseFloat(div.dataset.delay || 0) * 1000;
        // This formula replaces the @keyframes, does the swing movement using a sine:
        const xPos = (Math.sin((elapsedTime + delay) * angularFreq) * amplitude).toFixed(2);
        
        const divPos = {
          x: div.offsetLeft + (cellWidth / 2),
          y: div.offsetTop + (cellHeight / 2),
        };
        
        const distX = Math.abs(adjustedMousePos.x - divPos.x);
        const distY = Math.abs(adjustedMousePos.y - divPos.y);
        const dist = Math.sqrt(distX * distX + distY * distY);

        let currentScale = minScale;

        if (dist < radius) {
          //console.log(div.id);
          const [rowIndex, columnIndex] = div.id.split('-').map(Number);
          const targetData = unrefinedDataRef.current[rowIndex][columnIndex]
          if (targetData.targetScale > currentScale) {
            console.log(targetData.targetScale)
            amplitude = 0;
          }
          //console.log(rowIndex, columnIndex )
          console.log()
          currentScale = ((((minScale - maxScale) / radius) * dist) + maxScale).toFixed(2);
          //STOP ANIMATION FOR IN CLOUD ELEMENTS
        } 
          */

  return (
    <div 
      id='visibleWindow'
      ref={visibleWindowRef}
      onKeyDown={handleKeyMove}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      tabIndex={-1} 
    >
      <Macrodata
        ref={gridRef}
        className='macrodataContainer'
        columnCount={30}
        columnWidth={85}
        rowCount={unrefinedDataRef.current.length}
        rowHeight={85}
        width={gridSize.width}
        height={gridSize.height}
      >
        {Row}
      </Macrodata>
    </div>
  ) 
}

export default Data
