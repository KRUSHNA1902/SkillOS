"use client"

import ContributionSkyline from "@/components/ui/contribution-skyline"

export default function Demo() {
  // w-full is load-bearing: 21st centres every demo in a flex wrapper, and a
  // flex item left at width:auto shrinks to its contents.
  return (
    <div className="w-full min-h-screen bg-[#0d1117] px-4 py-10 sm:px-8 flex items-center justify-center">
      <div className="mx-auto w-full max-w-[980px]">
        <ContributionSkyline endDate="2017-11-08" palette="github" themeMode="dark" />
      </div>
    </div>
  )
}
