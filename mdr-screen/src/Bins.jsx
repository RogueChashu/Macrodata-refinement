
function Bins ({ binRefs }) {

  if (!binRefs) return;
  
  return (
    <div className='binContainer'>

      {binRefs.current.map((bin, index) => (
        <div key={index} className={'bin' + '0' + (index + 1)}>{'0' + (index + 1)}</div>
      ))}

      {binRefs.current.map((bin, index) => (
        <div key={index} className={'binProgress' + '0' + (index + 1)}>0%</div>
      ))}

    </div>
  )
}

export default Bins