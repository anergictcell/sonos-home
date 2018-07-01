var API_BASE = "/api/"
function SonosZoneController(object){
  this.name = object.name
  this.isActive = false
  this.isPlaying = (object.state === "PLAYING")
  this.players = object.players.map(function(player){
    return new SonosPlayer(player)
  })
  return this
}

function SonosPlayer(object){
  this.name = object.name
  this.volume = object.volume
  return this
}

function RadioStation(object){
  this.name = object.title
  this.url = object.uri
  return this
}

function Favorite(object){
  this.name = object.title
  this.url = object.uri
  return this
}

function Playlist(name){
  this.name = name
  return this
}

function switchZoneController(zone) {
  // Deactivate all zones
  this.zones.map(function(zone){
    zone.isActive = false
  })
  // activate selected zone
  zone.isActive = true
  this.selctedZone = zone.name
}

function listAllPlayer() {
  allPlayers = []
  this.zones.forEach(function(zone){
      zone.players.forEach(function(player){
        allPlayers.push({
          player: player,
          isActive: zone.isActive
        })
      })
    })
  return allPlayers
}

function changePlayerZone(player, zone){
  var that = this
  if (player.isActive) {
    sendRequest(player.player.name, "unjoin")
      .then(function(res){
        that.$parent.update()
      })
      .catch(function(err){
        displayError(err)
      })
  } else {
    sendRequest(player.player.name, "join", zone.name)
      .then(function(res){
        that.$parent.update()
      })
      .catch(function(err){
        displayError(err)
      })
  }
}

function playPause(zone){
  var that = this
  if (zone.isPlaying) {
    sendRequest(zone.name, "pause")
      .then(function(res){
        that.$parent.update()
      })
      .catch(function(err){
        displayError(err)
      })
  } else {
    sendRequest(zone.name, "play")
      .then(function(res){
        // small timeout to give Sonos a chance to start playing
        setTimeout(that.$parent.update, 200)
      })
      .catch(function(err){
        displayError(err)
      })
  }
}

function changeVolume(player){
  var that = this
  sendRequest(player.player.name, "volume", player.player.volume)
    .then(function(res){
      that.$parent.update()
    })
    .catch(function(err){
      displayError(err)
    })
}

function playRadio(radio){
  var that = this
  sendRequest(
    this.zones.filter(zone => zone.isActive)[0].name,
    "custom",
    null,
    {
      "title": radio.name,
      "url": radio.url
    }
  )
    .then(function(res){
      // small timeout to give Sonos a chance to start playing
      setTimeout(that.update, 500)
    })
    .catch(function(err){
      displayError(err)
    })
}

function playPlaylist(playlist){
  sendRequest(
    this.zones.filter(zone => zone.isActive)[0].name,
    "playlist",
    playlist.name
  )
}

function playURL(){
  var that = this
  var url = document.querySelector("input#costumURL").value
  if (!url.startsWith("http")) {
    url = "http://" + url
  }
  sendRequest(
    this.zones.filter(zone => zone.isActive)[0].name,
    "custom",
    null,
    {
      "title": "Custom-URL",
      "url": url
    }
  )
    .then(function(res){
      // small timeout to give Sonos a chance to start playing
      setTimeout(that.update, 200)
    })
    .catch(function(err){
      displayError(err)
    })
}

function createURLParameters(params) {
    return Object.keys(params).map(function(key) {
        return [key, params[key]].map(encodeURIComponent).join("=");
    }).join("&");
} 

function update(){
  var that = this

  sendRequest("topography")
    .then(function(res){
      var zones = JSON.parse(res)
        .map(function(zone){return new SonosZoneController(zone)})
        .sort(function(a, b){return a.name > b.name})
      if (that.selctedZone) {
        (zones.filter(function(zone){
          return zone.name === that.selctedZone
        }) || zones)[0].isActive = true
      } else {
        zones[0].isActive = true
      }
      that.zones = zones
    })
    .catch(function(err){
      console.log(err)
      displayError("Unable to download topography")
    })

  sendRequest("radiostations")
    .then(function(res){
      that.radiostations = JSON.parse(res)
        .map(function(station){return new RadioStation(station)})
    })
    .catch(function(err){
      displayError("Unable to download radio stations")
      console.log(err)
    })

  sendRequest("favorites")
    .then(function(res){
      that.favorites = JSON.parse(res)
        .map(function(favorite){return new Favorite(favorite)})
    })
    .catch(function(err){
      displayError("Unable to download radio stations")
      console.log(err)
    })

  sendRequest("playlists")
    .then(function(res){
      that.playlists = JSON.parse(res)
        .map(function(playlist){return new Playlist(playlist)})
    })
    .catch(function(err){
      displayError("Unable to download playlists")
      console.log(err)
    })
}

function displayError(error){
  alert(error)
}

function sendRequest(player, command, value, params) {
  return new Promise(function(resolve, reject){
    var url = API_BASE + encodeURIComponent(player)
    if (command){
      url = url + "/" + encodeURIComponent(command)
    }
    if (value){
      url = url + "/" + encodeURIComponent(value)
    }
    if (params) {
      url = url + "?" + createURLParameters(params)
    }
    console.log("Calling: " + url)

    var httpRequest = new XMLHttpRequest();
    httpRequest.addEventListener("load", function(){
      if (this.status !== 200) {
        displayError("Error during the request")
        reject(this.status)
      } else {
        resolve(this.responseText)
      }
    })
    httpRequest.open('GET', url, true);
    httpRequest.send(); 
  })  
}


Vue.component("zone-page", {
  // template : '<p class="text">Controller page {{zone.name}}</p>',
  props : ["zone", "players"],
  methods: {
    "changePlayerZone": changePlayerZone,
    "playPause": playPause,
    "changeVolume": changeVolume
  }
})

Vue.filter("activeZone", function(zones){
  return zones.filter(zone => zone.isActive)[0]
})

var app = new Vue({
  el: '#app',
  data: {
    zones: [],
    radiostations: [],
    playlists: [],
    favorites: [],
    selctedZone: null
  },
  computed: {
    allPlayers: listAllPlayer
  },
  methods:{
    "switchZoneController": switchZoneController,
    "playRadio": playRadio,
    "playPlaylist": playPlaylist,
    "playURL": playURL,
    "update": update
  }
})

app.update()