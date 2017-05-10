import Utils from './utils'

/*************************************************
 ****************** MAP CONTROL ******************
 *************************************************/
/*
 Correspond to a custom control (= button) on the map
 */
export class Control_Map {
  public controlDiv: any;
  public controlUI: any;
  public controlText: any;
  public action: any;

  constructor(text: any, action: any) {
    this.controlDiv = document.createElement('div');
    var newControl = Utils.createMapControlButton(text);
    this.controlUI = newControl.controlUI;
    this.controlText = newControl.controlText;
    this.controlDiv.appendChild(newControl.controlUI);

    // Setup the click event listeners.
    this.controlUI.addEventListener('click', () => {
      action(this);
    });
  }

  public change_action(newAction, newText) {
    this.controlUI.removeEventListener('click', this.action);
    this.controlText.innerHTML = newText;
    this.controlUI.addEventListener('click', newAction);
  }
}
