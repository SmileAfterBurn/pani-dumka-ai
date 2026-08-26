import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const PUBLIC_KEY = import.meta.env.VITE_LIVEBLOCKS_PUBLIC_KEY || "pk_dev_mT0OmpM5jz9zdtb66zHWtAzPN--NgC-87BZFIEtmvY0yZeYZ7_Hw1h44VubkJ0ox";
export const hasLiveblocksKey = PUBLIC_KEY.startsWith("pk_");

const client = createClient({
  publicApiKey: PUBLIC_KEY,
});

type Presence = {
  cursor: { x: number; y: number } | null;
};

type Storage = {
  content: string;
};

export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useUpdateMyPresence,
  useOthers,
  useStorage,
  useMutation,
  useThreads,
  useCreateThread,
} = createRoomContext<Presence, Storage>(client);
