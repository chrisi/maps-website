![Workflow](https://github.com/chrisi/maps-website/actions/workflows/ci-cd.yml/badge.svg)

# Falcon BMS - Interactive Maps (Website)
An interactive website for Falcon BMS mission planning

## Usage
This content is provided you by the Benchmark Sims team.
It covers the 3 main theaters (KTO, ITO, Balkans) as for version 4.37.

This repository does not contain the charts and BMS proprietary assets - Only available from falcon bms website...

## Contributions
The Main branch is protected...
Please use "dev" branch if you wish to develop and commit to the project!


## Licence
The project presented here is under GNU GPL v3.
We encourage people to contribute to this project instead of creating a fork...

## Vue-Port

*- work in progress -*

The KTO is migrated to Vue.js as a proposal to allow for better modularity and data/presentation separation. 

### Compile and Hot-Reload for Development

```sh
yarn dev
```

### Type-Check, Compile and Minify for Production

```sh
yarn build
```

### Changelog

* Introduced Vue.js and TypeScript to improve modularity, code-quality and tooling support by taking advantage of the type-system.
* Introduced JSON-data-structure that holds all relevant theater/airbase data for easier maintenance.
* Use of Vue.js bidirectional-data binding to reduce ui/model sync boilerplate code.
* New custom component-library for tool-windows to help with modularity and unifying the presentation.
* Split index.html into multiple components, especially the tool-windows, for easier maintenance.
* Implemented Overlay-System for the various features like Symbols, Measure, Bullseye to help with modularity and keeping related code in one place.
* Classic map click-zone replaced by custom implementation to overcome the limitations of the <map>/<area> approach that can't handle overlapping areas.
* The airbase-map is replaced by a smart-scale map with airbase symbology dynamically rendered based on runway data found in the json-structure to no longer require the static airbases-map image.
* The symbols-layer is now also smart-scaling and allows for editing and removing previously placed symbols.
* Introduced smart-scaling like in the sim itself, the elements scale but not as much as the environment to keep elements readable on zoomed out maps.
* Pan with middle-mouse-button while in different map mode

### Roadmap

* IMCS Integration
* Whiteboard/Pen/Eraser
* Weather Integration
* Mission Integration, clickable route
* Special page for OKB Integration

### Demo

https://chrisi.github.io/maps-website/
