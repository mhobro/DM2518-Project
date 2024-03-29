import {Component, ViewChild, ElementRef} from '@angular/core';
import {AlertController, MenuController, ToastController} from 'ionic-angular';
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
  @ViewChild('rightInfoPanel') towerInfoPanel: ElementRef; // Ref to the tower info panel of the right in the HTML

  map: any; // Ref to the Google Map object
  towers: Map<string, any> = new Map(); // Map associating the tower's name to the tower's object
  pis: Map<string, any> = new Map(); // Map associating the pi's key to the pi's object

  addPIControl; // Button to add a PI
  rightMenuControl; // Button to open the right menu
  selectedTower: any = null; // The tower displayed in the tower info panel

  following = new Array();
  usersFiltered = new Array<{id: string, name: string, email: string, following: boolean}>();
  usersInitial : string[];
  users = new Array<{id: string, name: string, email: string, following: boolean}>();
  followString: string = '';

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

  constructor(private menu: MenuController,
              private db: AngularFireDatabase,
              private geolocation: Geolocation,
              private alertCtrl: AlertController,
              private aut: AuthService,
              public toastCtrl: ToastController) {
    this.header_data = {titlePage: "Map", isMenu: true};
    this.getUsers();
    console.log(this.users);
  }

  // Called when the view is fully loaded
  ionViewDidLoad() {
    this.menu.swipeEnable(false); // Disable the swipe gesture to open the navbar menu
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

      //console.log(type);
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
        let caption = towerSnapshot.child('caption').val();
        let img = towerSnapshot.child('img').val();
        let info = towerSnapshot.child('info').val();
        let lat = towerSnapshot.child('lat').val();
        let lng = towerSnapshot.child('lng').val();

        let marker = this.createMarker(lat, lng, false); // Don't display the tower until fetching the state for the authenticated user
        var tower = new Tower(key, name, caption, img, info, new google.maps.LatLng(lat, lng), marker,
          undefined, this.infoWindow, this.map, this.pis, this.db, this.aut.getUser.uid, this.user_location, this.markerCluster, this);

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


  public displayTowerInfo(key: string, unlockable: boolean, reason: string) {
    if (this.towers.has(key)) {
      var t = this.towers.get(key);
      this.selectedTower = {tower: t, unlockable: unlockable, reason: reason};
      this.closeLeftMenu();
      this.closeRightMenu();
      this.openTowerPanel();
    }
  }

  /*************************************************
   ******************* MENUS ***********************
   *************************************************/

  private initMenus(): void {
    // Create a button to open the left menu
    this.addPIControl = Utils.createIconButton("add", () => {
      this.closeEveryWindows();
      this.openLeftMenu();
    });
    this.map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(this.addPIControl);


    // Create a button to open the rigth menu
    this.rightMenuControl = Utils.createIconButton("menu", () => {
      this.closeEveryWindows();
      this.openRigthMenu();
    });
    this.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(this.rightMenuControl);

    // Add click handler on the map to close the menus and the infowindow
    this.map.addListener('click', () => {
      this.closeEveryWindows();
    });
  }

  public closeEveryWindows() {
    this.closeLeftMenu();
    this.closeRightMenu();
    this.closeTowerPanel();
    this.infoWindow.close();
  }

  public closeLeftMenu(): void {
    this.menuLeft.nativeElement.style.width = "0%";
  }

  public openLeftMenu(): void {
    this.menuLeft.nativeElement.style.width = "75%";
  }

  public closeRightMenu(): void {
    this.menuRight.nativeElement.style.width = "0%";
  }

  public openRigthMenu(): void {
    this.menuRight.nativeElement.style.width = "75%";
  }

  public closeTowerPanel(): void {
    this.towerInfoPanel.nativeElement.style.width = "0%";
    this.selectedTower = null;
  }

  public openTowerPanel(): void {
    this.towerInfoPanel.nativeElement.style.width = "75%";
  }

  /*************************************************
   **************** FRIENDS ********************
   *************************************************/

   //Adds a user as followed in firebase and also locally in the following array
   public followUser(friendId, index) : void {
     console.log("FOLLOWING");
     var uid = this.aut.getUser.uid;
     var dbRef = this.db.database.ref('users/' + uid + '/following/');
     var friendRef = this.db.database.ref('users/' + uid + '/following/' + friendId);
     dbRef.once('value').then((snapshot) => {
       dbRef.child(friendId);
       friendRef.once('value').then((snap) => {
         if(!snap.exists()){
           friendRef.child('name').set(this.usersFiltered[index].name);
           friendRef.child('email').set(this.usersFiltered[index].email);
         }
         this.following.push({"id" : this.usersFiltered[index].id, "name" : this.usersFiltered[index].name});
       });
       this.users.forEach((user) => {
         if (user.id === friendId) {
           user.following = true;
         }
       });
       console.log(this.users);
     });
    this.pis.forEach((pi, key, map) => {
      this.markerCluster.removeMarker(pi.marker, false);
      if (this.isFollowing(pi.owner) || pi.owner == this.aut.getUser.uid) {
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
     this.users.forEach((user) => {
       if (user.id === friendId) {
         user.following = false;
       }
     });
     console.log(this.users);
     this.pis.forEach((pi, key, map) => {
       this.markerCluster.removeMarker(pi.marker, false);
       if (this.isFollowing(pi.owner) || pi.owner == this.aut.getUser.uid) {
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
               //console.log(snap2.key);
             });
           });
         }
       });
     });
     this.following = flw;
     this.users = x;
     //this.usersFiltered = uFilt;
     //this.usersInitial = uFilt;
   }

   //Called when a person is followed/unfollowed and will handle that event
   //Removing/adding the person from the following array
   public notifyFollowChange(index) : void {
     var i = -1;
     this.users.forEach((v, k, m) => {
       if (this.usersFiltered[index].id === v.id) {
         i = k;
       }
     });

     var uid = this.aut.getUser.uid;
     var friendId = this.users[i].id;
     var followingRef = this.db.database.ref('users/' + uid + '/following');
     var userRef = this.db.database.ref('users/' + uid);
     followingRef.once('value').then((snapshot) => {
       if (!snapshot.exists()) {
         userRef.child('following').set("null");
         followingRef.child(friendId).set(this.usersFiltered[index].email);
         this.following.push({"id" : this.usersFiltered[index].id, "name" : this.usersFiltered[index].name});
         console.log(this.following);
         this.users.forEach((user) => {
           if (user.id === friendId) {
             user.following = true;
           }
         });
         this.usersFiltered = this.users;
         this.pis.forEach((pi, key, map) => {
           this.markerCluster.removeMarker(pi.marker, false);
           if (this.isFollowing(pi.owner) || pi.owner == this.aut.getUser.uid) {
             if (pi.mustBeDisplayed()) {
               this.markerCluster.addMarker(pi.marker, false);
             }
           }
         });
       } else {
         var checkIfFollowRef = this.db.database.ref('users/' + uid + '/following/' + friendId);
         checkIfFollowRef.once('value').then((friendSnapshot) => {
           if (!friendSnapshot.exists()) {
             //console.log("Adding to follow");
             this.followUser(friendId, index);
           }else{
             //console.log("Removing from follow");
             this.unFollowUser(friendId, index);
           }
         });
       }
     });
    }

    public searchUser(ev: any){
      this.usersFiltered = this.users;
      //console.log(this.usersFiltered);
      //console.log(this.usersInitial);
      let val = ev.target.value;
      // if the value is an empty string don't filter the items
      if (val && val.trim() != '' ) {
        this.usersFiltered = this.usersFiltered.filter((item) => {
          return (item.name.toLowerCase().indexOf(val.toLowerCase()) > -1);
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
