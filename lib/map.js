function init() {
    // Create map
    var poverty;
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


    // Setup custom controls
    map.addControl(new MiniDetailPane());
   
    $.getJSON("data/unemployed.json")
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
            
            				if ( attribute != 'State' &&
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
                    				 fillColor: '#708598',
                    				 color: '#537898',
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

            // Slider Change
            $('#slider').on('input', function () {
                // Hide slider hint
                $('#lblSliderHint').addClass('lblCurrentDate');

                let sliderVal = $(this).val();
                update_markers(map, attributes[sliderVal]);

                // Update date
                $('.lblCurrentDate').html(format_date(attributes[sliderVal]));

                // Update details
                update_details_box(map, attributes);
            });

            // Slider Skip Buttons Click
            $('.skip').on('click', function () {
                // Hide slider hint
                $('#lblSliderHint').addClass('lblCurrentDate');

                let sliderVal = $('#slider').val();

                if ($(this).attr('id') == 'btnPrev') {
                    // btnPrev clicked
                    if (sliderVal != 0) {
                        sliderVal--;
                    }
                } else {
                    // btnNext clicked
                    if (sliderVal < attributes.length - 1) {
                        sliderVal++;
                    }
                }

                $('#slider').val(sliderVal);
                update_markers(map, attributes[sliderVal]);

                // Update date
                $('.lblCurrentDate').html(format_date(attributes[sliderVal]));

                // Update details
                update_details_box(map, attributes);
            });


            // Details selector dropdown
            $('#sel1').on('change', function () {
                update_details_box(map, attributes);
            })


            // Legend Collapse Button
            $('#collapse').on('click', function () {
                let legendState = $(this).attr('data-status');
                if (legendState == "open") {
                    // Collapse the legend
                    $(this).attr('data-status', 'closed');
                    $(this).attr('src', 'img/LegendOpen.png');
                    $('#legend-body').addClass('legend-hide');
                } else {
                    $(this).attr('data-status', 'open');
                    $(this).attr('src', 'img/LegendClose.png');
                    $('#legend-body').removeClass('legend-hide');
                }
            });
        }
    });



}


function add_data_to_map(r, map, attributes, piechart) {
    // Add point layer
    L.geoJSON(r, {
        pointToLayer: function (f, latlng) {
            return create_marker(f, latlng, attributes, map)
        }
    }).addTo(map);

    // Set initial radius
    update_markers(map, attributes[0]);
}

function update_markers(map, attribute) {
    // On each marker, set the radius based on the
    // input attribute value.  Attribute = the field
    // name for the new radius value.

    map.eachLayer(function (layer) {
        if (layer.feature) {
            // Find new radius for feature
            let props = layer.feature.properties;
            let curAttribute = props[attribute];
            let rad = calculate_radius(props[attribute]);

            if (rad == 0) {
                layer.setStyle({
                    fillOpacity: 0
                });
            } else {
                layer.setStyle({
                    fillOpacity: calculate_opacity(curAttribute)
                });
            }

            // Update radius
            layer.setRadius(rad);

            }
        })

function calculate_radius(value) {
    let scaleFactor = 3;
    let area = value * scaleFactor;
    let radius = Math.sqrt(area / Math.PI);
    return radius
}

function calculate_radius_log(value) {
    // Built-in JS base 2:
    //let radius = Math.log2(value);
    
    // 
    let radius = Math.log(value) / Math.log(1.25);
    return radius
}

function calculate_opacity(value) {
    let opacity = (-0.05 * value + 75) / 100;
    if (opacity < 0.25) {
        opacity = 0.25;
    }
    return opacity
}


function setup_details_dropdown(map) {
    let regionList = [];

    // Get each region's name and add to list
    map.eachLayer(function (layer) {
        if (layer.feature) {
            regionList.push(layer.feature.properties.name);
        }
    })

    // Sort list
    regionList.sort();

    // Add list items to details dropdown
    regionList.forEach(function (regionName) {
        $('#sel1').append("<option>" + regionName + "</option>");
    })
}


function update_details_box(map, attributes, piechart) {
    // Get current region
    let region = $('#sel1').val();

    // Get current date
    let index = $('#slider').val()
    let curDate = attributes[index];

    // Get current region case count for current date
    // Get word total for current date
    let currentRegionCount = 0;
    let worldCount = 0;

    map.eachLayer(function (layer) {
        if (layer.feature) {
            let curLayerName = layer.feature.properties.name;
            let curLayerCount = layer.feature.properties[curDate];

            if (curLayerName == region) {
                currentRegionCount = curLayerCount;
                layer.setStyle({
                    stroke: true,
                    color: 'rgb(0,0,0)',
                    weight: 3
                });
            } else {
                layer.setStyle({
                    stroke: false
                });
            }

            worldCount += curLayerCount;
        }
    });

    // Calculate percentage
    let percentage = currentRegionCount / worldCount * 100;

    // Update region detail labels
    $('.lblRegionName').html(region);
    $('.lblCases').html(currentRegionCount.toLocaleString('en'));
    $('.lblPercent').html(percentage.toPrecision(2) + '%');
    $('.lblWorldTotal').html(worldCount.toLocaleString('en'));
    $('.lblDetailsDate').html(format_date(curDate));

    // Update Legend
    //let circleValues = get_circle_values(map, curDate);
    let circleValues = {
        max: 500,
        mean: 150,
        min: 10
    };
    for (let key in circleValues) {

        //let radius = calculate_radius(circleValues[key]);
        let radius = calculate_radius(circleValues[key]);
        $('#' + key).attr({
            cx: 25,
            cy: 50 - radius,
            r: radius
        });
        $('#' + key + '-text').text(circleValues[key] + ' Cases').attr('y', 50 - (radius));;
    };

}


function get_circle_values(map, attribute) {
    let min = Infinity,
        max = -Infinity;

    map.eachLayer(function (layer) {
        if (layer.feature) {
            let attributeValue = Number(layer.feature.properties[attribute]);
            if (attributeValue < min) {
                min = attributeValue;
            };

            if (attributeValue > max) {
                max = attributeValue;
            };
        };
    });



    let mean = (max + min) / 3;

    return {
        max: max,
        mean: mean,
        min: 25
    };
}


function format_date(date) {
    let input = date.split('-');
    let month = input[0] == 'Jan' ? 'January' : 'February';
    let day = input[1];
    return month + ' ' + day
}

/////////////
// Markers //
/////////////

// Marker Styles
var mainStyle = {
    fillColor: 'red',
    weight: 0.5,
    stroke: false
};

var styleWorld = {
    fillColor: 'orange',
    stroke: false,
};

var noFill = {
    fillOpacity: 0
}

// Marker Functions
function process_data(r) {
    // Creates a list of field names containing
    // data by date

    let attributes = [];
    let properties = r.features[0].properties;

    for (let attribute in properties) {
        if (attribute.indexOf("Jan") > -1 || attribute.indexOf("Feb") > -1) {
            attributes.push(attribute)
        }
    };

    return attributes
}



function create_marker(f, latlng, attributes, map, piechart) {
    // Set marker style
    let style = mainStyle;

    // Create marker
    let marker = L.circleMarker(latlng, style);

    // Set the initial marker radius to the value of Jan-20
    marker.setRadius(calculate_radius(f.properties['Jan-20']));

    marker.on({
        click: function () {
            // Set value of details dropdown, which will
            // trigger the details box to update with this
            // marker's details
            
            // Prevent Hubei from updating detail box if it is hidden
            if (hideHubei && this.feature.properties.name == "Hubei") {
                return
            };
            
            $('#sel1').val(f.properties.name);
            update_details_box(map, attributes, piechart);
        }
    });

    return marker
};




// Run initizlization function when the dom is ready
$(document).ready(init())};