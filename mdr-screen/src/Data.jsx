// 21 columns x 10 rows of numbers visible in Lumon terminal

function _generateData () {
  // Aiming for a 64 x 32 numbers matrix means 2048 numbers.

  let data = []

  for (let i = 0; i < 100; i++) {
    data.push(Math.floor(Math.random()*10))
  }
  return data
}


function Data () {
  let unrefinedData = _generateData()
  console.log(unrefinedData)

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