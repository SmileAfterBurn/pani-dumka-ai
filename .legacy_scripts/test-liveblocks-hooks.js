import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
const client = createClient({ publicApiKey: "pk_123" });
const ctx = createRoomContext(client);
console.log(Object.keys(ctx).join(', '));
