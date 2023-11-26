import GObject from "gi://GObject";
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
      let soundPath = extensionPath + "/src/sounds/clown.ogg";

      this.player = global.display.get_sound_player();
      this.sound = Gio.File.new_for_path(soundPath);

      this.connect("button-press-event", () => {
          this.player.play_from_file(this.sound, "clown", null);
      });
    }
  }
);

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
