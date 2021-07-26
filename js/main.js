var mapboxAtt = 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
    '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    mapboxUrl = 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGFuY2VsYXphcnRlIiwiYSI6ImNrcDIyZHN4bzAzZTEydm8yc24zeHNodTcifQ.ydwAELOsAYya_MiJNar3ow';

var Light = L.tileLayer(mapboxUrl, {id: 'mapbox/light-v9', tileSize: 512, zoomOffset: -1, attribution: mapboxAtt}),
    Dark = L.tileLayer(mapboxUrl, {id: 'mapbox/dark-v9', tileSize: 512, zoomOffset: -1, attribution: mapboxAtt}),    
    Streets = L.tileLayer(mapboxUrl, {id: 'mapbox/streets-v11', tileSize: 512, zoomOffset: -1, attribution: mapboxAtt});

var map = L.map('map', {
      zoomControl: false
  });
  
  map.setView([34.415, -112.022], 5);
  L.tileLayer(mapboxUrl, {id: 'mapbox/light-v9', tileSize: 512, zoomOffset: -1, attribution: mapboxAtt}).addTo(map);
  
  //Custom zoom bar control that includes a Zoom Home function
  L.Control.zoomHome = L.Control.extend({
      options: {
          position: 'topleft',
          zoomInText: '+',
          zoomInTitle: 'Zoom In',
          zoomOutText: '-',
          zoomOutTitle: 'Zoom Out',
          zoomHomeText: '<i class="fa fa-home" style="line-height:1.65;"></i>',
          zoomHomeTitle: 'Return Home'
      },
  
      onAdd: function (map) {
          var controlName = 'gin-control-zoom',
              container = L.DomUtil.create('div', controlName + ' leaflet-bar'),
              options = this.options;
  
          this._zoomInButton = this._createButton(options.zoomInText, options.zoomInTitle,
          controlName + '-in', container, this._zoomIn);
          this._zoomOutButton = this._createButton(options.zoomOutText, options.zoomOutTitle,
          controlName + '-out', container, this._zoomOut);
          this._zoomHomeButton = this._createButton(options.zoomHomeText, options.zoomHomeTitle,
          controlName + '-home', container, this._zoomHome);
  
          this._updateDisabled();
          map.on('zoomend zoomlevelschange', this._updateDisabled, this);
  
          return container;
      },
  
      onRemove: function (map) {
          map.off('zoomend zoomlevelschange', this._updateDisabled, this);
      },
  
      _zoomIn: function (e) {
          this._map.zoomIn(e.shiftKey ? 3 : 1);
      },
  
      _zoomOut: function (e) {
          this._map.zoomOut(e.shiftKey ? 3 : 1);
      },
  
      _zoomHome: function (e) {
          map.setView([34.415, -112.022], 5);
      },
  
      _createButton: function (html, title, className, container, fn) {
          var link = L.DomUtil.create('a', className, container);
          link.innerHTML = html;
          link.href = '#';
          link.title = title;
  
          L.DomEvent.on(link, 'mousedown dblclick', L.DomEvent.stopPropagation)
              .on(link, 'click', L.DomEvent.stop)
              .on(link, 'click', fn, this)
              .on(link, 'click', this._refocusOnMap, this);
  
          return link;
      },
  
      _updateDisabled: function () {
          var map = this._map,
              className = 'leaflet-disabled';
  
          L.DomUtil.removeClass(this._zoomInButton, className);
          L.DomUtil.removeClass(this._zoomOutButton, className);
  
          if (map._zoom === map.getMinZoom()) {
              L.DomUtil.addClass(this._zoomOutButton, className);
          }
          if (map._zoom === map.getMaxZoom()) {
              L.DomUtil.addClass(this._zoomInButton, className);
          }
      }
  });
  // Add the new control to the map
  var zoomHome = new L.Control.zoomHome();
  zoomHome.addTo(map);

var baseLayers = {
  "Light": Light,
  "Dark": Dark,
  "Streets": Streets};

L.control.layers(baseLayers).addTo(map);
  
//Call getData function
  getData(map);
    
//Import GeoJSON data
function getData(map) {
  //Load the data
  $.ajax('data/unemployed_sw_year.geojson', {
    dataType: 'json',
    success: function (response) {
      //Create an attributes array
      var attributes = processData(response);

      createPropSymbols(response, map, attributes);
      createSequenceControls(map, attributes);
      createLegend(map, attributes);

    },
  });
}


//Calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
  //Scale factor to adjust symbol size evenly
  var scaleFactor = 0.015;

  //Area based on attribute value and scale factor
  var area = attValue * scaleFactor;

  //Radius calculated based on area
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

  //Create circle marker layer
  var layer = L.circleMarker(latlng, options);

  var popup = new Popup(feature.properties, attribute, layer, options.radius);

  //Formatted attributeto content string
  popup.bindToLayer();

  //Event listeners to open popup on hover and fill panel on click
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
  return layer;
}

//Build an attributes array from the data
function processData(data) {
  //Empty array to hold attributes
  var attributes = [];

  //Properties of the first feature in the dataset
  var properties = data.features[0].properties;

  //Push each attribute name into attributes array
  for (var attribute in properties) {
    //Only take attributes with unemployment values
    if (attribute.indexOf("_") > -1) {
      attributes.push(attribute);
    }
  }

  return attributes;
}

//Add circle markers for point features to the map
function createPropSymbols(data, map, attributes) {
  //Create a Leaflet GeoJSON layer and add it to the map
  L.geoJson(data, {
    pointToLayer: function (feature, latlng) {
      return pointToLayer(feature, latlng, attributes);
    },
  }).addTo(map);
}

//Resize proportional symbols according to new attribute values
function updatePropSymbols(map, attribute) {
  map.eachLayer(function (layer) {
    if (layer.feature && layer.feature.properties[attribute]) {

      //Access feature properties
      var props = layer.feature.properties;

      //Update each feature's radius based on new attribute values
      var radius = calcPropRadius(props[attribute]);
      layer.setRadius(radius);

      var popup = new Popup(props, attribute, layer, radius);

      //Add popup to circle marker
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
          //Create the control container with a particular class name
          var container = L.DomUtil.create('div', 'legend-control-container');

          //Add temporal legend div to container
          $(container).append('<div id = "temporal-legend">');

          //Start attribute legend svg String
          var svg = '<svg id="attribute-legend" width="225px" height="200px">';

          //Array of cicle names to base loop on
          var circles = {
            max: 90,
            mean: 135,
            min: 180,
          };

          //Loop to add each cicle and text to svg string
          for (var circle in circles) {

            //Circle string
            svg += '<circle class="legend-circle" id="' + circle +
            '" fill="#ffcb00" fill-opacity="0.9" stroke="#687be6" cx="70"/>';
            //Text string
            svg += '<text id="' + circle + '-text" x="160" y="' + circles[circle] + '"></text>';
          }

          // Close svg string
          svg += '</svg>';
          //Add attribute legend svg String
          $(container).append(svg);
          return container;
        },
  });

  map.addControl(new LegendControl());
  updateLegend(map, attributes[0]);
}

//Calculate the max, mean, and min values for a given attribute
function getCircleValues(map, attribute) {
  var min = Infinity;
  var max = -Infinity;

  map.eachLayer(function (layer) {
      //Get the attribute value
      if (layer.feature) {
        var attributeValue = Number(layer.feature.properties[attribute]);

        //Test for min
        if (attributeValue < min) {
          min = attributeValue;
        }
        //Test for max
        if (attributeValue > max) {
          max = attributeValue;
        }
      }
    });

  //Set mean
  var mean = (max + min) / 2;

  //Return values as an object
  return {
      max: max,
      mean: mean,
      min: min,
    };
}

//Update the legend with the new attribute
function updateLegend(map, attribute) {

  //Create content for legend
  var year = attribute.split("_")[1];
  var content = '<h5>Unemployed during ' + year + '</h5>';

  //Replace legend content
  $('#temporal-legend').html(content);

  //Get the max, mean, and min values as an object
  var circleValues = getCircleValues(map, attribute);

  for (var key in circleValues) {
    //Get the radius
    var radius = calcPropRadius(circleValues[key]);

    //Assign the cy and r attributes
    $('#' + key).attr({
      cy: 190 - radius,
      r: radius,
    });

    //Add legend text
    $('#' + key + '-text').text(Math.round(circleValues[key] / 1000) * 1000);
  }
}

//Create new Leaflet control
function createSequenceControls(map, attributes) {
  var SequenceControl = L.Control.extend({
    options: {
      position: 'bottomleft',
    },

    onAdd: function (map) {
      //Create the control container div with a particular class name
      var container = L.DomUtil.create('div', 'sequence-control-container');

      //Create range input element (slider)
      $(container).append('<input class="range-slider" type="range">');

      //Kill any mouse event listeners on the map
      $(container).on('mousedown dblclick', function (e) {
        L.DomEvent.stopPropagation(e);
      });

      return container;
    },
  });

  map.addControl(new SequenceControl());

  //Set slider attributes
  $('.range-slider').attr({
    max: 5,
    min: 0,
    value: 0,
    step: 1,
  });

  //Click listener for buttons
  $('.skip').click(function () {
    //get the old index value
    var index = $('.range-slider').val();

    //Increment or decriment depending on button clicked
    if ($(this).attr('id') == 'forward') {
      index++;

      //If past the last attribute, wrap around to first attribute
      index = index > 5 ? 0 : index;
    } else if ($(this).attr('id') == 'reverse') {
      index--;

      //If past the first attribute, wrap around to last attribute
      index = index < 0 ? 5 : index;
    }

    //Update slider
    $('.range-slider').val(index);

    //Pass new attribute to update symbols
    updatePropSymbols(map, attributes[index]);
  });

  //Input listener for slider
  $('.range-slider').on('input', function () {
    //Step 6: get the new index value
    var index = $(this).val();

    //Pass new attribute to update symbols
    updatePropSymbols(map, attributes[index]);
  });
}

var southwest = {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {},
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [
              -124.2059326171875,
              41.9942015603157
            ],
            [
              -111.02783203125,
              42.032974332441405
            ],
            [
              -111.0498046875,
              40.96330795307353
            ],
            [
              -102.01904296874999,
              41.04621681452063
            ],
            [
              -102.01904296874999,
              37.020098201368114
            ],
            [
              -94.59228515625,
              36.98500309285596
            ],
            [
              -94.5703125,
              36.43896124085945
            ],
            [
              -94.3505859375,
              35.44277092585766
            ],
            [
              -94.482421875,
              33.65120829920497
            ],
            [
              -93.97705078125,
              33.55970664841198
            ],
            [
              -94.06494140625,
              31.98944183792288
            ],
            [
              -93.4716796875,
              31.034108344903512
            ],
            [
              -93.75732421875,
              30.50548389892728
            ],
            [
              -93.71337890625,
              30.183121842195515
            ],
            [
              -93.80126953124999,
              29.707139348134145
            ],
            [
              -94.68017578125,
              29.49698759653577
            ],
            [
              -95.11962890625,
              29.152161283318915
            ],
            [
              -95.4052734375,
              28.844673680771795
            ],
            [
              -96.43798828125,
              28.362401735238237
            ],
            [
              -97.119140625,
              27.664068965384516
            ],
            [
              -97.36083984375,
              27.293689224852407
            ],
            [
              -97.36083984375,
              26.686729520004036
            ],
            [
              -97.0751953125,
              25.97779895546436
            ],
            [
              -97.44873046875,
              25.878994400196202
            ],
            [
              -97.9541015625,
              26.03704188651584
            ],
            [
              -98.98681640625,
              26.352497858154024
            ],
            [
              -99.6240234375,
              27.371767300523047
            ],
            [
              -100.39306640625,
              28.459033019728043
            ],
            [
              -101.09619140625,
              29.477861195816843
            ],
            [
              -101.4697265625,
              29.80251790576445
            ],
            [
              -102.32666015625,
              29.878755346037977
            ],
            [
              -102.67822265625,
              29.707139348134145
            ],
            [
              -102.919921875,
              29.19053283229458
            ],
            [
              -103.11767578124999,
              28.97931203672246
            ],
            [
              -104.21630859375,
              29.420460341013133
            ],
            [
              -104.6337890625,
              29.7453016622136
            ],
            [
              -104.69970703125,
              29.99300228455108
            ],
            [
              -104.69970703125,
              30.240086360983426
            ],
            [
              -104.9853515625,
              30.56226095049944
            ],
            [
              -105.2490234375,
              30.80791068136646
            ],
            [
              -106.19384765625,
              31.522361470421437
            ],
            [
              -106.5234375,
              31.74685416292141
            ],
            [
              -108.19335937499999,
              31.765537409484374
            ],
            [
              -108.21533203125,
              31.3348710339506
            ],
            [
              -110.98388671874999,
              31.316101383495624
            ],
            [
              -114.85107421875,
              32.491230287947594
            ],
            [
              -114.76318359375,
              32.713355353177555
            ],
            [
              -117.22412109375,
              32.54681317351514
            ],
            [
              -117.2900390625,
              32.91648534731439
            ],
            [
              -117.66357421875,
              33.41310221370827
            ],
            [
              -118.10302734374999,
              33.669496972795535
            ],
            [
              -118.3447265625,
              33.687781758439364
            ],
            [
              -118.5205078125,
              33.5963189611327
            ],
            [
              -118.47656249999999,
              33.779147331286474
            ],
            [
              -118.45458984375,
              33.90689555128866
            ],
            [
              -118.58642578124999,
              33.99802726234877
            ],
            [
              -118.828125,
              34.03445260967645
            ],
            [
              -119.267578125,
              34.10725639663118
            ],
            [
              -119.35546875000001,
              34.21634468843463
            ],
            [
              -119.64111328125,
              34.34343606848294
            ],
            [
              -120.38818359375,
              34.379712580462204
            ],
            [
              -120.65185546875,
              34.56085936708384
            ],
            [
              -120.673828125,
              34.831841149828655
            ],
            [
              -120.76171875,
              35.08395557927643
            ],
            [
              -120.95947265624999,
              35.263561862152095
            ],
            [
              -121.06933593749999,
              35.44277092585766
            ],
            [
              -121.4208984375,
              35.817813158696616
            ],
            [
              -121.77246093750001,
              36.08462129606931
            ],
            [
              -122.03613281249999,
              36.43896124085945
            ],
            [
              -122.2119140625,
              36.89719446989036
            ],
            [
              -122.431640625,
              37.21283151445594
            ],
            [
              -122.51953124999999,
              37.54457732085582
            ],
            [
              -122.78320312499999,
              37.85750715625203
            ],
            [
              -123.0908203125,
              38.151837403006766
            ],
            [
              -123.26660156249999,
              38.42777351132902
            ],
            [
              -123.70605468750001,
              38.788345355085625
            ],
            [
              -123.8818359375,
              39.06184913429154
            ],
            [
              -123.90380859374999,
              39.38526381099774
            ],
            [
              -123.837890625,
              39.605688178320804
            ],
            [
              -123.99169921875,
              39.8928799002948
            ],
            [
              -124.18945312500001,
              40.07807142745009
            ],
            [
              -124.47509765625,
              40.27952566881291
            ],
            [
              -124.47509765625,
              40.53050177574321
            ],
            [
              -124.34326171874999,
              40.66397287638688
            ],
            [
              -124.21142578125,
              40.88029480552824
            ],
            [
              -124.1455078125,
              41.0130657870063
            ],
            [
              -124.1949462890625,
              41.104190944576466
            ],
            [
              -124.15649414062499,
              41.18692242290296
            ],
            [
              -124.134521484375,
              41.30257109430557
            ],
            [
              -124.1015625,
              41.44272637767212
            ],
            [
              -124.1180419921875,
              41.59490508367679
            ],
            [
              -124.18945312500001,
              41.68932225997044
            ],
            [
              -124.26086425781249,
              41.75492216766298
            ],
            [
              -124.26086425781249,
              41.84910468610387
            ],
            [
              -124.21279907226562,
              41.94263801258577
            ],
            [
              -124.21623229980467,
              41.95846888718632
            ],
            [
              -124.20902252197264,
              41.978634788827435
            ],
            [
              -124.21211242675781,
              41.98986366231382
            ],
            [
              -124.21005249023438,
              41.99394639802862
            ],
            [
              -124.20284271240234,
              41.994456721579816
            ]
          ]
        }
      }
    ]
  }

L.geoJSON(southwest).addTo(map);