## User Manual
Installing the application: Download the zip file, open the project in an editor of your choice, and run “npm install” to download all of the necessary packages. To run the web-app locally, simply run “npm start” in your terminal. That’s it!
Draw Mode: when the “Draw” button is pressed (the app is already defaulted to Draw Mode), users can draw rectangles of any shape and size, within the left pane. The mouse needs to be held down between the start and end points, otherwise nothing will be drawn. Zero width and zero height boxes are not allowed.
Grab Mode: when the “Grab” button is pressed, users will not be able to draw any shapes. Instead, by clicking on a shape, users can move it around, within the left pain. By clicking and dragging on one of the 8 selection handles that appear on a highlighted element, users can resize a shape in the direction of the handle. To deselect and element, click on the canvas.
When in Grab Mode, users can also change the fill and stroke color, as well as the stroke thickness and corner radius (“roundness”) of the selected rectangle. Note - clicking on a rectangle will change the slider values to reflect the values of the selected shape.
Only when a shape is selected in Grab Mode can it be deleted. Deleting is as simple as clicking the “delete” button that appears in the right pane, and deleting the shape. 
Undo, Redo, Clear: this app allows the user to undo and redo the creation of shapes. The undo/redo buttons can only remove and put back elements into the left pane. Reverting a change in color, size, line thickness, etc. is not possible at this moment. Note that the “delete” button cannot be undone. 

## “Keep Track”
Javascript, with React JS was used for this. I used node-sass to make my project SCSS compatible. I used an Immutable.JS library to have more robust, persistent, immutable data structures. I used “react-color,” an installable npm-package, to auto-generate color sliders for me.
I used the latest version of every framework and npm package.
I have used React and Immutable before.
I had never worked with react-color before, but the documentation was very simple, and a quick glance at the website gave me everything I needed to know.
I used the latest version of Visual Studio Code for editing. I used the chrome React Dev Tools add-on for state management and debugging.
VS Code extensions:
ESLint: Syntax aware problem highlighting + fixing for Javascript.
Time spent:
Reading tool documentation:
About 20 minutes for an Immutable.JS refresher
Thinking about design:
15 minutes
Time coding
2 hours to get basic rectangle drawing
10 hours to remove bugs, add undo/redo
1 hour to get dragging working
5 hours to add color and other styling functions
2 hours to get draggable resize handles working properly
Time debugging:
95% of total coding time (20.9 hours)
Time researching other implementations
1 hour
I used one main reference for how to use the SVG "path" object to draw lines on a page. I listed this at the top of the file. From there, I extrapolated the information in the sample code to work for SVG "rect” object, which I learned the basic syntax for by visiting the W3 website.
I wrote 567 lines of javascript/JSX (which includes pseudo-html). I wrote 97 lines of SCSS, to style the web app.

## Discussion
This assignment was decently challenging, mostly from a structure perspective. I restructured this project twice, because as the scope was getting more complex, I needed better ways to manage information. As I kept adding more and more features to satisfy the project requirements, I realized that the initial data structures and state management schemes I had been using would be inadequate for more complex use cases. This was also a great exercise in empathizing with the toolmakers of some of my favorite platforms, like Figma, Sketch, and others. I realize now how much planning it takes to create tools that can generate shapes of any size, have the shapes be aware of each other and behave in smart ways, and do this all with a great user experience. In general though, I am much more confident in my skills now than when I first started this exercise. 

I feel as though I could feasibly create a tool like Figma, Sketch, etc, with good planning and copious debugging. I don't think this exercise was particularly hard, it was just a significant amount of work, and required a lot of architecting. In the future, I would like to create a more generic way to create shapes, put bounding boxes around them, and create ways to resize and edit them. The methods I've used in this project are fairly limited to just modifying rectangles. I'd love to explore how to make this more generalizable for all kinds of shapes. I'd also like to explore how to manage shape hierarchies, to truly make this tool more useful than just drawing single layer shapes of any size and color. The ability to nest objects within each other, modify the indexes, and make meaningful objects, would make this tool much more useful. Very much enjoyed this project, I often went on 6-hour code sprints just because I enjoyed tackling problems like this. I couldn't leave it alone.
