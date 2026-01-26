import { useState, useEffect, useCallback, useRef } from 'react'

// TO DO: write a function to turn some data to 'bad: true'
// Lumon terminal has 21 columns x 10 rows of visible numbers in some screenshots. 
// So make sure to have minimum a few more rows and columns than 21. But you can zoom in and out...

function _generateData () {
  const rows = 30;
  const columns = 30;

  /*
  const data = Array.from({length: (rows * columns)}, () => ({
    value: Math.floor(Math.random()*10),
    delay: Math.random() * 2.5,
    bad: false,
  }));*/

  const data = Array.from({ length: rows }, () =>  
    Array.from({ length: columns }, () => ({
      value: Math.floor(Math.random() * 10),
      delay: Math.random() * 2.5,
      bad: false,
    }))
  );
  return data
}

function Data () {
  const [unrefinedData, setUnrefinedData]  = useState([]);
  const [marginSize, setMarginSize] = useState({ top: 0, left: 0 });
  //const [visibleData, setVisibleData] = useState([]);

  const visibleWindowRef = useRef(null);
  const dataContainerRef = useRef(null);
  const focusDummyRef = useRef(null);
  const visibleDataRef = useRef([]);

  useEffect(() => {
    // Data is generated inside a useEffect w/ empty dep so that each render doesn't generate a new data set
    setUnrefinedData(_generateData())
    //capture the initial focus when the component mounts, allowing the user to navigate the visibleWindow 
    // without needing to click on it first: 
    focusDummyRef && focusDummyRef.current.focus()
  }, [])

  const handleKeyMove = useCallback((e) => {
    const stepSize = 20
    const dataRect = dataContainerRef.current.getBoundingClientRect()
    const windowRect = visibleWindowRef.current.getBoundingClientRect()
    const modify = {}

    switch (e.key){
      case 'a':
      case 'ArrowLeft':
        if (dataRect.left + stepSize <= 0) {
          modify.left = marginSize.left + stepSize
        }
        break
      case 'd':
      case 'ArrowRight':
        if (dataRect.right - stepSize >= windowRect.right) {
          modify.left = marginSize.left - stepSize
        }
        break
      case 's':
      case 'ArrowDown':
        if (dataRect.bottom - stepSize >= windowRect.bottom) {
          modify.top = marginSize.top - stepSize
        }
        break
      case 'w':
      case 'ArrowUp':
        if (dataRect.top + stepSize <= windowRect.top) {
          modify.top = marginSize.top + stepSize
        }
        break
      default:
        break
    }
    setMarginSize(prevMargin => ({...prevMargin, ...modify }))
  }, [marginSize.left, marginSize.top])

  const handleMouseMove = useCallback((e) => {
    const cursorX = e.clientX;
    const cursorY = e.clientY;

    const stepSize = 20
    const dataRect = dataContainerRef.current.getBoundingClientRect()
    const windowRect = visibleWindowRef.current.getBoundingClientRect()
    const modify = {}

    // 30px detection zone chosen because smaller felt narrow
    if (cursorX < windowRect.left + 30) { 
      if (dataRect.left + stepSize <= 0) { // go to the left
        modify.left = marginSize.left + stepSize;
      } else {
        modify.left = 0;
      }
    } else if (cursorX > windowRect.right - 30) {
      if (dataRect.right - stepSize >= windowRect.right) { // go the the right
        modify.left = marginSize.left - stepSize;
      } else {
        modify.left = marginSize.left - (dataRect.right - windowRect.right);
      }
    }

    if (cursorY < windowRect.top + 30) {
      if (dataRect.top + stepSize <= windowRect.top) { // go up
        modify.top = marginSize.top + stepSize;
      } else {
        modify.top = 0;
      }
    } else if (cursorY > windowRect.bottom - 30) {
      if (dataRect.bottom - stepSize >= windowRect.bottom) { // go down
        modify.top= marginSize.top - stepSize;
      } else {
        modify.top = marginSize.top - (dataRect.bottom - windowRect.bottom);
      }
    }
    setMarginSize(prevMargin => ({...prevMargin, ...modify }))
  }, [marginSize.left, marginSize.top])

  const handleMouseOver = useCallback((e) => {
    const radius = 120;
    const maxScale = 3;
    const minScale = 1;
    const centerElement = document.elementFromPoint(e.clientX, e.clientY);
    
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
   
  },[visibleDataRef]);

  const handleMouseOut = useCallback((e) => {
    visibleDataRef.current.forEach((div) => {
      if (div.classList.contains('hovered')) {
        div.classList.remove('hovered')
      }
    })
  }, [visibleDataRef]);

  const isVisibleData = () => {
    const dataContainer = dataContainerRef.current;
    const visibleWindow = visibleWindowRef.current;

    if (dataContainer && visibleWindow) {
      const visibleChildren = Array.from(dataContainer.children).map((child) => {
        const childRect = child.getBoundingClientRect();
        const windowRect = visibleWindow.getBoundingClientRect();
        // 50px tolerance zone added in the upcoming bounds check so we don't have non swinging data
        // on the edges of the visible window.
        return (
          childRect.top >= windowRect.top - 50 &&
          childRect.bottom <= windowRect.bottom + 50 &&
          childRect.left >= windowRect.left -50 &&
          childRect.right <= windowRect.right + 50
          ) ? child : null
        }).filter(child => child !== null)
      visibleDataRef.current = visibleChildren;
    }
  }

  useEffect(() => {
    isVisibleData()
  }, [unrefinedData, marginSize.left, marginSize.top])

  return (
    <div 
      id='visibleWindow' 
      ref={visibleWindowRef}
      onKeyDown={handleKeyMove}
      onMouseMove={handleMouseMove}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      tabIndex={-1} 
      style={{
        position: 'relative',
      }}
    >
      <div 
        id='dataContainer'
        ref={dataContainerRef} 
        style={{
          position: 'absolute',
          marginTop: `${marginSize.top}px`,
          marginLeft: `${marginSize.left}px`,
        }}
      >
        {unrefinedData.map((row, rowIndex) => (
          row.map((data, dataIndex) => {
            const isCurrentVisibleElem = visibleDataRef.current.some(
              (element) => element.id === `${rowIndex}-${dataIndex}`
            );
          
            return (
              <div 
                className={`numbers ${isCurrentVisibleElem?'swingData' : ''}`}            
                key={`${rowIndex}-${dataIndex}`}
                id={`${rowIndex}-${dataIndex}`}
                style={{
                  '--delay': data.delay
                }}
              >
                {data.value}
              </div>
            )
          }))
        )}
      </div>
    <div
      ref={focusDummyRef}
      tabIndex={0}
      style={{
        width: 0,
        height: 0,
        opacity: 0,
        position: 'absolute',
      }}
    />
  </div>
  )
}

export default Data
