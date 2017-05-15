import {Component, Input} from '@angular/core';

import { Tower } from './tower';

@Component({
  selector: 'tower-detail',
  template: `<div *ngIf="data">
      <ion-toolbar>
        <ion-title><h2>Tower</h2></ion-title>
      </ion-toolbar>
      <div *ngIf="data.tower.activated">
        <div>
          <h1>{{data.tower.name}}</h1>
          <p><label>Congratulation !</label></p>
          <p><label>You unlocked the area {{data.tower.name}}.</label></p>
        </div>
      </div>      
      <div *ngIf="!data.tower.activated">
        <label>Visit the tower to unlock the area.</label>
        <div>
          <h1>{{data.tower.name}}</h1>
        </div>
        <button ion-button round block class="btn btn-success" (click)="unlockTower();" [disabled]="!data.unlockable">Unlock</button>
        <div *ngIf="!data.unlockable">
          <label>{{data.reason}}</label>
        </div>
      </div>
    </div>`
})

export class TowerInfoComponent {
  @Input() data: {tower: Tower, unlockable: boolean, reason: string};

  public unlockTower(): void {
    if (this.data != null && this.data.tower != null) {
      this.data.tower.updateStateInDb(true).then(() => {
      }).catch(function (error) {
        console.log("Error while unlocking the tower: " + error.message)
      });
    }
  }
}
