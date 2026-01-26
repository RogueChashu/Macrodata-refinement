import  lumonLogo  from './assets/lumon1-test.svg'

//TO DO: make the background opaque behind the Lumon globe logo

function Header () {
  const filename = 'Siena'

  return (
    <div className='header'>
      <div className='filename'>{filename}</div>
      <div className='refinementProgress'>0% complete</div>
      <img className='lumonLogo' src={lumonLogo} />
    </div>
  )
}

export default Header
