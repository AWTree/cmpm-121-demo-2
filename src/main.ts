import "./style.css";

const APP_NAME = "My Sticker Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

const title = document.createElement("h1");
title.textContent = APP_NAME;
app.appendChild(title);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
app.appendChild(canvas);

// Add a clear button
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
app.appendChild(clearButton);

const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
app.appendChild(undoButton);

const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
app.appendChild(redoButton);

// Get the canvas 2D context for drawing
const ctx = canvas.getContext("2d");
if (ctx) {
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
}

// Array to hold all strokes, where each stroke is an array of points
let strokes: Array<Array<{ x: number; y: number }>> = [];
let redoStack: Array<Array<{ x: number; y: number }>> = [];
let currentStroke: Array<{ x: number; y: number }> = [];
let drawing = false;

// Function to trigger "drawing-changed" event
function triggerDrawingChangedEvent() {
  const event = new Event("drawing-changed");
  canvas.dispatchEvent(event);
}

// Mouse event listeners to collect points and trigger drawing event
canvas.addEventListener("mousedown", (event) => {
  drawing = true;
  currentStroke = []; 
  currentStroke.push({ x: event.offsetX, y: event.offsetY });
  triggerDrawingChangedEvent();
});

canvas.addEventListener("mousemove", (event) => {
  if (drawing) {
    currentStroke.push({ x: event.offsetX, y: event.offsetY });
    triggerDrawingChangedEvent();
  }
});

canvas.addEventListener("mouseup", () => {
  if (drawing) {
    strokes.push(currentStroke); 
    drawing = false;
  }
});

canvas.addEventListener("mouseleave", () => {
  drawing = false; 
});

// Observer for "drawing-changed" event to redraw the canvas
canvas.addEventListener("drawing-changed", () => {
  ctx?.clearRect(0, 0, canvas.width, canvas.height);

  for (const stroke of strokes) {
    if (ctx && stroke.length > 0) {
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    }
  }

  // Draw the current stroke in progress 
  if (currentStroke.length > 0 && ctx) {
    ctx.beginPath();
    ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
    for (let i = 1; i < currentStroke.length; i++) {
      ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
    }
    ctx.stroke();
  }
});

// Clear button 
clearButton.addEventListener("click", () => {
  strokes = []; 
  currentStroke = []; 
  ctx?.clearRect(0, 0, canvas.width, canvas.height); 
});

// Undo button
undoButton.addEventListener("click", () => {
    if (strokes.length > 0) {
      const lastStroke = strokes.pop(); 
      redoStack.push(lastStroke!); 
      triggerDrawingChangedEvent(); 
    }
  });
  
  // Redo button 
  redoButton.addEventListener("click", () => {
    if (redoStack.length > 0) {
      const redoStroke = redoStack.pop(); 
      strokes.push(redoStroke!); 
      triggerDrawingChangedEvent(); 
    }
  });