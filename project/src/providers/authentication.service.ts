import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {AngularFireAuth} from 'angularfire2/auth';

// Do not import from 'firebase' as you'll lose the tree shaking benefits
import * as firebase from 'firebase/app';

@Injectable()
export class AuthService {
  private authState: Observable<firebase.User>;
  private currentUser: firebase.User;

  constructor(public afAuth: AngularFireAuth) {
    this.authState = afAuth.authState;
    this.authState.subscribe((user: firebase.User) => {
      this.currentUser = user;
    });
  }

  public loginGoogle() {
    this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }

  public loginEmailPassword(email, password): firebase.Promise<firebase.User> {
    return this.afAuth.auth.signInWithEmailAndPassword(email, password);
  }

  public logout() {
    this.afAuth.auth.signOut();
  }

  get authenticated(): boolean {
    return this.currentUser !== null;
  }

  public getName(): string {
    if (this.currentUser !== null) {
      return this.currentUser.email;
    } else {
      return '';
    }
  }
}
