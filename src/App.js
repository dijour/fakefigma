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
      lines: new List(),
      undoList: new List(),
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
      lines: prevState.lines.push(new List([point])),
      isDrawing: true,
      colors: this.state.colors.push(this.state.drawColor),
      widths: this.state.widths.push(this.state.strokeWidth)
    }));
  }

  // start drawing
  handleMouseDown = mouseEvent => {
    if (!this.state.canDraw) return;
    const point = this.relativeCoordinatesForEvent(mouseEvent);
    this.setState(prevState => ({
      lines: prevState.lines.push(new List([point])),
      isDrawing: true,
      colors: this.state.colors.push(this.state.drawColor),
      widths: this.state.widths.push(this.state.strokeWidth)
    }));
  };

  handleTouchMove = touchEvent => {
    if (!this.state.isDrawing) {
      return;
    }
    const point = this.relativeCoordinatesForEvent(touchEvent.touches[0]);
    this.setState(
      prevState => ({
        lines: prevState.lines.updateIn([prevState.lines.size - 1], line =>
          line.push(point)
        )
      }));
  }

  // keep building up line points
  handleMouseMove = mouseEvent => {
    if (!this.state.isDrawing) {
      return;
    }
    const point = this.relativeCoordinatesForEvent(mouseEvent);
    this.setState(
      prevState => ({
        lines: prevState.lines.updateIn([prevState.lines.size - 1], line =>
          line.push(point)
        )
      }));
  };

  // end drawing
  handleMouseUp = () => {
    this.setState({
      isDrawing: false
    });
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

  undo = () => {
    if (this.state.lines.size === 0) {
      return;
    }
    this.setState(
      prevState => ({
        undoList: prevState.undoList.push(prevState.lines.last()),
        lines: prevState.lines.delete(-1),
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
      lines: prevState.lines.push(prevState.undoList.last()),
      undoList: prevState.undoList.delete(-1),
      colors: prevState.colors.push(prevState.undoColors.last()),
      undoColors: prevState.undoColors.delete(-1),
      widths: prevState.widths.push(prevState.undoWidths.last()),
      undoWidths: prevState.undoWidths.delete(-1)
    }));
  };

  clear = () => {
    if (this.state.lines.size === 0) {
      return;
    }
    this.setState(
      prevState => ({
        undoList: this.state.lines,
        lines: new List()
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
    const style = {
      display: "flex",
      justifyText: "center",
      flexDirection: "column",
      alignItems: "space-between",
      padding: "40px 40px",
      width: "70%",
      border: "none",
      borderRadius: "10px"
    };
    return (
      <div>
          <div className="pageContainer">
            <h3 className="title">Draw something and send it to the LED display!</h3>
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
                lines={this.state.lines}
                colors={this.state.colors}
                widths={this.state.widths}
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
            </div>
          </div>
      </div>
    );
  }
}

function Drawing({ lines, colors, widths }) {
  return (
    <svg className="drawing">
      {lines.map((line, index) => (
        <DrawingRect
          key={index}
          line={line}
          color={colors.get(index)}
          strokeWidth={widths.get(index)}
        />
      ))}
    </svg>
  );
}

function DrawingRect({ line, color, strokeWidth }) {
  let firstX = Math.min(line.first().get("x"), line.last().get("x"))
  let firstY = Math.min(line.first().get("y"), line.last().get("y"))
  let lastX = Math.max(line.first().get("x"), line.last().get("x"))
  let lastY = Math.max(line.first().get("y"), line.last().get("y"))

  // http://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/
  // Draggable code adapted from the above source.
  return (
    <rect
      className="rect"
      x={firstX}
      y={firstY}
      width={lastX-firstX}
      height={lastY-firstY}
      draggable="true"
      onLoad={e => dragListener(e)}
      style={{ stroke: `${color}`, strokeWidth: `${strokeWidth}` }}
    />
  );
}

var selectedElement, offset, transform;


function dragListener(e) {
  console.log('loaded')
  // e.preventDefault()
  let svg = e.target;

  console.log(e)

  svg.addEventListener('mousedown', startDrag);
  // svg.addEventListener('mousemove', drag);
  // svg.addEventListener('mouseup', endDrag);
  // svg.addEventListener('mouseleave', endDrag);

  function startDrag(e) {
    console.log("hello")
    if (e.target.classList.contains('rect')) {
      selectedElement = e.target;
      console.log(selectedElement)
    }
  }
}

export default App;
