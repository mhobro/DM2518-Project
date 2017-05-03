import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';

import {AngularFireModule} from 'angularfire2';


import { AboutPage } from '../pages/about/about';
import { ContactPage } from '../pages/contact/contact';
import { HomePage } from '../pages/home/home';
import { TabsPage } from '../pages/tabs/tabs';
import { LoginPage } from '../pages/login/login';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';



// Initialize Firebase
const config = {
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
    BrowserModule,
    IonicModule.forRoot(MyApp),
    AngularFireModule.initializeApp(config)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    AboutPage,
    ContactPage,
    HomePage,
    TabsPage,
    LoginPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
