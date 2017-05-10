import Utils from './utils';
import * as map_style from './map_style'; // File containin all the style for the map
import * as firebase from 'firebase/app';

import {AngularFireDatabase} from 'angularfire2/database';

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
              public location: google.maps.LatLng,
              public marker: google.maps.Marker,
              public activated: boolean = false,
              public infoWindow,
              public map,
              public pis,
              public db: AngularFireDatabase,
              public user_uid: string,
              public user_locationObs) {

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
    content.innerHTML += "<p>Key : " + this.key + "</p>";
    content.innerHTML += "<p>Name : " + this.name + "</p>";
    content.innerHTML += "<p>Lat : " + this.location.lat() + "</p>";
    content.innerHTML += "<p>Lng : " + this.location.lng() + "</p>";
    content.innerHTML += "<p>Activated : " + this.activated + "</p>";

    return content;
  }

  /**
   * Create a div when the tower is locked
   *
   * @returns {HTMLElementTagNameMap[string]}
   */
  public getLockedHTMLContent() {
    let content = document.createElement('div');
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
      content.innerHTML += "<p><strong>You too far to unlock this tower !</strong></p>";
      unlockButton.disabled = true;
    } else {
      unlockButton.onclick = () => {
        this.unlockTower();
        this.infoWindow.close();
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
  public displayAllNearestPis(map, pisMap) {
    this.piInRange.forEach(function (pi, index, array) {
      if (!pisMap.has(pi)) {
        array.splice(index, 1); // Remove the PI if not in the map
      } else {
        var pi = pisMap.get(pi);
        pi.marker.setAnimation(google.maps.Animation.DROP);
        pi.marker.setMap(map);
        pi.unlocked = true;
      }
    })
  }

  /**
   * Hide on the map all the markers near the tower
   *
   * @param map
   * @param pisMap
   */
  public hideAllNearestPis(pisMap) {
    this.piInRange.forEach(function (pi, index, array) {
      if (!pisMap.has(pi)) {
        array.splice(index, 1); // Remove the PI if not in the map
      } else {
        var pi = pisMap.get(pi);
        pi.marker.setMap(null);
        pi.unlocked = false;
      }
    })
  }

  /**
   * Unlock the tower by changing the state in the db and updating the map
   */
  public unlockTower() {
    // Update state in the db
    this.updateStateInDb(true).then(() => {
      this.activated = true;
      // Change the marker icon
      this.marker.setIcon(map_style.icons['tower_unlocked'].icon);
      // Display all the PIs near the tower
      this.displayAllNearestPis(this.map, this.pis);
    }).catch(function (error) {
      console.log("Remove failed: " + error.message)
    });
  }

  /**
   * Store the new tower's state for the authenticated user
   *
   * @param newState
   * @returns {firebase.Promise<any>}
   */
  private updateStateInDb(newState): firebase.Promise<any> {
    var userRef = this.db.database.ref('users/' + this.user_uid + '/towers');
    return userRef.child(this.key).set(newState);
  }
}
