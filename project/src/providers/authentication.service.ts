import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {AngularFireAuth} from 'angularfire2/auth';
import {Platform} from 'ionic-angular';
import {GooglePlus} from '@ionic-native/google-plus';
import {auth} from 'firebase'; //needed for the GoogleAuthProvider

// Do not import from 'firebase' as you'll lose the tree shaking benefits
import * as firebase from 'firebase/app';

@Injectable()
export class AuthService {
  private authState: Observable<firebase.User>;
  private currentUser: firebase.User = null;

  constructor(public afAuth: AngularFireAuth, private platform: Platform, private google: GooglePlus) {
    this.authState = afAuth.authState;
    this.authState.subscribe((user: firebase.User) => {
      this.currentUser = user;
    });
  }

  // Do not touch this method plz :)
  public loginGoogle() {
    if (this.platform.is('cordova')) {
      return this.google.login({
        'webClientId':'814669340370-dlgp38veq34t1fv5m3bg3j2hbu5nth0k.apps.googleusercontent.com' //your Android reverse client id
      }).then(userData => {
        var token = userData.idToken;
        const googleCredential = auth.GoogleAuthProvider.credential(token, null);
        return this.afAuth.auth.signInWithCredential(googleCredential);
      });
    } else {
      return this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    }
  }

  public loginEmailPassword(email, password): firebase.Promise<firebase.User> {
    return this.afAuth.auth.signInWithEmailAndPassword(email, password);
  }

  public logout() {
    this.afAuth.auth.signOut().then(function () {
      console.log("Logged out succesfully");
    }).catch(function (error) {
      console.log(error);
    });
  }

  get authenticated(): boolean {
    return this.currentUser !== null;
  }

  get getUser(): firebase.User | null {
    return this.currentUser;
  }
}
