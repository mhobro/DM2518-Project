import {Component, Input} from '@angular/core';

import { Tower } from './tower';

@Component({
  selector: 'tower-detail',
  template: `<div *ngIf="tower">
      <ion-toolbar>
        <ion-title><h2>{{tower.name}}</h2></ion-title>
      </ion-toolbar>
      <div><label>key: </label>{{tower.key}}</div>
      <div>
        <label>name: </label>{{tower.name}}
      </div>
    </div>`
})

export class TowerInfoComponent {
  @Input() tower: Tower;
}
