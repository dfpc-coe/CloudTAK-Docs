# CloudTAK Server Administration Guide

## Introduction

Welcome to the CloudTAK Server Administration Guide. This document provides comprehensive instructions for configuring, and managing the CloudTAK server.
Whether you are a system administrator or a technical user, this guide will help you ensure that your CloudTAK server is running smoothly and efficiently.

## Admin Panel

The admin panel can be accessed once logged in to the CloudTAK Map View.

| Large Device Side Menu                    | From within the Main Menu                 |
| ----------------------------------------- | ----------------------------------------- |
| ![Large device side menu](assets/2025-12-31-17-14-53-image.png){ style="display: block; margin: 0 auto;" } | ![Main menu access](assets/2025-12-31-17-15-22-image.png){ style="display: block; margin: 0 auto;" } |

Once you enter the Admin Panel, you will get a screen like the following:

![Admin panel overview](assets/2025-12-31-17-16-08-image.png){ style="display: block; margin: 0 auto;" }

## CloudTAK Settings

The CloudTAK Settings section of the Admin Panel allows you to configure the default behavior of the CloudTAK server instance.

From the Admin Page, select the CloudTAK Settings Menu Item on the left:

![CloudTAK settings menu item](assets/2025-12-31-17-17-34-image.png){ style="display: block; margin: 0 auto;" }

### Server Branding

CloudTAK can be configured to use a custom logo and naming scheme to more easily identify and customize the server to fit your agency.

To configure, select the "Login Page" option and then the Pencil icon in the upper right-hand corner to edit.

![Login page branding settings](assets/2025-12-31-17-21-47-image.png){ style="display: block; margin: 0 auto;" }

Add any or all of the options you wish to customize and then select "Save Setting" in the bottom right.

![Save branding settings](assets/2025-12-31-17-22-36-image.png){ style="display: block; margin: 0 auto;" }

## Basemaps & Overlays

You can enhance CloudTAK by configuring custom, high-quality basemaps and overlays to improve the user experience. CloudTAK supports a variety of map tile sources, including both standard raster imagery and modern vector tiles. You can upload or configure these sources, such as `.pmtiles` archives, to serve as global basemaps or specialized custom overlays.

If you are using vector basemaps, we highly recommend utilizing the standard [OpenMapTiles Style Sheets](https://github.com/openmaptiles/openmaptiles/tree/master/style) to customize the map aesthetics according to your needs.

To help you get started quickly with a global vector basemap, you can download our pre-generated `openmaptiles.pmtiles` file using the button below:

<div align="center" markdown="1">
[Download openmaptiles.pmtiles](https://files.cloudtak.io/){ .md-button .md-button--primary }
</div>

## Connections & Data/ETL Integrations
