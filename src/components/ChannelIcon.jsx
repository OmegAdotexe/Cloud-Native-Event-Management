import React from "react";
import { Globe } from "lucide-react";
import { CHANNELS } from "../data/mockData.js";

/**
 * ChannelIcon — renders the lucide icon for a given channel key.
 * @param {{ channel: string, size?: number }} props
 */
export default function ChannelIcon({ channel, size = 12 }) {
  const found = CHANNELS.find((c) => c.key === channel);
  const Icon = found ? found.icon : Globe;
  return <Icon size={size} />;
}
