const TWO_PI = Math.PI * 2;

const nearestPow2 = (aSize) => {
  return Math.pow(2, Math.round(Math.log(aSize) / Math.log(2)));
};

const lineLength = (p1, p2) => {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
};

const arcLength = (startAngle, endAngle, clockwise, radius) => {
  var angleTotal = clockwise ? endAngle - startAngle : startAngle - endAngle;
  if (angleTotal > Math.PI) {
    angleTotal -= Math.PI;
  }
  return radius * angleTotal;
};

const pointOnArc = (center, radius, startAngle, endAngle, length) => {
  var rawAngle = endAngle - startAngle;
  if ((rawAngle + TWO_PI) % TWO_PI < Math.PI) {
    rawAngle = TWO_PI - (startAngle - endAngle);
  }
  var arcLen = radius * Math.abs(rawAngle);
  const fraction = length / arcLen;
  const pointAngle = startAngle + fraction * rawAngle;
  const x = center.x + radius * Math.cos(pointAngle);
  const y = center.y + radius * Math.sin(pointAngle);
  return { x: x, y: y };
};

const pointOnLine = (sp, p1, p2, distance) => {
  var a = { x: p2.x - p1.x, y: p2.y - p1.y },
    mag = Math.sqrt(a.x * a.x + a.y * a.y);
  if (mag === 0) {
    a.x = a.y = 0;
  } else {
    a.x = (a.x / mag) * distance;
    a.y = (a.y / mag) * distance;
  }
  return { x: sp.x + a.x, y: sp.y + a.y };
};

const normalizeAngle = (angle) => {
  angle = angle % TWO_PI;
  if (angle < 0) angle += TWO_PI;
  return angle;
};

const arcTo = (sx, sy, x1, y1, x2, y2, radius) => {
  // Calculate the angle between the two line segments
  var angle1 = Math.atan2(sy - y1, sx - x1);
  var angle2 = Math.atan2(y2 - y1, x2 - x1);

  angle1 = normalizeAngle(angle1);
  angle2 = normalizeAngle(angle2);

  var angle = angle2 - angle1;

  angle = normalizeAngle(angle);

  if (angle > Math.PI) angle = angle1 - angle2;

  // Calculate the length of the line segment
  var length = radius / Math.tan(angle / 2);

  var startX = x1 + length * Math.cos(angle1);
  var startY = y1 + length * Math.sin(angle1);

  var endX = x1 + length * Math.cos(angle2);
  var endY = y1 + length * Math.sin(angle2);

  // Start angle should rotate towards end angle
  var rawAngle = angle2 - angle1;

  var direction = -1.0;
  if ((rawAngle + TWO_PI) % TWO_PI < Math.PI) {
    direction = 1.0;
  }

  var startAngle = angle1 + (Math.PI / 2.0) * direction;
  var endAngle = angle2 - (Math.PI / 2.0) * direction;

  startAngle = normalizeAngle(startAngle);
  endAngle = normalizeAngle(endAngle);

  // Calculate the center point of the arc
  var centerX = startX + radius * Math.cos(startAngle);
  var centerY = startY + radius * Math.sin(startAngle);

  // Get the angles from center to the arc start and endpoints
  startAngle = normalizeAngle(startAngle + Math.PI);
  endAngle = normalizeAngle(endAngle + Math.PI);

  var clockwise = true;
  rawAngle = endAngle - startAngle;
  if ((rawAngle + TWO_PI) % TWO_PI < Math.PI) {
    rawAngle = normalizeAngle(TWO_PI - (startAngle - endAngle));
    clockwise = false;
  }
  var center = {
    x: centerX,
    y: centerY,
  };
  var start = {
    x: startX,
    y: startY,
  };
  var end = {
    x: endX,
    y: endY,
  };

  const arcLen = radius * Math.abs(rawAngle);

  return {
    start: start,
    end: end,
    radius: radius,
    center: center,
    startAngle: startAngle,
    endAngle: endAngle,
    angle1: angle1,
    angle2: angle2,
    angle: angle,
    arcLen: arcLen,
    clockwise: clockwise,
    direction: direction,
    rawAngle: rawAngle,
  };
};

const smoothPolylineLength = (points, radius) => {
  if (points.length > 2) {
    let inPoint = points[0];
    let currentDistance = 0.0;

    for (var i = 1; i < points.length - 1; i++) {
      let p1 = points[i];
      let p2 = points[i + 1];

      let arcInfo = arcTo(inPoint.x, inPoint.y, p1.x, p1.y, p2.x, p2.y, radius);

      // Move along incoming segment
      currentDistance += lineLength(inPoint, arcInfo.start);
      currentDistance += Math.abs(arcInfo.arcLen);
      currentDistance += lineLength(arcInfo.end, p2);
      inPoint = p1;
    }
    return currentDistance;
  } else {
    return 0.0;
  }
};

const pointOnSmoothPolyline = (points, radius, distance) => {
  var currentDistance = 0.0;

  let inPoint = points[0];

  for (var i = 1; i < points.length - 1; i++) {
    let p1 = points[i];
    let p2 = points[i + 1];

    let arcInfo = arcTo(inPoint.x, inPoint.y, p1.x, p1.y, p2.x, p2.y, radius);

    // Move along incoming segment
    var segmentLength = lineLength(inPoint, arcInfo.start);
    let nextPointDistance = currentDistance + segmentLength;
    if (nextPointDistance > distance) {
      return pointOnLine(
        inPoint,
        inPoint,
        arcInfo.start,
        distance - currentDistance
      );
    }
    currentDistance = nextPointDistance;

    nextPointDistance = currentDistance + arcInfo.arcLen;

    if (nextPointDistance > distance) {
      return pointOnArc(
        arcInfo.center,
        arcInfo.radius,
        arcInfo.startAngle,
        arcInfo.endAngle,
        distance - currentDistance
      );
    }
    currentDistance = nextPointDistance;

    segmentLength = lineLength(arcInfo.end, p2);
    nextPointDistance = currentDistance + segmentLength;

    if (nextPointDistance > distance) {
      return pointOnLine(
        arcInfo.end,
        arcInfo.end,
        p2,
        distance - currentDistance
      );
    }
    currentDistance = nextPointDistance;
    inPoint = p1;
  }

  return points[0];
};

export {
  nearestPow2,
  pointOnLine,
  pointOnArc,
  lineLength,
  arcLength,
  smoothPolylineLength,
  pointOnSmoothPolyline,
  arcTo,
};
