//
// Drawing Routines for BMS Interactive Maps
//
// All routines must be passed a ctx so it can be rendered on any
// layer desired.

// dependencies:
//    map_math.js
var style = {
    line: {
        color: '#000000',
        style: [],
        width: 2,
    },
    fill: {
        mode: 0,  // 0: None, 1: Color
        color: '#000000',
        opacity: 0.2,
    }
};

// Weather tyoe icons
var img_wx = [];
img_wx.push(new Image());
img_wx.push(new Image());
img_wx.push(new Image());
img_wx.push(new Image());
img_wx.push(new Image());

// Weather Type Icon files
img_wx[0].src = 'common/assets/icon_wx1.png';
img_wx[1].src = 'common/assets/icon_wx2.png';
img_wx[2].src = 'common/assets/icon_wx3.png';
img_wx[3].src = 'common/assets/icon_wx4r.png';
img_wx[4].src = 'common/assets/icon_wx4s.png';

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + ((r) << 16) + ((g) << 8) + (b)).toString(16).slice(1);
}

function getDopplerColor(scan) {
    var intensity = 0;
    var calibration = 20;
    var variation = 0;

    // Rain Colors
    if (scan > 0) {
        variation = Math.round((Math.random()*calibration*scan));
        intensity = rgbToHex(200+ variation,15+ variation,(5 + variation));
        if (scan < 4) intensity = rgbToHex(25+ variation,75+ variation,10 + variation);   // Dark Green
        if (scan < 3) intensity = rgbToHex(52+ variation,120+ variation,25 + variation); // Green
        if (scan < 2) intensity = rgbToHex(62+ variation,140+ variation,39 + variation);   // Light Green
    }

    // Snow Colors
    if (scan < 0) {
        variation = Math.round((Math.random()*calibration*scan));
        scan = -scan;
        intensity = rgbToHex(90,90,(115 + calibration)); // Dark Purple
        if (scan < 4) intensity = rgbToHex(180,180,(230 -calibration + variation));   //Purple
        if (scan < 3) intensity = rgbToHex(200,200,(200 -calibration + variation)); // Light
        if (scan < 2) intensity = rgbToHex(255,255,(255 -calibration + variation));   // White
    }

    return intensity;
}

// Draw the Radar from the fmap
function drawDopplerRadar(ctx) {
    // Guard
    if (fmap.type.length == 0) return;

    // Set Transparency
    ctx.globalAlpha = 0.6;

    var size = 20;
    var degrees = 1.5;
    var sweep = 0.0174533 * degrees;

    ctx.lineWidth = size;
    for (let radius = size; radius < 1900; radius += size) {
        for (arc = 0; arc < Math.PI*2; arc += sweep) {
            var cell = { magnitude: radius , direction: arc};
            var point = vec2XY(cell);
            var x = ((point.x + 1920) / 65) >> 0;
            var y = ((point.y + 1920) / 65) >> 0 ;
            if (x > 58) x = 58;
            if (y > 58) y = 58;

            var scan = dopplerSense(x,y);
            var occluded = ((Math.random() * 15) >> 0) > 13;
            if (scan != 0 && !occluded) {
                ctx.beginPath();
                ctx.strokeStyle = getDopplerColor(scan);
                ctx.arc(1920,1920, radius, arc, arc + sweep);
                ctx.closePath();
                ctx.stroke();
            }
        }
    }

    // Reset Draw Propertis
    ctx.lineWidth = 1;
    ctx.globalAlpha = 1;
}

// Draw the Satellite Image from the fmap
function drawClouds(ctx) {
    // Guard for missing Data
    if (fmap.cloud.cover.length == 0) return;

    // Gaussian blur is intense so keep the image relatively small
    // then upscale so we still get the cloud effects but fast
    var canvas = document.createElement("canvas");
    canvas.width = 472;
    canvas.height = 472;
    var winds = canvas.getContext("2d");

    winds.filter = "blur(4px)";
    winds.fillStyle = 'white';

    // Draw cloud coverage
    for (var y=0; y < fmap.dimension.y;y++) {
        for (var x = 0; x < fmap.dimension.x;x++) {

            var coverage = fmap.cloud.cover[y][x];
            if (coverage < 3) continue; // Dump FEW

            // 0.4 + 0.6 / 13 steps
            winds.globalAlpha = 0.4 + coverage * 0.046;
            winds.fillRect(x*8,y*8,8,8);
        }
    }

    winds.filter = "none";
    winds.globalAlpha = 1.0;
    ctx.drawImage(canvas,0, 0, 3840,3840);
}

function drawWinds(ctx) {
    if (fmap.wind.length == 0) return;

    var alt = properties.settings.altitude;

    var canvas = document.createElement("canvas");
    canvas.width = 65;   // 3840 / fmap.dimension.x
    canvas.height = 65;  // 3840 / fmap.dimension.y;
    var cell = canvas.getContext("2d");

    cell.strokeStyle = '#383b79'; // Black
    ctx.fillStyle = '#383b79'; // Black
    cell.lineWidth = 2;

    // Draw Wind barb for each cell
    for (var y=0; y < fmap.dimension.y;y++) {
        for (var x = 0; x < fmap.dimension.x;x++) {

            var speed = fmap.wind[y][x][alt].speed;
            var direction = fmap.wind[y][x][alt].direction;

            cell.clearRect(0,0,canvas.width,canvas.height);
            cell.translate(canvas.width/2,canvas.height/2);
            cell.rotate(deg2rad(direction));

            // Draw Wind Direction
            cell.beginPath();
            cell.moveTo(0, 25);
            cell.lineTo(0, -25);
            cell.stroke();

            // Draw 50kts annotation
            var i = 0;
            while (speed - 50 > 0) {
                cell.beginPath();
                cell.moveTo(0, -25 + i);
                cell.lineTo(16, -25 + i);
                cell.lineTo(0, -25 + i + 7);
                cell.closePath();
                cell.stroke();
                cell.fill();
                speed -= 50;
                i+=7;
            }

            // Draw 10kts annotation
            var i = 0;
            cell.beginPath();
            while (speed - 10 > 0) {
                cell.moveTo(0, -25 + i);
                cell.lineTo(20, -25 + i);
                speed -= 10;
                i+=7;
            }

            // Draw 5kts annotation
            if (speed > 0) {
                cell.moveTo(0, -25 + i);
                cell.lineTo(10, -25 + i);
            }
            cell.stroke();

            // Draw the Wind bard on the Weather canvas layer
            ctx.drawImage(canvas,x * 65, y * 65);
            cell.resetTransform();
        }
    }
}

function drawTemperatures(ctx) {
    // Guard for missing Data
    if (fmap.type.length == 0 || fmap.temperature.length == 0) return;

    var shift = 0;
    var temp;

   ctx.font = '40px serif';
   ctx.beginPath();

    for (var y=5; y < fmap.dimension.y;y+=5) {
        if (y % 10 ) shift = 5;
        else shift = 0;
        for (var x = 0; x < fmap.dimension.x - 5;x+=5) {
            if ((x + shift) == 0 || x % 10) continue;

            // Check the weather type and temperature for snow
            temp = (fmap.temperature[y][x + shift])>>0;
            type = (fmap.type[y][x + shift])>>0;
            if (temp <= 0 && type == 4) type=5; // Set to snow

            // Convert to Units after snow detemination
            if (!properties.settings.metric) temp = (temp * 9 /5 + 32).toFixed(0);

            ctx.fillStyle = '#383b79';
            //ctx.fillRect((x + shift) * 65 - 85, y * 65 - 52 , 160, 64 );
            ctx.drawImage(img_wx[type - 1], (x + shift) * 65 - 75, y * 65 - 52);

            // Add text with shadow
            ctx.fillStyle = '#000000'; // White
            ctx.fillText(temp + "\xb0", (x + shift) * 65 -2 , y * 65 -2 );
            ctx.fillStyle = '#ffffff'; // White
            ctx.fillText(temp + "\xb0", (x + shift) * 65 -4 , y * 65 -4 );
        }
    }
    ctx.stroke();
}

// Callback for CONREC to draw contour segment
var conrec_ctx;
var level = -1;
var drawContours = function(x1,y1,x2,y2, l) {
    conrec_ctx.beginPath();
    conrec_ctx.moveTo(y1 * 65,x1 * 65);
    conrec_ctx.lineTo(y2 * 65,x2 * 65);
    conrec_ctx.stroke();

    if (!properties.settings.metric) l = (l * 0.0295301).toFixed(2);
    if (level != l) {
        conrec_ctx.fillStyle = '#000000';
        conrec_ctx.fillText(l, y1 * 65 + 5 +2, x1 * 65 +2);
        conrec_ctx.fillStyle = '#ffffff';
        conrec_ctx.fillText(l, y1 * 65 + 5, x1 * 65 );
        level = l;
    }
}

// Draw the ISOBARS using CONREC
function drawIsoBars(ctx) {
    // Add Guard
    if (fmap.pressure.length == 0) return;

    var data = fmap.pressure;
    var c = new Conrec();
    var ilb = 0;
    var iub = 58;
    var jlb = 0;
    var jub = 58;
    var x = [];
    var y = [];

    conrec_ctx = ctx;
    conrec_ctx.strokeStyle = '#383b79';
    //ctx.fillStyle = '#ff0000';
    conrec_ctx.lineWidth = 4;
    ctx.font = '18px serif';

    // Setup the data matrix column and row coordinates
    for (var i = ilb; i <= iub; i ++) {
        var coord = i;
        x.push(coord);
        y.push(coord);
    }

    // Setup the Pressure contour levels to draw
    var pressures = Array((fmap.analytics.pressure_max - fmap.analytics.pressure_min)>>0).fill(0);
    for (var i=0;i < pressures.length; i++) {
        pressures[i] = (fmap.analytics.pressure_min >> 0) + i;
    }

    // Create the Contour
    c.drawContour = drawContours;
    c.contour(fmap.pressure, ilb, iub, jlb, jub, x, y, pressures.length, pressures);
}
