from flask import Flask
from flask import request
from flask import send_from_directory
import json
import sonos
import os
app = Flask(__name__)

THIS_DIR = os.path.dirname(os.path.realpath(__file__))
players = sonos.get_all_players()
player = next(iter(players.values()))

@app.route('/api/topography')
def topography():
    return json.dumps(sonos.topography(player))

@app.route('/api/radiostations')
def radiostations():
    return json.dumps(sonos.radiostations(player))

@app.route('/api/playlists')
def playlists():
    return json.dumps(sonos.playlists(player))

@app.route('/api/favorites')
def favorites():
    return json.dumps(sonos.get_favorites(player))

@app.route('/api/<player_name>/<command>')
@app.route('/api/<player_name>/<command>/<operator>')
def api_command(player_name, command, operator=None):
    if command in commands:
        result = commands[command](player_name, operator, request.args.to_dict())
        return json.dumps({
            "player": player_name,
            "command": command,
            "operator": operator,
            "result": result
            })
    else:
        return json.dumps({
            "Error": "Unspecified"
            })

@app.route('/js/<filename>')
def js_files(filename):
    return send_from_directory("{}/../js".format(THIS_DIR), filename)

@app.route('/css/<css_file>')
def css_files(css_file):
    return send_from_directory("{}/../css".format(THIS_DIR), css_file)

@app.route('/fonts/<filename>')
def fonts_files(filename):
    return send_from_directory("{}/../fonts".format(THIS_DIR), filename)

@app.route('/img/<filename>')
def image_files(filename):
    return send_from_directory("{}/../img".format(THIS_DIR), filename)

@app.route('/manifest.json')
def manifest_file():
    return send_from_directory("{}/..".format(THIS_DIR),"manifest.json")

@app.route('/')
@app.route('/index.html')
def index_file():
    return send_from_directory("{}/..".format(THIS_DIR),"index.html")

def set_volume(player_name, volume, args):
    try:
        players[player_name].volume = volume
        return volume
    except:
        raise ValueError("Unable to set volume for {}".format(player_name))

def join(player_name, target, args):
    try:
        players[player_name].join(players[target])
        return "Joined"
    except:
        raise ValueError("Unable to join {} to {}".format(player_name, target))

def unjoin(player_name, target, args):
    try:
        players[player_name].unjoin()
        return "Unjoined"
    except:
        raise ValueError("Unable to unjoin {}".format(player_name))

def play(player_name, operator, args):
    try:
        players[player_name].group.coordinator.play()
        return "Playing"
    except:
        raise ValueError("Unable to play {}".format(player_name))

def pause(player_name, operator, args):
    try:
        players[player_name].group.coordinator.pause()
        return "Playing"
    except:
        raise ValueError("Unable to pause {}".format(player_name))

def play_custom_stream(player_name, operator, args):
    print("Playing custom track")
    try:
        players[player_name].group.coordinator.play_uri(
            args["url"],
            title=args["title"])
        players[player_name].group.coordinator.play()
        return "Playing"
    except:
        raise ValueError("Unable to play {} stream on {}".format(
            args["title"], player_name)
        )

def get_songs_from_playlist(player, playlist_name):
    """Returns a list of songs from the given playlist"""
    lists = player.get_sonos_playlists()
    for playlist in lists:
        if playlist.title == playlist_name:
            return player.music_library.browse(playlist)

def play_playlist(player_name, playlist_name, args):
    """Replaces the queue with the selected playlist"""
    print("Playing playlist")
    player = players[player_name].group.coordinator
    songs = get_songs_from_playlist(player, playlist_name)
    print(songs)
    player.clear_queue()
    for song in songs:
        player.add_to_queue(song)
    player.play_from_queue(0)
    return "Playing {}".format(playlist_name)


commands = {
    "volume": set_volume,
    "join": join,
    "unjoin": unjoin,
    "play": play,
    "pause": pause,
    "custom": play_custom_stream,
    "playlist": play_playlist
}

if __name__ == '__main__':
    app.run(use_reloader=True, port=8000)

