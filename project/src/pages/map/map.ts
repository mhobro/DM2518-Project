import {Component, ViewChild, ElementRef} from '@angular/core';
import {NavController, AlertController} from 'ionic-angular';
import {AngularFireDatabase} from 'angularfire2/database';
import {Geolocation} from '@ionic-native/geolocation';

import * as map_style from './map_style'; // File containing all the style for the map
import Utils from './utils'; // File containing all the utils functions
import * as MarkerClusterer from 'node-js-marker-clusterer';

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

  addPIControl; // Button to add a PI
  rightMenuControl; // Button to open the right menu


  // Define the list of type of PIs
  readonly filters: Array<{ name: string, type: string, state: boolean }> = [
    {name: 'Food', type: 'food', state: true},
    {name: 'Drink', type: 'drink', state: true},
    {name: 'Shopping', type: 'shopping', state: true},
    {name: 'Sightseeing', type: 'sightseeing', state: true},
    {name: 'Entertainment', type: 'entertainment', state: true},
    {name: 'Health', type: 'health', state: true},
    {name: 'Services', type: 'services', state: true}
  ];

  infoWindow: google.maps.InfoWindow = new google.maps.InfoWindow();
  user_location; // The Observable object watching the user location
  markerCluster; // The object containing all the marker on the map grouped by cluster

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
      styles: map_style.mapstyle,
      mapTypeControl: false
    };

    this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

    // Try to display the user current location
    this.initGeolocation();

    // Display all the towers and the PIs
    this.displayTowers();

    // Add a marker clusterer to manage the markers.
    this.markerCluster = new MarkerClusterer(this.map, [],
      {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});

    // Overlays menus
    this.initMenus();
  }

  /*************************************************
   ************* FILTERS ***************************
   *************************************************/

  /**
   * Called when a filter is toggled in the view
   *
   * @param filterIndex
   */
  public notifyFilterChange(filterIndex) {
    //console.log("TOGGLED " + this.filters[filterIndex].state);
    // Check if each marker must be displayed or not
    this.pis.forEach((pi, key, map) => {
      this.markerCluster.removeMarker(pi.marker, false);
      if (pi.mustBeDisplayed()) {
        this.markerCluster.addMarker(pi.marker, false);
      }
    });
  }

  /*************************************************
   ************* MARKER (PI & Tower) ***************
   *************************************************/
  public createMarker(lat, lng, displayed = true, userIcon = false, type = 'default') {
    var marker = new google.maps.Marker({
      position: {lat: lat, lng: lng},
      map: (displayed ? this.map : null),
      icon: map_style.getIcon(type, userIcon),
      animation: google.maps.Animation.DROP
    });
    return marker;
  }

  private hideMarker(marker) {
    marker.setMap(null);
  }

  private displayInfoWindowOnMarker(marker, content) {
    this.infoWindow.close();
    this.infoWindow.setContent(content);
    this.infoWindow.open(this.map, marker);
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
      let name = data.name;
      let description = data.description;
      let type = data.type;
      let lat = data.lat;
      let lng = data.lng;
      let unlocked = false;
      let marker = this.createMarker(lat, lng, false); // Do not display the marker initially

      let newPI = new Pi(key, name, description,
        new google.maps.LatLng(lat, lng), marker, unlocked, type, owner, this.infoWindow, this.map, this.aut.getUser.uid, this.filters)

      // if a PI added by the authenticated user
      if (owner == this.aut.getUser.uid) {
        marker.setIcon(map_style.getIcon(type, true));
        unlocked = true;

        // PI added by another user
      } else {
        marker.setIcon(map_style.getIcon(type));

        // Check if the PI is near an unlocked tower
        this.towers.forEach((tower, keyTower, map) => {
          if (tower.isNear(lat, lng)) {
            tower.piInRange.push(key);

            // If tower already activated => display the PI
            if (tower.activated) {
              unlocked = true;
              newPI.towerNear.push(tower.key);
            }
          }
        });
      }

      console.log(type);
      if (newPI.mustBeDisplayed()) {
        // Add the marker to the cluster = display the marker on the map
        this.markerCluster.addMarker(marker, false);
      }

      // Add the PI in the map of PIs
      this.pis.set(key, newPI);
    });


    // Handler triggered every time a PI is removed from the db
    piRef.on('child_removed', (oldChildSnapshot) => {
      let key = oldChildSnapshot.key;
      // Remove the PI from the map and the map of PIs
      if (this.pis.has(key)) {
        let pi = this.pis.get(key);
        this.hideMarker(pi.marker);
        this.markerCluster.removeMarker(pi.marker);
        this.pis.delete(key);
      }

      let userRef = this.db.database.ref('users/' + oldChildSnapshot.val().owner);
      userRef.child('pis/' + key).remove();
    });
  }


  /*************************************************
   ******************* TOWERS **********************
   *************************************************/
  private displayTowers() {
    var towersRef = this.db.database.ref('towers/');
    var userRef = this.db.database.ref('users/' + this.aut.getUser.uid + '/towers');

    towersRef.once('value').then((snapshot) => {
      // Iterate through all the marker's key belonging to this user
      snapshot.forEach((towerSnapshot) => {
        // Fetch the tower information
        let key = towerSnapshot.key;
        let name = towerSnapshot.child('name').val();
        let lat = towerSnapshot.child('lat').val();
        let lng = towerSnapshot.child('lng').val();

        let marker = this.createMarker(lat, lng, false); // Don't display the tower until fetching the state for the authenticated user
        var tower = new Tower(key, name, new google.maps.LatLng(lat, lng), marker,
          undefined, this.infoWindow, this.map, this.pis, this.db, this.aut.getUser.uid, this.user_location, this.markerCluster);

        // Add the tower to the map of markers
        this.towers.set(key, tower);

        // Fetch the state of the tower for this user
        // (called when the tower state change for the authenticated user)
        userRef.child(key).on('value', (userSnapshot) => {
          let activated: boolean = userSnapshot.val();
          let tower = this.towers.get(key);
          tower.activated = activated;

          // Change the icon according to the state (lock/unlocked)
          if (activated) {
            tower.unlockTower();
          } else {
            // Hide all the PIs near the tower
            tower.lockTower();
          }
        });

        // Display the tower on the map
        tower.marker.setMap(this.map);
      });

      // Display all the unlocked pi
      // We fetch the PI here because we need to have all the towers first (firebase => asynchronous)
      this.initPI();
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
    this.addPIControl = Utils.createIconButton("add", () => {
      this.menuRight.nativeElement.style.width = "0%";
      this.menuLeft.nativeElement.style.width = "75%";
    });
    this.map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(this.addPIControl);


    // Create a button to open the rigth menu
    this.rightMenuControl = Utils.createIconButton("menu", () => {
      this.menuLeft.nativeElement.style.width = "0%";
      this.menuRight.nativeElement.style.width = "75%";
    });
    this.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(this.rightMenuControl);

    // Add click handler on the map to close the menu
    this.map.addListener('click', () => {
      this.closeLeftMenu();
      this.closeRightMenu();
    });
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
        icon: map_style.getIcon('user_location')
      });

      userLocationMarker.addListener('click', () => {
        this.displayInfoWindowOnMarker(userLocationMarker, "Your location");
      });

      // Get an observable for the user position
      this.user_location = this.geolocation.watchPosition();

      // Udpate the marker each time a new location is received
      this.user_location.subscribe((data) => {
        let lat = data.coords.latitude;
        let lng = data.coords.longitude;

        // Update the marker position
        userLocationMarker.setPosition(new google.maps.LatLng(lat, lng));
      }, error => {
        console.log(error);

        this.alertCtrl.create({
          title: 'Geolocation error',
          subTitle: 'An error occured while fetching your current location:\n' + error.message,
          buttons: ['OK']
        }).present();
      });
    }
  }
}
