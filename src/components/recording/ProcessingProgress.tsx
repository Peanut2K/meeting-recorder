const STEPS = ['Uploading', 'Transcribing', 'Summarizing']

export function ProcessingProgress({ step }: { step: number }) {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <p className="text-gray-500 text-sm">Processing your meeting...</p>
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${i < step ? 'bg-black text-white' : i === step ? 'bg-black text-white animate-pulse' : 'bg-gray-200 text-gray-400'}`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-sm ${i === step ? 'text-black font-medium' : 'text-gray-400'}`}>{label}</span>
            {i < STEPS.length - 1 && <div className={`w-8 h-px ${i < step ? 'bg-black' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>
    </div>
  )
}
