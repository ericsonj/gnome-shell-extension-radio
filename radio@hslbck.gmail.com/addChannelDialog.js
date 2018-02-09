/*
    Copyright (C) 2016 Niels Rune Brandt <nielsrune@hotmail.com>
    Copyright (C) 2014-2017 hslbck <hslbck@gmail.com>
    Copyright (C) 2017-2018 Léo Andrès <leo@ndrs.fr>
    This file is distributed under the same license as the gnome-shell-extension-radio package.
*/

const Clutter = imports.gi.Clutter;
const Lang = imports.lang;
const St = imports.gi.St;
const ShellEntry = imports.ui.shellEntry;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Channel = Extension.imports.channel;
const ChannelListDialog = Extension.imports.channelListDialog;
const MyE = Extension.imports.extension;
const Convert = Extension.imports.convertCharset;
const ChannelCreator = Extension.imports.channelCreator;

// translation support
const Gettext = imports.gettext.domain("radio@hslbck.gmail.com");
const _ = Gettext.gettext;

let oldChannel = null;

var AddChannelDialog = new Lang.Class({
    Name: 'AddChannelDialog',
    Extends: ChannelCreator.ChannelCreator,

    _init: function (channel) {
      oldChannel = channel;
      this.parent({
          styleClass: 'run-dialog'
      });
      this._buildLayout();
    },

    _buildLayout: function () {

        // Entry for the name of the channel
        let name = new St.Label({
            style_class: 'run-dialog-label',
            text: _("Channel Name")
        });

        this.contentLayout.add(name, {
            y_align: St.Align.START
        });
        this._nameEntry = new St.Entry({
            style_class: 'run-dialog-entry',
            can_focus: true
        });
        ShellEntry.addContextMenu(this._nameEntry);
        this._nameEntry.label_actor = name;
        this._nameEntryText = this._nameEntry.clutter_text;
        this.contentLayout.add(this._nameEntry, {
            y_align: St.Align.START
        });

        // entry for the stream address of the channel
        let address = new St.Label({
            style_class: 'run-dialog-label',
            text: _("Stream Address")
        });
        this.contentLayout.add(address, {
            y_align: St.Align.START
        });
        this._addressEntry = new St.Entry({
            style_class: 'run-dialog-entry',
            can_focus: true
        });
        ShellEntry.addContextMenu(this._addressEntry);
        this._addressEntry.label_actor = address;
        this._addressEntryText = this._addressEntry.clutter_text;
        this.contentLayout.add(this._addressEntry, {
            y_align: St.Align.START
        });

        // entry for optional tag text charset conversion
        let charset = new St.Label({
            style_class: 'run-dialog-label',
            text: _("Charset (optional)")
        });
        this.contentLayout.add(charset, {
            y_align: St.Align.START
        });
        this._charsetEntry = new St.Entry({
            style_class: 'run-dialog-entry',
            can_focus: true
        });
        ShellEntry.addContextMenu(this._charsetEntry);
        this._charsetEntry.label_actor = charset;
        this._charsetEntryText = this._charsetEntry.clutter_text;
        this.contentLayout.add(this._charsetEntry, {
            y_align: St.Align.START
        });

        // set values when editing a channel
        this._setTextValues();

        // set focus on the name entry
        this.setInitialKeyFocus(this._nameEntryText);

        this._disconnectButton = this.addButton({
            action: Lang.bind(this, this._closeDialog),
            label: _("Cancel"),
            key: Clutter.Escape
        });

        let connectLabel = oldChannel != null ? _("Save") : _("Add");

        this._connectButton = this.addButton({
            action: Lang.bind(this, this._createChannel),
            label: connectLabel,
            key: Clutter.Return
        }, {
            expand: true,
            x_fill: false,
            x_align: St.Align.END
        });

        this._buildErrorLayout();
    },

    _setTextValues: function () {
        if (oldChannel != null) {
            this._nameEntry.set_text(oldChannel.getName());
            this._addressEntry.set_text(oldChannel.getUri());
            if(oldChannel.getEncoding() !== false) {
                this._charsetEntry.set_text(oldChannel.getEncoding());
            }
        }
    },

    // create a new channel
    _createChannel: function () {

        let inputName = this._nameEntry.get_text();
        let inputStream = this._getStreamAddress(this._addressEntry.get_text());

        if (inputStream) {
          let inputCharset = false;
          if (this._charsetEntry.get_text() !== "") {
              inputCharset = Convert.validate(this._charsetEntry.get_text().toLowerCase());
          }
          let newChannel = new Channel.Channel(inputName, inputStream, false, inputCharset);
          if (oldChannel != null) {
              if (oldChannel.getFavourite()){
                  newChannel.setFavourite(oldChannel.getFavourite());
              }
              MyE.radioMenu._deleteChannel(oldChannel);
          }
          MyE.radioMenu._addChannel(newChannel);
          if (newChannel.getFavourite()){
              MyE.radioMenu._destroyMenuItems();
              MyE.radioMenu._addToFavourites(newChannel);
              MyE.radioMenu._buildMenuItems();
          }
          this._closeDialog();
        }
    },

    _closeDialog: function() {
        this.close();
        if (oldChannel != null) {
            this.channelListDialog = new ChannelListDialog.ChannelListDialog();
            this.channelListDialog.open();
        }
    }
});
