import {Directive, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[right_overlay]',
})
export class RightOverlay {
  constructor(public viewContainerRef: ViewContainerRef) {
  }
}
