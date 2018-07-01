import sys
try:
    import soco
    from soco.music_services import MusicService
    from soco.data_structures import DidlItem, to_didl_string
except ImportError:
    print("Error")
    print("---")
    print("You need to istall >>soco<< | href=https://github.com/SoCo/SoCo")
    sys.exit(0)


def topography(player):
    # for group in player.all_groups:
    return [
        {
            "name": group.coordinator.player_name,
            "players": [{
                "name": player.player_name,
                "volume": player.volume
            }
            for player in group.members],
            "track": group.coordinator.get_current_track_info(),
            "state": group.coordinator.get_current_transport_info()['current_transport_state']
        } for group in player.all_groups
    ]

def radiostations(player):
    return player.get_favorite_radio_stations()["favorites"]

def playlists(player):
    return [playlist.title for playlist in player.get_sonos_playlists()]

def get_all_players():
    """Returns a Dict with all players"""
    return {x.player_name: x for x in soco.discover()}

def get_favorites(player):
  return player.get_sonos_favorites()["favorites"]