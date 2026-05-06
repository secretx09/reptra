# Reptra Auth Redirects

Reptra currently supports two auth redirect styles:

## Expo Go Development

Use the active redirect shown in the app at:

`Account > Open Setup Checklist > Active Redirect`

This often looks like:

`exp://.../--/auth/callback`

Expo Go redirects can change when your local IP address changes.

If Expo Go opens the project but the app never receives the confirmation or
reset parameters, copy the full email link and paste it into:

`Account > Need help signing in > Confirm Pasted Link`

That gives the development app a manual recovery path when the email client or
browser does not hand the deep link back correctly.

## Installed Builds

Use this stable redirect for development builds, preview builds, and production builds:

`reptra://auth/callback`

This requires an installed Reptra build. A normal phone without Expo Go will not know how to open an `exp://` link.

## Supabase Setup

In Supabase, go to:

`Authentication > URL Configuration`

Add the current Expo Go redirect while developing, and add the production redirect before testing installed builds:

`reptra://auth/callback`

Later, Reptra should also use universal links, such as:

`https://reptra.app/auth/callback`

That website can show a fallback page if the app is not installed.
