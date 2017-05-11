/*************************************************
 ****************** MAP STYLE ********************
 *************************************************/
// All the icons used on the map
const icons = {
    tower_locked: {
      icon: {
        url: 'tower_red.svg',
        scaledSize: new google.maps.Size(35,35)
      }
    },
    tower_unlocked: {
      icon: {
        url: 'tower_green.svg',
        scaledSize: new google.maps.Size(35,35)
      }
    },
    user_pi: {
      icon: {
        url: 'user_pi.svg',
        scaledSize: null
      }
    },
    user_location: {
      icon: {
        url: 'point_orange.svg',
        scaledSize: new google.maps.Size(64,64)
      }
    },
    restaurant: {
      icon: {
        url: 'restaurant.svg',
        scaledSize: new google.maps.Size(35,35)
      }
    },
    sightseeing: {
      icon: {
        url: 'sightseeing.svg',
        scaledSize: new google.maps.Size(35,35)
      }
    },
    default: {
      icon: null
    }
  };

/**
 * Return the icon corresponding to the name given as parameter
 * (if user = true, display the user version of the icon (with a different color for example)
 *
 * @param name
 * @param user
 * @returns {{url: string, scaledSize: (google.maps.Size|null|any|Size)}}
 */
export function getIcon(name, user=false):any {
  let iconBase = 'assets/marker/'+ (user ? "user/" : "");
  let iconSettings = icons[name];

  // If not a known icon => display the default one
  if (typeof iconSettings === 'undefined' || name === 'default') {
    return icons['default'].icon;
  }

  let newIcon = {url: iconBase + iconSettings.icon.url, scaledSize:  iconSettings.icon.scaledSize};
  return newIcon;
}


// Style for each elem/feature on the map
export const mapstyle = [
  {elementType: 'geometry', stylers: [{color: '#242f3e'}]},
  {elementType: 'labels.text.stroke', stylers: [{color: '#242f3e'}]},
  {elementType: 'labels.text.fill', stylers: [{color: '#746855'}]},
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{color: '#d59563'}]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{color: '#d59563'}]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{color: '#263c3f'}]
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{color: '#6b9a76'}]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{color: '#38414e'}]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{color: '#212a37'}]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{color: '#9ca5b3'}]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{color: '#746855'}]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{color: '#1f2835'}]
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{color: '#f3d19c'}]
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{color: '#2f3948'}]
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{color: '#d59563'}]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{color: '#17263c'}]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{color: '#515c6d'}]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{color: '#17263c'}]
  }
];
