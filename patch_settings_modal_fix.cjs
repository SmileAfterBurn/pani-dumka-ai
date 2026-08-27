const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

const voiceSelectorUI = `
            {/* Voice Selection */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-slate-400" />
                Голос AI (ElevenLabs)
              </span>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <select
                  value={voiceId}
                  onChange={(e) => onVoiceIdChange(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-red-400/20 focus:border-red-400 transition-all cursor-pointer"
                >
                  <option value="XsDwVNgam5laFw4WF7S6">Pani Dumka (Дарина) - Основний</option>
                  <option value="21m00Tcm4TlvDq8ikWAM">Rachel (Рейчел)</option>
                  <option value="29vD33N1CtxCmqQRPOZB">Drew (Дрю)</option>
                  <option value="2EiwWnXFnvU5JabPnv8n">Clyde (Клайд)</option>
                  <option value="5Q0t7uMcjvnagumLfvZi">Paul (Пол)</option>
                  <option value="AZnzlk1XvdvUeBnXmlld">Domi (Домі)</option>
                  <option value="CYw3kZ02Hs0563khs1Fj">Dave (Дейв)</option>
                  <option value="EXAVITQu4vr4xnSDxMaL">Bella (Белла)</option>
                  <option value="ThT5KcBeYPX3keUQqHPh">Dorothy (Дороті)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-2">
                  Змінивши голос, вам може знадобитись перезапустити голосову сесію.
                </p>
              </div>
            </div>
`;

code = code.replace(
  /\{ \/\* Tempo Control \*\/\}\n/,
  ''
);

code = code.replace(
  /\{\/\* Model details \*\/\}/,
  voiceSelectorUI + '\n            {/* Model details */}'
);

fs.writeFileSync('src/components/SettingsModal.tsx', code);
console.log('patched SettingsModal');
