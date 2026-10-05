import { SOUND_IDS, SOUND_NAMES, playSound, unlockAudio, type SoundId } from "../lib/sound";

/** Výběr zvuku: ťuknutím se zvuk vybere a rovnou přehraje. */
export function SoundPicker({ label, value, onChange, exclude = [] }: { label: string; value: SoundId; onChange: (id: SoundId) => void; exclude?: SoundId[] }) {
  return (
    <>
      <span className="field-label">{label}</span>
      <div className="chips sound-chips" role="radiogroup" aria-label={label}>
        {SOUND_IDS.filter((id) => !exclude.includes(id)).map((id) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={value === id}
            className={`chip${value === id ? " on" : ""}`}
            onClick={() => { unlockAudio(); onChange(id); playSound(id); }}
          >
            {SOUND_NAMES[id]}
          </button>
        ))}
      </div>
    </>
  );
}
