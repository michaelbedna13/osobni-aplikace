import { useState } from "react";
import { Burst } from "../../components/Burst";
import { gratitudeSaved } from "../../lib/copy";
import { newGratitude, useAddGratitude } from "./data";

interface Props {
  /** Kolik zápisů už dnes je (kvůli textu tlačítka a pochvale). */
  todayCount: number;
  autoFocus?: boolean;
  onSaved?: (cheer: string) => void;
}

/** Políčko „Za co jsem dnes vděčný?“ – na obrazovce Dnes i v modulu. */
export function GratitudeForm({ todayCount, autoFocus, onSaved }: Props) {
  const [text, setText] = useState("");
  const [burst, setBurst] = useState(0);
  const add = useAddGratitude();
  const valid = text.trim().length > 0 && text.trim().length <= 500;

  const save = () => {
    if (!valid) return;
    add.mutate(newGratitude(text));
    setText("");
    setBurst((b) => b + 1);
    onSaved?.(gratitudeSaved(todayCount + 1));
  };

  return (
    <form className="thanks-form" onSubmit={(e) => { e.preventDefault(); save(); }}>
      <label htmlFor="thanks-text" className="sr-only">Za co jsem dnes vděčný?</label>
      <textarea
        id="thanks-text"
        className="input"
        rows={2}
        maxLength={500}
        autoFocus={autoFocus}
        placeholder={todayCount === 0 ? "Jedna věc, která dnes potěšila…" : "A ještě něco?"}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button className="btn-hero" type="submit" disabled={!valid}>
        Zapsat
        <Burst trigger={burst} text="+1" />
      </button>
      {add.error && <p className="error">Nepodařilo se uložit. Zkontroluj připojení.</p>}
    </form>
  );
}
