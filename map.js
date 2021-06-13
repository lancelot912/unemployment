$(document).ready(function() {
    // Create map
    var cities;
    var map = L.map('map').setView([37.626, -90.75], 4);
        
    var pointStyleLarge = L.icon({
        iconUrl: 'img/icon.png',
        iconSize: [18, 18],
        iconAnchor: [9, 9]
        });

    var pointStyleSmall = L.icon({
        iconUrl: 'img/icon.png',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    })

    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGFuY2VsYXphcnRlIiwiYSI6ImNrZnhlaWR6NDBsZ2YycW5vOWw2YnR0MmIifQ.52ESP9PoQJ-Io8COuqSTSQ', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox/light-v9',
    tileSize: 512,
    zoomOffset: -1
    }).addTo(map);

L.geoJSON(povertyData, {
    pointToLayer: function (feature, latlng) {
        return L.marker(latlng, {icon: pointStyleSmall});
    },
    onEachFeature: onEachFeature
}).addTo(map);
        
    function onEachFeature(feature, layer) {
        var popupContent = "";
        if (feature.properties) {
            for (var property in feature.properties){
                popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>"
            }
        }
layer.bindPopup(popupContent);
};


    // Setup custom controls
    map.addControl(new MiniDetailPane());
   
    $.getJSON("data/povertyData.json")
            .done(function(data) {
                var info = processData(data);
                createPropSymbols(info.timestamps, data);
            })
        .fail(function() {alert("There has been a problem loading the data.")});

        function processData(data) {
            		var timestamps = [];
            		var min = Infinity; 
            		var max = -Infinity;
            
            		for (var feature in data.features) {
            
            			var properties = data.features[feature].properties; 
            
            			for (var attribute in properties) { 
            
                            if ( attribute != 'id' &&
                              attribute != 'name' &&
                              attribute != 'lat' &&
                              attribute != 'lon' ) {
            				 
            						
            					if ( $.inArray(attribute,timestamps) === -1) {
            						timestamps.push(attribute);		
            					}
            
            					if (properties[attribute] < min) {	
            						min = properties[attribute];
            					}
            						
            					if (properties[attribute] > max) { 
            						max = properties[attribute]; 
            					}
            				}
            			}
            		}
            
            		return {
            			timestamps : timestamps,
            			min : min,
            			max : max
            		}
                }    
                
                function createPropSymbols(timestamps, data) {
                    			
                    		cities = L.geoJson(povertyData, {		
                    
                    			pointToLayer: function(feature, latlng) {	
                    
                    			return L.circleMarker(latlng, { 
                                    fillColor: "#708598",
                                    color: "#537898",
                                    weight: 1,
                    				fillOpacity: 0.6 
                    				}).on({
                    
                    					mouseover: function(e) {
                                            this.openPopup();
                                            this.setStyle({color: 'yellow'});
                    						},
                    					mouseout: function(e) {
                                            this.closePopup();
                                            this.setStyle({color: '#537898'});
                    						
                    					}
                    				});
                    			}
                    		}).addTo(map);
                    	}

    // Load data
    $.ajax("data/unemployed.geojson", {
        dataType: 'json',
        success: function (r) {
            let attributes = process_data(r);

            // Set up markers and add them to map
            add_data_to_map(r, map, attributes);

            // Set lblCurrentDate
            $('.lblCurrentDate').html(format_date(attributes[0]));

            // Populate details dropdown
            setup_details_dropdown(map);

            // Create legend
            map.addControl(new LegendControl());

            /////////////////////////
            // Map Event Listeners //
            /////////////////////////

            $('#btnTest').on('click', function () {
                console.log('test');
                console.log(map.getBounds());
            });

           