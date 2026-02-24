# A Severance's Macrodata refinement terminal simulation

*"Each category of numbers presents in such an order as to elicit an emotional response in the refiner"* --Mark Scout, Severance

[View Live Demo](https://roguechashu.github.io/Macrodata-refinement/)

![Preview of refinement process](https://github.com/RogueChashu/Macrodata-refinement/blob/main/mdr-screen/src/assets/Demo2026-02-23.gif?raw=true)

Ever wished to become a macrodata refiner and look for scary numbers? I have. That's why I built a macrodata terminal simulation.

## Tech stack: 
- Core: React, Vite
- Styling: Vanilla CSS
- Animation: react-spring
- Performance: react-window

## Features:
  + Large grid of numbers with only a section virtualized for improved efficiency
  + To scroll the grid:
    - press arrow keys (← ↑ → ↓) or a,s,w,d
    - place cursor on desired edge of the numbers grid
    - use mouse wheel (press 'Shift' for horizontal scrolling) or trackpad
  + Mouse wheel scrolling, keyboard scrolling and cursor edge scrolling have their own speed, feel and efficiency
  + *Scary numbers* are generated in a cluster formation (using a decay function)
  + Numbers behaviors:
    - gently sway while idle
    - scale up proportionally to cursor proximity
    - *scary numbers* behave slightly differently (to elicit an emotional response in the refiner!)
  + Proximity scaling is fast when approaching and slow when mousing away, leaving a fading trail
  + Numbers stay scaled up when clicked on (aka selected numbers for *refinement*)
  + Selected numbers can be sent to a bin by pressing chosen bin number (aka *refining data*)
  + Data being refined migrate to the chosen bin while an animation shows the bin opening and closing to accept the *bad data*
  + When refining bad data, the refinement progress updates (refining good data doesn't go into the refinement progress)
  + Upon refining numbers, new numbers slowly appear and adopt the behaviors described above.
  + Display can be resized and remain functional
  + If CRT display falls under 720 px width or 600 px height, Sevy appears to warn the user to increase display size.
  + Display width is capped at 1500px for keeping app efficiency (too many numbers moving otherwise).

### Notes

The app is intended for desktop use only (for now).

## Installation

### Prerequisites
- Node.js
- Git

### Steps
1. `git clone https://github.com/RogueChashu/Macrodata-refinement.git`
2. `cd Macrodata-refinement`
3. `npm install` 
4. `npm run dev`
5. Open http://localhost:5173/

### Possible future additions

+ Figure out and implement a way to integrate the 4 tempers (WO, FC, DR, MA) and their respective progress bars into the open bins. (What do the numbers looks like?)
+ Figure out and implement a logic for the progress bars under the bins
+ Build a Lumon OS interface showing the booting of the terminal and the selection of the files to refine?
+ Create various files in advance with the known names (Siena, Dranesville, Tumwater, Cold Harbor, etc.)
+ and more!
