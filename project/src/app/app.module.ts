import {NgModule, ErrorHandler} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {IonicApp, IonicModule, IonicErrorHandler} from 'ionic-angular';
import {FormsModule}   from '@angular/forms';

import {AngularFireModule} from 'angularfire2';
import {AngularFireAuthModule} from 'angularfire2/auth';
import {AngularFireDatabaseProvider} from 'angularfire2/database';
import {AuthService} from '../providers/authentication.service';

import {MyApp} from './app.component';
import {Header} from '../pages/header/header';
import {HomePage} from '../pages/home/home';
import {MapPage} from '../pages/map/map';
import {LoginPage} from '../pages/login/login';
import {AddMarkerComponent} from '../pages/map/addMarker';

import {StatusBar} from '@ionic-native/status-bar';
import {SplashScreen} from '@ionic-native/splash-screen';
import {GooglePlus} from '@ionic-native/google-plus';
import {GoogleMaps} from '@ionic-native/google-maps';
import {Geolocation} from '@ionic-native/geolocation';
import {TowerView} from "../pages/map/towerView";
import {RightOverlay} from "../pages/map/right_overlay";
import {FilterView} from "../pages/map/filter_view";

// Initialize Firebase
const firebase_config = {
  apiKey: "AIzaSyByAfaZFGNWCdgT30WegtVIBAwfrjzAi0c",
  authDomain: "dm2518-project-9da4c.firebaseapp.com",
  databaseURL: "https://dm2518-project-9da4c.firebaseio.com",
  projectId: "dm2518-project-9da4c",
  storageBucket: "dm2518-project-9da4c.appspot.com",
  messagingSenderId: "814669340370"
};


@NgModule({
  declarations: [
    MyApp,
    Header,
    HomePage,
    MapPage,
    LoginPage,
    AddMarkerComponent,
    TowerView,
    RightOverlay,
    FilterView
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    AngularFireModule.initializeApp(firebase_config),
    AngularFireAuthModule,
    FormsModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    Header,
    HomePage,
    MapPage,
    LoginPage,
    TowerView,
    FilterView
  ],
  providers: [
    AngularFireDatabaseProvider,
    GoogleMaps,
    Geolocation,
    GooglePlus,
    AuthService,
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {
}
