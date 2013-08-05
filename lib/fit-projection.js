/*
  Nick Rabinowitz
  https://gist.github.com/1756257
 */
function fitProjection(projection, data, box, center) {
    // get the bounding box for the data - might be more efficient approaches
    var left = Infinity,
        bottom = -Infinity,
        right = -Infinity,
        top = Infinity;
    // reset projection
    projection
        .scale(1)
        .translate([0, 0]);
    data.features.forEach(function(feature) {
        d3.geo.bounds(feature).forEach(function(coords) {
            coords = projection(coords);
            var x = coords[0],
                y = coords[1];
            if (x < left) left = x;
            if (x > right) right = x;
            if (y > bottom) bottom = y;
            if (y < top) top = y;
        });
    });
    // project the bounding box, find aspect ratio
    function width(bb) {
        return (bb[1][0] - bb[0][0])
    }
    function height(bb) {
        return (bb[1][1] - bb[0][1]);
    }
    function aspect(bb) {
        return width(bb) / height(bb);
    }
    var startbox = [[left, top],  [right, bottom]],
        a1 = aspect(startbox),
        a2 = aspect(box),
        widthDetermined = a1 > a2,
        scale = widthDetermined ?
            // scale determined by width
            width(box) / width(startbox) :
            // scale determined by height
            height(box) / height(startbox),
        // set x translation
        transX = box[0][0] - startbox[0][0] * scale,
        // set y translation
        transY = box[0][1] - startbox[0][1] * scale;
        //console.log(startbox);
    // center if requested
    if (center) {
        if (widthDetermined) {
            transY = transY - (transY + startbox[1][1] * scale - box[1][1])/2;
        } else {
            transX = transX - (transX + startbox[1][0] * scale - box[1][0])/2;
        }
    }
    return projection.scale(scale).translate([transX, transY]);
}

// http://rtmatheson.com/2011/02/enhanced-array-in-javascript-with-previous-and-next/
function EnhancedArray(a)
{
  var counter = 0;
  var internalArray = a;

  this.next = function(){
      counter++;

      if(counter < (internalArray.length -1))
      {
          counter = 0;
      }
      return internalArray[counter];
  }

  this.previous = function(){
      counter--;
      if(counter > 0)
      {
          counter = (internalArray.length - 1);
      }
      return internalArray[counter];
  }

  this.current = function(){
      return internalArray[counter];
  }
}

// http://stackoverflow.com/questions/12068510/calculate-centroid-d3
function area(pts) {
    var area=0;
    var nPts = pts.length;
    var j=nPts-1;
    var p1; var p2;

    for (var i=0;i<nPts;j=i++) {
        p1=pts[i]; p2=pts[j];
        area+=p1.x*p2.y;
        area-=p1.y*p2.x;
    }
    area/=2;
    return area;
}

// http://stackoverflow.com/questions/12068510/calculate-centroid-d3
function computeCentroid(pts) {
    var nPts = pts.length;
    var x=0; var y=0;
    var f;
    var j=nPts-1;
    var p1; var p2;

    for (var i=0;i<nPts;j=i++) {
        p1=pts[i]; p2=pts[j];
        f=p1.x*p2.y-p2.x*p1.y;
        x+=(p1.x+p2.x)*f;
        y+=(p1.y+p2.y)*f;
    }

    f=area(pts)*6;
    return [x/f,y/f];
}