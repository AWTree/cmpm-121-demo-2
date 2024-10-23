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
  private color: string;

  constructor(initialX: number, initialY: number, lineWidth: number,  color: string) {
    this.points.push({ x: initialX, y: initialY });
    this.lineWidth = lineWidth;
    this.color = color;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.lineWidth = this.lineWidth;
    ctx.strokeStyle = this.color; 
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
  private lineWidth: number;

  constructor(x: number, y: number, lineWidth: number) {
    this.x = x;
    this.y = y;
    this.lineWidth = lineWidth;
    this.radius = lineWidth / 2;
  }

  updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  updateLineWidth(lineWidth: number) {
    this.radius = lineWidth / 2;
  }

  // Display the brush stroke preview
  display(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); // Draw a circle (point)
    ctx.fill(); // Fill the circle to represent the point
  }
}

// Class for displaying the sticker preview
class StickerPreview {
  private x: number;
  private y: number;
  private sticker: string;
  private rotation: number;
  private size: number;

  constructor(x: number, y: number, sticker: string, rotation: number, size: number) {
    this.x = x;
    this.y = y;
    this.sticker = sticker;
    this.rotation = rotation; 
    this.size = size;
  }

  updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.font = `${this.size}px Arial`; 
    ctx.fillText(this.sticker, 0, 0);
    ctx.restore();
  }
}

// Class for displaying stickers 
class Sticker implements DisplayCommand {
  private x: number;
  private y: number;
  private sticker: string;
  private rotation: number;
  private size: number;

  constructor(x: number, y: number, sticker: string, rotation: number, size: number) {
    this.x = x;
    this.y = y;
    this.sticker = sticker;
    this.rotation = rotation; 
    this.size = size;
  }

  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180); 
    ctx.font = `${this.size}px Arial`;
    ctx.fillText(this.sticker, 0, 0);
    ctx.restore();
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

const thinMarkerWidth = 3; 
const thickMarkerWidth = 10;

const clearButton = createButton("Clear");
const undoButton = createButton("Undo");
const redoButton = createButton("Redo");
const thinMarkerButton = createButton("Thin");
const thickMarkerButton = createButton("Thick");
const customStickerButton = createButton("Add Custom Sticker");
const exportButton = createButton("Export");

app.appendChild(clearButton);
app.appendChild(undoButton);
app.appendChild(redoButton);
app.appendChild(thinMarkerButton);
app.appendChild(thickMarkerButton);
app.appendChild(customStickerButton);
app.appendChild(exportButton);

// Add color picker to HTML
const colorPicker = document.createElement("input");
colorPicker.type = "color";
colorPicker.value = "#000000"; 
app.appendChild(colorPicker);

// Sticker array
let stickers = ["🖌️", "🎨", "🎲"];
const stickerButtonsContainer = document.createElement("div");
app.appendChild(stickerButtonsContainer);

// Function to create buttons
function createButton(text: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.textContent = text;
  return button;
}

function updateStickerButtons() {
  stickerButtonsContainer.innerHTML = "";
  stickers.forEach((sticker) => {
    const stickerButton = createButton(sticker);
    stickerButton.addEventListener("click", () => handleStickerSelection(sticker, stickerButton));
    stickerButtonsContainer.appendChild(stickerButton);
  });
}

function getRandomRotation() {
  return Math.floor(Math.random() * 360); 
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
let currentBrushColor = "#000000"; 
const stickerSizeSlider = document.getElementById("stickerSize") as HTMLInputElement;
let stickerSize = 40; 

//
// EVENT LISTENERS
//

// Update tool thickness on button click
thinMarkerButton.addEventListener("click", () => handleToolSelection(thinMarkerWidth, thinMarkerButton));
thickMarkerButton.addEventListener("click", () => handleToolSelection(thickMarkerWidth, thickMarkerButton));

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

// Add event listener for creating custom stickers
customStickerButton.addEventListener("click", () => {
  const customSticker = prompt("Enter a new sticker:", "😀");
  if (customSticker) {
    stickers.push(customSticker);
    updateStickerButtons();
  }
});

stickerSizeSlider.addEventListener("input", () => {
  stickerSize = parseInt(stickerSizeSlider.value, 10);
});

// Event listener for color picker
colorPicker.addEventListener("input", () => {
  currentBrushColor = colorPicker.value;
});

// Export button functionality
exportButton.addEventListener("click", () => {
  // Create a new temporary canvas of size 1024x1024
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;

  const exportCtx = exportCanvas.getContext("2d");
  if (exportCtx) {
    exportCtx.scale(4, 4); 

    for (const stroke of strokes) {
      stroke.display(exportCtx); 
    }

    const anchor = document.createElement("a");
    anchor.href = exportCanvas.toDataURL("image/png");
    anchor.download = "sketchpad_hi_res.png";
    anchor.click();
  }
});

//
// HELPER FUNCTIONS
//

// Handle sticker selection and update the preview
function handleStickerSelection(sticker: string, button: HTMLButtonElement) {
  selectedSticker = sticker;
  const randomRotation = getRandomRotation(); 
  stickerPreview = new StickerPreview(0, 0, sticker, randomRotation, stickerSize); 
  updateSelectedTool(button);
  updateStickerPreview();
}
// Handle tool selection 
function handleToolSelection(lineWidth: number, button: HTMLButtonElement) {
  selectedLineWidth = lineWidth;
  selectedSticker = null;
  currentStroke = new MarkerLine(0, 0, lineWidth, currentBrushColor); 
  updateSelectedTool(button);
  updateToolPreview();
  triggerDrawingChangedEvent();
}

// Mouse down event handler
function handleMouseDown(event: MouseEvent) {
  if (selectedSticker) {
    const randomRotation = getRandomRotation();
    const sticker = new Sticker(event.offsetX, event.offsetY, selectedSticker, randomRotation, stickerSize);
    strokes.push(sticker);
    stickerPreview = null; 
  } else {
    drawing = true;
    toolPreview = null; 
    currentStroke = new MarkerLine(event.offsetX, event.offsetY, selectedLineWidth, currentBrushColor);
  }
  triggerDrawingChangedEvent();
}

// Mouse move event handler
function handleMouseMove(event: MouseEvent) {
  if (!drawing && !selectedSticker) {
    if (!toolPreview) {
      toolPreview = new ToolPreview(event.offsetX, event.offsetY, selectedLineWidth);
    } else {
      toolPreview.updatePosition(event.offsetX, event.offsetY);
    }
    triggerDrawingChangedEvent(); 
  } else if (drawing && currentStroke) {
    currentStroke.drag(event.offsetX, event.offsetY);
    triggerDrawingChangedEvent(); 
  } else if (!drawing && selectedSticker && stickerPreview) {
    stickerPreview.updatePosition(event.offsetX, event.offsetY);
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

canvas.addEventListener("mouseleave", () => {
  drawing = false; 
  toolPreview = null; 
  stickerPreview = null; 
  triggerDrawingChangedEvent(); 
});

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
  const randomRotation = getRandomRotation();
  stickerPreview = null;
  if (selectedSticker) {
    stickerPreview = new StickerPreview(0, 0, selectedSticker, randomRotation, stickerSize);
  }
  triggerDrawingChangedEvent();
}
// Update the tool preview 
function updateToolPreview() {
  if (toolPreview) {
    toolPreview.updateLineWidth(selectedLineWidth);
  } else {
    toolPreview = new ToolPreview(0, 0, selectedLineWidth);
  }
  triggerDrawingChangedEvent();
}

// Highlight the selected tool button 
function updateSelectedTool(selectedButton: HTMLButtonElement) {
  [thinMarkerButton, thickMarkerButton].forEach(button =>
    button.classList.remove("selectedTool")
  );
  selectedButton.classList.add("selectedTool");
  triggerDrawingChangedEvent();
}

// Enable or disable buttons
function updateButtonStates() {
  undoButton.disabled = strokes.length === 0;
  redoButton.disabled = redoStack.length === 0;
}

// Canvas redraw logic
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

  // Display the brush stroke preview (as a point)
  if (!drawing && toolPreview) {
    toolPreview.display(ctx!);
  }

  // Display the sticker preview
  if (!drawing && stickerPreview) {
    stickerPreview.display(ctx!);
  }
});

// Initialize Sticker buttons
updateStickerButtons(); 