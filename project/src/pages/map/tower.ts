/**
 * [Tower] Class representing a Tower on the map
 */
export class Tower {
  static readonly MAX_UNLOCK_DST = 1000; // Range in meters in which we can unlock a tower/ PI

  piInRange = []; // Contains the keys of the pis near the tower

  constructor(public name: string,
              public location: google.maps.LatLng,
              public marker: google.maps.Marker,
              public activated: boolean = false) {
  }

  /**
   * Check if an element (PI/user) is near enough from the tower
   *
   * @param lat
   * @param lng
   * @returns {boolean}
   */
  public isNear(lat, lng): boolean {
    return (calcDistance(this.location, new google.maps.LatLng(lat, lng)) <= Tower.MAX_UNLOCK_DST);
  }

  /**
   * Display all the markers near the tower
   *
   * @param map
   * @param pisMap
   */
  public displayAllNearestPis(map, pisMap) {
    this.piInRange.forEach(function(pi) {
      pisMap.get(pi).marker.setMap(map);
    })
  }

  /**
   * Hide on the map all the markers near the tower
   *
   * @param map
   * @param pisMap
   */
  public hideAllNearestPis(pisMap) {
    this.piInRange.forEach(function(pi) {
      pisMap.get(pi).marker.setMap(null);
    })
  }
}


// calculates distance between two points in km's
function calcDistance(p1:google.maps.LatLng, p2:google.maps.LatLng): number {
  return google.maps.geometry.spherical.computeDistanceBetween(p1, p2); // Return the distance in meters
}
