import {Component} from '@angular/core';
import {Validators, FormBuilder, FormGroup} from '@angular/forms';
import {AlertController, NavController} from 'ionic-angular';

import {AngularFireDatabase} from 'angularfire2/database';
import {AuthService} from '../../providers/authentication.service';

// Do not import from 'firebase' as you'll lose the tree shaking benefits
import * as firebase from 'firebase/app';
import {MapPage} from "../map/map";


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

  constructor(public navCtrl: NavController,
              public _auth: AuthService,
              private formBuilder: FormBuilder,
              public alertCtrl: AlertController,
              public db: AngularFireDatabase) {
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
      //console.log(error);

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
      // Check if connected and user in db
      if (userResult != null) {
        var user:firebase.User;

        if (typeof userResult.user !== 'undefined') {
          // if google authentication
          user = userResult.user;
        } else {
          // if email/pass authentication
          user = userResult;
        }

        //console.log(user);

        // Add the user in the database
        // TODO: if user has been removed from firebase and login then, he will have a ≠ uid
        // TODO => clean the data with the previous uid
        var ref = firebase.database().ref("users/" + user.uid);
        ref.once("value")
          .then((snapshot) => {
            if (!snapshot.exists()) {
              ref.child('name').set(user.displayName);
              ref.child('email').set(user.email);
            }

            // Go back to HomePage
            this._auth.invokeEvent.subscribe((value) => {
              if (value['connected']) {
                this.navCtrl.setRoot(MapPage);
              }
            });

          });

        //console.log("Logged in successfully");
      }
    });
  }
}
