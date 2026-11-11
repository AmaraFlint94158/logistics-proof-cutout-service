import { InfraiClient } from "./infrai_client.ts";
import { processShipment } from "./logistics_service.ts";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("INFRAI_API_KEY is required");

const client = new InfraiClient(key);
const result = await processShipment({
  shipmentId: process.env.SHIPMENT_ID ?? "demo-1001",
  proofImageBase64: process.env.PROOF_IMAGE_BASE64 ?? "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAA2UlEQVR4nO3asQ2EQAxEURoipv8+6AUipEvPa/vvwh+JFGZeirfr49noAnQEoAvQEYAuQEcAugAdAegCdASgC9ARoOtD5378/XSkHCAyvBOiDCBjeAdECUDF+CqEVIDK4VUQaQCd4zMRUgCI8VkIAqw8PgNhCIAenoEgwBvGjyAI8JbxUQQBBBBAAAEEEEAAAQQQQIDlESIRIAowG0I0AowAzIIwEv8LCJCUFcdf/h32PsALEW+ESt/+k9mGP/FOkC5ARwC6AB0B6AJ0BKAL0BGALkBHALoAnRsW+E8RowRY7wAAAABJRU5ErkJggg==",
  proofFormat: "png",
  exception: "none"
}, client, process.env.INFRAI_BUCKET ?? "logistics-proof");
console.log(JSON.stringify(result));
