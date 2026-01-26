import { useState, useEffect, useCallback, useRef } from 'react';
import { FixedSizeGrid as Macrodata } from 'react-window';

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
  const [scrollPosition, setScrollPosition] = useState({ scrollTop: 0, scrollLeft: 0 });
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 });

  const unrefinedDataRef = useRef(_generateData());
  const visibleWindowRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    //capture the initial focus when the component mounts, so the user can interact with the data: 
    visibleWindowRef.current?.focus()
  }, [])

  const handleKeyMove = useCallback((e) => {
    const stepSize = 50;
    const { scrollTop, scrollLeft } = scrollPosition;
    let newScrollLeft = scrollLeft;
    let newScrollTop = scrollTop;

    if (!gridRef.current) {
      return;
    }

    e.preventDefault();

    switch (e.key){
      case 'a':
      case 'ArrowLeft':
        newScrollLeft = Math.max(0, scrollLeft - stepSize);
        break
      case 'd':
      case 'ArrowRight':
        newScrollLeft = Math.min(
          scrollLeft + stepSize,
          unrefinedDataRef.current[0].length * 75 - gridSize.width
        );
        break
      case 's':
      case 'ArrowDown':
        newScrollTop = Math.min(
          scrollTop + stepSize,
          unrefinedDataRef.current.length * 75 - gridSize.height
        );
        break
      case 'w':
      case 'ArrowUp':
        newScrollTop = Math.max(0, scrollTop - stepSize);
        break
      default:
        break
    }
    gridRef.current.scrollTo({
      scrollTop: newScrollTop,
      scrollLeft: newScrollLeft,
    })
    setScrollPosition({ scrollTop: newScrollTop, scrollLeft: newScrollLeft });
  }, [scrollPosition, gridSize]);

/*
  const handleMouseMove = useCallback((e) => {
    const stepSize = 20
    const dataRect = dataContainerRef.current?.getBoundingClientRect();
    const windowRect = visibleWindowRef.current?.getBoundingClientRect()
    
    if (!dataRect || !windowRect) return;

    const modify = {}

    // 30px detection zone chosen because smaller felt narrow
    if (e.clientX < windowRect.left + 30) { 
      if (dataRect.left + stepSize <= 0) { // go to the left
        modify.left = marginSize.left + stepSize;
      } else {
        modify.left = 0;
      }
    } else if (e.clientX > windowRect.right - 30) {
      if (dataRect.right - stepSize >= windowRect.right) { // go the the right
        modify.left = marginSize.left - stepSize;
      } else {
        modify.left = marginSize.left - (dataRect.right - windowRect.right);
      }
    }

    if (e.clientY < windowRect.top + 30) {
      if (dataRect.top + stepSize <= windowRect.top) { // go up
        modify.top = marginSize.top + stepSize;
      } else {
        modify.top = 0;
      }
    } else if (e.clientY > windowRect.bottom - 30) {
      if (dataRect.bottom - stepSize >= windowRect.bottom) { // go down
        modify.top= marginSize.top - stepSize;
      } else {
        modify.top = marginSize.top - (dataRect.bottom - windowRect.bottom);
      }
    }
    setMarginSize(prevMargin => ({...prevMargin, ...modify }))
  }, [marginSize]) */

  /*
   useEffect(() => {
    if (dataContainerRef.current) {
      dataContainerRef.current.style.setProperty('--margin-left', `${marginSize.left}px`);
      dataContainerRef.current.style.setProperty('--margin-top', `${marginSize.top}px`);
    }
  }, [marginSize])*/
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
        style={{ 
          ...style, 
          '--delay': data.delay 
        }}
      >{data.value}</div>
    );
  }

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


  return (
    <div 
      id='visibleWindow'
      ref={visibleWindowRef} 
      onKeyDown={handleKeyMove}
      //onMouseMove={handleMouseMove}
      //onMouseOver={handleMouseOver}
      //donMouseOut={handleMouseOut}
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
