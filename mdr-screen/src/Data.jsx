import { useState, useEffect, useCallback, useRef } from 'react';
import { FixedSizeGrid as Macrodata } from 'react-window';
import { useSpring } from 'react-spring';

// TO DO: write a function to turn some data to 'bad: true'
// Lumon terminal has 21 columns x 10 rows of visible numbers in some screenshots. 
// So make sure to have minimum a few more rows and columns than 21. But you can zoom in and out...

function _generateData () {
  const rows = 30;
  const columns = 30;

  return Array.from({ length: rows }, (_, rowIndex) =>  
    Array.from({ length: columns }, (_, dataIndex) => ({
      value: Math.floor(Math.random() * 10),
      delay: Math.random() * 2.5,
      bad: false,
    }))
  );
}

function Data () {
  // react-spring manages the animated values, so no scrollPosition state
  const [spring, api] = useSpring(() => ({
    scrollTop: 0,
    scrollLeft: 0,
    // animation configuration:
    config: { tension: 210, friction: 20, mass: 1 },
    onChange: ({ value }) => {
      if (gridRef.current) {
        gridRef.current.scrollTo({
          scrollTop: value.scrollTop,
          scrollLeft: value.scrollLeft,
        });
      }
    },
  }));
  
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 });

  const unrefinedDataRef = useRef(_generateData());
  const visibleWindowRef = useRef(null);
  const gridRef = useRef(null);
  const animationFrameId = useRef(null);
  const startTimeRef = useRef(performance.now());

  useEffect(() => {
    //capture the initial focus when the component mounts, so the user can interact with the data: 
    visibleWindowRef.current?.focus()
  }, [])

  const handleKeyMove = useCallback((e) => {
    const stepSize = 50;
    const currentScrollTop = spring.scrollTop.get();
    const currentScrollLeft = spring.scrollLeft.get();
    let newScrollTop = currentScrollTop;
    let newScrollLeft = currentScrollLeft;
   
    if (!gridRef.current) return;

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
          unrefinedDataRef.current[0].length * 75 - gridSize.width
        );
        break;
      case 's':
      case 'ArrowDown':
        newScrollTop = Math.min(
          currentScrollTop + stepSize,
          unrefinedDataRef.current.length * 75 - gridSize.height
        );
        break;
      case 'w':
      case 'ArrowUp':
        newScrollTop = Math.max(0, currentScrollTop - stepSize);
        break;
      default:
        return;
    }
    api.start({
      scrollTop: newScrollTop,
      scrollLeft: newScrollLeft,
    })
  }, [api, spring, gridSize]);

  const handleMouseMove = useCallback((e) => {
    const stepSize = 50;
    const currentScrollTop = spring.scrollTop.get();
    const currentScrollLeft = spring.scrollLeft.get();
    let newScrollTop = currentScrollTop;
    let newScrollLeft = currentScrollLeft;
    
    if (!gridRef.current) return;

    // 30px detection zone chosen because smaller felt narrow
    //left
    if (e.clientX < currentScrollLeft + 30) {
      newScrollLeft = Math.max(0, currentScrollLeft - stepSize);
    //right
    } else if (e.clientX > gridSize.width - 30) {
      newScrollLeft = Math.min(
        currentScrollLeft + stepSize,
        unrefinedDataRef.current[0].length*75 - gridSize.width
      );
    }
    //up    
    if (e.clientY < currentScrollTop + 30) {
      newScrollTop = Math.max(0, currentScrollTop - stepSize);
    //down
    } else if (e.clientY > gridSize.height - 30) {
      newScrollTop = Math.min(
        newScrollTop + stepSize,
        unrefinedDataRef.current.length * 75 - gridSize.height
      );
    }
    api.start({
      scrollTop: newScrollTop,
      scrollLeft: newScrollLeft,
    })
  }, [api, spring, gridSize]);

  /*
  const handleMouseOver = useCallback((e) => {
    //const radius = 120;
    //const maxScale = 3;
    //const minScale = 1;
    const mouseElement = e.target.closest('.numbers');
    console.log(e.target);
    console.log(mouseElement);
    //const hoveredIndex = [];

    if (!mouseElement) return

    if (mouseElement.id) {
      const [rowIndex, columnIndex] = mouseElement.id.split('-');
      console.log('row:', rowIndex, 'col:', columnIndex);
    }

    //  for (let i = rowIndex - 1; i = rowIndex + 1; i++) {
    //    console.log('i',i)
        //for (let j = columnIndex - 1; j = columnIndex +1; j++ ) {
          //console.log('j',j)
          //hoveredIndex.push(i,'-',j)
        //}
        //console.log(hoveredIndex)
     // }
    //}
  },[]);
  */

/*
      //const rect = mouseElement.getBoundingClientRect()
      //console.log(rect)
    } */
    
    /*
    // calculate the center of the moused over div.
    const centerRect = centerElement.getBoundingClientRect();
    const centerX = centerRect.left + centerRect.width / 2;
    const centerY = centerRect.top + centerRect.height / 2;

    visibleDataRef.current.forEach((datum) => {
      //calculate the center of each div
      const rect = datum.getBoundingClientRect();
      const divX = rect.left + rect.width / 2;
      const divY = rect.top + rect.height / 2;

      //calculate the dist between this div and the moused div
      const distX = Math.abs(divX - centerX);
      const distY = Math.abs(divY - centerY);
      const dist = Math.sqrt(distX * distX + distY * distY);

      if (dist < radius) {
        let scale = 1;
        // SLOW function
        scale = (((minScale - maxScale) / radius) * dist) + maxScale;
          
        datum.classList.add('hovered');
        datum.style.setProperty('--scaleFactor', scale);
      } 
    }) 

  const handleMouseOut = useCallback((e) => {
    visibleDataRef.current.forEach((div) => {
      if (div.classList.contains('hovered')) {
        div.classList.remove('hovered')
        div.style.setProperty('--scaleFactor', '1');
      }
    });
  }, [visibleDataRef.current]); */1

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

    const targetFPS = 9;
    const frameTime = 1000 / targetFPS;

    let lastFrameTime = 0;
    
    const animate = (timestamp) => {
      const elapsedTime = timestamp - startTimeRef.current;
      const deltaTime = timestamp - lastFrameTime;
      const allNumberDivs = container.querySelectorAll('.numbers');

      // Continue the loop, but controlling the frame rate for GPU usage reasons
      if (deltaTime >= frameTime) {

        allNumberDivs.forEach(div => {
          const delay = parseFloat(div.dataset.delay || 0) * 1000;
          const animationDuration = 3500; //3.5s duration
          const amplitude = 3.5; //3.5px movement amplitude

          // This formula replaces the @keyframes, does the swing movement using a sine:
          const xPos = Math.sin((elapsedTime + delay) * (2 * Math.PI / animationDuration)) * amplitude;
          div.style.transform = `translateX(${xPos.toFixed(2)}px)`;
          lastFrameTime = timestamp - (deltaTime % frameTime);
        });
      }
      animationFrameId.current = requestAnimationFrame(animate);
    };
    //Start the animation
    animationFrameId.current = requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

      //onMouseOver={handleMouseOver}
      //donMouseOut={handleMouseOut}

  return (
    <div 
      id='visibleWindow'
      ref={visibleWindowRef}
      onKeyDown={handleKeyMove}
      onMouseMove={handleMouseMove}
      tabIndex={-1} 
    >
      <Macrodata
        ref={gridRef}
        className='macrodataContainer'
        columnCount={30}
        columnWidth={75}
        rowCount={unrefinedDataRef.current.length}
        rowHeight={75}
        width={gridSize.width}
        height={gridSize.height}
      >
        {Row}
      </Macrodata>
    </div>
  ) 
}

export default Data
