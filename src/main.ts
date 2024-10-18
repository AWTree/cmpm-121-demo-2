import "./style.css";

const APP_NAME = "My Sticker Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

interface DisplayCommand {
  display(ctx: CanvasRenderingContext2D): void;
}

class MarkerLine implements DisplayCommand {
  private points: Array<{ x: number; y: number }> = [];
  private lineWidth: number;

  constructor(initialX: number, initialY: number, lineWidth: number) {
    // Initialize with the starting point
    this.points.push({ x: initialX, y: initialY });
    this.lineWidth = lineWidth;
  }

  // Method to add new points as the user drags
  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  // The display method to draw the marker line on the canvas
  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length > 0) {
      ctx.lineWidth = this.lineWidth; 
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      }
      ctx.stroke();
    }
  }
}

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

const thinMarkerButton = document.createElement("button");
thinMarkerButton.textContent = "Thin";
app.appendChild(thinMarkerButton);

const thickMarkerButton = document.createElement("button");
thickMarkerButton.textContent = "Thick";
app.appendChild(thickMarkerButton);

// Get the canvas 2D context for drawing
const ctx = canvas.getContext("2d");
if (ctx) {
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
}

// Array to hold all strokes, where each stroke is an array of points
let strokes: Array<DisplayCommand> = [];
let redoStack: Array<DisplayCommand> = [];
let currentStroke: MarkerLine | null = null;
let selectedLineWidth = 2;
let drawing = false;

// Function to trigger "drawing-changed" event
function triggerDrawingChangedEvent() {
  const event = new Event("drawing-changed");
  canvas.dispatchEvent(event);
}

// Mouse event listeners to collect points and trigger drawing event
canvas.addEventListener("mousedown", (event) => {
  drawing = true;
  currentStroke = new MarkerLine(event.offsetX, event.offsetY,  selectedLineWidth);
  triggerDrawingChangedEvent();
});

canvas.addEventListener("mousemove", (event) => {
  if (drawing && currentStroke) {
    currentStroke.drag(event.offsetX, event.offsetY);
    triggerDrawingChangedEvent();
  }
});

canvas.addEventListener("mouseup", () => {
  if (drawing && currentStroke) {
    strokes.push(currentStroke); 
    currentStroke = null;
    drawing = false;
    redoStack = []; 
    updateButtonStates();
  }
});

canvas.addEventListener("mouseleave", () => {
  drawing = false; 
});

// Observer for "drawing-changed" event to redraw the canvas
canvas.addEventListener("drawing-changed", () => {
  ctx?.clearRect(0, 0, canvas.width, canvas.height);

  for (const stroke of strokes) {
    stroke.display(ctx!);
  }

  if (currentStroke) {
    currentStroke.display(ctx!);
  }
});

// Clear button 
clearButton.addEventListener("click", () => {
  strokes = []; 
  currentStroke = null;
  ctx?.clearRect(0, 0, canvas.width, canvas.height); 
  updateButtonStates();
});

// Undo button
undoButton.addEventListener("click", () => {
  if (strokes.length > 0) {
    const lastStroke = strokes.pop(); 
    redoStack.push(lastStroke!); 
    triggerDrawingChangedEvent(); 
    updateButtonStates();
  }
});
  
// Redo button 
redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const redoStroke = redoStack.pop(); 
    strokes.push(redoStroke!); 
    triggerDrawingChangedEvent(); 
    updateButtonStates();
  }
});

thinMarkerButton.addEventListener("click", () => {
  selectedLineWidth = 2; 
  updateSelectedTool(thinMarkerButton);
});

thickMarkerButton.addEventListener("click", () => {
  selectedLineWidth = 6; 
  updateSelectedTool(thickMarkerButton);
});

function updateSelectedTool(selectedButton: HTMLButtonElement) {
  thinMarkerButton.classList.remove("selectedTool");
  thickMarkerButton.classList.remove("selectedTool");

  selectedButton.classList.add("selectedTool");
}

// Initialize button states
updateButtonStates();

function updateButtonStates() {
  undoButton.disabled = strokes.length === 0;
  redoButton.disabled = redoStack.length === 0;
}