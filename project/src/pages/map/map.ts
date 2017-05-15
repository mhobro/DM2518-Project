import {Component, ViewChild, ElementRef} from '@angular/core';
import {NavController, AlertController} from 'ionic-angular';
import {AngularFireDatabase} from 'angularfire2/database';
import {Geolocation} from '@ionic-native/geolocation';

import * as map_style from './map_style'; // File containing all the style for the map
import Utils from './utils'; // File containing all the utils functions
import * as MarkerClusterer from 'node-js-marker-clusterer';

import {Tower} from './tower';
import {Pi} from './pi';
import {Control_Map} from './map_control';

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

  following = new Array();
  usersFiltered : string[];
  usersInitial : string[];
  users = new Array<{id: string, name: string, email: string, following: boolean}>();
  followString: string = '';
  map: any; // Ref to the Google Map object
  towers: Map<string, any> = new Map(); // Map associating the tower's name to the tower's object
  pis: Map<string, any> = new Map(); // Map associating the pi's key to the pi's object

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
    this.getUsers();
    console.log(this.users);
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
    }
    this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

    // Try to display the user current location
    this.initGeolocation();

    // Display all the towers and the PIs
    this.displayTowers();

    // Add a marker clusterer to manage the markers.
    this.markerCluster = new MarkerClusterer(this.map, [],
      {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});

    // Create a button to add a marker
    var addMarkerControl = new Control_Map("Add marker", this.addMarkerController);
    this.map.controls[google.maps.ControlPosition.TOP_CENTER].push(addMarkerControl.controlDiv); //TODO: Change the position of the button

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
      if (this.isFollowing(pi.owner)) {
        if (pi.mustBeDisplayed()) {
          this.markerCluster.addMarker(pi.marker, false);
        }
      }
    });
  }

  /*************************************************
   ************* MARKER (PI & Tower) ***************
   *************************************************/
  private createMarker(lat, lng, displayed = true, type = 'default') {
    var marker = new google.maps.Marker({
      position: {lat: lat, lng: lng},
      map: (displayed ? this.map : null),
      icon: map_style.getIcon(type),
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
      let description = ""; // TODO : change when added in the db
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

        //Check if the owner of the PI is a friend
        if (this.isFollowing(owner)) {
        //if(true) {
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

    var cancelControl = Utils.createMapControlButton('Cancel');
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
   **************** FRIENDS ********************
   *************************************************/

   //Adds a user as followed in firebase and also locally in the following array
   public followUser(friendId, index) : void {
     var uid = this.aut.getUser.uid;
     var dbRef = this.db.database.ref('users/' + uid + '/following/');
     var friendRef = this.db.database.ref('users/' + uid + '/following/' + friendId);
     dbRef.once('value').then((snapshot) => {
       dbRef.child(friendId);
       friendRef.once('value').then((snap) => {
         if(!snap.exists()){
           friendRef.child('name').set(this.users[index].name);
           friendRef.child('email').set(this.users[index].email);
         }
         this.following.push({"id" : this.users[index].id, "name" : this.users[index].name});
       });
       this.users.forEach((user) => {
         if (user.id === friendId) {
           user.following = true;
           console.log(this.users);
         }
       });
     });
    this.pis.forEach((pi, key, map) => {
      this.markerCluster.removeMarker(pi.marker, false);
      if (this.isFollowing(pi.owner)) {
        if (pi.mustBeDisplayed()) {
          this.markerCluster.addMarker(pi.marker, false);
        }
      }
    });
   }

   //Removes the user as followed in firebase and also removes it locally from
   //the following array
   public unFollowUser(friendId, index) : void {
     var uid = this.aut.getUser.uid;
     var dbRef = this.db.database.ref('users/' + uid + '/following/');
     dbRef.child(friendId).remove();
     for(var i = 0; i < this.following.length; i++){
       if(this.following[i].id == friendId){
         if (index > -1) {
          this.following.splice(i, 1);
         }
       }
     }
     this.pis.forEach((pi, key, map) => {
       this.markerCluster.removeMarker(pi.marker, false);
       if (this.isFollowing(pi.owner)) {
         if (pi.mustBeDisplayed()) {
           this.markerCluster.addMarker(pi.marker, false);
         }
       }
     });
   }

   //Fetches all users to the users array
   public getUsers() {
     var x = new Array();
     var flw = new Array();
     var uFilt = new Array();
     var dbref = this.db.database.ref('users/');
     var followRef = this.db.database.ref('users/' + this.aut.getUser.uid + '/following/');
     dbref.once('value').then((snapshot) => {
       snapshot.forEach((userSnapshot) => {
         var id = this.aut.getUser.uid;
         let key = userSnapshot.key;
         let email = userSnapshot.child('email').val();
         let name = userSnapshot.child('name').val();
         //let flwing = userSnapshot.child('following').val();

         if(key !== id){
           followRef.once('value', function (snapshot) {
             //console.log(snapshot.child(key).exists());
             //console.log(key);
             x.push({
               "id": key,
               "email": email,
               "name": name,
               "following": snapshot.child(key).exists()
             });
           });

           if(name != null){
              uFilt.push(name);
           }
         }else{
           followRef.once('value').then((snap) => {
             snap.forEach((snap2) => {
               flw.push({"id" : snap2.key, "name" : snap2.child("name").val()});
               console.log(snap2.key);
             });
           });
         }
       });
     });
     this.following = flw;
     this.users = x;
     this.usersFiltered = uFilt;
     this.usersInitial = uFilt;
   }

   //Called when a person is followed/unfollowed and will handle that event
   //Removing/adding the person from the following array
   public notifyFollowChange(index) : void {
     var uid = this.aut.getUser.uid;
     var friendId = this.users[index].id;
     var followingRef = this.db.database.ref('users/' + uid + '/following');
     var userRef = this.db.database.ref('users/' + uid);
     followingRef.once('value').then((snapshot) => {
       if (!snapshot.exists()) {
         userRef.child('following').set("null");
         followingRef.child(friendId).set(this.users[index].email);
       }else{
         var checkIfFollowRef = this.db.database.ref('users/' + uid + '/following/' + friendId);
         checkIfFollowRef.once('value').then((friendSnapshot) => {
           if (!friendSnapshot.exists()) {
             console.log("Adding to follow");
             this.followUser(friendId, index);
           }else{
             console.log("Removing from follow");
             this.unFollowUser(friendId, index);
           }
         });
       }
     });
    }

    public searchUser(ev: any){
      this.usersFiltered = this.usersInitial;
      console.log(this.usersFiltered);
      console.log(this.usersInitial);
      let val = ev.target.value;
      // if the value is an empty string don't filter the items
      if (val && val.trim() != '' ) {
        this.usersFiltered = this.usersFiltered.filter((item) => {
          return (item.toLowerCase().indexOf(val.toLowerCase()) > -1);
        })
      }

    }

    private isFollowing(friend): boolean {
      for (var i = 0; i < this.users.length; i++) {
        if (this.users[i].id === friend) {
          return this.users[i].following;
        }
      }
      return false;
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
