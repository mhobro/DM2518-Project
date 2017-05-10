import {Component, Input, OnInit} from '@angular/core';
import {NavController} from 'ionic-angular';

import {LoginPage} from '../login/login';

import {AuthService} from '../../providers/authentication.service';
import {HomePage} from "../home/home";


@Component({
  selector: 'custom-header',
  templateUrl: 'header.html',
})
export class Header implements OnInit {
  header_data: any;
  currentComponent: string = '';

  constructor(public navCtrl: NavController, public _auth: AuthService) {
    this._auth.invokeEvent.subscribe((value) => {
      if (value['logout']) {
        this.navCtrl.setRoot(HomePage);
      }
    });
  }

  ngOnInit(): void {
    if (typeof this.navCtrl.getActive() != 'undefined') {
      //console.log("active " + this.navCtrl.getActive().name);
      this.currentComponent = this.navCtrl.getActive().name;
    }
  }

  logIn(): void {
    this.navCtrl.push(LoginPage);
  }

  logOut(): void {
    this._auth.logout();
  }

  isAuthenticated(): boolean {
    return this._auth.authenticated;
  }

  @Input()
  set header(header_data: any) {
    this.header_data = header_data;
  }

  get header() {
    return this.header_data;
  }
}
