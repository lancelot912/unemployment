var map = L.map('map').setView([37.626, -90.75], 4);
        
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGFuY2VsYXphcnRlIiwiYSI6ImNrcDIyZHN4bzAzZTEydm8yc24zeHNodTcifQ.ydwAELOsAYya_MiJNar3ow', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox/light-v9',
    tileSize: 512,
    zoomOffset: -1
    }).addTo(map);
        
    $.ajax("data/capitals.geojson", {
        dataType: "json",
        success: function(response){
            var attributes = processData(response);
           
            createPropSymbols(response, map, attributes);
            createSequenceControls(map, attributes);
            createLegend(map, attributes); 
        }
    });
//$(document).ready(createMap);



//Build an attributes array from the data
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf("PercLossBy") > -1){
            attributes.push(attribute);
        };
    };

    //check result
    console.log(attributes);

    return attributes;
};



//Calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //scale factor to adjust symbol size evenly
    var scaleFactor = 400;
    //area based on attribute value and scale factor
    var area = attValue * scaleFactor;
    //radius calculated based on area
    var radius = Math.sqrt(area/Math.PI);

    return radius;
};



//Create new sequence controls
function createSequenceControls(map, attributes){
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function (map) {
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');

            // ... initialize other DOM elements, add listeners, etc.
            //create range input element (slider)
            $(container).append('<input class="range-slider" type="range">');
            L.DomEvent.disableClickPropagation(container);
            //add skip buttons
            $(container).append('<button class="skip" id="reverse" title="Reverse">Reverse</button>');
            
            $(container).append('<button class="skip" id="forward" title="Forward">Skip</button>');
            
            
            //kill any mouse event listeners on the map
            $(container).on('mousedown dblclick', function(e){
                L.DomEvent.stopPropagation(e);
                
            });

            return container;
        }
    });

    map.addControl(new SequenceControl());

    //create range input element (slider)
//    $('#panel').append('<input class="range-slider" type="range">');
    //set slider attributes
    $('.range-slider').attr({
        max: 6,
        min: 0,
        value: 0,
        step: 1
    });
//        $('#panel').append('<button class="skip" id="reverse">Reverse</button>');
//        $('#panel').append('<button class="skip" id="forward">Skip</button>');
        $('#reverse').html('<img src="assets/images/Reverse_Button.svg">');
        $('#forward').html('<img src="assets/images/Forward_Button.svg">');
    
    //Click listener for buttons
    $('.skip').click(function(){
        //sequence - get the old index value
        var index = $('.range-slider').val();

        //increment or decrement depending on button clicked
        if ($(this).attr('id') == 'forward'){
            index++;
            //if past the last attribute, wrap around to first attribute
            index = index > 6 ? 0 : index;
        } else if ($(this).attr('id') == 'reverse'){
            index--;
            //if past the first attribute, wrap around to last attribute
            index =index < 0 ? 6 : index;
        };
            //update slider
            $('.range-slider').val(index);
        
        updatePropSymbols(map, attributes[index]);
    });

        
    //Input listener for slider
    $('.range-slider').on('input', function(){
        //sequence - get the new index value
        var index = $(this).val();
        
        updatePropSymbols(map, attributes[index]);
    });

};



//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    //Determine which attribute to visualize with proportional symbols
    var attribute = attributes[0];
console.log(attribute);
    //create marker options
    var options = {
        fillColor: "#ad0000",
        color: "#000",
        weight: .5,
        opacity: 1,
        fillOpacity: 0.7,
        
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    createPopup(feature.properties, attribute, layer, options.radius);
    //return the circle marker to the L.geoJson pointToLayer option
    
    return layer;
};



//Add circle markers for point features to the map
function createPropSymbols(data, map, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    var geoJsonLayer = L.geoJson(data, {
        //Start adding additional functions
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        },

//        filter: function(feature, layer) {
//            return feature.properties.PercLossBy_2011 > -10;},
        })
    
    var markers = L.markerClusterGroup({
        maxClusterRadius: 44,
        disableClusteringAtZoom: 4
        });
        //add geojson to marker cluster layer
        markers.addLayer(geoJsonLayer);
        //add marker cluster layer to map
        map.addLayer(markers);
    
//      .addTo(map);
};



//Resize proportional symbols to new attribute values
function updatePropSymbols(map, attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //update the layer style and popup
            if (layer.feature && layer.feature.properties[attribute]){
            //access feature properties
            var props = layer.feature.properties;
            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);
                
            createPopup(props, attribute, layer, radius);
            updateLegend(map, attribute);      
            };
        };
    });
};



//Consolidated popup-creation function 
function createPopup(properties, attribute, layer, radius){
    //add city to popup content string
    var popupContent = "<h7>City: <b>" + properties.CityName + "</b></h7>";

    //add formatted attribute to panel content string
    var year = attribute.split("_")[1];
    popupContent += "<br><h7>Population Loss From</h7><h7><br>2010 - " + year + ":<b> " + properties[attribute] + "%</b></h7>";
    

    //build popup content string
    var panelContent = "<p><b>City:</b> " + properties.CityName + "</p>";
    
    panelContent += "<p>This city lost <b>" + properties[attribute] + "%</b> of its population between <b>2010 and " + year + ".</b></p>";
    
    //replace the layer popup
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-radius)
    });
                    //event listeners to open popup on hover
        layer.on({
            mouseover: function(){
                this.openPopup();
            },
            mouseout: function(){
                this.closePopup();
            },
            click: function(){
            $("#panel").html(panelContent);
                
            }
    });
};



function createLegend(map, attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');
            L.DomEvent.disableClickPropagation(container);
            
            //add temporal legend div to container
            $(container).append('<div id="temporal-legend">')

            //Step 1: start attribute legend svg string
            var svg = '<svg id="attribute-legend" width="100%" height="75px">';

            
            
////Array of circle names to base loop on
//      var circles = ["max", "mean", "min"];
////Step 2: loop to add each circle and text to svg string
//      for (var i=0; i<circles.length; i++){          
////circle string to use with greyed out array above
//      svg += '<circle class="legend-circle" id="' + circles[i] + '"fill="#AD0000" opacity="0.4" fill-opacity="0.6" stroke="#000000" stroke-width=".5" cx="50"/>';
////text string
//      svg += '<text id="' + circles[i] + '-text" x="65" y="60"></text>';
//            
            
            
            
        //object to base loop on...replaces array above and requires changing the for loop below
        var circles = {
            max: 20,
            mean: 40,
            min: 60
            };  
        //loop to add each circle and text to svg string
        for (var circle in circles){
        //circle string - updated
            svg += '<circle class="legend-circle" id="' + circle + '" fill="#ad0000" opacity="0.6" fill-opacity="1" stroke="#000000" stroke-width="1" cx="65"/>';
            //text string
            svg += '<text class="text1" id="' + circle + '-text" x="103" y="' + circles[circle] + '"></text>';

        };
        //close svg string
        svg += "</svg>";



            //add attribute legend svg to container
            $(container).append(svg);


            return container;
        }
    });

    map.addControl(new LegendControl());
    updateLegend(map, attributes[0]);
};




//Calculate the max, mean, and min values for a given attribute
function getCircleValues(map, attribute){
    //start with min at highest possible and max at lowest possible number
    var min = Infinity,
        max = -Infinity;

    map.eachLayer(function(layer){
        //get the attribute value
        if (layer.feature){
            var attributeValue = Number(layer.feature.properties[attribute]);
            
            if (attributeValue < 0){
                min = null;
            }
            else
            
            
            //test for min
            if (attributeValue < min){
                min = attributeValue;
            };

            //test for max
            if (attributeValue > max){
                max = attributeValue;
            
            };
        };
    });

    //set mean
    var mean = (max + min) / 2;

    //return values as an object
    return {
        max: max,
        mean: mean,
        min: min
    };
};


//Update the legend with new attribute
function updateLegend(map, attribute){
    //create content for legend
    var year = attribute.split("_")[1];
    var content = "<h7>Range of percentage population decline for cities in your current map extent.<br><br>Time interval:</h7><br>" + "<h7><b>2010-" + year + "</b></h7>";
        console.log(attribute);
    //replace legend content
    $('#temporal-legend').html(content);
    //get the max, mean, and min values as an object
    var circleValues = getCircleValues(map, attribute);
    for (var key in circleValues){
        //get the radius
        var radius = calcPropRadius(circleValues[key]);

        //Step 3: assign the cy and r attributes
        $('#'+key).attr({
            cy: 70 - radius,
            r: radius
        });
        //Step 4: add legend text
        $('#'+key+'-text').text(Math.round(circleValues[key]*100)/100 + " %");

    };

};


//class="leaflet-bottom leaflet-right"
//sequence-control-container

//legend-control-container leaflet-control

//'div', 'legend-control-container'