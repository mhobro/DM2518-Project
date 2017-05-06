import {Component} from '@angular/core';
import {Validators, FormBuilder, FormGroup} from '@angular/forms';
import { AlertController } from 'ionic-angular';

import {AuthService} from '../../providers/authentication.service';


/*
 Generated class for the Login page.

 See http://ionicframework.com/docs/v2/components/#navigation for more info on
 Ionic pages and navigation.
 */
@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {
  loginForm: FormGroup;
  header_data: any;

  constructor(public _auth: AuthService, private formBuilder: FormBuilder, public alertCtrl: AlertController) {
    this.loginForm = this.formBuilder.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
    });

    this.header_data={titlePage: 'Login', isMenu: true};
  }

  loginGoogle(): void {
    console.log(typeof this._auth);
    this._auth.loginGoogle();
  }

  loginEmailPassword(): void {
    this._auth.loginEmailPassword(this.loginForm.value.email, this.loginForm.value.password).catch((error) => {
      console.log(error);

      // Display an alert that explains the error
      let alert = this.alertCtrl.create({
        title: 'Login error',
        subTitle: error.message,
        buttons: ['OK']
      });
      alert.present();
    });

   // Check if connected (debug)
    // Display an alert that explains the error

    if (this._auth.authenticated) {
      let alert = this.alertCtrl.create({
        title: 'Connection successful',
        subTitle: "User " + this._auth.getName() + " connected",
        buttons: ['OK']
      });
      alert.present();
    }

  }
}
