import React, { Component, useState, useEffect, useRef } from "react";
import "./App.scss";
// import styles from "./draw.module.scss";
import { List, Map, update } from "immutable";
import { HuePicker } from "react-color";

// preliminary code thanks to: https://codepen.io/philipp-spiess/pen/WpQpGr
class App extends Component {
  constructor() {
    super();
    this.state = {
      rects: [],
      //outline of new rectangle, only used while mouseDown
      ghostRect: [],
      undoList: new List(),
      selected: null,
      mouseOffset: {},
      undoStrokeColor: new List(),
      undoFillColor: new List(),
      widths: new List(),
      undoWidths: new List(),
      isDrawing: false,
      canDraw: true,
      //can the selected element be moved?
      canMove: true,
      targetBoard: null,
      windowHeight: window.innerHeight,
      windowWidth: window.innerWidth,
      strokeWidth: 5,
      strokeColors: new List(),
      fillColors: new List(),
      strokeColor: "#000000",
      fillColor: "#000000"
    };
  }

  handleTouchStart = (touchEvent) => {
    if (!this.state.canDraw) return;
    const point = this.relativeCoordinatesForEvent(touchEvent.touches[0]);
    this.setState(prevState => ({
      ghostRect: [point],
      isDrawing: true,
      // strokeColors: this.state.strokeColors.push(this.state.strokeColor),
      // fillColors: this.state.fillColors.push(this.state.fillColor),
      // widths: this.state.widths.push(this.state.strokeWidth)
    }));
  }

  // start drawing
  handleMouseDown = mouseEvent => {
    if (this.state.canDraw) {
      const point = this.relativeCoordinatesForEvent(mouseEvent);
      this.setState(prevState => ({
        // rects: prevState.rects.push(new List([point])),
        // rects: prevState.rects.push(newRect),
        ghostRect: [point],
        isDrawing: true,
        // strokeColors: this.state.strokeColors.push(this.state.strokeColor),
        // fillColors: this.state.fillColors.push(this.state.fillColor),
        // widths: this.state.widths.push(this.state.strokeWidth)
      }), () => console.log(this.state.ghostRect));
    }
  };

  handleTouchMove = touchEvent => {
    if (!this.state.isDrawing || !this.state.canDraw) {
      return;
    }
    const point = this.relativeCoordinatesForEvent(touchEvent.touches[0]);

    const newGhostRect = this.state.ghostRect;
    newGhostRect[1] = point;
    this.setState({
      ghostRect: newGhostRect
    });
  }

  // keep building up rect points
  handleMouseMove = mouseEvent => {
    const point = this.relativeCoordinatesForEvent(mouseEvent);

    if (this.state.selected && !this.state.canDraw && !this.state.isDrawing && this.state.canMove) {
      console.log("selected is: ", this.state.selected)
      // console.log(text)
      // this.state.selected.setAttribute("x", point.get('x')-this.state.offset.x)
      // this.state.selected.setAttribute("y", point.get('y')-this.state.offset.y)

      console.log(parseInt(this.state.selected.id))

      

      // accidental left-resize function
      let index = parseInt(this.state.selected.id)

      let updatedRects = this.state.rects;
      updatedRects[index].selected = true
      updatedRects[index].startX = point.get('x')-this.state.offset.x
      updatedRects[index].startY = point.get('y')-this.state.offset.y
      updatedRects[index].endX = point.get('x')-this.state.offset.x+parseInt(this.state.selected.getAttribute("width"))
      updatedRects[index].endY = point.get('y')-this.state.offset.y+parseInt(this.state.selected.getAttribute("height"))

      this.setState({
        rects: updatedRects
      })
    }
    
    // console.log(this.state.ghostRect.toJS())

    if (!this.state.isDrawing || !this.state.canDraw) {
      return;
    }

    const newGhostRect = this.state.ghostRect;
    newGhostRect[1] = point;
    this.setState({
      ghostRect: newGhostRect
    }, () => console.log(this.state.ghostRect));
  };

  // end drawing
  handleMouseUp = mouseEvent => {
    if (this.state.selected && !this.state.canDraw && !this.state.isDrawing) {
      let index = parseInt(this.state.selected.id)
      let updatedRects = this.state.rects;
      updatedRects[index].selected = false

      this.setState({
        selected: null,
        rects: updatedRects,
        offset: {}
      })
    }

    if (!this.state.isDrawing || !this.state.canDraw || !this.state.ghostRect[1]) {
      return
    }

    let anchorPoint = this.state.ghostRect[0];
    let finalPoint = this.state.ghostRect[1];

    //ensure no zero width or height boxes
    if (this.state.ghostRect.length < 2 || anchorPoint.get('x') === finalPoint.get('x') || anchorPoint.get('y') === finalPoint.get('y')) {
      alert("Cannot create zero width or zero height boxes!")
      return this.setState({
        ghostRect: [],
        isDrawing: false
      });
    }

    let newRect = {
      startX: anchorPoint.get('x'),
      startY: anchorPoint.get('y'),
      endX: finalPoint.get('x'),
      endY: finalPoint.get('y'),
      strokeColor: this.state.strokeColor,
      fillColor: this.state.fillColor,
      strokeWidth: this.state.strokeWidth
    }

    let updatedRects = this.state.rects;
    updatedRects.push(newRect)

    // if all conditions satisfied, commit the box to state and wipe the ghostRect outline
    this.setState(
      prevState => ({
        ghostRect: [],
        isDrawing: false,
        rects: updatedRects
      }), () => console.log(this.state.rects));
  };

  handleChange = e => {
    this.setState({ [e.target.name]: e.target.value });
  };

  // convert mouse into relative coordinates for the canvas
  relativeCoordinatesForEvent(mouseEvent) {
    const boundingRect = this.refs.drawArea.getBoundingClientRect();
    return new Map({
      x: mouseEvent.clientX - boundingRect.left,
      y: mouseEvent.clientY - boundingRect.top
    });
  }

  updateSelection = (e) => {
    let mouse = this.relativeCoordinatesForEvent(e);
    let offset = {x: mouse.get('x'), y: mouse.get('y')}
    offset.x -= parseFloat(e.target.getAttributeNS(null, "x"));
    offset.y -= parseFloat(e.target.getAttributeNS(null, "y"));
    this.setState({
      selected: e.target,
      canMove: true,
      offset: offset
    })
  }

  setActiveRect = (e) => {
    let index = parseInt(e.target.id)
    let updatedRects = this.state.rects;
    updatedRects[index].selected = true
    this.setState({
      selected: e.target,
      canMove: false,
      rects: updatedRects
    })
    // console.log(e.target)
    // e.target.setAttribute("fill", "rgb(255, 0, 0")
  }

  deselectElement = (e) => {
    if (!this.state.drawing && !this.state.canDraw && this.state.selected) {
      this.setState({
        selected: null
      })
    } 
  }

  undo = () => {
    if (this.state.rects.length === 0) {
      return;
    }

    console.log(this.state.rects[this.state.rects.length-1])
    this.setState(
      prevState => ({
        undoList: prevState.undoList.push(this.state.rects[this.state.rects.length-1]),
        rects: prevState.rects.slice(0,-1),
      }),  () => console.log(this.state.undoList.toJS())
    );
  };

  redo = () => {
    if (this.state.undoList.size === 0) {
      return;
    }
    let updatedRects = this.state.rects;
    updatedRects.push(this.state.undoList.last())
    console.log(updatedRects)
    this.setState(prevState => ({
      rects: updatedRects,
      undoList: prevState.undoList.delete(-1),
    }));
  };

  clear = () => {
    if (this.state.rects.size === 0) {
      return;
    }
    this.setState(
      prevState => ({
        undoList: this.state.rects,
        undoStrokeColor: new List(),
        undoFillColor: new List(),
        rects: []
      })
    );
  };

  // reset state values
  cleanUp = () => {
    this.setState(
      {
        lines: new List(),
        undoList: new List(),
        // colors: new List(),
        // undoColors: new List(),
        undoStrokeColor: new List(),
        undoFillColor: new List(),
        strokeColor: "#000000",
        fillColor: "#000000",
        widths: new List(),
        undoWidths: new List(),
        isDrawing: false,
        targetBoard: null,
        submitted: true,
        submitModalOpen: false,
        drawingSentToDb: true
      },
    );
  };

  handleColorPick = (color, type) => {
    this.setState({[`${type}Color`]: color.hex})
  };

  handleStrokeChange = event => {
    if (this.state.selected) {
      let index = parseInt(this.state.selected.id)
      let updatedRects = this.state.rects;
      updatedRects[index].strokeWidth = event.target.value
      this.setState({
        rects: updatedRects
      })
    }
    this.setState({ strokeWidth: event.target.value });
  };

  // need this to accurately report dimensions
  reportWindowSize = () => {
    this.setState(
      {
        windowHeight: window.innerHeight,
        windowWidth: window.innerWidth
      }
    );
  };

  componentDidMount = () => {
    let drawArea = document.getElementById("drawArea");
    if (drawArea) {
      drawArea.addEventListener("mouseup", this.handleMouseUp);
      drawArea.addEventListener("touchend", this.handleMouseUp);
      window.addEventListener("resize", this.reportWindowSize);
    }
  };

  componentWillUnmount() {
    let drawArea = document.getElementById("drawArea");
    if (drawArea) {
      drawArea.removeEventListener("mouseup", this.handleMouseUp);
      drawArea.removeEventListener("touchend", this.handleMouseUp);
      window.removeEventListener("resize", this.reportWindowSize);
    }
  }

  render() {
    return (
      <div>
          <div className="pageContainer">
            <h3 className="title">Draw some boxes!</h3>
            <div className="center">
                <div
                  className="drawArea"
                  id="drawArea"
                  ref="drawArea"
                  onMouseDown={this.handleMouseDown}
                  onTouchStart={this.handleTouchStart}
                  onMouseMove={this.handleMouseMove}
                  onTouchMove={this.handleTouchMove}
                  onClick={e => this.deselectElement(e)}
                >
                  <Drawing
                    rects={this.state.rects}
                    ghostRect={this.state.ghostRect}
                    fillColors={this.state.fillColors}
                    strokeColors={this.state.strokeColors}
                    widths={this.state.widths}
                    updateSelection={this.updateSelection}
                    setActiveRect={this.setActiveRect}
                    selected={this.state.selected}
                    isDrawing={this.state.isDrawing}
                  />
                </div>
                <div className="effectContainerBox">
                  <div>
                    <label>Fill Color</label>
                    <HuePicker
                      color={this.state.fillColor}
                      onChange={e => this.handleColorPick(e, "fill")}
                    />
                  </div>
                  <div>
                    <label>Stroke Color</label>
                    <HuePicker
                      color={this.state.strokeColor}
                      onChange={e => this.handleColorPick(e, "stroke")}
                    />
                  </div>
                  <div className="styles.slidecontainer">
                    <label>Stroke Thickness</label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      onChange={this.handleStrokeChange}
                      value={this.state.strokeWidth}
                      className="slider"
                      id="myRange"
                    />
                  </div>
                  <div className="buttonBox">
                    <button className="button" onClick={e => this.undo(e)}>
                      Undo
                    </button>
                    <button className="button" onClick={e => this.redo(e)}>
                      Redo
                    </button>
                    <button className="button" onClick={e => this.clear(e)}>
                      Clear
                    </button>
                    <button className="button" onClick={e => this.setState({canDraw: true})}>
                      Draw
                    </button>
                    <button className="button" onClick={e => this.setState({canDraw: false})}>
                      Grab
                    </button>
                  </div>
                </div>
            </div>
          </div>
      </div>
    );
  }
}

function Drawing({ rects, ghostRect, strokeColors, fillColors, widths, updateSelection, setActiveRect, selected }) {
  if (!strokeColors || !fillColors) {
    return <div></div>;
  }
  if (ghostRect.length > 0) {
    console.log(ghostRect[0].get('x'))
  }

  return (
    <svg className="drawing">
      {ghostRect !== [] &&
        <GhostRect
          rect={ghostRect}
        />
      }

      {rects.map((rect, index) => (
        <>
          <DrawingRect
            key={index}
            index={index}
            rect={rect}
            updateSelection={updateSelection}
            setActiveRect={setActiveRect}
          />
          {/* generate text if the box is fully formed (don't make text for an outline) */}
          {
            (rect !== {} ) && <text 
              x={((Math.min(rect.startX, rect.endX)+Math.max(rect.startX, rect.endX))/2)} 
              y={Math.min(rect.startY, rect.endY) + 15} 
              className="rectangleText" 
              id={`text${index}`}>
                {`Rectangle ${index}`}
            </text>
          }
        </>
      ))}
        


    </svg>
  );
}

function DrawingRect({ index, rect, updateSelection, setActiveRect }) {
  let firstX = Math.min(rect.startX, rect.endX)
  let firstY = Math.min(rect.startY, rect.endY)
  let lastX = Math.max(rect.startX, rect.endX)
  let lastY = Math.max(rect.startY, rect.endY)

  return (
    <rect
      className="rect"
      id={index}
      key={"rect"+index}
      x={firstX}
      y={firstY}
      width={lastX-firstX}
      height={lastY-firstY}
      fillOpacity={1}
      strokeDasharray={"0,0"}
      onMouseDown={e => updateSelection(e)}
      onClick={e => setActiveRect(e)}
      style={{ stroke: `${rect.strokeColor}`, fill: `${rect.selected ? "red" : rect.fillColor}`, strokeWidth: `${rect.strokeWidth}` }}
    />
  );
}

function GhostRect({ rect }) {

  if (rect[0] && rect[1]) {
    let firstX = Math.min(rect[0].get('x'), rect[1].get('x'))
    let firstY = Math.min(rect[0].get('y'), rect[1].get('y'))
    let lastX = Math.max(rect[0].get('x'), rect[1].get('x'))
    let lastY = Math.max(rect[0].get('y'), rect[1].get('y'))
  
    return (
      <rect
        className="ghostRect"
        id={"ghostRect"}
        key={"ghostRect"}
        x={firstX}
        y={firstY}
        width={lastX-firstX}
        height={lastY-firstY}
        draggable="true"
        fillOpacity={0}
        strokeDasharray={"5,5"}
        // onMouseDown={e => updateSelection(e)}
        // onClick={e => setActiveRect(e)}
        style={{ stroke: `green`, fill: `none`, strokeWidth: `4` }}
      />
    );
  }

  return <div></div>

}

export default App;
