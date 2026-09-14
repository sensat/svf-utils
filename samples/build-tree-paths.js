/*
 * Example: building a dbID -> tree path map for MergingGLTFWriter.
 *
 * MergingGLTFWriter groups fragments by an optional `treePath` on every node
 * (a BIM path such as "building|level|category|family|type") and names the
 * merged meshes and nodes with it, so a viewer can rebuild a filterable model
 * tree from the GLB alone. Nothing in the library fills that field in - what
 * counts as a "level" depends on the source model, so it stays application
 * policy. This sample derives it from the object hierarchy that the Model
 * Derivative properties endpoint exposes:
 *
 *   - every object has an `externalId` such as "0/0/0/0/0" (the chain of child
 *     indices from the root) and a `name`
 *   - joining the names of an object's ancestors up to `--depth` levels gives
 *     the tree path of the fragments whose dbID is that object's `objectid`
 *     (the same dbID the SVF reader assigns to nodes)
 *
 * The output is a JSON file keyed by view GUID, ready to be handed to the CLI:
 *
 *   node samples/build-tree-paths.js <urn> -o tree-paths.json
 *   svf-to-gltf <urn> <guid> --merging --tree-paths tree-paths.json
 *
 * The same information can also be read offline from the SVF itself, out of
 * the objects_*.json.gz assets - see samples/local-svf-props.js for reading
 * those with PropDbReader.
 *
 * Usage:
 *   node build-tree-paths.js <urn> [guid] [-o tree-paths.json] [-d depth]
 *
 * Environment:
 *   APS_CLIENT_ID and APS_CLIENT_SECRET, or APS_ACCESS_TOKEN
 */

const fs = require('fs');
const axios = require('axios').default;
const { getSvfDerivatives } = require('./shared');

const { APS_CLIENT_ID, APS_CLIENT_SECRET, APS_ACCESS_TOKEN } = process.env;

const DEFAULT_OUTPUT = 'tree-paths.json';
const DEFAULT_DEPTH = 5;

// Containers that some translators insert without any real model counterpart.
const SYNTHETIC_NAMES = new Set(['<无标高>', '<no level>']);

// Accepts both an already encoded URN and a plain "urn:..." identifier.
function encodeUrn(urn) {
    if (!urn.startsWith('urn:')) {
        return urn;
    }
    return Buffer.from(urn).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

async function getAccessToken() {
    if (APS_ACCESS_TOKEN) {
        return APS_ACCESS_TOKEN;
    }
    if (!APS_CLIENT_ID || !APS_CLIENT_SECRET) {
        throw new Error('Provide APS_CLIENT_ID and APS_CLIENT_SECRET, or APS_ACCESS_TOKEN.');
    }
    const response = await axios.post(
        'https://developer.api.autodesk.com/authentication/v2/token',
        new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: APS_CLIENT_ID,
            client_secret: APS_CLIENT_SECRET,
            scope: 'viewables:read data:read'
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return response.data.access_token;
}

async function getObjects(urn, guid, accessToken) {
    const url = `https://developer.api.autodesk.com/modelderivative/v2/designdata/${urn}/metadata/${guid}/properties?forceget=true`;
    console.log(`Downloading properties of ${guid} ...`);
    const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 0
    });
    const collection = (response.data && response.data.data && response.data.data.collection) || [];
    console.log(`Objects: ${collection.length}`);
    return collection;
}

// Joins the names of the ancestors (up to `depth` levels) of every object into
// a tree path, keyed by dbID.
function buildTreePaths(objects, depth) {
    const nameByExternalId = new Map();
    for (const object of objects) {
        nameByExternalId.set(object.externalId, object.name);
    }
    const paths = {};
    let mapped = 0;
    for (const object of objects) {
        const segments = String(object.externalId || '').split('/').filter(segment => segment !== '');
        if (!segments.length) {
            continue;
        }
        const names = [];
        for (let i = 1; i <= Math.min(segments.length, depth); i++) {
            const name = nameByExternalId.get(segments.slice(0, i).join('/'));
            if (name && String(name).trim() && !SYNTHETIC_NAMES.has(String(name).trim())) {
                // A literal pipe would be indistinguishable from the separator
                names.push(String(name).replace(/\|/g, '/'));
            }
        }
        if (names.length) {
            paths[String(object.objectid)] = names.join('|');
            mapped++;
        }
    }
    console.log(`Tree paths: ${mapped} object(s) mapped, ${objects.length - mapped} without a name`);
    return paths;
}

async function run(urn, guid, outputFile, depth) {
    const encodedUrn = encodeUrn(urn);
    const accessToken = await getAccessToken();
    let guids = guid ? [guid] : [];
    if (!guids.length) {
        if (!APS_CLIENT_ID || !APS_CLIENT_SECRET) {
            throw new Error('Provide a view GUID, or APS_CLIENT_ID and APS_CLIENT_SECRET so that the SVF views can be resolved from the manifest.');
        }
        const derivatives = await getSvfDerivatives(encodedUrn, APS_CLIENT_ID, APS_CLIENT_SECRET);
        if (!derivatives.length) {
            throw new Error('No SVF derivatives found in the model manifest.');
        }
        guids = derivatives.map(derivative => derivative.guid);
        console.log(`Manifest lists ${guids.length} SVF view(s): ${guids.join(', ')}`);
    }
    const result = {};
    for (const viewGuid of guids) {
        const objects = await getObjects(encodedUrn, viewGuid, accessToken);
        result[viewGuid] = buildTreePaths(objects, depth);
    }
    fs.writeFileSync(outputFile, JSON.stringify(result));
    console.log(`Written ${outputFile} (${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(1)} MB)`);
}

function printUsage() {
    console.log('Usage: node build-tree-paths.js <urn> [guid] [-o tree-paths.json] [-d depth]');
}

const args = process.argv.slice(2);
const positional = [];
let outputFile = DEFAULT_OUTPUT;
let depth = DEFAULT_DEPTH;
for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-o' || arg === '--output') {
        outputFile = args[++i];
    } else if (arg === '-d' || arg === '--depth') {
        depth = parseInt(args[++i], 10);
    } else if (arg === '-h' || arg === '--help') {
        printUsage();
        process.exit(0);
    } else {
        positional.push(arg);
    }
}

if (positional.length < 1 || !Number.isInteger(depth) || depth < 1) {
    printUsage();
    process.exit(1);
}

run(positional[0], positional[1], outputFile, depth).catch(err => {
    console.error(err.message || err);
    process.exit(1);
});
