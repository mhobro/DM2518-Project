/**
 * Contains all the helper function for the map
 */
export default class Utils {

  /**
   * Calculates distance between two points in km's
   *
   * @param p1
   * @param p2
   * @returns {number}
   */
  static calcDistance(p1: google.maps.LatLng, p2: google.maps.LatLng): number {
    return google.maps.geometry.spherical.computeDistanceBetween(p1, p2); // Return the distance in meters
  }

  /**
   * Create a button to display on the map
   *
   * @param buttonText
   * @returns {{controlUI: HTMLElementTagNameMap[string], controlText: HTMLElementTagNameMap[string]}}
   */
  static createMapControlButton(buttonText) {
    // Set CSS for the control border.
    var controlUI = document.createElement('button');
    controlUI.style.backgroundColor = '#fff';
    controlUI.style.border = '2px solid #fff';
    controlUI.style.borderRadius = '3px';
    controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    controlUI.style.cursor = 'pointer';
    controlUI.style.marginBottom = '22px';
    controlUI.style.textAlign = 'center';

    // Set CSS for the control interior.
    var controlText = document.createElement('div');
    controlText.style.color = 'rgb(25,25,25)';
    controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
    controlText.style.fontSize = '16px';
    controlText.style.lineHeight = '38px';
    controlText.style.paddingLeft = '5px';
    controlText.style.paddingRight = '5px';
    controlText.innerHTML = buttonText;
    controlUI.appendChild(controlText);

    return {controlUI, controlText};
  }

  /**
   * Create a icon button with the specified onclickhandler given as paramater
   *
   * @param ionicIconName
   * @param onclickHandler
   * @returns {HTMLElementTagNameMap[string]}
   */
  static createIconButton(ionicIconName, onclickHandler) {
    var button = document.createElement('button');
    button.setAttribute("icon-only", "");
    button.setAttribute("ion-button", "");
    button.setAttribute("class", "map_control button button-md button-default button-default-md button-large button-large-md");
    button.style.transition = "none";
    //button.style.borderRadius = "50%";
    button.innerHTML = '<span class="button-inner">' +
      '<ion-icon role="img" class="icon icon-md ion-md-' + ionicIconName + ' ng-reflect-name="' + ionicIconName + '"></ion-icon> ' +
      '</span>' +
      ' <div class="button-effect"></div>' +
      '</button>';

    // Setup the click event listeners.
    button.addEventListener('click', onclickHandler);

    return button;
  }
}
