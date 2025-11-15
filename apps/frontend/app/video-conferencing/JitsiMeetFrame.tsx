"use client";

import React, { useEffect, useRef } from "react";
import { JoinSessionResponse } from "../../lib/api/endpoints/video-api";
import styles from "./jitsi-meet-frame.module.css";

interface Props {
  sessionInfo: JoinSessionResponse;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default function JitsiMeetFrame({ sessionInfo }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionInfo || !containerRef.current) return;

    const domain = sessionInfo.jitsiDomain;

    // Build options for self-hosted Jitsi
    const options: any = {
      roomName: sessionInfo.jitsiRoomName,
      width: "100%",
      height: "100%",
      parentNode: containerRef.current,
      userInfo: {
        displayName: sessionInfo.displayName,
      },
      configOverwrite: {
        // Prejoin/lobby settings
        prejoinPageEnabled: false,

        // Audio/video defaults
        startWithAudioMuted: sessionInfo.muteAll || false,
        startWithVideoMuted: sessionInfo.videoDisabled || false,

        // Disable all Jitsi branding and external links
        disableDeepLinking: true,
        enableWelcomePage: false,
        enableClosePage: false,

        // Remove branding
        hideConferenceSubject: false,
        hideConferenceTimer: false,

        // Performance and quality
        resolution: 720,
        constraints: {
          video: {
            height: { ideal: 720, max: 1080, min: 360 },
            width: { ideal: 1280, max: 1920, min: 640 },
          },
        },

        // Enable useful features
        enableNoisyMicDetection: true,
        enableNoAudioDetection: true,
        enableTalkWhileMuted: true,

        // Disable analytics and tracking
        disableThirdPartyRequests: true,
        analytics: {
          disabled: true,
        },

        // Remove all Google/third-party services
        googleApiApplicationClientID: undefined,
        microsoftApiApplicationClientID: undefined,
      },
      interfaceConfigOverwrite: {
        // COMPLETE WATERMARK REMOVAL
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        SHOW_POWERED_BY: false,

        // Remove promotional content
        SHOW_PROMOTIONAL_CLOSE_PAGE: false,
        SHOW_CHROME_EXTENSION_BANNER: false,

        // Custom branding (replace with your logo)
        APP_NAME: "LearnUp Platform",
        NATIVE_APP_NAME: "LearnUp",
        PROVIDER_NAME: "LearnUp",

        // Logo configuration (add your logo URL here)
        DEFAULT_LOGO_URL: undefined,
        DEFAULT_WELCOME_PAGE_LOGO_URL: undefined,

        // Toolbar customization
        TOOLBAR_BUTTONS: [
          "microphone",
          "camera",
          "closedcaptions",
          "desktop",
          "fullscreen",
          "fodeviceselection",
          "hangup",
          "chat",
          "raisehand",
          "videoquality",
          "filmstrip",
          "participants-pane",
          "tileview",
          "select-background",
          "settings",
          "shortcuts",
          "stats",
        ],

        // Settings customization
        SETTINGS_SECTIONS: ["devices", "language", "profile"],

        // Hide elements
        HIDE_INVITE_MORE_HEADER: true,

        // Mobile
        MOBILE_APP_PROMO: false,

        // Disable film strip (participant thumbnails) by default
        FILM_STRIP_MAX_HEIGHT: 120,

        // Video quality settings
        VIDEO_QUALITY_LABEL_DISABLED: false,

        // Connection indicator
        CONNECTION_INDICATOR_AUTO_HIDE_ENABLED: true,
        CONNECTION_INDICATOR_AUTO_HIDE_TIMEOUT: 5000,

        // Recent list
        RECENT_LIST_ENABLED: false,

        // Disable external links
        SUPPORT_URL: undefined,
        PRIVACY_POLICY_URL: undefined,
        TERMS_SERVICE_URL: undefined,
      },
    };

    // Only add JWT if provided (for Jitsi with token auth enabled)
    if (sessionInfo.jitsiToken) {
      options.jwt = sessionInfo.jitsiToken;
    }

    // Create Jitsi API instance
    const api = new window.JitsiMeetExternalAPI(domain, options);

    api.addEventListener("videoConferenceJoined", () => {
      console.log("Joined video conference as", sessionInfo.displayName);

      // If moderator, grant moderation permissions
      if (sessionInfo.isModerator) {
        console.log("User is moderator");
      }
    });

    api.addEventListener("videoConferenceLeft", () => {
      console.log("Left video conference");
    });

    api.addEventListener("participantJoined", (participant: any) => {
      console.log("Participant joined:", participant.displayName);
    });

    api.addEventListener("participantLeft", (participant: any) => {
      console.log("Participant left:", participant.id);
    });

    return () => {
      api.dispose();
    };
  }, [sessionInfo]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className={styles.jitsiContainer} />
    </div>
  );
}
