import React, { Component, useState, useEffect, useRef } from "react";
import "./App.scss";
// import styles from "./draw.module.scss";
import { List, Map } from "immutable";
import { HuePicker } from "react-color";
import cn from "classnames";

// preliminary code thanks to: https://codepen.io/philipp-spiess/pen/WpQpGr
class App extends Component {
  constructor() {
    super();
    this.state = {
      rects: new List(),
      //outline of new rectangle, only used while mouseDown
      ghostRect: new List(),
      undoList: new List(),
      selected: null,
      mouseOffset: {},
      colors: new List(),
      undoColors: new List(),
      widths: new List(),
      undoWidths: new List(),
      isDrawing: false,
      canDraw: true,
      targetBoard: null,
      windowHeight: window.innerHeight,
      windowWidth: window.innerWidth,
      strokeWidth: 5,
      drawColor: "#000000",
      top_left_color: null,
      top_right_color: null,
      bottom_right_color: null,
      bottom_left_color: null,
      targetBoardMap: {
        "0": this.updateTopLeft,
        "1": this.updateTopRight,
        "2": this.updateBottomRight,
        "3": this.updateBottomLeft
      },
      drawingSentToDb: false,
      submitModalOpen: false,
      name: ""
    };
  }

  handleTouchStart = (touchEvent) => {
    if (!this.state.canDraw) return;
    const point = this.relativeCoordinatesForEvent(touchEvent.touches[0]);
    this.setState(prevState => ({
      rects: prevState.rects.push(new List([point])),
      ghostRect: prevState.rects.push(new List([point])),
      isDrawing: true,
      colors: this.state.colors.push(this.state.drawColor),
      widths: this.state.widths.push(this.state.strokeWidth)
    }));
  }

  // start drawing
  handleMouseDown = mouseEvent => {
    const point = this.relativeCoordinatesForEvent(mouseEvent);
    if (this.state.canDraw) {
      this.setState(prevState => ({
        rects: prevState.rects.push(new List([point])),
        ghostRect: prevState.rects.push(new List([point])),
        isDrawing: true,
        colors: this.state.colors.push(this.state.drawColor),
        widths: this.state.widths.push(this.state.strokeWidth)
      }));
    }

    else {
      const point = this.relativeCoordinatesForEvent(mouseEvent);
    }

  };

  handleTouchMove = touchEvent => {
    
    if (!this.state.isDrawing || !this.state.canDraw) {
      return;
    }
    const point = this.relativeCoordinatesForEvent(touchEvent.touches[0]);
    this.setState(
      prevState => ({
        ghostRect: prevState.rects.updateIn([prevState.rects.size - 1], line =>
          line.push(point)
        )
      }));
  }

  // keep building up line points
  handleMouseMove = mouseEvent => {
    const point = this.relativeCoordinatesForEvent(mouseEvent);

    if (this.state.selected && !this.state.canDraw && !this.state.isDrawing) {
      console.log("selected is: ", this.state.selected)
      this.state.selected.setAttribute("x", point.get('x')-this.state.offset.x)
      this.state.selected.setAttribute("y", point.get('y')-this.state.offset.y)
    }

    if (!this.state.isDrawing || !this.state.canDraw) {
      return;
    }
    this.setState(
      prevState => ({
        ghostRect: prevState.rects.updateIn([prevState.rects.size - 1], line =>
          line.push(point)
        )
      }));
  };

  // end drawing
  handleMouseUp = mouseEvent => {

    if (this.state.selected && !this.state.canDraw && !this.state.isDrawing) {
      this.setState({
        selected: null,
        offset: {}
      })
    }

    if (!this.state.isDrawing || !this.state.canDraw) {
      return
    }

    const point = this.relativeCoordinatesForEvent(mouseEvent);

    let anchorPoint = this.state.ghostRect.last().first();
    let finalPoint = this.state.ghostRect.last().last();

    //ensure no zero width or height boxes
    if (this.state.ghostRect.last().toJS().length < 2 || anchorPoint.get('x') === finalPoint.get('x') || anchorPoint.get('y') === finalPoint.get('y')) {
      alert("Cannot create zero width or zero height boxes!")
      this.setState(
        prevState => ({
          ghostRect: new List(),
          rects: prevState.rects.delete(-1),
          isDrawing: false
        }));
      return
    }

    // if all conditions satisfied, commit the box to state and wipe the ghostRect outline
    this.setState(
      prevState => ({
        ghostRect: new List(),
        isDrawing: false,
        rects: prevState.rects.updateIn([prevState.rects.size - 1], line =>
          line.push(point)
        )
      }), () => console.log('test', this.state.ghostRect));
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
    console.log(e.target)
    let mouse = this.relativeCoordinatesForEvent(e);
    let offset = {x: mouse.get('x'), y: mouse.get('y')}
    offset.x -= parseFloat(e.target.getAttributeNS(null, "x"));
    offset.y -= parseFloat(e.target.getAttributeNS(null, "y"));
    this.setState({
      selected: e.target,
      offset: offset
    }, () => this.state.selected.setAttribute("fill", "red"))
  }

  undo = () => {
    if (this.state.rects.size === 0) {
      return;
    }
    this.setState(
      prevState => ({
        undoList: prevState.undoList.push(prevState.rects.last()),
        rects: prevState.rects.delete(-1),
        undoColors: prevState.undoColors.push(prevState.colors.last()),
        colors: prevState.colors.delete(-1),
        undoWidths: prevState.undoWidths.push(prevState.widths.last()),
        widths: prevState.widths.delete(-1)
      })
    );
  };

  redo = () => {
    if (this.state.undoList.size === 0) {
      return;
    }
    this.setState(prevState => ({
      rects: prevState.rects.push(prevState.undoList.last()),
      undoList: prevState.undoList.delete(-1),
      colors: prevState.colors.push(prevState.undoColors.last()),
      undoColors: prevState.undoColors.delete(-1),
      widths: prevState.widths.push(prevState.undoWidths.last()),
      undoWidths: prevState.undoWidths.delete(-1)
    }));
  };

  clear = () => {
    if (this.state.rects.size === 0) {
      return;
    }
    this.setState(
      prevState => ({
        undoList: this.state.rects,
        rects: new List()
      })
    );
  };

  // reset state values
  cleanUp = () => {
    this.setState(
      {
        lines: new List(),
        undoList: new List(),
        colors: new List(),
        undoColors: new List(),
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

  handleColorPick = color => {
    this.setState({ drawColor: color.hex });
  };

  handleStrokeChange = event => {
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
                >
                  <Drawing
                    rects={this.state.rects}
                    ghostRect={this.state.ghostRect}
                    colors={this.state.colors}
                    widths={this.state.widths}
                    updateSelection={this.updateSelection}
                    isDrawing={this.state.isDrawing}
                  />
                </div>
                <div className="effectContainerBox">
                  <div>
                    <label>Stroke Color</label>
                    <HuePicker
                      color={this.state.drawColor}
                      onChange={this.handleColorPick}
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

function Drawing({ rects, ghostRect, colors, widths, updateSelection }) {
  console.log(rects.size)
  return (
    <svg className="drawing">
      {ghostRect !== new List() &&
        ghostRect.map((line, index) => (
          <DrawingRect
            key={index}
            index={index}
            line={line}
            color={"green"}
            type={"outline"}
            strokeWidth={widths.get(index)}
            updateSelection={updateSelection}
          />
        ))
        }
        
        {rects.map((line, index) => (
          <>
            <DrawingRect
              key={index}
              index={index}
              line={line}
              color={colors.get(index)}
              strokeWidth={widths.get(index)}
              updateSelection={updateSelection}
            />
            {/* generate text if the box is fully formed (don't make text for an outline) */}
            {(line.size > 1) && <text x={((Math.min(line.first().get("x"), line.last().get("x"))+Math.max(line.first().get("x"), line.last().get("x")))/2)} y={Math.min(line.first().get("y"), line.last().get("y")) + 15} className="rectangleText">{`Rectangle ${index}`}</text>}
          </>
        ))}

    </svg>
  );
}

function DrawingRect({ index, line, color, strokeWidth, type, updateSelection }) {
  let firstX = Math.min(line.first().get("x"), line.last().get("x"))
  let firstY = Math.min(line.first().get("y"), line.last().get("y"))
  let lastX = Math.max(line.first().get("x"), line.last().get("x"))
  let lastY = Math.max(line.first().get("y"), line.last().get("y"))

  // http://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/
  // Draggable code adapted from the above source.
  return (
    <rect
      className="rect"
      id={"rect"+index}
      x={firstX}
      y={firstY}
      width={lastX-firstX}
      height={lastY-firstY}
      draggable="true"
      onLoad={dragListener}
      fillOpacity={type === "outline" ? 0 : 1}
      strokeDasharray={type === "outline" ? "5,5" : "0,0"}
      onMouseDown={e => updateSelection(e)}
      onClick={e => console.log("clicked" + index)}
      style={{ stroke: `${color}`, strokeWidth: `${strokeWidth}` }}
    />
  );
}

var selectedElement, offset, transform;


function dragListener(e) {
  console.log('loaded')
  e.preventDefault()
  let svg = e.target;

  console.log(e)

  svg.addEventListener('mousedown', startDrag);
  // svg.addEventListener('mousemove', drag);
  // svg.addEventListener('mouseup', endDrag);
  // svg.addEventListener('mouseleave', endDrag);

  // need mouse move events to be on the window, not on the element
  // if mouse moves too quickly, then this object will lose track
  function startDrag(e) {
    console.log("hello")
    if (e.target.classList.contains('rect')) {
      selectedElement = e.target;
      console.log(selectedElement)
    }
  }
}

export default App;
