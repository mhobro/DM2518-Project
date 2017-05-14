import {Component, Input} from '@angular/core';
import {MapPage} from "./map";

@Component({
  template: '<a href="#">Filters</a>' +
  '<ion-list>' +
  ' <ion-item  *ngFor="let f of data; let i=index">' +
  '   <ion-label>{{f.name}}</ion-label>' +
  '   <ion-toggle [(ngModel)]="data[i][\'state\']" (ionChange)="notifyFilterChange(i)"></ion-toggle>' +
  ' </ion-item> ' +
  '</ion-list>' +
  '<a href="#">Friends</a>'
})
export class FilterView{
  @Input() public data: any;
  @Input() public mapComponent: MapPage;

  private notifyFilterChange(i) {
    this.mapComponent.notifyFilterChange(i)
  }
}
