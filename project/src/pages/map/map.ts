import {Component, ViewChild, ElementRef} from '@angular/core';
import {NavController, AlertController} from 'ionic-angular';
import {AngularFireDatabase} from 'angularfire2/database';
import {Geolocation} from '@ionic-native/geolocation';

import {Tower} from './tower';
import {Pi} from './pi';

import {AuthService} from '../../providers/authentication.service';

declare var google;

@Component({
  selector: 'page-map',
  templateUrl: 'map.html',
})
export class MapPage {
  header_data: any;

  @ViewChild('map') mapElement: ElementRef; // Ref to the container of the map in the HTML
  @ViewChild('menuLeft') menuLeft: ElementRef; // Ref to the container of the left menu in the HTML
  @ViewChild('menuRight') menuRight: ElementRef; // Ref to the container of the right in the HTML

  map: any; // Ref to the Google Map object
  towers: Map<string, any> = new Map(); // Map associating the tower's name to the tower's object
  pis: Map<string, any> = new Map(); // Map associating the pi's key to the pi's object

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

    // Display all the towers
    this.displayTowers();

    // Display all the markers of this user
    //this.displayMarkerFromUser(this.aut.getUser.uid);

    // Display all the unlocked pi
    this.initPI();

    // Try to display the user current location
    this.initGeolocation();

    // Create a button to add a marker
    var addMarkerControl = new Control_Map("Add marker", this.addMarkerController);
    this.map.controls[google.maps.ControlPosition.TOP_CENTER].push(addMarkerControl.controlDiv); //TODO: Change the position of the button

    // Overlays menus
    this.initMenus();
  }

  /*************************************************
   ************* MARKER (PI & Tower) ***************
   *************************************************/
  private createMarker(lat, lng, displayed = true, type = 'default') {
    let marker = new google.maps.Marker({
      position: {lat: lat, lng: lng},
      map: (displayed ? this.map : null),
      icon: icons[type].icon,
      animation: google.maps.Animation.DROP
    });
    return marker;
  }

  private hideMarker(marker) {
    marker.setMap(null);
  }

  /*************************************************
   *********************** PI **********************
   *************************************************/
  private initPI(): void {
    let piRef = this.db.database.ref('pis/');

    // Fetch all the PIs in the db
    // (called each time a new PI is added in the db)
    piRef.on('child_added', (piSnapshot, prevChildKey) => {
      let key = piSnapshot.key;
      let data = piSnapshot.val();
      let owner = data.owner;
      let description = ""; // TODO : change when added in the db
      let type = null; // / TODO : change when added in the db
      let lat = data.lat;
      let lng = data.lng;
      let unlocked = false;
      let marker = null;

      // if a PI added by the authenticated user
      if (owner == this.aut.getUser.uid) {
        marker = this.createMarker(data.lat, data.lng, true, 'user_pi');
        unlocked = true;

        // PI added by another user
      } else {
        marker = this.createMarker(lat, lng, false); // Do not display the marker initially

        // Check if the PI is near an unlocked tower
        this.towers.forEach((tower, keyTower, map) => {
          if (tower.isNear(lat, lng)) {
            tower.piInRange.push(key);

            // If tower already activated => display the PI
            if (tower.activated) {
              unlocked = true;
              marker.setMap(this.map);
            }
            //console.log("PI " + key + " near tower " + keyTower + "[" + (tower.activated ? "activated" : "not activated") + "]");
          }
        });
      }

      // Add the PI in the map of PIs
      var newPI = new Pi(name, description, new google.maps.LatLng(lat, lng), marker, unlocked, type, owner);
      this.pis.set(key, newPI);
    });


    // Handler triggered every time a PI is removed from the db
    piRef.on('child_removed', (oldChildSnapshot) => {
      let key = oldChildSnapshot.key;
      // Remove the PI from the map and the map of PIs
      if (this.pis.has(key)) {
        this.hideMarker(this.pis.get(key).marker);
        this.pis.delete(key);
      }
    });
  }

  /*
   Fetch and display the markers created by the user corresponding to uid
   */
  private displayMarkerFromUser(uid: any) {
    var userRef = this.db.database.ref('users/' + this.aut.getUser.uid);
    userRef.child('pis').once("value").then((snapshot) => {
      // Iterate through all the marker's key belonging to this user
      snapshot.forEach((childSnapshot) => {
        var key = childSnapshot.key;
        // Fetch the location of this marker
        var markerRef = this.db.database.ref('pis/' + key);
        markerRef.once("value").then((snapshot) => {
          var data = snapshot.val();
          if (data.owner === uid) {
            this.createMarker(data.lat, data.lng, true, 'user_pi');
          }
        });
      });
    });
  }

  /*
   Handler called after a click on the Add marker button
   */
  private addMarkerController = (control: Control_Map) => {
    var position = this.map.getCenter();
    var marker = this.createMarker(position.lat(), position.lng(), true, 'user_pi');
    marker.setAnimation(google.maps.Animation.BOUNCE);
    marker.setDraggable(true);

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

  /*
   Handler called after a click on the Validate marker button
   */
  private validateMarker = (marker, control) => {
    marker.draggable = false;
    marker.setAnimation(null);
    marker.setMap(null); // remove this marker bcs it will be display once successfully added in the db

    // Add the new PI in the db
    var markersRef = this.db.database.ref('pis');
    var newMarkerRef = markersRef.push();
    var lat = marker.position.lat();
    var lng = marker.position.lng();
    var owner = this.aut.getUser.uid;
    let name = ""; // TODO : get from html
    let description = ""; // TODO : get from html
    let type = ""; // TODO : get from html

    newMarkerRef.set(
      {
        'lat': lat,
        'lng': lng,
        'owner': owner,
        'description': description,
        'type': type, // TODO : get from html,
        'name': name // TODO : get from html
      }
    ).then(() => {
      // Append the marker in the user's markers
      let key = newMarkerRef.key;
      let userRef = this.db.database.ref('users/' + owner);
      userRef.child('pis').child(key).set(true);

    }).catch(function () {
      // Display the error
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


  /*************************************************
   ******************* TOWERS **********************
   *************************************************/
  private displayTowers() {
    var towersRef = this.db.database.ref('towers/');
    var userRef = this.db.database.ref('users/' + this.aut.getUser.uid + '/towers');

    // Fetch all the tower in the db
    // (called each time a new tower is added in the db)
    towersRef.on('child_added', (towerSnapshot, prevChildKey) => {
      // Fetch the tower information
      let key = towerSnapshot.key;
      let name = towerSnapshot.child('name').val();
      let lat = towerSnapshot.child('lat').val();
      let lng = towerSnapshot.child('lng').val();

      let marker = this.createMarker(lat, lng, false); // Don't display the tower until fetching the state for the authenticated user
      var tower = new Tower(name, new google.maps.LatLng(lat, lng), marker);

      // Add the tower to the map of markers
      this.towers.set(key, tower);

      // Fetch the state of the tower for this user
      // (called when the tower state change for the authenticated user)
      userRef.child(key).on('value', (userSnapshot, prevChildKey) => {
        let activated: boolean = userSnapshot.val();
        let tower = this.towers.get(key);
        tower.activated = activated;

        // Change the icon according to the state (lock/unlocked)
        if (activated) {
          tower.marker.setIcon(icons['tower_unlocked'].icon);
          // Display all the PIs near the tower
          tower.displayAllNearestPis(this.map, this.pis);

        } else {
          // Hide all the PIs near the tower
          tower.marker.setIcon(icons['tower_locked'].icon);
          tower.hideAllNearestPis(this.pis);
        }

        // Display the tower on the map
        tower.marker.setMap(this.map);
      });
    });

    // Handler triggered every time a tower is removed from the db
    towersRef.on('child_removed', (oldChildSnapshot) => {
      let key = oldChildSnapshot.key;
      // Remove the Tower from the map and the map of Towers
      if (this.towers.has(key)) {
        this.hideMarker(this.towers.get(key).marker);
        this.towers.delete(key);
      }
    });
  }


  /*************************************************
   ******************* MENUS ***********************
   *************************************************/

  private initMenus(): void {
    // Create a button to open the left menu
    var addLeftMenuControl = new Control_Map("Menu", () => {
      this.menuRight.nativeElement.style.width = "0%";
      this.menuLeft.nativeElement.style.width = "50%";
    });
    this.map.controls[google.maps.ControlPosition.LEFT_CENTER].push(addLeftMenuControl.controlDiv);

    // Create a button to open the rigth menu
    var addRigthMenuControl = new Control_Map("Menu", () => {
      this.menuLeft.nativeElement.style.width = "0%";
      this.menuRight.nativeElement.style.width = "50%";
    });
    this.map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(addRigthMenuControl.controlDiv);
  }


  public closeLeftMenu(): void {
    this.menuLeft.nativeElement.style.width = "0%";
  }

  public closeRightMenu(): void {
    this.menuRight.nativeElement.style.width = "0%";
  }


  /*************************************************
   **************** GEOLOCATION ********************
   *************************************************/

  private initGeolocation(): void {
    if (navigator.geolocation) {
      var userLocationMarker = new google.maps.Marker({
        map: this.map,
        icon: icons['user_location'].icon
      });

      userLocationMarker.addListener('click', () => {
        new google.maps.InfoWindow({
          content: "Your location.",
        }).open(this.map, userLocationMarker);
      });


      var geolocation_options = {
        enableHighAccuracy: true
      };

      navigator.geolocation.getCurrentPosition(position => {
        let pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        userLocationMarker.setPosition(pos);
      }, error => {
        console.log(error);

        this.alertCtrl.create({
          title: 'Geolocation error',
          subTitle: 'An error occured while fetching your current location:\n' + error.message,
          buttons: ['OK']
        }).present();

      }, geolocation_options);
    }
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
  var controlUI = document.createElement('button');
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

var iconBase = 'assets/marker/';
var icons = {
  tower_locked: {
    icon: {
      url: iconBase + 'tower_red.svg',
      scaledSize: new google.maps.Size(64, 64)
    }
  },
  tower_unlocked: {
    icon: {
      url: iconBase + 'tower_green.svg',
      scaledSize: new google.maps.Size(64, 64)
    }
  },
  user_pi: {
    icon: {
      url: iconBase + 'user_pi.svg'
    }
  },
  user_location: {
    icon: {
      url: iconBase + 'point_orange.svg',
      scaledSize: new google.maps.Size(64, 64)
    }
  },
  default: {
    icon: null
  }
};
