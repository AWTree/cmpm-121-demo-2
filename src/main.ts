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

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

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

  updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  updateRadius(lineWidth: number) {
    this.radius = lineWidth / 2;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// Class for displaying the sticker preview
class StickerPreview {
  private x: number;
  private y: number;
  private sticker: string;

  constructor(x: number, y: number, sticker: string) {
    this.x = x;
    this.y = y;
    this.sticker = sticker;
  }

  updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.font = "40px Arial";
    ctx.fillText(this.sticker, this.x, this.y);
  }
}

// Class for displaying stickers 
class Sticker implements DisplayCommand {
  private x: number;
  private y: number;
  private sticker: string;

  constructor(x: number, y: number, sticker: string) {
    this.x = x;
    this.y = y;
    this.sticker = sticker;
  }

  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.font = "40px Arial";
    ctx.fillText(this.sticker, this.x, this.y);
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
const sticker1Button = createButton("🖌️");
const sticker2Button = createButton("🎨");
const sticker3Button = createButton("🎲");

app.appendChild(clearButton);
app.appendChild(undoButton);
app.appendChild(redoButton);
app.appendChild(thinMarkerButton);
app.appendChild(thickMarkerButton);
app.appendChild(sticker1Button);
app.appendChild(sticker2Button);
app.appendChild(sticker3Button);

// Function to create buttons
function createButton(text: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.textContent = text;
  return button;
}

//
// VARIABLES & STATE
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
let selectedSticker: string | null = null;
let stickerPreview: StickerPreview | null = null;

//
// EVENT LISTENERS
//

// Handle sticker selection and preview
sticker1Button.addEventListener("click", () => handleStickerSelection("🖌️", sticker1Button));
sticker2Button.addEventListener("click", () => handleStickerSelection("🎨", sticker2Button));
sticker3Button.addEventListener("click", () => handleStickerSelection("🎲", sticker3Button));

// Update tool thickness on button click
thinMarkerButton.addEventListener("click", () => handleToolSelection(2, thinMarkerButton));
thickMarkerButton.addEventListener("click", () => handleToolSelection(8, thickMarkerButton));

// Handle mouse events on the canvas
canvas.addEventListener("mousedown", handleMouseDown);
canvas.addEventListener("mousemove", handleMouseMove);
canvas.addEventListener("mouseup", handleMouseUp);
canvas.addEventListener("mouseleave", () => (drawing = false));

// Clear button functionality
clearButton.addEventListener("click", clearCanvas);

// Undo/redo button functionality
undoButton.addEventListener("click", undoLastAction);
redoButton.addEventListener("click", redoLastAction);

//
// HELPER FUNCTIONS
//

// Handle sticker selection and update the preview
function handleStickerSelection(sticker: string, button: HTMLButtonElement) {
  selectedSticker = sticker;
  updateSelectedSticker(button);
  updateStickerPreview();
}

// Handle tool selection 
function handleToolSelection(lineWidth: number, button: HTMLButtonElement) {
  selectedLineWidth = lineWidth;
  updateSelectedTool(button);
  updateToolPreview();
  triggerDrawingChangedEvent();
}

// Mouse down event handler
function handleMouseDown(event: MouseEvent) {
  if (selectedSticker) {
    const sticker = new Sticker(event.offsetX, event.offsetY, selectedSticker);
    strokes.push(sticker);
    stickerPreview = null; 
  } else {
    drawing = true;
    toolPreview = null; 
    currentStroke = new MarkerLine(event.offsetX, event.offsetY, selectedLineWidth);
  }
  triggerDrawingChangedEvent();
}

// Mouse move event handler
function handleMouseMove(event: MouseEvent) {
  if (!drawing && selectedSticker && stickerPreview) {
    stickerPreview.updatePosition(event.offsetX, event.offsetY);
    triggerDrawingChangedEvent();
  } else if (drawing && currentStroke) {
    currentStroke.drag(event.offsetX, event.offsetY);
    triggerDrawingChangedEvent();
  }
}

// Mouse up event handler
function handleMouseUp() {
  if (drawing && currentStroke) {
    strokes.push(currentStroke);
    currentStroke = null;
    drawing = false;
    redoStack = [];
    updateButtonStates();
  }
}

// Clear 
function clearCanvas() {
  strokes = [];
  currentStroke = null;
  redoStack = [];
  ctx?.clearRect(0, 0, canvas.width, canvas.height);
  updateButtonStates();
}

// Undo 
function undoLastAction() {
  if (strokes.length > 0) {
    const lastStroke = strokes.pop();
    redoStack.push(lastStroke!);
    triggerDrawingChangedEvent();
    updateButtonStates();
  }
}

// Redo 
function redoLastAction() {
  if (redoStack.length > 0) {
    const redoStroke = redoStack.pop();
    strokes.push(redoStroke!);
    triggerDrawingChangedEvent();
    updateButtonStates();
  }
}

// Trigger the "drawing-changed" event 
function triggerDrawingChangedEvent() {
  const event = new Event("drawing-changed");
  canvas.dispatchEvent(event);
}

// Update the sticker preview
function updateStickerPreview() {
  stickerPreview = null;
  if (selectedSticker) {
    stickerPreview = new StickerPreview(0, 0, selectedSticker);
  }
  triggerDrawingChangedEvent();
}

// Update the tool preview 
function updateToolPreview() {
  if (toolPreview) {
    toolPreview.updateRadius(selectedLineWidth);
  }
}

// Highlight the selected sticker button
function updateSelectedSticker(selectedButton: HTMLButtonElement) {
  [sticker1Button, sticker2Button, sticker3Button].forEach(button =>
    button.classList.remove("selectedTool")
  );
  selectedButton.classList.add("selectedTool");
}

// Highlight the selected tool button 
function updateSelectedTool(selectedButton: HTMLButtonElement) {
  [thinMarkerButton, thickMarkerButton].forEach(button =>
    button.classList.remove("selectedTool")
  );
  selectedButton.classList.add("selectedTool");
}

// Enable or disable buttons
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

  // Display the current stroke 
  if (currentStroke) {
    currentStroke.display(ctx!);
  }

  // Display the sticker preview 
  if (!drawing && stickerPreview) {
    stickerPreview.display(ctx!);
  }

  // Display the tool preview 
  if (!drawing && toolPreview) {
    toolPreview.display(ctx!);
  }
});
