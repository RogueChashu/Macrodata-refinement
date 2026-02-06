# A Severance's Macrodata refinement terminal simulation

*"Each category of numbers presents in such an order as to elicit an emotional response in the refiner"* --Mark Scout, Severance

[View Live Demo](https://roguechashu.github.io/Macrodata-refinement/)

![Preview of refinement process](https://github.com/RogueChashu/Macrodata-refinement/blob/initial-setup/mdr-screen/src/assets/2026-01-30%20Demo.gif?raw=true)

Ever wished to become a macrodata refiner and look for scary numbers? I have. That's why I built a macrodata terminal simulation.

## Tech stack: 
- Core: React, Vite
- Styling: Vanilla CSS
- Animation: react-spring
- Performance: react-window

## Features:
  + Large grid of numbers with only a section virtualized for improved efficiency
  + To scroll the grid:
    - press arrow keys or a,s,w,d
    - place cursor on desired edge of the numbers grid
    - use mouse wheel or trackpad
  + Mouse scrolling, keyboard scrolling and cursor edge scrolling have their own speed, feel and efficiency
  + *Scary numbers* are generated in a cluster formation (using a decay function)
  + Numbers behaviors:
    - gently sway while idle
    - scale up upon cursor proximity
    - *scary numbers* behave slightly differently (to elicit an emotional response in the refiner!)
  + Proximity scaling is fast when approaching and slow when mousing away, leaving a fading trail
  + Numbers stay scaled up when clicked on (aka selected numbers for *refinement*)
  + Selected numbers can be sent to a bin by pressing chosen bin number (aka *refining data*)
  + Data being refined migrate to the chosen bin while an animation shows the bin opening and closing to accept the *bad data*
  + When refining bad data, the refinement progress updates (refining good data doesn't go into the refinement progress)
  + Upon refining numbers, new numbers slowly appear and adopt the behaviors described above.

## Installation

### Prerequisites
- Node.js
- Git

### Steps
1. git clone https://github.com/RogueChashu/Macrodata-refinement.git`
2. `cd Macrodata-refinement`
3. `npm install` 
4. `npm run dev`
5. Open http://localhost:5173/

### Credits

Forma DJR Display font: [David Jonathan Ross]("http://www.onlinewebfonts.com")
