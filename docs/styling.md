# CloudTAK Styling

## Introduction

CloudTAK renders all map data using [MapLibre GL](https://maplibre.org/). Vector overlays - both
uploaded data and vector tile services - can be given custom styles written using the
[MapLibre Style Specification](https://maplibre.org/maplibre-style-spec/layers/). A style is a list
of MapLibre layer objects that reference the overlay's source and control how features are drawn.

Beyond static styling, CloudTAK exposes dynamic state that styles can react to at runtime:

- **Global State** - map-wide values such as the current UI theme and whether 3D terrain is enabled
- **Feature Hover State** - a per-feature flag set as the user moves the cursor over features

This document walks through how to consume each of these from your overlay styles.

!!! note

    When an overlay style is saved, CloudTAK automatically rewrites each layer's `source` to
    point at the overlay's data source and prefixes the layer `id` with the overlay ID. The
    `source` values in the examples below are placeholders. Vector data hosted by CloudTAK is
    served with a single source layer named `out`, which is why the examples use
    `"source-layer": "out"`.

## Global State

CloudTAK maintains the following [global state](https://maplibre.org/maplibre-style-spec/root/#state)
properties on the map. They can be read from any style expression using the
[`global-state`](https://maplibre.org/maplibre-style-spec/expressions/#global-state) operator and
are updated automatically as the user changes their settings - any layer that references them
re-renders immediately.

| Property | Type      | Values             | Description                                                                              |
| -------- | --------- | ------------------ | ---------------------------------------------------------------------------------------- |
| `theme`  | `string`  | `light` \| `dark`  | The current CloudTAK UI theme, following the user's Display Style preference              |
| `3d`     | `boolean` | `true` \| `false`  | Whether the user has enabled 3D Terrain via the terrain button on the map                 |

### Theme Aware Styles

Use the `theme` global state to keep overlay colors legible on both light and dark basemaps.
For example, a parcel outline that renders white on dark themes and black on light themes:

```json
{
    "id": "parcels-outline",
    "type": "line",
    "source": "parcels",
    "source-layer": "out",
    "paint": {
        "line-color": [
            "match",
            ["global-state", "theme"],
            "dark", "#ffffff",
            "#000000"
        ],
        "line-width": 1.5
    }
}
```

The `theme` value updates live - if the user switches their Display Style (or their operating
system switches between light and dark mode while the `System Default` style is selected) the
layer restyles without a reload.

### 3D Aware Styles

Use the `3d` global state to adapt layers when 3D Terrain is active. A common pattern is
reducing fill opacity so terrain hillshading remains visible underneath polygon layers:

```json
{
    "id": "parcels-fill",
    "type": "fill",
    "source": "parcels",
    "source-layer": "out",
    "paint": {
        "fill-color": "#ff0000",
        "fill-opacity": [
            "case",
            ["global-state", "3d"],
            0.1,
            0.4
        ]
    }
}
```

## Feature Hover State

As the cursor moves across a vector overlay, CloudTAK sets the
[feature state](https://maplibre.org/maplibre-style-spec/expressions/#feature-state) property
`hover` to `true` on the features underneath it, and back to `false` when the cursor leaves.
Styles can read this with the `feature-state` expression to provide visual hover feedback.

!!! note

    `feature-state` expressions may only be used in `paint` properties - they are not
    supported in `layout` properties or `filter` expressions.

A typical use is increasing polygon opacity for the hovered feature - for example a parcel
layer where the parcel under the cursor is highlighted:

```json
{
    "id": "parcels-fill",
    "type": "fill",
    "source": "parcels",
    "source-layer": "out",
    "paint": {
        "fill-color": "#00ff00",
        "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            0.6,
            0.2
        ]
    }
}
```

The `["boolean", ..., false]` wrapper is required - before a feature has been hovered for the
first time its `hover` state is undefined, and the fallback `false` keeps the expression valid.

!!! tip

    Hover state is suspended while the drawing tools are active so that in-progress
    drawing is not visually disrupted.

## Putting It Together

Global state and feature state compose freely within a single expression. The layer below
renders parcels that brighten on hover, with a hover color that adapts to the current theme:

```json
{
    "id": "parcels-fill",
    "type": "fill",
    "source": "parcels",
    "source-layer": "out",
    "paint": {
        "fill-color": [
            "match",
            ["global-state", "theme"],
            "dark", "#ffd166",
            "#7b2cbf"
        ],
        "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            0.7,
            ["case", ["global-state", "3d"], 0.15, 0.35]
        ]
    }
}
```
