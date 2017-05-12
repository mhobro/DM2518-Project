import {Tower} from './tower';

/**
 * [Model] Class representing a PI (Point of Interest) on the map
 */
export class Pi {

  onclickListener: any;
  filtersState: PiFilter = new PiFilter();
  towerNear: Tower[] = [];

  constructor(public key: string,
              public name: string,
              public description: string,
              public location: google.maps.LatLng,
              public marker: google.maps.Marker,
              public unlocked: boolean = false,
              public type,
              public owner,
              public infoWindow,
              public map,
              public user_uid: string,
              public filters) {

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

  public mustBeDisplayed(): boolean {
    let mustBeDisplayed = true;

    this.filters.forEach((filter) => {
      //console.log("[" + this.key + "]" + filter.type + " | " + this.type);
      //console.log("[" + this.key + "]" +filter.state);
      if (filter.type === this.type) {
        if (!filter.state) {
          mustBeDisplayed = false;
        }
      }
    })

    if (!mustBeDisplayed) {
      return false;
    }

    if (this.owner === this.user_uid) {
      return true;
    }

    return (this.towerNear.length > 0);
  }

  public getHTMLDebug() {
    let content = document.createElement('div');
    content.innerHTML += "<p>Key : " + this.key + "</p>";
    content.innerHTML += "<p>Name : " + this.name + "</p>";
    content.innerHTML += "<p>Description : " + this.description + "</p>";
    content.innerHTML += "<p>Type : " + this.type + "</p>";
    content.innerHTML += "<p>Lat : " + this.location.lat() + "</p>";
    content.innerHTML += "<p>Lng : " + this.location.lng() + "</p>";
    content.innerHTML += "<p>Unlocked : " + this.unlocked + "</p>";
    content.innerHTML += "<p>Owner : " + this.owner + "</p>";

    return content;
  }


}

export class PiFilter {
  public typeFilter: boolean;
  public ownerFilter: boolean;
  public towerFilter: Tower[];

  constructor() {
  }
}
