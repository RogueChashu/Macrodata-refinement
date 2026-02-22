import { useState, useRef, createRef, useCallback } from 'react';
import './App.css';
import Header from './Header';
import Data from './Data';
import Bins from './Bins';
import Footer from './Footer';
import FlyingItem from './FlyingItem.jsx';
import ErrorOverlay from './ErrorOverlay.jsx';

const binCount = 5;

function App() {
  const [flyingItems, setFlyingItems] = useState([]);
  const [binsRect, setBinsRect] = useState([]);
  
  // refinementProgress is stored in a Ref so it doesn't cause the
  // Data component to re-render when it tells to update the progress if it were
  // in state. And, its content gets to be updated and rendered
  // when flyingItems trigger a render, so we also avoid unnecessary
  // renders. No need to cause a render outside of flying items anyway.

  const refinementProgressRef = useRef({ refined: 0, totalBadData: 0 });
  const openedBinIndexRef = useRef(null);
  const isMovingToBin = useRef(null);
  const binRefs = useRef(Array.from({ length: binCount }, () => createRef()));

  const openBin = useCallback((targetBinIndex) => {
    openedBinIndexRef.current = targetBinIndex;
  }, []);

  const handleBinsResize = () => {
    const bins = binRefs.current;

    if (binRefs) {
      const newRects = bins.map((bin) => {
        return bin.current.getBoundingClientRect();
      });
      setBinsRect(newRects);
    }
  };

  const prepareFlyingItems = useCallback((item, div) => {
    if (openedBinIndexRef.current === null) return;
      
    if (binsRect.length > 0) {
      // Since we have a CTR display edge, we need to deduct the 
      // parent's position to get the appropriate flying item position.
      const parent = document.getElementById('root');
        
      const childRect = div.getBoundingClientRect();
      const parentRect = parent.getBoundingClientRect(); 

      const startRect = {
        left: childRect.left - parentRect.left - parent.clientLeft,
        top: childRect.top - parentRect.top - parent.clientTop,
        width: childRect.width,
        height: childRect.height,
      };

      const binRect = binsRect[openedBinIndexRef.current];

      const endRect = {
        left: binRect.left - parent.clientLeft - parent.clientLeft,
        top: binRect.top - parentRect.top - parent.clientTop,
        width: binRect.width,
        height: binRect.height,
      }


      if (!endRect) {
        console.error('No rect for', openedBinIndexRef.current);
        return
      }
        const newFlyingItem = {
        id: `${item.rowIndex}-${item.columnIndex}`,
        value: item.value,
        scale: item.currentScale,
        startRect,
        endRect,
      };
      setFlyingItems(prev => [...prev, newFlyingItem]); 
    } 
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
