import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

@Component({
  selector: 'page-about',
  templateUrl: 'about.html'
})
export class AboutPage {
  header_data: any;

  constructor(public navCtrl: NavController) {
    this.header_data = {titlePage: "About", isMenu: true};
  }

}