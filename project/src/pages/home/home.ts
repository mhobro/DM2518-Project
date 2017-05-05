import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { LoginPage } from '../login/login';
import { AboutPage } from '../about/about';

import { AuthService } from '../../providers/authentication.service';
import { AlertController } from 'ionic-angular';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  public isLoggedIn = false;
  public username;

  constructor(public navCtrl: NavController, public _auth: AuthService, public alertCtrl: AlertController) {
    if (!this.isLoggedIn) {
      console.log('You are not logged in');
    }
  }

  loginGoogle(): void {
    console.log(this._auth);
    this._auth.loginGoogle().catch((error) => {
      console.log(error);
    });

    if (this._auth.authenticated) {
      console.log("Logged in successfully");
      this.isLoggedIn = true;
      this.username = this._auth.getName();
      //this.navCtrl.push(AboutPage);
    }
  }

  logOut(): void{
    this._auth.logout();
    this.isLoggedIn = false;
  }

}
