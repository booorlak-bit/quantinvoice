"use client";

import { useState } from "react";
import type { Note } from "@/lib/types";
import styles from "./form.module.css";

let nextKey = 0;

/** Repeatable title/body rows submitted as `noteTitle` / `noteBody` form fields. */
export function NotesEditor({ initial }: { initial: Note[] }) {
  const [notes, setNotes] = useState(() => initial.map((note) => ({ ...note, key: nextKey++ })));

  const update = (key: number, patch: Partial<Note>) =>
    setNotes((current) => current.map((note) => (note.key === key ? { ...note, ...patch } : note)));

  return (
    <>
      <ul className={styles.rows}>
        {notes.map((note, index) => (
          <li key={note.key} className={styles.noteRow}>
            <input
              name="noteTitle"
              placeholder="Title"
              aria-label={`Note ${index + 1} title`}
              value={note.title}
              onChange={(e) => update(note.key, { title: e.target.value })}
            />
            <textarea
              name="noteBody"
              placeholder="Text"
              rows={3}
              aria-label={`Note ${index + 1} text`}
              value={note.body}
              onChange={(e) => update(note.key, { body: e.target.value })}
            />
            <button
              type="button"
              className={styles.removeButton}
              aria-label={`Remove note ${index + 1}`}
              onClick={() => setNotes((current) => current.filter((row) => row.key !== note.key))}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={styles.addButton}
        onClick={() => setNotes((current) => [...current, { title: "", body: "", key: nextKey++ }])}
      >
        + Add note
      </button>
    </>
  );
}
