import sevy from "./assets/sevy.png"

export default function ErrorOverlay () {

  return (
    <div className="error-overlay">
      <p>This application needs to run on desktop with a window of at least 720x600px.</p>
      <div className="sevy-container"><img className='sevy' src={sevy} /></div>
    </div>
  );
}
