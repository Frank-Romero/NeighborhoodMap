var locations = [{
    title: 'Santa Cruz Beach Boardwalk',
    location: {
        lat: 36.964167,
        lng: -122.017778
    }
}, {
    title: 'Santa Cruz Wharf',
    location: {
        lat: 36.961491,
        lng: -122.021868
    }
}, {
    title: 'Wilder Ranch State Park',
    location: {
        lat: 36.983333,
        lng: -122.1
    }
}, {
    title: 'Natural Bridges State Beach',
    location: {
        lat: 36.9525,
        lng: -122.0575
    }
}, {
    title: 'Pleasure Point',
    location: {
        lat: 36.959722,
        lng: -121.97
    }
}, ];
var map;
var clicked = false;
var bounds;
var infowindow;
var mZoom;
// marker icon from Google example
// https://developers.google.com/maps/documentation/javascript/examples/marker-symbol-custom
var goldStar = {
    path: 'M 125,5 155,90 245,90 175,145 200,230 125,180 50,230 75,145 5,90 95,90 z',
    fillColor: 'yellow',
    fillOpacity: 0.8,
    scale: 0.12,
    strokeColor: 'gold',
    strokeWeight: 2
};
var redStar = {
    path: 'M 125,5 155,90 245,90 175,145 200,230 125,180 50,230 75,145 5,90 95,90 z',
    fillColor: 'red',
    fillOpacity: 0.8,
    scale: 0.12,
    strokeColor: 'red',
    strokeWeight: 2
};
var yelpAccessToken;
// bypass cors restriction for yelp fusion
// much thanks for the Udacity forums
// https://discussions.udacity.com/t/jsonp-uncaught-syntaxerror-unexpected-token/211607/6?u=luis_a0ij
var corsBy = 'https://cors-anywhere.herokuapp.com/';
// yelp info, probably shouldn't leave this here if actually in production
var yelpData = {
    grant_type: 'client_credentials',
    client_id: 't6GcTUvCyfdYegVV9yU5Qw',
    client_secret: '8sGTBKtW2FJG8ERYhTKGQbFRK4d52T8xjvu4gphWn6er2E4xPrYlRyIwalOSGlq3'
};

function initMap() {
    // makes sure that map zoom is adjusted to be responsive
    if (window.innerWidth <= 241) {
        mZoom = 10;
    } else if (window.innerWidth < 825 && window.innerWidth > 422) {
        mZoom = 12;
    } else if (window.innerWidth < 422 && window.innerWidth > 241) {
        mZoom = 11;
    }
    else {
        mZoom = 13;
    }
    // styles from https://snazzymaps.com/style/98/purple-rain
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 36.974117, lng: -122.030796},
        zoom: mZoom,
        styles: [{
            featureType: 'road',
            stylers: [{
                hue: '#5e00ff'
            },
            {
                saturation: -79
            }]
        }, {
            featureType: 'poi',
            stylers: [{
                'saturation': -78
            }, {
                hue: '#6600ff'
            }, {
                lightness: -47
            }, {
                visibility: 'off'
            }]
        }, {
                featureType: 'road.local',
                stylers: [{
                    lightness: 22
                }]
        }, {
            featureType: 'landscape',
            stylers: [{
                hue: '#6600ff'
            },
            {
                saturation: -11
            }]
        }, {
            featureType: 'water',
            stylers: [{
                saturation: -65
            },
            {
                hue: '#1900ff'
            },
            {
                lightness: 8
            }]
        }, {
            featureType: 'road.local',
            stylers: [{
                weight: 1.3
            },
            {
                lightness: 30
            }]
        }, {
            featureType: 'transit',
            stylers: [{
                visibility: 'simplified'
            }, {
                hue: '#5e00ff'
            }, {
                saturation: -16
            }]
        }, {
            featureType: 'transit.line',
            stylers: [{
                saturation: -72
            }]
        }]
    });
    bounds = new google.maps.LatLngBounds();
    ko.applyBindings(new ViewModel());
}
// function that uses auth to request info from yelp, to be accessed on marker's click event
// uses access token, along with lat + lng
//https://www.yelp.com/developers/documentation/v3/business_search
function request(marker, infowindow) {
    $.ajax({ //search is used in place of match because it requires less info, just limit to 1 result
        url: corsBy + 'https://api.yelp.com/v3/businesses/search',
        beforeSend: function(xhttp){
            xhttp.setRequestHeader('Authorization', 'Bearer '+yelpAccessToken);
        },
        data: {
            term : marker.title,
            latitude : marker.getPosition().lat(),
            longitude : marker.getPosition().lng(),
            limit : 1
        }
    }).done(function(results){ //organizes results from marker and yelp request into an infowindow
        var mTitle = marker.title;
        var mURL = results.businesses[0].url;
        var mImg = results.businesses[0].image_url;
        var htmlInfo = '<h2>' + mTitle + '</h2><div><a href="' + mURL +
                    '"><img src=' + mImg +
                    ' alt="Go to Yelp page" width="5em" height="5em" border="0"></a>' +
                    '<p>Click on the image to visit Yelp *Info is from Yelp*</p></div>';
        infowindow.setContent(htmlInfo);
        infowindow.open(map, marker);
    }).fail(function(){
        window.alert("Error occured during Yelp Fusion Authorization, please try again in a few minutes.");
    });
}
// getting yelp access token
$.ajax({
    url: corsBy + "https://api.yelp.com/oauth2/token",
    method: "POST",
    data: yelpData,
}).done(function(results){
    yelpAccessToken = results.access_token;
}).fail(function(error){
    window.alert("Error occured during Yelp Fusion Authorization, please try again in a few minutes.");
});

var ViewModel = function() {
    var self = this;
    var infowindow = new google.maps.InfoWindow();
    self.loc = ko.observableArray(locations);
    self.query = ko.observable('');
    // set up markers
    self.loc().forEach(function(entry) {
        var marker = new google.maps.Marker({
            position: entry.location,
            animation: google.maps.Animation.DROP,
            map: map,
            title: entry.title,
            icon: goldStar
        });
        entry.marker = marker;
        bounds.extend(marker.position);
        // adds click functionality to markers, along with animations and info from Yelp Fusion
        marker.addListener('click', function(event) {
            // multiple clicks in under a second are prevented
            if (!clicked) {
                clicked = true;
                if (infowindow) { infowindow.close(); }
                marker.setAnimation(google.maps.Animation.BOUNCE);
                marker.setIcon(redStar);
                request(marker, infowindow);
                setTimeout(function(){ clicked = false; marker.setAnimation(null); marker.setIcon(goldStar); }, 700);
                map.setCenter(marker.getPosition());
				map.setZoom(14);
            } else {
                console.log("You're clicking too much!");
            }
        });
        // allows clicking on sidenav menu links to trigger marker click
        self.selectMarker = function(entry) {
            google.maps.event.trigger(entry.marker, 'click');
        };
    });
	// search filter 
    self.search = ko.computed(function() {
        var filter = self.query().toLowerCase();
		return ko.utils.arrayFilter(self.loc(), function(location) {
            var locationMatch = location.title.toLowerCase().indexOf(filter) >= 0;
            location.marker.setVisible(locationMatch);
            return locationMatch;
        });
    });
    // ensures that sidenav menu is hidden if width <= 1010px, and shown if above
    if ($(window).innerWidth() <= 1010) {
        self.active = ko.observable(false);
    } else {
        self.active = ko.observable(true);
    }
    $(window).on('resize', function () {
        if ($(window).innerWidth() <= 1010) {
            self.active(false);
        } else {
            self.active(true);
        }
    });
    /* https://stackoverflow.com/questions/14867906/knockoutjs-value-toggling-in-data-bind */
    self.toggle = function(){
        self.active(!self.active());
    };
};

// Error message for Google initMap
function googleMapsError() {
    window.alert("Can't connect to maps, please try again in a few minutes.");
}