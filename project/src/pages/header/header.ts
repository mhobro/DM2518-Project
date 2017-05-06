import {Component, Input} from '@angular/core';

import {HomePage} from '../home/home';


@Component({
  selector: 'custom-header',
  templateUrl: 'header.html',
})
export class Header {

  //header_data: { title: string, isMenu: boolean };
  header_data: any;

  constructor() {}

  @Input()
  set header(header_data: any) {
    this.header_data = header_data;
  }

  get header() {
    return this.header_data;
  }
}
