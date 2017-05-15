import {Component, ViewChild} from '@angular/core';
import {Platform, MenuController, Nav} from 'ionic-angular';
import {StatusBar} from '@ionic-native/status-bar';
import {SplashScreen} from '@ionic-native/splash-screen';

import {HomePage} from '../pages/home/home';
import {MapPage} from '../pages/map/map';
import {AuthService} from "../providers/authentication.service";
import {LoginPage} from "../pages/login/login";

@Component({
  templateUrl: 'app.html',
})

export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any = HomePage;  //Default page
  pages: Array<{ title: string, component: any }>;

  constructor(public platform: Platform,
              public menu: MenuController,
              public statusBar: StatusBar,
              public splashScreen: SplashScreen,
              public auth: AuthService) {

    this.initializeApp();

    // set our app's pages
    this.pages = [
      {title: 'Home', component: HomePage},
      {title: 'Map', component: MapPage}
    ];
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      this.statusBar.styleDefault();
      this.splashScreen.hide();

      this.auth.invokeEvent.subscribe((value) => {
        if (value['connected']) {
          this.nav.setRoot(MapPage);
        }
      });

      this.nav.setRoot(LoginPage);
    });
  }

  openPage(page) {
    // close the menu when clicking a link from the menu
    this.menu.close();
    // navigate to the new page if it is not the current page
    this.nav.setRoot(page.component);
  }

  openMenu() {
    this.menu.open();
  }
}
