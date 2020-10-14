function createPropSymbols(data, map){
	//create marker options
	//Step 4: Determine which attribute to visualize with proportional symbols
	var attribute = "2010";
    var geojsonMarkerOptions = {
        radius: 8,
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
	};
	
};


function pointToLayer(feature, latlng, attributes){
    //Determine which attribute to visualize with proportional symbols
    var attribute = attributes[0];
    //check
	console.log(attribute);
	
    //create marker options
    var options = {
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
	var layer = L.circleMarker(latlng, options);
	
	var layer = L.marker(latlng, {
        title: feature.properties.name
    }).addTo(map);

    //original popupContent changed to panelContent...Example 2.2 line 1
    var panelContent = "<p><b>City:</b> " + feature.properties.name + "</p>";

    //add formatted attribute to panel content string
    var year = attribute.split("_")[1];
    panelContent += "<p><b>Population in " + year + ":</b> " + feature.properties[attribute] + " million</p>";

     //add city to popup content string
	 var popupContent = "<p><b>City:</b> " + props.City + "</p>";

	 //add formatted attribute to panel content string
	 var year = attribute.split("_")[1];
	 popupContent += "<p><b>Population in " + year + ":</b> " + props[attribute] + " million</p>";
	
    //replace the layer popup
	layer.bindPopup(popupContent, {
		offset: new L.Point(0,-radius)
	});
};
    });

	L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
            //Step 5: For each feature, determine its value for the selected attribute
            var attValue = Number(feature.properties[attribute]);

            //Step 6: Give each feature's circle marker a radius based on its attribute value
            geojsonMarkerOptions.radius = calcPropRadius(attValue);

            //create circle markers
            return L.circleMarker(latlng, geojsonMarkerOptions);
        }
    }).addTo(map);
};

function createSequenceControls(map){
    //create range input element (slider)
    $('#panel').append('<input class="range-slider" type="range">');
};

$('.skip').click(function(){
	//get the old index value
	var index = $('.range-slider').val();

	//Step 6: increment or decrement depending on button clicked
	if ($(this).attr('id') == 'forward'){
		index++;
		//Step 7: if past the last attribute, wrap around to first attribute
		index = index > 6 ? 0 : index;
	} else if ($(this).attr('id') == 'reverse'){
		index--;
		//Step 7: if past the first attribute, wrap around to last attribute
		index = index < 0 ? 6 : index;
	};

	//Step 8: update slider
	$('.range-slider').val(index);
});

	//Step 5: input listener for slider
	$('.range-slider').on('input', function(){
        //Step 6: get the new index value
        var index = $(this).val();
    });

//Step 2: Import GeoJSON data
function getData(map){
    //load the data
    $.ajax("data/unemployment.geojson", {
        dataType: "json",
        success: function(response){
            //call function to create proportional symbols
            createPropSymbols(response, map);
        }
    });
};  

//Called in both skip button and slider event listener handlers
        //Step 9: pass new attribute to update symbols
		function updatePropSymbols(map, attribute){
			map.eachLayer(function(layer){
				if (layer.feature && layer.feature.properties[attribute]){
					//update the layer style and popup
	
	//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //scale factor to adjust symbol size evenly
    var scaleFactor = 50;
    //area based on attribute value and scale factor
    var area = attValue * scaleFactor;
    //radius calculated based on area
    var radius = Math.sqrt(area/Math.PI);

    return radius;
};

    //event listeners to open popup on hover
    layer.on({
        mouseover: function(){
            this.openPopup();
        },
        mouseout: function(){
            this.closePopup();
        },
        click: function(){
            $("#panel").html(popupContent);
        }
    });

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

