const fs = require('fs');
// Let's emulate what we know.
// We know from tfjs-models blazeface source code:
// const [, width, height] = input.shape ? input.shape : [0, input.width || input.videoWidth, input.height || input.videoHeight];
// And we know in the browser for an HTMLImageElement:
// img.width returns the RENDERED width!

// If input.width is the rendered width, blazeface scales its normalized coordinates by the rendered width.
// Therefore, the coordinates from blazeface (pred.topLeft) are ALREADY IN RENDERED PIXELS.

// So to get the percentage, we just divide by the RENDERED width!
