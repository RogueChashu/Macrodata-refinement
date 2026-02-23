import  lumonLogo  from './assets/lumon-logo.png';

function Header ({ refinementProgressRef }) {
  const filename = 'Siena'
  const refinementProgress = refinementProgressRef.current;

  return (
    <div className='header'>
      <div className='filename'>{filename}</div>
      <div className='refinementProgress'>
        {Math.round(refinementProgress.refined / refinementProgress.totalBadData * 100) || 0}% complete
      </div>
      <img className='lumonLogo' src={lumonLogo} />
    </div>
  )
}

export default Header
