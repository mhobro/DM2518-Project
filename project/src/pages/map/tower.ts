import Utils from './utils';
import * as map_style from './map_style'; // File containin all the style for the map
import * as firebase from 'firebase/app';

import {AngularFireDatabase} from 'angularfire2/database';
import {MapPage} from "./map";

/**
 * [Tower] Class representing a Tower on the map
 */
export class Tower {
  static readonly MAX_UNLOCK_DST = 1000; // Range in meters in which we can unlock a tower/ PI

  piInRange = []; // Contains the keys of the pis near the tower
  onclickListener: any;
  userLocation: google.maps.LatLng;

  constructor(public key: string,
              public name: string,
              public img:string,
              public info:string,
              public location: google.maps.LatLng,
              public marker: google.maps.Marker,
              public activated: boolean = false,
              public infoWindow,
              public map,
              public pis,
              public db: AngularFireDatabase,
              public user_uid: string,
              public user_locationObs,
              public marker_cluster,
              public mapComponent: MapPage) {

    // Subscribe to the user's location update
    this.user_locationObs.subscribe((data) => {
      let lat = data.coords.latitude;
      let lng = data.coords.longitude;

      this.userLocation = new google.maps.LatLng(lat, lng);

    }, (error) => {
      console.log(error);
      this.userLocation = null;
    });


    // Define the onclick listener for the marker
    this.onclickListener = () => {
      let contentToDisplay;
      if (this.activated) {
        // DEBUG infowindow
        contentToDisplay = this.getHTMLDebug();
      } else {
        contentToDisplay = this.getLockedHTMLContent()
      }

      // Update and open the infowindow content
      this.infoWindow.close();
      this.infoWindow.setContent(contentToDisplay);
      this.infoWindow.open(this.map, this.marker);

      let unlockable = false;
      let reason = "";
      if (this.userLocation == null) {
        reason = "Your current position is unknown !";
      } else if (Utils.calcDistance(this.marker.getPosition(), this.userLocation) > Tower.MAX_UNLOCK_DST) {
        reason = "You too far to unlock this tower !";
      } else {
        unlockable = true;
      }
      this.mapComponent.displayTowerInfo(this.key, unlockable, reason);
    }

    this.marker.addListener('click', this.onclickListener);
  }

  /**
   * Create a div with all the tower's information
   *
   * @returns {HTMLElementTagNameMap[string]}
   */
  public getHTMLDebug() {
    let content = document.createElement('div');
    //content.innerHTML += "<p>Key : " + this.key + "</p>";
    content.innerHTML += "<h1>- " + this.name + " -</h1>";
    content.innerHTML += "<img src="+ this.img +" style='width:200px;'>";
    //content.innerHTML += "<p>Activated : " + this.activated + "</p>";
    content.innerHTML += "<p style='width:200px; fontsize:19px;'><strong>" +this.info+"</strong></p>";
    content.innerHTML += "<p>Lat : " + this.location.lat() + "</p>";
    content.innerHTML += "<p>Lng : " + this.location.lng() + "</p>";

    return content;
  }

  /**
   * Create a div when the tower is locked
   *
   * @returns {HTMLElementTagNameMap[string]}
   */
  public getLockedHTMLContent() {
    let content = document.createElement('div');
    content.innerHTML += "<h1>- " + this.name + " -</h1>";
    content.innerHTML += "<p><strong>The tower is locked</strong></p>";

    let unlockButton = document.createElement('button');
    unlockButton.innerHTML = 'Unlock';
    unlockButton.style.color = 'rgb(25,25,25)';
    unlockButton.style.fontFamily = 'Roboto,Arial,sans-serif';
    unlockButton.style.fontSize = '16px';
    unlockButton.style.lineHeight = '38px';
    unlockButton.style.paddingLeft = '5px';
    unlockButton.style.paddingRight = '5px';

    // Check if it's possible to unlock the tower
    if (this.userLocation == null) {
      content.innerHTML += "<p><strong>Your current position is unknown !</strong></p>";
      unlockButton.disabled = true;
    } else if (Utils.calcDistance(this.marker.getPosition(), this.userLocation) > Tower.MAX_UNLOCK_DST) {
      content.innerHTML += "<p><strong>Visit this area to unlock this tower !</strong></p>";
      unlockButton.disabled = true;
    } else {
      unlockButton.onclick = () => {
        // Update state in the db
        this.updateStateInDb(true).then(() => {
          //this.unlockTower();
          this.infoWindow.close();
        }).catch(function (error) {
          console.log("Remove failed: " + error.message)
        });
      }
    }

    content.appendChild(unlockButton);

    return content
  }

  /**
   * Check if an element (PI/user) is near enough from the tower
   *
   * @param lat
   * @param lng
   * @returns {boolean}
   */
  public isNear(lat, lng): boolean {
    return (Utils.calcDistance(this.location, new google.maps.LatLng(lat, lng)) <= Tower.MAX_UNLOCK_DST);
  }

  /**
   * Display all the markers near the tower
   *
   * @param map
   * @param pisMap
   */
  public displayAllNearestPis(pisMap) {
    //console.log(this.marker_cluster.getMarkers());

    this.piInRange.forEach((pi, index, array) => {
      if (!pisMap.has(pi)) {
        array.splice(index, 1); // Remove the PI if not in the map
      } else {
        var pi = pisMap.get(pi);
        console.log(pi);
        pi.marker.setAnimation(google.maps.Animation.DROP);
        //pi.marker.setMap(map);
        pi.unlocked = true;
        pi.towerNear.push(this.key);
        if (pi.mustBeDisplayed()) {
          this.marker_cluster.addMarker(pi.marker, false);
        }
      }
    })

    //console.log(this.marker_cluster.getMarkers());
  }

  /**
   * Hide on the map all the markers near the tower
   *
   * @param map
   * @param pisMap
   */
  public hideAllNearestPis(pisMap) {
    //console.log(this.marker_cluster.getMarkers());

    this.piInRange.forEach((pi, index, array) => {
      if (!pisMap.has(pi)) {
        array.splice(index, 1); // Remove the PI if not in the map
      } else {
        var pi = pisMap.get(pi);
        console.log(pi);
        this.marker_cluster.removeMarker(pi.marker, false);
        pi.unlocked = false;
        //console.log("[tower:" + this.key + "]" + "[pi:" + pi.key + "]" +  pi.towerNear);
        pi.towerNear.splice(pi.towerNear.indexOf(this.key), 1);
        //console.log("[tower:" + this.key + "]" + "[pi:" + pi.key + "]" +  pi.towerNear);
      }
    })

    //console.log(this.marker_cluster.getMarkers());
  }

  /**
   * Unlock the tower by changing the state and updating the map
   */
  public unlockTower() {
    this.activated = true;
    // Change the marker icon
    this.marker.setIcon(map_style.getIcon('tower_unlocked'));
    // Display all the PIs near the tower
    this.displayAllNearestPis(this.pis);

  }

  /**
   * Lock the tower by changing its state and updating the map
   */
  public lockTower() {
    this.activated = false;
    // Change the marker icon
    this.marker.setIcon(map_style.getIcon('tower_locked'));
    // Display all the PIs near the tower
    this.hideAllNearestPis(this.pis);
  }

  /**
   * Store the new tower's state for the authenticated user
   *
   * @param newState
   * @returns {firebase.Promise<any>}
   */
  public updateStateInDb(newState): firebase.Promise<any> {
    var userRef = this.db.database.ref('users/' + this.user_uid + '/towers');
    return userRef.child(this.key).set(newState);
  }
}
