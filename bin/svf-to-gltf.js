#!/usr/bin/env node

const program = require('commander');
const fs = require('fs');
const path = require('path');
const { SdkManagerBuilder } = require('@aps_sdk/autodesk-sdkmanager');
const { ModelDerivativeClient} = require('@aps_sdk/model-derivative');
const { Scopes } = require('@aps_sdk/authentication');
const { SvfReader, GltfWriter, MergingGLTFWriter, BasicAuthenticationProvider, TwoLeggedAuthenticationProvider } = require('../lib');
const IMF = require('../lib/common/intermediate-format');

const { APS_CLIENT_ID, APS_CLIENT_SECRET, APS_ACCESS_TOKEN } = process.env;
let authenticationProvider = null;
if (APS_ACCESS_TOKEN) {
    authenticationProvider = new BasicAuthenticationProvider(APS_ACCESS_TOKEN);
} else if (APS_CLIENT_ID && APS_CLIENT_SECRET) {
    authenticationProvider = new TwoLeggedAuthenticationProvider(APS_CLIENT_ID, APS_CLIENT_SECRET);
}

// Wraps an IMF.IScene and injects a tree path into every object node, so
// MergingGLTFWriter can group fragments into a filterable model tree instead of
// putting everything into a single "Uncategorized" bucket. The paths are looked
// up by dbID; samples/build-tree-paths.js produces the JSON it reads.
class TreePathScene {
    constructor(scene, paths) {
        this.scene = scene;
        this.paths = paths;
        this.hits = 0;
        this.misses = 0;
    }

    getMetadata() { return this.scene.getMetadata(); }
    getNodeCount() { return this.scene.getNodeCount(); }
    getNode(id) {
        const node = this.scene.getNode(id);
        if (!node || node.kind !== IMF.NodeKind.Object) {
            return node;
        }
        const treePath = this.paths[String(node.dbid)];
        if (treePath) {
            node.treePath = treePath;
            this.hits++;
        } else {
            this.misses++;
        }
        return node;
    }
    getGeometryCount() { return this.scene.getGeometryCount(); }
    getGeometry(id) { return this.scene.getGeometry(id); }
    getMaterialCount() { return this.scene.getMaterialCount(); }
    getMaterial(id) { return this.scene.getMaterial(id); }
    getImage(uri) { return this.scene.getImage(uri); }
}

function readTreePaths(file) {
    if (!file) {
        return null;
    }
    const treePaths = JSON.parse(fs.readFileSync(file, 'utf8'));
    console.log(`Loaded tree paths for ${Object.keys(treePaths).length} view(s) from ${file}`);
    return treePaths;
}

// The map is keyed by view GUID, but a local SVF has no GUID to look it up
// with, so a map holding a single view is accepted as is.
function applyTreePaths(scene, treePaths, guid) {
    if (!treePaths) {
        return { scene, wrapper: null };
    }
    let paths = treePaths[guid];
    if (!paths) {
        const keys = Object.keys(treePaths);
        paths = keys.length === 1 ? treePaths[keys[0]] : null;
    }
    if (!paths) {
        return { scene, wrapper: null };
    }
    const wrapper = new TreePathScene(scene, paths);
    return { scene: wrapper, wrapper };
}

function reportTreePaths(wrapper) {
    if (wrapper) {
        console.log(`Tree paths: ${wrapper.hits} node(s) matched, ${wrapper.misses} without a path`);
    }
}

async function convertRemote(urn, guid, outputFolder, options, treePaths) {
    console.log(`Converting urn ${urn}, guid ${guid}`);
    const reader = await SvfReader.FromDerivativeService(urn, guid, authenticationProvider);
    const scene = await reader.read({ log: console.log });
    const { scene: wrapped, wrapper } = applyTreePaths(scene, treePaths, guid);
    if (program.merging) {
        const writer = new MergingGLTFWriter(options);
        await writer.write(wrapped, path.join(outputFolder, `${guid}.glb`));
    } else {
        const writer = new GltfWriter(options);
        await writer.write(wrapped, path.join(outputFolder, guid));
    }
    reportTreePaths(wrapper);
}

async function convertLocal(svfPath, outputFolder, options, treePaths) {
    console.log(`Converting local file ${svfPath}`);
    const reader = await SvfReader.FromFileSystem(svfPath);
    const scene = await reader.read({ log: console.log });
    const { scene: wrapped, wrapper } = applyTreePaths(scene, treePaths, null);
    if (program.merging) {
        const writer = new MergingGLTFWriter(options);
        const output = path.join(outputFolder, `${path.basename(svfPath).replace(/\.svf$/i, '')}.glb`);
        await writer.write(wrapped, output);
    } else {
        const writer = new GltfWriter(options);
        await writer.write(wrapped, path.join(outputFolder));
    }
    reportTreePaths(wrapper);
}

program
    .version(require('../package.json').version, '-v, --version')
    .option('-o, --output-folder [folder]', 'output folder', '.')
    .option('-d, --deduplicate', 'deduplicate geometries (may increase processing time)', false)
    .option('-s, --skip-unused-uvs', 'skip unused texture coordinate data', false)
    .option('-im, --ignore-meshes', 'ignore mesh geometry', false)
    .option('-il, --ignore-lines', 'ignore line geometry', false)
    .option('-ip, --ignore-points', 'ignore point geometry', false)
    .option('--center', 'move model to origin', false)
    .option('-m, --merging', 'merge fragments into a single GLB, one mesh per tree path and material', false)
    .option('--tree-paths <file>', 'JSON file with dbID to tree path mappings (see samples/build-tree-paths.js)')
    .arguments('<URN-or-local-path> [GUID]')
    .action(async function (id, guid) {
        const treePaths = readTreePaths(program.treePaths);
        const options = {
            deduplicate: program.deduplicate,
            skipUnusedUvs: program.skipUnusedUvs,
            ignoreMeshGeometry: program.ignoreMeshes,
            ignoreLineGeometry: program.ignoreLines,
            ignorePointGeometry: program.ignorePoints,
            center: program.center,
            log: console.log
        };
        try {
            if (id.endsWith('.svf')) {
                // ID is a path to local SVF file
                const filepath = id;
                convertLocal(filepath, program.outputFolder, options, treePaths);
            } else {
                // ID is the Model Derivative URN
                // Convert input guid or all guids
                if (!authenticationProvider) {
                    console.warn('Missing environment variables for APS authentication.');
                    console.warn('Provide APS_CLIENT_ID and APS_CLIENT_SECRET, or APS_ACCESS_TOKEN.');
                    return;
                }

                const urn = id;
                const folder = path.join(program.outputFolder, urn);
                if (guid) {
                    await convertRemote(urn, guid, folder, options, treePaths);
                } else {
                    const sdkManager = SdkManagerBuilder.create().build();
                    const modelDerivativeClient = new ModelDerivativeClient(sdkManager);
                    const accessToken = await authenticationProvider.getToken([Scopes.ViewablesRead]);
                    const manifest = await modelDerivativeClient.getManifest(accessToken, urn);
                    const derivatives = [];
                    function traverse(derivative) {
                        if (derivative.type === 'resource' && derivative.role === 'graphics' && derivative.mime === 'application/autodesk-svf') {
                            derivatives.push(derivative);
                        }
                        if (derivative.children) {
                            for (const child of derivative.children) {
                                traverse(child);
                            }
                        }
                    }
                    for (const derivative of manifest.derivatives) {
                        if (derivative.children) {
                            for (const child of derivative.children) {
                                traverse(child);
                            }
                        }
                    }
                    for (const derivative of derivatives) {
                        await convertRemote(urn, derivative.guid, folder, options, treePaths);
                    }
                }
            }
        } catch (err) {
            console.error(err);
        }
    })
    .parse(process.argv);

if (program.args.length === 0) {
    program.help();
}
