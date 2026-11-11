import { z } from "zod";
import { InfraiClient } from "./infrai_client.ts";

export const shipmentEventSchema = z.object({
  shipmentId: z.string().min(1),
  proofImageBase64: z.string().min(1),
  proofFormat: z.enum(["png", "jpeg", "webp"]),
  exception: z.enum(["none", "damaged", "missing_signature"]).default("none")
});

export type ShipmentEvent = z.infer<typeof shipmentEventSchema>;

export function decideStatus(event: ShipmentEvent): "accepted" | "review" {
  return event.exception === "none" ? "accepted" : "review";
}

export async function processShipment(event: unknown, client: InfraiClient, bucket: string) {
  const input = shipmentEventSchema.parse(event);
  const status = decideStatus(input);
  await client.createBucket(bucket);
  const cutout = await client.backgroundRemove(input.proofImageBase64, input.proofFormat);
  await client.putObject(bucket, `shipments/${input.shipmentId}/proof.${input.proofFormat}`, cutout.image, `image/${input.proofFormat}`);
  return { shipmentId: input.shipmentId, status, proofStored: true };
}
