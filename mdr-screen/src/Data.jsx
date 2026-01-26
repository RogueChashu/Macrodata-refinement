// 21 columns x 10 rows of numbers visible in Lumon terminal

function _generateData () {
  // Aiming for a 64 x 32 numbers matrix means 2048 numbers.

  const rowNumber = 10 //64
  const columnNumber = 10 //32

  const data = Array.from({length: (rowNumber * columnNumber)}, () => Math.floor(Math.random()*10))

  /*
  let data = []

  for (let i = 0; i < 350; i++) {
    data.push(Math.floor(Math.random()*10))
  } */
 console.log(data)
  return data
}

function Data () {
  const unrefinedData = _generateData()

  return (
    <div className='dataContainer'>
      {unrefinedData.map((data, index) => {
        return(
          <button className='numbers' key={index}>{data}</button>
        )
      })}
    </div>
  )
}

export default Data
