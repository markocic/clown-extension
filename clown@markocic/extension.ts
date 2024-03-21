import Gio from "gi://Gio";
import GObject from "gi://GObject";
import St from "gi://St";
import {
  Extension,
  gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";

class ClownButton extends PanelMenu.Button {

constructor(menuAlignment: number, nameText: string, dontCreateMenu?: boolean, extensionPath?: string) {
    super(menuAlignment, _(nameText), dontCreateMenu);

    let iconPath = extensionPath + "/src/icons/clown-face.svg";
    let gicon = Gio.icon_new_for_string(`${iconPath}`);
    let icon = new St.Icon({
      gicon : gicon,
      styleClass : "system-status-icon",
      iconSize : 16,
    });

    this.add_child(icon);
    let soundPath = extensionPath + "/src/sounds/clown.ogg";

    let player = global.display.get_sound_player();
    let sound = Gio.File.new_for_path(soundPath);

    this.connect("button-press-event",
                 () => player.play_from_file(sound, "clown", null) );
    this.connect("touch-event",
                 () => player.play_from_file(sound, "clown", null) );
  }
};

const clownButton = GObject.registerClass(ClownButton);

export default class ClownExtension extends Extension {
  gsettings?: Gio.Settings
  _indicator: ClownButton | null

  enable() {
    this._indicator = new ClownButton(0, "Clown", false, this.path);
    Main.panel.addToStatusArea(this.uuid, this._indicator);
  }

  disable() {
      if (this._indicator !== null) {
          this._indicator.destroy();
          this._indicator = null;
      }
  }
}
