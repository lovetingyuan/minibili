const fs = require("node:fs");
const path = require("node:path");

const { withDangerousMod } = require("expo/config-plugins");

const MEDIA_NOTIFICATION_ICON_RESOURCE = `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <item name="media3_icon_circular_play" type="drawable">@drawable/notification_icon</item>
  <item name="media3_notification_small_icon" type="drawable">@drawable/notification_icon</item>
</resources>
`;

/**
 * expo-video currently hard-codes a Media3 playback icon for its Android notification.
 * Override that library resource from the app layer so dependency sources stay untouched.
 */
module.exports = function withMediaNotificationIcon(config) {
  return withDangerousMod(config, [
    "android",
    async (modConfig) => {
      const valuesDirectory = path.join(
        modConfig.modRequest.projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        "values",
      );
      fs.mkdirSync(valuesDirectory, { recursive: true });
      fs.writeFileSync(
        path.join(valuesDirectory, "media_notification_icon.xml"),
        MEDIA_NOTIFICATION_ICON_RESOURCE,
      );
      return modConfig;
    },
  ]);
};
