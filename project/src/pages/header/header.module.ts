import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { Header } from './header';

@NgModule({
  declarations: [
    Header,
  ],
  imports: [
    IonicPageModule.forChild(Header),
  ],
  exports: [
    Header
  ]
})
export class HeaderModule {}
