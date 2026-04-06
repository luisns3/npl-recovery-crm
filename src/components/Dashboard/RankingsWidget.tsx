export default function RankingsWidget() {
  // Placeholder data — committee review ranking is a future feature (Split 04)
  const cashRanking = [
    { name: 'A. Garcia', amount: 245000, rank: 1 },
    { name: 'L. Martinez', amount: 198000, rank: 2 },
    { name: 'Tu', amount: 142500, rank: 3, isMe: true },
    { name: 'C. Ruiz', amount: 120000, rank: 4 },
    { name: 'M. Lopez', amount: 95000, rank: 5 },
  ];

  const committeeRanking = [
    { name: 'L. Martinez', count: 18, rank: 1 },
    { name: 'Tu', count: 14, rank: 2, isMe: true },
    { name: 'A. Garcia', count: 12, rank: 3 },
    { name: 'C. Ruiz', count: 9, rank: 4 },
    { name: 'M. Lopez', count: 7, rank: 5 },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-6">
      {/* Cash Ranking */}
      <div>
        <h3 className="text-sm font-bold text-[#002446] mb-3">Ranking Cobros</h3>
        <div className="space-y-2">
          {cashRanking.map((r) => (
            <div
              key={r.rank}
              className={`flex items-center justify-between px-3 py-2 rounded-lg ${r.isMe ? 'bg-[#1a61a6]/10 border border-[#1a61a6]/20' : 'bg-slate-50'}`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-sm font-black w-5 text-center ${r.rank <= 3 ? 'text-[#002446]' : 'text-slate-400'}`}>
                  {r.rank}
                </span>
                <span className={`text-xs font-medium ${r.isMe ? 'font-bold text-[#1a61a6]' : 'text-slate-700'}`}>
                  {r.name}
                </span>
              </div>
              <span className={`text-xs font-bold ${r.isMe ? 'text-[#1a61a6]' : 'text-slate-600'}`}>
                {(r.amount / 1000).toFixed(0)}k EUR
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Committee Review Ranking */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-bold text-[#002446]">Ranking Comite</h3>
          <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">Proximamente</span>
        </div>
        <div className="space-y-2 opacity-60">
          {committeeRanking.map((r) => (
            <div
              key={r.rank}
              className={`flex items-center justify-between px-3 py-2 rounded-lg ${r.isMe ? 'bg-[#1a61a6]/10 border border-[#1a61a6]/20' : 'bg-slate-50'}`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-sm font-black w-5 text-center ${r.rank <= 3 ? 'text-[#002446]' : 'text-slate-400'}`}>
                  {r.rank}
                </span>
                <span className="text-xs font-medium text-slate-700">{r.name}</span>
              </div>
              <span className="text-xs font-bold text-slate-600">{r.count} revisadas</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
