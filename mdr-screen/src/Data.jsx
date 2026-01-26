import { useState, useEffect, useCallback, useRef } from 'react'

// TO DO: write a function to turn some data to 'bad: true'
// Lumon terminal has 21 columns x 10 rows of visible numbers in some screenshots. But you can zoom in and out...

function _generateData () {
  // Aiming for a 64 columns x 32 rows numbers matrix -> 2048 numbers.

  const rows = 40 //64
  const columns = 40 //32

  const data = Array.from({length: (rows * columns)}, () => ({
    value: Math.floor(Math.random()*10),
    bad: false
  }))

  return data
}

function Data () {
  const [unrefinedData, setUnrefinedData] = useState([])
  const [arrayPosition, setArrayPosition] = useState({ x: 0, y: 0 })

  const dataContainerRef = useRef(null)
  const visibleWindowRef = useRef(null)

  useEffect(() => {
    setUnrefinedData(_generateData())
    visibleWindowRef.current.focus()
  },[])

  
  const handleKeyDown = useCallback((e) => {
    const movement = 20

    const dataRect = document.getElementById('dataContainer').getBoundingClientRect()
    const windowRect = document.getElementById('visibleWindow').getBoundingClientRect()

    switch (e.key) {
      case 'a':
      case 'ArrowLeft':
        if (dataRect.left + movement <= 0) {
          setArrayPosition(prevArrayPos => ({...prevArrayPos, x: prevArrayPos.x + movement }))
        }
        break
      case 'd':
      case 'ArrowRight':
        if (dataRect.right - movement >= windowRect.right){
          setArrayPosition(prevArrayPos => ({...prevArrayPos, x: prevArrayPos.x - movement }))
        }
        break
      case 'w':
      case 'ArrowUp':
        if (dataRect.top + movement <= windowRect.top) {
          setArrayPosition(prevArrayPos => ({...prevArrayPos, y: prevArrayPos.y + movement}))
        }
        break
      case 's':
      case 'ArrowDown':
        if (dataRect.bottom - movement >= windowRect.bottom) {
          setArrayPosition(prevArrayPos => ({...prevArrayPos, y: prevArrayPos.y - movement}))
        }
        break
      default:
        break
    }
  }, [setArrayPosition])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return (
    <div id='visibleWindow' ref={visibleWindowRef} tabIndex={0}>
      <div 
        id='dataContainer' 
        ref={dataContainerRef} 
        style= {{
          position: 'absolute',
          transform: `translate(${arrayPosition.x}px, ${arrayPosition.y}px)`
        }}
      >
        {unrefinedData.map((data, index) => {
          return(
            <div className='numbers' key={index}>{data.value}</div>
          )
        })}
      </div>
    </div>
  )
}

export default Data
