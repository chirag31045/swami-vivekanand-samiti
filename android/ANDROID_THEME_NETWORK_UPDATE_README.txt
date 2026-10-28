Samiti Android UI update
========================

Changes:
- Uses Glide circleCrop() for volunteer and admin profile photos.
- Keeps existing navy/red app styling and existing offline dialog.
- Shows red connection-lost message and green restored message.
- Adds an amber slow-network message when Android reports low downstream bandwidth
  or the network has not yet been validated.

Apply:
1. Back up your current android folder.
2. Extract this ZIP into a temporary folder.
3. Copy the included app/ folder into your Android project, merging files.
4. Open Android Studio and Sync Gradle, then run on a real device.

Notes:
- Android may report bandwidth estimates that change frequently, so slow-network
  messages can appear more than once on unstable connections.
- This ZIP does not contain google-services.json or credentials. Keep your own
  Firebase configuration private.
- This is a source update; build and real-device push delivery should be verified
  in your own Android Studio environment.
