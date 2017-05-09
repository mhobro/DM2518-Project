/**
 * [Model] Class representing a PI (Point of Interest) on the map
 */
export class Pi {
  constructor(public name: string,
              public description: string,
              public location: google.maps.LatLng,
              public marker: google.maps.Marker,
              public unlocked: boolean = false,
              public type,
              public owner) {}
}
