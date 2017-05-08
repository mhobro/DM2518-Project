import {Component} from '@angular/core';
import {NavController} from 'ionic-angular';

import {AuthService} from '../../providers/authentication.service';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage{
  header_data: any;

  constructor(public navCtrl: NavController, public _auth: AuthService) {
    this.header_data = {titlePage: "Home", isMenu: true};
  }
}
