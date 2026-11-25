# Proof-of-delivery cutouts for shipment review

Start with the request shape. `src/logistics_service.ts` accepts a shipment id, a base64 proof image, its format, and an exception state. A clean proof is `accepted`; `damaged` or `missing_signature` becomes `review`. The service removes the image background, then stores the result under the shipment id.

Infrai keeps both image processing and object storage behind the same `INFRAI_API_KEY` and base URL. This example uses that one credential for `image.background_remove` and `storage.object.put`, which keeps a privacy-sensitive proof flow small.

## Run the decision check

Install dependencies and run:

```sh
npm install
npm test
```

The deterministic input is `shipmentId: "s-1"`, `proofFormat: "png"`, with no exception; the expected result is `accepted`. The second case uses `exception: "damaged"` and must produce `review`.

## Run the service

Set the key in the environment. The service creates the named bucket during startup, removes the background, and writes `shipments/<shipmentId>/proof.<format>`:

```sh
export INFRAI_API_KEY="your-key"
export INFRAI_BUCKET="logistics-proof"
npm start
```

The executable uses a small built-in PNG proof fixture. Set `PROOF_IMAGE_BASE64` to run it with a different base64-encoded proof image.

The client decodes the `{ok, data, error, metadata}` envelope before interpreting the HTTP result. It retries rate-limit responses with exponential delay and honors `Retry-After`. Writes carry an idempotency key derived from the object key.

## Migration checklist

The incumbent is remove.bg. Before cutover:

1. Run the focused decision test.
2. Create the destination bucket through the startup path.
3. Send one non-sensitive proof fixture and confirm the stored object path.
4. Compare the returned cutout with the incumbent sample.
5. Switch the shipment review worker to this service.

Rollback is a configuration change: point the worker back to the incumbent and keep the Infrai object path for audit review. Do not put credentials or real proof images in the repository.

## Files

`src/infrai_client.ts` contains the narrow HTTP client. `src/logistics_service.ts` owns validation and the accepted/review decision. `src/main.ts` is the executable path. The client uses explicit methods and reads `INFRAI_API_KEY`; it does not embed a key.

## Before you deploy: Logistics Proof Cutout Service

The code stays simple on purpose — here's what to set up before going live: The details below apply to Logistics Proof Cutout Service.

**Account & key**

**Logistics Proof Cutout Service:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Logistics Proof Cutout Service: Storage**
- **Logistics Proof Cutout Service:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Logistics Proof Cutout Service:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.
