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
      resizing: [],
      targetBoard: null,
      windowHeight: window.innerHeight,
      windowWidth: window.innerWidth,
      rounded: 0,
      strokeWidth: 5,
      strokeColors: new List(),
      fillColors: new List(),
      strokeColor: "#000000",
      fillColor: "#FFFFFF"
    };
  }

  handleTouchStart = (touchEvent) => {
    if (!this.state.canDraw) return;
    const point = this.relativeCoordinatesForEvent(touchEvent.touches[0]);
    this.setState(prevState => ({
      ghostRect: [point],
      isDrawing: true
    }));
  }

  // start drawing
  handleMouseDown = mouseEvent => {
    if (this.state.canDraw) {
      const point = this.relativeCoordinatesForEvent(mouseEvent);
      this.setState({
        ghostRect: [point],
        isDrawing: true,
      });
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

    if (this.state.selected && this.state.resizing !== []) {
      let index = parseInt(this.state.selected.id)
      let updatedRects = this.state.rects;
      updatedRects[index].selected = true
      if (this.state.resizing[0]) {updatedRects[index].startX = point.get('x')}
      if (this.state.resizing[1]) {updatedRects[index].startY = point.get('y')} 
      if (this.state.resizing[2]) {updatedRects[index].endX = point.get('x')}    
      if (this.state.resizing[3]) {updatedRects[index].endY = point.get('y')}
  
      this.setState({
        rects: updatedRects
      })
    }

    if (!this.state.isDrawing || !this.state.canDraw) {
      return;
    }

    const newGhostRect = this.state.ghostRect;
    newGhostRect[1] = point;
    this.setState({
      ghostRect: newGhostRect
    });
  };

  // end drawing
  handleMouseUp = () => {
    // if a rectangle is selected, we are not in draw mode, and we are not resizing the rectangle
    if (this.state.selected && !this.state.canDraw && !this.state.isDrawing && this.state.resizing === []) {
      let index = parseInt(this.state.selected.id)
      let updatedRects = this.state.rects;
      updatedRects[index].selected = false

      this.setState({
        selected: null,
        rects: updatedRects,
        offset: {}
      })
    }

    // if we are resizing the rectangle, only wipe the resize rules, don't deselect the rectangle
    else if (this.state.resizing !== []) {
      this.setState({
        resizing: []
      })
    }

    // if we didn't draw anything, then the ghost rectangle needs to be wiped
    if (!this.state.isDrawing || !this.state.canDraw || !this.state.ghostRect[1]) {
      return this.setState({
        ghostRect: []
      })
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

    // new rectangle to be committed to state memory
    let newRect = {
      startX: anchorPoint.get('x'),
      startY: anchorPoint.get('y'),
      endX: finalPoint.get('x'),
      endY: finalPoint.get('y'),
      strokeColor: this.state.strokeColor,
      fillColor: this.state.fillColor,
      strokeWidth: this.state.strokeWidth,
      rounded: this.state.rounded
    }

    let updatedRects = this.state.rects;
    updatedRects.push(newRect)

    // if all conditions satisfied, commit the box to state and wipe the ghostRect outline
    this.setState(
      prevState => ({
        ghostRect: [],
        isDrawing: false,
        rects: updatedRects,
        resizing: [],
      }));
  };

  // generic handle change utility function
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

  //
  moveSelection = (e) => {
    if (this.state.canDraw || this.state.isDrawing) {
      return
    }

    let updatedRects = this.state.rects;
    for (let i in updatedRects) {
      if (updatedRects[i].selected) {
        updatedRects[i].selected = false
      }
    }

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
    if (this.state.canDraw || this.state.isDrawing) {
      return
    }

    let updatedRects = this.state.rects;
    for (let i in updatedRects) {
      if (updatedRects[i].selected) {
        updatedRects[i].selected = false
      }
    }

    let index = parseInt(e.target.id)
    updatedRects[index].selected = true
    this.setState({
      selected: e.target,
      canMove: false,
      rects: updatedRects
    })
  }

  deselectElement = (e) => {
    if (!this.state.drawing && !this.state.canDraw && this.state.selected && e.target.classList[0] === "drawing" && this.state.resizing !== []) {
      let updatedRects = this.state.rects;
      let index = parseInt(this.state.selected.id)
      updatedRects[index].selected = false

      this.setState({
        selected: null,
        resizing: [],
        rects: updatedRects
      })
    } 
  }

  undo = () => {
    if (this.state.rects.length === 0) {
      return;
    }

    this.setState(
      prevState => ({
        undoList: prevState.undoList.push(this.state.rects[this.state.rects.length-1]),
        rects: prevState.rects.slice(0,-1),
      })
    );
  };

  redo = () => {
    if (this.state.undoList.size === 0) {
      return;
    }
    let updatedRects = this.state.rects;
    updatedRects.push(this.state.undoList.last())
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

  delete = () => {
    let index = parseInt(this.state.selected.id)
    let updatedRects = this.state.rects;
    updatedRects[index] = {}
    this.setState({
      selected: null,
      rects: updatedRects
    })
  }

  handleColorPick = (color, type) => {
    if (this.state.selected) {
      let index = parseInt(this.state.selected.id)
      let updatedRects = this.state.rects;
      updatedRects[index][`${type}Color`] = color.hex
      this.setState({
        rects: updatedRects
      })
    }
    this.setState({[`${type}Color`]: color.hex})
  };

  resize = (e, startX, startY, endX, endY) => {
    this.setState({
      resizing: [startX, startY, endX, endY]
    })
  }

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

  handleRoundedChange = event => {
    if (this.state.selected) {
      let index = parseInt(this.state.selected.id)
      let updatedRects = this.state.rects;
      updatedRects[index].rounded = event.target.value
      this.setState({
        rects: updatedRects
      })
    }
    this.setState({ rounded: event.target.value });
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
            <div className="center">
                <div
                  className="drawArea"
                  style={this.state.canDraw ? {'cursor': 'crosshair'} : {'cursor': 'default'}}
                  id="drawArea"
                  ref="drawArea"
                  onMouseDown={this.handleMouseDown}
                  onTouchStart={this.handleTouchStart}
                  onMouseMove={this.handleMouseMove}
                  onTouchMove={this.handleTouchMove}
                  onClick={e => this.deselectElement(e)}
                >
                  <Drawing
                    key="drawing"
                    rects={this.state.rects}
                    ghostRect={this.state.ghostRect}
                    fillColors={this.state.fillColors}
                    strokeColors={this.state.strokeColors}
                    widths={this.state.widths}
                    moveSelection={this.moveSelection}
                    setActiveRect={this.setActiveRect}
                    selected={this.state.selected}
                    isDrawing={this.state.isDrawing}
                    resize={this.resize}
                  />
                </div>
                <div className="effectContainerBox">
                  <div className="buttonBox">
                    <button className="buttonBig" style={{'background': `${this.state.canDraw ? `lightblue` : `white`}`}} onClick={e => this.setState({canDraw: true, selected: null})}>
                      Draw
                    </button>
                    <button className="buttonBig" style={{'background': `${this.state.canDraw ? `white` : `lightblue`}`}} onClick={e => this.setState({canDraw: false})}>
                      Grab
                    </button>
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
                    { this.state.selected && 
                      <button className="button" onClick={e => this.delete(e)}>
                        Delete
                      </button>
                    }
                  </div>
                  <div>
                    <label>Fill Color</label>
                    <HuePicker
                      color={this.state.selected ? this.state.rects[parseInt(this.state.selected.id)].fillColor : this.state.fillColor}
                      onChange={e => this.handleColorPick(e, "fill")}
                    />
                  </div>
                  <div>
                    <label>Stroke Color</label>
                    <HuePicker
                      // color={this.state.strokeColor}
                      color={this.state.selected ? this.state.rects[parseInt(this.state.selected.id)].strokeColor : this.state.strokeColor}
                      onChange={e => this.handleColorPick(e, "stroke")}
                    />
                  </div>
                  <div className="slidecontainer">
                    <label>Stroke Thickness</label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      onChange={this.handleStrokeChange}
                      value={this.state.selected ? this.state.rects[parseInt(this.state.selected.id)].strokeWidth : this.state.strokeWidth}
                      className="slider"
                      id="myRange"
                    />
                  </div>
                  <div className="slidecontainer">
                    <label>Stroke Roundness</label>
                    <input
                      type="range"
                      min="1"
                      max="200"
                      onChange={this.handleRoundedChange}
                      value={this.state.selected ? this.state.rects[parseInt(this.state.selected.id)].rounded : this.state.rounded}
                      className="slider"
                      id="myRange"
                    />
                  </div>
                </div>
            </div>
          </div>
      </div>
    );
  }
}

function Drawing({ rects, ghostRect, strokeColors, fillColors, widths, moveSelection, setActiveRect, resize }) {
  if (!strokeColors || !fillColors) {
    return <div></div>;
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
            moveSelection={moveSelection}
            setActiveRect={setActiveRect}
            resize={resize}
          />
          {/* generate text if the box is fully formed (don't make text for an outline) */}
          {
            (!isEmpty(rect)) && <text 
              x={((Math.min(rect.startX, rect.endX)+Math.max(rect.startX, rect.endX))/2)} 
              y={Math.min(rect.startY, rect.endY) + 15 + rect.strokeWidth} 
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

function DrawingRect({ index, rect, moveSelection, setActiveRect, resize }) {
  if (isEmpty(rect)) {
    return <div></div>
  }

  let firstX = Math.min(rect.startX, rect.endX)
  let firstY = Math.min(rect.startY, rect.endY)
  let lastX = Math.max(rect.startX, rect.endX)
  let lastY = Math.max(rect.startY, rect.endY)

  return (
    <>
    {rect.selected &&
        <DragBoxes rect={rect} resize={resize}/>
    }
    <rect
      className="rect"
      id={index}
      key={"rect"+index}
      x={firstX}
      y={firstY}
      rx={rect.rounded}
      ry={rect.rounded}
      width={lastX-firstX}
      height={lastY-firstY}
      fillOpacity={1}
      strokeDasharray={"0,0"}
      onMouseDown={e => moveSelection(e)}
      onClick={e => setActiveRect(e)}
      style={{ stroke: `${rect.strokeColor}`, fill: `${rect.fillColor}`, strokeWidth: `${rect.strokeWidth}` }}
    />
    </>
  );
}

function DragBoxes({ rect, resize }) {
  if (isEmpty(rect)) {
    return <div></div>
  }

  let firstX = Math.min(rect.startX, rect.endX)
  let firstY = Math.min(rect.startY, rect.endY)
  let lastX = Math.max(rect.startX, rect.endX)
  let lastY = Math.max(rect.startY, rect.endY)

  return (
    <>
      <rect
        className="dragBox" id="dragBox1" key={"dragBox1"} x={firstX-10-rect.strokeWidth} y={firstY-10-rect.strokeWidth} onMouseDown={e => resize(e, true, true, false, false)}
      />
      <rect
        className="dragBox" id="dragBox2" key={"dragBox2"} x={(firstX+lastX)/2} y={firstY-10-rect.strokeWidth} onMouseDown={e => resize(e, false, true, false, false)}
      />
      <rect
        className="dragBox" id="dragBox3" key={"dragBox3"} x={lastX+5+rect.strokeWidth} y={firstY-10-rect.strokeWidth} onMouseDown={e => resize(e, false, true, true, false)}
      />
      <rect
        className="dragBox" id="dragBox4" key={"dragBox4"} x={lastX+5+rect.strokeWidth} y={(lastY+firstY)/2} onMouseDown={e => resize(e, false, false, true, false)}
      />
      <rect
        className="dragBox" id="dragBox5" key={"dragBox5"} x={lastX+5+rect.strokeWidth} y={lastY+5+rect.strokeWidth} onMouseDown={e => resize(e, false, false, true, true)}
      />
      <rect
        className="dragBox" id="dragBox6" key={"dragBox6"} x={(firstX+lastX)/2} y={lastY+5+rect.strokeWidth} onMouseDown={e => resize(e, false, false, false, true)}
      />
      <rect
        className="dragBox" id="dragBox7" key={"dragBox7"} x={firstX-10-rect.strokeWidth} y={lastY+5+rect.strokeWidth} onMouseDown={e => resize(e, true, false, false, true)}
      />
      <rect
        className="dragBox" id="dragBox8" key={"dragBox8"} x={firstX-10-rect.strokeWidth} y={(firstY+lastY)/2} onMouseDown={e => resize(e, true, false, false, false)}
      />
    </>
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
        // onMouseDown={e => moveSelection(e)}
        // onClick={e => setActiveRect(e)}
        style={{ stroke: `green`, fill: `none`, strokeWidth: `4` }}
      />
    );
  }

  return <div></div>

}


//utility function - check if object is empty
function isEmpty(obj) {
  for (let key in obj) {
    if (obj.hasOwnProperty(key))
      return false;
  }
  return true;
}

export default App;
