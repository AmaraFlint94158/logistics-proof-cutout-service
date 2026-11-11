import assert from "node:assert/strict";
import { decideStatus, shipmentEventSchema } from "./logistics_service.ts";

const accepted = shipmentEventSchema.parse({ shipmentId: "s-1", proofImageBase64: "abc", proofFormat: "png" });
assert.equal(decideStatus(accepted), "accepted");

const exception = shipmentEventSchema.parse({ shipmentId: "s-2", proofImageBase64: "abc", proofFormat: "jpeg", exception: "damaged" });
assert.equal(decideStatus(exception), "review");

console.log("shipment decision test passed");
