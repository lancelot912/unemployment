var mapboxAtt = 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
    '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    mapboxUrl = 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGFuY2VsYXphcnRlIiwiYSI6ImNrcDIyZHN4bzAzZTEydm8yc24zeHNodTcifQ.ydwAELOsAYya_MiJNar3ow';

var Light = L.tileLayer(mapboxUrl, {id: 'mapbox/light-v9', tileSize: 512, zoomOffset: -1, attribution: mapboxAtt}),
    Dark = L.tileLayer(mapboxUrl, {id: 'mapbox/dark-v9', tileSize: 512, zoomOffset: -1, attribution: mapboxAtt}),    
    Streets = L.tileLayer(mapboxUrl, {id: 'mapbox/streets-v11', tileSize: 512, zoomOffset: -1, attribution: mapboxAtt});
                    
var map = L.map('map', {
  center: [34.415, -109.022], 
  zoom: 5,
  layers: [Light]});    

var baseLayers = {
  "Light": Light,
  "Dark": Dark,
  "Streets": Streets};

L.control.layers(baseLayers).addTo(map);

//call getData function
  getData(map);
    
//Import GeoJSON data
function getData(map) {
  //load the data
  $.ajax('https://raw.githubusercontent.com/lancelot912/unemployment/main/data/unemployed_sw_year.geojson', {
    dataType: 'json',
    success: function (response) {
      //create an attributes array
      var attributes = processData(response);

      createPropSymbols(response, map, attributes);
      createSequenceControls(map, attributes);
      createLegend(map, attributes);

    },
  });
}


//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
  //scale factor to adjust symbol size evenly
  var scaleFactor = 0.015;

  //area based on attribute value and scale factor
  var area = attValue * scaleFactor;

  //radius calculated based on area
  var radius = Math.sqrt(area / Math.PI);

  return radius;
}

function Popup(properties, attribute, layer, radius) {
  this.properties = properties;
  this.attribute = attribute;
  this.layer = layer;
  this.year = attribute.split(' ')[1];
  this.unemployment = this.properties[attribute];
  this.content = '<p><h4>' + this.properties.name + '</h4></p><p><b>Unemployed: ' + this.unemployment;

  this.bindToLayer = function () {
    this.layer.bindPopup(this.content, {
      offset: new L.Point(0, -radius),
    });
  };
}

function pointToLayer(feature, latlng, attributes) {
  //Assign the current attribute based on the first index of the attributes array
  var attribute = attributes[0];

  //create marker options
  var options = {
    fillColor: '#ffcb00',
    color: '#687be6',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.5,
  };

  //For each feature, determine its value for the selected attribute
  var attValue = Number(feature.properties[attribute]);

  //Give each feature's circle marker a radius based on its attribute value
  options.radius = calcPropRadius(attValue);

  //create circle marker layer
  var layer = L.circleMarker(latlng, options);

  var popup = new Popup(feature.properties, attribute, layer, options.radius);

  //formatted attributeto content string
  popup.bindToLayer();

  //event listeners to open popup on hover and fill panel on click
  layer.on({
    mouseover: function () {
        this.openPopup();
        this.setStyle({ color: '#00ff37' });
      },

    mouseout: function () {
        this.closePopup();
        this.setStyle({ color: '#687be6' });
      },
  });

  //return the circle marker to the L.geoJson pointToLayer option
  return layer;
}

//build an attributes array from the data
function processData(data) {
  //empty array to hold attributes
  var attributes = [];

  //properties of the first feature in the dataset
  var properties = data.features[0].properties;

  //push each attribute name into attributes array
  for (var attribute in properties) {
    //only take attributes with unemployment values
    if (attribute.indexOf("_") > -1) {
      attributes.push(attribute);
    }
  }

  return attributes;
}

//Add circle markers for point features to the map
function createPropSymbols(data, map, attributes) {
  //create a Leaflet GeoJSON layer and add it to the map
  L.geoJson(data, {
    pointToLayer: function (feature, latlng) {
      return pointToLayer(feature, latlng, attributes);
    },
  }).addTo(map);
}

//Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbols(map, attribute) {
  map.eachLayer(function (layer) {
    if (layer.feature && layer.feature.properties[attribute]) {

      //access feature properties
      var props = layer.feature.properties;

      //update each feature's radius based on new attribute values
      var radius = calcPropRadius(props[attribute]);
      layer.setRadius(radius);

      var popup = new Popup(props, attribute, layer, radius);

      //add popup to circle marker
      popup.bindToLayer();
    }
  });

  updateLegend(map, attribute);
}

function createLegend(map, attributes) {
  var LegendControl = L.Control.extend({
    options: {
      position: 'bottomleft',
    },

    onAdd: function (map) {
          // create the control container with a particular class name
          var container = L.DomUtil.create('div', 'legend-control-container');

          //add temporal legend div to container
          $(container).append('<div id = "temporal-legend">');

          //step 1: start attribute legend svg String
          var svg = '<svg id="attribute-legend" width="225px" height="200px">';

          // array of cicle names to base loop on
          var circles = {
            max: 90,
            mean: 135,
            min: 180,
          };

          // step 2: loop to add each cicle and text to svg string
          for (var circle in circles) {

            // circle string
            svg += '<circle class="legend-circle" id="' + circle +
            '" fill="#ffcb00" fill-opacity="0.9" stroke="#687be6" cx="70"/>';
            //text string
            svg += '<text id="' + circle + '-text" x="160" y="' + circles[circle] + '"></text>';
          }

          // close svg string
          svg += '</svg>';
          //add attribute legend svg String
          $(container).append(svg);
          return container;
        },
  });

  map.addControl(new LegendControl());
  updateLegend(map, attributes[0]);
}

//Calculate the max, mean, and min values for a given attribute
function getCircleValues(map, attribute) {
  //start with min at highest possible and max at lowest possible number
  var min = Infinity;
  var max = -Infinity;

  map.eachLayer(function (layer) {
      //get the attribute value
      if (layer.feature) {
        var attributeValue = Number(layer.feature.properties[attribute]);

        //test for min
        if (attributeValue < min) {
          min = attributeValue;
        }
        //test for max
        if (attributeValue > max) {
          max = attributeValue;
        }
      }
    });

  //set mean
  var mean = (max + min) / 2;

  //return values as an object
  return {
      max: max,
      mean: mean,
      min: min,
    };
}

//Update the legend with the new attribute
function updateLegend(map, attribute) {

  //create content for legend
  var year = attribute.split("_")[1];
  var content = '<h5>Unemployed during ' + year + '</h5>';

  //replace legend content
  $('#temporal-legend').html(content);

  //get the max, mean, and min values as an object
  var circleValues = getCircleValues(map, attribute);

  for (var key in circleValues) {
    //get the radius
    var radius = calcPropRadius(circleValues[key]);

    //Step 3: assign the cy and r attributes
    $('#' + key).attr({
      cy: 190 - radius,
      r: radius,
    });

    // Step 4: add legend text
    $('#' + key + '-text').text(Math.round(circleValues[key] / 1000) * 1000);
  }
}

//Step 1: Create new Leaflet control
function createSequenceControls(map, attributes) {
  var SequenceControl = L.Control.extend({
    options: {
      position: 'bottomleft',
    },

    onAdd: function (map) {
      //create the control container div with a particular class name
      var container = L.DomUtil.create('div', 'sequence-control-container');

      //create range input element (slider)
      $(container).append('<input class="range-slider" type="range">');

      //kill any mouse event listeners on the map
      $(container).on('mousedown dblclick', function (e) {
        L.DomEvent.stopPropagation(e);
      });

      return container;
    },
  });

  map.addControl(new SequenceControl());

  //set slider attributes
  $('.range-slider').attr({
    max: 5,
    min: 0,
    value: 0,
    step: 1,
  });

  //Step 5: click listener for buttons
  $('.skip').click(function () {
    //get the old index value
    var index = $('.range-slider').val();

    //Step 6: increment or decriment depending on button clicked
    if ($(this).attr('id') == 'forward') {
      index++;

      //Step 7: if past the last attribute, wrap around to first attribute
      index = index > 5 ? 0 : index;
    } else if ($(this).attr('id') == 'reverse') {
      index--;

      //Step 7: if past the first attribute, wrap around to last attribute
      index = index < 0 ? 5 : index;
    }

    //Step 8: update slider
    $('.range-slider').val(index);

    //Step 9: pass new attribute to update symbols
    updatePropSymbols(map, attributes[index]);
  });

  //Step 5: input listener for slider
  $('.range-slider').on('input', function () {
    //Step 6: get the new index value
    var index = $(this).val();

    //Step 9: pass new attribute to update symbols
    updatePropSymbols(map, attributes[index]);
  });
}