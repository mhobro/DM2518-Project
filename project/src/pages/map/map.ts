import {Component, ViewChild, ElementRef} from '@angular/core';
import {NavController, AlertController} from 'ionic-angular';
import {AngularFireDatabase} from 'angularfire2/database';
import {Geolocation} from '@ionic-native/geolocation';

import {AuthService} from '../../providers/authentication.service'

declare var google;

@Component({
  selector: 'page-map',
  templateUrl: 'map.html',
})
export class MapPage {
  header_data: any;

  @ViewChild('map') mapElement: ElementRef; // Ref to the container of the map in the HTML
  map: any; // Ref to the Google Map object

  constructor(public navCtrl: NavController,
              public db: AngularFireDatabase,
              public geolocation: Geolocation,
              public alertCtrl: AlertController,
              public aut: AuthService) {
    this.header_data = {titlePage: "Map", isMenu: true};
  }

  // Called when the view is fully loaded
  ionViewDidLoad() {
    this.loadMap();
  }

  /*
    Map initialization
   */
  loadMap(): void {

    let StockholmLocation = new google.maps.LatLng(59.342176, 18.069250);

    // Create the map
    let mapOptions = {
      center: StockholmLocation,
      zoom: 11,
      minZoom: 11,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: map_style,
      mapTypeControl: false
    }
    this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);


    // Display all the markers of this user
    this.displayMarkerFromUser(this.aut.getUser.uid);

    // Try to display the user current location
    if (navigator.geolocation) {
      var userLocationMarker = new google.maps.Marker({
        map: this.map,
        icon: {
          url: "../../assets/location_icon.svg",
          scaledSize: new google.maps.Size(32, 32)
        }
      });

      userLocationMarker.addListener('click', () => {
        new google.maps.InfoWindow({
          content: "Your location.",
        }).open(this.map, userLocationMarker);
      });

      var options = {
        enableHighAccuracy: true
      };

      navigator.geolocation.getCurrentPosition(position => {
        let pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        userLocationMarker.setPosition(pos);
      }, error => {
        console.log(error);
      }, options);
    }

    // Create a button to add a marker
    var addMarkerControl = new Control_Map("Add marker", this.addMarkerController);
    this.map.controls[google.maps.ControlPosition.TOP_CENTER].push(addMarkerControl.controlDiv); //TODO: Change the position of the button
  }

  /*
   Fetch and display the markers created by the user corresponding to uid
   */
  private displayMarkerFromUser(uid: any) {
    var userRef = this.db.database.ref('users/' + this.aut.getUser.uid);
    userRef.child('markers').once("value").then((snapshot) => {
      // Iterate through all the marker's key belonging to this user
      snapshot.forEach((childSnapshot) => {
        var key = childSnapshot.key;
        // Fetch the location of this marker
        var markerRef = this.db.database.ref('markers/' + key);
        markerRef.once("value").then((snapshot) => {
          var data = snapshot.val();
          if (data.owner === uid) {
            this.createMarker(data.lat, data.lng);
          }
        });
      });
    });
  }


  /*************************************************
   ****************** ADD MARKER ********************
   *************************************************/
  private createMarker(lat, lng) {
    let marker = new google.maps.Marker({
      position: {lat: lat, lng: lng},
      map: this.map
    });

    return marker;
  }

  /*
  Handler called after a click on the Add marker button
   */
  private addMarkerController = (control: Control_Map) => {
    var position = this.map.getCenter();
    var marker = new google.maps.Marker({
      position: position,
      draggable: true,
      map: this.map,
      animation: google.maps.Animation.BOUNCE
    });
    this.map.setCenter(marker.getPosition());

    // Add a cancel button
    control.controlDiv.style.clear = 'both';
    control.controlUI.style.cssFloat = 'left';

    var cancelControl = createMapControlButton('Cancel');
    var cancelControlUI = cancelControl.controlUI;
    cancelControlUI.style.cssFloat = 'left';
    cancelControlUI.style.marginLeft = '12px';
    control.controlDiv.appendChild(cancelControlUI);

    // Set the action of the cancel button
    cancelControlUI.addEventListener('click', () => {
      marker.setMap(null);

      // Remove the cancel button once clicked
      cancelControlUI.parentNode.removeChild(cancelControlUI);

      // Reset the action of the add marker button
      control.change_action(() => {
        this.addMarkerController(control)
      }, "Add marker");
    });

    // Set the action and text of the validate button
    control.change_action(() => {
      this.validateMarker(marker, control);
      cancelControlUI.parentNode.removeChild(cancelControlUI);
    }, "Validate marker");
  }

  // Handler called after a click on the Validate marker button
  private validateMarker = (marker, control) => {
    marker.draggable = false;
    marker.setAnimation(null);

    // Add the marker in the db
    var markersRef = this.db.database.ref('markers');
    var newMarkerRef = markersRef.push();

    newMarkerRef.set(
      {
        'lat': marker.position.lat(),
        'lng': marker.position.lng(),
        'owner': this.aut.getUser.uid
      }
    ).then(() => {
      // Append the marker in the user's markers
      var userRef = this.db.database.ref('users/' + this.aut.getUser.uid);
      userRef.child('markers').child(newMarkerRef.key).set(true);
    }).catch(function () {
      // Remove the marker if not added in the db
      marker.setMap(null);
      this.alertCtrl.create({
        title: 'Marker not added',
        subTitle: 'An error occured while adding the marker in the database.',
        buttons: ['OK']
      }).present();
    });

    // Reset the action and the text of the add button
    control.change_action(() => {
      this.addMarkerController(control)
    }, "Add marker");
  }
}
/*************************************************
 ****************** MAP CONTROL ******************
 *************************************************/

/*
 Correspond to a custom control (= button) on the map
 */
export class Control_Map {
  public controlDiv: any;
  public controlUI: any;
  public controlText: any;
  public action: any;

  constructor(text: any, action: any) {
    this.controlDiv = document.createElement('div');
    var newControl = createMapControlButton(text);
    this.controlUI = newControl.controlUI;
    this.controlText = newControl.controlText;
    this.controlDiv.appendChild(newControl.controlUI);

    // Setup the click event listeners.
    this.controlUI.addEventListener('click', () => {
      action(this);
    });
  }

  public change_action(newAction, newText) {
    this.controlUI.removeEventListener('click', this.action);
    this.controlText.innerHTML = newText;
    this.controlUI.addEventListener('click', newAction);
  }
}

/*
 Create a button to display on the map
 */
function createMapControlButton(buttonText) {
  // Set CSS for the control border.
  var controlUI = document.createElement('div');
  controlUI.style.backgroundColor = '#fff';
  controlUI.style.border = '2px solid #fff';
  controlUI.style.borderRadius = '3px';
  controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
  controlUI.style.cursor = 'pointer';
  controlUI.style.marginBottom = '22px';
  controlUI.style.textAlign = 'center';

  // Set CSS for the control interior.
  var controlText = document.createElement('div');
  controlText.style.color = 'rgb(25,25,25)';
  controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
  controlText.style.fontSize = '16px';
  controlText.style.lineHeight = '38px';
  controlText.style.paddingLeft = '5px';
  controlText.style.paddingRight = '5px';
  controlText.innerHTML = buttonText;
  controlUI.appendChild(controlText);

  return {controlUI, controlText};
}


/*************************************************
 ****************** MAP STYLE ********************
 *************************************************/
var map_style = [
  {elementType: 'geometry', stylers: [{color: '#242f3e'}]},
  {elementType: 'labels.text.stroke', stylers: [{color: '#242f3e'}]},
  {elementType: 'labels.text.fill', stylers: [{color: '#746855'}]},
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{color: '#d59563'}]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{color: '#d59563'}]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{color: '#263c3f'}]
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{color: '#6b9a76'}]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{color: '#38414e'}]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{color: '#212a37'}]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{color: '#9ca5b3'}]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{color: '#746855'}]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{color: '#1f2835'}]
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{color: '#f3d19c'}]
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{color: '#2f3948'}]
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{color: '#d59563'}]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{color: '#17263c'}]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{color: '#515c6d'}]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{color: '#17263c'}]
  }
];
