"use client";

import { FC, useState } from "react";

export const ChannelSubmissionForm: FC<{ onSubmit: (name: string, embedUrl: string) => void }> = ({ onSubmit }) => {
  const [name, setName] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");

  return (
    <form
      className="border rounded-lg p-4 bg-white dark:bg-zinc-900 shadow flex flex-col gap-2 max-w-md mx-auto"
      onSubmit={e => {
        e.preventDefault();
        onSubmit(name, embedUrl);
        setName("");
        setEmbedUrl("");
      }}
    >
      <div className="font-bold mb-2">Submit New Channel</div>
      <input
        className="border rounded px-2 py-1"
        placeholder="Channel Name"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />
      <input
        className="border rounded px-2 py-1"
        placeholder="YouTube Embed URL"
        value={embedUrl}
        onChange={e => setEmbedUrl(e.target.value)}
        required
      />
      <button className="bg-blue-600 text-white rounded px-4 py-2 mt-2" type="submit">
        Submit
      </button>
    </form>
  );
}; 