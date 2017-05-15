import {Component, Input} from '@angular/core';
import {ToastController} from 'ionic-angular';

import {Tower} from './tower';

@Component({
  selector: 'tower-detail',
  template: `
    <div *ngIf="data">
      <ion-toolbar color="orange">
        <ion-title style="color:white; font-weight: bold;"><h2>Tower</h2></ion-title>
      </ion-toolbar>
      <div *ngIf="data.tower.activated">
        <div style="margin: 20px auto;">
          <img width="200" src="{{data.tower.img}}"/>
          <p><label>{{data.tower.caption}}</label></p>
        </div>
        <div id="towerTitle">
          <h1>{{data.tower.name}}</h1>
        </div>
          <p><label>Congratulation !</label></p>
          <p><label>You unlocked the area {{data.tower.name}}.</label></p>
      </div>
      <div *ngIf="!data.tower.activated">
        <div style="margin: 20px auto;">
          <img width="75" height="75" src="assets/marker/tower_icon.svg"/>
        </div>
        <label>Visit the tower to unlock the area.</label>
        <div id="towerTitle" class="text_grey">
          <h1>{{data.tower.name}}</h1>
        </div>
        <button ion-button round color="secondary" class="btn btn-success" (click)="unlockTower();" [disabled]="!data.unlockable">
          Unlock
        </button>
        <div *ngIf="!data.unlockable">
          <label>{{data.reason}}</label>
        </div>
      </div>
    </div>`
})

export class TowerInfoComponent {
  @Input() data: { tower: Tower, unlockable: boolean, reason: string };

  constructor(private toastCtrl: ToastController) {
  };

  public unlockTower(): void {
    if (this.data != null && this.data.tower != null) {
      //Display a confirmation/error toast
      var toast = this.toastCtrl.create({
        duration: 3000,
        position: 'top'
      });
      this.data.tower.updateStateInDb(true).then(() => {
        toast.setMessage('Tower "' + this.data.tower.name + '" unlocked successfully !');
        toast.present();
      }).catch(function (error) {
        toast.setMessage("Error while unlocking the tower: " + error.message);
        toast.present();
      });
    }
  }
}
