import Gio from "gi://Gio";
import GObject from "gi://GObject";
import St from "gi://St";
import GLib from "gi://GLib";
import Meta from "gi://Meta";
import Clutter from "gi://Clutter"

import {
  Extension,
  gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";

class ClownButton extends PanelMenu.Button {
  constructor(
    menuAlignment: number,
    nameText: string,
    dontCreateMenu?: boolean,
    extensionPath?: string,
  ) {
    super(menuAlignment, _(nameText), dontCreateMenu);

    let iconPath = extensionPath + "/src/icons/clown-face.svg";
    let gicon = Gio.icon_new_for_string(`${iconPath}`);
    let icon = new St.Icon({
      gicon: gicon,
      styleClass: "system-status-icon",
      iconSize: 16,
    });

    this.add_child(icon);
  }
}

GObject.registerClass(ClownButton);

export default class ClownExtension extends Extension {
  gsettings?: Gio.Settings;
  _indicator: ClownButton | null;
  _SOUND_DURATION: number = 7583; // sound duration in milliseconds
  _sound: Gio.File;
  _GLibLoopId: number | null;
  _player: Meta.SoundPlayer | null;
  _status: "playing" | "not_playing" = "not_playing";
  _cancellable: Gio.Cancellable = new Gio.Cancellable();

  playSound(event: Clutter.Event) {
      console.log("EVENT: " + event.type())
      if (event.type() !== Clutter.EventType.BUTTON_PRESS || event.type() !== Clutter.EventType.TOUCH_END)
          return;

    if (this._status === "playing") {
      this._cancellable.cancel();
      this._cancellable = new Gio.Cancellable();
      this._status = "not_playing";

      if (this._GLibLoopId !== null) GLib.source_remove(this._GLibLoopId);
    } else if (this._status === "not_playing") {
      this._status = "playing";

      this._player?.play_from_file(this._sound, "clown", this._cancellable);
      this._GLibLoopId = GLib.timeout_add(
        GLib.PRIORITY_DEFAULT,
        this._SOUND_DURATION,
        () => {
          this._player?.play_from_file(this._sound, "clown", this._cancellable);

          return GLib.SOURCE_CONTINUE;
        },
      );
    }
  }

  enable() {
    this._indicator = new ClownButton(0, "Clown", false, this.path);
    this._sound = Gio.File.new_for_path(`${this.path}/src/sounds/clown.ogg`);
    this._player = global.display.get_sound_player();
    this._indicator.connect("button-press-event", ( actor, event ) => this.playSound(event) );
    this._indicator.connect("touch-event", (actor, event) => this.playSound(event));

    Main.panel.addToStatusArea(this.uuid, this._indicator);
  }

  disable() {
    this._indicator?.destroy();
    this._indicator = null;

    if (this._GLibLoopId) {
      GLib.Source.remove(this._GLibLoopId);
      this._GLibLoopId = null;
    }

    this._cancellable.cancel();
    this._player = null;
  }
}
