import { useState, useEffect, useRef } from 'react';

const STATUS = {
  IDLE: 'idle',
  OPENING_TOP: 'opening-top',
  OPENING_SIDES: 'opening-sides',
  OPEN: 'open',
  CLOSING_SIDES: 'closing-sides',
  CLOSING_TOP: 'closing-top',
};

function BinContainer({ binRef, binNumber, isOpen, triggerMoveToBin }) {
  const [animationStatus, setAnimationStatus] = useState(STATUS.IDLE);
  
  //  console.log('BIN BIN BIN')

  const lidTopRef = useRef(null);
  const lidLeftRef = useRef(null);

  useEffect(() => {
    // When the parent wants to open the bin
    if (isOpen && animationStatus === STATUS.IDLE) {
      setAnimationStatus(STATUS.OPENING_TOP);
    }

    if (!isOpen && animationStatus === `${STATUS.OPEN}`) {
      const timer = setTimeout(() => {
        setAnimationStatus(STATUS.CLOSING_SIDES)
      }, 500);
      return () => clearTimeout(timer)
    }
  }, [isOpen, animationStatus]);

  const handleAnimationEnd = (e) => {
    if (e.target !== lidTopRef.current && e.target !== lidLeftRef.current) {
      return;
    }

    switch(animationStatus) {
      case STATUS.OPENING_TOP:
        setAnimationStatus(STATUS.OPENING_SIDES);
        break;
      case STATUS.OPENING_SIDES:
        setAnimationStatus(STATUS.OPEN);
        triggerMoveToBin.current = true;
        break;
      case STATUS.CLOSING_SIDES:
        setAnimationStatus(STATUS.CLOSING_TOP);
        break;
      case STATUS.CLOSING_TOP:
        setAnimationStatus(STATUS.IDLE);
        break;
      default:
        break;
    }
  }

  return (
    <div className={`container0${binNumber}`}>
      <div ref={binRef} 
      className={`bin0${binNumber}`}
      >
        {`0${binNumber}`}
      </div>

      <div 
        ref={lidLeftRef} 
        className={`binLid-left ${animationStatus}`}
        onAnimationEnd={handleAnimationEnd} 
      />
      <div className={`binLid-right ${animationStatus}`} />
      <div 
        ref={lidTopRef} 
        className={`binLid-top ${animationStatus}`}
        onTransitionEnd={handleAnimationEnd} 
      />
    </div>
  );
}

export default BinContainer
