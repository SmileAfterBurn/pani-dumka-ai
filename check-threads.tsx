import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
const client = createClient({ publicApiKey: "pk_123" });
const { useThreads } = createRoomContext(client);

function App() {
  const { threads } = useThreads();
  return null;
}
