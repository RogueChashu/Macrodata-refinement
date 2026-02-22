import { useRef } from 'react';
import BinContainer from './BinContainer';

function Bins ({ binRefs, openedBinIndexRef, triggerMoveToBin }) {

  const binSectionRef = useRef(null);

  if (!binRefs?.current) return null;

  return (
    <div
    ref={binSectionRef}
    className='wasteSection'
    >
      {binRefs.current.map((binRef, index) => {
        const binNumber = index + 1;
        const isOpen = openedBinIndexRef.current === index;

        return (
          <BinContainer
            key={index}
            binRef={binRef}
            binNumber={binNumber}
            isOpen={isOpen}
            triggerMoveToBin={triggerMoveToBin}
          />
        );
      })}

      {binRefs.current.map((_, index) => (
        <div key={`progress-${index}`} className={'binProgress0' + (index + 1)}>0%</div>
      ))}
    </div>
  );
}

export default Bins
