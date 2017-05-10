import Utils from './utils';

/**
 * [Tower] Class representing a Tower on the map
 */
export class Tower {
  static readonly MAX_UNLOCK_DST = 1000; // Range in meters in which we can unlock a tower/ PI

  piInRange = []; // Contains the keys of the pis near the tower
  onclickListener: any;

  constructor(public key: string,
              public name: string,
              public location: google.maps.LatLng,
              public marker: google.maps.Marker,
              public activated: boolean = false,
              public infoWindow,
              public map) {

    this.onclickListener = () => {
      // DEBUG infowindow
      let contentToDisplay = this.getHTMLDebug();

      // Update and open the infowindow content
      this.infoWindow.close();
      this.infoWindow.setContent(contentToDisplay);
      this.infoWindow.open(this.map, this.marker);
    }

    this.marker.addListener('click', this.onclickListener);
  }

  public getHTMLDebug() {
    let content = document.createElement('div');
    content.innerHTML += "<p>Key : " + this.key + "</p>";
    content.innerHTML += "<p>Name : " + this.name + "</p>";
    content.innerHTML += "<p>Lat : " + this.location.lat() + "</p>";
    content.innerHTML += "<p>Lng : " + this.location.lng() + "</p>";
    content.innerHTML += "<p>Activated : " + this.activated + "</p>";

    return content;
  }

  public get

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
}
