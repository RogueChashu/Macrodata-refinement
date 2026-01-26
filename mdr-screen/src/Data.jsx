// TO DO: write a function to turn some data to bad


function _generateData () {
  // Lumon terminal has 21 columns x 10 rows of visible numbers
  // Aiming for a 64 columns x 32 rows numbers matrix -> 2048 numbers.

  const rows = 5 //64
  const columns = 5 //32

  const data = Array.from({length: (rows * columns)}, () => ({
    value: Math.floor(Math.random()*10),
    bad: false
  }))

  return data
}

function Data () {
  const unrefinedData = _generateData()

  return (
    <div className='dataContainer'>
      {unrefinedData.map((data, index) => {
        return(
          <div className='numbers' key={index}>{data.value}</div>
        )
      })}
    </div>
  )
}

export default Data
