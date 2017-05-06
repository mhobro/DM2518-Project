import {Component} from '@angular/core';
import {Validators, FormBuilder, FormGroup} from '@angular/forms';
import {AlertController, NavController} from 'ionic-angular';

import {AuthService} from '../../providers/authentication.service';

// Do not import from 'firebase' as you'll lose the tree shaking benefits
import * as firebase from 'firebase/app';


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

  constructor(public navCtrl: NavController, public _auth: AuthService, private formBuilder: FormBuilder, public alertCtrl: AlertController) {
    this.loginForm = this.formBuilder.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
    });

    this.header_data = {titlePage: 'Login', isMenu: false};
  }

  loginGoogle(): void {
    this.handleConnection(this._auth.loginGoogle());
  }

  loginEmailPassword(): void {
    this.handleConnection(this._auth.loginEmailPassword(this.loginForm.value.email, this.loginForm.value.password));
  }

  private handleConnection(result: firebase.Promise<firebase.User>): void {
    // Handle connection errors
    result.catch((error) => {
      console.log(error);

      var errorCode = error['code'];

      if (errorCode === 'auth/invalid-email' ||
        errorCode === 'auth/user-disabled' ||
        errorCode === 'auth/user-not-found' ||
        errorCode === 'auth/wrong-password') {

        // Display an alert that explains the error
        let alert = this.alertCtrl.create({
          title: 'Login error',
          subTitle: error.message,
          buttons: ['OK']
        });
        alert.present();
      }
    }).then((userResult) => {
      // Check if connected (debug)
      if (userResult != null) {
        console.log("Logged in successfully");
        // Go back to HomePage
        this.navCtrl.popToRoot();
      }
    });
  }
}
