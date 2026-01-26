import  lumonLogo  from './assets/lumon1-test.svg'

function Header () {
  let filename = 'Dranesville'

  return (
    <div className='header'>
      <div className='filename'>{filename}</div>
      <div className='refinementProgress'>19% complete</div>
      <img className='lumonLogo' src={lumonLogo} />
    </div>
  )
}

export default Header