import { useState, useEffect, useCallback, useRef } from 'react'

// TO DO: write a function to turn some data to 'bad: true'
// Lumon terminal has 21 columns x 10 rows of visible numbers in some screenshots. 
// So make sure to have minimum a few more rows and columns than 21. But you can zoom in and out...

function _generateData () {
  const rows = 30;
  const columns = 30;

  const data = Array.from({length: (rows * columns)}, () => ({
    value: Math.floor(Math.random()*10),
    bad: false,
  }));

  return data
}

function Data () {
  const [unrefinedData, setUnrefinedData]  = useState([]);
  const [marginSize, setMarginSize] = useState({ top: 0, right: 0, bottom: 0, left: 0 });

  const visibleWindowRef = useRef(null);
  const dataContainerRef = useRef(null);
  const focusDummyRef = useRef(null);

  useEffect(() => {
    // Data is generated inside a useEffect so that each render doesn't generate a new data set
    setUnrefinedData(_generateData())
    // to ensure focus is inside visible window on loading (no need to click inside numbers window to start navigating): 
    focusDummyRef && focusDummyRef.current.focus()
  }, [])

  const handleKeyDown = useCallback((e) => {
    const stepSize = 20

    const dataRect = document.getElementById('dataContainer').getBoundingClientRect()
    const windowRect = document.getElementById('visibleWindow').getBoundingClientRect()
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
  }, [setMarginSize, marginSize])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  const handleMouseMove = useCallback((e) => {
    const stepSize = 20

    const dataRect = document.getElementById('dataContainer').getBoundingClientRect()
    const windowRect = document.getElementById('visibleWindow').getBoundingClientRect()
    const cursorX = e.clientX
    const cursorY = e.clientY
    const modify = {}

    // 40px detection zone chosen because smaller felt narrow
    if (cursorX < windowRect.left + 40) { 
      if (dataRect.left + stepSize <= 0) { // go to the left
        modify.left = marginSize.left + stepSize;
      } else {
        modify.left = 0;
      }
    } else if (cursorX > windowRect.right - 40) {
      if (dataRect.right - stepSize >= windowRect.right) { // go the the right
        modify.left = marginSize.left - stepSize;
      } else {
        modify.left = marginSize.left - (dataRect.right - windowRect.right);
      }
    }

    if (cursorY < windowRect.top + 40) {
      if (dataRect.top + stepSize <= windowRect.top) { // go up
        modify.top = marginSize.top + stepSize;
      } else {
        modify.top = 0;
      }
    } else if (cursorY > windowRect.bottom - 40) {
      if (dataRect.bottom - stepSize >= windowRect.bottom) { // go down
        modify.top= marginSize.top - stepSize;
      } else {
        modify.top = marginSize.top - (dataRect.bottom - windowRect.bottom);
      }
    }
    setMarginSize(prevMargin => ({...prevMargin, ...modify }))
  }, [setMarginSize, marginSize])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [handleMouseMove])

  return (
    <div 
      id='visibleWindow' 
      ref={visibleWindowRef}
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
        {unrefinedData.map((data, index) => {
          return(
            <div className='numbers' key={index}>{data.value}</div>
          )
        })}
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
