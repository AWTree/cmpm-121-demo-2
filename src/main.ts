import "./style.css";

const APP_NAME = "My Sticker Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

//
// INTERFACES & CLASSES
//

// Interface for objects that can be drawn on the canvas
interface DisplayCommand {
  display(ctx: CanvasRenderingContext2D): void;
}

// Class for drawing lines on the canvas 
class MarkerLine implements DisplayCommand {
  private points: Array<{ x: number; y: number }> = [];
  private lineWidth: number;

  constructor(initialX: number, initialY: number, lineWidth: number) {
    this.points.push({ x: initialX, y: initialY });
    this.lineWidth = lineWidth;
  }

  // Add points to the current stroke 
  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  // Display the stroke on the canvas
  display(ctx: CanvasRenderingContext2D) {
    ctx.lineWidth = this.lineWidth;
    if (this.points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      }
      ctx.stroke();
    }
  }
}

// Class for displaying the tool preview 
class ToolPreview {
  private x: number;
  private y: number;
  private radius: number;

  constructor(x: number, y: number, lineWidth: number) {
    this.x = x;
    this.y = y;
    this.radius = lineWidth / 2;
  }

  // Update the position of the tool preview 
  updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  // Update the radius of the tool preview
  updateRadius(lineWidth: number) {
    this.radius = lineWidth / 2;
  }

  // Display the tool preview as a circle on the canvas
  display(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

//
// HTML ELEMENTS & SETUP
//

// Create UI elements
const title = document.createElement("h1");
title.textContent = APP_NAME;
app.appendChild(title);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
app.appendChild(canvas);

const clearButton = createButton("Clear");
const undoButton = createButton("Undo");
const redoButton = createButton("Redo");
const thinMarkerButton = createButton("Thin");
const thickMarkerButton = createButton("Thick");

app.appendChild(clearButton);
app.appendChild(undoButton);
app.appendChild(redoButton);
app.appendChild(thinMarkerButton);
app.appendChild(thickMarkerButton);

// Function to create buttons
function createButton(text: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.textContent = text;
  return button;
}

//
// VARIABLES
//

// Canvas context
const ctx = canvas.getContext("2d");
if (ctx) {
  ctx.lineCap = "round";
}

// Application state
let strokes: Array<DisplayCommand> = [];
let redoStack: Array<DisplayCommand> = [];
let currentStroke: MarkerLine | null = null;
let drawing = false;
let selectedLineWidth = 2;
let toolPreview: ToolPreview | null = null;

//
// EVENT LISTENERS
//

// Update tool thickness 
thinMarkerButton.addEventListener("click", () => {
  selectedLineWidth = 2;
  updateSelectedTool(thinMarkerButton);
  updateToolPreview();
  triggerDrawingChangedEvent();
});

thickMarkerButton.addEventListener("click", () => {
  selectedLineWidth = 8;
  updateSelectedTool(thickMarkerButton);
  updateToolPreview();
  triggerDrawingChangedEvent();
});

// Handle mouse events on the canvas
canvas.addEventListener("mousedown", (event) => {
  drawing = true;
  toolPreview = null; 
  currentStroke = new MarkerLine(event.offsetX, event.offsetY, selectedLineWidth);
  triggerDrawingChangedEvent();
});

canvas.addEventListener("mousemove", (event) => {
  if (!drawing) {
    if (!toolPreview) {
      toolPreview = new ToolPreview(event.offsetX, event.offsetY, selectedLineWidth);
    } else {
      toolPreview.updatePosition(event.offsetX, event.offsetY);
    }
    triggerDrawingChangedEvent(); 
  } else if (drawing && currentStroke) {
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

// Clear button functionality
clearButton.addEventListener("click", () => {
  strokes = [];
  currentStroke = null;
  redoStack = [];
  ctx?.clearRect(0, 0, canvas.width, canvas.height);
  updateButtonStates();
});

// Undo/redo button functionality
undoButton.addEventListener("click", () => {
  if (strokes.length > 0) {
    const lastStroke = strokes.pop();
    redoStack.push(lastStroke!);
    triggerDrawingChangedEvent();
    updateButtonStates();
  }
});

redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const redoStroke = redoStack.pop();
    strokes.push(redoStroke!);
    triggerDrawingChangedEvent();
    updateButtonStates();
  }
});

//
// HELPER FUNCTIONS
//

// Trigger the "drawing-changed" event 
function triggerDrawingChangedEvent() {
  const event = new Event("drawing-changed");
  canvas.dispatchEvent(event);
}

// Update the preview radius
function updateToolPreview() {
  if (toolPreview) {
    toolPreview.updateRadius(selectedLineWidth);
  }
}

// Update the visual indicator 
function updateSelectedTool(selectedButton: HTMLButtonElement) {
  thinMarkerButton.classList.remove("selectedTool");
  thickMarkerButton.classList.remove("selectedTool");

  selectedButton.classList.add("selectedTool");
}

// Enable or disable buttons based on the state
function updateButtonStates() {
  undoButton.disabled = strokes.length === 0;
  redoButton.disabled = redoStack.length === 0;
}

//
// CANVAS REDRAW LOGIC
//

canvas.addEventListener("drawing-changed", () => {
  ctx?.clearRect(0, 0, canvas.width, canvas.height);

  // Redraw all the strokes
  for (const stroke of strokes) {
    stroke.display(ctx!);
  }

  // Display the current stroke in progress
  if (currentStroke) {
    currentStroke.display(ctx!);
  }

  // Display the tool preview 
  if (!drawing && toolPreview) {
    toolPreview.display(ctx!);
  }
});
