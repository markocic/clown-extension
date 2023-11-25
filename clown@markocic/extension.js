import GObject from "gi://GObject";
import Gst from "gi://Gst";
import GstAudio from "gi://GstAudio";
import St from "gi://St";
import Gio from "gi://Gio";

import {
  Extension,
  gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";

import * as Main from "resource:///org/gnome/shell/ui/main.js";

const Clown = GObject.registerClass(
  class Clown extends PanelMenu.Button {
    _init(extensionPath) {
      super._init(0.0, _("Clown"));

      let iconPath = extensionPath + "/src/icons/clown-face.svg";
      console.debug("Icon path: " + iconPath);
      let gicon = Gio.icon_new_for_string(`${iconPath}`);
      let icon = new St.Icon({
        gicon: gicon,
        style_class: "system-status-icon",
        icon_size: 16,
      });

      this.add_child(icon);
      let soundPath = "file://" + extensionPath + "/src/sounds/clown_vibe.ogg";
      let soundPlayer = new SoundPlayer(soundPath);
        soundPlayer.pause();

        this.play = false;
        // let display = global.get_display();
      // this.player = global.display.get_sound_player();

      this.connect("button-press-event", () => {
        // Main.notify(_("🤡"));
        this.play = !this.play;
          if (this.play) {

            soundPlayer.play();
          } else soundPlayer.pause();
          //   console.log(this.player);
          //
          // let sound = Gio.File.new_for_uri(soundPath);
          // this.player.play_from_file(sound, "clown", null);
          // console.log(sound);

      });
    }
  }
);

const SoundPlayer = class SoundPlayer {
  constructor(soundPath) {
    Gst.init(null);
    this.playbin = Gst.ElementFactory.make("playbin", "clown");
    this.playbin.set_property("uri", soundPath);
    this.sink = Gst.ElementFactory.make("pulsesink", "sink");
    this.playbin.set_property("audio-sink", this.sink);
    this.setVolume(1);

    this.prerolled = false;
    let bus = this.playbin.get_bus();
    bus.add_signal_watch();
    bus.connect("message", (bus, msg) => {
      if (msg != null) this._onMessageReceived(msg);
    });
  }

  play() {
    this.playbin.set_state(Gst.State.PLAYING);
  }

  pause() {
    this.playbin.set_state(Gst.State.NULL);
    this.prerolled = false;
  }

  setVolume(value) {
    this.playbin.set_volume(GstAudio.StreamVolumeFormat.LINEAR, value);

    let [rv, state, pstate] = this.playbin.get_state(Gst.State.NULL);
    if (value == 0) {
      this.playbin.set_state(Gst.State.NULL);
    } else if (state != Gst.State.PLAYING) {
      this.playbin.set_state(Gst.State.PLAYING);
    }
  }

  _onMessageReceived(message) {
    if (message.type == Gst.MessageType.SEGMENT_DONE) {
      this.playbin.seek_simple(Gst.Format.TIME, Gst.SeekFlags.SEGMENT, 0);
    }
    if (message.type == Gst.MessageType.ASYNC_DONE) {
      if (!this.prerolled) {
        this.playbin.seek_simple(
          Gst.Format.TIME,
          Gst.SeekFlags.FLUSH | Gst.SeekFlags.SEGMENT,
          0,
        );
        this.prerolled = true;
      }
    }

    return true;
  }

  getUri(sound) {
    /* All URIs are relative to $HOME. */
    return Gst.filename_to_uri(sound);
  }
};

export default class ClownExtension extends Extension {
  enable() {
    this._indicator = new Clown(this.path);
    Main.panel.addToStatusArea(this.uuid, this._indicator);
  }

  disable() {
    this._indicator.destroy();
    this._indicator = null;
  }
}
