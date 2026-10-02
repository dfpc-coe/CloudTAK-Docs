# CloudTAK Server Administration Guide

## Introduction

Welcome to the CloudTAK Server Administration Guide. This document provides comprehensive instructions for configuring, and managing the CloudTAK server.
Whether you are a system administrator or a technical user, this guide will help you ensure that your CloudTAK server is running smoothly and efficiently.

## Admin Panel

The admin panel can be accessed once logged in to the CloudTAK Map View.

<div class="steps" markdown>

<div class="step" markdown>
<div class="step-body" markdown>
Open the Admin Panel from the side menu on large devices, or from within the Main Menu on smaller ones.
</div>
<div class="step-fig" markdown>
![Large device side menu](assets/2025-12-31-17-14-53-image.png)
![Main menu access](assets/2025-12-31-17-15-22-image.png)
</div>
</div>

<div class="step" markdown>
<div class="step-body" markdown>
The Admin Panel opens with the server overview and the admin menu on the left.
</div>
<div class="step-fig" markdown>
![Admin panel overview](assets/2025-12-31-17-16-08-image.png)
</div>
</div>

</div>

## CloudTAK Settings

The CloudTAK Settings section of the Admin Panel allows you to configure the default behavior of the CloudTAK server instance. CloudTAK can be configured to use a custom logo and naming scheme to more easily identify and customize the server to fit your agency.

<div class="steps" markdown>

<div class="step" markdown>
<div class="step-body" markdown>
From the Admin Panel, select the **CloudTAK Settings** menu item on the left.
</div>
<div class="step-fig" markdown>
![CloudTAK settings menu item](assets/2025-12-31-17-17-34-image.png)
</div>
</div>

<div class="step" markdown>
<div class="step-body" markdown>
Select the **Login Page** option, then the pencil icon in the upper right-hand corner to edit.
</div>
<div class="step-fig" markdown>
![Login page branding settings](assets/2025-12-31-17-21-47-image.png)
</div>
</div>

<div class="step" markdown>
<div class="step-body" markdown>
Add any or all of the options you wish to customize, then select **Save Setting** in the bottom right.
</div>
<div class="step-fig" markdown>
![Save branding settings](assets/2025-12-31-17-22-36-image.png)
</div>
</div>

</div>

## Authentication

Before changing any authentication settings it helps to understand what CloudTAK is actually doing when someone logs in. CloudTAK does not keep its own password database. Every login is verified against the TAK Server that the instance is connected to, and the first time a user signs in, CloudTAK requests a client certificate for them through the TAK Server's Certificate Enrollment API. That certificate is stored with the user's profile and is what CloudTAK uses for all TAK traffic on the user's behalf from then on. It is deliberately long-lived — CloudTAK reuses it across logins and only requests a new one when the existing certificate is within a week of expiring or has been revoked on the TAK Server.

That model explains most authentication problems you will run into: they are almost always either "the TAK Server rejected the credentials" or "a certificate could not be enrolled or renewed."

All of the settings below live in the same **Login Page** card described in the previous section (Admin Panel, then CloudTAK Settings, then Login Page, then the pencil icon to edit).

### Username & Password

This is the default method and needs no CloudTAK-side setup. Credentials are passed straight through to the TAK Server's WebTAK endpoint, so whatever backs authentication there — LDAP in most deployments, or the flat `UserAuthenticationFile.xml` — decides who can log in. If a user can authenticate against the TAK Server directly, they can log into CloudTAK.

Because the password is available at login time, certificate renewal is invisible with this method. When a certificate is close to expiry, CloudTAK quietly enrolls a fresh one during the next login.

### Passkeys

Passkeys are enabled by default and can be turned off with the **Enable Passkey Authentication** toggle. There is nothing else to configure server-side. Users register passkeys themselves from the main menu under Settings once they are logged in, and after that the login page will offer passkey autofill in supporting browsers.

One behavior worth knowing about: a passkey can prove who the user is, but it cannot renew their TAK certificate, since renewal requires a credential the TAK Server accepts. If a user logs in with a passkey while their certificate is about to expire, CloudTAK will let them in but prompt them for their password once to complete the renewal. Users who only ever log in with a passkey will see this roughly once a year, depending on the certificate lifetime your TAK Server issues.

### Single Sign-On (OIDC)

!!! warning "Beta"
    OIDC SSO is currently a beta feature. Test it against a staging instance with **Enforce SSO** left off before you rely on it in production.

CloudTAK can hand the login flow to any OpenID Connect identity provider that supports the standard Authorization Code flow and publishes a discovery document — Authentik, Keycloak, Entra ID, Okta, and friends. The user clicks the SSO button, authenticates with the IdP, and lands back in CloudTAK with a session.

The certificate model from the top of this section still applies, and it is the part that makes SSO setup a two-sided job. When a brand-new user signs in via SSO there is no password available, so CloudTAK enrolls their certificate by presenting the IdP's access token to the TAK Server instead. For that to work, the TAK Server has to be configured to trust your IdP — see the CoreConfig step below. Returning users with a valid certificate never touch the enrollment path, so a per-login flood of new certificates is explicitly *not* something you need to worry about; one user holds one certificate until it approaches expiry.

#### 1. Register CloudTAK with your Identity Provider

Create a confidential (server-side) OAuth application in your IdP with:

- **Grant type:** Authorization Code
- **Redirect URI:** `https://<your-cloudtak-host>/api/login/oidc/callback`
- **Scopes:** `openid profile email`

The `email` part matters more than it might look. CloudTAK uses the `email` claim from the IdP as the CloudTAK username *and* as the certificate identity, so the provider must include it in UserInfo responses, and the addresses must match the identities your TAK Server already knows about. If your TAK Server authenticates against the same directory your IdP does (the usual setup — for example Authentik fronting the same LDAP), this lines up automatically. If the two disagree, SSO users will enroll certificates under names your TAK Server groups don't recognize, and channel membership will be wrong.

#### 2. Configure CloudTAK

Back in the Login Page settings card, turn on **Enable OIDC SSO** and fill in:

| Field             | What to enter                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| Provider Name     | The label on the login button, e.g. "Sign in with *Acme SSO*"                                          |
| OIDC Discovery URL | The provider's `.well-known/openid-configuration` URL                                                  |
| Client ID         | From the application you registered in step 1                                                          |
| Client Secret     | Same                                                                                                    |
| Redirect URI      | Leave blank — CloudTAK defaults to `/api/login/oidc/callback` on its own public URL. Only set this if a proxy rewrites your hostname |
| Scopes            | Leave blank for the default `openid profile email`                                                     |
| OIDC Logo         | Optional icon shown on the login button                                                                |

A couple of concrete discovery URL examples, since every provider hides them somewhere different:

- Authentik: `https://auth.example.com/application/o/<app-slug>/.well-known/openid-configuration`
- Keycloak: `https://auth.example.com/realms/<realm>/.well-known/openid-configuration`

Leave **Enforce SSO** off for now. With it off, the SSO button simply appears alongside the normal username/password form, which gives you a safe way to test.

#### 3. Trust the IdP on the TAK Server

This is the step that is easy to miss because everything *appears* to work without it — existing users can SSO in just fine on their stored certificates. It only breaks when a new user tries to sign in for the first time, or when someone's certificate comes up for renewal, because that is when CloudTAK presents the IdP access token to the TAK Server's enrollment endpoint.

In `CoreConfig.xml`, add an OpenID Connect entry inside the `<auth><oauth>` block:

```xml
<auth default="ldap" ...>
    <ldap .../>
    <oauth usernameClaim="email">
        <openIdDiscoveryConfiguration
            name="cloudtak-sso"
            clientId="<same client id as above>"
            secret="<same client secret>"
            redirectUri="https://<your-cloudtak-host>/api/login/oidc/callback"
            configurationUri="https://<idp>/.well-known/openid-configuration"/>
    </oauth>
</auth>
```

Setting `usernameClaim="email"` is recommended so the TAK Server derives the same identity from the token that CloudTAK does. The TAK Server only reads its OAuth configuration at startup, so restart it after editing.

!!! note
    The TAK Server fetches the discovery document and the IdP's signing keys itself, so the TAK Server needs network reach to the IdP and the discovery document must include a `scopes_supported` entry — a few IdPs omit it, and the TAK Server treats that as a hard error.

#### 4. Test, then enforce

Log in through the SSO button as an existing user first (this exercises the token exchange but reuses their certificate), then as a user who has never logged into CloudTAK (this exercises certificate enrollment, the TAK-side trust from step 3). Once both work, you can turn on **Enforce SSO (Disable Username/Password Login)** to make the IdP the only way in.

#### Troubleshooting

Failures during the SSO round-trip come back to the login page as a red "SSO Login Failed" banner with a short reason. The ones you are most likely to meet:

- **"OIDC UserInfo did not return an email claim"** — the IdP isn't releasing the email. Check that the application grants the `email` scope and that the user actually has an email address set.
- **Existing users work, new users fail** — almost always step 3. The TAK Server unfortunately reports enrollment failures as a bare HTTP 500 with no detail, so check `takserver-api.log` on the TAK Server itself; a "HttpUser didn't equal CN" line means the identity the TAK Server derived from the token doesn't match the email CloudTAK put in the certificate request — set `usernameClaim="email"` on the `<oauth>` element.
- **Changes to CoreConfig seem to have no effect** — the OAuth section requires a TAK Server restart, unlike most other CoreConfig values.
- **You enforced SSO and locked yourself out** — an administrator token can still flip the setting back via the API (`PUT /api/config` with `{"oidc::enforced": false}`), or as a last resort delete the row directly: `DELETE FROM settings WHERE key = 'oidc::enforced';` in the CloudTAK database.

## Basemaps & Overlays

You can enhance CloudTAK by configuring custom, high-quality basemaps and overlays to improve the user experience. CloudTAK supports a variety of map tile sources, including both standard raster imagery and modern vector tiles. You can upload or configure these sources, such as `.pmtiles` archives, to serve as global basemaps or specialized custom overlays.

If you are using vector basemaps, we highly recommend utilizing the standard [OpenMapTiles Style Sheets](https://github.com/openmaptiles/openmaptiles/tree/master/style) to customize the map aesthetics according to your needs.

To help you get started quickly with a global vector basemap, you can download our pre-generated `openmaptiles.pmtiles` file using the button below:

<div align="center" markdown="1">
[Download openmaptiles.pmtiles](https://files.cloudtak.io/){ .md-button .md-button--primary }
</div>

### Hosted Tilesets

CloudTAK supports serving tiles directly from a PMTiles Archive.

<div class="steps" markdown>

<div class="step" markdown>
<div class="step-body" markdown>
From the Admin Panel, navigate to the **Hosted Tilesets** menu.
</div>
<div class="step-fig" markdown>
![Hosted Tilesets menu item](assets/2026-03-19-20-38-45-image.png)
</div>
</div>

<div class="step" markdown>
<div class="step-body" markdown>
The Hosted Tilesets page lists the tilesets that are hosted on the server, if any.
</div>
<div class="step-fig" markdown>
![Hosted Tilesets list](assets/2026-03-19-20-39-49-image.png)
</div>
</div>

<div class="step" markdown>
<div class="step-body" markdown>
To upload a new tileset, click the upload button in the upper right-hand corner, find the file and start the upload.
</div>
<div class="step-fig" markdown>
![Upload tileset button](assets/2026-03-19-20-40-39-image.png)
</div>
</div>

</div>

!!! note
    Tilesets are uploaded to the `public/` prefix of the S3 Bucket or compatible store. Tiles are public to authenticated users of CloudTAK but _not_ to unauthenticated users. Tiles themselves are served via the PMTiles Task Server.

Once the tiles have been uploaded, proceed to the next section to add a new Basemap or Overlay.

### Basemap/Overlays

Basemaps and overlays are both layers on the map that will be visible to the user. The difference between the two is simply whether the new layer is added on top of existing layers (an overlay), or replaces the bottom layer (a basemap). Both share the same functionality and as such we will refer to both as an overlay in this guide.

<div class="steps" markdown>

<div class="step" markdown>
<div class="step-body" markdown>
From the Admin Panel, navigate to the **Basemaps & Overlays** menu.
</div>
<div class="step-fig" markdown>
![Basemaps & Overlays menu item](assets/2026-03-19-20-48-48-image.png)
</div>
</div>

<div class="step" markdown>
<div class="step-body" markdown>
The Basemaps menu shows the basemaps currently loaded into the server. By default only "public" basemaps are shown, public being basemaps that are available to all users of the system.
</div>
<div class="step-fig" markdown>
![Basemap list](assets/2026-03-19-20-49-21-image.png)
</div>
</div>

<div class="step" markdown>
<div class="step-body" markdown>
To see a user's personal basemaps when warranted, click the **Filter** icon and choose "All" or "User" from the dropdown list.
</div>
<div class="step-fig" markdown>
![Basemap filter dropdown](assets/2026-03-19-20-50-46-image.png)
</div>
</div>

</div>

### Adding a Basemap or Overlay

<div class="steps" markdown>

<div class="step" markdown>
<div class="step-body" markdown>
Click the **Create Overlay** button.
</div>
<div class="step-fig" markdown>
![Create Overlay button](assets/2026-03-19-20-51-31-image.png)
</div>
</div>

<div class="step" markdown>
<div class="step-body" markdown>
The New Overlay pane will open. Depending on your version it will look similar to the panel shown.
</div>
<div class="step-fig" markdown>
![New Overlay pane](assets/2026-03-19-20-52-53-image.png)
</div>
</div>

<div class="step" markdown>
<div class="step-body" markdown>
Choose a name for the basemap.

- **Enable Sharing** allows the user to share the basemap to other TAK users. While disabling sharing makes it more difficult to share, the user is still able to see the tile URL and could create a personal overlay they could subsequently share.
- **Hidden** should typically only be used for snapping layers, as it keeps the basemap out of the default Basemap or Overlay menu.
</div>
</div>

<div class="step" markdown>
<div class="step-body" markdown>
If the basemap should be available to all users of the system, leave it as "Publicly Shared". Otherwise select a user from the dropdown to assign it to a specific user.
</div>
</div>

<div class="step" markdown>
<div class="step-body" markdown>
Choose the source of the tiles. Manual Entry supports quadkey, ZXY, and ESRI servers, for example:

| Source            | Example URL                                                          |
| ----------------- | -------------------------------------------------------------------- |
| ESRI MapServer    | `https://example.com/arcgis/rest/services/WorldTopo/MapServer/1`     |
| ESRI FeatureServer | `https://example.com/arcgis/rest/services/Parcels/FeatureServer/1`  |
| ZXY               | `https://example.com/tiles/{$z}/{$x}/{$y}.png`                       |
| Quadkey           | `https://example.com/tiles/{$q}.png`                                 |

If adding a Hosted Tileset uploaded in the previous section, select the "Hosted Tilesets" item and select the relevant tileset from the list.
</div>
</div>

</div>

## Terrain

CloudTAK has support for a 2.5D environment if loaded with a DEM dataset. You can provide your own DEM source if it is in the mapbox or terrarium tile format, or use Mapterhorn, a high quality, free global elevation dataset.

<div class="steps" markdown>

<div class="step" markdown>
<div class="step-body" markdown>
Navigate to the Basemaps & Overlays section of the Admin Panel as described above, create a new basemap and select **TileJSON Import** from the protocol options.
</div>
<div class="step-fig" markdown>
![TileJSON Import protocol option](assets/2026-05-20-14-18-20-image.png)
</div>
</div>

<div class="step" markdown>
<div class="step-body" markdown>
If using Mapterhorn, paste the TileJSON URL and select **Fetch TileJSON**:

```
https://tiles.mapterhorn.com/tilejson.json
```
</div>
<div class="step-fig" markdown>
![Fetch TileJSON](assets/2026-05-20-14-19-54-image.png)
</div>
</div>

<div class="step" markdown>
<div class="step-body" markdown>
If using the CloudTAK provided Mapterhorn snapping file, set the following values, then click save. Some of these fields are only visible once the "Advanced Options" section is expanded.

| Setting          | Value          | Location         |
| ---------------- | -------------- | ---------------- |
| Name             | Mapterhorn DEM | Main form        |
| Enable Sharing   | Off            | Main form        |
| Type             | raster-dem     | Advanced Options |
| Terrain Encoding | terrarium      | Advanced Options |
| Min Zoom         | 14             | Advanced Options |
| Max Zoom         | 14             | Advanced Options |
| Tile Size        | 512            | Advanced Options |
| Format           | webp           | Advanced Options |
</div>
</div>

<div class="step" markdown>
<div class="step-body" markdown>
To make the layer the default CloudTAK terrain source and show the 3D terrain button on the map, navigate to **CloudTAK Settings** in the Admin Panel, then **Map Settings**.
</div>
<div class="step-fig" markdown>
![Map Settings](assets/2026-05-20-14-21-12-image.png)
</div>
</div>

<div class="step" markdown>
<div class="step-body" markdown>
Click the edit pencil in the upper right-hand corner and select the DEM source you created earlier, then click save in the upper right-hand corner.
</div>
<div class="step-fig" markdown>
![Select terrain source](assets/2026-05-20-14-21-49-image.png)
</div>
</div>

<div class="step" markdown>
<div class="step-body" markdown>
Log out and back in. The map view will now show the 3D terrain option (the mountain icon).
</div>
<div class="step-fig" markdown>
![3D terrain button on the map](assets/2026-05-20-14-24-05-image.png)
</div>
</div>

</div>

## Users

The CloudTAK Users section of the Admin Panel allows you to view and configure data about active users of CloudTAK.

<div class="steps" markdown>

<div class="step" markdown>
<div class="step-body" markdown>
From the Admin Panel, select the **Users** menu entry on the left.
</div>
<div class="step-fig" markdown>
![Users menu entry](assets/2026-05-20-14-03-46-image.png)
</div>
</div>

<div class="step" markdown>
<div class="step-body" markdown>
A list of users that have accessed the CloudTAK platform will appear, sorted by most recent. A green status icon indicates that they are actively connected to the CloudTAK Service.
</div>
<div class="step-fig" markdown>
![User list](assets/2026-05-20-14-04-51-image.png)
</div>
</div>

<div class="step" markdown>
<div class="step-body" markdown>
Clicking on a user opens the user profile view, where admins can see the default settings the user has selected.
</div>
<div class="step-fig" markdown>
![User profile](assets/2026-05-20-14-06-11-image.png)
</div>
</div>

<div class="step" markdown>
<div class="step-body" markdown>
To edit the user's access level, select the gear icon in the upper right-hand corner. The edit page lets you mark the user as a System Administrator or a General User.
</div>
<div class="step-fig" markdown>
![Edit user access level](assets/2026-05-20-14-06-51-image.png)
</div>
</div>

</div>
