/**
 * [Model] Class representing a PI (Point of Interest) on the map
 */
export class Pi {

  onclickListener: any;

  constructor(public key: string,
              public name: string,
              public description: string,
              public location: google.maps.LatLng,
              public marker: google.maps.Marker,
              public unlocked: boolean = false,
              public type,
              public owner,
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
    content.innerHTML += "<p>Description : " + this.description + "</p>";
    content.innerHTML += "<p>Type : " + this.type + "</p>";
    content.innerHTML += "<p>Lat : " + this.location.lat() + "</p>";
    content.innerHTML += "<p>Lng : " + this.location.lng() + "</p>";
    content.innerHTML += "<p>Unlocked : " + this.unlocked + "</p>";
    content.innerHTML += "<p>Owner : " + this.owner + "</p>";

    return content;
  }
}
