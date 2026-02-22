import { useState, useRef, createRef, useCallback, useEffect } from 'react';
import './App.css';
import Header from './Header';
import Data from './Data';
import Bins from './Bins';
import Footer from './Footer';
import FlyingItem from './FlyingItem.jsx';
import ErrorOverlay from './ErrorOverlay.jsx';

const binCount = 5;

function App() {
  // putting the flying items in state is what allows the component to re-render loaded with the 
  // numbers to be flown to the bin handled by spring and secondarily, for the refinement progress to update.
  const [flyingItems, setFlyingItems] = useState([]);
  const [binsRect, setBinsRect] = useState([]);
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 });

  // refinementProgress is stored in a Ref so it doesn't cause the
  // Data component to re-render when it tells to update the progress if it were
  // in state. And, its content gets to be updated and rendered
  // when flyingItems trigger a render, so we also avoid unnecessary
  // renders. No need to cause a render outside of flying items anyway.
  const refinementProgressRef = useRef({ refined: 0, totalBadData: 0 });
  const openedBinIndexRef = useRef(null);
  const isMovingToBin = useRef(null);
  const binRefs = useRef(Array.from({ length: binCount }, () => createRef()));
  const appRef = useRef(null);
  const visibleWindowRef = useRef(null);


  // Central resize logic
  const updateLayout = useCallback(() => {
    const newRects = binRefs.current.map(ref => {
      if (!ref.current) return {};
      return ref.current.getBoundingClientRect();
    });
    setBinsRect(newRects);

    if (visibleWindowRef.current) {
      const { width, height } = visibleWindowRef.current.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setGridSize({ width, height });
      }
    }
  }, [])

  useEffect(() => {
    const observer = new ResizeObserver(updateLayout);
    if (appRef.current) observer.observe(appRef.current);

    updateLayout();

    return () => observer.disconnect();
  }, [updateLayout]);

  const openBin = useCallback((targetBinIndex) => {
    openedBinIndexRef.current = targetBinIndex;
  }, []);

  const prepareFlyingItems = useCallback((item, div) => {
    if (openedBinIndexRef.current === null) return;
      
    // Since we have a CTR display edge, we need to deduct the 
    // container's position to get the appropriate flying item position.
    const appContainer = appRef.current.getBoundingClientRect();
    const flyingObjectRect = div.getBoundingClientRect();
    const targetBinRect = binsRect[openedBinIndexRef.current];


    const newFlyingItem = {
      id: `${item.rowIndex}-${item.columnIndex}`,
      value: item.value,
      scale: item.currentScale,
      startRect: {
        left: flyingObjectRect.left - appContainer.left,
        top: flyingObjectRect.top - appContainer.top,
        width: flyingObjectRect.width,
        height: flyingObjectRect.height,
      },  
      endRect: {
        left: targetBinRect.left - appContainer.left,
        top: targetBinRect.top - appContainer.top,
        width: targetBinRect.width,
        height: targetBinRect.height,
      },
    };
    setFlyingItems(prev => [...prev, newFlyingItem]); 
  }, [binsRect]);

  // Called when the FlyingItem arrives at the bin
  const handleItemArrival = useCallback(() => {
    // Now that the item has arrived, we trigger the bin to close.
    // BinContainer component handles the rest of the animation sequence
    openedBinIndexRef.current = null;  
    setFlyingItems([])
  }, []);

  return (
    <>  
      <ErrorOverlay />
      <div ref={appRef} className='app-container'>
        <Header refinementProgressRef={refinementProgressRef} />
        <hr />
        <hr />
        <Data
          visibleWindowRef={visibleWindowRef}
          gridSize={gridSize}
          refinementProgressRef={refinementProgressRef} 
          openBin={openBin}
          openedBinIndexRef={openedBinIndexRef}
          prepareFlyingItems={prepareFlyingItems}
        />
        <hr />
        <hr />
        {binRefs.current.length > 0 ? 
          <Bins 
            binRefs={binRefs} 
            openedBinIndexRef={openedBinIndexRef}
            triggerMoveToBin={isMovingToBin}
          /> :
          <div>Loading...</div>
        }
        <div className='flying-item-container'>
          {flyingItems.map((item) => (
          <FlyingItem key={item.id} {...item} onComplete={handleItemArrival} />
          ))}
        </div>
        <hr />
        <Footer />


      </div>


    </>
  );
}

export default App
