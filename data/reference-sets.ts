// Reference sets (concept): what the AI "referenced" for each behavior — a face, a motion and a sound
// from Wikimedia Commons (CC0 / PD / CC BY / CC BY-SA), stored under public/reference-sets/.
// Shown with generated expressions so people can see where the expression came from.

export type ReferenceChannel = "face" | "motion" | "sound";

export interface ReferenceItem {
  channel: ReferenceChannel;
  title: string;
  /** What the AI took from it */
  note: string;
  /** Public path: image (.jpg/.png), video (.webm) or audio (.ogg) */
  file: string;
  poster: string | null;
  source: { title: string; page: string; author: string; license: string; excerpt: string };
}

export interface ReferenceSet {
  behavior: string;
  items: ReferenceItem[];
}

// Generated from public/reference-sets/manifest.json (collected 2026-10-17; attribution per item).
export const REFERENCE_SETS: ReferenceSet[] = [
  {
    "behavior": "idle",
    "items": [
      {
        "channel": "face",
        "title": "Relaxed cat, half-lidded eyes",
        "note": "Soft, half-closed eyelids with a calm gaze — used as the resting eye shape for idle.",
        "file": "/reference-sets/idle/face.jpg",
        "poster": null,
        "source": {
          "title": "File:Spike the relaxed cat (11341867505).jpg",
          "page": "https://commons.wikimedia.org/wiki/File:Spike_the_relaxed_cat_(11341867505).jpg",
          "author": "Bob Adams from George, South Africa",
          "license": "CC BY-SA 2.0",
          "excerpt": "full"
        }
      },
      {
        "channel": "motion",
        "title": "Fox resting, glancing around",
        "note": "Body stays still while the head makes small, unhurried turns — used for the occasional idle gaze shift.",
        "file": "/reference-sets/idle/motion.webm",
        "poster": "/reference-sets/idle/motion.jpg",
        "source": {
          "title": "File:A Chance to Relax.webm",
          "page": "https://commons.wikimedia.org/wiki/File:A_Chance_to_Relax.webm",
          "author": "Peter Trimming",
          "license": "CC BY 2.0",
          "excerpt": "22.0–28.0 s of 63.1 s"
        }
      },
      {
        "channel": "sound",
        "title": "Cat purring",
        "note": "A steady low purr with a slow in-out rhythm — used as the quiet breathing pulse of idle.",
        "file": "/reference-sets/idle/sound.ogg",
        "poster": null,
        "source": {
          "title": "File:Jupey purring.wav",
          "page": "https://commons.wikimedia.org/wiki/File:Jupey_purring.wav",
          "author": "Pangea1962",
          "license": "CC BY-SA 4.0",
          "excerpt": "0.0–8.0 s of 18.5 s"
        }
      }
    ]
  },
  {
    "behavior": "doze",
    "items": [
      {
        "channel": "face",
        "title": "Very sleepy cat",
        "note": "Eyes narrowed to slits while still upright — used for the heavy-lidded doze blink.",
        "file": "/reference-sets/doze/face.jpg",
        "poster": null,
        "source": {
          "title": "File:Very sleepy cat.jpg",
          "page": "https://commons.wikimedia.org/wiki/File:Very_sleepy_cat.jpg",
          "author": "KKPCW",
          "license": "CC BY-SA 4.0",
          "excerpt": "full"
        }
      },
      {
        "channel": "motion",
        "title": "Meerkat nodding off",
        "note": "Head sinks toward the ground, snaps back up, then starts drooping again — used for the droop-and-jolt doze loop.",
        "file": "/reference-sets/doze/motion.webm",
        "poster": "/reference-sets/doze/motion.jpg",
        "source": {
          "title": "File:Meerkat at Los Angeles Zoo.webm",
          "page": "https://commons.wikimedia.org/wiki/File:Meerkat_at_Los_Angeles_Zoo.webm",
          "author": "LA Zoo",
          "license": "CC BY 3.0",
          "excerpt": "3.5–9.5 s of 15.4 s"
        }
      },
      {
        "channel": "sound",
        "title": "Gelada yawn",
        "note": "A short drowsy yawn vocalisation — used as the sleepy cue between droops.",
        "file": "/reference-sets/doze/sound.ogg",
        "poster": null,
        "source": {
          "title": "File:Yawn vocalisation by a Gelada.wav",
          "page": "https://commons.wikimedia.org/wiki/File:Yawn_vocalisation_by_a_Gelada.wav",
          "author": "Luca Pedruzzi, Martina Francesconi, Elisabetta Palagi et Alban Lemasson",
          "license": "CC BY 4.0",
          "excerpt": "0.3–1.1 s of 1.1 s"
        }
      }
    ]
  },
  {
    "behavior": "sleep",
    "items": [
      {
        "channel": "face",
        "title": "Cat asleep, curled up",
        "note": "Fully closed eyes with the head resting on the body — used for the closed-eye sleep face.",
        "file": "/reference-sets/sleep/face.jpg",
        "poster": null,
        "source": {
          "title": "File:Madeira Sleepy Cat.JPG",
          "page": "https://commons.wikimedia.org/wiki/File:Madeira_Sleepy_Cat.JPG",
          "author": "TeWeBs",
          "license": "CC BY-SA 4.0",
          "excerpt": "full"
        }
      },
      {
        "channel": "motion",
        "title": "Fox sleeping curled",
        "note": "Curled into a ball with the head tucked and only slow breathing movement — used for the tucked sleep pose.",
        "file": "/reference-sets/sleep/motion.webm",
        "poster": "/reference-sets/sleep/motion.jpg",
        "source": {
          "title": "File:Mountain Moment- Sleepy Fox.webm",
          "page": "https://commons.wikimedia.org/wiki/File:Mountain_Moment-_Sleepy_Fox.webm",
          "author": "Mount Rainier National Park",
          "license": "CC BY 3.0",
          "excerpt": "27.0–33.0 s of 36.9 s"
        }
      },
      {
        "channel": "sound",
        "title": "Snoring",
        "note": "Long, slow snore cycles of a few seconds each — used to pace the sleep breathing.",
        "file": "/reference-sets/sleep/sound.ogg",
        "poster": null,
        "source": {
          "title": "File:Young man snoring.wav",
          "page": "https://commons.wikimedia.org/wiki/File:Young_man_snoring.wav",
          "author": "TONY LU",
          "license": "CC BY-SA 4.0",
          "excerpt": "0.7–8.7 s of 58.1 s"
        }
      }
    ]
  },
  {
    "behavior": "wake",
    "items": [
      {
        "channel": "face",
        "title": "Lion yawning",
        "note": "Eyes squeezed shut with a wide-open mouth — used for the stretch peak of waking.",
        "file": "/reference-sets/wake/face.jpg",
        "poster": null,
        "source": {
          "title": "File:Lion yawning (8951427369).jpg",
          "page": "https://commons.wikimedia.org/wiki/File:Lion_yawning_(8951427369).jpg",
          "author": "flowcomm",
          "license": "CC BY 2.0",
          "excerpt": "full"
        }
      },
      {
        "channel": "motion",
        "title": "Cat yawning in slow motion",
        "note": "Head lifts, a long yawn opens and closes, then the head settles — used for the wake-up stretch arc.",
        "file": "/reference-sets/wake/motion.webm",
        "poster": "/reference-sets/wake/motion.jpg",
        "source": {
          "title": "File:Cat yawning in slow motion.webm",
          "page": "https://commons.wikimedia.org/wiki/File:Cat_yawning_in_slow_motion.webm",
          "author": "Grendelkhan",
          "license": "CC BY-SA 4.0",
          "excerpt": "6.0–12.0 s of 19.3 s"
        }
      },
      {
        "channel": "sound",
        "title": "Rooster crow",
        "note": "A bright rising call — used as the wake-up trigger.",
        "file": "/reference-sets/wake/sound.ogg",
        "poster": null,
        "source": {
          "title": "File:Kukuriku.flac",
          "page": "https://commons.wikimedia.org/wiki/File:Kukuriku.flac",
          "author": "Yosef Ben Melamed",
          "license": "CC BY-SA 4.0",
          "excerpt": "0.6–3.8 s of 3.8 s"
        }
      }
    ]
  },
  {
    "behavior": "nod",
    "items": [
      {
        "channel": "face",
        "title": "Gentle smile",
        "note": "Relaxed eyes with a soft smile — used for the agreeable expression during a nod.",
        "file": "/reference-sets/nod/face.jpg",
        "poster": null,
        "source": {
          "title": "File:LJY, smiling woman, 12 February 2016.jpg",
          "page": "https://commons.wikimedia.org/wiki/File:LJY,_smiling_woman,_12_February_2016.jpg",
          "author": "유끼밤비",
          "license": "CC BY-SA 4.0",
          "excerpt": "full"
        }
      },
      {
        "channel": "motion",
        "title": "Water dragon head bob",
        "note": "A quick down-up dip of the head from a still pose — used for the short vertical nod stroke.",
        "file": "/reference-sets/nod/motion.webm",
        "poster": "/reference-sets/nod/motion.jpg",
        "source": {
          "title": "File:Australian Water Dragon - Head Bobbing - edited.webm",
          "page": "https://commons.wikimedia.org/wiki/File:Australian_Water_Dragon_-_Head_Bobbing_-_edited.webm",
          "author": "Andrew Mercer (www.baldwhiteguy.co.nz)",
          "license": "CC BY-SA 4.0",
          "excerpt": "24.5–30.5 s of 41.6 s"
        }
      },
      {
        "channel": "sound",
        "title": "\"Uh-huh\"",
        "note": "A short spoken affirmative murmur — used to time the down-up beat of the nod.",
        "file": "/reference-sets/nod/sound.ogg",
        "poster": null,
        "source": {
          "title": "File:LL-Q1860 (eng)-Wodencafe-uh-huh.wav",
          "page": "https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Wodencafe-uh-huh.wav",
          "author": "Wodencafe",
          "license": "CC0",
          "excerpt": "full"
        }
      }
    ]
  },
  {
    "behavior": "shake",
    "items": [
      {
        "channel": "face",
        "title": "Grumpy cat",
        "note": "Downturned mouth and flat, unimpressed eyes — used for the refusal expression.",
        "file": "/reference-sets/shake/face.jpg",
        "poster": null,
        "source": {
          "title": "File:Grumpy Cat (cropped close).jpg",
          "page": "https://commons.wikimedia.org/wiki/File:Grumpy_Cat_(cropped_close).jpg",
          "author": "Gage Skidmore from Peoria, AZ, United States of America",
          "license": "CC BY-SA 2.0",
          "excerpt": "full"
        }
      },
      {
        "channel": "motion",
        "title": "Person shaking head",
        "note": "Repeated side-to-side head turns of small, even amplitude — used for the no-shake yaw swing.",
        "file": "/reference-sets/shake/motion.webm",
        "poster": "/reference-sets/shake/motion.jpg",
        "source": {
          "title": "File:Head Shake.webm",
          "page": "https://commons.wikimedia.org/wiki/File:Head_Shake.webm",
          "author": "NMu11er",
          "license": "CC BY-SA 4.0",
          "excerpt": "full"
        }
      },
      {
        "channel": "sound",
        "title": "Error buzzer",
        "note": "A short flat buzz — used as the negative cue for refusal.",
        "file": "/reference-sets/shake/sound.ogg",
        "poster": null,
        "source": {
          "title": "File:Buzzer.wav",
          "page": "https://commons.wikimedia.org/wiki/File:Buzzer.wav",
          "author": "David Pride",
          "license": "CC0",
          "excerpt": "full"
        }
      }
    ]
  },
  {
    "behavior": "look_around",
    "items": [
      {
        "channel": "face",
        "title": "Meerkat face",
        "note": "Wide, dark, watchful eyes — used for the open-eyed scanning look.",
        "file": "/reference-sets/look_around/face.jpg",
        "poster": null,
        "source": {
          "title": "File:Face of meerkat.jpg",
          "page": "https://commons.wikimedia.org/wiki/File:Face_of_meerkat.jpg",
          "author": "Kongkham6211",
          "license": "CC BY-SA 4.0",
          "excerpt": "full"
        }
      },
      {
        "channel": "motion",
        "title": "Barn owl turning its head",
        "note": "Body stays fixed while the head swivels left and right with pauses — used for the scan-and-hold head turns.",
        "file": "/reference-sets/look_around/motion.webm",
        "poster": "/reference-sets/look_around/motion.jpg",
        "source": {
          "title": "File:Barn owl.webm",
          "page": "https://commons.wikimedia.org/wiki/File:Barn_owl.webm",
          "author": "Dennis.insect.filmer",
          "license": "CC BY-SA 4.0",
          "excerpt": "5.0–11.0 s of 61.3 s"
        }
      },
      {
        "channel": "sound",
        "title": "Woodland birdsong",
        "note": "Bird calls arriving from different directions — used as the prompt to turn toward each sound.",
        "file": "/reference-sets/look_around/sound.ogg",
        "poster": null,
        "source": {
          "title": "File:Bourne woods 2020-05-15 0754.mp3",
          "page": "https://commons.wikimedia.org/wiki/File:Bourne_woods_2020-05-15_0754.mp3",
          "author": "Robert EA Harvey",
          "license": "CC BY-SA 4.0",
          "excerpt": "3.6–11.6 s of 82.6 s"
        }
      }
    ]
  },
  {
    "behavior": "curious",
    "items": [
      {
        "channel": "face",
        "title": "Dog tilting its head",
        "note": "Head canted to one side with ears up — used for the curious head-tilt angle.",
        "file": "/reference-sets/curious/face.jpg",
        "poster": null,
        "source": {
          "title": "File:Boss, prawie owczarek belgijski Malinois (2007-11-04) 1.jpg",
          "page": "https://commons.wikimedia.org/wiki/File:Boss,_prawie_owczarek_belgijski_Malinois_(2007-11-04)_1.jpg",
          "author": "Olgierd Rudak",
          "license": "CC BY-SA 4.0",
          "excerpt": "full"
        }
      },
      {
        "channel": "motion",
        "title": "Cat watching a fish tank",
        "note": "Leans in, peeks and follows the moving fish with small head shifts — used for the curious lean and tilt.",
        "file": "/reference-sets/curious/motion.webm",
        "poster": "/reference-sets/curious/motion.jpg",
        "source": {
          "title": "File:Cat reacting to a fish tank.webm",
          "page": "https://commons.wikimedia.org/wiki/File:Cat_reacting_to_a_fish_tank.webm",
          "author": "Danmation",
          "license": "CC BY 3.0",
          "excerpt": "20.0–26.0 s of 31.1 s"
        }
      },
      {
        "channel": "sound",
        "title": "Questioning meow",
        "note": "A short rising meow — used as the inquisitive cue.",
        "file": "/reference-sets/curious/sound.ogg",
        "poster": null,
        "source": {
          "title": "File:Meow of a Siamese cat - freemaster2.wav",
          "page": "https://commons.wikimedia.org/wiki/File:Meow_of_a_Siamese_cat_-_freemaster2.wav",
          "author": "freemaster2",
          "license": "CC0",
          "excerpt": "full"
        }
      }
    ]
  },
  {
    "behavior": "happy",
    "items": [
      {
        "channel": "face",
        "title": "Smiling dog",
        "note": "Open mouth and bright, wide eyes — used for the joyful face.",
        "file": "/reference-sets/happy/face.jpg",
        "poster": null,
        "source": {
          "title": "File:Smiling Dog (2594247316).jpg",
          "page": "https://commons.wikimedia.org/wiki/File:Smiling_Dog_(2594247316).jpg",
          "author": "Rennett Stowe from USA",
          "license": "CC BY 2.0",
          "excerpt": "full"
        }
      },
      {
        "channel": "motion",
        "title": "Lambs jumping",
        "note": "Springy hops and quick bounces off the ground — used for the bouncing rhythm of joy.",
        "file": "/reference-sets/happy/motion.webm",
        "poster": "/reference-sets/happy/motion.jpg",
        "source": {
          "title": "File:Playful Lambs, Dartmoor.webm",
          "page": "https://commons.wikimedia.org/wiki/File:Playful_Lambs,_Dartmoor.webm",
          "author": "Miles Wolstenholme",
          "license": "CC BY 2.0",
          "excerpt": "9.0–15.0 s of 27.1 s"
        }
      },
      {
        "channel": "sound",
        "title": "Laughter",
        "note": "Bursts of laughter in quick pulses — used to time the happy bounces.",
        "file": "/reference-sets/happy/sound.ogg",
        "poster": null,
        "source": {
          "title": "File:72843 lonemonk approx-800-laughter-only-1.wav",
          "page": "https://commons.wikimedia.org/wiki/File:72843_lonemonk_approx-800-laughter-only-1.wav",
          "author": "lonemonk on freesound.org",
          "license": "CC BY 3.0",
          "excerpt": "0.0–8.0 s of 13.8 s"
        }
      }
    ]
  },
  {
    "behavior": "sad",
    "items": [
      {
        "channel": "face",
        "title": "Dog with sad eyes",
        "note": "Head lowered to the floor with upturned eyes — used for the downcast sad gaze.",
        "file": "/reference-sets/sad/face.jpg",
        "poster": null,
        "source": {
          "title": "File:Practicing My \"Sad Eyes\" Look (15171381719).jpg",
          "page": "https://commons.wikimedia.org/wiki/File:Practicing_My_%22Sad_Eyes%22_Look_(15171381719).jpg",
          "author": "cogdogblog",
          "license": "CC BY 2.0",
          "excerpt": "full"
        }
      },
      {
        "channel": "motion",
        "title": "Donkey standing in the rain",
        "note": "Head hangs low and barely moves — used for the dropped-head, slumped sad pose.",
        "file": "/reference-sets/sad/motion.webm",
        "poster": "/reference-sets/sad/motion.jpg",
        "source": {
          "title": "File:Sad donkey in the rain.webm",
          "page": "https://commons.wikimedia.org/wiki/File:Sad_donkey_in_the_rain.webm",
          "author": "Matt Zimmerman",
          "license": "CC BY 2.0",
          "excerpt": "0.0–4.0 s of 33.8 s"
        }
      },
      {
        "channel": "sound",
        "title": "Sad trombone",
        "note": "Four descending notes, the last one drawn out — used for the slow downward sag.",
        "file": "/reference-sets/sad/sound.ogg",
        "poster": null,
        "source": {
          "title": "File:Sad Trombone.wav",
          "page": "https://commons.wikimedia.org/wiki/File:Sad_Trombone.wav",
          "author": "Sad Tromboner",
          "license": "CC BY 4.0",
          "excerpt": "full"
        }
      }
    ]
  },
  {
    "behavior": "alert",
    "items": [
      {
        "channel": "face",
        "title": "Alert tabby cat",
        "note": "Ears pricked forward and eyes wide open — used for the alert stare.",
        "file": "/reference-sets/alert/face.jpg",
        "poster": null,
        "source": {
          "title": "File:Tabby Cat with Toy Mouse.jpg",
          "page": "https://commons.wikimedia.org/wiki/File:Tabby_Cat_with_Toy_Mouse.jpg",
          "author": "TudorTulok",
          "license": "CC BY-SA 4.0",
          "excerpt": "full"
        }
      },
      {
        "channel": "motion",
        "title": "Roe deer lifting its head",
        "note": "Grazing head-down, then the head snaps up and freezes — used for the fast alert lift and hold.",
        "file": "/reference-sets/alert/motion.webm",
        "poster": "/reference-sets/alert/motion.jpg",
        "source": {
          "title": "File:European roe deer (Capreolus capreolus) in Slovakia.webm",
          "page": "https://commons.wikimedia.org/wiki/File:European_roe_deer_(Capreolus_capreolus)_in_Slovakia.webm",
          "author": "Lubo Ondrasko",
          "license": "CC BY 3.0",
          "excerpt": "17.0–23.0 s of 26.0 s"
        }
      },
      {
        "channel": "sound",
        "title": "Blackbird alarm call",
        "note": "Sharp, repeated alarm chips — used as the startle trigger.",
        "file": "/reference-sets/alert/sound.ogg",
        "poster": null,
        "source": {
          "title": "File:Blackbird (Turdus merula) alarm calls - Oslo, Norway 2020-11-13.mp3",
          "page": "https://commons.wikimedia.org/wiki/File:Blackbird_(Turdus_merula)_alarm_calls_-_Oslo,_Norway_2020-11-13.mp3",
          "author": "Ryan Hodnett",
          "license": "CC BY-SA 4.0",
          "excerpt": "full"
        }
      }
    ]
  },
  {
    "behavior": "greet",
    "items": [
      {
        "channel": "face",
        "title": "Thai wai greeting",
        "note": "Hands pressed together with a lowered, friendly gaze — used for the polite greeting expression.",
        "file": "/reference-sets/greet/face.jpg",
        "poster": null,
        "source": {
          "title": "File:Bowing Thai greeting.jpg",
          "page": "https://commons.wikimedia.org/wiki/File:Bowing_Thai_greeting.jpg",
          "author": "Kru Tony Moore",
          "license": "CC BY-SA 4.0",
          "excerpt": "full"
        }
      },
      {
        "channel": "motion",
        "title": "Dickson Greeting (1891)",
        "note": "A man tips his hat across his chest with a slight dip of the head — used for the small greeting bow.",
        "file": "/reference-sets/greet/motion.webm",
        "poster": "/reference-sets/greet/motion.jpg",
        "source": {
          "title": "File:Dickson Greeting (1891).webm",
          "page": "https://commons.wikimedia.org/wiki/File:Dickson_Greeting_(1891).webm",
          "author": "William Kennedy Dickson",
          "license": "Public domain",
          "excerpt": "0.0–6.0 s of 14.6 s"
        }
      },
      {
        "channel": "sound",
        "title": "Doorbell",
        "note": "A two-tone ding-dong — used as the hello cue.",
        "file": "/reference-sets/greet/sound.ogg",
        "poster": null,
        "source": {
          "title": "File:Doorbell.wav",
          "page": "https://commons.wikimedia.org/wiki/File:Doorbell.wav",
          "author": "Are shyde",
          "license": "CC BY 4.0",
          "excerpt": "full"
        }
      }
    ]
  },
  {
    "behavior": "sweep",
    "items": [
      {
        "channel": "face",
        "title": "Great horned owl, eyes wide",
        "note": "Large, fixed, wide-open eyes — used for the searchlight stare during the sweep.",
        "file": "/reference-sets/sweep/face.jpg",
        "poster": null,
        "source": {
          "title": "File:Great Horned Owl - eyes wide open.jpg",
          "page": "https://commons.wikimedia.org/wiki/File:Great_Horned_Owl_-_eyes_wide_open.jpg",
          "author": "Wildreturn",
          "license": "CC BY 2.0",
          "excerpt": "full"
        }
      },
      {
        "channel": "motion",
        "title": "Rotating lighthouse lens",
        "note": "A slow, constant-speed rotation around a fixed base — used for the wide base pan.",
        "file": "/reference-sets/sweep/motion.webm",
        "poster": "/reference-sets/sweep/motion.jpg",
        "source": {
          "title": "File:Fresnel lenses rotating at Split Rock Lighthouse.webm",
          "page": "https://commons.wikimedia.org/wiki/File:Fresnel_lenses_rotating_at_Split_Rock_Lighthouse.webm",
          "author": "Myotus",
          "license": "CC BY-SA 4.0",
          "excerpt": "4.0–10.0 s of 24.1 s"
        }
      },
      {
        "channel": "sound",
        "title": "Bat sonar",
        "note": "Evenly spaced echolocation pulses — used as the scanning ping rhythm.",
        "file": "/reference-sets/sweep/sound.ogg",
        "poster": null,
        "source": {
          "title": "File:Eptesicus nilssonooo sonar.wav",
          "page": "https://commons.wikimedia.org/wiki/File:Eptesicus_nilssonooo_sonar.wav",
          "author": "Rauno Kalda",
          "license": "CC BY-SA 3.0",
          "excerpt": "0.0–8.0 s of 17.4 s"
        }
      }
    ]
  },
  {
    "behavior": "focus",
    "items": [
      {
        "channel": "face",
        "title": "Cat staring",
        "note": "Unblinking, centred eyes locked straight ahead — used for the focused stare.",
        "file": "/reference-sets/focus/face.jpg",
        "poster": null,
        "source": {
          "title": "File:Cat with staring eyes.jpg",
          "page": "https://commons.wikimedia.org/wiki/File:Cat_with_staring_eyes.jpg",
          "author": "Rosendahl",
          "license": "Public domain",
          "excerpt": "full"
        }
      },
      {
        "channel": "motion",
        "title": "Fox listening for a mouse",
        "note": "Stops mid-step and holds dead still, facing forward — used for the frozen focus hold.",
        "file": "/reference-sets/focus/motion.webm",
        "poster": "/reference-sets/focus/motion.jpg",
        "source": {
          "title": "File:Red fox (Vulpes vulpes) looking for a mouse.webm",
          "page": "https://commons.wikimedia.org/wiki/File:Red_fox_(Vulpes_vulpes)_looking_for_a_mouse.webm",
          "author": "Lubo Ondrasko",
          "license": "CC BY 3.0",
          "excerpt": "34.0–40.0 s of 73.9 s"
        }
      },
      {
        "channel": "sound",
        "title": "Metronome at 60 bpm",
        "note": "Steady one-per-second ticks — used as the calm, even pulse of concentration.",
        "file": "/reference-sets/focus/sound.ogg",
        "poster": null,
        "source": {
          "title": "File:Metronome 60bpm.wav",
          "page": "https://commons.wikimedia.org/wiki/File:Metronome_60bpm.wav",
          "author": "ざっとの編集所",
          "license": "CC0",
          "excerpt": "0.0–8.0 s of 61.0 s"
        }
      }
    ]
  },
  {
    "behavior": "home",
    "items": [
      {
        "channel": "face",
        "title": "Content cat on a blanket",
        "note": "Eyes half closed in contentment, settled into the blanket — used for the at-rest face.",
        "file": "/reference-sets/home/face.jpg",
        "poster": null,
        "source": {
          "title": "File:Cat kneading and sucking blanket 2.jpg",
          "page": "https://commons.wikimedia.org/wiki/File:Cat_kneading_and_sucking_blanket_2.jpg",
          "author": "Watchduck (T. Piesk)",
          "license": "CC BY-SA 4.0",
          "excerpt": "full"
        }
      },
      {
        "channel": "motion",
        "title": "Cat curling up on a sofa",
        "note": "Turns, curls in and settles with motion fading to stillness — used for the return-to-rest settle.",
        "file": "/reference-sets/home/motion.webm",
        "poster": "/reference-sets/home/motion.jpg",
        "source": {
          "title": "File:Cat relaxing on a sofa.webm",
          "page": "https://commons.wikimedia.org/wiki/File:Cat_relaxing_on_a_sofa.webm",
          "author": "Ivan Kurmanov",
          "license": "CC BY 2.0",
          "excerpt": "10.5–16.5 s of 17.7 s"
        }
      },
      {
        "channel": "sound",
        "title": "Singing bowl strike",
        "note": "One strike with a long fading ring — used for the settle-down decay.",
        "file": "/reference-sets/home/sound.ogg",
        "poster": null,
        "source": {
          "title": "File:Tibetan Singing Bowl hit 4.5inch.flac",
          "page": "https://commons.wikimedia.org/wiki/File:Tibetan_Singing_Bowl_hit_4.5inch.flac",
          "author": "דג בלי מלח",
          "license": "CC BY-SA 4.0",
          "excerpt": "0.0–8.0 s of 23.8 s"
        }
      }
    ]
  }
];

export function referenceSetFor(behavior: string): ReferenceSet | undefined {
  return REFERENCE_SETS.find((s) => s.behavior === behavior);
}
