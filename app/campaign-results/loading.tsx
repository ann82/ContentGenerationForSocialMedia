export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f0f7ff] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#262626] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-4 text-[#525252]">Loading campaign results...</p>
      </div>
    </div>
  )
}
