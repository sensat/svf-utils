# svf-utils

![Publish to NPM](https://github.com/petrbroz/svf-utils/workflows/Publish%20to%20NPM/badge.svg)
[![npm version](https://badge.fury.io/js/svf-utils.svg)](https://badge.fury.io/js/svf-utils)
![node](https://img.shields.io/node/v/svf-utils.svg)
![npm downloads](https://img.shields.io/npm/dw/svf-utils.svg)
![platforms](https://img.shields.io/badge/platform-windows%20%7C%20osx%20%7C%20linux-lightgray.svg)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](http://opensource.org/licenses/MIT)

![APS & glTF logos](./logo.png)

Utilities for converting [Autodesk Platform Services](https://aps.autodesk.com) SVF file format into
[glTF 2.0](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0).

## Usage

### Command line

- install the package: `npm install --global svf-utils`
- run the `svf-to-gltf` command without parameters for usage info
- run the command with a path to a local SVF file
- run the command with a Model Derivative URN (and optionally viewable GUID)
    - to access APS you must also specify credentials (`APS_CLIENT_ID` and `APS_CLIENT_SECRET`)
    or an authentication token (`APS_ACCESS_TOKEN`) as env. variables
    - this will also download the property database in sqlite format
- optionally, use any combination of the following command line args:
  - `--output-folder <folder>` to change output folder (by default '.')
  - `--deduplicate` to try and remove duplicate geometries
  - `--skip-unused-uvs` to skip texture UVs that are not used by any material
  - `--ignore-meshes` to exclude mesh geometry from the output
  - `--ignore-lines` to exclude line geometry from the output
  - `--ignore-points` to exclude point geometry from the output
  - `--center` move the model to origin
  - `--merging` to merge fragments into a single GLB, one mesh per tree path and material
  - `--tree-paths <file>` to group and name the merged output by BIM tree path (see _samples/build-tree-paths.js_)

#### Unix/macOS

```
svf-to-gltf <path to local svf> --output-folder <path to output folder>
```

or

```
export APS_CLIENT_ID=<client id>
export APS_CLIENT_SECRET=<client secret>
svf-to-gltf <urn> --output-folder <path to output folder>
```

or

```
export APS_ACCESS_TOKEN=<access token>
svf-to-gltf <urn> --output-folder <path to output folder>
```

#### Windows

```
svf-to-gltf <path to local svf> --output-folder <path to output folder>
```

or

```
set APS_CLIENT_ID=<client id>
set APS_CLIENT_SECRET=<client secret>
svf-to-gltf <urn> --output-folder <path to output folder>
```

or

```
set APS_ACCESS_TOKEN=<access token>
svf-to-gltf <urn> --output-folder <path to output folder>
```

### Node.js

The library can be used at different levels of granularity.

The easiest way to convert an SVF file is to read the entire model into memory
using [SvfReader#read](https://petrbroz.github.io/svf-utils/docs/classes/_svf_reader_.reader.html#read)
method, and save the model into glTF using [GltfWriter#write](https://petrbroz.github.io/svf-utils/docs/classes/_gltf_writer_.writer.html#write):
[samples/remote-svf-to-gltf.js](./samples/remote-svf-to-gltf.js).

If you don't want to read the entire model into memory (for example, when distributing
the parsing of an SVF over multiple servers), you can use methods like
[SvfReader#enumerateFragments](https://petrbroz.github.io/svf-utils/docs/classes/_svf_reader_.reader.html#enumeratefragments)
or [SvfReader#enumerateGeometries](https://petrbroz.github.io/svf-utils/docs/classes/_svf_reader_.reader.html#enumerategeometries)
to _asynchronously_ iterate over individual elements:

```js
const { SvfReader } = require('svf-utils');

// ...

const reader = await SvfReader.FromDerivativeService(urn, guid, authProvider);
for await (const fragment of reader.enumerateFragments()) {
    console.log(fragment);
}
```

And finally, if you already have the individual SVF assets in memory, you can parse the binary data
directly using _synchronous_ iterators like [parseMeshes](https://petrbroz.github.io/svf-utils/docs/modules/_svf_meshes_.html#parsemeshes):

```js
const { parseMeshes } = require('svf-utils/lib/svf/meshes');

// ...

for (const mesh of parseMeshes(buffer)) {
    console.log(mesh);
}
```

> For additional examples, see the [samples](./samples) subfolder.

### Merging GLB output

The default `GltfWriter` emits one glTF mesh per SVF fragment. On large models that means a very
large output - a model with hundreds of thousands of fragments easily reaches several gigabytes -
and, at render time, one draw call per fragment.

`MergingGLTFWriter` takes the same `IScene` as `GltfWriter`, but produces a single, much smaller GLB
instead. It:

1. bakes node transforms into the vertex positions and normals (no per-node transform overhead)
2. merges fragments that share a material into a single mesh (one draw call per material)
3. writes one self-contained `.glb`, with no sibling `.bin` file

```js
const { MergingGLTFWriter } = require('svf-utils');

const scene = await reader.read();
const writer = new MergingGLTFWriter({
    center: true,     // move the model to the origin (default: true)
    log: console.log  // optional progress callback
});
await writer.write(scene, 'output.glb');
```

Each mesh and node is named with the tree path of the fragments it merges (`<level>|<category>|<family>|<type>`,
or `Uncategorized`), so a viewer can rebuild a filterable model tree from the GLB alone. The same path is
repeated in `extras.path`, because three.js `GLTFLoader` sanitizes node and mesh names - spaces become
underscores and `[ ] . : /` are stripped - which would otherwise break lookups by path for anything derived
from a filename such as _model.nwc_. `GLTFLoader` copies `extras` verbatim into `object.userData`.

Because the output is a plain GLB, it can be passed on to any external post-processing tool.

#### From the command line

By default the `svf-to-gltf` command runs `GltfWriter`, which writes a `.gltf` + `.bin` pair per view.
With `--merging` it runs `MergingGLTFWriter` instead and writes a single `<guid>.glb`:

```
svf-to-gltf <urn> <guid> --merging --output-folder <path to output folder>
```

Add `--tree-paths` to group and name the merged meshes by BIM tree path; the file it reads is produced
by _samples/build-tree-paths.js_, which derives a dbID to path mapping from the object hierarchy that
the Model Derivative properties endpoint exposes:

```
node samples/build-tree-paths.js <urn> -o tree-paths.json
svf-to-gltf <urn> <guid> --merging --tree-paths tree-paths.json
```

Without `--tree-paths` the whole model lands in a single `Uncategorized` group. What counts as a level
of the tree path is model-specific, so _samples/build-tree-paths.js_ is meant to be adapted (the depth
is configurable with `-d`, and synthetic containers are dropped).

### Customization

You can customize the translation by sub-classing the reader and/or the writer class. For example:

- The _samples/custom-gltf-attribute.js_ script adds the dbID of each SVF node as a new attribute in its mesh
- The _samples/filter-by-area.js_ script only outputs geometries that are completely contained within a specified area

### Metadata

When converting models from [Model Derivative service](https://aps.autodesk.com/en/docs/model-derivative/v2),
you can retrieve the model's properties and metadata in form of a sqlite database. The command line tool downloads
this database automatically as _properties.sqlite_ file directly in your output folder. If you're using this library
in your own Node.js code, you can find the database in the manifest by looking for an asset with type "resource",
and role "Autodesk.CloudPlatform.PropertyDatabase":

```js
    ...
    const pdbDerivatives = manifestHelper.search({ type: 'resource', role: 'Autodesk.CloudPlatform.PropertyDatabase' });
    if (pdbDerivatives.length > 0) {
        const databaseStream = modelDerivativeClient.getDerivativeChunked(urn, pdbDerivatives[0].urn, 1 << 20);
        databaseStream.pipe(fs.createWriteStream('./properties.sdb'));
    }
    ...
```

The structure of the sqlite database, and the way to extract model properties from it is explained in
https://github.com/wallabyway/propertyServer/blob/master/pipeline.md. Here's a simple diagram showing
the individual tables in the database, and the relationships between them:

![Property Database Diagram](https://user-images.githubusercontent.com/440241/42006177-35a1070e-7a2d-11e8-8c9e-48a0afeea00f.png)

And here's an example query listing all objects with "Material" property containing the "Concrete" word:

```sql
SELECT _objects_id.id AS dbId, _objects_id.external_id AS externalId, _objects_attr.name AS propName, _objects_val.value AS propValue
FROM _objects_eav
    INNER JOIN _objects_id ON _objects_eav.entity_id = _objects_id.id
    INNER JOIN _objects_attr ON _objects_eav.attribute_id = _objects_attr.id
    INNER JOIN _objects_val ON _objects_eav.value_id = _objects_val.id
WHERE propName = "Material" AND propValue LIKE "%Concrete%"
```

### GLB, Draco, and other post-processing

Following the Unix philosophy, we removed post-processing dependencies from this project,
and instead leave it to developers to "pipe" the output of this library to other tools
such as https://github.com/CesiumGS/gltf-pipeline or https://github.com/zeux/meshoptimizer.
See [./samples/local-svf-to-gltf.sh](./samples/local-svf-to-gltf.sh) or
[./samples/remote-svf-to-gltf.sh](./samples/remote-svf-to-gltf.sh) for examples.

### Web viewer

[samples/viewer.html](./samples/viewer.html) is a small three.js viewer for GLB files. Serve it over
HTTP and point it at a model with the `model` query parameter:

```
# run this from the directory that contains your .glb file
python3 -m http.server 8080
# then open http://localhost:8080/samples/viewer.html?model=./output.glb
```

## Development

- use Node.js 24 (`nvm use` will pick it up from `.nvmrc`)
- clone the repository
- install dependencies: `yarn install`
- build the library (transpile TypeScript): `yarn run build`
- run samples in the _test_ subfolder, for example: `APS_CLIENT_ID=<your client id> APS_CLIENT_SECRET=<your client secret> node test/remote-svf-to-gltf.js <model urn> <path to output folder>`

If you're using [Visual Studio Code](https://code.visualstudio.com), you can use the following "task" and "launch" configurations:

In _.vscode/tasks.json_:

```json
...
{
    "label": "build",
    "type": "npm",
    "script": "build",
    "problemMatcher": [
        "$tsc"
    ],
    "group": "build",
    "presentation": {
        "echo": true,
        "reveal": "silent",
        "focus": false,
        "panel": "shared",
        "showReuseMessage": false,
        "clear": false
    }
}
...
```

In _.vscode/launch.json_:

```json
...
{
    "type": "node",
    "request": "launch",
    "name": "Convert Model Derivative SVF to glTF",
    "program": "${workspaceFolder}/test/remote-svf-to-gltf.js",
    "args": ["<your model urn>", "<path to output folder>"],
    "env": {
        "APS_CLIENT_ID": "<your client id>",
        "APS_CLIENT_SECRET": "<your client secret>"
    },
    "preLaunchTask": "build"
},
{
    "type": "node",
    "request": "launch",
    "name": "Convert Local SVF to glTF",
    "program": "${workspaceFolder}/test/local-svf-to-gltf.js",
    "args": ["<path to svf file>", "<path to output folder>"],
    "preLaunchTask": "build"
}
...
```

### Intermediate Format

The project provides a collection of interfaces for an [intermediate 3D format](./src/common/intermediate-format.ts)
that is meant to be used by all loaders and writers. When implementing a new loader, make sure that
its output implements the intermediate format's `IScene` interface. Similarly, this interface should
also be expected as the input to all new writers.
