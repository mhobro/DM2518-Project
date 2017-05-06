import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { LoginPage } from '../login/login';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  header_data: any;

  constructor(public navCtrl: NavController) {
    if (!this.isLoggedin()) {
      console.log('You are not logged in');
      //this.navCtrl.push(LoginPage);
    }

    this.header_data = {titlePage: "Home", isMenu: true};
  }

  isLoggedin() {
    if (window.localStorage.getItem('currentuser')) {
      return true;
    }
  }
}
