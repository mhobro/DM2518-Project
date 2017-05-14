import {Component, Input, OnInit} from '@angular/core';


@Component({
  template: '<ion-toolbar>' +
  ' <ion-title><h1>{{data.name}}</h1></ion-title>' +
  '</ion-toolbar>' +
  '<p>{{data.key}}</p>'
})
export class TowerView implements OnInit {
  @Input() public data: any;

  ngOnInit() {
    console.log('on init');
    console.log(this.data);
  }
}
