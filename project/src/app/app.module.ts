import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';

import {AngularFireModule} from 'angularfire2';
import {AngularFireAuthModule} from 'angularfire2/auth';
import {AuthService} from '../providers/authentication.service';
import {HeaderModule} from '../pages/header/header.module';

import { MyApp } from './app.component';
import { Header } from '../pages/header/header';
import { AboutPage } from '../pages/about/about';
import { ContactPage } from '../pages/contact/contact';
import { HomePage } from '../pages/home/home';
import { TabsPage } from '../pages/tabs/tabs';
import { LoginPage } from '../pages/login/login';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import {GooglePlus} from '@ionic-native/google-plus';


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
    AboutPage,
    ContactPage,
    HomePage,
    TabsPage,
    LoginPage
  ],
  imports: [
    HeaderModule,
    BrowserModule,
    IonicModule.forRoot(MyApp),
    AngularFireModule.initializeApp(firebase_config),
    AngularFireAuthModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    Header,
    AboutPage,
    ContactPage,
    HomePage,
    TabsPage,
    LoginPage
  ],
  providers: [
    GooglePlus,
    AuthService,
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
