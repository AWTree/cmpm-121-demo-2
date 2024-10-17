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

// Get the canvas 2D context for drawing
const ctx = canvas.getContext("2d");
if (ctx) {
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
}

let drawing = false;

// Mouse event listeners for drawing
canvas.addEventListener("mousedown", (event) => {
  drawing = true;
  ctx?.beginPath(); 
  ctx?.moveTo(event.offsetX, event.offsetY); 
});

canvas.addEventListener("mousemove", (event) => {
  if (drawing) {
    ctx?.lineTo(event.offsetX, event.offsetY); 
    ctx?.stroke(); 
  }
});

canvas.addEventListener("mouseup", () => {
  drawing = false;
  ctx?.closePath(); 
});

canvas.addEventListener("mouseleave", () => {
  drawing = false; 
});

// Clear button functionality
clearButton.addEventListener("click", () => {
  ctx?.clearRect(0, 0, canvas.width, canvas.height);
});