import {Component} from '@angular/core';
import {NavController} from 'ionic-angular';

@Component({
  selector: 'page-contact',
  templateUrl: 'contact.html'
})
export class ContactPage {
  header_data: any;

  constructor(public navCtrl: NavController) {
    this.header_data = {titlePage: "About", isMenu: true};
  }
}
