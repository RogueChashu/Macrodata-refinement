import  lumonLogo  from './assets/lumon1-test.svg';
import { useEffect } from 'react';

//TO DO: make the background opaque behind the Lumon globe logo

function Header ({ refinementProgress }) {
  const filename = 'Siena'

  //console.log('in header:', refinementProgress.totalBadData)
 // useEffect(() )

  return (
    <div className='header'>
      <div className='filename'>{filename}</div>
      <div className='refinementProgress'>
        {refinementProgress.refined === 0 ? 
          `0`: 
          Math.round(refinementProgress.refined / refinementProgress.totalBadData * 100)}% complete
      </div>
      <img className='lumonLogo' src={lumonLogo} />
    </div>
  )
}

export default Header
