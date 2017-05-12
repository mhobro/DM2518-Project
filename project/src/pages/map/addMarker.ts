import {Component} from '@angular/core';
import {NavController} from 'ionic-angular';

import {AngularFireDatabase} from 'angularfire2/database';
import {AuthService} from '../../providers/authentication.service';

import {MapPage} from './map';
import Utils from './utils'; // File containing all the utils functions

@Component({
  selector: 'add-marker-form',
  templateUrl: './markerForm.html'
})
export class AddMarkerComponent {
  filters: Array<{ name: string, type: string, state: boolean }>;
  model: any;

  cancelAddPIControl; // Button to cancel the new PI being added
  validateAddPIControl; // Button to validate the new PI being added

  constructor (public navCtrl: NavController,
               public db: AngularFireDatabase,
               public mapComponent: MapPage,
               public aut: AuthService) {
    this.filters = this.mapComponent.filters; // Filters defined in the map component
    this.model = {name: "", type: this.filters[0].type, description: ""}; //Bound to the input in the form
  }

  onSubmit() {
    //console.log(JSON.stringify(this.model));
    this.mapComponent.closeLeftMenu();
    this.addMarkerController({name: this.model.name, type: this.model.type, description: this.model.description});

    // Reset the form
    this.model.name = "";
    this.model.type = this.filters[0].type;
    this.model.description = "";
  }

  /**
   * Handler called after a click on the Add marker button
   *
   * @param piInfo
   */
  public addMarkerController = (piInfo: {name:string, type: string, description: string}) => {
    this.mapComponent.addPIControl.disabled = true;

    var position = this.mapComponent.map.getCenter();
    var marker = this.mapComponent.createMarker(position.lat(), position.lng(), true, true, (piInfo != null ? piInfo.type : undefined));
    marker.setAnimation(google.maps.Animation.BOUNCE);
    marker.setDraggable(true);

    this.mapComponent.map.setCenter(marker.getPosition());

    this.validateAddPIControl = Utils.createIconButton("checkmark", () => {
      // Set the action and text of the validate button

      marker.setMap(null);

      // Remove the validate button once clicked
      this.mapComponent.map.controls[google.maps.ControlPosition.BOTTOM_LEFT].pop();
      // Remove the cancel button once clicked
      this.mapComponent.map.controls[google.maps.ControlPosition.BOTTOM_LEFT].pop();

      this.validateMarker(marker, piInfo);
    });
    this.validateAddPIControl.style.paddingLeft = "12px";
    this.mapComponent.map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(this.validateAddPIControl);


    // Add a cancel button
    this.cancelAddPIControl = Utils.createIconButton("close", () => {
      marker.setMap(null);

      // Remove the validate button once clicked
      this.mapComponent.map.controls[google.maps.ControlPosition.BOTTOM_LEFT].pop();
      // Remove the cancel button once clicked
      this.mapComponent.map.controls[google.maps.ControlPosition.BOTTOM_LEFT].pop();

      // Enable the  add marker button
      this.mapComponent.addPIControl.disabled = false;
    });
    this.mapComponent.map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(this.cancelAddPIControl);
  };


  /**
   * Handler called after a click on the Validate marker button
   *
   * @param marker
   * @param piInfo
   */
  private validateMarker = (marker, piInfo: {name:string, type: string, description: string}) => {
    marker.draggable = false;
    marker.setAnimation(null);
    marker.setMap(null); // remove this marker bcs it will be display once successfully added in the db

    // Add the new PI in the db
    var markersRef = this.db.database.ref('pis');
    var newMarkerRef = markersRef.push();
    var lat = marker.position.lat();
    var lng = marker.position.lng();
    var owner = this.aut.getUser.uid;
    var name = piInfo.name;
    var description = piInfo.description;
    var type = piInfo.type;

    console.log(piInfo);
    newMarkerRef.set(
      {
        'lat': lat,
        'lng': lng,
        'owner': owner,
        'description': description,
        'type': type,
        'name': name
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

    // Enable the  add marker button
    this.mapComponent.addPIControl.disabled = false;
  }
}
